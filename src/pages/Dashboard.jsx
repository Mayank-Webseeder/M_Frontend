import React, { useState, useEffect } from 'react';
import { Users, FileText, ShoppingBag, DollarSign, Search, Filter } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { name: 'Total Users', value: '0', icon: Users, color: 'bg-blue-500' },
    { name: 'Total Orders', value: '0', icon: ShoppingBag, color: 'bg-yellow-500' },
    { name: 'Total Customers', value: '0', icon: FileText, color: 'bg-green-500' },
  ]);

  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch all necessary data when component mounts
    fetchAllData();
  }, []);

  useEffect(() => {
    // Update stats whenever the underlying data changes
    updateDashboardStats();
  }, [users, orders, customers]);

  useEffect(() => {
    // Filter leads based on search term and status
    filterLeadsData();
  }, [leads, searchTerm, statusFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchLeads(),
      fetchCustomers(),
      fetchOrders()
    ]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/auth/getAllUsers`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchLeads = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/admin/getAllLeads`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        setLeads(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/admin/getAllCustomers`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/admin/getOrders`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      console.log("this is data", data);
      setOrders(data.orders);
      setCurrentPage(1); // Reset to first page when fetching new orders
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDashboardStats = () => {
    const newStats = [...stats];

    // Update Total Users count
    newStats[0].value = users.length.toString();

    // Update Total Orders count
    newStats[1].value = orders.length.toString();

    // Update Total Customers count
    newStats[2].value = customers.length.toString();

    setStats(newStats);
  };

  const filterLeadsData = () => {
    let result = leads;

    if (searchTerm) {
      result = result.filter(lead =>
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm)
      );
    }

    if (statusFilter) {
      result = result.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(result);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Get recent leads (last 5)
  const recentLeads = (filteredLeads.length > 0 ? filteredLeads : leads)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Get recent customers (last 5)
  const recentCustomers = customers
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Get recent orders (last 5)
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Format date 
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Section */}
      {/* <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
        {loading ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">Loading orders...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order._id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-green-100 text-green-800'}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div> */}

      {/* Leads Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <div className="relative">
              <select
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-md"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
              </select>
              <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">Loading leads...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <tr key={lead._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {`${lead.firstName} ${lead.lastName}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${lead.status === 'New' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'Qualified' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-green-100 text-green-800'}`}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customers Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Customers</h2>
        {loading ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">Loading customers...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCustomers.length > 0 ? (
                  recentCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {`${customer.firstName} ${customer.lastName}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;