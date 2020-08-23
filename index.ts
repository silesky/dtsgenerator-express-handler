import { Plugin, PluginContext } from 'dtsgenerator';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json');

const singleQuote: Plugin = {
    meta: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
    },
    postProcess,
};

async function postProcess(
    _pluginContext: PluginContext
): Promise<ts.TransformerFactory<ts.SourceFile> | undefined> {
    return (context: ts.TransformationContext) => (
        root: ts.SourceFile
    ): ts.SourceFile => {
        function visit(node: ts.Node): ts.Node {
            node = ts.visitEachChild(node, visit, context);

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

export default singleQuote;
