import express from "express";
const router = express.Router();
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import otpStore from "../models/OtpStore.js";
import { userexists } from "../middleware/auth.js";
import { checktoken } from "../middleware/auth.js";
import checkuserexists from "../middleware/checkUserExists.js";
import passport from "passport";
import bcrypt from "bcrypt";
import { getPeriodAnalytics } from "../controllers/analyticsController.js";
import { requireBusinessUser } from "../middleware/accessControl.js";
import TokenWallet from "../models/TokenWallet.js";
import TokenTransaction from "../models/TokenTransaction.js";
import list from "../models/UrlMarker.js";

const key = process.env.JWT_SECRET ;
const sltKey = process.env.SLT_SECRET ;

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// Google callback route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      // Find user in DB
      const user = await User.findOne({ email: req.user.email }, { role: 1 });

      const payload = {
        email: req.user.email,
        name: req.user.name,
        role: user.role,
        check: "11"
      };

      const token = jwt.sign(payload, key);

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
      });

      res.redirect("http://localhost:5173/dashboard");

    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);



const updateProfile = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "unauthorised" });

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const { password, oldpassword } = req.body;

    const userinfo = await User.findOne({ email });

    if (!userinfo) {
      return res.status(401).json({ message: "user not found" });
    }

    if (!password || !oldpassword) {
      return res.status(400).json({ message: "passwords required" });
    }

    // compare old password
    const isMatch = await bcrypt.compare(oldpassword, userinfo.password);
    if (!isMatch) {
      return res.status(401).json({ message: "wrong password" });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    return res.status(201).json({ message: "password changed" });

  } catch (e) {
    console.log("error in update profile", e);
    return res.status(500).json({ message: "error in update profile" });
  }
};

const fetchprofile = (req, res) => {
  try {
    const token = req.cookies?.token;
    const decoded = jwt.verify(token, key);
    const email = decoded.email;
    const role = decoded.role;
    if (email) {
      return res.status(201).json({
        email: email,
        role: role
      });
    } else {
      res.status(401).json({ message: "no data" });
    }
  } catch (e) {
    res.status(401).json({ message: "error fetching profile" });
    console.log("error in fetching date", e);
  }
};

const otpsender = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  if (await otpStore.findOne({ email })) {
    await otpStore.deleteOne({ email });
  }

  const otpstoring = await otpStore.create({
    email: email,
    otp: otp,
  });
  console.log(otpstoring);
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP For registration of anti phishing application",
      text: `otp for registering user ${otp}`,
    });
    res.json({ success: true, message: "OTP sent successfully" });
  } catch {
    console.log("error in otp sender");
  }
};

const changepass = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      return res.status(401).json({ message: "logout first to change password" });
    }
    const slt = req.cookies?.slt;
    const decoded = jwt.verify(slt, sltKey);
    const email = decoded.email;

    const { pass, repass } = req.body;
    if (pass == repass) {
      const user = await User.findOne({ email });
      const hashedPassword = await bcrypt.hash(pass, 10);
      user.password = hashedPassword;
      await user.save();
      // clear slt
      res.clearCookie("slt", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
      // initialize token
      const payload = {
        email: user.email,
        name: user.name,
        check: "11"
      };
      const newToken = jwt.sign(payload, key);
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
      res.status(201).json({ message: "password reset done" });
    } else {
      return res.status(401).json({ message: "password incorrect" });
    }
  } catch {
    console.log("error in change pass");
  }
};


const otpverify = async (email, otp) => {
    if (await otpStore.findOne({ email, otp })) {
        otpStore.deleteOne({ email });
        return true;
    } else {
        return false;
    }
}

