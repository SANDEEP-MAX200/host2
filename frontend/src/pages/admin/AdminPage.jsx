import React, { useState, useEffect } from "react";
import Navbarwithlanguage from "../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { MdDelete } from "react-icons/md";
import { FaRegEye, FaRegEyeSlash, FaUserShield } from "react-icons/fa";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
const API_BASE = process.env.REACT_APP_API_BASE

const SummaryCard = ({ value, darkMode, icon: Icon, label }) => (
  <div className={`flex items-center gap-5 p-6 rounded-2xl border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
    <div className="p-4 rounded-xl bg-[#E87423]/90 text-[#E87423]">
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  </div>
);

const UserCard = ({ user, darkMode, onDelete, onTogglePermission, onOpenDashboard, t }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div onClick={() => onOpenDashboard(user)} className={`relative rounded-2xl border p-6 shadow-sm hover:shadow-lg transition cursor-pointer ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{user.name || "No Username"}</h3>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">{user.email}</p>
            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="sr-only peer" checked={!!user.canManageUrls} onChange={(e) => { e.stopPropagation(); onTogglePermission(user); }} />
              <div className="w-9 h-5 bg-gray-400 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-2"></div>
            </label>
          </div>
          <p className="text-sm text-[#E87423] font-medium">{user.dept || "No Department"}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(user); }} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition">
          <MdDelete size={20} />
        </button>
      </div>
      <div className={`mt-4 pt-4 border-t text-sm space-y-1 ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
        <p><span className="font-medium">{t("admin.joined")}</span> {formatDate(user.createdAt || new Date())}</p>
        <p><span className="font-medium">{t("admin.safe_scans")}</span> <span className="font-bold">{user.count?.safe || 0}</span></p>
        <p><span className="font-medium">{t("admin.unsafe_scans")}</span> <span className="font-bold">{user.count?.unsafe || 0}</span></p>
      </div>
    </div>
  );
};

const DeleteModal = ({ user, darkMode, onConfirm, onCancel, t }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-bold text-red-500">{t("admin.delete_heading")}</h3>
        <button onClick={onCancel}><X /></button>
      </div>
      <p className="mb-6 text-sm">
        {t("admin.delete_confirm", { email: user?.email, dept: user?.dept })}
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border rounded-xl py-2 hover:bg-gray-100 dark:hover:bg-gray-700">{t("admin.cancel")}</button>
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white rounded-xl py-2 hover:opacity-90">{t("admin.delete")}</button>
      </div>
    </div>
  </div>
);

export default function AdminPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDept, setNewUserDept] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/auth/me`, { credentials: "include" });
        if (res.status === 401) { navigate("/login"); return; }
        if (res.status === 403) { navigate("/blocked"); return; }
        if (!res.ok) { navigate("/blocked"); return; }
        fetchUsers();
      } catch {
        navigate("/login");
      }
    };
    checkRole();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { credentials: "include" });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = (user) => navigate(`/admin/users/view/${encodeURIComponent(user.email)}`);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/admin/users/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newUsername, email: newUserEmail, password: newUserPassword, dept: newUserDept }),
    });
    if (res.status === 409) alert(t("admin.error_exists"));
    setNewUsername(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserDept("");
    fetchUsers();
  };

  const handleDeleteConfirm = async () => {
    await fetch(`${API_BASE}/admin/users/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: deleteModalUser.email }),
    });
    setDeleteModalUser(null);
    fetchUsers();
  };

  const handleTogglePermission = async (user) => {
    setUsers((prevUsers) => prevUsers.map((u) => u.email === user.email ? { ...u, canManageUrls: !u.canManageUrls } : u));
    try {
      await fetch(`${API_BASE}/admin/users/permission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: user.email, canManageUrls: !user.canManageUrls }),
      });
    } catch (err) { console.error("Failed to update permission", err); }
  };

  const handleExport = (format) => {
    const params = new URLSearchParams({ format, dept: deptFilter, targetEmail: "" });
    window.open(`${API_BASE}/admin/users/export?${params.toString()}`, "_blank");
  };

  const filteredUsers = users.filter((u) =>
    (!searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!deptFilter || u.dept === deptFilter)
  );

  if (loading)
    return <div className="h-screen flex items-center justify-center">{t("admin.loading")}</div>;

  return (
    <>
      <Navbarwithlanguage />
      <div className={`min-h-screen pt-24 px-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex items-center gap-4">
            <FaUserShield className="text-4xl text-[#E87423]" />
            <h1 className="text-3xl font-bold">{t("admin.heading")}</h1>
          </div>

          <div className="flex gap-3">
            <button onClick={() => handleExport("csv")} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition shadow-sm text-sm font-medium">
              {t("admin.export_csv")}
            </button>
            <button onClick={() => handleExport("pdf")} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition shadow-sm text-sm font-medium">
              {t("admin.export_pdf")}
            </button>
          </div>

          <SummaryCard value={users.length} darkMode={darkMode} icon={FaUserShield} label={t("admin.total_users")} />

          <div className={`rounded-2xl p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">{t("admin.add_user_heading")}</h2>
            <form onSubmit={handleAddUser} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input type="text" placeholder={t("admin.username_placeholder")} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required className="p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600" />
              <input type="email" placeholder={t("admin.email_placeholder")} value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required className="p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder={t("admin.password_placeholder")} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500">
                  {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
              <input type="text" placeholder={t("admin.department_placeholder")} value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)} required className="p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600" />
              <button type="submit" className="lg:col-span-4 bg-[#E87423] text-white py-3 rounded-xl hover:bg-[#E87423]/80 transition">
                {t("admin.add_user_button")}
              </button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input type="text" placeholder={t("admin.search_placeholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-1/3 p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600" />
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full md:w-1/4 p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600">
              <option value="">{t("admin.all_departments")}</option>
              {[...new Set(users.map((u) => u.dept).filter(Boolean))].map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user, i) => (
              <UserCard key={i} user={user} darkMode={darkMode} onDelete={setDeleteModalUser} onTogglePermission={handleTogglePermission} onOpenDashboard={handleOpenDashboard} t={t} />
            ))}
          </div>
        </div>
      </div>

      {deleteModalUser && (
        <DeleteModal user={deleteModalUser} darkMode={darkMode} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteModalUser(null)} t={t} />
      )}
    </>
  );
}
