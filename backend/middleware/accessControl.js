import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireBusinessUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET );

    if (decoded.role !== "Business-User") {
      return res.status(403).json({
        message: "Token role mismatch. Please login again.",
      });
    }

    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireBusinessAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
        console.log("No token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "Business-Admin") {
      return res.status(403).json({
        message: "Token role mismatch. Please login again.",
      });
    }

    next();

  } catch (err) {
    console.error("Error in requireBusinessAdmin:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
