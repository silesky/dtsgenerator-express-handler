import ts from 'typescript';
import fs from 'fs';
import path from 'path';
// import R from 'ramda';
// hardcode our input file

// create a program instance, which is a collection of source files
// in this case we only have one source file
const filePath = 'fixtures/todo-openapi.d.ts';
const program = ts.createProgram([filePath], {});

// pull off the typechecker instance from our program

program.getTypeChecker();

const source = program.getSourceFile(filePath);
if (!source) {
    throw Error('no source file.');
}
const printer = ts.createPrinter();

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
        node = ts.visitEachChild(node, visit, context);
        if (
            ts.isModuleDeclaration(node) &&
            node.name.getText().includes('Paths')
        ) {
            // all paths, create new type (e.g. v1HelloGet)
            ts.forEachChild(node, (v) => {
                if (ts.isModuleBlock(v)) {
                    // escapedName: 'Paths',
                    ts.forEachChild(v, (pathName) => {
                        if (ts.isModuleDeclaration(pathName)) {
                            // V1Hello, V1Todo, V1Todo$id, V2Hello
                            ts.forEachChild(pathName, (pathNameBlock) => {
                                if (ts.isModuleBlock(pathNameBlock)) {
                                    /**
                                   * { 
                                      export namespace Get { 
                                          export namespace Parameters { 
                                              export type Name = string; 
                                          } 
                                          export interface QueryParameters { 
                                              name: Parameters.Name; 
                                          } 
                                          export namespace Responses { 
                                              export type $200 = Components.Responses.GetHelloV1; 
                                          } 
                                      } 
                                  }
                                   */

                                    ts.forEachChild(
                                        pathNameBlock,
                                        (methodDeclaration) => {
                                            const pathNameStr = pathName.name.getText();
                                            if (
                                                ts.isModuleDeclaration(
                                                    methodDeclaration
                                                )
                                            ) {
                                                console.log(methodDeclaration);
                                                const typeName = `${pathNameStr}${methodDeclaration.name.getText()}`;

                                                console.log(typeName);
                                                // console.log(name);
                                            }
                                        }
                                    );
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
const outputDir = path.resolve(__dirname, '../generated');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Write pretty printed transformed typescript to output directory
fs.writeFileSync(
    path.resolve(__dirname, '../generated/models.ts'),
    printer.printFile(result.transformed[0])
);
