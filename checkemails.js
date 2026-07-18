const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8","8.8.4.4"]);
const uri = "mongodb+srv://avachatrushikesh45_db_user:Rushikesh123456@military-assest-managem.cnmxl9m.mongodb.net/military_assets?retryWrites=true&w=majority";
(async () => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const User = require("./src/models/User");
  const users = await User.find({}, "email role").lean();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
