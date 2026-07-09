const dotenv = require('dotenv');
const { crawlUrl } = require('./crawlerService.js');
const { auditHtml } = require('./auditService.js');

dotenv.config();

const testUrl = 'https://example.com';

const runTest = async () => {
  console.log(`🚀 Starting Test Audit for URL: ${testUrl}...`);
  try {
    const startTime = Date.now();
    const crawlData = await crawlUrl(testUrl);
    console.log(`✓ Crawl succeeded in ${Date.now() - startTime}ms!`);
    console.log(`- HTTPS: ${crawlData.httpsEnabled ? 'Yes' : 'No'}`);
    console.log(`- SSL Valid: ${crawlData.sslValid ? 'Yes' : 'No'}`);
    console.log(`- Load Time: ${crawlData.loadTimeMs}ms`);

    console.log('🔍 Analyzing HTML contents...');
    const auditData = await auditHtml(crawlData.html, crawlData.url, crawlData);
    console.log('✓ Audit succeeded!');
    
    console.log('\n--- AUDIT SUMMARY ---');
    console.log(`Title: "${auditData.meta.title}" (${auditData.meta.titleLength} chars)`);
    console.log(`Meta Description: "${auditData.meta.metaDescription}" (${auditData.meta.descriptionLength} chars)`);
    console.log(`Language: "${auditData.meta.language}"`);
    console.log(`Word Count: ${auditData.content.wordCount}`);
    console.log('Heading Counts:', auditData.headings.counts);
    console.log(`Image Alt gaps: ${auditData.images.missingAltCount} missing alt / ${auditData.images.total} total`);
    console.log(`Links parsed: ${auditData.links.internal} internal, ${auditData.links.external} external`);
    console.log(`Open Graph keys:`, Object.keys(auditData.structuredData.openGraph));
    console.log(`Performance Load Time: ${auditData.performance.loadTimeMs}ms`);
    console.log(`DOM Nodes count: ${auditData.performance.domSize}`);
    console.log('--------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Audit Failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

runTest();
