/**
 * Analyze audit results and generate category scores (0-100), overall score, and recommendations.
 * @param {object} auditData - The parsed data from auditService.js
 */
exports.calculateScoresAndRecommendations = (auditData) => {
  const recommendations = [];

  // ==========================================
  // 1. BASIC SEO SCORE (Weight: 100)
  // ==========================================
  let basicScore = 0;
  
  // Title checks
  if (auditData.meta.title) {
    basicScore += 35;
    if (auditData.meta.titleLength >= 40 && auditData.meta.titleLength <= 65) {
      basicScore += 15;
    } else {
      recommendations.push({
        id: 'title_length',
        title: 'Optimize Title Tag Length',
        description: `Your page title is ${auditData.meta.titleLength} characters. The ideal length is between 40 and 65 characters to avoid truncation in search results.`,
        priority: 'medium',
        category: 'Basic SEO',
        fix: 'Modify the <title> tag in the HTML head to be between 40-65 characters long.'
      });
    }
  } else {
    basicScore += 0;
    recommendations.push({
      id: 'missing_title',
      title: 'Missing Page Title Tag',
      description: 'Your page does not have a title tag. Page titles are critical for search engine rankings and user click-through rates.',
      priority: 'high',
      category: 'Basic SEO',
      fix: 'Add a <title>Your Page Title</title> element within the <head> section of your HTML.'
    });
  }

  // Description checks
  if (auditData.meta.metaDescription) {
    basicScore += 25;
    if (auditData.meta.descriptionLength >= 120 && auditData.meta.descriptionLength <= 160) {
      basicScore += 10;
    } else {
      recommendations.push({
        id: 'description_length',
        title: 'Optimize Meta Description Length',
        description: `Your meta description is ${auditData.meta.descriptionLength} characters. Ideal length is between 120 and 160 characters.`,
        priority: 'low',
        category: 'Basic SEO',
        fix: 'Adjust the meta description content in the head to be between 120-160 characters.'
      });
    }
  } else {
    recommendations.push({
      id: 'missing_description',
      title: 'Missing Meta Description',
      description: 'Meta descriptions describe the page contents to search engines and display as snippets in search results.',
      priority: 'high',
      category: 'Basic SEO',
      fix: 'Add <meta name="description" content="A brief summary of your webpage..."> to the HTML <head>.'
    });
  }

  // Viewport checks
  if (auditData.meta.viewport) {
    basicScore += 10;
  } else {
    recommendations.push({
      id: 'missing_viewport',
      title: 'Missing Mobile Viewport Tag',
      description: 'Without a viewport tag, mobile devices will render your page at desktop width, destroying mobile usability.',
      priority: 'high',
      category: 'Basic SEO',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> inside the HTML <head>.'
    });
  }

  // Language check
  if (auditData.meta.language) {
    basicScore += 5;
  } else {
    recommendations.push({
      id: 'missing_language',
      title: 'Missing Lang Attribute on HTML Tag',
      description: 'Specifying the language of your document helps screen readers and search engines categorize your page.',
      priority: 'low',
      category: 'Basic SEO',
      fix: 'Modify the opening HTML tag to specify a language, e.g., <html lang="en">.'
    });
  }

  // Charset check
  if (auditData.meta.charset) {
    basicScore += 5;
  } else {
    recommendations.push({
      id: 'missing_charset',
      title: 'Missing Charset Declaration',
      description: 'Declaring the character encoding prevents browsers from displaying distorted text characters.',
      priority: 'medium',
      category: 'Basic SEO',
      fix: 'Add <meta charset="UTF-8"> as the very first element inside your HTML <head>.'
    });
  }

  // ==========================================
  // 2. TECHNICAL SEO SCORE (Weight: 100)
  // ==========================================
  let technicalScore = 0;
  const tech = auditData.technical;

  if (tech.httpsEnabled) technicalScore += 25;
  else {
    recommendations.push({
      id: 'no_https',
      title: 'Page is not using HTTPS protocol',
      description: 'HTTPS is a vital security standard and a confirmed ranking factor for Google.',
      priority: 'high',
      category: 'Technical SEO',
      fix: 'Configure an SSL certificate (e.g., Let\'s Encrypt) and force redirect all HTTP traffic to HTTPS.'
    });
  }

  if (tech.sslValid) technicalScore += 15;
  else if (tech.httpsEnabled) {
    recommendations.push({
      id: 'invalid_ssl',
      title: 'Invalid SSL Certificate',
      description: 'Your connection is HTTPS but the SSL certificate is invalid, self-signed, or expired.',
      priority: 'high',
      category: 'Technical SEO',
      fix: 'Renew or purchase a valid SSL certificate for your domain.'
    });
  }

  if (tech.hasRobots) technicalScore += 15;
  else {
    recommendations.push({
      id: 'missing_robots',
      title: 'Missing robots.txt file',
      description: 'A robots.txt file directs search crawlers on which directories and files to crawl or avoid.',
      priority: 'medium',
      category: 'Technical SEO',
      fix: 'Create a robots.txt file at the root of your domain (e.g., domain.com/robots.txt) allowing crawling of public sections.'
    });
  }

  if (tech.hasSitemap) technicalScore += 15;
  else {
    recommendations.push({
      id: 'missing_sitemap',
      title: 'Missing sitemap.xml file',
      description: 'XML sitemaps list all important pages on your domain, making it easier for search engines to index them.',
      priority: 'medium',
      category: 'Technical SEO',
      fix: 'Generate an XML sitemap using tools and place it at the root of your domain (e.g., domain.com/sitemap.xml).'
    });
  }

  if (tech.compression !== 'none') technicalScore += 15;
  else {
    recommendations.push({
      id: 'no_compression',
      title: 'Enable Text Compression',
      description: 'Serving compressed assets (GZIP or Brotli) reduces file transfer size and accelerates page loads.',
      priority: 'high',
      category: 'Technical SEO',
      fix: 'Enable Gzip or Brotli compression on your web server configurations (Apache, Nginx, or Express backend).'
    });
  }

  // Security Headers calculations
  let securityHeadersCount = 0;
  const headers = tech.securityHeaders;
  if (headers.hsts) securityHeadersCount++;
  if (headers.csp) securityHeadersCount++;
  if (headers.xFrameOptions) securityHeadersCount++;
  if (headers.xContentTypeOptions) securityHeadersCount++;
  if (headers.referrerPolicy) securityHeadersCount++;

  technicalScore += (securityHeadersCount * 3); // Max 15 points
  
  if (securityHeadersCount < 5) {
    recommendations.push({
      id: 'missing_security_headers',
      title: 'Implement Security Headers',
      description: `Your server implements ${securityHeadersCount}/5 standard security headers. Missing headers expose your page to clickjacking and cross-site scripting (XSS).`,
      priority: 'medium',
      category: 'Technical SEO',
      fix: 'Configure missing security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) in server response filters.'
    });
  }

  // ==========================================
  // 3. PERFORMANCE SCORE (Weight: 100)
  // ==========================================
  let performanceScore = 0;
  const perf = auditData.performance;

  // Load Time
  if (perf.loadTimeMs < 1200) performanceScore += 50;
  else if (perf.loadTimeMs < 2500) {
    performanceScore += 35;
    recommendations.push({
      id: 'slow_load_time_mod',
      title: 'Improve Page Load Speed',
      description: `Your website loaded in ${(perf.loadTimeMs / 1000).toFixed(2)}s. Aim for under 1.5 seconds for optimal conversion rates.`,
      priority: 'medium',
      category: 'Performance',
      fix: 'Defer non-essential JS scripts, optimize image dimensions, and use server-side asset caching.'
    });
  } else {
    performanceScore += 10;
    recommendations.push({
      id: 'slow_load_time_high',
      title: 'Critical Page Load Speeds Detected',
      description: `Your website load time is ${(perf.loadTimeMs / 1000).toFixed(2)}s. This causes high bounce rates and rank penalties.`,
      priority: 'high',
      category: 'Performance',
      fix: 'Reduce TTFB, leverage browser caching, minify CSS/JS, and implement image lazy loading.'
    });
  }

  // DOM Size
  if (perf.domSize < 800) performanceScore += 30;
  else if (perf.domSize < 1500) {
    performanceScore += 15;
    recommendations.push({
      id: 'dom_size_mod',
      title: 'Reduce DOM Nodes count',
      description: `Your DOM has ${perf.domSize} nodes. Large DOM sizes increase memory usage, slow style computations, and cause layout shifts.`,
      priority: 'low',
      category: 'Performance',
      fix: 'Simplify complex HTML structures, remove nested divs, and paginate long lists.'
    });
  } else {
    performanceScore += 5;
    recommendations.push({
      id: 'dom_size_high',
      title: 'Extremely Large DOM Size',
      description: `Your DOM contains ${perf.domSize} nodes. A DOM size over 1500 elements heavily degrades rendering performance.`,
      priority: 'medium',
      category: 'Performance',
      fix: 'Refactor templates to remove useless elements and load dynamic content on scroll.'
    });
  }

  // Cache Control
  if (tech.cacheControl && tech.cacheControl !== 'none' && !tech.cacheControl.includes('no-cache')) {
    performanceScore += 20;
  } else {
    recommendations.push({
      id: 'no_cache_headers',
      title: 'Leverage Browser Caching',
      description: 'Static assets are not configured with long-term caching rules, causing return visitors to re-download files.',
      priority: 'medium',
      category: 'Performance',
      fix: 'Configure your web server to set Cache-Control headers with a long max-age (e.g. max-age=31536000) for static assets.'
    });
  }

  // ==========================================
  // 4. CONTENT SCORE (Weight: 100)
  // ==========================================
  let contentScore = 0;
  const content = auditData.content;
  const headCounts = auditData.headings.counts;

  // Word Count
  if (content.wordCount >= 600) contentScore += 40;
  else if (content.wordCount >= 250) {
    contentScore += 20;
    recommendations.push({
      id: 'low_word_count',
      title: 'Low Content Word Count',
      description: `Your page has ${content.wordCount} words. Pages with thin content rank poorly. Aim for at least 600 words of descriptive content.`,
      priority: 'medium',
      category: 'Content',
      fix: 'Expand page copy with informative paragraphs, FAQs, and thorough explanations relating to your target keywords.'
    });
  } else {
    contentScore += 5;
    recommendations.push({
      id: 'thin_content',
      title: 'Critical Thin Content Alert',
      description: `Your page only contains ${content.wordCount} words. This may be indexed as "Thin Content" by search algorithms.`,
      priority: 'high',
      category: 'Content',
      fix: 'Add comprehensive text copy describing your service or articles.'
    });
  }

  // Heading H1
  if (headCounts.h1 === 1) {
    contentScore += 30;
  } else if (headCounts.h1 > 1) {
    contentScore += 15;
    recommendations.push({
      id: 'multiple_h1',
      title: 'Multiple H1 Heading Tags',
      description: `You have ${headCounts.h1} H1 tags. Pages should have exactly one H1 tag representing the primary topic of the page.`,
      priority: 'medium',
      category: 'Content',
      fix: 'Reserve the H1 tag for the main title, and reclassify subheadings into H2 or H3 tags.'
    });
  } else {
    recommendations.push({
      id: 'missing_h1',
      title: 'Missing H1 Tag',
      description: 'Your page lacks an H1 tag. H1 headings specify the main topic of your page for engines and users.',
      priority: 'high',
      category: 'Content',
      fix: 'Wrap your page\'s main title in an <h1> tag.'
    });
  }

  // Readability
  if (content.readabilityScore > 50) contentScore += 30;
  else {
    contentScore += 15;
    recommendations.push({
      id: 'poor_readability',
      title: 'Simplify Text Copy Readability',
      description: `Your readability index is ${content.readabilityScore} (${content.readabilityLabel}). This might be hard to read for average visitors.`,
      priority: 'low',
      category: 'Content',
      fix: 'Break down long paragraphs, simplify complex words, and shorten lengthy sentences.'
    });
  }

  // ==========================================
  // 5. IMAGES SCORE (Weight: 100)
  // ==========================================
  let imagesScore = 100;
  const imgStats = auditData.images;

  if (imgStats.total > 0) {
    const withAltCount = imgStats.total - imgStats.missingAltCount;
    const altRatio = withAltCount / imgStats.total;
    imagesScore = Math.round(altRatio * 100);

    if (imgStats.missingAltCount > 0) {
      recommendations.push({
        id: 'missing_img_alts',
        title: 'Add Missing Image Alt Attributes',
        description: `${imgStats.missingAltCount} out of ${imgStats.total} images are missing alternative text (alt attributes). Alt tags are crucial for accessibility and image search SEO.`,
        priority: 'high',
        category: 'Images',
        fix: 'Add descriptive alt="..." tags to all image elements lacking them.'
      });
    }
  }

  // ==========================================
  // 6. LINKS SCORE (Weight: 100)
  // ==========================================
  let linksScore = 100;
  const linkStats = auditData.links;

  if (linkStats.total === 0) {
    linksScore = 80; // Small penalty for lack of links
    recommendations.push({
      id: 'no_links',
      title: 'Add Internal/External Links',
      description: 'Your website has zero links. Link structures distribute page authority and guide user navigation.',
      priority: 'medium',
      category: 'Links',
      fix: 'Add anchor tags pointing to relevant internal page locations or helpful external resources.'
    });
  } else {
    // Subtract 25 points per broken link down to 0
    linksScore = Math.max(0, 100 - (linkStats.brokenCount * 25));
    if (linkStats.brokenCount > 0) {
      recommendations.push({
        id: 'broken_links_found',
        title: 'Repair Broken Links',
        description: `We detected ${linkStats.brokenCount} broken link(s) on your page. Broken links harm search crawling and user trust.`,
        priority: 'high',
        category: 'Links',
        fix: 'Update or remove broken hyperlink URLs in your page structure.'
      });
    }
  }

  // ==========================================
  // 7. STRUCTURED DATA SCORE (Weight: 100)
  // ==========================================
  let structuredDataScore = 0;
  const sd = auditData.structuredData;

  if (sd.jsonLd.length > 0) structuredDataScore += 40;
  if (Object.keys(sd.openGraph).length > 0) structuredDataScore += 30;
  if (Object.keys(sd.twitterCard).length > 0) structuredDataScore += 20;
  if (sd.hasMicrodata) structuredDataScore += 10;

  if (structuredDataScore < 70) {
    recommendations.push({
      id: 'missing_schema',
      title: 'Implement Structured Schema Data',
      description: 'Structured data (JSON-LD) enables rich snippets in Google search, raising click-through rates.',
      priority: 'medium',
      category: 'Structured Data',
      fix: 'Add standard Schema.org JSON-LD scripts inside the HTML head or body to describe your page type (e.g. Article, Organization).'
    });
  }

  if (Object.keys(sd.openGraph).length === 0) {
    recommendations.push({
      id: 'missing_og_tags',
      title: 'Add Open Graph Meta Tags',
      description: 'Open Graph meta tags (og:title, og:image, og:description) control how page previews render when shared on social sites like Slack, Facebook, and LinkedIn.',
      priority: 'medium',
      category: 'Structured Data',
      fix: 'Include meta tags with property="og:title", property="og:image", and property="og:description" inside the head.'
    });
  }

  // ==========================================
  // OVERALL AGGREGATE SCORE
  // ==========================================
  const overallScore = Math.round(
    (basicScore + technicalScore + performanceScore + contentScore + imagesScore + linksScore + structuredDataScore) / 7
  );

  return {
    scores: {
      overallScore,
      basicSeo: basicScore,
      technicalSeo: technicalScore,
      performance: performanceScore,
      content: contentScore,
      images: imagesScore,
      links: linksScore,
      structuredData: structuredDataScore
    },
    recommendations
  };
};
