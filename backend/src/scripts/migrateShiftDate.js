const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Attendance = require('../models/Attendance');
const { formatDate } = require('../utils/dateUtils');
const logger = require('../config/logger');

const migrateShiftDate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_system';
    console.log('[Migration] Connecting to MongoDB...');
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    } catch {
      console.warn('[Migration] Could not connect to primary URI, attempting fallback mongodb://127.0.0.1:27017/attendance_system...');
      await mongoose.connect('mongodb://127.0.0.1:27017/attendance_system', { serverSelectionTimeoutMS: 3000 });
    }
    console.log('[Migration] Connected to MongoDB');

    const records = await Attendance.find({});
    console.log(`[Migration] Auditing ${records.length} attendance records...`);

    let updatedCount = 0;

    for (const rec of records) {
      let needsSave = false;

      // 1. Populate shiftDate if missing
      if (!rec.shiftDate) {
        rec.shiftDate = rec.date || (rec.punchIn ? formatDate(rec.punchIn) : formatDate(rec.createdAt));
        needsSave = true;
      }

      // 2. Populate workedMinutes, regularMinutes, overtimeMinutes if missing
      const totalMinutes = rec.workedMinutes || rec.workingMinutes || 0;
      if (!rec.workedMinutes && totalMinutes > 0) {
        rec.workedMinutes = totalMinutes;
        needsSave = true;
      }

      const expectedRegular = Math.min(totalMinutes, 480);
      const expectedOvertime = Math.max(totalMinutes - 480, 0);

      if (rec.regularMinutes !== expectedRegular) {
        rec.regularMinutes = expectedRegular;
        needsSave = true;
      }

      if (rec.overtimeMinutes !== expectedOvertime) {
        rec.overtimeMinutes = expectedOvertime;
        needsSave = true;
      }

      if (needsSave) {
        await rec.save();
        updatedCount++;
      }
    }

    console.log(`[Migration] Successfully migrated ${updatedCount} attendance records.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Error during migration:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  migrateShiftDate();
}

module.exports = migrateShiftDate;
