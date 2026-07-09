const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Keep the cache directory inside node_modules so it is guaranteed to be copied to the runtime container
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};
