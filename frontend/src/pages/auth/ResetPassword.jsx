import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const API_BASE = process.env.REACT_APP_API_BASE

const Forgot_password_change = () => {
  const [pass, setpass] = useState('');
  const [repass, setrepass] = useState('');
  const [msg, setmsg] = useState('');
  const navigator = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userdata = { pass, repass };
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userdata),
      credentials: "include",
    };
    try {
      const res = await fetch(`${API_BASE}/user/changepass`, request);
      if (res.status == 402) return setmsg(t("change_pass.error_unauth"));
      if (res.status == 201) {
        setmsg(t("change_pass.success"));
        navigator("/dashboard");
      } else {
        setmsg(t("change_pass.error_mismatch"));
      }
    } catch {
      console.log("error in handler submit in enter new password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#142b4f] via-[#172c50] to-[#28385d] relative overflow-hidden">
      <div className="absolute top-10 left-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-lg w-full max-w-md z-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#00053A]">
          {t("change_pass.heading")}
        </h2>
        <p className="text-center text-white mb-6">{t("change_pass.subheading")}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={pass}
            onChange={(e) => { setpass(e.target.value); setmsg(''); }}
            placeholder={t("change_pass.new_placeholder")}
            className="w-full p-3 text-center text-lg text-white bg-transparent border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00053A] placeholder-white/70 tracking-widest"
          />
          <input
            type="text"
            value={repass}
            onChange={(e) => { setrepass(e.target.value); setmsg(''); }}
            placeholder={t("change_pass.confirm_placeholder")}
            className="w-full p-3 text-center text-lg text-white bg-transparent border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00053A] placeholder-white/70 tracking-widest"
          />

          {msg && <p className="text-red-400 text-sm text-center">{msg}</p>}

          <button type="submit" className="w-full text-white font-semibold hover:scale-[1.02] hover:text-[#00053A] transition-all duration-200 shadow-lg rounded-lg p-2">
            {t("change_pass.button")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Forgot_password_change;
