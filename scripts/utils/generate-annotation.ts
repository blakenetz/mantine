import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { getPath } from './get-path';
import { createLogger } from './signale';

const { argv } = yargs(hideBin(process.argv)) as any;
const logger = createLogger('build-package');

export function camelToKebabCase(value: string) {
  return (
    value.substring(0, 1).toLowerCase() +
    value.substring(1).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  );
}

(async () => {
  const [componentName] = argv._;

  if (!componentName) {
    logger.error('No component specified');
    process.exit(1);
  }

  const componentPath = path.join(
    getPath('packages'),
    // Only support core components right now
    '@mantine/core/src/components',
    componentName,
    `${componentName}.tsx`
  );

  const exists = await fs.pathExists(componentPath);
  if (!exists) {
    logger.error(`${componentPath} does not exist`);
    process.exit(1);
  }

  const url = `https://mantine.dev/core/${camelToKebabCase(componentName)}`;
  const annotation = `/**
* [Documentation](${url})
*
* [Props](${url}?t=props)
*
* [Styles API](${url}?t=styles-api)
*/`;

  const fileContent = fs.readFileSync(componentPath, 'utf-8');
  const lines = fileContent.split(os.EOL);

  const re = new RegExp(`export const ${componentName}|export function ${componentName}`);
  const insertIndex = lines.findIndex((v) => v.match(re));

  lines.splice(insertIndex, 0, annotation);

  fs.writeFileSync(componentPath, lines.join(os.EOL));

  logger.success(`Successfully added annotations to ${componentName}`);
})();
