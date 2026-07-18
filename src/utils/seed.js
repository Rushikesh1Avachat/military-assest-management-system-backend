const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Force Node to use a public DNS resolver for SRV lookups, since this network's
// default resolver fails to resolve mongodb+srv:// SRV records (same fix as db.js).
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Base = require('../models/Base');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const Expenditure = require('../models/Expenditure');
const AuditLog = require('../models/AuditLog');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://avachatrushikesh45_db_user:Rushikesh123456@military-assest-managem.cnmxl9m.mongodb.net/military_assets?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB for seeding at:', mongoUri);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing collections...');
    await Base.deleteMany({});
    await Asset.deleteMany({});
    await User.deleteMany({});
    await Inventory.deleteMany({});
    await Purchase.deleteMany({});
    await Transfer.deleteMany({});
    await Assignment.deleteMany({});
    await Expenditure.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Collections cleared.');

    // 1. Create Bases
    console.log('Creating bases...');
    const alphaBase = await Base.create({ name: 'Alpha Base', location: 'Texas, USA' });
    const betaBase = await Base.create({ name: 'Beta Base', location: 'California, USA' });
    const gammaBase = await Base.create({ name: 'Gamma Base', location: 'Kaiserslautern, Germany' });
    console.log('Bases created.');

    // 2. Create Assets
    console.log('Creating assets...');
    const m16 = await Asset.create({
      name: 'M16 Rifle',
      type: 'Weapon',
      unit: 'Piece',
      description: 'Standard infantry assault rifle, 5.56mm.'
    });
    const hmmwv = await Asset.create({
      name: 'HMMWV Tactical Vehicle',
      type: 'Vehicle',
      unit: 'Vehicle',
      description: 'High Mobility Multipurpose Wheeled Vehicle.'
    });
    const ammo556 = await Asset.create({
      name: '5.56mm Ammunition',
      type: 'Ammunition',
      unit: 'Box',
      description: '5.56x45mm NATO ammunition box (1,000 rounds per box).'
    });
    console.log('Assets created.');

    // 3. Create Users (passwords will be hashed via the pre-save hook in User model)
    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'General John Doe',
      email: 'admin@military.com',
      passwordHash: 'Admin@123', // hooks hash this
      role: 'Admin',
      baseId: null
    });

    const alphaCommander = await User.create({
      name: 'Colonel Sarah Connor',
      email: 'commander@military.com',
      passwordHash: 'Commander@123',
      role: 'BaseCommander',
      baseId: alphaBase._id
    });

    const betaCommander = await User.create({
      name: 'Colonel John Connor',
      email: 'commander.beta@military.com',
      passwordHash: 'Commander@123',
      role: 'BaseCommander',
      baseId: betaBase._id
    });

    const logisticsOfficer = await User.create({
      name: 'Major James Carter',
      email: 'logistics@military.com',
      passwordHash: 'Logistics@123',
      role: 'LogisticsOfficer',
      baseId: null
    });

    const ownerUser = await User.create({
      name: 'Rushikesh Avachat',
      email: 'avachatrushikesh45@gmail.com',
      passwordHash: 'Rushi123',
      role: 'Admin',
      baseId: null
    });
    console.log('Users created.');

    // 4. Initialize Inventory Levels
    console.log('Initializing inventories...');
    // Alpha Base Inventory
    const invAlphaM16 = await Inventory.create({
      assetId: m16._id,
      baseId: alphaBase._id,
      openingBalance: 100,
      currentStock: 100, // calculations: opening (100) + purchase (50) - transfer out (20) - assignment (30) = 100
      lastUpdated: new Date()
    });
    const invAlphaHmmwv = await Inventory.create({
      assetId: hmmwv._id,
      baseId: alphaBase._id,
      openingBalance: 10,
      currentStock: 10,
      lastUpdated: new Date()
    });
    const invAlphaAmmo = await Inventory.create({
      assetId: ammo556._id,
      baseId: alphaBase._id,
      openingBalance: 200,
      currentStock: 195, // opening (200) - expenditure (5) = 195
      lastUpdated: new Date()
    });

    // Beta Base Inventory
    const invBetaM16 = await Inventory.create({
      assetId: m16._id,
      baseId: betaBase._id,
      openingBalance: 80,
      currentStock: 100, // opening (80) + transfer in (20) = 100
      lastUpdated: new Date()
    });
    const invBetaHmmwv = await Inventory.create({
      assetId: hmmwv._id,
      baseId: betaBase._id,
      openingBalance: 5,
      currentStock: 5,
      lastUpdated: new Date()
    });
    const invBetaAmmo = await Inventory.create({
      assetId: ammo556._id,
      baseId: betaBase._id,
      openingBalance: 120,
      currentStock: 120,
      lastUpdated: new Date()
    });

    // Gamma Base Inventory
    await Inventory.create({
      assetId: m16._id,
      baseId: gammaBase._id,
      openingBalance: 40,
      currentStock: 40,
      lastUpdated: new Date()
    });
    await Inventory.create({
      assetId: hmmwv._id,
      baseId: gammaBase._id,
      openingBalance: 2,
      currentStock: 2,
      lastUpdated: new Date()
    });
    await Inventory.create({
      assetId: ammo556._id,
      baseId: gammaBase._id,
      openingBalance: 50,
      currentStock: 50,
      lastUpdated: new Date()
    });
    console.log('Inventories initialized.');

    // 5. Seed historical transactions for dynamic calculations
    console.log('Seeding transaction histories...');
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Purchase
    const seedPurchase = await Purchase.create({
      assetId: m16._id,
      baseId: alphaBase._id,
      quantity: 50,
      purchaseDate: tenDaysAgo,
      supplier: 'Colt Manufacturing LLC',
      remarks: 'Standard replenishment order',
      addedBy: logisticsOfficer._id
    });

    // Transfer
    const seedTransfer = await Transfer.create({
      assetId: m16._id,
      fromBaseId: alphaBase._id,
      toBaseId: betaBase._id,
      quantity: 20,
      transferDate: fiveDaysAgo,
      remarks: 'Redistributing rifle stock to Beta Base',
      initiatedBy: logisticsOfficer._id
    });

    // Assignment
    const seedAssignment = await Assignment.create({
      assetId: m16._id,
      baseId: alphaBase._id,
      quantity: 30,
      assignedTo: 'Alpha Infantry Unit 101',
      assignedBy: alphaCommander._id,
      assignmentDate: threeDaysAgo,
      remarks: 'Issued rifles for upcoming training exercise'
    });

    // Expenditure
    const seedExpenditure = await Expenditure.create({
      assetId: ammo556._id,
      baseId: alphaBase._id,
      quantity: 5,
      reason: 'Used',
      expendedBy: alphaCommander._id,
      expenditureDate: twoDaysAgo,
      remarks: 'Ammunition consumed during firing range qualifications'
    });
    console.log('Transactions seeded.');

    // 6. Record Audit Logs for initial seedings
    console.log('Recording audit logs...');
    await AuditLog.create({
      userId: logisticsOfficer._id,
      action: 'CREATE',
      module: 'Purchase',
      referenceId: seedPurchase._id,
      description: 'Initial seed purchase: 50 M16 Rifles for Alpha Base',
      timestamp: tenDaysAgo
    });

    await AuditLog.create({
      userId: logisticsOfficer._id,
      action: 'CREATE',
      module: 'Transfer',
      referenceId: seedTransfer._id,
      description: 'Initial seed transfer: 20 M16 Rifles from Alpha Base to Beta Base',
      timestamp: fiveDaysAgo
    });

    await AuditLog.create({
      userId: alphaCommander._id,
      action: 'CREATE',
      module: 'Assignment',
      referenceId: seedAssignment._id,
      description: 'Initial seed assignment: 30 M16 Rifles to Alpha Infantry Unit 101',
      timestamp: threeDaysAgo
    });

    await AuditLog.create({
      userId: alphaCommander._id,
      action: 'CREATE',
      module: 'Expenditure',
      referenceId: seedExpenditure._id,
      description: 'Initial seed expenditure: 5 boxes of 5.56mm Ammunition used',
      timestamp: twoDaysAgo
    });
    console.log('Audit logs recorded.');

    console.log('Database seeding successfully completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding database failed:', err);
    process.exit(1);
  }
};

seedDB();
