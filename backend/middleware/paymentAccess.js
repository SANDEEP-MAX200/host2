import jwt from "jsonwebtoken";

export const requirepayment = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
        console.log("No token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    if (decoded.role === "free-user") {
      return res.status(401).json({
        message: "payment required. Please subscribe to access this feature.",
      });
    }

    next();

  } catch (err) {
    console.error("Error in requireBusinessAdmin:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
