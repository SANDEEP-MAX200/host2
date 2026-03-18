import jwt from "jsonwebtoken";
import TokenWallet from "../models/TokenWallet.js";

const Navbarchecklogin = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const email = decoded.email;
    const user_role = decoded.role;

    const wallet = await TokenWallet.findOne(
      { email },
      { balance: 1, _id: 0 }
    );

    const role =
      user_role === "Business-Admin"
        ? "Business-Admin"
        : user_role === "Business-User"
        ? "Business-User"
        : user_role === "Individual-User"
        ? "Individual-User"
        : "Unknown";

    return res.status(200).json({
      loggedIn: true,
      user: decoded,
      user_role: role,
      token_balance: wallet ? wallet.balance : 0
    });

  } catch (err) {
    return res.status(400).json({ loggedIn: false });
  }
};

export default Navbarchecklogin;
