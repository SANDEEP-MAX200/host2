import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const userexists = async (req, res, next) => {
    try {
    const { email } = req.body;
    const bool = await User.findOne({ email });
    if (!bool) {
       return res.status(500).json({
            message: "user doesnt exists"
        })
    }
    next();
  } catch {
    console.log("error caught in userexits middleware");
  }
}

export const checktoken = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "no not logged in" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const check = decoded.check;
    if (!check || check !== "11") {
      return res.status(401).json({ message: "no not logged in" });
    }
    next();
  } catch (e) {
    console.log("error in checklong", e);
  }
}
