import { useState, useEffect } from "react";
import { 
  RefreshCw, 
  ChevronDown, 
  Search, 
  Package, 
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Loader from './Loader';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import toast from "react-hot-toast";
import { useSocketEvents } from "../hooks/useSocketEvents";
import InvoiceManager from './InvoiceManager';

const AccountOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedOrders, setPaginatedOrders] = useState([]);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  
  const statusOptions = [
    "accounts_pending",
    "accounts_billed",
    "accounts_paid"
  ];
  
  const statusColors = {
    "accounts_pending": "bg-yellow-100 text-yellow-800",
    "accounts_billed": "bg-purple-100 text-purple-800",
    "accounts_paid": "bg-emerald-100 text-emerald-800",
  };

  const setStatusHandler = (data) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === data.orderId ? { ...order, ...data.order } : order
      )
    );
    toast.info(`Order #${data.order.orderId} has been updated`);
  };

  useSocketEvents({
    "orderUpdated": setStatusHandler,
  });

  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    let result = orders;
    
    if (searchTerm) {
      result = result.filter(order => 
        (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer && order.customer.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer && order.customer.email && order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter) {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
    setTotalPages(Math.ceil(result.length / ordersPerPage));
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter, ordersPerPage]);
  
  useEffect(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [filteredOrders, currentPage, ordersPerPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/admin/accounts/getAssignedOrders`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch orders");
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
        setFilteredOrders(data.data);
        setTotalPages(Math.ceil(data.data.length / ordersPerPage));
        setError(null);
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(`Error fetching orders: ${error.message}`); 
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: null });
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/api/v1/admin/accounts/updateStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${token}`
        },
        body: JSON.stringify({ orderId, status })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update status");
      }

      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status } : order
      ));

      setUpdateStatus({
        loading: false,
        error: null,
        success: `Order status updated to ${status}`
      });

      toast.success(`Order status updated to ${status}`);

      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      console.error("Error updating status:", error);
      setUpdateStatus({
        loading: false,
        error: error.message,
        success: null
      });

      toast.error(`Failed to update status: ${error.message}`);

      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, error: null }));
      }, 5000);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (e) => {
    setOrdersPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const renderStatusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{paginatedOrders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0}</span> to{" "}
              <span className="font-medium">{Math.min(currentPage * ordersPerPage, filteredOrders.length)}</span> of{" "}
              <span className="font-medium">{filteredOrders.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-700">Rows per page:</span>
              <select 
                value={ordersPerPage} 
                onChange={handleRowsPerPageChange}
                className="border border-gray-300 rounded-md text-sm py-1 px-2"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pages.map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
      
      <div className="container mx-auto">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {/* <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" /> */}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-medium">Error: {error}</p>
              <button 
                onClick={fetchOrders}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId || order._id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InvoiceManager order={order} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          value={order.status || ""}
                        >
                          <option value="" disabled>Status</option>
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountOrders;