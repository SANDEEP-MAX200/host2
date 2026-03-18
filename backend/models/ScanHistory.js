import mongoose from "mongoose";

const scans_logSchema = new mongoose.Schema(
{
  email: {
    type: String,
    required: true,
  },

  url: {
    type: String,
    required: true,
  },

  verdict: {
    type: String,
    required: true,
  },

  score: {
    type: Number,
  },
},
{ timestamps: true }
);

const scans_log = mongoose.model("scan_log", scans_logSchema);
export default scans_log;
