import mongoose from "mongoose";

const userScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: "free-user",
    },
    parent: {
      type: String,
      default: null
    },
    canManageUrls: {
      type: Boolean,
      default: false,
    },
    dept: {
      type: String,
      default: "NULL",
    },
    count: {
      safe: { type: Number, default: 0 },
      unsafe: { type: Number, default: 0 },
    },
    tempUrls: [
      {
        url: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 60 * 60 * 5, // auto delete after 5 hours
        },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("user", userScheme);
export default User;
