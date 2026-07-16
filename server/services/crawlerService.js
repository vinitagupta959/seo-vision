const puppeteer = require('puppeteer');
const axios = require('axios');
const { AppError } = require('../utils/errors.js');

/**
 * Crawls a target URL using Puppeteer and retrieves raw content + metadata.
 * @param {string} url - Target URL to analyze
 */
exports.crawlUrl = async (url) => {
  let browser;
  try {
    const isHttps = url.startsWith('https://');
    let isSslValid = false;
    let securityHeaders = {
      hsts: false,
      xContentTypeOptions: false,
      xFrameOptions: false,
      csp: false,
      referrerPolicy: false
    };
    let compression = 'none';
    let cacheControl = 'none';
    let finalUrl = url;

    // 1. Perform Axios check for raw headers and redirection chains
    try {
      const axiosRes = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SEO-Vision-Audit/1.0'
        }
      });

      // If HTTPS, validation succeeded
      if (isHttps) isSslValid = true;

      // Extract security headers
      const headers = axiosRes.headers;
      securityHeaders = {
        hsts: !!headers['strict-transport-security'],
        xContentTypeOptions: !!headers['x-content-type-options'],
        xFrameOptions: !!headers['x-frame-options'],
        csp: !!headers['content-security-policy'],
        referrerPolicy: !!headers['referrer-policy']
      };

      // Extract compression
      const contentEncoding = headers['content-encoding'] || '';
      if (contentEncoding.includes('gzip')) compression = 'gzip';
      else if (contentEncoding.includes('br')) compression = 'brotli';
      else if (contentEncoding.includes('deflate')) compression = 'deflate';

      // Cache Control
      cacheControl = headers['cache-control'] || 'none';

      // Redirection destination
      if (axiosRes.request && axiosRes.request.res && axiosRes.request.res.responseUrl) {
        finalUrl = axiosRes.request.res.responseUrl;
      }
    } catch (axiosErr) {
      console.warn('Pre-crawl Axios check failed (likely self-signed SSL or network issue):', axiosErr.message);
      // We'll proceed with Puppeteer despite Axios header check failure
    }

    // 2. Launch Puppeteer to render JavaScript and collect browser timings
    const startTime = Date.now();

    browser = await puppeteer.launch({
      headless: true,
      pipe: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SEO-Vision-Audit/1.0');

    // Enable network cache
    await page.setCacheEnabled(true);

    const response = await page.goto(url, {
      waitUntil: 'networkidle2', // Wait until no more than 2 active network connections
      timeout: 30000
    });

    if (!response) {
      throw new AppError('Could not load URL. Response is empty.', 400);
    }

    const loadTimeMs = Date.now() - startTime;
    const pageHtml = await page.content();
    const pageUrl = page.url();

    // Extract performance timings inside browser context
    const performanceTiming = await page.evaluate(() => {
      try {
        const { navigationStart, domLoading, domInteractive, domContentLoadedEventEnd, loadEventEnd } = window.performance.timing;
        return {
          domLoading: domLoading - navigationStart,
          domInteractive: domInteractive - navigationStart,
          domContentLoaded: domContentLoadedEventEnd - navigationStart,
          loadTime: loadEventEnd - navigationStart
        };
      } catch (e) {
        return null;
      }
    });

    // Check Robots.txt and Sitemap.xml availability
    let hasRobots = false;
    let hasSitemap = false;
    try {
      const targetOrigin = new URL(pageUrl).origin;
      const robotsCheck = await axios.get(`${targetOrigin}/robots.txt`, { timeout: 3000 }).catch(() => null);
      if (robotsCheck && robotsCheck.status === 200) hasRobots = true;

      const sitemapCheck = await axios.get(`${targetOrigin}/sitemap.xml`, { timeout: 3000 }).catch(() => null);
      if (sitemapCheck && sitemapCheck.status === 200) hasSitemap = true;
    } catch (e) {
      console.warn('Error checking robots/sitemap:', e.message);
    }

    await browser.close();
    browser = null;

    return {
      html: pageHtml,
      url: pageUrl,
      httpsEnabled: isHttps,
      sslValid: isSslValid,
      securityHeaders,
      compression,
      cacheControl,
      loadTimeMs: (performanceTiming && performanceTiming.loadTime > 0) ? performanceTiming.loadTime : loadTimeMs,
      performanceTiming: performanceTiming || { domLoading: 0, domInteractive: 0, domContentLoaded: 0, loadTime: loadTimeMs },
      hasRobots,
      hasSitemap
    };

  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        // Suppress secondary close errors
      }
    }
    console.error('Crawler Service Error:', error);
    throw new AppError(`Failed to crawl and extract URL content: ${error.message}`, 400);
  }
};
