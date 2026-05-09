import dotenv from "dotenv";
dotenv.config();  // 🚨 MUST BE FIRST LINE

import connectDB from "./db/index.js";

import { app } from "./app.js";

console.log("🚀 INDEX FILE RUNNING");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000} 🚀`);
    });
  })
  .catch((err) => {
    console.log("DB connection failed ❌", err);
  });