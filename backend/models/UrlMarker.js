import mongoose from "mongoose";

const URL_marker = new mongoose.Schema(
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
    type: String, // "whitelist" or "blacklist"
    required: true,
  },
},
{ timestamps: true }
);

const list = mongoose.model("scans_log", URL_marker);
export default list;
