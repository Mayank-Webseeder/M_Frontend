import { useState, useEffect, useRef } from "react";
import { 
  RefreshCw, 
  ChevronDown, 
  Search, 
  Package, 
  AlertCircle,
  Upload,
  Eye
} from "lucide-react";
import Loader from './Loader';
import ImagePreviewModal from '../components/AdminOrder/ImagePreviewModal';
import FileUploadModal from '../components/GraphicsOrder/FileUploadModal';
import UploadedFilesModal from '../components/GraphicsOrder/UploadedFilesModal';
import RenderPagination from '../components/RenderPagination'; // Import the pagination component
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import toast from "react-hot-toast";
import io from 'socket.io-client';
import { useSocketEvents } from "../../src/hooks/useSocketEvents";
import { useSocket } from "../socket";

const GraphicsOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [uploadingOrder, setUploadingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const { socket, connected } = useSocket();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  
  // Status options based on the allowed statuses from the backend
  const statusOptions = ["graphics_pending", "graphics_in_progress", "graphics_completed"];
  
  // Status color mapping
  const statusColors = {
    "graphics_completed": "bg-green-100 text-green-800",
    "graphics_in_progress": "bg-blue-100 text-blue-800",   
    "graphics_pending": "bg-gray-100 text-gray-800"
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
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const endpoint = `${BASE_URL}/api/v1/admin/assigned`;
        
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch orders");
      
      const data = await response.json();
      console.log("Fetched orders data:", data);
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

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRowsPerPageChange = (e) => {
    setOrdersPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Calculate pagination variables
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleStatusUpdate = async (workQueueId, status) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: null });
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${BASE_URL}/api/v1/admin/updateWorkQueue`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `${token}` 
        },
        body: JSON.stringify({ workQueueId, status })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to update status");
      }
      
      // Update the local state to reflect the change
      setOrders(orders.map(order => 
        order._id === workQueueId ? { ...order, status } : order
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

  const handleImageClick = (images, index) => {
    const fullImages = images.map(img => `${BASE_URL}${img}`);
    setPreviewImage(fullImages);
    setPreviewInitialIndex(index);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };
  
  const handleFileUploadClick = (orderId) => {
    setUploadingOrder(orderId);
  };
  
  const handleViewFilesClick = (order) => {
    setViewingOrder(order);
  };
  
  const handleUploadSuccess = () => {
    // Close the upload modal
    setUploadingOrder(null);
    
    // Refresh the orders
    fetchOrders();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      {/* <ToastContainer position="top-right" autoClose={2000} /> */}
      
      <div className="container mx-auto">
        {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Graphics Orders</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Manage and update the status of assigned graphics orders
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
              <p className="text-gray-600">No orders currently assigned</p>
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
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Images</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
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
                        {order.image && order.image.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {order.image.slice(0, 3).map((img, index) => (
                              <div key={index} className="relative cursor-pointer">
                                <img 
                                  src={`${BASE_URL}${img}`} 
                                  alt={`Image ${index + 1}`}
                                  className="w-10 h-10 object-cover rounded border hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(order.image, index)}
                                />
                              </div>
                            ))}
                            {order.image.length > 3 && (
                              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded border text-xs text-gray-600">
                                +{order.image.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No images</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleFileUploadClick(order._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center"
                            title="Upload Files"
                          >
                            <Upload className="h-3 w-3 mr-1" /> Upload
                          </button>
                          
                          {(order.image && order.image.length > 0) || (order.cadFiles && order.cadFiles.length > 0) ? (
                            <button
                              onClick={() => handleViewFilesClick(order)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs flex items-center"
                              title="View Files"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View Files
                            </button>
                          ) : null
                          
                          }
                         
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
          
          {/* Pagination Component */}
          {!loading && !error && filteredOrders.length > 0 && (
            <RenderPagination
              currentPage={currentPage}
              totalPages={totalPages}
              handlePageChange={handlePageChange}
              ordersPerPage={ordersPerPage}
              handleRowsPerPageChange={handleRowsPerPageChange}
              paginatedOrders={paginatedOrders}
              filteredOrders={filteredOrders}
            />
          )}
        </div>
      </div>
      
      {/* File Upload Modal */}
      {uploadingOrder && (
        <FileUploadModal 
          orderId={uploadingOrder}
          onClose={() => setUploadingOrder(null)}
          onSuccess={handleUploadSuccess}
          baseUrl={BASE_URL}
        />
      )}
      
      {/* View Files Modal */}
      {viewingOrder && (
        <UploadedFilesModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          baseUrl={BASE_URL}
        />
      )}
      
      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal 
          imageUrl={previewImage}
          onClose={closeImagePreview}
          initialIndex={previewInitialIndex}
        />
      )}
    </div>
  );
};

export default GraphicsOrders;

