const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedUsers = async () => {
  try {
    await connectDB();
    const bcrypt = require('bcryptjs');

    console.log('Seeding demo accounts...');
    const passwordHash = await bcrypt.hash('password123', 12);

    // Upsert Admin
    let admin = await User.findOne({ email: 'admin@company.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@company.com',
        passwordHash,
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@company.com / password123');
    } else {
      admin.role = 'admin';
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log('✅ Admin user updated: admin@company.com / password123');
    }

    // Upsert Manager
    let manager = await User.findOne({ email: 'manager@company.com' });
    if (!manager) {
      manager = await User.create({
        name: 'Alex Manager',
        email: 'manager@company.com',
        passwordHash,
        role: 'manager',
      });
      console.log('✅ Manager user created: manager@company.com / password123');
    } else {
      manager.role = 'manager';
      manager.passwordHash = passwordHash;
      await manager.save();
      console.log('✅ Manager user updated: manager@company.com / password123');
    }

    // Upsert Employee (linked to Manager)
    let employee = await User.findOne({ email: 'employee@company.com' });
    if (!employee) {
      employee = await User.create({
        name: 'John Employee',
        email: 'employee@company.com',
        passwordHash,
        role: 'employee',
        managerId: manager._id,
      });
      console.log('✅ Employee user created: employee@company.com / password123 (linked to manager)');
    } else {
      employee.role = 'employee';
      employee.passwordHash = passwordHash;
      employee.managerId = manager._id;
      await employee.save();
      console.log('✅ Employee user updated: employee@company.com / password123');
    }

    console.log('\n--- Seed Complete! ---');
    console.log('👑 Admin:    admin@company.com    / password123');
    console.log('🧑‍💼 Manager:  manager@company.com  / password123');
    console.log('👤 Employee: employee@company.com / password123');
    console.log('----------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
