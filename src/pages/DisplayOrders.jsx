import React, { useEffect, useState } from "react";
import { Search, ChevronDown, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "./Loader";
import ImagePreviewModal from "../components/AdminOrder/ImagePreviewModal";
import OrderDetailsModal from "../components/ViewOrder/ViewOrderDetails";
import RenderPagination from "../components/RenderPagination";

const DisplayOrders = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [imageLoading, setImageLoading] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "bg-gray-100 text-gray-800";
      case "InProgress":
        return "bg-blue-100 text-blue-800";
      case "PendingApproval":
        return "bg-orange-100 text-orange-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Billed":
        return "bg-indigo-100 text-indigo-800";
      case "Paid":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-yellow-100 text-yellow-800";
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
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewImage = async (images, orderId) => {
    if (!images || images.length === 0) return; // Prevent previewing if no images are available
  
    setImageLoading((prev) => ({ ...prev, [orderId]: true })); // Set loading state for specific order
  
    try {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulating loading time
  
      // Construct the correct URLs for all images
      const backendUrl = import.meta.env.VITE_BASE_URL;
      const imageUrls = images.map(imagePath => `${backendUrl}${imagePath}`);
  
      setPreviewImage(imageUrls); // Set all image URLs instead of just the first one
      setShowPreview(true); // Show the preview modal
    } finally {
      setTimeout(() => {
        setImageLoading((prev) => ({ ...prev, [orderId]: false })); // Reset loading state
      }, 100);
    }
  };
  
  const handleClosePreview = () => {
    setPreviewImage(null);
    setShowPreview(false);
    setImageLoading({}); // Reset all loading states
  };

  // Function to handle row click for order details
  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.requirements?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "" || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleRowsPerPageChange = (e) => {
    setOrdersPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto">

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="relative flex-1 mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none w-full border border-gray-300 rounded-lg py-2 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="InProgress">In Progress</option>
                <option value="PendingApproval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Billed">Billed</option>
                <option value="Paid">Paid</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requirements
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(order)}
                      >
                        <td className="px-6 py-4">{order.orderId}</td>
                        <td className="px-6 py-4">{order.customer?.name || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {order.assignedTo
                            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`
                            : "Not Assigned"}
                        </td>
                        <td className="px-6 py-4">{order.created}</td>
                        <td className="px-6 py-4 truncate max-w-xs">
                          {order.requirements?.substring(0, 50)}
                          {order.requirements?.length > 50 ? '...' : ''}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewImage(order.image, order._id);
                            }}
                            disabled={imageLoading[order._id]}
                          >
                            {imageLoading[order._id] ? (
                              <Loader className="h-4 w-4" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No orders found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Pagination Component */}
              <RenderPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                ordersPerPage={ordersPerPage}
                handleRowsPerPageChange={handleRowsPerPageChange}
                paginatedOrders={paginatedOrders}
                filteredOrders={filteredOrders}
              />
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={handleClosePreview}
        />
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default DisplayOrders;