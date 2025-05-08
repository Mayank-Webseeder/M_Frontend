import { useState, useEffect } from "react";
import {
  RefreshCw,
  ChevronDown,
  Search,
  Package,
  AlertCircle,
  Eye,
  FileText,
  Download
} from "lucide-react";
import Loader from './Loader';
import CutoutOrderDetailsModal from '../components/CutoutOrder/CutoutOrderDetailsModal';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import toast from "react-hot-toast";
import { useSocketEvents } from "../hooks/useSocketEvents";
import { useSocket } from "../socket";


const CutoutOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Status options based on the allowed statuses for Cutout users
  const statusOptions = ["cutout_pending", "cutout_in_progress", "cutout_completed"];

  // Status color mapping
  const statusColors = {
    "cutout_pending": "bg-gray-100 text-gray-800",
    "cutout_in_progress": "bg-blue-100 text-blue-800",
    "cutout_completed": "bg-green-100 text-green-800",
  };

  const setStatusHandler = (data) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === data.orderId
          ? { ...order, ...data.order }
          : order
      )
    );

    // Show a toast notification
    toast.info(`Order #${data.order.orderId} has been updated by admin`);
  };
  useSocketEvents({
    "orderUpdated": setStatusHandler,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders based on search term and status
    let result = orders;

    if (searchTerm) {
      result = result.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requirements.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Using the cutout user endpoint to get assigned orders
      const endpoint = `${BASE_URL}/api/v1/admin/assigned`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      console.log("Fetched cutout orders:", data);
      const ordersData = data.data || [];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: null });
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/api/v1/admin/cutout/changeStatus`, {
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

      // Update the local state to reflect the change
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status } : order
      ));

      setUpdateStatus({
        loading: false,
        error: null,
        success: `Order status updated to ${status}`
      });

      toast.success(`Order status updated to ${status}`);

      // Clear success message after 3 seconds
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

      // Clear error message after 5 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, error: null }));
      }, 5000);
    }
  };

  const renderStatusBadge = (status) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    // Refresh orders list to get updated data
    fetchOrders();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}

      <div className="container mx-auto">
        {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">cutout Orders</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              View and manage orders assigned to your cutout account
            </p>
          </div>
          <button 
            onClick={fetchOrders}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <RefreshCw className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Refresh Orders
          </button>
        </div>
         */}
        {/* Status update feedback messages */}
        {updateStatus.loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg mb-4 flex items-center">
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            Updating status...
          </div>
        )}

        {updateStatus.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {updateStatus.error}
          </div>
        )}

        {updateStatus.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
            {updateStatus.success}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 justify-between">
            <div className="relative flex-1 sm:mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or requirements..."
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
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders currently assigned to you</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Dimensions</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Files</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{order.orderId}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
                          {order.requirements}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-gray-500">{order.dimensions}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {order.created}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <div className="flex space-x-2">
                          {order.image && order.image.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {order.image.length} Images
                            </span>
                          )}
                          {order.cadFiles && order.cadFiles.length > 0 && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                              {order.cadFiles.length} CAD Files
                            </span>
                          )}
                          {(!order.image || order.image.length === 0) &&
                            (!order.cadFiles || order.cadFiles.length === 0) && (
                              <span className="text-xs text-gray-500">No files</span>
                            )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewOrderDetails(order)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs flex items-center"
                            title="View Order Details"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Details
                          </button>

                          <div className="relative">
                            <select
                              className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              value={order.status || ""}
                            >
                              <option value="" disabled>Status</option>
                              {statusOptions.map(status => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            {/* <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" /> */}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <CutoutOrderDetailsModal
          order={selectedOrder}
          onClose={closeOrderDetails}
          onStatusUpdate={handleStatusUpdate}
          baseUrl={BASE_URL}
        />
      )}
    </div>
  );
};

export default CutoutOrders;