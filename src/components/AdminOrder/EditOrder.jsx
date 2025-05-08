import React, { useEffect, useState } from "react";
import { X, Upload, FileEdit, Eye } from "lucide-react";
import Loader from "../../pages/Loader";
import useGraphicsUsers from "../../pages/useGraphicsUsers";
import toast from "react-hot-toast";

const EditOrder = ({ onClose, editOrder }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const { filteredUsers, filterUsers, clearFilteredUsers } = useGraphicsUsers(BASE_URL);
  const [formData, setFormData] = useState({
    customerName: "",
    requirements: "",
    dimensions: "",
    status: "",
    assignedTo: "",
    assignedToId: "",
  });
  const [files, setFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (!editOrder) return;
    fetchOrderDetails();
  }, [editOrder]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/admin/getOrderById/${editOrder}`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch order");
      const data = await response.json();

      setOrder(data.order);

      // Handle image paths by ensuring they have the BASE_URL prefix
      const imagePaths = data.order.image || [];
      const fullImagePaths = imagePaths.map(path =>
        path.startsWith('http') ? path : `${BASE_URL}${path}`
      );

      setCurrentImages(fullImagePaths);

      setFormData({
        customerName: data.order.customer.name,
        requirements: data.order.requirements,
        dimensions: data.order.dimensions,
        status: data.order.status,
        assignedTo: data.order.assignedTo ? `${data.order.assignedTo.firstName} ${data.order.assignedTo.lastName}` : "",
        assignedToId: data.order.assignedTo ? data.order.assignedTo._id : "",
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "assignedTo") {
      filterUsers(value);
    }
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setImagePreview(selectedFiles.map((file) => URL.createObjectURL(file)));
    }
  };

  const handleSelectUser = (user) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: `${user.firstName} ${user.lastName}`,
      assignedToId: user._id,
    }));
    clearFilteredUsers();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const submitData = new FormData();
      submitData.append("requirements", formData.requirements);
      submitData.append("dimensions", formData.dimensions);
      submitData.append("assignedTo", formData.assignedToId || "undefined");
      submitData.append("status", formData.status);

      if (files.length > 0) {
        files.forEach((file) => {
          submitData.append("images", file);
        });
      }

      const response = await fetch(`${BASE_URL}/api/v1/admin/updateOrder/${editOrder}`, {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
        },
        body: submitData,
      });

      if (!response.ok) throw new Error("Failed to update order");

      const result = await response.json();
      console.log("Order Updated:", result);
      toast.success("Order updated successfully!");

      if (onClose) onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Something went wrong: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openFullImagePreview = (index) => {
    setSelectedImageIndex(index);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
  };

  const navigateImage = (direction) => {
    if (direction === "next") {
      setSelectedImageIndex((prev) =>
        prev === currentImages.length - 1 ? 0 : prev + 1
      );
    } else {
      setSelectedImageIndex((prev) =>
        prev === 0 ? currentImages.length - 1 : prev - 1
      );
    }
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 flex items-center">
        <Loader className="h-8 w-8 text-indigo-600" />
        <span className="ml-3 text-gray-700">Loading order details...</span>
      </div>
    </div>
  );

  if (!order) return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600">Order not found</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-md">Close</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 p-4">
      {showImagePreview && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg z-10"
            >
              <X className="h-6 w-6 text-gray-800" />
            </button>

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage("prev")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
                >
                  <X className="h-6 w-6 text-gray-800 rotate-45" />
                </button>
                <button
                  onClick={() => navigateImage("next")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
                >
                  <X className="h-6 w-6 text-gray-800 -rotate-45" />
                </button>
              </>
            )}

            <img
              src={currentImages[selectedImageIndex]}
              alt="Preview"
              className="max-h-[80vh] max-w-full object-contain mx-auto"
            />

            {currentImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {currentImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-2 w-2 rounded-full ${index === selectedImageIndex ? "bg-white" : "bg-gray-400"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-screen flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl md:text-2xl font-semibold text-indigo-700 flex items-center">
            <FileEdit className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            Edit Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-grow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Customer cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                name="requirements"
                placeholder="Detailed requirements..."
                value={formData.requirements}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <input
                type="text"
                name="dimensions"
                placeholder="e.g., 1920x1080px"
                value={formData.dimensions}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="New">New</option>
                <option value="InWorkQueue">In Work Queue</option>
                <option value="InProgress">In Progress</option>
                <option value="PendingApproval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Billed">Billed</option>
                <option value="Paid">Paid</option>
              </select>
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {/* Graphics stages */}
                <option value="graphics_pending">Graphics Pending</option>
                <option value="graphics_in_progress">Graphics In Progress</option>
                <option value="graphics_completed">Graphics Completed</option>

                {/* Admin stages */}
                <option value="admin_review">Admin Review</option>
                <option value="admin_rejected">Admin Rejected</option>
                <option value="cutout_pending">Admin Approved</option>

                {/* Cutout stages */}
                {/* <option value="cutout_pending">Cutout Pending</option> */}
                <option value="cutout_in_progress">Cutout In Progress</option>
                <option value="cutout_completed">Cutout Completed</option>

                {/* Accounts stages */}
                <option value="accounts_pending">Accounts Pending</option>
                <option value="accounts_billed">Accounts Billed</option>
                <option value="accounts_paid">Accounts Paid</option>

                {/* Order completed */}
                <option value="order_completed">Order Completed</option>
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input
                type="text"
                name="assignedTo"
                placeholder="Search graphics user..."
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {filteredUsers.length > 0 && (
                <ul className="absolute w-full bg-white border rounded-md shadow-md mt-1 z-10 max-h-32 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <li
                      key={user._id}
                      className="p-2 cursor-pointer hover:bg-indigo-50 transition-colors text-sm"
                      onClick={() => handleSelectUser(user)}
                    >
                      {user.firstName} {user.lastName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Images</label>
              {currentImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {currentImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Current ${index + 1}`}
                        className="h-20 w-full object-cover rounded-md cursor-pointer"
                        onClick={() => openFullImagePreview(index)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No images available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="file-upload-edit"
                />
                <label htmlFor="file-upload-edit" className="cursor-pointer flex flex-col items-center justify-center py-2">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="mt-1 text-sm text-gray-500">Click to upload new images</span>
                  <span className="text-xs text-gray-400 mt-1">(Will replace current images)</span>
                </label>
              </div>
            </div>

            {imagePreview.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Images Preview</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {imagePreview.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="h-20 w-full object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="border-t p-4 flex justify-end space-x-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="relative flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >

            Update Order

          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;