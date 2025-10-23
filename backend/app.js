const express = require("express");

const app = express(); //express app, act as a middleware

const bodyParser = require("body-parser"); //imnport body-parser

const userRoutes=require('./routes/user');
const expenseRoutes=require('./routes/expense');

const mongoose = require("mongoose");

// Database connection - supports both local and Atlas
console.log("Attempting to connect to MongoDB...");
console.log("MONGO_ATLAS_PW from env:", process.env.MONGO_ATLAS_PW ? "***FOUND***" : "NOT FOUND");
const mongoUri = `mongodb+srv://manish:${process.env.MONGO_ATLAS_PW}@cluster0.n4rjlbq.mongodb.net/expenseTracker?retryWrites=true&w=majority`;
console.log("Connection URI (masked):", mongoUri.replace(process.env.MONGO_ATLAS_PW, "***PASSWORD***"));

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>{
  console.log("✅ Successfully connected to MongoDB Atlas!");
  console.log("Database:", "MongoDB Atlas");
})
.catch((err)=>{
  console.log("Not able to connect to database:", err.message);
})


app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,authentication",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,DELETE,PATCH,OPTIONS"
  );
  next();
});

app.use('/v1/api',expenseRoutes);
app.use('/v1/api/USER',userRoutes);

module.exports = app;
