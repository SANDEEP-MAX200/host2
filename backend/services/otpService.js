import otpStore from "../models/OtpStore.js";

const otpverify = async (email, otp) => {
    if (await otpStore.findOne({ email, otp })) {
        otpStore.deleteOne({ email });
        return true;
    } else {
        return false;
    }
}

export default otpverify;
