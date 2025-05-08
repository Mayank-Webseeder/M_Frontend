import React, { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, ChevronDown, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "./Loader";
import CreateNewOrder from "../components/AdminOrder/CreateNewOrder";
import EditOrder from "../components/AdminOrder/EditOrder";
import ImagePreviewModal from "../components/AdminOrder/ImagePreviewModal";
import OrderDetailsModal from "../components/AdminOrder/OrderDetailsModal";
import { useSocketEvents } from "../../src/hooks/useSocketEvents";
import { useSocket } from "../socket";

const Orders = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [imageLoading, setImageLoading] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { socket, connected } = useSocket();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: null });
  const ordersPerPage = 20;

  // Advanced search field state
  const [searchFields, setSearchFields] = useState({
    orderId: true,
    customerName: true,
    status: true,
    assigned: true,
    requirements: true,
    createdAt: true
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset to page 1 when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const setStatusHandler = ({ orderId, status }) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId
          ? { ...order, status: status }
          : order
      )
    );
  };

  useSocketEvents({
    "changeStatus": setStatusHandler,
  });

  const addOrder = (newOrder) => {
    setOrders((prevOrders) => [...prevOrders, newOrder]);
  };

  const updateOrder = (updatedOrder) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "New":
  //       return "bg-gray-100 text-gray-800";
  //     case "InProgress":
  //       return "bg-blue-100 text-blue-800";
  //     case "PendingApproval":
  //       return "bg-orange-100 text-orange-800";
  //     case "Approved":
  //       return "bg-green-100 text-green-800";
  //     case "Completed":
  //       return "bg-green-100 text-green-800";
  //     case "Billed":
  //       return "bg-indigo-100 text-indigo-800";
  //     case "Paid":
  //       return "bg-emerald-100 text-emerald-800";
  //     default:
  //       return "bg-yellow-100 text-yellow-800";
  //   }
  // };

  const getStatusColor = (status) => {
    switch (status) {
      // Graphics stages
      case "graphics_pending":
        return "bg-yellow-100 text-yellow-800";
      case "graphics_in_progress":
        return "bg-blue-100 text-blue-800";
      case "graphics_completed":
        return "bg-green-100 text-green-800";
      
      // Admin stages
      case "admin_review":
        return "bg-orange-100 text-orange-800";
      case "admin_approved":
        return "bg-green-100 text-green-800";
      case "admin_rejected":
        return "bg-red-100 text-red-800";
      
      // Cutout stages
      case "cutout_pending":
        return "bg-yellow-100 text-yellow-800";
      case "cutout_in_progress":
        return "bg-blue-100 text-blue-800";
      case "cutout_completed":
        return "bg-green-100 text-green-800";
      
      // Accounts stages
      case "accounts_pending":
        return "bg-purple-100 text-purple-800";
      case "accounts_billed":
        return "bg-indigo-100 text-indigo-800";
      case "accounts_paid":
        return "bg-emerald-100 text-emerald-800";
      
      // Order completed
      case "order_completed":
        return "bg-teal-100 text-teal-800";
      
      // Default case
      default:
        return "bg-gray-100 text-gray-800";
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

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: null }));
      }, 3000);

      // Refresh orders to get the updated data
      fetchOrders();

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

  const deleteOrder = async (orderId, ID) => {
    if (!window.confirm(`Are you sure you want to delete order ${ID}?`)) return;
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order._id !== orderId)
    );
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_URL}/api/v1/admin/deleteOrder/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `${token}` },
      });
    } catch (error) {
      alert(`Something went wrong: ${error.message}`);
      fetchOrders();
    }
  };

  // Function to handle row click
  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Function to stop event propagation for action buttons
  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  // Toggle search field
  const toggleSearchField = (field) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Enhanced search function that checks all specified fields
  const filteredOrders = orders.filter(order => {
    // Skip filtering if search query is empty
    if (searchQuery === "") {
      return filterStatus === "" || order.status === filterStatus;
    }

    const query = searchQuery.toLowerCase();
    let matches = false;

    // Check each enabled field
    if (searchFields.orderId && order.orderId) {
      matches = matches || order.orderId.toLowerCase().includes(query);
    }

    if (searchFields.customerName && order.customer?.name) {
      matches = matches || order.customer.name.toLowerCase().includes(query);
    }

    if (searchFields.status && order.status) {
      matches = matches || order.status.toLowerCase().includes(query);
    }

    if (searchFields.assigned && order.assignedTo) {
      const assignedName = `${order.assignedTo.firstName || ''} ${order.assignedTo.lastName || ''}`.trim();
      matches = matches || assignedName.toLowerCase().includes(query);
    }

    if (searchFields.requirements && order.requirements) {
      matches = matches || order.requirements.toLowerCase().includes(query);
    }

    if (searchFields.createdAt && order.created) {
      matches = matches || order.created.toLowerCase().includes(query);
    }

    // Apply status filter if specified
    if (filterStatus !== "") {
      return matches && order.status === filterStatus;
    }

    return matches;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto">
        {/* <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Orders Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and track orders efficiently
            </p>
          </div>
          <button
            onClick={() => {
              setShowEditModal(false);
              setShowCreateModal(true);
            }}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" /> New Order
          </button>
        </div> */}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            {/* Search Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 mr-0 md:mr-4 mb-4 md:mb-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search orders by ${Object.keys(searchFields).filter(key => searchFields[key]).join(', ')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-4">
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
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setShowCreateModal(true);
                  }}
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="mr-2 h-5 w-5" /> New Order
                </button>
              </div>
            </div>

            {/* Search Fields Toggles */}
            <div className="mt-3 flex flex-wrap items-center text-sm">
              <span className="mr-2 text-gray-600">Search in:</span>
              {Object.entries(searchFields).map(([field, enabled]) => (
                <button
                  key={field}
                  onClick={() => toggleSearchField(field)}
                  className={`mr-2 mb-2 px-3 py-1 rounded-full text-xs ${enabled
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                    }`}
                >
                  {field === 'orderId' ? 'Order ID' :
                    field === 'customerName' ? 'Customer Name' :
                      field === 'createdAt' ? 'Created At' :
                        field.charAt(0).toUpperCase() + field.slice(1)}
                </button>
              ))}
            </div>

            {/* Order Count */}
            <div className="mt-3 text-sm text-gray-600">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
              {searchQuery && <span> matching "{searchQuery}"</span>}
              {filterStatus && <span> with status "{filterStatus}"</span>}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b text-nowrap">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      At
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requirements
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-nowrap">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(order)}
                      >
                        <td className="px-4 py-5">{order.orderId}</td>
                        <td className="px-4 py-5">{order.customer.name}</td>
                        <td className="px-4 py-5">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          {order.assignedTo
                            ? order.assignedTo.accountType
                            : "Not Assigned"
                          }
                        </td>
                        <td className="px-4 py-5">
                          {order.assignedTo
                            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`
                            : "Not Assigned"}
                        </td>

                        <td className="px-4 py-5">{order.created}</td>
                        <td className="px-4 py-5">
                          {order.requirements && order.requirements.length > 50
                            ? `${order.requirements.substring(0, 50)}...`
                            : order.requirements}
                        </td>

                        <td className="px-4 py-5" onClick={handleActionClick}>
                          <button
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-center h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewImage(order.image, order._id);
                            }}
                            disabled={imageLoading[order._id]}
                          >
                            {imageLoading[order._id] ? (
                              <Loader className="h-2 w-2" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </td>

                        <td className="px-8 py-5 text-right" onClick={handleActionClick}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOrder(order._id);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOrder(order._id, order.orderId);
                            }}
                            className="text-red-600 hover:text-red-900 ml-3"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-8 py-12 text-center text-gray-500">
                        No orders found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Component */}
          {!loading && filteredOrders.length > 0 && (
            <div className="bg-white px-8 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastOrder, filteredOrders.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredOrders.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Show page numbers */}
                    {[...Array(totalPages).keys()].map(number => {
                      // Show only a subset of pages if there are many
                      const pageNumber = number + 1;

                      // Show first page, last page, and pages around the current one
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        (pageNumber === currentPage - 3 && currentPage > 3) ||
                        (pageNumber === currentPage + 3 && currentPage < totalPages - 2)
                      ) {
                        // Show ellipsis for skipped pages
                        return (
                          <span
                            key={pageNumber}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }

                      // Don't render other page numbers
                      return null;
                    })}

                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateNewOrder
          onClose={() => setShowCreateModal(false)}
          addOrder={addOrder}
        />
      )}
      {showEditModal && (
        <EditOrder
          onClose={() => setShowEditModal(false)}
          editOrder={editingOrder}
          updateOrder={updateOrder}
        />
      )}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={handleClosePreview}
        />
      )}
      {/* Add the OrderDetailsModal */}
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

export default Orders;



