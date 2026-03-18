import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
const API_BASE = process.env.REACT_APP_API_BASE

const Profile = () => {
  const [profile, setProfile] = useState({ email: "", role: "" });
  const [formData, setFormData] = useState({ oldpassword: "", password: "" });
  const [message, setMessage] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/user/updateProfile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setMessage(data.message);
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(t("profile.delete_confirm"));
    if (!confirmDelete) return;

    const res = await fetch(`${API_BASE}/user/delete-account`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();
    if (res.ok) {
      alert(t("profile.delete_success"));
      window.location.href = "/login";
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl w-96">
        <h2 className="text-2xl font-bold text-center mb-4">{t("profile.heading")}</h2>

        {message && <div className="text-center text-green-400 mb-2">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={profile.email} disabled className="w-full p-2 rounded bg-gray-700" />
          <input value={profile.role} disabled className="w-full p-2 rounded bg-gray-700" />
          <input type="password" name="oldpassword" placeholder={t("profile.old_password")} value={formData.oldpassword} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
          <input type="password" name="password" placeholder={t("profile.new_password")} value={formData.password} onChange={handleChange} className="w-full p-2 rounded bg-gray-700" />
          <button className="w-full bg-blue-600 p-2 rounded">{t("profile.update_password")}</button>
        </form>

        <button onClick={() => window.location.href = "/Dashboard"} className="w-full bg-green-500 mt-4 p-2 rounded hover:bg-green-700">
          {t("profile.go_dashboard")}
        </button>

        <button onClick={handleDeleteAccount} className="w-full bg-red-600 mt-4 p-2 rounded hover:bg-red-700">
          {t("profile.delete_account")}
        </button>
      </div>
    </div>
  );
};

export default Profile;
