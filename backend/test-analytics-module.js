const http = require('http');
const app = require('./src/app');
const driverService = require('./src/services/driver.service');
const tripService = require('./src/services/trip.service');
const riskEventService = require('./src/services/riskEvent.service');

const PORT = 5003;

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

async function testAnalyticsModule() {
  console.log('=== RUNNING ANALYTICS AGGREGATION SUITE ===\n');

  const server = app.listen(PORT, async () => {
    try {
      // 1. Seed test drivers
      await driverService.createDriver({
        driverId: 'ANALYTICS_DRV_01',
        name: 'Sarah Connor',
        status: 'ACTIVE',
      });

      await driverService.createDriver({
        driverId: 'ANALYTICS_DRV_02',
        name: 'John Matrix',
        status: 'ACTIVE',
      });

      console.log('✅ Drivers Seeded: ANALYTICS_DRV_01, ANALYTICS_DRV_02');

      // 2. Seed test trips
      await tripService.startTrip({
        tripId: 'TRIP_ANALYTICS_01',
        driverId: 'ANALYTICS_DRV_01',
        startingLocation: { latitude: 37.7749, longitude: -122.4194 },
      });

      await tripService.startTrip({
        tripId: 'TRIP_ANALYTICS_02',
        driverId: 'ANALYTICS_DRV_02',
        startingLocation: { latitude: 34.0522, longitude: -118.2437 },
      });

      console.log('✅ Trips Started: TRIP_ANALYTICS_01, TRIP_ANALYTICS_02');

      // 3. Seed risk events
      await riskEventService.createRiskEvent({
        eventId: 'EVT_ANALYTICS_01',
        tripId: 'TRIP_ANALYTICS_01',
        driverId: 'ANALYTICS_DRV_01',
        type: 'DROWSINESS',
        severity: 'CRITICAL',
        pointsDeducted: 30,
        latitude: 37.7750,
        longitude: -122.4195,
      });

      await riskEventService.createRiskEvent({
        eventId: 'EVT_ANALYTICS_02',
        tripId: 'TRIP_ANALYTICS_01',
        driverId: 'ANALYTICS_DRV_01',
        type: 'PHONE_USE',
        severity: 'HIGH',
        pointsDeducted: 25,
        latitude: 37.7751,
        longitude: -122.4196,
      });

      await riskEventService.createRiskEvent({
        eventId: 'EVT_ANALYTICS_03',
        tripId: 'TRIP_ANALYTICS_02',
        driverId: 'ANALYTICS_DRV_02',
        type: 'YAWNING',
        severity: 'MEDIUM',
        pointsDeducted: 10,
        latitude: 34.0523,
        longitude: -118.2438,
      });

      console.log('✅ Risk Events Ingested');

      // 4. Test GET /api/analytics/overview
      const resOverview = await request('GET', '/api/analytics/overview');
      console.log('\n--- Analytics Overview Response ---');
      console.log('Summary:', resOverview.body.data.summary);
      console.log('Event Type Distribution:', resOverview.body.data.eventTypeDistribution);
      console.log('Severity Distribution:', resOverview.body.data.severityDistribution);
      console.log('High Risk Drivers Count:', resOverview.body.data.highRiskDrivers.length);
      console.log('Score Trends:', resOverview.body.data.scoreTrends);

      if (resOverview.statusCode !== 200 || !resOverview.body.success) {
        throw new Error('Analytics Overview API failed with non-200 status');
      }

      if (resOverview.body.data.summary.totalTrips < 2) {
        throw new Error('Analytics failed: expected at least 2 trips');
      }
      if (resOverview.body.data.summary.totalRiskEvents < 3) {
        throw new Error('Analytics failed: expected at least 3 risk events');
      }

      // 5. Test Filtered Endpoint GET /api/analytics/overview?driverId=ANALYTICS_DRV_01
      const resFiltered = await request('GET', '/api/analytics/overview?driverId=ANALYTICS_DRV_01');

      console.log('\n--- Filtered Driver Overview (ANALYTICS_DRV_01) ---');
      console.log('Summary:', resFiltered.body.data.summary);

      if (resFiltered.body.data.summary.totalTrips !== 1) {
        throw new Error(`Filter failed: expected 1 trip for ANALYTICS_DRV_01, got ${resFiltered.body.data.summary.totalTrips}`);
      }

      console.log('\n✅ ALL ANALYTICS VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
    } catch (err) {
      console.error('❌ Analytics Verification Test Error:', err);
    } finally {
      server.close(() => {
        console.log('Test server closed.');
        process.exit(0);
      });
    }
  });
}

testAnalyticsModule();
