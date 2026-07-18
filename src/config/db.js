const mongoose = require("mongoose");
const dns = require("dns");

// Force Node to use a public DNS resolver for SRV lookups,
// since some routers mishandle Node's raw DNS queries even
// though the OS resolver handles them fine.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);

    const mongoUri =
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/military-asset-management";

    const conn = await mongoose.connect(mongoUri, {
      // Atlas SRV connections are sensitive to networking/DNS; these timeouts make failures clearer.
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Connection Failed");
    console.error(err);

    // Don’t crash the whole server; keep it running for health checks / frontend debugging.
    // Routes that need DB will still fail gracefully when called.
  }
};

module.exports = connectDB;

