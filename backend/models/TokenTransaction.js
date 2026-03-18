import mongoose from "mongoose";

const tokenTransactionSchema = new mongoose.Schema(
{
  email: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["scan", "purchase", "monthly_reset"],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  balanceAfter: {
    type: Number
  },

  sessionId: {
    type: String,
    default: null
  }

},
{ timestamps: true }
);

const TokenLog = mongoose.model("TokenTransaction", tokenTransactionSchema);
export default TokenLog;
