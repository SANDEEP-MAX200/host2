import React, { useState, useEffect } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from '../../utils/api.js';

const URLListItem = ({ url, type, onDelete, darkMode, t }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${type === "whitelist" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {type === "whitelist" ? t("url_management.badge_safe") : t("url_management.badge_blocked")}
      </span>
      <span className="truncate font-medium">{url}</span>
    </div>
    <div className="ml-4 flex items-center gap-2">
      <button onClick={() => onDelete(url, type)} className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
);

const AddURLForm = ({ onAdd, darkMode, t }) => {
  const [url, setUrl] = useState("");
  const [listType, setListType] = useState("whitelist");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) { onAdd(url.trim(), listType); setUrl(""); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("url_management.input_placeholder")} className={`flex-1 px-5 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E87423] ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300"}`} />
      <div className="flex gap-2">
        <select value={listType} onChange={(e) => setListType(e.target.value)} className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E87423] ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300"}`}>
          <option value="whitelist">{t("url_management.whitelist")}</option>
          <option value="blacklist">{t("url_management.blacklist")}</option>
        </select>
        <button type="submit" className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("url_management.add_button")}
        </button>
      </div>
    </form>
  );
};

export default function URLManagement() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [whitelist, setWhitelist] = useState([]);
  const [blacklist, setBlacklist] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const access = await fetch(`${API_URL}/admin/checkaccess`, { credentials: "include", method: "GET" });
        if (access.status === 403) { navigate("/blocked"); return; }
        if (!access.ok) { navigate("/login"); return; }

        const wRes = await fetch(`${API_URL}/user/get/whitelist`, { credentials: "include", method: "GET" });
        if (wRes.ok) { const data = await wRes.json(); setWhitelist(data.whitelist || []); }

        const bRes = await fetch(`${API_URL}/user/get/blacklist`, { credentials: "include", method: "GET" });
        if (bRes.ok) { const data = await bRes.json(); setBlacklist(data.blacklist || []); }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleAddURL = async (url, type) => {
    try {
      const endpoint = type === "whitelist" ? `${API_URL}/user/add/whitelist` : `${API_URL}/user/add/blacklist`;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ url }) });
      if (res.ok) {
        type === "whitelist" ? setWhitelist(prev => [...prev, url]) : setBlacklist(prev => [...prev, url]);
      }
    } catch (err) { console.error("Add URL error:", err); }
  };

  const handleDeleteURL = async (url, type) => {
    try {
      const endpoint = type === "whitelist" ? `${API_URL}/user/delete/whitelist` : `${API_URL}/user/delete/blacklist`;
      const res = await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ url }) });
      if (res.ok) {
        type === "whitelist" ? setWhitelist(prev => prev.filter(u => u !== url)) : setBlacklist(prev => prev.filter(u => u !== url));
      }
    } catch (err) {
      console.error("Delete URL error:", err);
      type === "whitelist" ? setWhitelist(prev => prev.filter(u => u !== url)) : setBlacklist(prev => prev.filter(u => u !== url));
    }
  };

  const allListedURLs = [...whitelist.map(url => ({ url, type: "whitelist" })), ...blacklist.map(url => ({ url, type: "blacklist" }))];
  const filteredURLs = allListedURLs.filter(item => {
    const matchesSearch = item.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
        <p className="text-lg animate-pulse">{t("url_management.loading")}</p>
      </div>
    );
  }

  return (
    <>
      <Navbarwithlanguage />
      <div className={`min-h-screen pt-20 p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
        <h1 className="text-4xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-white">
          {t("url_management.heading")}
        </h1>
        <p className={`text-center mb-10 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {t("url_management.subheading")}
        </p>

        <div className="max-w-4xl mx-auto mb-10">
          <AddURLForm onAdd={handleAddURL} darkMode={darkMode} t={t} />
        </div>

        <div className="flex justify-center gap-6 mb-10 flex-wrap">
          <StatCard label={t("url_management.stat_whitelisted")} value={whitelist.length} color="green" darkMode={darkMode} />
          <StatCard label={t("url_management.stat_blacklisted")} value={blacklist.length} color="red" darkMode={darkMode} />
        </div>

        <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder={t("url_management.search_placeholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-12 pr-5 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300"}`} />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300"}`}>
            <option value="all">{t("url_management.filter_all")}</option>
            <option value="whitelist">{t("url_management.filter_whitelist")}</option>
            <option value="blacklist">{t("url_management.filter_blacklist")}</option>
          </select>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-6">{t("url_management.managed_heading")}</h2>
          {filteredURLs.length > 0 ? (
            <div className="space-y-3">
              {filteredURLs.map((item, idx) => (
                <URLListItem key={idx} url={item.url} type={item.type} onDelete={handleDeleteURL} darkMode={darkMode} t={t} />
              ))}
            </div>
          ) : (
            <p className={`text-center py-8 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {t("url_management.empty_state")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

const StatCard = ({ label, value, color, darkMode }) => {
  const colors = { blue: "text-blue-600", green: "text-green-600", red: "text-red-600" };
  return (
    <div className={`w-48 p-6 rounded-2xl text-center shadow-lg transition-transform hover:scale-105 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <h2 className={`text-3xl font-bold ${colors[color]}`}>{value}</h2>
      <p className="mt-2 font-medium">{label}</p>
    </div>
  );
};
