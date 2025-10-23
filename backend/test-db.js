// Test MongoDB connection with multiple connection string formats
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require("mongoose");

console.log("Testing MongoDB connection...");
console.log("Password value:", process.env.MONGO_ATLAS_PW);

// Try different connection string formats
const connectionStrings = [
  `mongodb+srv://manish:${process.env.MONGO_ATLAS_PW}@cluster0.n4rjlbq.mongodb.net/expenseTracker?retryWrites=true&w=majority`,
  `mongodb+srv://manish:${process.env.MONGO_ATLAS_PW}@cluster0.n4rjlbq.mongodb.net/expenseTracker`,
  `mongodb+srv://manish:manish%4025@cluster0.n4rjlbq.mongodb.net/expenseTracker?retryWrites=true&w=majority`
];

async function testConnection(uri, index) {
  console.log(`\n--- Testing Connection ${index + 1} ---`);
  console.log("URI (masked):", uri.replace(/manish.*@/, "manish:***PASSWORD***@"));
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ SUCCESS: Connection established!");
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log("❌ FAILED:", err.message);
    return false;
  }
}

async function runTests() {
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    if (success) {
      console.log("\n🎉 Found working connection string!");
      process.exit(0);
    }
  }
  console.log("\n💥 All connection attempts failed");
  process.exit(1);
}

runTests();