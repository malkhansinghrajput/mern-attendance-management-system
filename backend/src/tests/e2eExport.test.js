const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
require('dotenv').config();

const http = require('http');
const app = require('../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const assert = require('assert');

const runE2ETests = async () => {
  console.log('====================================================');
  console.log(' RUNNING END-TO-END HTTP EXPORT API INTEGRATION TEST');
  console.log('====================================================\n');

  // Connect to DB if needed
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_system_test';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    } catch {
      console.log('MongoDB not connected, skipping live DB HTTP test');
      return;
    }
  }

  // Find or create an admin user
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Test E2E Admin',
      email: 'e2e_admin@example.com',
      passwordHash: 'dummy',
      role: 'admin',
    });
  }

  // Sign JWT token
  const token = jwt.sign(
    { userId: admin._id, role: admin.role },
    process.env.JWT_SECRET || 'ams_super_secret_jwt_key_2026_production_grade',
    { expiresIn: '1h' }
  );

  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  console.log(`Test HTTP server started on port ${port}`);

  // Helper request function
  const makeRequest = (path) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const req = http.request(options, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      });

      req.on('error', reject);
      req.end();
    });
  };

  // 1. Test PDF Export Endpoint
  console.log('✔ Testing GET /api/reports/attendance/export/pdf');
  const pdfRes = await makeRequest('/api/reports/attendance/export/pdf?date=2026-09-28');
  assert.strictEqual(pdfRes.statusCode, 200, `Expected 200, got ${pdfRes.statusCode}`);
  assert.ok(pdfRes.headers['content-type'].includes('application/pdf'), 'Content-Type must be application/pdf');
  assert.ok(pdfRes.headers['content-disposition'].includes('AttendPro_Attendance_Report_'), 'Disposition must include filename');
  assert.ok(pdfRes.body.length > 500, `PDF body length should be > 500 bytes (got ${pdfRes.body.length})`);
  console.log(`  -> Status ${pdfRes.statusCode}, Content-Type: ${pdfRes.headers['content-type']}, Size: ${pdfRes.body.length} bytes`);

  // 2. Test Excel Export Endpoint
  console.log('✔ Testing GET /api/reports/attendance/export/excel');
  const excelRes = await makeRequest('/api/reports/attendance/export/excel?date=2026-09-28');
  assert.strictEqual(excelRes.statusCode, 200, `Expected 200, got ${excelRes.statusCode}`);
  assert.ok(
    excelRes.headers['content-type'].includes('spreadsheetml.sheet'),
    'Content-Type must be openxml spreadsheet'
  );
  assert.ok(excelRes.headers['content-disposition'].includes('AttendPro_Attendance_Report_'), 'Disposition must include filename');
  assert.ok(excelRes.body.length > 500, `Excel body length should be > 500 bytes (got ${excelRes.body.length})`);
  console.log(`  -> Status ${excelRes.statusCode}, Content-Type: ${excelRes.headers['content-type']}, Size: ${excelRes.body.length} bytes`);

  // 3. Test Unauthorized Access (no token)
  console.log('✔ Testing GET without token returns 401 Unauthorized');
  const unauthRes = await new Promise((resolve) => {
    http.get(`http://localhost:${port}/api/reports/attendance/export/pdf`, (res) => {
      resolve(res.statusCode);
    });
  });
  assert.strictEqual(unauthRes, 401);
  console.log(`  -> Correctly rejected with status ${unauthRes}`);

  server.close();
  await mongoose.disconnect();
  console.log('\n====================================================');
  console.log(' 🎉 ALL END-TO-END HTTP EXPORT INTEGRATION TESTS PASSED!');
  console.log('====================================================\n');
};

runE2ETests().catch((err) => {
  console.error('❌ E2E test failed:', err);
  process.exit(1);
});
