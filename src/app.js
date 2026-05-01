//npm install cookie
//in middlewares
import express from 'express'
import cors from 'cors'

import cookieParser from 'cookie-parser'

const app = express()
console.log("🔥 APP FILE LOADED");
app.get("/", (req, res) => {
  console.log("ROOT HIT");
  res.send("Server working");
});



app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true // have to study cors
}))

app.use(express.json({limit:'20kb'}))
app.use(express.urlencoded({extended: true , limit: '20kb'}))
app.use(express.static('public'))

app.use(cookieParser())


app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});

//routes

import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users" , userRouter)
//http://localhost:8000/api/v1/register



app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Server error"
  });
});


export {app}

