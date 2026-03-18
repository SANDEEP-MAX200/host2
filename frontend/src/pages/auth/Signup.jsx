import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../config.js";

const RegistrationForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [otpsent, setotpsent] = useState(false);
  const [otp, setotp] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { t } = useTranslation();

  const navigator = useNavigate();
  const otpInputRef = useRef(null);

  const passwordCriteria = [
    { label: t("signup.req_length"), met: password.length >= 8 },
    { label: t("signup.req_uppercase"), met: /[A-Z]/.test(password) },
    { label: t("signup.req_lowercase"), met: /[a-z]/.test(password) },
    { label: t("signup.req_number"), met: /\d/.test(password) },
    { label: t("signup.req_special"), met: /[^A-Za-z0-9]/.test(password) },
  ];

  const evaluatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (pass.length < 6) return 1;
    if (score <= 2) return 1;
    if (score === 3) return 2;
    if (score === 4) return 3;
    return 4;
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordStrength(evaluatePasswordStrength(val));

    if (message === t("signup.error_weak")) {
      setMessage("");
    }
  };

  const otphandler = async () => {
    if (name === "") { setMessage(t("signup.error_name")); return; }
    if (email === "") { setMessage(t("signup.error_email")); return; }
    if (password === "") { setMessage(t("signup.error_password")); return; }
    if (passwordStrength < 2) { setMessage(t("signup.error_weak")); return; }

    setotpsent(true);
    setMessage(t("signup.otp_sent"));

    try {
      const res = await fetch(`${API_BASE}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message);
    } catch {
      console.log("Error in OTP handler");
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userdata = { name, email, password };

    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userdata),
      credentials: "include",
    };

    try {
      const res = await fetch(`${API_BASE}/signup`, request);
      const data = await res.json();

      if (res.status === 400) { setMessage(t("signup.error_logout")); return; }
      if (res.status === 401) { setMessage(t("signup.error_exists")); return; }
      if (res.status === 402) { setMessage(t("signup.error_otp")); return; }
      if (res.ok) {
        localStorage.removeItem("apawebexttoken");
        localStorage.setItem("apawebexttoken", data.webext);
        setMessage(t("signup.success"));
        setName("");
        setEmail("");
        setPassword("");
        setPasswordStrength(0);
        navigator("/");
      } else {
        setMessage(data.error || t("signup.error_server"));
      }
    } catch {
      setMessage(t("signup.error_server"));
    }
  };

  const strengthLabels = ["", t("signup.strength_weak"), t("signup.strength_fair"), t("signup.strength_good"), t("signup.strength_strong")];

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e2a47] relative overflow-hidden">
      <div className="absolute top-10 left-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-[90%] max-w-5xl flex flex-col md:flex-row items-center justify-center rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/20 backdrop-blur-lg bg-white/10 z-10">

        {/* Left Section */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gradient-to-tr p-8 relative">
          <img
            src="https://www.tailwindtap.com/assets/common/marketing.svg"
            alt="Illustration"
            className="w-72 md:w-96 opacity-90 drop-shadow-xl"
          />
          <h2 className="text-white text-3xl font-bold mt-6 text-center">{t("signup.left_heading")}</h2>
          <p className="text-gray-300 text-sm text-center mt-2 w-3/4">{t("signup.left_desc")}</p>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 bg-transparent p-8 md:p-12 flex flex-col justify-start max-h-[80vh] overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-2 text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4"
          >
            <svg className="w-9 h-9 text-[#E87423]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l7 3v5c0 5.25-3.58 10-7 12-3.42-2-7-6.75-7-12V5l7-3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("nav.brand")}
          </Link>

          <h1 className="text-3xl font-extrabold text-white mb-2">{t("signup.heading")}</h1>
          <p className="text-gray-300 text-sm mb-6">{t("signup.subheading")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" disabled={otpsent} placeholder={t("signup.name_placeholder")} className="w-full px-5 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-300 text-sm focus:ring-2 focus:ring-[#00053A] focus:bg-white/20 outline-none transition" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" disabled={otpsent} placeholder={t("signup.email_placeholder")} className="w-full px-5 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-300 text-sm focus:ring-2 focus:ring-[#00053A] focus:bg-white/20 outline-none transition" />

            <div className="w-full flex flex-col">
              <input value={password} onChange={handlePasswordChange} type="password" disabled={otpsent} placeholder={t("signup.password_placeholder")} className="w-full px-5 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-300 text-sm focus:ring-2 focus:ring-[#00053A] focus:bg-white/20 outline-none transition" />

              {password.length > 0 && (
                <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                  <p className="text-xs text-gray-300 font-semibold mb-2">{t("signup.requirements_label")}</p>
                  <ul className="flex flex-col gap-1.5">
                    {passwordCriteria.map((item, idx) => (
                      <li key={idx} className={`text-xs flex items-center gap-2 transition-colors duration-300 ${item.met ? "text-green-400" : "text-gray-400"}`}>
                        {item.met ? (
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {item.label}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 mb-1 px-1">
                    <div className="flex gap-1.5 h-1.5 w-full">
                      {[1, 2, 3, 4].map((level) => (
                        <div key={level} className={`flex-1 rounded-full transition-colors duration-300 ${passwordStrength >= level ? passwordStrength === 1 ? "bg-red-500" : passwordStrength === 2 ? "bg-yellow-400" : passwordStrength === 3 ? "bg-blue-400" : "bg-green-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                    <p className={`text-xs mt-1.5 text-right transition-colors duration-300 ${passwordStrength === 1 ? "text-red-500 font-bold" : passwordStrength === 2 ? "text-yellow-400 font-medium" : passwordStrength === 3 ? "text-blue-400 font-medium" : "text-green-400 font-medium"}`}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {message && (
              <p className={`text-center font-medium text-sm mt-2 ${message === t("signup.success") || message === t("signup.otp_sent") ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}

            <div onClick={otphandler} className={`w-full py-3 flex justify-center rounded-lg font-semibold shadow-lg transition-all duration-200 cursor-pointer ${otpsent ? "bg-white/10 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-[1.02] hover:text-[#00053A] shadow-lg"}`}>
              {t("signup.send_otp")}
            </div>

            <input ref={otpInputRef} value={otp} onChange={(e) => setotp(e.target.value)} disabled={!otpsent} placeholder={t("signup.otp_placeholder")} className="w-full px-5 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-300 text-sm focus:ring-2 focus:ring-[#00053A] focus:bg-white/20 outline-none transition disabled:opacity-50" />

            <button type="submit" disabled={!otpsent} className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:scale-[1.02] hover:text-[#00053A] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:hover:scale-100">
              {t("signup.button")}
            </button>

            <p className="mt-4 pb-4 text-xs text-gray-300 text-center">
              {t("signup.have_account")}{" "}
              <Link to="/login" className="text-[#00053A] hover:text-[#00053A] hover:underline font-semibold transition-colors">
                {t("signup.login_link")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
