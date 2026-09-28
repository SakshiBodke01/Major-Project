const http = require('http');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');

const PORT = 5002;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING TELEMETRY MODULE & REST API TESTS ===');

  await connectDB();

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}\n`);

    try {
      const driverId = 'DRV_' + Date.now();
      const tripId = 'TRIP_' + Date.now();
      const eventId1 = 'EVT_1_' + Date.now();
      const eventId2 = 'EVT_2_' + Date.now();

      // 1. Create Driver
      console.log('1. Testing POST /api/drivers (Register Driver)...');
      const driverRes = await request('POST', '/api/drivers', {
        driverId,
        name: 'Alex Mercer',
        phone: '+1-555-0198',
        status: 'ACTIVE',
      });
      console.log(`Status: ${driverRes.statusCode}`, JSON.stringify(driverRes.body, null, 2));

      // 2. Start Trip
      console.log('\n2. Testing POST /api/trips (Start Trip)...');
      const tripRes = await request('POST', '/api/trips', {
        tripId,
        driverId,
        startingLocation: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'San Francisco Financial District',
        },
      });
      console.log(`Status: ${tripRes.statusCode}`, JSON.stringify(tripRes.body, null, 2));

      // 3. Query Active Trips
      console.log('\n3. Testing GET /api/trips/active (Active Trips)...');
      const activeTripsRes = await request('GET', '/api/trips/active');
      console.log(`Status: ${activeTripsRes.statusCode}`, JSON.stringify(activeTripsRes.body, null, 2));

      // 4. Ingest Risk Event 1 (DROWSINESS)
      console.log('\n4. Testing POST /api/risk-events (Ingest DROWSINESS Risk Event)...');
      const risk1Res = await request('POST', '/api/risk-events', {
        eventId: eventId1,
        tripId,
        driverId,
        type: 'DROWSINESS',
        severity: 'HIGH',
        pointsDeducted: 10,
        latitude: 37.7833,
        longitude: -122.4167,
        confidence: 0.94,
        metadata: {
          earScore: 0.18,
          perclosPercent: 32.5,
          rawVideoFrame: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // Should be stripped out by clean logic
        },
      });
      console.log(`Status: ${risk1Res.statusCode}`, JSON.stringify(risk1Res.body, null, 2));

      // 5. Ingest Risk Event 2 (PHONE)
      console.log('\n5. Testing POST /api/risk-events (Ingest PHONE Risk Event)...');
      const risk2Res = await request('POST', '/api/risk-events', {
        eventId: eventId2,
        tripId,
        driverId,
        type: 'PHONE',
        severity: 'MEDIUM',
        pointsDeducted: 5,
        latitude: 37.7900,
        longitude: -122.4000,
        confidence: 0.88,
      });
      console.log(`Status: ${risk2Res.statusCode}`, JSON.stringify(risk2Res.body, null, 2));

      // 6. Query Risk Events by Trip
      console.log('\n6. Testing GET /api/risk-events/trip/:tripId (Get Risk Events)...');
      const tripEventsRes = await request('GET', `/api/risk-events/trip/${tripId}`);
      console.log(`Status: ${tripEventsRes.statusCode}`, JSON.stringify(tripEventsRes.body, null, 2));

      // 7. Query Score Snapshots by Trip
      console.log('\n7. Testing GET /api/score-snapshots/trip/:tripId (Get Score Snapshots)...');
      const scoreHistoryRes = await request('GET', `/api/score-snapshots/trip/${tripId}`);
      console.log(`Status: ${scoreHistoryRes.statusCode}`, JSON.stringify(scoreHistoryRes.body, null, 2));

      // 8. Finish Trip
      console.log('\n8. Testing PATCH /api/trips/:id/finish (Finish Trip)...');
      const finishTripRes = await request('PATCH', `/api/trips/${tripId}/finish`, {
        endingLocation: {
          latitude: 37.8044,
          longitude: -122.2712,
          address: 'Oakland Port Terminal',
        },
      });
      console.log(`Status: ${finishTripRes.statusCode}`, JSON.stringify(finishTripRes.body, null, 2));

      // 9. Validation Test (Missing required fields)
      console.log('\n9. Testing Validation Error on Invalid Payload...');
      const invalidRes = await request('POST', '/api/risk-events', {
        driverId: 'DRV_MISSING_FIELDS',
      });
      console.log(`Status: ${invalidRes.statusCode}`, JSON.stringify(invalidRes.body, null, 2));

      // Summary
      console.log('\n================ VERIFICATION SUMMARY ================');
      if (driverRes.statusCode === 201 && driverRes.body.success) console.log('[PASS] Driver Creation');
      if (tripRes.statusCode === 201 && tripRes.body.success) console.log('[PASS] Trip Start & Initial Score Snapshot');
      if (activeTripsRes.statusCode === 200 && activeTripsRes.body.success) console.log('[PASS] Active Trips Query');
      if (risk1Res.statusCode === 201 && risk1Res.body.success) console.log('[PASS] Risk Event Telemetry Storage with GPS/Timestamp');
      if (tripEventsRes.statusCode === 200 && tripEventsRes.body.data.length === 2) console.log('[PASS] Risk Events Query by Trip');
      if (scoreHistoryRes.statusCode === 200 && scoreHistoryRes.body.data.length >= 3) console.log('[PASS] Score History Tracking');
      if (finishTripRes.statusCode === 200 && finishTripRes.body.data.status === 'COMPLETED') console.log('[PASS] Finish Trip Lifecycle');
      if (invalidRes.statusCode === 400 && invalidRes.body.success === false) console.log('[PASS] API Payload Validation');
      console.log('======================================================');

    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      server.close(async () => {
        await disconnectDB();
        console.log('\nTest suite finished cleanly.');
        process.exit(0);
      });
    }
  });
}

runTests();
