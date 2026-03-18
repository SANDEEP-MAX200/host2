import mongoose from "mongoose";

const tokenWalletSchema = new mongoose.Schema(
{
  email:{
    type: String,
    required: true,
    unique: true
  },

  balance: {
    type: Number,
    default: 0
  },

  allotedTokens: {
    type: Number,
    default: 0
  },

  premiumTokens:{
    type: Number,
    default: 0,
  },

  planType: {
    type: String,
    default: "Free"
  },

  planExpiry: {
    type: Date
  }

},
{ timestamps: true }
);

/* Automatically calculate balance */
tokenWalletSchema.pre("save", function(next) {
  this.balance = this.allotedTokens + this.premiumTokens;
  next();
});

const TokenWallet = mongoose.model("TokenWallet", tokenWalletSchema);

export default TokenWallet;
