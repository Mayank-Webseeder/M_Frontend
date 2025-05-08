import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus, X, Search, UserCog, Shield, Edit,
  Trash2, Filter, ChevronDown, CheckCircle, XCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Loader from './Loader';
import UserModal from '../components/AdminOrder/UserModal';
import ConfirmationModal from '../components/AdminOrder/ConfirmModal';

const UserManagement = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" for all, "active", "inactive"
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("token");

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState({ title: "", message: "", buttonClass: "", buttonText: "" });


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term, role, and status
    let result = users;

    if (searchTerm) {
      result = result.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      result = result.filter(user => user.accountType === roleFilter);
    }

    if (statusFilter === "active") {
      result = result.filter(user => user.isActive !== false);
    } else if (statusFilter === "inactive") {
      result = result.filter(user => user.isActive === false);
    }

    setFilteredUsers(result);
    // Update total pages based on filtered results
    setTotalPages(Math.ceil(result.length / usersPerPage));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter, usersPerPage]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/v1/auth/getAllUsers`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setModalMode("add");
    setCurrentUser(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode("edit");
    setCurrentUser(user);
    setShowModal(true);
  };

  // const handleToggleUserStatus = async (user) => {
  //   if (!token) return;

  //   try {
  //     const newStatus = !user.isActive;
  //     const confirmMessage = newStatus
  //       ? `Are you sure you want to activate ${user.firstName} ${user.lastName}'s account?`
  //       : `Are you sure you want to deactivate ${user.firstName} ${user.lastName}'s account?`;

  //     if (window.confirm(confirmMessage)) {
  //       const response = await axios.put(`${BASE_URL}/api/v1/auth/updateUser/${user._id}`, {
  //         firstName: user.firstName,
  //         lastName: user.lastName,
  //         accountType: user.accountType,
  //         isActive: newStatus
  //       }, {
  //         headers: { Authorization: `${token}` },
  //         withCredentials: true,
  //       });

  //       if (response.data.success) {
  //         // Update user in state
  //         setUsers(users.map(u => {
  //           if (u._id === user._id) {
  //             return { ...u, isActive: newStatus };
  //           }
  //           return u;
  //         }));
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error toggling user status:", error);
  //   }
  // };


  
  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.isActive;
    
    // Set up confirmation modal data
    setConfirmData({
      title: newStatus ? "Activate User Account" : "Deactivate User Account",
      message: newStatus 
        ? `Are you sure you want to activate ${user.firstName} ${user.lastName}'s account?` 
        : `Are you sure you want to deactivate ${user.firstName} ${user.lastName}'s account?`,
      buttonClass: newStatus ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
      buttonText: newStatus ? "Activate" : "Deactivate"
    });
    
    // Store the action for when user confirms
    setConfirmAction(() => async () => {
      if (!token) return;
      
      try {
        const response = await axios.put(`${BASE_URL}/api/v1/auth/updateUser/${user._id}`, {
          firstName: user.firstName,
          lastName: user.lastName,
          accountType: user.accountType,
          isActive: newStatus
        }, {
          headers: { Authorization: `${token}` },
          withCredentials: true,
        });

        if (response.data.success) {
          // Update user in state
          setUsers(users.map(u => {
            if (u._id === user._id) {
              return { ...u, isActive: newStatus };
            }
            return u;
          }));
        }
      } catch (error) {
        console.error("Error toggling user status:", error);
      }
    });
    
    // Show the confirmation modal
    setShowConfirmModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!token) return;

    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/v1/auth/deleteUser/${userId}`, {
          headers: { Authorization: `${token}` },
          withCredentials: true,
        });

        if (response.data.success) {
          // Remove user from state without refetching
          setUsers(users.filter(user => user._id !== userId));
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleUserSaved = (savedUser, isNewUser) => {
    if (isNewUser) {
      // For a new user, fetch the full list again to get the proper ID and created date
      fetchUsers();
    } else {
      // For an edited user, update the user in the state
      setUsers(users.map(user => {
        if (user._id === savedUser.userId) {
          return {
            ...user,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            accountType: savedUser.accountType,
            isActive: savedUser.isActive
          };
        }
        return user;
      }));
    }
    setShowModal(false);
  };

  const renderAccountTypeTag = (type) => {
    const typeColors = {
      Admin: "bg-blue-100 text-blue-800",
      Graphics: "bg-green-100 text-green-800",
      Cutout: "bg-purple-100 text-purple-800",
      Accounts: "bg-yellow-100 text-yellow-800",
      SuperAdmin: "bg-red-100 text-red-800",
      Display: "bg-red-400 text-gray-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || 'bg-gray-100'}`}>
        {type}
      </span>
    );
  };

  const renderStatusIndicator = (isActive) => {
    return isActive !== false ? (
      <span className="flex items-center text-green-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">Active</span>
      </span>
    ) : (
      <span className="flex items-center text-red-600">
        <XCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">Inactive</span>
      </span>
    );
  };

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Page change handlers
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="container mx-auto">
   

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 justify-between">
            <div className="relative flex-1 sm:mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex space-x-2 sm:space-x-3">
              <div className="relative min-w-[120px]">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none w-full border border-gray-300 rounded-lg py-2 px-3 sm:px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Graphics">Graphics</option>
                  <option value="Cutout">Cutout</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Display">Display</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative min-w-[120px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full border border-gray-300 rounded-lg py-2 px-3 sm:px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={handleAddUser}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add User
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Created At</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                              <UserCog className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600" />
                            </div>
                            <div className="truncate max-w-[100px] sm:max-w-full">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-full">{user.email}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {renderAccountTypeTag(user.accountType)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {renderStatusIndicator(user.isActive)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            {new Date(user.created).toLocaleDateString()}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                            <div className="flex justify-end space-x-2 sm:space-x-3">
                              {/* Status Toggle Button */}
                              {user.accountType !== "SuperAdmin" && (
                                <button
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`transition-colors ${user.isActive !== false
                                      ? "text-green-600 hover:text-green-800"
                                      : "text-red-600 hover:text-red-800"
                                    }`}
                                  title={user.isActive !== false ? "Deactivate User" : "Activate User"}
                                >
                                  {user.isActive !== false ? (
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                  ) : (
                                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                disabled={user.accountType === "SuperAdmin"}
                              >
                                <Trash2 className={`h-4 w-4 sm:h-5 sm:w-5 ${user.accountType === "SuperAdmin" ? "opacity-50 cursor-not-allowed" : ""}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                          No users found with the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center text-sm text-gray-700">
                  <p>
                    Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastUser, filteredUsers.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredUsers.length}</span> users
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                  <div className="mr-4 flex items-center">
                    <label htmlFor="usersPerPage" className="text-sm text-gray-700 mr-2">
                      Per page:
                    </label>
                    <select
                      id="usersPerPage"
                      value={usersPerPage}
                      onChange={(e) => setUsersPerPage(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium ${currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page number display */}
                    <div className="hidden sm:flex space-x-1">
                      {/* First page button */}
                      {currentPage > 2 && (
                        <button
                          onClick={() => goToPage(1)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                        >
                          1
                        </button>
                      )}

                      {/* Ellipsis for pages before current */}
                      {currentPage > 3 && (
                        <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-500">
                          ...
                        </span>
                      )}

                      {/* Previous page button (if not first page) */}
                      {currentPage > 1 && (
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                        >
                          {currentPage - 1}
                        </button>
                      )}

                      {/* Current page button */}
                      <button
                        className="inline-flex items-center px-3 py-1 border border-indigo-500 rounded-md text-sm font-medium bg-indigo-50 text-indigo-600"
                      >
                        {currentPage}
                      </button>

                      {/* Next page button (if not last page) */}
                      {currentPage < totalPages && (
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                        >
                          {currentPage + 1}
                        </button>
                      )}

                      {/* Ellipsis for pages after current */}
                      {currentPage < totalPages - 2 && (
                        <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-500">
                          ...
                        </span>
                      )}

                      {/* Last page button */}
                      {currentPage < totalPages - 1 && (
                        <button
                          onClick={() => goToPage(totalPages)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      )}
                    </div>

                    {/* Mobile page indicator */}
                    <span className="sm:hidden text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium ${currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Modal (Add/Edit) */}
        {showModal && (
          <UserModal
            mode={modalMode}
            user={currentUser}
            onClose={() => setShowModal(false)}
            onSave={handleUserSaved}
            baseUrl={BASE_URL}
          />
        )}


        {/* Confirmation Modal for Status Toggle and Delete */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAction}
          title={confirmData.title}
          message={confirmData.message}
          confirmButtonClass={confirmData.buttonClass}
          confirmText={confirmData.buttonText}
        />
      </div>
    </div>
  );
};

export default UserManagement;


