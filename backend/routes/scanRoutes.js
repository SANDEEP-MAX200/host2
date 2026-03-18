import express from "express";
import { scanUrlController } from "../controllers/scanController.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Navbarchecklogin from "../services/authService.js";
import handleWebext from "../controllers/webExtensionController.js";
import { checktoken } from "../middleware/auth.js";
import otpverify from "../services/otpService.js";
import bcrypt from "bcrypt";
import scans_log from "../models/ScanHistory.js";
import { requirepayment } from "../middleware/paymentAccess.js";


const router = express.Router();
const key = process.env.JWT_SECRET;
const webextkey = process.env.WEBEXT_SECRET ;

const handleSignup = async (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.status(400).json({ message: "erro in handle signup" });
  }
  const { otp, email } = req.body;

  const verification = otpverify(email, otp);

  if (!verification) {
    return res.status(402).json({ message: "otp incorrect" });
  }
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(401).json({ error: "User already exists" });

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashPassword });

    const payload = {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      check: "11",
    };
    const jwttoken = jwt.sign(payload, key);
    res.cookie("token", jwttoken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    const extpay = {
      email: newUser.email,
      name: newUser.name,
      check: "21"
    }

    const webextensiontoken = jwt.sign(extpay, webextkey);

    res.status(201).json({ message: "User registered successfully", user: newUser, webext: webextensiontoken });
  } catch (err) {
    console.log("error in signup", err)
  }
};


export const handleLogin = async (req, res) => {
  const existingToken = req.cookies.token;
  if (existingToken) {
    return res.status(401).json({ error: "Already logged in" });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    console.log(user);

    const payload = { email: user.email, name: user.name, check: "11", role: user.role };
    const token = jwt.sign(payload, key);
    // Store in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      sameSite: "Lax",
    });

    const extpay = {
      email: email,
      name: user.name,
      check: "21"
    }

    const webextensiontoken = jwt.sign(extpay, webextkey);
    console.log("webext token", webextensiontoken)
    return res.status(200).json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
      token,
      webext: webextensiontoken
    });

  } catch (e) {
    console.error("Login failed:", e);
    res.status(500).json({ error: "Server error" });
  }
};


const handleDashboard = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json("no token");

  try {
    console.log("Cookies:", req.cookies);

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    // Get all scans of the user
    const scans = await scans_log.find({ email }).sort({ createdAt: -1 });

    if (scans.length === 0) {
      return res.status(200).json({
        results: [],
        safe_count: 0,
        unsafe_count: 0,
      });
    }

    // Format like old history structure
    const formatted = scans.map((h) => ({
      url: h.url,
      scannedAt: h.createdAt,
      verdict: h.verdict,
      Score: h.score,
    }));

    // Count safe / unsafe
    const safe_count = scans.filter(s => s.verdict === "Safe").length;
    const unsafe_count = scans.filter(s => s.verdict === "Unsafe").length;
    const potentially_risky = scans.filter((s) => s.verdict === "Potentially_risky").length;
    const totalScans = scans.length;

    res.status(200).json({
      results: formatted,
      totalScans,
      safe_count,
      unsafe_count,
      potentially_risky
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const handleLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};


router.post("/", scanUrlController);
router.post("/webextension", handleWebext)
router.get("/dashboard", requirepayment, checktoken, handleDashboard);
router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.get("/check", Navbarchecklogin);
router.get("/logout", checktoken, handleLogout);

export default router;
