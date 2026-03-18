import React, { useEffect, useState } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar.jsx";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const AwarenessPage = () => {
  const [target, setTargetUrl] = useState("");
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetParam = params.get("target");
    if (targetParam) setTargetUrl(decodeURIComponent(targetParam));
  }, []);

  const handletarget = () => {
    if (!target) return;
    const trustedUrl = `${target}#trusted=1`;
    window.location.href = trustedUrl;
  };

  const types = [
    { title: t("awareness.type1_title"), desc: t("awareness.type1_desc"), consequences: t("awareness.type1_consequence"), prevention: t("awareness.type1_prevention") },
    { title: t("awareness.type2_title"), desc: t("awareness.type2_desc"), consequences: t("awareness.type2_consequence"), prevention: t("awareness.type2_prevention") },
    { title: t("awareness.type3_title"), desc: t("awareness.type3_desc"), consequences: t("awareness.type3_consequence"), prevention: t("awareness.type3_prevention") },
    { title: t("awareness.type4_title"), desc: t("awareness.type4_desc"), consequences: t("awareness.type4_consequence"), prevention: t("awareness.type4_prevention") },
    { title: t("awareness.type5_title"), desc: t("awareness.type5_desc"), consequences: t("awareness.type5_consequence"), prevention: t("awareness.type5_prevention") },
    { title: t("awareness.type6_title"), desc: t("awareness.type6_desc"), consequences: t("awareness.type6_consequence"), prevention: t("awareness.type6_prevention") },
  ];

  const tips = [
    t("awareness.trick1"), t("awareness.trick2"), t("awareness.trick3"),
    t("awareness.trick4"), t("awareness.trick5"), t("awareness.trick6"),
  ];

  return (
    <div className={`font-sans min-h-screen transition-colors duration-500 ${darkMode ? "bg-black text-gray-300" : "bg-gray-50 text-gray-800"}`}>
      <Navbarwithlanguage />

      {target && (
        <div className={`text-center p-4 font-semibold mt-16 border-b transition ${darkMode ? "bg-red-900/30 text-red-300 border-red-700" : "bg-red-100 text-red-900 border-red-400"}`}>
          {t("awareness.warning_banner")}
          <br />
          <button onClick={handletarget} className="mt-3 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">
            {t("awareness.proceed_anyway")}
          </button>
        </div>
      )}

      <section className={`p-8 mt-16 transition ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <h2 className={`text-4xl font-bold mb-3 ${darkMode ? "text-white" : ""}`}>
          {t("awareness.heading")}
        </h2>
        <p className="mb-4">{t("awareness.intro")}</p>
        <p className="font-medium">{t("awareness.trivia")}</p>
      </section>

      <section className="p-8">
        <h2 className="text-3xl font-semibold mb-8 text-center">{t("awareness.types_heading")}</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {types.map((item, i) => (
            <div key={i} className={`rounded-xl p-6 shadow-md transition hover:shadow-xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`}>{item.title}</h3>
              <p className="mb-2">{item.desc}</p>
              <p className="text-blue-500 mb-1"><strong>Consequences:</strong> {item.consequences}</p>
              <p className="text-teal-500"><strong>Prevention:</strong> {item.prevention}</p>
            </div>
          ))}
        </div>

        <div className={`max-w-4xl mx-auto rounded-xl shadow-md p-8 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
          <h3 className="text-2xl font-bold mb-6 text-center">{t("awareness.tricks_heading")}</h3>
          <ul className="list-disc pl-6 space-y-3">
            {tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </div>
      </section>

      <section className="p-8">
        <h2 className="text-3xl font-semibold mb-8 text-center">{t("awareness.resources_heading")}</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className={`rounded-xl shadow-md p-6 text-center ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <h3 className="text-2xl font-semibold mb-3">{t("awareness.quiz_heading")}</h3>
            <p className="mb-4">{t("awareness.quiz_desc")}</p>
            <a href="https://phishingquiz.withgoogle.com" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg font-medium transition bg-[#E87423] hover:bg-[#E87423]/80 text-white">
              {t("awareness.quiz_button")}
            </a>
          </div>
        </div>
      </section>

      <footer className={`p-6 text-center transition ${darkMode ? "bg-[#00053A] text-gray-400" : "bg-[#00053A] text-white"}`}>
        <p className="font-medium mb-1">{t("awareness.footer")}</p>
        <p className="text-sm">{t("awareness.copyright")}</p>
      </footer>
    </div>
  );
};

export default AwarenessPage;
