const mongoose = require("mongoose");
const dns = require("dns");

// Force Node to use a public DNS resolver for SRV lookups,
// since some routers mishandle Node's raw DNS queries even
// though the OS resolver handles them fine.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

let isConnected = false;

const connectDB = async (retries = 5) => {
  const mongoUri =
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/military-asset-management";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`MongoDB connecting (attempt ${attempt}/${retries})...`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      isConnected = true;
      return conn;
    } catch (err) {
      console.error(`❌ MongoDB Connection Failed (attempt ${attempt}):`, err.message);
      if (attempt === retries) {
        console.error("All MongoDB connection attempts failed. Server will run but DB calls will fail.");
        isConnected = false;
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
  isConnected = false;
});

mongoose.connection.on("connected", () => {
  isConnected = true;
});

const isDbConnected = () => isConnected;

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;

