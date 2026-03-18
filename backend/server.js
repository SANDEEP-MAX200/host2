// ==========================================
// DNS FIX - MUST BE AT THE VERY TOP
// ==========================================
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

// ==========================================
// NOW import everything else
// ==========================================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import routes from "./routes/index.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import User from "./models/User.js";

dotenv.config();

const app = express();

// ---------------------
// CORS Configuration
// ---------------------
const allowedLocalhost = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.240.1:5173"
];

const ngrokRegex = /^https:\/\/.*\.ngrok-free\.dev$/;

app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedLocalhost.includes(origin) ||
      ngrokRegex.test(origin) ||
      origin.startsWith("chrome-extension://")
    ) {
      callback(null, true);
    } else {
      console.error("Blocked CORS for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ---------------------
// Webhook MUST come before body parsers (needs raw body)
// ---------------------
app.use('/webhook', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

app.set("view engine", "ejs");
app.set("views", "./views");

// ---------------------
// Google OAuth Strategy
// ---------------------
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/user/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });

    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: null,
        provider: "google"
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// ---------------------
// Routes
// ---------------------
app.use("/", routes);

// ---------------------
// MongoDB Connection
// ---------------------
mongoose
  .connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  })
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
