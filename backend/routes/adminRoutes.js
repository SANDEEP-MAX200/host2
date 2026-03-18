import express from "express";
const router = express.Router();
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { exportAnalytics } from "../controllers/analyticsController.js";
import { requireBusinessAdmin, requireBusinessUser } from "../middleware/accessControl.js";
import list from "../models/UrlMarker.js";
import scans_log from "../models/ScanHistory.js";

const key = process.env.JWT_SECRET;

const Add_User = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Admin token missing" });
    }

    const decoded = jwt.verify(token, key);
    const Parent = decoded.email;

    const { name, email, password, dept } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ error: "User already exists" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const userstat = await User.create({
      name,
      email,
      password: hashPassword,
      parent: Parent,
      role: "Business-User",
      dept
    });
    console.log("added user", userstat);
    return res.status(201).json({
      message: "User created successfully",
    });

  } catch (error) {
    console.error("Error in Add_User:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const Display_User = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Admin token missing" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    // Select only name and email, count and dept
    const users = await User.find(
      { parent: email },
      { name: 1, email: 1, count: 1, dept: 1, canManageUrls: 1 }
    );

    return res.status(200).json({ users });

  } catch (error) {
    console.error("Error in Display_User:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const Delete_User = async (req, res) => {
  try {
    const { email } = req.body;
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Admin token missing" });
    }

    const decoded = jwt.verify(token, key);
    const admin_email = decoded.email;

    const deletedUser = await User.findOneAndDelete({
      email,
      parent: admin_email,
    });

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found or unauthorized" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete_User error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const permission = async (req, res) => {
  const { email, canManageUrls } = req.body;

  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const result = await User.findOneAndUpdate(
      { email },
      { $set: { canManageUrls } },
      { new: true }
    );

    if (!result) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Permission updated", user: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const checkaccess = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }
    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const user = await User.findOne(
      { email },
      { canManageUrls: 1 }
    );

    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.canManageUrls) {
      return res.status(200).json({ message: "Access permitted" });
    }
    return res.status(403).json({ message: "Access denied by admin" });
  } catch (e) {
    console.error("Error in checkaccess:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// transporter (reuse same config as OTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendURLRequestMail = async (req, res) => {
  try {
    const { url, listType, reasons } = req.body;

    if (!url || !listType || !reasons || reasons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;
    const user = await User.findOne({ email }, { parent: 1 });
    console.log("Requesting user's parent:", user);

    const rate_limit = await list.findOne({
      email: user.parent,
      url: url,
      verdict: listType === "whitelist" ? 0 : 1
    });

    if (rate_limit) {
      return res.status(429).json({
        success: false,
        message: "This URL was already requested recently. Please wait.",
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parent,
      subject: `!! Urgent action Required to SECURE organization network`,
      html: `
        <h2>URL ${listType.toUpperCase()} Request<h2>

        <p><strong>URL:</strong> ${url}</p>

        <p><strong>Requested Action:</strong>
          ${
            listType === "whitelist"
              ? "Whitelist (Allow Access)"
              : "Blacklist (Block Access)"
          }
        </p>

        <p><strong>Reasons:</strong></p>
        <ul>
          ${reasons.map((r) => `<li>${r}</li>`).join("")}
        </ul>

        <br/>
        <p>Requested via <b>Admin URL Management Panel</b></p>
        <hr/>
        <p style="font-size:12px;color:gray;">
          This is an automated security request email.
        </p>
        <p>${email} is requesting to ${listType === "whitelist" ? "add" : "block"} the URL: ${url} for the organization network. Please review and take necessary action.</p>
      `,
    });
    await User.updateOne(
      { email },
      {
        $push: {
          tempUrls: {
            url,
            createdAt: new Date(),
          },
        },
      }
    );
    return res.json({
      success: true,
      message: "URL request email sent successfully",
    });
  } catch (error) {
    console.error("Error in URL request mail sender:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send URL request email",
    });
  }
};

const View_User_Dashboard = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Admin token missing" });
    }

    const decoded = jwt.verify(token, key);
    const admin_email = decoded.email;

    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "User email required" });
    }

    const decodedEmail = decodeURIComponent(email);

    // Check if user belongs to this admin
    const user = await User.findOne({
      email: decodedEmail,
      parent: admin_email,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found or unauthorized" });
    }

    // Fetch scan history from scans_log collection
    const scans = await scans_log
      .find({ email: decodedEmail })
      .sort({ createdAt: -1 });

    const results = scans.map((scan) => ({
      url: scan.url,
      scannedAt: scan.createdAt,
      verdict: scan.verdict,
      Score: scan.score,
    }));

    const safe_count = scans.filter((s) => s.verdict === "Safe").length;
    const unsafe_count = scans.filter((s) => s.verdict === "Unsafe").length;
    const potentially_risky = scans.filter((s) => s.verdict === "Potentially_risky").length;

    return res.status(200).json({
      results,
      totalScans: scans.length,
      safe_count,
      unsafe_count,
      potentially_risky,
    });
  } catch (error) {
    console.error("Error in View_User_Dashboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAuthUser = (req, res) => {
  try {
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


router.post("/users/add", requireBusinessAdmin, Add_User);
router.get("/users", requireBusinessAdmin, Display_User);
router.delete("/users/delete", requireBusinessAdmin, Delete_User);
router.put("/users/permission", requireBusinessAdmin, permission);
router.get("/checkaccess", checkaccess);
router.get("/users/export", requireBusinessAdmin, exportAnalytics);
router.get("/users/view/:email", requireBusinessAdmin, View_User_Dashboard);
router.get("/auth/me", requireBusinessAdmin, getAuthUser);
router.post("/url/request", requireBusinessUser, sendURLRequestMail);

export default router;
