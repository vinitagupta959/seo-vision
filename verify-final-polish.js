const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');

dotenv.config();

const app = require('./server/app.js');
const User = require('./server/models/User.js');
const Analysis = require('./server/models/Analysis.js');
const Report = require('./server/models/Report.js');

const TEST_PORT = 5018;

const runVerification = async () => {
  console.log('=== STARTING FINAL POLISH E2E VERIFICATION ===\n');

  // 1. Database Connection
  console.log('1. Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connection: Connected successfully.\n');

  // 2. Boot Server
  console.log('2. Booting Backend Server...');
  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(TEST_PORT, resolve);
  });
  console.log(`✓ Server Boot: Listening on port ${TEST_PORT}.\n`);

  const axiosClient = axios.create({
    baseURL: `http://localhost:${TEST_PORT}`,
    validateStatus: () => true
  });

  // 3. Test Registration
  console.log('3. Testing Authentication & User Creation...');
  const testEmail = 'final_polish@seovision.com';
  await User.deleteMany({ email: testEmail });

  const registerRes = await axiosClient.post('/api/auth/register', {
    name: 'Final Polish',
    email: testEmail,
    password: 'password123'
  });
  if (registerRes.status !== 201) {
    throw new Error(`FAIL: Registration failed with status ${registerRes.status}`);
  }
  const token = registerRes.data.token;
  const authHeaders = { 'Authorization': `Bearer ${token}` };
  console.log('✓ Authentication: Registered successfully.\n');

  // 4. Test Live Crawling & Scoring
  console.log('4. Testing Crawler and Scoring Engine...');
  console.log('  - Initiating crawl of https://example.com...');
  const analyzeRes = await axiosClient.post('/api/analyze', {
    url: 'https://example.com'
  }, { headers: authHeaders });

  if (analyzeRes.status !== 201) {
    throw new Error(`FAIL: Analysis failed with status ${analyzeRes.status}`);
  }

  const analysisId = analyzeRes.data.data.analysis._id;
  const reportId = analyzeRes.data.data.analysis.reportId;
  console.log(`  ✓ Crawl completed. Analysis ID: ${analysisId}, Report ID: ${reportId}`);

  // 5. Test PDF Exporter
  console.log('\n5. Testing PDF Generation...');
  const pdfRes = await axiosClient.get(`/api/report/download/${analysisId}`, {
    headers: authHeaders,
    responseType: 'arraybuffer'
  });

  if (pdfRes.status !== 200) {
    throw new Error(`FAIL: PDF download failed with status ${pdfRes.status}`);
  }

  const pdfBuffer = Buffer.from(pdfRes.data);
  const pdfHeader = pdfBuffer.subarray(0, 5).toString();
  if (pdfHeader !== '%PDF-') {
    throw new Error(`FAIL: Invalid PDF header signature: ${pdfHeader}`);
  }
  console.log(`  ✓ PDF compiled successfully. Signature: ${pdfHeader} (${pdfBuffer.length} bytes)`);

  // 6. Cleanup
  console.log('\n6. Cleaning up test database records...');
  await Analysis.deleteMany({ userId: registerRes.data.data.user._id });
  await Report.deleteMany({ analysisId: analysisId });
  await User.deleteOne({ _id: registerRes.data.data.user._id });
  console.log('✓ Database cleaned up successfully.\n');

  // Stop Server & DB
  server.close();
  await mongoose.connection.close();
  
  console.log('========================================================');
  console.log('🎉 FINAL POLISH E2E VERIFICATION PASSED SUCCESSFULLY! 🎉');
  console.log('========================================================');
};

runVerification().catch(async (err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});
