import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Coins, Zap, CheckCircle } from "lucide-react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useTranslation } from "react-i18next";

const PACKAGES = [
  { id: "100", label: "Starter", tokens: 100, price: 500, descKey: "buy_tokens.starter_desc", popular: false },
  { id: "300", label: "Value",   tokens: 300, price: 1200, descKey: "buy_tokens.value_desc",   popular: true  },
  { id: "1000", label: "Power",  tokens: 1000, price: 3500, descKey: "buy_tokens.power_desc",  popular: false },
];

function TokenCard({ pkg, darkMode, onPurchase, loading, t }) {
  const perToken = (pkg.price / pkg.tokens).toFixed(1);

  return (
    <div className={`relative rounded-3xl p-8 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col ${darkMode ? "bg-gray-900/70 backdrop-blur border-gray-700" : "bg-white border-gray-200"} ${pkg.popular ? "ring-2 ring-[#E87423] scale-105 shadow-xl" : ""}`}>
      {pkg.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold rounded-full bg-[#E87423] text-white shadow">
          {t("buy_tokens.popular_badge")}
        </span>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Coins size={22} className="text-[#E87423]" />
        <h3 className="text-2xl font-bold">{pkg.label}</h3>
      </div>

      <div className="mb-2">
        <span className="text-4xl font-extrabold">{pkg.tokens.toLocaleString()}</span>
        <span className="text-sm ml-2 opacity-70">{t("buy_tokens.tokens_unit")}</span>
      </div>

      <p className="text-sm opacity-50 mb-6">{t(pkg.descKey)}</p>

      <ul className="space-y-2 mb-8 flex-1">
        <li className="flex items-center gap-2 text-sm">
          <CheckCircle size={15} className="text-green-500 shrink-0" />
          <span>{t("buy_tokens.premium_balance")}</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <CheckCircle size={15} className="text-green-500 shrink-0" />
          <span>¥{perToken} {t("buy_tokens.per_token")}</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <CheckCircle size={15} className="text-green-500 shrink-0" />
          <span>{t("buy_tokens.never_expires")}</span>
        </li>
      </ul>

      <div className="mb-4 text-center">
        <span className="text-2xl font-bold">¥{pkg.price.toLocaleString()}</span>
        <span className="text-sm ml-1 opacity-60">{t("buy_tokens.one_time")}</span>
      </div>

      <button
        onClick={() => onPurchase(pkg)}
        disabled={loading === pkg.id}
        className={`w-full py-3 rounded-xl font-semibold transition ${pkg.popular ? "bg-[#E87423] hover:bg-[#E87423]/80 text-white" : darkMode ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-[#00053A] hover:bg-black text-white"} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading === pkg.id ? t("buy_tokens.redirecting") : t("buy_tokens.buy_now")}
      </button>
    </div>
  );
}

export default function BuyTokens() {
  const [tokenBalance, setTokenBalance] = useState(null);
  const [loading, setLoading] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();
  const purchaseSuccess = searchParams.get("status") === "success";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/check", { credentials: "include" });
        const data = await res.json();
        if (!data.loggedIn) { navigate("/login"); return; }
        setTokenBalance(data.token_balance);
        setAuthChecked(true);
      } catch {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const handlePurchase = async (pkg) => {
    setLoading(pkg.id);
    try {
      const res = await fetch("http://localhost:5000/api/payment/create-token-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  };

  if (!authChecked) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      <Navbarwithlanguage />

      <div className="max-w-5xl mx-auto px-6 py-16">
        {purchaseSuccess && (
          <div className="flex items-center gap-3 mb-10 px-6 py-4 rounded-2xl bg-green-500/15 border border-green-500/40 text-green-400">
            <Zap size={20} className="shrink-0" />
            <span className="font-medium">{t("buy_tokens.success")}</span>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coins size={32} className="text-[#E87423]" />
            <h1 className="text-4xl font-extrabold">{t("buy_tokens.heading")}</h1>
          </div>
          <p className="text-lg opacity-60 mb-4">{t("buy_tokens.subheading")}</p>
          {tokenBalance !== null && (
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border ${darkMode ? "bg-gray-800 border-gray-700 text-[#E87423]" : "bg-white border-gray-200 text-[#00053A]"}`}>
              <Coins size={15} />
              {t("buy_tokens.current_balance")} <span className="font-bold">{tokenBalance} {t("buy_tokens.tokens_unit")}</span>
            </div>
          )}
        </div>

        <div className={`mb-10 px-6 py-4 rounded-2xl border text-sm opacity-70 ${darkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"}`}>
          <p className="font-semibold mb-1">{t("buy_tokens.cost_heading")}</p>
          <ul className="flex flex-wrap gap-4">
            <li>{t("buy_tokens.cost_safe")}</li>
            <li>{t("buy_tokens.cost_risky")}</li>
            <li>{t("buy_tokens.cost_unsafe")}</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {PACKAGES.map((pkg) => (
            <TokenCard key={pkg.id} pkg={pkg} darkMode={darkMode} onPurchase={handlePurchase} loading={loading} t={t} />
          ))}
        </div>

        <p className="text-center text-xs opacity-40 mt-10">{t("buy_tokens.footer_note")}</p>
      </div>
    </div>
  );
}
