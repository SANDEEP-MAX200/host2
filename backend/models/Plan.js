import mongoose from "mongoose";

const featureSchema = new mongoose.Schema({
  text: String,
  included: Boolean
});

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  planType: {
    type: String,
    enum: ["individual", "business"],
    required: true
  },

  price: {
    type: Number,
    default: 0
  },
  token:{
    type: Number,
    default: 0
  },

  perUser: {
    type: Boolean,
    default: false
  },

  isPopular: {
    type: Boolean,
    default: false
  },

  features: [featureSchema]
});

export default mongoose.model("Plan", planSchema);
