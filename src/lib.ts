import ts, {
  TypeAliasDeclaration,
  InterfaceDeclaration,
  ModuleDeclaration,
  isTypeAliasDeclaration,
  isModuleBlock,
} from 'typescript';
import fs from 'fs';
import path from 'path';
import debug from 'debug';
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

const PATH_PARAMETERS = 'PathParameters';
const NAMESPACE = 'namespace';

const isPathParameter = (v: ts.Node): boolean => {
  return v.getText() === PATH_PARAMETERS;
};

const isNamespace = (v: ts.Node): v is ModuleDeclaration => {
  if (ts.isModuleDeclaration(v) && v.getText().includes(NAMESPACE)) {
    return true;
  }
  return false;
};

const getPathParametersPath = (node: ts.Node): string | undefined => {
  let newPath: string[] = [];
  function _getPathParametersPathHelper(node: ts.Node, path: string[]) {
    node.forEachChild((v) => {
      if (isPathParameter(v)) {
        newPath = ['Path', ...path, PATH_PARAMETERS];
        return;
      } else if (isNamespace(v)) {
        const currentPath = v.name.getText();
        return _getPathParametersPathHelper(v, [...path, currentPath]);
      }
      return _getPathParametersPathHelper(v, [...path]);
    });
    return newPath.join('.'); // return an object literal does not work ...
  }
  return _getPathParametersPathHelper(node, []);
};

const isMethodNamespaceNode = (node: ts.Node): node is ModuleDeclaration => {
  const isMethod = methods.some(
    (m) => isNamespace(node) && node.name.getText() === m
  );
  return isMethod;
};

const appendNamespaceToParent = (
  node: ts.ModuleDeclaration
): string | undefined => {
  if (isNamespace(node.parent.parent)) {
    return `${node.parent.parent.name.getText()}${node.name.getText()}`;
  }
  return undefined;
};
/**
 *
 * @param node
 * @returns   Paths.V1Hello.Get.Responses.$200 | Paths.V1Hello.Get.Responses.$404,
 */
const getResponsesPathUnion = (node: ts.Node[]): string => {
  return '';
};

/**
 *
 * @param node
 * @returns  Paths.V1Hello.Get.QueryParameters
 */
const getQueryParametersPath = (node: ts.Node[]): string => {
  return '';
};

/**
 *
 * @param node
 * @returns  Paths.V1Hello.Get.QueryParameters
 */
const getRequestBodyPath = (node: ts.Node[]): string => {
  return '';
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
  return createRequestHandler(pathNameStr, getPathParametersPath(node));
};

/**
 *
 * @param context if namespace is Get or Post of Delete or Whatever, search parents recursivelt
 */
const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  let name: string | undefined = '';
  const visit: ts.Visitor = (node) => {
    node = ts.visitEachChild(node, visit, context);
    if (isMethodNamespaceNode(node)) {
      name = appendNamespaceToParent(node);
      console.log(name);
    }
    if (
      node.parent &&
      ts.isModuleDeclaration(node.parent) &&
      node.parent.name.getText() === 'Paths' &&
      isModuleBlock(node)
    ) {
      // console.log(node.getText());
      // const methodName = methodDeclaration.name.getText();
      // const httpMethod = createValidMethod(methodName);
      if (!name) return node;
      const t = getGenericTypesFromPathNode(name, node);
      console.log(t);
    }

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
