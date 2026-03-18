import React, { useState, useEffect } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const API_BASE = process.env.REACT_APP_API_BASE

export default function URLRequestPage() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [url, setUrl] = useState("");
  const [listType, setListType] = useState("whitelist");
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const whitelistReasons = [
    t("url_request.whitelist_r1"), t("url_request.whitelist_r2"),
    t("url_request.whitelist_r3"), t("url_request.whitelist_r4"),
    t("url_request.whitelist_r5"), t("url_request.whitelist_r6"),
  ];

  const blacklistReasons = [
    t("url_request.blacklist_r1"), t("url_request.blacklist_r2"),
    t("url_request.blacklist_r3"), t("url_request.blacklist_r4"),
    t("url_request.blacklist_r5"), t("url_request.blacklist_r6"),
  ];

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/auth/me`, { credentials: "include" });
        if (res.status === 401) { navigate("/login"); return; }
        if (res.status === 403) { navigate("/blocked"); return; }
        if (!res.ok) { navigate("/blocked"); return; }
      } catch {
        navigate("/login");
      } finally {
        setCheckingRole(false);
      }
    };
    checkRole();
  }, []);

  useEffect(() => { setReasons([]); }, [listType]);

  const toggleReason = (reason) => {
    setReasons((prev) => prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]);
  };

  const handleSubmit = async () => {
    if (!url || reasons.length === 0) {
      alert(t("url_request.error_empty"));
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/url/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url, listType, reasons }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(t("url_request.success"));
        setUrl("");
        setReasons([]);
        setListType("whitelist");
      } else {
        alert(data.message || t("url_request.error_failed"));
      }
    } catch {
      alert(t("url_request.error_server"));
    } finally {
      setLoading(false);
    }
  };

  const currentReasons = listType === "whitelist" ? whitelistReasons : blacklistReasons;

  if (checkingRole) {
    return <div className="h-screen flex items-center justify-center">{t("url_request.checking")}</div>;
  }

  return (
    <>
      <Navbarwithlanguage />
      <div className={`min-h-screen pt-20 p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">{t("url_request.heading")}</h1>

          <div className={`p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <label className="block mb-2 font-semibold">{t("url_request.url_label")}</label>
            <input type="text" placeholder={t("url_request.url_placeholder")} value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border mb-4" />

            <label className="block mb-2 font-semibold">{t("url_request.type_label")}</label>
            <select value={listType} onChange={(e) => setListType(e.target.value)} className="w-full px-4 py-3 rounded-xl border mb-6">
              <option value="whitelist">{t("url_request.whitelist_option")}</option>
              <option value="blacklist">{t("url_request.blacklist_option")}</option>
            </select>

            <label className="block mb-3 font-semibold">
              {listType === "whitelist" ? t("url_request.reason_whitelist") : t("url_request.reason_blacklist")}
            </label>

            <div className="space-y-3 mb-6">
              {currentReasons.map((reason, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={reasons.includes(reason)} onChange={() => toggleReason(reason)} />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-[#E87423]">
              {loading ? t("url_request.sending") : t("url_request.send_button")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
