import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../config.js';

const Otp_verification = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [msg, setmsg] = useState('');
  const [otpsent, setotpsent] = useState(false);
  const navigator = useNavigate();
  const { t } = useTranslation();

  const otphandler = async (e) => {
    e.preventDefault();
    if (email == "") {
      setmsg(t("forgot.error_email"));
      return;
    }
    setotpsent(true);
    setmsg(t("forgot.otp_sent"));
    try {
      const res = await fetch(`${API_BASE}/user/forgotpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = res.json();
      setmsg(data.message);
    } catch {
      console.log("error in otp handler");
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userdata = { email, otp };
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userdata),
      credentials: "include",
    };
    try {
      const res = await fetch(`${API_BASE}/user/forgotverify`, request);
      if (res.status == 201) {
        setmsg(t("forgot.otp_sent"));
        navigator("/changepass");
      } else {
        setmsg(t("forgot.error_login"));
      }
    } catch {
      console.log("error in handler submit in forgot password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#142b4f] via-[#172c50] to-[#28385d] relative overflow-hidden">
      <div className="absolute top-10 left-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-lg w-full max-w-md z-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#00053A]">
          {t("forgot.heading")}
        </h2>
        <p className="text-center text-white mb-6">{t("forgot.subheading")}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setmsg(''); }}
            placeholder={t("forgot.email_placeholder")}
            disabled={otpsent ? true : false}
            className="w-full p-3 text-white bg-transparent border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00053A] placeholder-white/70"
          />
          <div onClick={otphandler} className="mt-4 w-full py-3 flex justify-center rounded-lg bg-gradient-to-r from-[#00053A] to-[#00053A]/80 text-white font-semibold hover:scale-[1.02] hover:text-[#00053A]/80 transition-all duration-200 shadow-lg cursor-pointer">
            {t("forgot.send_otp")}
          </div>

          <input
            type="text"
            value={otp}
            onChange={(e) => { setOtp(e.target.value); setmsg(''); }}
            maxLength="6"
            placeholder={t("forgot.otp_placeholder")}
            className="w-full p-3 text-center text-lg text-white bg-transparent border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00053A] placeholder-white/70 tracking-widest"
          />

          {msg && <p className="text-red-400 text-sm text-center">{msg}</p>}

          <button type="submit" className="w-full bg-gradient-to-r from-[#00053A] to-[#00053A]/80 text-white font-semibold hover:scale-[1.02] hover:text-[#00053A]/80 transition-all duration-200 shadow-lg rounded-lg p-2">
            {t("forgot.verify_otp")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Otp_verification;
