import React, { useState, useEffect } from "react";
import { X, Download, Loader, FileText, Camera, Package, User, Calendar, List, CheckCircle, UserPlus ,  ThumbsUp, ThumbsDown } from "lucide-react";
import axios from "axios"; // Make sure axios is imported
import toast from "react-hot-toast";

const OrderDetailsModal = ({ order, onClose }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_PREFIX = "/api/v1/admin";
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [cutoutUsers, setCutoutUsers] = useState([]);
  const [selectedCutoutUser, setSelectedCutoutUser] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState(null);

  useEffect(() => {
    if (order) {
      fetchFileData();
      fetchCutoutUsers();
    }
  }, [order]);

  const fetchFileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${API_PREFIX}/files/order/${order._id}`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file data");
      }

      const data = await response.json();
      setFileData(data.data);
    } catch (err) {
      console.error("Error fetching file data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCutoutUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/v1/auth/getAllUsers`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        const filteredUsers = response.data.data.filter(user => user.accountType === "Cutout");
        setCutoutUsers(filteredUsers);

        // If the order is already assigned to a Cutout user, preselect them
        if (order.assignedTo && filteredUsers.some(user => user._id === order.assignedTo._id)) {
          setSelectedCutoutUser(order.assignedTo._id);
        }
      }
    } catch (error) {
      console.error("Error fetching Cutout users:", error);
    }
  };


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



  const getStatusIcon = (status) => {
    switch (status) {
      case "New":
        return <Package className="w-4 h-4" />;
      case "InProgress":
        return <Loader className="w-4 h-4" />;
      case "PendingApproval":
        return <List className="w-4 h-4" />;
      case "Approved":
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const downloadFile = async (documentId, fileType = null, downloadType = "single", fileIndex = null, filename = "") => {
    try {
      let url;
      const downloadId = `${downloadType}-${fileType || "all"}-${documentId}${fileIndex !== null ? `-${fileIndex}` : ""}`;
      setDownloadingFile(downloadId);

      // Generate URL based on download type
      switch (downloadType) {
        case "all":
          // Download all files (both CAD and images)
          url = `${API_PREFIX}/files/download-all/${documentId}`;
          break;
        case "type":
          // Download all files of a specific type (CAD or images)
          url = `${API_PREFIX}/files/download-all-type/${documentId}?type=${fileType}`;
          break;
        case "single":
          // Download a specific file
          url = `${API_PREFIX}/files/download/${documentId}/${fileIndex}?type=${fileType}`;
          break;
        default:
          throw new Error("Invalid download type");
      }

      const token = localStorage.getItem("token");
      const fullUrl = `${BASE_URL}${url}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || `${fileType || "all"}_files_${order.orderId}.zip`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.error("Failed to download file");
    } finally {
      // Clear downloading state after a short delay
      setTimeout(() => setDownloadingFile(null), 1000);
    }
  };
  console.log("order", fileData);

  const renderDetailsTab = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center border-b border-gray-100">
          <div className="w-full p-5 border-r border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Order Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Order ID</span>
                <span className="text-sm font-semibold">{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(order.status)}
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Created</span>
                <span className="text-sm">{order.created}</span>
              </div>
            </div>
          </div>

  
        </div>


   <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <List className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Requirements</h3>
            </div>
            
            {/* Admin Approval/Rejection Buttons - Only shown when status is graphics_complete */}
            {order.status === "graphics_completed" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate("cutout_pending")}
                  disabled={statusUpdateLoading}
                  className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingButton === "cutout_pending" ? (
                    <Loader className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-3 w-3 mr-1.5" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate("admin_rejected")}
                  disabled={statusUpdateLoading}
                  className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingButton ===  "admin_rejected" ? (
                    <Loader className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <ThumbsDown className="h-3 w-3 mr-1.5" />
                  )}
                  Reject
                </button>
              </div>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed">
            {order.requirements || "No specific requirements provided"}
          </div>
        </div>


      </div>

      {order.image && order.image.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center space-x-3 p-5 border-b border-gray-100">
            <div className="bg-rose-50 p-2 rounded-lg">
              <Camera className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Order Images</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {order.image.map((img, index) => (
                <div key={index} className="group relative rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                  <img
                    src={`${BASE_URL}${img}`}
                    alt={`Order image ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-start p-3">
                    <span className="text-white text-xs font-medium">Image {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const formatToIST = (utcDateString) => {
    const date = new Date(utcDateString);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const renderFilesTab = () => (
    <div>
      {loading ? (
        <div className="flex flex-col justify-center items-center py-8">
          <Loader className="animate-spin h-8 w-8 text-indigo-600 mb-3" />
          <span className="text-gray-500 text-sm">Loading files...</span>
        </div>
      ) : fileData && fileData.length > 0 ? (
        <div className="space-y-4">
          {fileData.map((doc) => (
            <div key={doc.id} className="w-full rounded-lg border-indigo-600 border bg-white shadow-md overflow-hidden">
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold">
                    Files (<span className="text-indigo-600">{
                      (doc.cadFiles?.length || 0) + 
                      (doc.images?.length || 0) + 
                      (doc.textFiles?.length || 0)
                    }</span>)
                      <span className="ml-2 font-normal  text-md"> ({formatToIST(doc.createdAt)})</span>
                  </h2>
                  
                  <button
                    onClick={() => downloadFile(doc.id, null, "all", null, `all_files_${order.orderId}.zip`)}
                    disabled={downloadingFile === `all-all-${doc.id}`}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-full flex items-center justify-center space-x-1.5 text-xs hover:bg-indigo-600 disabled:bg-[#D4A0E3] disabled:cursor-not-allowed transition-colors"
                  >
                    {downloadingFile === `all-all-${doc.id}` ? (
                      <>
                        <Loader className="h-3 w-3 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        <span>Download All</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="border-t border-gray-200 mb-3"></div>
  
                {/* File Type Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* CAD Files Card */}
                  {(!doc.cadFiles || doc.cadFiles.length === 0) ? null : (
                    <div className="rounded-lg border border-gray-200 p-2 hover:border-indigo-600 hover:bg-purple-50 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-md">
                            <FileText className="h-3.5 w-3.5 text-white" />
                          </div>
                          <h3 className="ml-1.5 text-sm font-medium text-gray-800">CAD Files</h3>
                        </div>
                        <span className="bg-purple-100 text-indigo-600 text-xs py-0.5 px-1.5 rounded-full font-medium">
                          {doc.cadFiles.length}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
                        {doc.cadFiles.slice(0, 3).map((file) => (
                          <div key={file.index} className="flex items-center justify-between p-1.5 bg-white rounded-md border border-gray-100 hover:border-[#A414D5]">
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="ml-1.5 text-xs text-gray-700 truncate max-w-[120px]">{file.filename}</span>
                            </div>
                            <button
                              onClick={() => downloadFile(doc.id, "cad", "single", file.index, file.filename)}
                              disabled={downloadingFile === `single-cad-${doc.id}-${file.index}`}
                              className="p-1 rounded-full bg-purple-50 hover:bg-purple-100 text-indigo-600 disabled:text-purple-300 disabled:cursor-not-allowed"
                            >
                              {downloadingFile === `single-cad-${doc.id}-${file.index}` ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                        {doc.cadFiles.length > 3 && (
                          <div className="text-center text-xs text-indigo-600">
                            +{doc.cadFiles.length - 3} more files
                          </div>
                        )}
                      </div>
              
                    </div>
                  )}
  
                  {/* Images Card */}
                  {(!doc.images || doc.images.length === 0) ? null : (
                    <div className="rounded-lg border border-gray-200 p-2 hover:border-indigo-600 hover:bg-purple-50 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-md">
                            <Camera className="h-3.5 w-3.5 text-white" />
                          </div>
                          <h3 className="ml-1.5 text-sm font-medium text-gray-800">Images</h3>
                        </div>
                        <span className="bg-purple-100 text-indigo-600 text-xs py-0.5 px-1.5 rounded-full font-medium">
                          {doc.images.length}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto mb-2">
                        {doc.images.slice(0, 4).map((img) => (
                          <div key={img.index} className="group relative rounded-md overflow-hidden border border-gray-100 hover:border-[#A414D5]">
                            <img
                              src={`${BASE_URL}${img.path}`}
                              alt={img.filename}
                              className="w-full h-12 object-cover "
                            />
                            <button
                              onClick={() => downloadFile(doc.id, "image", "single", img.index, img.filename)}
                              disabled={downloadingFile === `single-image-${doc.id}-${img.index}`}
                              className="absolute right-1 bottom-1 p-1 bg-white rounded-full hover:bg-gray-100 text-[#A414D5] disabled:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {downloadingFile === `single-image-${doc.id}-${img.index}` ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                        {doc.images.length > 4 && (
                          <div className="text-center col-span-2 text-xs text-indigo-600">
                            +{doc.images.length - 4} more images
                          </div>
                        )}
                      </div>
                 
                    </div>
                  )}
  
                  {/* Text Files Card */}
                  {(!doc.textFiles || doc.textFiles.length === 0) ? null : (
                    <div className="rounded-lg border border-gray-200 p-2 hover:border-[#A414D5] hover:bg-purple-50 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-md">
                            <FileText className="h-3.5 w-3.5 text-white" />
                          </div>
                          <h3 className="ml-1.5 text-sm font-medium text-gray-800">Text Files</h3>
                        </div>
                        <span className="bg-purple-100 text-[#A414D5] text-xs py-0.5 px-1.5 rounded-full font-medium">
                          {doc.textFiles.length}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
                        {doc.textFiles.slice(0, 3).map((file) => (
                          <div key={file.index} className="flex items-center justify-between p-1.5 bg-white rounded-md border border-gray-100 hover:border-[#A414D5]">
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="ml-1.5 text-xs text-gray-700 truncate max-w-[120px]">{file.filename}</span>
                            </div>
                            <button
                              onClick={() => downloadFile(doc.id, "text", "single", file.index, file.filename)}
                              disabled={downloadingFile === `single-text-${doc.id}-${file.index}`}
                              className="p-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#A414D5] disabled:text-purple-300 disabled:cursor-not-allowed"
                            >
                              {downloadingFile === `single-text-${doc.id}-${file.index}` ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                        {doc.textFiles.length > 3 && (
                          <div className="text-center text-xs text-[#A414D5]">
                            +{doc.textFiles.length - 3} more files
                          </div>
                        )}
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full rounded-lg border-[#A414D5] border bg-white shadow-md p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <FileText className="h-6 w-6 text-[#A414D5]" />
            </div>
          </div>
          <h3 className="text-base font-medium text-gray-700 mb-1">No Files Available</h3>
          <p className="text-gray-500 text-xs">No files have been uploaded for this order yet.</p>
        </div>
      )}
    </div>
  );




  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center border-b z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Order #{order.orderId}</h2>
            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "details"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "files"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Files
          </button>
   
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === "details"
            ? renderDetailsTab()
            : activeTab === "files"
              ? renderFilesTab()
                    : null}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
