import { MdAlternateEmail } from "react-icons/md";
import { FaFingerprint, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from '../../utils/api.js';

const Login = () => {
  const [showPassword, setShowPassword] = useState(true);
  const togglePasswordView = () => setShowPassword(!showPassword);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        console.log("sending token to web extension");

        window.postMessage(
          { type: "SET_TOKEN", token: data.webext },
          "http://localhost:5173"
        );

        setEmail("");
        setPassword("");
        navigate("/dashboard");
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch {
      setMessage(t("login.error_server"));
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e2a47] relative overflow-hidden">
      <div className="absolute top-10 left-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-[90%] max-w-sm md:max-w-md lg:max-w-md p-6 backdrop-blur-lg bg-white/10 border border-white/20 flex-col flex items-center gap-3 rounded-2xl shadow-2xl shadow-black/30 z-10">
        <Link to="/" className="flex items-center text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text mb-4">
          <svg
            className="w-9 h-9 text-[#E87423]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2l7 3v5c0 5.25-3.58 10-7 12-3.42-2-7-6.75-7-12V5l7-3z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="text-[#E87423]">{t("nav.brand")}</h1>
        </Link>

        <h1 className="text-lg md:text-xl font-semibold text-white">{t("login.heading")}</h1>
        <p className="text-xs md:text-sm text-gray-300 text-center">
          {t("login.no_account")}{" "}
          <Link to="/signup" className="text-[#E87423] font-semibold hover:underline">
            {t("login.signup_link")}
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-4">
          <div className="w-full flex items-center gap-2 bg-white/10 border border-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-[#00053A]">
            <MdAlternateEmail className="text-blue-300" />
            <input
              type="email"
              placeholder={t("login.email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
              required
            />
          </div>

          <div className="w-full flex items-center gap-2 bg-white/10 border border-white/20 p-2 rounded-xl relative focus-within:ring-2 focus-within:ring-[#00053A]">
            <FaFingerprint className="text-[#00053A]" />
            <input
              type={showPassword ? "password" : "text"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.password_placeholder")}
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
              required
            />
            {showPassword ? (
              <FaRegEyeSlash
                className="absolute right-5 cursor-pointer text-gray-400 hover:text-white"
                onClick={togglePasswordView}
              />
            ) : (
              <FaRegEye
                className="absolute right-5 cursor-pointer text-gray-400 hover:text-white"
                onClick={togglePasswordView}
              />
            )}
          </div>

          <div>
            <Link
              to="/forgot"
              className="w-full text-gray-400 px-3 hover:text-[#00053A] transition-all duration-300"
            >
              {t("login.forgot_password")}
            </Link>
          </div>

          <button
            type="submit"
            className="w-full p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl mt-3 hover:scale-[1.04] hover:text-[#E87423] shadow-md transition-all duration-300 ease-in-out"
          >
            {t("login.button")}
          </button>
        </form>

        {message && (
          <p className="text-center text-red-400 mt-2 font-medium">{message}</p>
        )}

        <div className="relative w-full flex items-center justify-center py-3">
          <div className="w-2/5 h-[2px] bg-gray-500/50"></div>
          <h3 className="font-lora text-xs md:text-sm px-4 text-gray-400">
            {t("login.or")}
          </h3>
          <div className="w-2/5 h-[2px] bg-gray-500/50"></div>
        </div>

        <div className="w-full flex items-center justify-center">
          <div className="w-full p-1 md:px-6 lg:px-10 rounded-xl hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-center">
            <button
              onClick={() => window.location.href = `${API_URL}/user/auth/google`}
              className="flex items-center justify-center"
            >
              <img
                src="/web_light_rd_SI@1x.png"
                alt="Google Sign In"
                className="w-40"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
