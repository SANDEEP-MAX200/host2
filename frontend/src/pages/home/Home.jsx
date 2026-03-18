import React from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { ShieldCheck, Scan, Eye, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  const features = [
    { icon: <Scan size={40} />, title: t("home.feature1_title"), desc: t("home.feature1_desc") },
    { icon: <Eye size={40} />, title: t("home.feature2_title"), desc: t("home.feature2_desc") },
    { icon: <ShieldCheck size={40} />, title: t("home.feature3_title"), desc: t("home.feature3_desc") },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-[#0a192f] text-gray-300" : "bg-gray-50 text-gray-800"
      }`}
    >
      <Navbarwithlanguage />

      {/* ================= HERO SECTION ================= */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl top-[-200px] left-[-200px]" />
          <div className="absolute w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl bottom-[-200px] right-[-200px]" />
        </div>

        <h1
          className={`text-4xl md:text-6xl font-extrabold mb-6 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {t("home.hero_heading")}
        </h1>

        <p className="max-w-2xl text-lg md:text-xl mb-10 text-gray-400">
          {t("home.hero_description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/scanner"
            className="px-8 py-4 rounded-full bg-[#E87423] hover:bg-[#E87423]/80 text-white font-semibold transition flex items-center justify-center gap-2"
          >
            {t("home.cta_scan")} <ArrowRight />
          </a>
          <a
            href="/awareness"
            className={`px-8 py-4 rounded-full border font-semibold transition ${
              darkMode
                ? "border-gray-600 hover:bg-white/10"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {t("home.cta_learn")}
          </a>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="py-24 px-6">
        <h2 className="text-4xl font-bold text-center mb-16">
          {t("home.why_heading")}
        </h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl shadow-md transition hover:-translate-y-2 hover:shadow-xl ${
                darkMode ? "bg-[#112240]" : "bg-white"
              }`}
            >
              <div className="text-[#E87423] mb-4">{f.icon}</div>
              <h3
                className={`text-xl font-bold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {f.title}
              </h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= IMAGE + CONTENT SECTION ================= */}
      <section className="py-12 px-6">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
              alt="Cyber Security"
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-6">
              {t("home.platform_heading")}
            </h2>
            <p className="text-gray-400 mb-6">
              {t("home.platform_desc")}
            </p>
            <a
              href="/scanner"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
            >
              {t("home.try_scanner")} <ArrowRight />
            </a>
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="py-8 px-6 text-center">
        <div
          className={`max-w-4xl mx-auto p-12 rounded-3xl shadow-lg ${
            darkMode ? "bg-[#112240]" : "bg-white"
          }`}
        >
          <h2 className="text-4xl font-bold mb-6">
            {t("home.cta_heading")}
          </h2>
          <p className="text-gray-400 mb-8">
            {t("home.cta_desc")}
          </p>
          <a
            href="/login"
            className="px-10 py-2 rounded-full bg-[#E87423] hover:bg-[#E87423]/80 text-white font-semibold transition"
          >
            {t("home.get_started")}
          </a>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer
        className={`py-3 text-center transition ${
          darkMode ? "bg-[#00053A] text-gray-400" : "bg-[#00053A] text-white"
        }`}
      >
        <p className="font-medium">{t("home.footer")} 🌐</p>
        <p className="text-sm mt-1">{t("home.copyright")}</p>
      </footer>
    </div>
  );
}
