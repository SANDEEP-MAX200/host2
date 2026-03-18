import mongoose from "mongoose";

const otpdata = new mongoose.Schema({
    email:{
        type:String,
        unique:true
    },
    otp:String,
    createdAt: {
    type: Date,
    default: Date.now,
    expires: 200 // 200 seconds = 3.20 minutes
  }
})
const otpStore=mongoose.model("otpStore",otpdata);
export default otpStore;
