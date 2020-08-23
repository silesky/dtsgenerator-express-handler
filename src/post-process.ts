import { PluginContext } from 'dtsgenerator';
import ts from 'typescript';

async function postProcess(
    _pluginContext: PluginContext
): Promise<ts.TransformerFactory<ts.SourceFile> | undefined> {
    return (context: ts.TransformationContext) => (
        root: ts.SourceFile
    ): ts.SourceFile => {
        function visit(node: ts.Node): ts.Node {
            node = ts.visitEachChild(node, visit, context);
            console.log(node);
            if (ts.isStringLiteral(node)) {
                // `singleQuote` is internal property.
                // via: https://github.com/microsoft/TypeScript/blob/v3.9.2/src/compiler/types.ts#L1353
                ((node as unknown) as {
                    singleQuote: boolean;
                }).singleQuote = true;
            }

            return node;
        }
        return ts.visitNode(root, visit);
    };
}

export default postProcess
