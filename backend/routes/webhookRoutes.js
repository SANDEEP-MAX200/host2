import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_YOUR_WEBHOOK_SECRET"
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful subscription creation
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.mode === 'subscription') {
      const userEmail = session.client_reference_id;

      if (userEmail) {
        // Upgrade the user in the database using their email
        await User.findOneAndUpdate({ email: userEmail }, { role: 'Individual-User' });
        console.log(`Subscription active! User ${userEmail} upgraded to Individual-User.`);
      }
    }
  }

  res.status(200).end();
});

export default router;
