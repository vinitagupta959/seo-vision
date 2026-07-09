const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Keep the cache directory inside the project root so it is copied to the runtime image
  cacheDirectory: join(__dirname, 'puppeteer-cache'),
};
