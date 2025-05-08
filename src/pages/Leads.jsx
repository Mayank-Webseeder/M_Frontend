import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, X, Search, UserPlus, Phone, Mail, 
  Calendar, Edit, Trash2, Filter, ChevronDown, 
  UserCheck, CheckCircle2, AlertCircle
} from "lucide-react";
import Loader from './Loader';
import toast from "react-hot-toast";

const LeadManagement = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    descriptions: ""
  });
  const [editData, setEditData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    descriptions: "",
    status: ""
  });
  const [convertLeadId, setConvertLeadId] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "" // success or error
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    // Filter leads based on search term and status
    let result = leads;
    
    if (searchTerm) {
      result = result.filter(lead => 
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
      );
    }

    if (statusFilter) {
      result = result.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(result);
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/v1/admin/getAllLeads`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        setLeads(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      showNotification("Failed to fetch leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleSubmit = async (e) => {
    if (!token) return;
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/admin/createLead`, formData, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      
      if (response.data.success) {
        setShowAddModal(false);
        fetchLeads(); // Refresh the leads list after adding a new lead
        // Reset form data
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          descriptions: ""
        });
        showNotification("Lead created successfully", "success");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      showNotification(error.response?.data?.message || "Error creating lead", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    if (!token) return;
    e.preventDefault();
    
    try {
      const response = await axios.put(`${BASE_URL}/api/v1/admin/updateLead/${editData.id}`, editData, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      
      if (response.data.success) {
        // Update lead in state without refetching
        setLeads(leads.map(lead => {
          if (lead._id === editData.id) {
            return response.data.data;
          }
          return lead;
        }));
        
        setShowEditModal(false);
        // Reset edit data
        setEditData({
          id: "",
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          descriptions: "",
          status: ""
        });
        showNotification("Lead updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      showNotification(error.response?.data?.message || "Error updating lead", "error");
    }
  };

  const handleOpenEditModal = (lead) => {
    setEditData({
      id: lead._id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      descriptions: lead.descriptions || "",
      status: lead.status || "New"
    });
    setShowEditModal(true);
  };

  const handleOpenConvertModal = (leadId) => {
    setConvertLeadId(leadId);
    setShowConvertModal(true);
  };

  const handleConvertToCustomer = async () => {
    if (!token || !convertLeadId) return;
    
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/admin/convertToCustomer/${convertLeadId}`, {}, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      
      if (response.data.success) {
        // Update lead status in state
        setLeads(leads.map(lead => {
          if (lead._id === convertLeadId) {
            return { ...lead, status: 'Converted' };
          }
          return lead;
        }));
        
        setShowConvertModal(false);
        setConvertLeadId("");
        showNotification("Lead converted to customer successfully", "success");
      }
    } catch (error) {
      console.error("Error converting lead to customer:", error);
      showNotification(error.response?.data?.message || "Error converting lead to customer", "error");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!token) return;
    
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/v1/admin/deleteLead/${leadId}`, {
          headers: { Authorization: `${token}` },
          withCredentials: true,
        });
        
        if (response.data.success) {
          // Remove lead from state without refetching
          setLeads(leads.filter(lead => lead._id !== leadId));
          showNotification("Lead deleted successfully", "success");
        }
      } catch (error) {
        console.error("Error deleting lead:", error);
        showNotification(error.response?.data?.message || "Error deleting lead", "error");
      }
    }
  };

  const renderStatusTag = (status) => {
    const statusColors = {
      New: "bg-blue-100 text-blue-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      Qualified: "bg-green-100 text-green-800",
      Proposal: "bg-purple-100 text-purple-800",
      Negotiation: "bg-orange-100 text-orange-800",
      Converted: "bg-emerald-100 text-emerald-800",
      Lost: "bg-red-100 text-red-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'New'}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="container mx-auto">
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
            notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

  

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
            <div className="relative flex-1 sm:mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full border border-gray-300 rounded-lg py-2 px-3 sm:px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add Lead
          </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            </div>
                            <div className="truncate max-w-[100px] sm:max-w-full">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {`${lead.firstName} ${lead.lastName}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-1">
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                              <span className="truncate max-w-[120px] sm:max-w-[200px]">{lead.email}</span>
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-500">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {renderStatusTag(lead.status)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                          <div className="line-clamp-2 max-w-xs">
                            {lead.descriptions || "No description provided"}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <div className="flex justify-end space-x-2 sm:space-x-3">
                            <button 
                              onClick={() => handleOpenEditModal(lead)} 
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit Lead"
                            >
                              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            {lead.status !== 'Converted' && (
                              <button 
                                onClick={() => handleOpenConvertModal(lead._id)} 
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="Convert to Customer"
                              >
                                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteLead(lead._id)} 
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                        {searchTerm || statusFilter ? (
                          <div>
                            <p className="font-medium text-gray-600">No leads match your search criteria</p>
                            <p className="mt-1">Try changing your search term or clearing filters</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-gray-600">No leads found</p>
                            <p className="mt-1">Create your first lead to get started</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] p-5 sm:p-7 md:p-8 relative my-4 max-h-[90vh] overflow-y-auto border border-gray-100">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-8">Add New Lead</h2>
                <div className="h-1 w-12 bg-indigo-600 mt-2 rounded-full"></div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number*</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    name="descriptions"
                    value={formData.descriptions}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    placeholder="Add any additional information about this lead..."
                  ></textarea>
                </div>
                <div className="flex justify-end pt-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition-colors text-sm font-medium mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors text-sm font-medium shadow-sm"
                  >
                    Create Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Lead Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] p-5 sm:p-7 md:p-8 relative my-4 max-h-[90vh] overflow-y-auto border border-gray-100">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-8">Edit Lead</h2>
                <div className="h-1 w-12 bg-indigo-600 mt-2 rounded-full"></div>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <div className="relative">
                    <select
                      name="status"
                      value={editData.status}
                      onChange={handleEditChange}
                      className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-10 transition-all duration-200"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    name="descriptions"
                    value={editData.descriptions}
                    onChange={handleEditChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200"
                    placeholder="Add any additional information about this lead..."
                  ></textarea>
                </div>
                <div className="flex justify-end pt-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition-colors text-sm font-medium mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors text-sm font-medium shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Convert to Customer Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-center bg-green-100 h-12 w-12 rounded-full mx-auto mb-4">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">Convert Lead to Customer</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                This will create a new customer record and mark this lead as converted. This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertToCustomer}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Convert to Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManagement;