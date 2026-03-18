import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import Scanner from "./pages/scanner/Scanner.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import AwarenessPage from "./pages/awareness/AwarenessPage.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import Profile from "./pages/profile/EditProfile.jsx";
import Otp_verification from "./pages/auth/ForgotPassword.jsx";
import Forgot_password_change from "./pages/auth/ResetPassword.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import Pricing from "./pages/pricing/Pricing.jsx";
import URLManagement from "./pages/urlManagement/URLManagement.jsx";
import UnauthorizedAccess from "./pages/blocked/Blocked.jsx";
import AdminRequest from "./pages/admin/AdminRequest.jsx";
import LandingPage from "./pages/home/Home.jsx";
import AboutUs from "./pages/home/AboutUs.jsx";
import BuyTokens from "./pages/tokens/BuyTokens.jsx";

// Page transition wrapper
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.1 }}
    style={{ width: "100%", height: "100%" }}
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/awareness" element={<PageWrapper><AwarenessPage /></PageWrapper>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user/profile" element={<Profile />} />
        <Route path="/forgot" element={<Otp_verification />} />
        <Route path="/changepass" element={<Forgot_password_change />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
        <Route path="/url-management" element={<PageWrapper><URLManagement /></PageWrapper>} />
        <Route path="/blocked" element={<PageWrapper><UnauthorizedAccess /></PageWrapper>} />
        <Route path="/request_admin" element={<AdminRequest />} />
        <Route path="/admin/users/view/:email" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/AboutUs" element={<PageWrapper><AboutUs /></PageWrapper>} />
        <Route path="/buy-tokens" element={<PageWrapper><BuyTokens /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}
