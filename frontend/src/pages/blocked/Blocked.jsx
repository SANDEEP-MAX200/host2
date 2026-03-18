import React from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const API_BASE = process.env.REACT_APP_API_BASE

export default function UnauthorizedAccess() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <Navbarwithlanguage />
      <div
        className={`min-h-screen pt-20 flex items-center justify-center px-6 ${
          darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
        }`}
      >
        <div
          className={`max-w-xl w-full p-10 rounded-3xl text-center shadow-xl ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className={`p-5 rounded-full ${darkMode ? "bg-red-900/40" : "bg-red-100"}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-12 h-12 ${darkMode ? "text-red-400" : "text-red-600"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 4h.01M5.07 19a10 10 0 1113.86 0H5.07z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
            {t("blocked.title")}
          </h1>

          <p
            className={`text-lg mb-6 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("blocked.message")}
          </p>

          <p
            className={`mb-8 ${
              darkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            {t("blocked.sub_message")}
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/")}
              className={`px-6 py-3 rounded-xl font-semibold border transition-all hover:scale-105 ${
                darkMode
                  ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t("blocked.go_back")}
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 bg-[#E87423] hover:bg-[#E87423]/80 text-white"
            >
              {t("blocked.go_dashboard")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
