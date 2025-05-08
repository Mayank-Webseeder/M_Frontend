import React, { useEffect, useState } from "react";
import { ConstructionIcon, Eye, KeyRound, UserCircle, ShieldCheck } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/auth/getUser`, {
          headers: { Authorization: `${token}` },
        });
        setUser(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch user details");
      }
    };
    fetchUser();
  }, [token]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await axios.post(
        `${BASE_URL}/api/v1/auth/change-password`,
        { email: user.email, oldPassword: currentPassword, newPassword },
        { headers: { Authorization: `${token}` } }
      );
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px]">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 min-h-screen">
      <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <UserCircle className="w-8 h-8 text-[#5A6ACF] mr-3" />
          <h2 className="text-[#5A6ACF] text-2xl font-bold">Profile Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className=" text-gray-600 mb-2 flex items-center">
              <UserCircle className="w-5 h-5 text-gray-500" />
              <span className="ml-2">Full Name</span>
            </label>
            <input 
              type="text" 
              value={`${user?.firstName || ''} ${user?.lastName || ''}`} 
              disabled 
              className="w-full p-3 bg-gray-100 rounded-lg" 
            />
          </div>
          <div>
            <label className=" text-gray-600 mb-2 flex items-center">
              <KeyRound className="w-5 h-5 text-gray-500" />
              <span className="ml-2">Email</span>
            </label>
            <input type="text" value={user?.email || ""} disabled className="w-full p-3 bg-gray-100 rounded-lg" />
          </div>
          <div>
            <label className=" text-gray-600 mb-2 flex items-center">
              <ShieldCheck className="w-5 h-5 text-gray-500" />
              <span className="ml-2">Account Type</span>
            </label>
            <input type="text" value={user?.accountType || ""} disabled className="w-full p-3 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <KeyRound className="w-8 h-8 text-[#5A6ACF] mr-3" />
          <h2 className="text-[#5A6ACF] text-2xl font-bold">Change Password</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">Current Password</label>
            <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">New Password</label>
            <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" className="px-8 py-3 bg-[#5A6ACF] text-white rounded-lg">Update Password</button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
