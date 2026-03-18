import express from "express";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import TokenWallet from "../models/TokenWallet.js";
import TokenLog from "../models/TokenTransaction.js";
import { requirepayment } from "../middleware/paymentAccess.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY );
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Top-up packages
const TOKEN_PACKAGES = {
  "100":  { tokens: 100,  price: 500  },
  "300":  { tokens: 300,  price: 1200 },
  "1000": { tokens: 1000, price: 3500 },
};

const SUBSCRIPTION_PLANS = {
  "Individual": {
    "Light":   { price: 980,    tokens: 50 },
    "Basic":   { price: 1980,   tokens: 200 },
    "Premium": { price: 3980,   tokens: 500 }
  },
  "Business": {
    "Light":   { price: 30000,  tokens: 1000 },
    "Basic":   { price: 100000, tokens: 10000 },
    "Premium": { price: 250000, tokens: 30000 }
  }
};


const createCheckoutSession = async (req, planRes) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return planRes.status(401).json({ message: "Please log in to subscribe." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;
    const { planName, planType } = req.body;

    const planConfig = SUBSCRIPTION_PLANS[planType]?.[planName];
    if (!planConfig) {
      return planRes.status(404).json({ message: "Invalid plan selected" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      client_reference_id: userEmail,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `Guardian ${planType} ${planName} Subscription`,
              description: `Monthly access with ${planConfig.tokens} tokens`,
            },
            unit_amount: planConfig.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        planName: planName,
        planType: planType,
        userEmail: userEmail,
        tokens: String(planConfig.tokens)
      },
      success_url: `http://localhost:5000/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/pricing`,
    });

    planRes.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    planRes.status(500).json({ error: "Failed to create checkout session" });
  }
};


const paymentSuccess = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.redirect(`${CLIENT_URL}/pricing`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.redirect(`${CLIENT_URL}/pricing`);
    }

    const { planName, planType, userEmail, tokens } = session.metadata;
    const allocatedTokens = parseInt(tokens, 10);

    if (!userEmail) {
      return res.redirect(`${CLIENT_URL}/login`);
    }

    const userRole = planType === "Individual" ? "Individual-User" : "Business-Admin";
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { canManageUrls: true, role: userRole }
    );

    if (!user) {
      return res.redirect(`${CLIENT_URL}/login`);
    }

    // Generate new token to reflect role upgrade
    const payload = {
      email: user.email,
      name: user.name,
      role: userRole,
      check: "11"
    };
    const newToken = jwt.sign(payload, JWT_SECRET);

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Idempotency: Verify we haven't already processed this session
    const existingLog = await TokenLog.findOne({
      email: userEmail,
      type: "monthly_reset",
      sessionId: sessionId
    });

    if (existingLog) {
      return res.redirect(`${CLIENT_URL}/scanner`);
    }

    // Allocate exact plan tokens and update wallet balance using aggregation pipeline
    const wallet = await TokenWallet.findOneAndUpdate(
      { email: userEmail },
      [
        {
          $set: {
            premiumTokens: { $ifNull: ["$premiumTokens", 0] },
            allotedTokens: allocatedTokens,
            planType: `${planType}-${planName}`,
            planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        },
        {
          $set: {
            balance: { $add: ["$premiumTokens", "$allotedTokens"] }
          }
        }
      ],
      { new: true, upsert: true }
    );

    // Log the transaction
    await TokenLog.create({
      email: userEmail,
      type: "monthly_reset",
      amount: allocatedTokens,
      balanceAfter: wallet.balance,
      sessionId: sessionId
    });

    res.redirect(`${CLIENT_URL}/scanner`);
  } catch (error) {
    console.error("Payment success error:", error);
    res.redirect(`${CLIENT_URL}/pricing`);
  }
};

router.post("/create-checkout-session", createCheckoutSession);
router.get("/success", paymentSuccess);
router.post("/create-token-checkout", requirepayment, createTokenCheckout);
router.get("/token-success", tokenPurchaseSuccess);

export default router;

async function createTokenCheckout(req, res) {
  try {
    const token = req.cookies?.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    const { packageId } = req.body;
    const pkg = TOKEN_PACKAGES[packageId];

    if (!pkg) {
      return res.status(400).json({ message: "Invalid package selected." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      client_reference_id: userEmail,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${pkg.tokens} Token Top-Up`,
              description: `Add ${pkg.tokens} tokens to your account`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userEmail,
        packageId,
        tokens: String(pkg.tokens),
        tokenPurchase: "true",
      },
      success_url: `http://localhost:5000/api/payment/token-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/buy-tokens`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Token checkout error:", error);
    res.status(500).json({ error: "Failed to create token checkout session" });
  }
}


async function tokenPurchaseSuccess(req, res) {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.redirect(`${CLIENT_URL}/buy-tokens`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" || session.metadata?.tokenPurchase !== "true") {
      return res.redirect(`${CLIENT_URL}/buy-tokens`);
    }

    const { userEmail, tokens } = session.metadata;
    const tokenAmount = parseInt(tokens, 10);

    // Idempotency — skip if already processed
    const existing = await TokenLog.findOne({ sessionId, type: "purchase" });
    if (existing) {
      return res.redirect(`${CLIENT_URL}/buy-tokens?status=success`);
    }

    // Add tokens to wallet
    const wallet = await TokenWallet.findOneAndUpdate(
      { email: userEmail },
      [
        { $set: { premiumTokens: { $add: [{ $ifNull: ["$premiumTokens", 0] }, tokenAmount] } } },
        { $set: { balance: { $add: [{ $ifNull: ["$allotedTokens", 0] }, "$premiumTokens"] } } },
      ],
      { new: true, upsert: true }
    );

    await TokenLog.create({
      email: userEmail,
      type: "purchase",
      amount: tokenAmount,
      balanceAfter: wallet.balance,
      sessionId,
    });

    res.redirect(`${CLIENT_URL}/buy-tokens?status=success`);
  } catch (error) {
    console.error("Token purchase success error:", error);
    res.redirect(`${CLIENT_URL}/buy-tokens`);
  }
}
