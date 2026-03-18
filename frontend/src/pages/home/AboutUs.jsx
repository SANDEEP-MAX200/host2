import React from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function AboutUs() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-800"
      }`}
    >
      <Navbarwithlanguage />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 space-y-10">
        <header>
          <h1
            className={`text-4xl font-bold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {t("about.heading")}
          </h1>
          <p className="text-lg text-gray-400 max-w-4xl">
            {t("about.intro")}
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-2">{t("about.who_heading")}</h2>
          <p className="leading-relaxed">{t("about.who_p1")}</p>
          <p className="leading-relaxed mt-2">{t("about.who_p2")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">{t("about.problem_heading")}</h2>
          <p className="leading-relaxed">{t("about.problem_p1")}</p>
          <p className="leading-relaxed mt-2">{t("about.problem_p2")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">{t("about.what_heading")}</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t("about.what_1")}</li>
            <li>{t("about.what_2")}</li>
            <li>{t("about.what_3")}</li>
            <li>{t("about.what_4")}</li>
            <li>{t("about.what_5")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">{t("about.philosophy_heading")}</h2>
          <p className="leading-relaxed">{t("about.philosophy_p1")}</p>
          <p className="leading-relaxed mt-2">{t("about.philosophy_p2")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">{t("about.ahead_heading")}</h2>
          <p className="leading-relaxed">{t("about.ahead_p1")}</p>
          <p className="leading-relaxed mt-2">{t("about.ahead_p2")}</p>
        </section>

        <section
          className={`rounded-xl p-6 border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h3 className="text-xl font-semibold mb-2">{t("about.cta_heading")}</h3>
          <p className="mb-4">{t("about.cta_desc")}</p>
          <a
            href="/scanner"
            className="inline-block px-6 py-3 rounded-lg bg-[#E87423] hover:bg-[#E87423]/80 text-white font-medium transition"
          >
            {t("about.cta_button")}
          </a>
        </section>
      </div>

      <footer
        className={`py-4 text-center text-sm transition ${
          darkMode ? "bg-[#00053A] text-gray-400" : "bg-[#00053A] text-white"
        }`}
      >
        {t("about.footer")}
      </footer>
    </div>
  );
}