const forgotpass = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const bool = await otpverify(email, otp);
    if (!bool) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = { email: user.email, name: user.name };
    const slt = jwt.sign(payload, sltKey, { expiresIn: "10m" });

    res.cookie("slt", slt, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    return res.status(201).json({
      message: "OTP verified successfully. Token cookie set for password reset.",
    });
  } catch (e) {
    console.error("Error in forgot pass:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const Delete_User = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Admin token missing" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const deletedUser = await User.findOneAndDelete({
      email,
    });

    await TokenTransaction.deleteMany({ email });
    await TokenWallet.deleteMany({ email });
    await list.deleteMany({ email });

    await User.deleteMany({ Parent: email });
    await TokenTransaction.deleteMany({ parent: email });
    await TokenWallet.deleteMany({ parent: email });
    await list.deleteMany({ parent: email });

    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
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

const add_whitelist = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const exists = await list.findOne({ email, url });

    if (exists) {
      return res.status(409).json({
        message: "URL already exists in whitelist"
      });
    }

    const entry = await list.create({
      email,
      url,
      verdict: "whitelist"
    });

    res.status(200).json({
      message: "URL added to whitelist",
      data: entry
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const add_Blacklist = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        message: "URL is required"
      });
    }

    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Token missing"
      });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const exists = await list.findOne({ email, url });

    if (exists) {
      return res.status(409).json({
        message: "URL already exists in blaccklist"
      });
    }

    const entry = await list.create({
      email: email,
      url: url,
      verdict: "blacklist"
    });

    return res.status(200).json({
      message: "URL added to blacklist",
      data: entry
    });

  } catch (error) {
    console.error("Blacklist error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const delete_whitelist = async (req, res) => {
  try {
    const { url } = req.body;

    console.log("inside whitelist delete");

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const deleted = await list.findOneAndDelete({
      email: email,
      url: url,
      verdict: "whitelist"
    });

    if (!deleted) {
      return res.status(404).json({
        message: "URL not found in whitelist"
      });
    }

    return res.status(200).json({
      message: "URL removed from whitelist",
      data: deleted
    });

  } catch (err) {
    console.error("delete whitelist error:", err);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const delete_Blacklist = async (req, res) => {
  try {
    const { url } = req.body;

    console.log("inside blacklist delete");

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const deleted = await list.findOneAndDelete({
      email: email,
      url: url,
      verdict: "blacklist"
    });

    if (!deleted) {
      return res.status(404).json({
        message: "URL not found in blacklist"
      });
    }

    return res.status(200).json({
      message: "URL removed from blacklist",
      data: deleted
    });

  } catch (err) {
    console.error("delete blacklist error:", err);

    return res.status(500).json({
      message: "Server error"
    });
  }
};


export const getBlacklist = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const blacklist = await list.find(
      { email, verdict: "blacklist" },
      { url: 1, _id: 0 }
    );

    const urls = blacklist.map(item => item.url);

    res.status(200).json({
      blacklist: urls
    });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const getWhitelist = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, key);
    const email = decoded.email;

    const whitelist = await list.find(
      { email, verdict: "whitelist" },
      { url: 1, _id: 0 }
    );

    const urls = whitelist.map(item => item.url);

    res.status(200).json({
      whitelist: urls
    });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
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


router.put("/updateProfile", checktoken, updateProfile);
router.get("/profile", checktoken, fetchprofile);
router.post("/send-otp", otpsender);
router.post("/forgotpass", userexists, otpsender);
router.post("/forgotverify", userexists, forgotpass);
router.post("/changepass", checkuserexists, changepass);
router.delete("/delete-account", checktoken, Delete_User);
router.post("/add/whitelist", checktoken, add_whitelist);
router.post("/add/blacklist", checktoken, add_Blacklist);
router.delete("/delete/whitelist", delete_whitelist);
router.delete("/delete/blacklist", delete_Blacklist);
router.get("/get/blacklist", checktoken, getBlacklist);
router.get("/get/whitelist", checktoken, getWhitelist);
router.get("/analytics/period", checktoken, getPeriodAnalytics);

router.get("/auth/me", requireBusinessUser, getAuthUser);

export default router;
