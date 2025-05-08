import React, { useState } from "react";
import LoginCarousel from "./LoginCarousel";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import axios from "axios";

const Signup = () => {
  return (
    <div className="w-full h-screen grid grid-cols-3">
      <LoginCarousel />
      <div className="col-span-2">
        <SignupForm />
      </div>
    </div>
  );
};

const SignupForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "Display" // Default value from enum in backend
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Using the correct endpoint from backend code
      await axios.post(`${BASE_URL}/api/v1/auth/signup`, formData);
      setSuccess("Account created successfully! Redirecting to login...");
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center items-center px-8 text-[#203d5d]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your Account</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* First Name Field */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your first name"
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          {/* Last Name Field */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your last name"
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleChange}
                minLength="6"
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 text-xl right-0 pr-3 flex justify-center items-center cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
              </span>
            </div>
          </div>
          
          {/* Account Type Field (required in backend) */}
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium">
              Account Type
            </label>
            <select
              id="accountType"
              name="accountType"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.accountType}
              onChange={handleChange}
              required
            >
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">Super Admin</option>
              <option value="Graphics">Graphics</option>
              <option value="Accounts">Accounts</option>
              <option value="Display">Display</option>
              <option value="Cutout">Cutout</option>
            </select>
          </div>

          {/* Signup Button */}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#203d5d] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>

          {/* Already have an account? Link to Login */}
          <div className="text-center text-sm">
            Already have an account?{" "}
            <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/login")}>
              Log in
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;