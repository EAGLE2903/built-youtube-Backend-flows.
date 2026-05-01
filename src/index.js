import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import {app} from './app.js'

console.log("🚀 INDEX FILE RUNNING");
dotenv.config({
  
});



connectDB()
  .then(() => {
    app.listen(8000, () => { // process.env.port ||8000
      console.log("Server running on port 8000 🚀");
    });
  })
  .catch((err) => {
    console.log("DB connection failed", err);
  });