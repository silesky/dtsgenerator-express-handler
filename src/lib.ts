import ts, {
  TypeAliasDeclaration,
  InterfaceDeclaration,
  ModuleDeclaration,
  TypeParameterDeclaration,
  isModuleDeclaration,
  isModuleBlock,
  createTypeLiteralNode,
  isTypeAliasDeclaration,
} from 'typescript';
import fs from 'fs';
import path from 'path';
import debug from 'debug';
import { insert } from 'ramda';
const logLib = debug('lib');
// import R from 'ramda';
// hardcode our input file

// create a program instance, which is a collection of source files
// in this case we only have one source file
const filePath = 'fixtures/todo-openapi-simple.d.ts';
const program = ts.createProgram([filePath], {});

// pull off the typechecker instance from our program

const methods = ['Get', 'Post', 'Put', 'Patch', 'Delete'] as const;
type Method = typeof methods[number];

function assertHTTPMethod(val: string): asserts val is Method {
  if (!methods.includes(val as Method)) {
    throw Error('invalid http method');
  }
}

const createValidMethod = (val: string): Method => {
  assertHTTPMethod(val);
  return val;
};

const source = program.getSourceFile(filePath);
const checker = program.getTypeChecker();
if (!source) {
  throw Error('no source file.');
}
const printer = ts.createPrinter();
const getNodeKind = (node: ts.Node) => {
  return ts.SyntaxKind[node['kind']];
};

type Declaration =
  | TypeAliasDeclaration
  | InterfaceDeclaration
  | ModuleDeclaration;
const isDeclaration = (node: ts.Node): node is Declaration => {
  return (
    ts.isNamespaceExportDeclaration(node) ||
    ts.isNamespaceExport(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isModuleDeclaration(node)
  );
};

const getChildDeclarations = (
  node: ts.Node,
  declarations: Declaration[] = []
): Declaration[] => {
  if (!node.getChildCount()) return declarations;
  ts.forEachChild(node, (v) => {
    if (isDeclaration(v)) {
      declarations.push(v);
    }
    getChildDeclarations(v, declarations);
  });
  return declarations;
};

type Item = { node: ts.Node; path: string[] };
// nodeKind: 'InterfaceDeclaration',
// text: 'export interface PathParameters {\n        id: Parameters.Id;\n      }' },
const isPathParameter = (v: ts.Node): boolean => {
  if (ts.isInterfaceDeclaration(v) && v.getText().includes('Path')) {
    return true;
  }
  return false;
};

const isNamespace = (v: ts.Node): v is ModuleDeclaration => {
  if (ts.isModuleDeclaration(v) && v.getText().includes('namespace')) {
    return true;
  }
  return false;
};

// ar deepFind = (obj, type) => {
//     let v
//     function deepFindHelper(obj, type, value) {
//       if (v) return v
//       const keys = Object.keys(obj);
//       keys.forEach((k) => {
//         if (!v && typeof obj[k] === type) {
//           v = obj[k]
//           return
//         }
//         return deepFindHelper(obj[k], type);
//       });
//       return v
//     }
//     return deepFindHelper(obj, type)
// };

const getPathParametersPath = (
  node: ts.Node,
  path: string[] = []
): string | undefined => {
  let newPath: string[] = [];
  function _getPathParametersPathHelper(node: ts.Node, path: string[]) {
    node.forEachChild((v) => {
      if (isPathParameter(v)) {
        newPath = [...path, 'PathParameters'];
        return;
      } else if (isNamespace(v)) {
        const currentPath = v.name.getText();
        return _getPathParametersPathHelper(v, [...path, currentPath]);
      }
      return _getPathParametersPathHelper(v, [...path]);
    });
    return newPath.join('.'); // return an object literal does not work ...
  }
  return _getPathParametersPathHelper(node, path);
};

// const  createGeneric = (name: string, type: ts.TypeNode, sourceFile: ts.SourceFile) {
//     const printer = ts.createPrinter()
//     const typeString = printer.printNode(ts.EmitHint.Unspecified, type, sourceFile);
//    const type =
//    `RequestHandler<Paths.V1Todo$Id.Get.PathParameters, Paths.V1Hello.Get.Responses.$200,
//     unknown,
//   { name: boolean }
// > =
// `
//     const newSource = ts.createSourceFile('temp.ts', `type ${name} = ${typeString}`, sourceFile.languageVersion);
//     return newSource.statements[0];
// }

const print = (node: ts.Node) => {
  return console.log(printer.printNode(ts.EmitHint.Unspecified, node));
};
export function buildTypeAliasNode(
  identifier: string,
  typeParameterNames: string[],
  body: ts.TypeNode
): ts.TypeAliasDeclaration {
  return ts.createTypeAliasDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    identifier,
    typeParameterNames.map((v) => ts.createTypeParameterDeclaration(v)),
    body
  );
}

