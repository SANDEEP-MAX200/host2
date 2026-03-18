import express from "express";
import scanRoutes from "./scanRoutes.js";
import userRoutes from "./userRoutes.js";
import adminRoutes from "./adminRoutes.js";
import paymentRoutes from "./paymentRoutes.js";

const router = express.Router();

router.use("/", scanRoutes);
router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/api/payment", paymentRoutes);

export default router;
