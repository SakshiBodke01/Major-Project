const http = require('http');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const config = require('./src/config/env');

const PORT = 5001; // Separate port for automated verification

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runVerification() {
  console.log('=== STARTING MODULE 1 BACKEND VERIFICATION ===');

  // Connect DB
  await connectDB();

  // Start Server
  const server = app.listen(PORT, async () => {
    console.log(`Verification HTTP server listening on port ${PORT}`);

    try {
      // 1. Test /api/health
      console.log('\nTesting /api/health...');
      const healthRes = await makeRequest('/api/health');
      console.log(`Status Code: ${healthRes.statusCode}`);
      console.log('Response Body:', JSON.stringify(healthRes.body, null, 2));

      // 2. Test /api/version
      console.log('\nTesting /api/version...');
      const versionRes = await makeRequest('/api/version');
      console.log(`Status Code: ${versionRes.statusCode}`);
      console.log('Response Body:', JSON.stringify(versionRes.body, null, 2));

      // 3. Test 404 Error handling
      console.log('\nTesting 404 Error handling (/api/non-existent)...');
      const errorRes = await makeRequest('/api/non-existent');
      console.log(`Status Code: ${errorRes.statusCode}`);
      console.log('Response Body:', JSON.stringify(errorRes.body, null, 2));

      // Assertions
      if (healthRes.statusCode === 200 && healthRes.body.success === true) {
        console.log('\n[PASS] /api/health responded successfully!');
      } else {
        console.log('\n[FAIL] /api/health check failed');
      }

      if (versionRes.statusCode === 200 && versionRes.body.success === true) {
        console.log('[PASS] /api/version responded successfully!');
      } else {
        console.log('[FAIL] /api/version check failed');
      }

      if (errorRes.statusCode === 404 && errorRes.body.success === false && errorRes.body.timestamp) {
        console.log('[PASS] Error envelope format verified!');
      } else {
        console.log('[FAIL] Error envelope verification failed');
      }

    } catch (err) {
      console.error('Verification encountered an error:', err.message);
    } finally {
      server.close(async () => {
        await disconnectDB();
        console.log('\n=== VERIFICATION COMPLETE - CLEANLY SHUT DOWN ===');
        process.exit(0);
      });
    }
  });
}

runVerification();
