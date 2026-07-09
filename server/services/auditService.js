const cheerio = require('cheerio');
const axios = require('axios');

/**
 * Perform comprehensive analysis of the parsed HTML and crawl metadata.
 * @param {string} html - Rendered page HTML
 * @param {string} pageUrl - Final page URL
 * @param {object} crawlData - Response metadata from crawler
 */
exports.auditHtml = async (html, pageUrl, crawlData) => {
  const $ = cheerio.load(html);
  const urlObj = new URL(pageUrl);
  const domain = urlObj.hostname;

  // 1. Basic SEO Elements
  const title = $('title').first().text().trim() || '';
  const metaDescription = $('meta[name="description"]').first().attr('content')?.trim() || '';
  const metaKeywords = $('meta[name="keywords"]').first().attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').first().attr('href')?.trim() || '';
  const robotsMeta = $('meta[name="robots"]').first().attr('content')?.trim() || '';
  const viewport = $('meta[name="viewport"]').first().attr('content')?.trim() || '';
  const language = $('html').attr('lang')?.trim() || '';
  const charset = $('meta[charset]').attr('charset')?.trim() || $('meta[http-equiv="content-type"]').attr('content')?.trim() || '';

  // 2. Heading Structure
  const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
  const headingList = [];
  
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = el.name; // h1, h2...
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) {
      headings[tag].push(text);
      headingList.push({ tag: tag.toUpperCase(), text });
    }
  });

  // 3. Image Analysis
  const images = [];
  let totalImages = 0;
  let missingAltCount = 0;

  $('img').each((_, el) => {
    totalImages++;
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt');
    const isMissingAlt = alt === undefined || alt.trim() === '';

    if (isMissingAlt) missingAltCount++;
    
    // Collect a list of sample images (up to 15)
    if (images.length < 15) {
      images.push({
        src: src.startsWith('http') ? src : new URL(src, pageUrl).href,
        alt: alt || '',
        missingAlt: isMissingAlt
      });
    }
  });

  // 4. Link Auditing (Internal, External & Broken sample checks)
  const links = [];
  let internalCount = 0;
  let externalCount = 0;
  const uniqueUrlsToCheck = new Set();

  $('a').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    let absoluteUrl = href;
    try {
      absoluteUrl = new URL(href, pageUrl).href;
    } catch (e) {
      return; // Skip invalid URLs
    }

    const isExternal = new URL(absoluteUrl).hostname !== domain;
    if (isExternal) {
      externalCount++;
    } else {
      internalCount++;
    }

    // Collect distinct links for broken check
    if (uniqueUrlsToCheck.size < 5 && absoluteUrl.startsWith('http')) {
      uniqueUrlsToCheck.add(absoluteUrl);
    }

    if (links.length < 30) {
      links.push({
        text: $(el).text().replace(/\s+/g, ' ').trim() || '[Empty Anchor]',
        href: absoluteUrl,
        isExternal
      });
    }
  });

  // Sample broken link tests
  const brokenLinks = [];
  for (const linkUrl of uniqueUrlsToCheck) {
    try {
      const checkRes = await axios.head(linkUrl, { timeout: 2000, validateStatus: () => true }).catch(() => null);
      // Fallback to GET if HEAD method is blocked
      let status = checkRes?.status;
      if (!checkRes || status === 405 || status === 403) {
        const getRes = await axios.get(linkUrl, { timeout: 2000, validateStatus: () => true }).catch(() => null);
        status = getRes?.status;
      }
      if (!status || status >= 400) {
        brokenLinks.push({ url: linkUrl, statusCode: status || 404 });
      }
    } catch (e) {
      brokenLinks.push({ url: linkUrl, statusCode: 500 });
    }
  }

  // 5. Structured Data
  let jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      jsonLd.push(data);
    } catch (e) {
      // Ignore malformed JSON-LD
    }
  });

  const openGraph = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property')?.substring(3);
    const content = $(el).attr('content');
    if (prop && content) openGraph[prop] = content;
  });

  const twitterCard = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name')?.substring(8);
    const content = $(el).attr('content');
    if (name && content) twitterCard[name] = content;
  });

  const hasMicrodata = $('[itemscope]').length > 0;

  // 6. Content Analysis (Word count, density, readability)
  // Extract visible body text (exclude scripts, style elements)
  const bodyClone = $('body').clone();
  bodyClone.find('script, style, noscript, svg, iframe, header, footer, nav').remove();
  const visibleText = bodyClone.text().replace(/\s+/g, ' ').trim();
  
  const words = visibleText.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
  const wordCount = words.length;

  // Keyword Density
  const stopwords = new Set(['the', 'and', 'a', 'of', 'to', 'is', 'in', 'that', 'for', 'you', 'it', 'on', 'with', 'this', 'be', 'are', 'as', 'at', 'by', 'an', 'or', 'from']);
  const keywordCounts = {};
  words.forEach(w => {
    if (!stopwords.has(w)) {
      keywordCounts[w] = (keywordCounts[w] || 0) + 1;
    }
  });

  const keywordDensity = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword, count]) => ({
      keyword,
      count,
      density: wordCount > 0 ? parseFloat(((count / wordCount) * 100).toFixed(2)) : 0
    }));

  // Readability Index (Flesch Reading Ease simulator: average sentence length & word complexity)
  const sentences = visibleText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = wordCount / sentenceCount;
  
  // Basic syllable estimation (vowel clusters)
  let syllableCount = 0;
  words.forEach(w => {
    const vowels = w.match(/[aeiouy]{1,2}/g);
    syllableCount += vowels ? vowels.length : 1;
  });

  const avgSyllablesPerWord = syllableCount / (wordCount || 1);
  // Flesch Reading Ease formula: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  const readabilityScore = Math.max(0, Math.min(100, parseFloat((206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)).toFixed(1))));

  let readabilityLabel = 'Difficult';
  if (readabilityScore > 80) readabilityLabel = 'Easy (Standard 5th Grade)';
  else if (readabilityScore > 60) readabilityLabel = 'Fair (Standard 8-9th Grade)';
  else if (readabilityScore > 30) readabilityLabel = 'Challenging (College Level)';

  // Paragraph lengths check
  const paragraphs = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 5) {
      paragraphs.push(text.split(/\s+/).length);
    }
  });
  const avgParagraphLength = paragraphs.length > 0 ? Math.round(paragraphs.reduce((a, b) => a + b, 0) / paragraphs.length) : 0;

  // 7. Performance audits
  const domSize = $('*').length;

  return {
    meta: {
      title,
      titleLength: title.length,
      metaDescription,
      descriptionLength: metaDescription.length,
      metaKeywords,
      canonical,
      robotsMeta,
      viewport,
      language,
      charset
    },
    headings: {
      structure: headingList,
      counts: {
        h1: headings.h1.length,
        h2: headings.h2.length,
        h3: headings.h3.length,
        h4: headings.h4.length,
        h5: headings.h5.length,
        h6: headings.h6.length
      }
    },
    images: {
      total: totalImages,
      missingAltCount,
      samples: images
    },
    links: {
      total: internalCount + externalCount,
      internal: internalCount,
      external: externalCount,
      brokenCount: brokenLinks.length,
      brokenSamples: brokenLinks,
      samples: links
    },
    structuredData: {
      jsonLd,
      openGraph,
      twitterCard,
      hasMicrodata
    },
    content: {
      wordCount,
      keywordDensity,
      readabilityScore,
      readabilityLabel,
      avgParagraphLength,
      visibleTextLength: visibleText.length
    },
    technical: {
      httpsEnabled: crawlData.httpsEnabled,
      sslValid: crawlData.sslValid,
      securityHeaders: crawlData.securityHeaders,
      compression: crawlData.compression,
      cacheControl: crawlData.cacheControl,
      hasRobots: crawlData.hasRobots,
      hasSitemap: crawlData.hasSitemap
    },
    performance: {
      domSize,
      loadTimeMs: crawlData.loadTimeMs,
      timing: crawlData.performanceTiming
    }
  };
};
