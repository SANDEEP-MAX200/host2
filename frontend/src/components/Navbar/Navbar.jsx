import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
  User,
  Coins
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useTranslation } from "react-i18next";

export default function Navbarwithlanguage() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isadmin, setisadmin] = useState(false);

  const [isuser, setisuser] = useState(false);
  const [isindividual, setisindividual] = useState(false);
  const [tokenbalance, settokenbalance] = useState(0);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === "en" ? "ja" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/check", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        console.log("Auth check response:", data);

        setIsLoggedIn(data.loggedIn);
        setisadmin(data.user_role === "Business-Admin");
        setisuser(data.user_role === "Business-User");
        setisindividual(data.user_role === "Individual-User");
        settokenbalance(data.token_balance);


      } catch (err) {
        console.error("Auth check failed:", err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const logouthandler = async () => {
    try {
      await fetch("http://localhost:5000/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch {
      console.log("Logout error");
    }

    setIsLoggedIn(false);
    navigate("/login");
  };

  const navItems = [
    { path: "/scanner", label: t("nav.scanner") },
    { path: "/dashboard", label: t("nav.dashboard") },
    { path: "/awareness", label: t("nav.awareness") },

    ...(!isadmin && !isuser && !isindividual
      ? [{ path: "/pricing", label: t("nav.pricing") }]
      : []),

    ...(isLoggedIn
      ? [
          ...(isuser || isadmin || isindividual
            ? [{ path: "/url-management", label: t("nav.urlLists") }]
            : []),

          { path: "/buy-tokens", label: t("nav.buyTokens") },

          ...(isuser
            ? [{ path: "/request_admin", label: t("nav.request") }]
            : []),

          ...(isadmin
            ? [{ path: "/admin", label: t("nav.admin") }]
            : []),
        ]
      : [
          { path: "/login", label: t("nav.login") },
          { path: "/signup", label: t("nav.signup") },
        ]),
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-colors duration-300 bg-white/80 dark:bg-[#00053A] backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-[#E87423]"
          >
            <ShieldCheck size={28} />
            <span>{t("nav.brand")}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `font-medium transition-colors duration-300 ${
                    isActive
                      ? "text-[#E87423] dark:text-[#E87423]"
                      : "text-slate-600 dark:text-slate-300 hover:text-[#E87423] dark:hover:text-[#E87423]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Token Balance */}
            {isLoggedIn && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-cyan-500/10 text-[#E87423] dark:text-[#E87423] text-sm font-semibold">
                <Coins size={16} />
                {tokenbalance}
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-3 py-1 rounded-full text-sm font-semibold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {i18n.language === "en" ? "日本語" : "English"}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Profile Dropdown */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <User className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-[#0a192f] border border-slate-200 dark:border-slate-700">

                    <Link
                      to="/user/profile"
                      className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setProfileOpen(false)}
                    >
                      {t("nav.profile")}
                    </Link>

                    <Link
                      to="/url-management"
                      className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setProfileOpen(false)}
                    >
                      {t("nav.urlLists")}
                    </Link>

                    <button
                      onClick={logouthandler}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <LogOut size={16} /> {t("nav.logout")}
                    </button>

                  </div>
                )}
              </div>
            )}

          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 dark:text-slate-300"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur-md p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md font-medium ${
                  isActive
                    ? "bg-indigo-100 dark:bg-cyan-500/10 text-[#E87423] dark:text-[#E87423]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Mobile Language Toggle */}
          <button
            onClick={toggleLang}
            className="block w-full text-left px-3 py-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
          >
            {i18n.language === "en" ? "日本語" : "English"}
          </button>

          {isLoggedIn && (
            <button
              onClick={logouthandler}
              className="block w-full text-left px-3 py-2 rounded-md text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t("nav.logout")}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
