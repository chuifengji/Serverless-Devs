/** @format */

import path from 'path';
import os from 'os';
import fs from 'fs';
import program from 'commander';
import yaml from 'js-yaml';
import { getCredential } from '@serverless-devs/core/lib';
import logger from '../../utils/logger';
import { emoji } from '../../utils/common';

const description = `You can get accounts.
 
  Example:
    $ s config get -l
    $ s config get -a demo`;

program
  .name('s config get')
  .usage('[options] [name]')
  .helpOption('-h, --help', 'Display help for command')
  .option('-a, --aliasName [name]', 'Key pair alia, if the alias is not set, use default instead')
  .option('-l, --list', 'Show user configuration list')
  .description(description)
  .addHelpCommand(false)
  .parse(process.argv);

function getSecretValue(n: number, str = ' ') {
  let temp_str = '';
  for (let i = 0; i < n; i++) {
    temp_str = temp_str + str;
  }
  return temp_str;
}

(async () => {

  let { aliasName, list } = program as any;
  aliasName = aliasName || process.env['serverless_devs_temp_access']
  if (!aliasName && !list) {
    program.help();
  }

  const accessFile = path.join(os.homedir(), '.s', 'access.yaml');
  const accessFileInfo = yaml.load(fs.readFileSync(accessFile, 'utf8') || '{}');
  const accessInfo = {};
  // eslint-disable-next-line guard-for-in
  for (const eveAccess in accessFileInfo) {
    const tempAccess = await getCredential(eveAccess);
    const tempAlias = tempAccess['Alias'];
    const tempSecretAccess = {};
    for (const eveValue in tempAccess) {
      if (eveValue !== 'Alias') {
        const valueLength: any = tempAccess[eveValue].length;
        tempSecretAccess[eveValue] =
          valueLength > 6
            ? tempAccess[eveValue].slice(0, 3) +
              getSecretValue(valueLength - 6, '*') +
              tempAccess[eveValue].slice(valueLength - 3, valueLength)
            : tempAccess[eveValue];
      }
    }
    accessInfo[tempAlias] = tempSecretAccess;
  }

  if (aliasName) {
    if (Object.keys(accessInfo).includes(aliasName)) {
      const accessData = {};
      accessData[aliasName] = accessInfo[typeof aliasName === 'boolean' ? 'default' : aliasName];
      logger.info(`\n\n` + yaml.dump(accessData));
      return accessData
    } else {
      logger.error(`\n\n  ${emoji('❌')} Message: Unable to get key information with alias ${aliasName}.
  ${emoji('🤔')} You have configured these keys: [${String(Object.keys(accessInfo))}].
  ${emoji('🧭')} You can use [s config add] for key configuration, or use [s config add -h] to view configuration help.
  ${emoji('😈')} If you have questions, please tell us: https://github.com/Serverless-Devs/Serverless-Devs/issues
`);
      process.exit(-1);
    }
  } else if (list) {
    if (Object.keys(accessInfo).length === 0) {
      logger.info(`\n\n  ${emoji('🤔')} You have not yet been found to have configured key information.
  ${emoji('🧭')} You can use [s config add] for key configuration, or use [s config add -h] to view configuration help.
  ${emoji('😈')} If you have questions, please tell us: https://github.com/Serverless-Devs/Serverless-Devs/issues
`);
    } else {
      logger.info(`\n\n` + yaml.dump(accessInfo));
      return accessInfo
    }
  }
})().catch(err => {
  if (err.message.includes('no such file or directory')) {
    logger.info(`\n\n  ${emoji('🤔')} You have not yet been found to have configured key information.
  ${emoji('🧭')} You can use [s config add] for key configuration, or use [s config add -h] to view configuration help.
  ${emoji('😈')} If you have questions, please tell us: https://github.com/Serverless-Devs/Serverless-Devs/issues
`);
  } else {
    logger.error(`\n\n  ${emoji('❌')} Message: ${err.message}.
  ${emoji('🧭')} You can :
      ${emoji('1️⃣')} Manually adjust the key file format to the standard yaml format, or delete the key file. File path: ~/.s/access.yaml
      ${emoji('2️⃣')} Use [s config add] for key configuration, or use [s config add -h] to view configuration help
  ${emoji('😈')} If you have questions, please tell us: https://github.com/Serverless-Devs/Serverless-Devs/issues
`);
    process.exit(-1);
  }
});
