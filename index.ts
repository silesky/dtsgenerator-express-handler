import { Plugin } from 'dtsgenerator';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json')
import postProcess from "./src/post-process"

const expressHandler: Plugin = {
  meta: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
  },
  postProcess,
};

export default expressHandler
