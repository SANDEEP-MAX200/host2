import { useState } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

function PricingCard({ plan, darkMode, isPopular, onSubscribe, loadingPlan, t }) {
  return (
    <div className={`relative rounded-3xl p-8 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col ${darkMode ? "bg-gray-800 backdrop-blur border-gray-700" : "bg-white border-gray-200"} ${isPopular ? "ring-2 ring-[#E87423] scale-105 shadow-xl" : ""}`}>
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold rounded-full bg-[#E87423] text-white shadow">
          {t("pricing.popular_badge")}
        </span>
      )}

      <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>

      <div className="mb-6">
        <span className="text-4xl font-extrabold">¥{plan.price}</span>
        <span className="text-sm ml-1 opacity-70">{t("pricing.per_month")}</span>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span>{feature.included ? "✓" : "✕"}</span>
            <span className={feature.included ? "" : "opacity-50"}>{feature.text}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan)}
        disabled={loadingPlan === plan.name}
        className={`w-full py-3 rounded-xl font-semibold transition ${isPopular ? "bg-[#E87423] hover:bg-[#E87423]/80 text-white" : darkMode ? "bg-gray-900 border-gray-700 hover:bg-gray-700 text-white" : "bg-gray-900 hover:bg-black text-white"}`}
      >
        {loadingPlan === plan.name ? t("pricing.processing") : t("pricing.subscribe")}
      </button>
    </div>
  );
}

export default function Pricing() {
  const [planType, setPlanType] = useState("Individual");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  const handleSubscribe = async (plan) => {
    if (plan.price === "Free") { window.location.href = "/scanner"; return; }
    setLoadingPlan(plan.name);
    try {
      const response = await fetch("http://localhost:5000/api/payment/create-checkout-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: plan.name, price: plan.price, planType }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || t("pricing.error_generic")); setLoadingPlan(null); return; }
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert(t("pricing.error_server"));
      setLoadingPlan(null);
    }
  };

  const individualPlans = [
    { name: "Light", price: "980", features: [{ text: "50 credits per month", included: true }, { text: "Ads included", included: true }, { text: "Dashboard", included: false }, { text: "Priority support", included: false }] },
    { name: "Basic", price: "1980", features: [{ text: "200 credits per month", included: true }, { text: "No ads", included: true }, { text: "Dashboard", included: false }, { text: "Priority support", included: false }] },
    { name: "Premium", price: "3980", isPopular: true, features: [{ text: "500 credits per month", included: true }, { text: "No ads", included: true }, { text: "Dashboard included", included: true }, { text: "Priority support", included: true }] },
  ];

  const businessPlans = [
    { name: "Light", price: "30000", features: [{ text: "1,000 credits per month", included: true }, { text: "Dashboard access", included: true }, { text: "Admin panel", included: true }, { text: "User management", included: true }] },
    { name: "Basic", price: "100000", isPopular: true, features: [{ text: "10,000 credits per month", included: true }, { text: "Dashboard access", included: true }, { text: "Admin panel", included: true }, { text: "User management", included: true }] },
    { name: "Premium", price: "250000", features: [{ text: "30,000 credits per month", included: true }, { text: "API access", included: true }, { text: "Custom integrations", included: true }, { text: "Dedicated support", included: true }] },
  ];

  const currentPlans = planType === "Individual" ? individualPlans : businessPlans;

  return (
    <div className={`min-h-screen pt-16 px-6 pb-20 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
      <Navbarwithlanguage />

      <div className="text-center mb-16">
        <h1 className={`text-4xl font-extrabold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          {t("pricing.heading")}
        </h1>
        <p className={`text-lg max-w-2xl mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {t("pricing.subheading")}
        </p>
      </div>

      <div className="flex justify-center mb-14">
        <div className={`flex rounded-full p-1 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
          {[{ key: "Individual", label: t("pricing.individual") }, { key: "Business", label: t("pricing.business") }].map(({ key, label }) => (
            <button key={key} onClick={() => setPlanType(key)} className={`px-6 py-2 rounded-full text-sm font-medium transition ${planType === key ? "bg-[#E87423] text-white" : darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 max-w-6xl mx-auto md:grid-cols-2 lg:grid-cols-3">
        {currentPlans.map((plan, idx) => (
          <PricingCard key={idx} plan={plan} darkMode={darkMode} isPopular={plan.isPopular || false} onSubscribe={handleSubscribe} loadingPlan={loadingPlan} t={t} />
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-24">
        <h2 className="text-3xl font-bold mb-6 text-center">{t("pricing.faq_heading")}</h2>
        <div className="space-y-4">
          <div><h3 className="font-semibold">{t("pricing.faq1_q")}</h3><p className="text-sm opacity-80">{t("pricing.faq1_a")}</p></div>
          <div><h3 className="font-semibold">{t("pricing.faq2_q")}</h3><p className="text-sm opacity-80">{t("pricing.faq2_a")}</p></div>
          <div><h3 className="font-semibold">{t("pricing.faq3_q")}</h3><p className="text-sm opacity-80">{t("pricing.faq3_a")}</p></div>
        </div>
      </div>
    </div>
  );
}
