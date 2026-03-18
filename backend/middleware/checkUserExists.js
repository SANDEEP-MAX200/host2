import jwt from "jsonwebtoken"
import User from "../models/User.js";

const checkuserexists = async (req, res, next) => {
    try {
        const slt = req.cookies?.slt;
        if (!slt) return res.status(403).json({ message: "no token found" })
        const decoded = jwt.verify(slt, process.env.SLT_SECRET );
        const email = decoded.email;

        if (!await User.findOne({ email })) {
            return res.status(402).json({ message: "no user found" });
        }
        next();
    } catch (e) {
        console.log("error in checkuserexists", e);
    }
}

export default checkuserexists;
