
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const UserModal = ({ mode, user, onClose, onSave, baseUrl }) => {
  const isEditMode = mode === "edit";
  const token = localStorage.getItem("token");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "Admin",
    isActive: true,
    // For edit mode
    userId: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isEditMode && user) {
      setFormData({
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        isActive: user.isActive !== undefined ? user.isActive : true, // Default to true if not specified
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      // Reset for add mode
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        accountType: "Admin",
        isActive: true,
        userId: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [isEditMode, user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });

    // Clear password error when either password field changes in edit mode
    if (isEditMode && (e.target.name === "newPassword" || e.target.name === "confirmPassword")) {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    if (!token) return;
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Validate passwords match if attempting to change password
        if (formData.newPassword) {
          if (formData.newPassword !== formData.confirmPassword) {
            setPasswordError("Passwords do not match");
            toast.error("Passwords do not match");
            setIsSubmitting(false);
            return;
          }
          if (formData.newPassword.length < 3) {
            setPasswordError("Password must be at least 3 characters");
            toast.error("Password must be at least 3 characters");
            setIsSubmitting(false);
            return;
          }
        }

        // Update user profile details
        const userProfileData = {
          userId: formData.userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          accountType: formData.accountType,
          isActive: formData.isActive
        };

        await axios.put(`${baseUrl}/api/v1/auth/updateUser/${formData.userId}`, userProfileData, {
          headers: { Authorization: `${token}` },
          withCredentials: true,
        });

        // If password is being changed, make a separate request
        if (formData.newPassword) {
          await axios.post(`${baseUrl}/api/v1/auth/change-password`, {
            userId: formData.userId,
            newPassword: formData.newPassword
          }, {
            headers: { Authorization: `${token}` },
            withCredentials: true,
          });
        }
        toast.success("User updated successfully");
        onSave(formData, false);
      } else {
        // Create new user
        const response = await axios.post(`${baseUrl}/api/v1/auth/create-account`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          accountType: formData.accountType,
          isActive: formData.isActive
        }, {
          headers: { Authorization: `${token}` },
          withCredentials: true,
        });
        console.log("kamal res", response);
        toast.success("User created successfully");
        if(response.success === "false"){
          toast.error(response.message);
        }
        onSave(formData, true);
      }
    }
    catch (error) {
      console.error(isEditMode ? "Error updating user:" : "Error creating user:", error);
      console.log("kamal error", error.response);
      if (
        error.response.data.success == false
      ) {
        toast.error("User already exist");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] p-5 sm:p-7 md:p-8 relative my-4 max-h-[90vh] overflow-y-auto border border-gray-100">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className={`absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 z-10 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-8">
            {isEditMode ? "Edit User" : "Create New User"}
          </h2>
          <div className="h-1 w-12 bg-indigo-600 mt-2 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            {isEditMode ? (
              <>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none text-sm bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1.5 ml-1">Email cannot be changed</p>
              </>
            ) : (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                required
                disabled={isSubmitting}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
            <div className="relative">
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-10 transition-all duration-200"
                disabled={(isEditMode && formData.accountType === "SuperAdmin") || isSubmitting}
              >
                <option value="Admin">Admin</option>
                <option value="Graphics">Graphics</option>
                <option value="Cutout">Cutout</option>
                <option value="Accounts">Accounts</option>
                <option value="Display">Display</option>
                {isEditMode && formData.accountType === "SuperAdmin" && (
                  <option value="SuperAdmin">Super Admin</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {isEditMode && formData.accountType === "SuperAdmin" && (
              <p className="text-xs text-gray-500 mt-1.5 ml-1">SuperAdmin role cannot be changed</p>
            )}
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={(isEditMode && formData.accountType === "SuperAdmin") || isSubmitting}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active Account
            </label>
            {isEditMode && formData.accountType === "SuperAdmin" && (
              <span className="ml-2 text-xs text-gray-500">SuperAdmin status cannot be changed</span>
            )}
          </div>

          {isEditMode ? (
            <div className="border-t border-gray-100 pt-4 mt-5">
              <div className="flex items-center mb-3">
                <h3 className="text-sm font-medium text-gray-800">Change Password</h3>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">Optional</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    disabled={isSubmitting}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {passwordError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="flex justify-end pt-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition-colors text-sm font-medium mr-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors text-sm font-medium shadow-sm flex items-center justify-center min-w-[120px] ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Save Changes" : "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;