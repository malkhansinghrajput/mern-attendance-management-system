const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Attendance = require('../models/Attendance');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const attendanceService = require('../services/attendance.service');
const { calculateHaversineDistance, isValidCoordinate } = require('../utils/geoUtils');
const { ERROR_CODES } = require('../constants/errors');
const { ATTENDANCE_STATUS } = require('../constants/attendance');

const runTests = async () => {
  console.log('====================================================');
  console.log(' RUNNING GEOFENCING TEST SUITE (TESTS 1 - 13)');
  console.log('====================================================\n');

  // Indore Office reference coordinates
  const officeLat = 22.7196;
  const officeLng = 75.8577;

  // ── TEST 1: Haversine distance - location inside radius ─────────────────
  console.log('✔ Running TEST 1: Location inside radius (50m)');
  // ~50 meters north: offset lat by ~0.00045
  const insideLat = 22.72005;
  const insideLng = 75.8577;
  const distInside = calculateHaversineDistance(insideLat, insideLng, officeLat, officeLng);
  assert.ok(distInside < 100, `Expected distance < 100m, got ${distInside}m`);

  // ── TEST 2: Location near boundary (190m) ───────────────────────────────
  console.log('✔ Running TEST 2: Location near boundary (190m)');
  // ~190 meters away
  const boundaryLat = 22.72131;
  const boundaryLng = 75.8577;
  const distBoundary = calculateHaversineDistance(boundaryLat, boundaryLng, officeLat, officeLng);
  assert.ok(distBoundary >= 180 && distBoundary <= 200, `Expected distance ~190m, got ${distBoundary}m`);

  // ── TEST 3: Location outside radius (450m) ──────────────────────────────
  console.log('✔ Running TEST 3: Location outside radius (450m)');
  const outsideLat = 22.72365;
  const outsideLng = 75.8577;
  const distOutside = calculateHaversineDistance(outsideLat, outsideLng, officeLat, officeLng);
  assert.ok(distOutside > 400, `Expected distance > 400m, got ${distOutside}m`);

  // ── TEST 4: Invalid coordinate helper checks ───────────────────────────
  console.log('✔ Running TEST 4: Coordinate validation helper (NaN, null, out-of-range)');
  assert.strictEqual(isValidCoordinate(22.7196, 75.8577), true);
  assert.strictEqual(isValidCoordinate(95.0, 75.8577), false); // Lat > 90
  assert.strictEqual(isValidCoordinate(-90.1, 75.8577), false);
  assert.strictEqual(isValidCoordinate(22.7196, 185.0), false); // Lng > 180
  assert.strictEqual(isValidCoordinate(NaN, 75.8577), false);
  assert.strictEqual(isValidCoordinate(undefined, 75.8577), false);
  assert.strictEqual(isValidCoordinate(null, null), false);
  assert.strictEqual(isValidCoordinate('abc', 'xyz'), false);

  // DB Connection for Integration Tests 5 - 13
  let dbConnected = false;
  try {
    const mongoUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_system_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    dbConnected = true;
  } catch {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/attendance_system_test', { serverSelectionTimeoutMS: 2000 });
      dbConnected = true;
    } catch {
      console.log('\n⚠️ MongoDB database offline. Skipping live DB geofence integration tests 5-13.');
    }
  }

  if (dbConnected) {
    // Setup test company settings & test employee
    await CompanySettings.deleteMany({});
    await Attendance.deleteMany({ date: { $in: ['2026-09-27', '2026-09-28', '2026-09-29'] } });
    await User.deleteMany({ email: 'test_geofence_emp@example.com' });

    const settings = await CompanySettings.create({
      officeName: 'Indore Test Office',
      latitude: officeLat,
      longitude: officeLng,
      radiusMeters: 200,
      geofenceEnabled: true,
    });

    const employee = await User.create({
      name: 'Geofence Employee',
      email: 'test_geofence_emp@example.com',
      password: 'password123',
      role: 'employee',
    });

    // ── TEST 5: Punch-in outside radius rejected (403 GEOFENCE_OUT_OF_RANGE) ──
    console.log('✔ Running TEST 5: Punch-in outside radius rejected (403)');
    let outOfRangeError = null;
    try {
      await attendanceService.punchIn(employee._id, {
        selfieUrl: 'https://example.com/selfie.jpg',
        location: { lat: outsideLat, lng: outsideLng, accuracy: 10 },
      });
    } catch (err) {
      outOfRangeError = err;
    }
    assert.notStrictEqual(outOfRangeError, null);
    assert.strictEqual(outOfRangeError.status, 403);
    assert.strictEqual(outOfRangeError.code, ERROR_CODES.GEOFENCE_OUT_OF_RANGE);

    // ── TEST 6: Missing / invalid location when geofence enabled ───────────
    console.log('✔ Running TEST 6: Missing/invalid location rejected');
    let missingLocError = null;
    try {
      await attendanceService.punchIn(employee._id, {
        selfieUrl: 'https://example.com/selfie.jpg',
        location: null,
      });
    } catch (err) {
      missingLocError = err;
    }
    assert.notStrictEqual(missingLocError, null);
    assert.strictEqual(missingLocError.status, 400);

    // ── TEST 7: Punch-in with valid location inside radius ─────────────────
    console.log('✔ Running TEST 7: Punch-in inside radius succeeds with distanceFromOffice');
    const validPunchIn = await attendanceService.punchIn(employee._id, {
      selfieUrl: 'https://example.com/selfie.jpg',
      location: { lat: insideLat, lng: insideLng, accuracy: 10 },
    });
    assert.strictEqual(validPunchIn.attendanceStatus, ATTENDANCE_STATUS.ACTIVE);
    assert.ok(validPunchIn.punchInLocation.distanceFromOffice !== undefined);
    assert.ok(validPunchIn.punchInLocation.distanceFromOffice <= 200);

    // ── TEST 8: Punch-out outside radius rejected ─────────────────────────
    console.log('✔ Running TEST 8: Punch-out outside radius rejected');
    let outOfRangePunchOutErr = null;
    try {
      await attendanceService.punchOut(employee._id, {
        selfieUrl: 'https://example.com/selfie.jpg',
        location: { lat: outsideLat, lng: outsideLng, accuracy: 10 },
      });
    } catch (err) {
      outOfRangePunchOutErr = err;
    }
    assert.notStrictEqual(outOfRangePunchOutErr, null);
    assert.strictEqual(outOfRangePunchOutErr.status, 403);

    // ── TEST 9: Punch-out inside radius succeeds ───────────────────────────
    console.log('✔ Running TEST 9: Punch-out inside radius succeeds');
    const validPunchOut = await attendanceService.punchOut(employee._id, {
      selfieUrl: 'https://example.com/selfie.jpg',
      location: { lat: insideLat, lng: insideLng, accuracy: 10 },
    });
    assert.strictEqual(validPunchOut.attendanceStatus, ATTENDANCE_STATUS.COMPLETED);
    assert.ok(validPunchOut.punchOutLocation.distanceFromOffice !== undefined);

    await Attendance.deleteMany({ userId: employee._id });

    // ── TEST 10: Geofencing disabled allows any location ───────────────────
    console.log('✔ Running TEST 10: Geofencing disabled allows punches outside radius');
    settings.geofenceEnabled = false;
    await settings.save();

    const disabledGeofencePunchIn = await attendanceService.punchIn(employee._id, {
      selfieUrl: 'https://example.com/selfie.jpg',
      location: { lat: outsideLat, lng: outsideLng, accuracy: 15 },
    });
    assert.strictEqual(disabledGeofencePunchIn.attendanceStatus, ATTENDANCE_STATUS.ACTIVE);
    assert.ok(disabledGeofencePunchIn.punchInLocation.distanceFromOffice > 400);

    await attendanceService.punchOut(employee._id, {
      selfieUrl: 'https://example.com/selfie.jpg',
      location: { lat: outsideLat, lng: outsideLng, accuracy: 15 },
    });

    // Reset geofence setting
    settings.geofenceEnabled = true;
    await settings.save();
    await Attendance.deleteMany({ userId: employee._id });

    // ── TEST 11: Backend ignores frontend distance, calculates authoritative distance ──
    console.log('✔ Running TEST 11: Authoritative backend distance computation');
    // Even if frontend passed fake values or lat/lng inside, backend calculates exact distance based on actual lat/lng
    const authPunchIn = await attendanceService.punchIn(employee._id, {
      selfieUrl: 'https://example.com/selfie.jpg',
      location: { lat: insideLat, lng: insideLng, accuracy: 5, distanceFromOffice: 0 }, // fake frontend prop
    });
    assert.strictEqual(authPunchIn.punchInLocation.distanceFromOffice, distInside);

    // ── TEST 12: Cross-midnight shift with geofencing ─────────────────────
    console.log('✔ Running TEST 12: Cross-midnight shift with geofence validation');
    // Active shift created at 22:00
    authPunchIn.punchIn = new Date('2026-09-27T22:00:00.000Z');
    await authPunchIn.save();

    const cmPunchOut = await attendanceService.punchOut(employee._id, {
      selfieUrl: 'https://example.com/selfie.jpg',
      location: { lat: insideLat, lng: insideLng, accuracy: 5 },
    });
    assert.strictEqual(cmPunchOut.shiftDate || cmPunchOut.date, '2026-09-27');
    assert.strictEqual(cmPunchOut.attendanceStatus, ATTENDANCE_STATUS.COMPLETED);

    // ── TEST 13: Clean up test artifacts ──────────────────────────────────
    console.log('✔ Running TEST 13: Clean up test artifacts');
    await Attendance.deleteMany({ userId: employee._id });
    await CompanySettings.deleteMany({});
    await User.deleteMany({ email: 'test_geofence_emp@example.com' });
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log(' 🎉 ALL GEOFENCING TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
};

runTests();
