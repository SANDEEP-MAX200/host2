import mongoose from "mongoose";

const globalScanSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    verdict: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    lastScanned: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const GlobalScan = mongoose.model("GlobalScan", globalScanSchema);
export default GlobalScan;
