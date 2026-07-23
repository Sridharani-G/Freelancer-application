const path = require('path');
const fs = require('fs');

const rootEnvPath = path.resolve(__dirname, '..', '.env');
const clientEnvPath = path.resolve(__dirname, '..', 'client', '.env');

const parseEnv = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.trim().startsWith('#'))
    .reduce((acc, line) => {
      const index = line.indexOf('=');
      if (index === -1) return acc;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
};

const rootEnv = parseEnv(rootEnvPath);
const clientEnv = parseEnv(clientEnvPath);

const mergedEnv = { ...rootEnv, ...clientEnv };

module.exports = mergedEnv;
