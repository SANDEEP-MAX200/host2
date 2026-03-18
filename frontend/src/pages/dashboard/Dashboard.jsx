import React, { useState, useEffect } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";
const API_BASE = process.env.REACT_APP_API_BASE

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const formatDate = (dateString) => {
  if (!dateString) return "yyyy/mm/dd";
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const ScanResultCard = ({ result, darkMode, t }) => {
  const verdictStyles = {
    safe: "bg-green-100 text-green-700",
    potentially_risky: "bg-yellow-100 text-yellow-700",
    unsafe: "bg-red-100 text-red-700",
  };

  return (
    <div className={`rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <h2 className="text-lg font-semibold mb-3 break-words">{result.url}</h2>

      <div className="mb-3">
        <span className="font-semibold mr-2">{t("dashboard.status")}:</span>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${verdictStyles[result.verdict]}`}>
          {result.verdict === "Safe" ? t("dashboard.verdict_safe") : result.verdict === "potentially_risky" ? t("dashboard.verdict_risky") : t("dashboard.verdict_unsafe")}
        </span>
      </div>

      <p className="mb-3">
        <span className="font-semibold">{t("dashboard.score")}:</span>{" "}
        <span className="font-medium">{result.Score}</span>
      </p>

      <div className={`text-sm mb-4 space-y-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        <p><span className="font-semibold">{t("dashboard.scanned_by")}:</span> APA</p>
        <p><span className="font-semibold">{t("dashboard.scanned_at")}:</span> {formatDate(result.scannedAt)}</p>
      </div>

      <div className={`h-px mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

      <div>
        {result.verdict === "Safe" && <p className="text-green-600 font-medium leading-relaxed">{t("dashboard.precaution_safe")}</p>}
        {result.verdict === "Potentially_risky" && <p className="text-yellow-600 font-medium leading-relaxed">{t("dashboard.precaution_risky")}</p>}
        {result.verdict === "Unsafe" && <p className="text-red-600 font-medium leading-relaxed">{t("dashboard.precaution_unsafe")}</p>}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { email } = useParams();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safeCount, setSafeCount] = useState(0);
  const [unsafeCount, setUnsafeCount] = useState(0);
  const [showPeriodAnalytics, setShowPeriodAnalytics] = useState(false);

  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { start: toISO(start), end: toISO(end) };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState({ totalScans: 0, blockedUnsafe: 0, potentiallyRisky: 0, unsafe: 0, safe: 0 });

  const fetchAnalytics = async (start, end) => {
    try {
      const res = await fetch(`${API_BASE}/user/analytics/period?startDate=${start}&endDate=${end}`, { credentials: "include" });
      const data = await res.json();
      setStats({ totalScans: data.totalScans, blockedUnsafe: data.blockedUnsafe, potentiallyRisky: data.potentiallyRisky || 0, unsafe: data.unsafe || 0, safe: data.safe || 0 });
    } catch (err) { console.error("Failed to fetch analytics", err); }
  };

  const handleFilter = () => {
    if (!startDate || !endDate) return alert("Please select both dates");
    fetchAnalytics(startDate, endDate);
    setShowPeriodAnalytics(true);
  };

  useEffect(() => { fetchAnalytics(defaultDates.start, defaultDates.end); }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const endpoint = email ? `${API_BASE}/admin/users/view/${encodeURIComponent(email)}` : `${API_BASE}/dashboard`;
        const res = await fetch(endpoint, { credentials: "include" });
        if (res.status === 401) { navigate("/pricing"); }
        if (res.status === 403) { navigate("/login", { replace: true }); return; }
        if (res.status === 404) { navigate("/blocked"); return; }
        const data = await res.json();
        setResults(data.results || []);
        setSafeCount(data.safe_count || 0);
        setUnsafeCount(data.unsafe_count || 0);
      } catch (err) { console.error("Dashboard fetch error:", err); }
      finally { setLoading(false); }
    };
    fetchResults();
  }, [navigate, email]);

  const filteredResults = results.filter((r) => r.url.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalScans = safeCount + unsafeCount;

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
        <p className="text-lg animate-pulse">{t("dashboard.loading")}</p>
      </div>
    );
  }

  return (
    <>
      <Navbarwithlanguage />
      <div className={`min-h-screen pt-20 p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
        <h1 className={`text-4xl font-extrabold mb-10 text-center ${darkMode ? "text-white" : "text-black"}`}>
          {t("dashboard.heading")}
        </h1>

        <div className="flex justify-center mb-10">
          <input type="text" placeholder={t("dashboard.search_placeholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`px-5 py-3 w-96 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E87423] ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300"}`} />
        </div>

        <div className="max-w-4xl mx-auto mb-12 space-y-6">
          <div className={`flex flex-wrap gap-4 items-end p-4 rounded-xl shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex-1 min-w-[150px] relative">
              <label className="block text-sm font-medium mb-1">{t("dashboard.start_date")}</label>
              <div className="relative">
                <input type="text" readOnly value={formatDate(startDate)} placeholder={t("dashboard.date_placeholder")} className={`w-full p-2 rounded-lg border cursor-pointer ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`} onClick={(e) => e.target.nextSibling.showPicker()} />
                <input type="date" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer -z-10" onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 min-w-[150px] relative">
              <label className="block text-sm font-medium mb-1">{t("dashboard.end_date")}</label>
              <div className="relative">
                <input type="text" readOnly value={formatDate(endDate)} placeholder={t("dashboard.date_placeholder")} className={`w-full p-2 rounded-lg border cursor-pointer ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`} onClick={(e) => e.target.nextSibling.showPicker()} />
                <input type="date" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer -z-10" onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <button onClick={handleFilter} className="bg-[#E87423] text-white px-6 py-2 rounded-lg hover:bg-[#E87423]/80 transition font-semibold">
              {t("dashboard.apply_filter")}
            </button>
          </div>

          {showPeriodAnalytics && (
            <div>
              <div className="flex justify-center gap-10 flex-wrap">
                <SummaryCard label={t("dashboard.scans_in_period")} value={stats.totalScans} color="blue" darkMode={darkMode} />
                <SummaryCard label={t("dashboard.blocked_in_period")} value={stats.blockedUnsafe} color="red" darkMode={darkMode} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <h3 className="text-lg font-semibold mb-4 text-center">{t("dashboard.period_overview")}</h3>
                  <div className="h-64">
                    <Bar
                      data={{ labels: [t("dashboard.total_scans"), t("dashboard.blocked_unsafe")], datasets: [{ label: "Count", data: [stats.totalScans, stats.blockedUnsafe], backgroundColor: [darkMode ? "rgba(96,165,250,0.7)" : "rgba(37,99,235,0.7)", darkMode ? "rgba(248,113,113,0.7)" : "rgba(220,38,38,0.7)"], borderRadius: 6 }] }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: darkMode ? "#d1d5db" : "#374151" }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: darkMode ? "#d1d5db" : "#374151", stepSize: 1 }, grid: { color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" } } } }}
                    />
                  </div>
                </div>

                <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <h3 className="text-lg font-semibold mb-4 text-center">{t("dashboard.verdict_distribution")}</h3>
                  <div className="h-64 flex items-center justify-center">
                    {stats.totalScans === 0 ? (
                      <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("dashboard.no_data")}</p>
                    ) : (
                      <Doughnut
                        data={{ labels: [t("dashboard.verdict_safe"), t("dashboard.verdict_risky"), t("dashboard.verdict_unsafe")], datasets: [{ data: [stats.safe, stats.potentiallyRisky, stats.unsafe], backgroundColor: ["#22c55e", "#eab308", "#ef4444"], borderWidth: 0, hoverOffset: 8 }] }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: darkMode ? "#d1d5db" : "#374151", padding: 16, usePointStyle: true } } }, cutout: "60%" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 mb-12 flex-wrap">
          <SummaryCard label={t("dashboard.total_scans")} value={totalScans} color="blue" darkMode={darkMode} />
          <SummaryCard label={t("dashboard.safe_urls")} value={safeCount} color="green" darkMode={darkMode} />
          <SummaryCard label={t("dashboard.threat_urls")} value={unsafeCount} color="red" darkMode={darkMode} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResults.length ? (
            [...filteredResults].reverse().map((res, idx) => (
              <ScanResultCard key={idx} result={res} darkMode={darkMode} t={t} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 italic">
              {t("dashboard.no_results")} "{searchQuery}"
            </p>
          )}
        </div>
      </div>
    </>
  );
}

const SummaryCard = ({ label, value, color, darkMode }) => {
  const colors = { blue: "text-blue-600", green: "text-green-600", red: "text-red-600" };
  return (
    <div className={`w-56 p-6 rounded-2xl text-center shadow-lg transition-transform hover:scale-105 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <h2 className={`text-4xl font-bold ${colors[color]}`}>{value}</h2>
      <p className="mt-2 font-medium">{label}</p>
    </div>
  );
};
