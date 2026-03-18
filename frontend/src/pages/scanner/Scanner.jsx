import React, { useState } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { FiLink, FiSearch, FiShield, FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";
import Loader from "./ScanAnimation";
import { useTranslation } from "react-i18next";

export default function Scanner() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  const getResultByScore = (score) => {
    const numScore = Number(score);
    if (numScore >= 1 && numScore <= 4) {
      return {
        status: "safe",
        icon: <FiCheckCircle size={48} className="text-green-500" />,
        borderColor: "border-green-500",
        bgColor: darkMode ? "bg-green-900/30" : "bg-green-50",
        title: t("scanner.result_safe_title"),
        riskLevel: t("scanner.result_safe_risk"),
      };
    } else if (numScore >= 5 && numScore <= 7) {
      return {
        status: "warning",
        icon: <FiAlertTriangle size={48} className="text-yellow-500" />,
        borderColor: "border-yellow-500",
        bgColor: darkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        title: t("scanner.result_risky_title"),
        riskLevel: t("scanner.result_risky_risk"),
      };
    } else {
      return {
        status: "unsafe",
        icon: <FiXCircle size={48} className="text-red-500" />,
        borderColor: "border-red-500",
        bgColor: darkMode ? "bg-red-900/30" : "bg-red-50",
        title: t("scanner.result_unsafe_title"),
        riskLevel: t("scanner.result_unsafe_risk"),
      };
    }
  };

  const sendData = async () => {
    if (!input) return;
    setIsLoading(true);
    setScanResult(null);

    try {
      const res = await fetch("http://localhost:5000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.status === 401) { navigate("/pricing"); return; }
      if (res.status === 402) {
        setScanResult({ status: "funds_error", message: data.message || "An error occurred." });
        return;
      }
      if (!res.ok) {
        navigate("/login");
        setScanResult({ status: "error", message: data.message || "An error occurred." });
      } else {
        setScanResult({ type: data.type, message: data.message, score: data.Score, verdict: data.Verdict });
      }
    } catch (e) {
      console.error(e);
      setScanResult({ status: "error", message: "Network error or backend down" });
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const ResultCard = () => {
    if (isLoading) return <Loader />;

    if (!scanResult) {
      return (
        <div className={`flex flex-col items-center p-8 mt-8 text-center rounded-xl border-2 border-dashed ${darkMode ? "text-gray-400 border-gray-600" : "text-gray-600 border-gray-300"}`}>
          <FiShield size={40} />
          <p className="mt-2">{t("scanner.empty_state")}</p>
        </div>
      );
    }

    const textColor = darkMode ? "text-white" : "text-black";

    if (scanResult.status === "error") {
      return (
        <div className={`mt-8 p-6 ${darkMode ? "bg-yellow-900/30" : "bg-yellow-50"} border-l-4 border-yellow-500 rounded-lg`}>
          <div className="flex items-center">
            <FiXCircle size={48} className="text-yellow-500" />
            <div className={`ml-4 ${textColor}`}>
              <h3 className="text-xl font-bold">{t("scanner.result_failed")}</h3>
              <p>{scanResult.message}</p>
            </div>
          </div>
        </div>
      );
    }

    if (scanResult.status === "funds_error") {
      return (
        <div className={`mt-8 p-6 ${darkMode ? "bg-yellow-800/90" : "bg-yellow-50"} border-l-4 border-yellow-500 rounded-lg`}>
          <div className="flex items-center">
            <FiXCircle size={48} className="text-yellow-500" />
            <div className={`ml-4 ${textColor}`}>
              <h3 className="text-xl font-bold">{t("scanner.result_tokens")}</h3>
              <p>{scanResult.message}</p>
            </div>
          </div>
        </div>
      );
    }

    if (scanResult.type === "whitelist") {
      return (
        <div className={`mt-8 p-6 ${darkMode ? "bg-green-800/90" : "bg-green-50"} border-l-4 border-green-500 rounded-lg`}>
          <div className="flex items-center">
            <FiCheckCircle size={48} className="text-green-500" />
            <div className={`ml-4 ${textColor}`}>
              <h3 className="text-xl font-bold">{t("scanner.result_whitelisted")}</h3>
              <p>{scanResult.message}</p>
            </div>
          </div>
        </div>
      );
    }

    if (scanResult.type === "blacklist") {
      return (
        <div className={`mt-8 p-6 ${darkMode ? "bg-red-800/90" : "bg-red-50"} border-l-4 border-red-500 rounded-lg`}>
          <div className="flex items-center">
            <FiAlertTriangle size={48} className="text-red-500" />
            <div className={`ml-4 ${textColor}`}>
              <h3 className="text-xl font-bold">{t("scanner.result_blacklisted")}</h3>
              <p>{scanResult.message}</p>
            </div>
          </div>
        </div>
      );
    }

    const result = getResultByScore(scanResult.score);
    return (
      <div className={`mt-8 p-6 ${result.bgColor} border-l-4 ${result.borderColor} rounded-lg`}>
        <div className="flex items-center">
          {result.icon}
          <div className={`ml-4 ${textColor}`}>
            <h3 className="text-xl font-bold">{result.title}</h3>
            <p>Score: {scanResult.score}/10 - {result.riskLevel}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbarwithlanguage />
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${darkMode ? "bg-[#0a192f]" : "bg-gray-100"}`}>
        <div className="w-full max-w-2xl text-center">
          <h1 className={`mb-2 text-4xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {t("scanner.heading")}
          </h1>
          <p className={`mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {t("scanner.subheading")}
          </p>

          <div className="relative flex items-center">
            <FiLink className="absolute left-4 text-gray-400" size={20} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendData()}
              placeholder={t("scanner.placeholder")}
              className={`w-full py-4 pl-12 pr-32 text-lg border-2 rounded-full ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
            />
            <button onClick={sendData} disabled={isLoading} className="absolute right-2.5 flex items-center px-6 py-2.5 font-semibold text-white bg-[#E87423] rounded-full">
              <FiSearch className="mr-2" />
              {t("scanner.button")}
            </button>
          </div>

          <ResultCard />
        </div>
      </div>
    </>
  );
}