const logChildren = (nodes: ts.Node[]) => {
  const result = nodes.map((c: any, idx) => ({
    idx,
    nodeKind: getNodeKind(c),
    text: c.getText(),
  }));
  /**
   *  [ { idx: 0, nodeKind: 'SyntaxList', text: 'export' },
  { idx: 1, nodeKind: 'NamespaceKeyword', text: 'namespace' },
  { idx: 2, nodeKind: 'Identifier', text: 'V1Todo$Id' },
  { idx: 3,
    nodeKind: 'ModuleBlock',
    text: '{\n
        export namespace Get {\n
            export namespace Parameters {\n
                export type Id = number;\n      }\n      export interface PathParameters {\n        id: Parameters.Id;\n      }\n      export namespace Responses {\n        export type $200 = Components.Responses.GetTodo;\n        export type $400 = Components.Responses.OpenApiValidationError;\n        export type $404 = Components.Responses.GenericError;\n      }\n    }\n  }' } ]
   */
  console.log(result);
};

// function buildTypeDeclarationStatement(name: string, type: ts.TypeNode, sourceFile: ts.SourceFile) {
//     const printer = ts.createPrinter()
//     const typeString = printer.printNode(ts.EmitHint.Unspecified, type, sourceFile);
//     const newSource = ts.createSourceFile('temp.ts', `type ${name} = RequestHandler<${typeString}`, sourceFile.languageVersion);
//     return newSource.statements[0];
// }
// const getTypeNode = () => {
//     ts.createSourceFile('tmp.ts', `let a:${type}`).statements[0].declarationList.declarations[0].type;

// }

const getTypeProperties = (node: ts.Node) => {
  if (!isTypeAliasDeclaration(node)) return [];
  const symbol = checker.getSymbolAtLocation(node.name);
  if (!symbol) return [];
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  const properties = checker.getPropertiesOfType(type);
  return properties;
};
const createRequestHandler = (
  name: string,
  params = 'any',
  responseBody = 'any',
  requestBody = 'any',
  queryParams = 'any'
) => {
  return `export type ${name} = RequestHandler<${params}, ${responseBody}, ${requestBody}, ${queryParams}>`;
};
const getGenericTypesFromPathNode = (pathNameStr: string, node: ts.Node) => {
  const declarations = getChildDeclarations(node);
  logChildren(declarations);
};

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const visit: ts.Visitor = (node) => {
    node = ts.visitEachChild(node, visit, context);
    if (ts.isModuleDeclaration(node) && node.name.getText().includes('Paths')) {
      // all paths, create new type (e.g. v1HelloGet)
      ts.forEachChild(node, (v) => {
        if (ts.isModuleBlock(v)) {
          // escapedName: 'Paths',
          ts.forEachChild(v, (pathName) => {
            if (ts.isModuleDeclaration(pathName)) {
              // V1Hello, V1Todo, V1Todo$id, V2Hello
              ts.forEachChild(pathName, (pathNameBlock) => {
                if (ts.isModuleBlock(pathNameBlock)) {
                  ts.forEachChild(pathNameBlock, (methodDeclaration) => {
                    const pathNameStr = pathName.name.getText();
                    if (ts.isModuleDeclaration(methodDeclaration)) {
                      const methodName = methodDeclaration.name.getText();
                      const httpMethod = createValidMethod(methodName);
                      const result = getPathParametersPath(node);
                      console.log(result);
                      const typeName = `${pathNameStr}${httpMethod}`;
                      //   const t = getGenericTypesFromPathNode(pathNameStr, node);
                      //   print(t)
                    }
                  });
                }
              });
              //  escapedName: 'V1Hello',
              // console.log(a)dd;
            }
            // if (ts.isNamespaceExport(a)) {
            //     console.log(v);
            //     const symbol = checker.getSymbolAtLocation(v);
            //     if (!symbol) return;
            //     console.log(symbol);
            // }
          });
        }
        // console.log(v.getChildren());
      });
    }
    // if (ts.isTypeReferenceNode(node)) {
    //     const symbol = checker.getSymbolAtLocation(node.typeName);
    //     if (!symbol) return;
    //     const type = checker.getDeclaredTypeOfSymbol(symbol);
    //     const declarations = R.chain((property) => {
    //         return R.map(visit, property.declarations);
    //     }, checker.getPropertiesOfType(type));
    //     if (declarations.length) {
    //         console.log(declarations);
    //     }
    //     // return ts.createTypeLiteralNode(
    //     //     declarations.filter(ts.isTypeElement)
    //     // );
    // }

    /*
      Convert type alias to interface declaration
        interface IUser {
          username: string
        }
        type User = IUser

      We want to remove all type aliases
        interface IUser {
          username: string
        }
        interface User {
          username: string  <-- Also need to resolve IUser
        }

    */
    return node;
  };

  return (node) => ts.visitNode(node, visit);
};

// Run source file through our transformer
const result = ts.transform(source, [transformer]);
// console.log(result);
// Create our output folder
// const outputDir = path.resolve(__dirname, '../generated');
// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir);
// }

// // Write pretty printed transformed typescript to output directory
// fs.writeFileSync(
//   path.resolve(__dirname, '../generated/models.ts'),
//   printer.printFile(result.transformed[0])
// );
