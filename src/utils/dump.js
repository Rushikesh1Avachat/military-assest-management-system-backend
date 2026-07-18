const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');

// Force Node to use a public DNS resolver for SRV lookups, matching db.js/seed.js.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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

const dumpDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/military-asset-management';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const dumpDir = path.join(__dirname, '../../database_dump');
    if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir, { recursive: true });
    }

    const collections = [
      { name: 'bases', model: Base },
      { name: 'assets', model: Asset },
      { name: 'users', model: User },
      { name: 'inventory', model: Inventory },
      { name: 'purchases', model: Purchase },
      { name: 'transfers', model: Transfer },
      { name: 'assignments', model: Assignment },
      { name: 'expenditures', model: Expenditure },
      { name: 'auditlogs', model: AuditLog }
    ];

    for (const col of collections) {
      console.log(`Dumping collection: ${col.name}...`);
      const data = await col.model.find({});
      const filePath = path.join(dumpDir, `${col.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Dumped ${data.length} records to ${filePath}`);
    }

    console.log('Database dump completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database dump failed:', err);
    process.exit(1);
  }
};

dumpDB();
