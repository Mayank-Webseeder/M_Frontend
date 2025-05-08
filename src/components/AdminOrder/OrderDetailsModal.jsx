import React, { useState, useEffect } from "react";
import { X, Download, Loader, FileText, Camera, Package, User, Calendar, List, CheckCircle, UserPlus ,  ThumbsUp, ThumbsDown } from "lucide-react";
import axios from "axios"; // Make sure axios is imported
import AccountAssign from "./AccountAssign";
import Logs from "./Logs";
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
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState(null);
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

  const handleAssignOrder = async () => {
    if (!selectedCutoutUser) {
      setAssignError("Please select a Cutout user");
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError(null);
      const token = localStorage.getItem("token");

      // Make sure we're using the correct API endpoint
      // Note that we're now using '/api/v1/cutout/assignOrder/' instead of the previous path
      const response = await axios.post(
        `${BASE_URL}/api/v1/admin/cutout/assignOrder/${order._id}`,
        { cutoutUserId: selectedCutoutUser },
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAssignSuccess(true);
        toast.success("Order assigned successfully!");
        // Reset success message after 3 seconds
        setTimeout(() => setAssignSuccess(false), 3000);
      } else {
        setAssignError("Failed to assign order");
        toast.error("Failed to assign order");
      }
    } catch (error) {
      console.error("Error assigning order:", error);
      setAssignError(error.response?.data?.message || "Failed to assign order");
    } finally {
      setAssignLoading(false);
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
  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);
      setLoadingButton(newStatus);
      const token = localStorage.getItem("token");

      const submitData = new FormData();
      submitData.append("status", newStatus);
      
      // Keep other fields the same
      submitData.append("requirements", order.requirements || "");
      submitData.append("dimensions", order.dimensions || "");
      submitData.append("assignedTo", order.assignedTo?._id || "undefined");

      const response = await fetch(`${BASE_URL}/api/v1/admin/updateOrder/${order._id}`, {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
        },
        body: submitData,
      });

      if (!response.ok) throw new Error("Failed to update order status");

      const result = await response.json();
      console.log("Order Status Updated:", result);
      toast.success(`Order status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      
      // Refresh the page to show the updated order status
      window.location.reload();
      
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update status: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
      setLoadingButton(null); 
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

    } catch (err) {
      console.error("Error downloading file:", err);
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
          <div className="w-1/2 p-5 border-r border-gray-100">
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

          <div className="w-1/2 p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Customer Details</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Customer Name</span>
                <span className="text-sm font-semibold">{order.customer?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Email Id</span>
                <span className="text-sm font-semibold">{order.customer?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Assigned To</span>
                <span className="text-sm">
                  {order.assignedTo
                    ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`
                    : "Not Assigned"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <List className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Requirements</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed">
            {order.requirements || "No specific requirements provided"}
          </div>
        </div> */}
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

  // const renderFilesTab = () => (
  //   <div>
  //     {loading ? (
  //       <div className="flex flex-col justify-center items-center py-16">
  //         <Loader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
  //         <span className="text-gray-500">Loading files...</span>
  //       </div>
  //     ) : fileData && fileData.length > 0 ? (
  //       <div className="space-y-6">
  //         {fileData.map((doc) => (
  //           <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
  //             <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-4 border-b">
  //               <div className="flex justify-between items-center">
  //                 <div className="flex items-center space-x-3">
  //                   <div className="bg-blue-500 p-2 rounded-lg">
  //                     <FileText className="h-5 w-5 text-white" />
  //                   </div>
  //                   <span className="font-medium text-gray-800">File Group</span>
  //                 </div>

  //                 {/* Download All Files Button */}
  //                 <div className="flex gap-2">
  //                   <button
  //                     onClick={() => downloadFile(doc.id, null, "all", null, `all_files_${order.orderId}.zip`)}
  //                     disabled={downloadingFile === `all-all-${doc.id}`}
  //                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shadow-sm"
  //                   >
  //                     {downloadingFile === `all-all-${doc.id}` ? (
  //                       <>
  //                         <Loader className="h-4 w-4 mr-2 animate-spin" /> Downloading...
  //                       </>
  //                     ) : (
  //                       <>
  //                         <Download className="h-4 w-4 mr-2" /> Download All
  //                       </>
  //                     )}
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* CAD files */}
  //             {doc.cadFiles && doc.cadFiles.length > 0 && (
  //               <div className="px-5 py-4 border-b border-gray-100">
  //                 <div className="flex justify-between items-center mb-3">
  //                   <div className="flex items-center space-x-2">
  //                     <div className="bg-indigo-100 p-1.5 rounded-lg">
  //                       <FileText className="h-4 w-4 text-indigo-600" />
  //                     </div>
  //                     <h4 className="font-medium text-gray-700">CAD Files</h4>
  //                   </div>

  //                   {/* Download All CAD Files Button */}
  //                   <button
  //                     onClick={() => downloadFile(doc.id, "cad", "type", null, `cad_files_${order.orderId}.zip`)}
  //                     disabled={downloadingFile === `type-cad-${doc.id}`}
  //                     className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs rounded-lg hover:bg-indigo-200 disabled:bg-indigo-50 disabled:text-indigo-300 disabled:cursor-not-allowed transition-colors"
  //                   >
  //                     {downloadingFile === `type-cad-${doc.id}` ? (
  //                       <>
  //                         <Loader className="h-3 w-3 mr-1.5 animate-spin" /> Downloading...
  //                       </>
  //                     ) : (
  //                       <>
  //                         <Download className="h-3 w-3 mr-1.5" /> All CAD Files
  //                       </>
  //                     )}
  //                   </button>
  //                 </div>
  //                 <div className="bg-gray-50 rounded-lg overflow-hidden">
  //                   <table className="min-w-full divide-y divide-gray-200">
  //                     <thead>
  //                       <tr>
  //                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
  //                         <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
  //                       </tr>
  //                     </thead>
  //                     <tbody className="divide-y divide-gray-200 bg-white">
  //                       {doc.cadFiles.map((file) => (
  //                         <tr key={file.index} className="hover:bg-gray-50 transition-colors">
  //                           <td className="px-4 py-3 text-sm font-medium text-gray-700 flex items-center">
  //                             <FileText className="h-4 w-4 text-gray-400 mr-2" />
  //                             {file.filename}
  //                           </td>
  //                           <td className="px-4 py-3 text-right">
  //                             <button
  //                               onClick={() => downloadFile(doc.id, "cad", "single", file.index, file.filename)}
  //                               disabled={downloadingFile === `single-cad-${doc.id}-${file.index}`}
  //                               className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
  //                             >
  //                               {downloadingFile === `single-cad-${doc.id}-${file.index}` ? (
  //                                 <>
  //                                   <Loader className="h-3 w-3 mr-1.5 animate-spin" /> Downloading
  //                                 </>
  //                               ) : (
  //                                 <>
  //                                   <Download className="h-3 w-3 mr-1.5" /> Download
  //                                 </>
  //                               )}
  //                             </button>
  //                           </td>
  //                         </tr>
  //                       ))}
  //                     </tbody>
  //                   </table>
  //                 </div>
  //               </div>
  //             )}

  //             {/* Image files */}
  //             {doc.images && doc.images.length > 0 && (
  //               <div className="px-5 py-4">
  //                 <div className="flex justify-between items-center mb-3">
  //                   <div className="flex items-center space-x-2">
  //                     <div className="bg-rose-100 p-1.5 rounded-lg">
  //                       <Camera className="h-4 w-4 text-rose-600" />
  //                     </div>
  //                     <h4 className="font-medium text-gray-700">Images</h4>
  //                   </div>

  //                   {/* Download All Images Button */}
  //                   <button
  //                     onClick={() => downloadFile(doc.id, "image", "type", null, `images_${order.orderId}.zip`)}
  //                     disabled={downloadingFile === `type-image-${doc.id}`}
  //                     className="inline-flex items-center px-3 py-1.5 bg-rose-100 text-rose-700 text-xs rounded-lg hover:bg-rose-200 disabled:bg-rose-50 disabled:text-rose-300 disabled:cursor-not-allowed transition-colors"
  //                   >
  //                     {downloadingFile === `type-image-${doc.id}` ? (
  //                       <>
  //                         <Loader className="h-3 w-3 mr-1.5 animate-spin" /> Downloading...
  //                       </>
  //                     ) : (
  //                       <>
  //                         <Download className="h-3 w-3 mr-1.5" /> All Images
  //                       </>
  //                     )}
  //                   </button>
  //                 </div>
  //                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  //                   {doc.images.map((img) => (
  //                     <div key={img.index} className="group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
  //                       <img
  //                         src={`${BASE_URL}${img.path}`}
  //                         alt={img.filename}
  //                         className="w-full h-28 object-cover"
  //                       />
  //                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
  //                         <span className="text-white text-xs font-medium truncate max-w-[70%]">{img.filename}</span>
  //                         <button
  //                           onClick={() => downloadFile(doc.id, "image", "single", img.index, img.filename)}
  //                           disabled={downloadingFile === `single-image-${doc.id}-${img.index}`}
  //                           className="p-1.5 bg-white rounded-full hover:bg-gray-100 disabled:bg-gray-200 transition-colors shadow-sm"
  //                         >
  //                           {downloadingFile === `single-image-${doc.id}-${img.index}` ? (
  //                             <Loader className="h-3 w-3 animate-spin text-gray-600" />
  //                           ) : (
  //                             <Download className="h-3 w-3 text-gray-600" />
  //                           )}
  //                         </button>
  //                       </div>
  //                     </div>
  //                   ))}
  //                 </div>
  //               </div>
  //             )}
              
  //             {doc.textFiles && doc.textFiles.length > 0 && (
  //               <div className="mt-6">
  //                 <div className="flex justify-between items-center mb-3">
  //                   <div className="flex items-center space-x-2">
  //                     <div className="bg-emerald-100 p-1.5 rounded-lg">
  //                       <FileText className="h-4 w-4 text-emerald-600" />
  //                     </div>
  //                     <h4 className="font-medium text-gray-700">Text Files ({doc.textFiles.length})</h4>
  //                   </div>
                    
  //                   {/* Download All Text Files Button */}
  //                   <button
  //                     onClick={() => downloadFile(doc.id, "text", "type", null, `text_files_${order.orderId}.zip`)}
  //                     disabled={downloadingFile === `type-text-${doc.id}`}
  //                     className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs rounded-lg hover:bg-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-300 disabled:cursor-not-allowed transition-colors"
  //                   >
  //                     {downloadingFile === `type-text-${doc.id}` ? (
  //                       <>
  //                         <Loader className="h-3 w-3 mr-1.5 animate-spin" /> Downloading...
  //                       </>
  //                     ) : (
  //                       <>
  //                         <Download className="h-3 w-3 mr-1.5" /> All Text Files
  //                       </>
  //                     )}
  //                   </button>
  //                 </div>
                  
  //                 <div className="bg-gray-50 rounded-lg overflow-hidden">
  //                   <table className="min-w-full divide-y divide-gray-200">
  //                     <thead>
  //                       <tr>
  //                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
  //                         <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
  //                       </tr>
  //                     </thead>
  //                     <tbody className="divide-y divide-gray-200 bg-white">
  //                       {doc.textFiles.map((file) => (
  //                         <tr key={file.index} className="hover:bg-gray-50 transition-colors">
  //                           <td className="px-4 py-3 text-sm font-medium text-gray-700 flex items-center">
  //                             <FileText className="h-4 w-4 text-gray-400 mr-2" />
  //                             {file.filename}
  //                           </td>
  //                           <td className="px-4 py-3 text-right">
  //                             <button
  //                               onClick={() => downloadFile(doc.id, "text", "single", file.index, file.filename)}
  //                               disabled={downloadingFile === `single-text-${doc.id}-${file.index}`}
  //                               className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
  //                             >
  //                               {downloadingFile === `single-text-${doc.id}-${file.index}` ? (
  //                                 <>
  //                                   <Loader className="h-3 w-3 mr-1.5 animate-spin" /> Downloading
  //                                 </>
  //                               ) : (
  //                                 <>
  //                                   <Download className="h-3 w-3 mr-1.5" /> Download
  //                                 </>
  //                               )}
  //                             </button>
  //                           </td>
  //                         </tr>
  //                       ))}
  //                     </tbody>
  //                   </table>
  //                 </div>
  //               </div>
  //             )}
         

  //           </div>
  //         ))}
  //       </div>
  //     ) : (
  //       <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
  //         <div className="flex justify-center mb-4">
  //           <div className="bg-gray-200 p-3 rounded-full">
  //             <FileText className="h-8 w-8 text-gray-400" />
  //           </div>
  //         </div>
  //         <h3 className="text-lg font-medium text-gray-700 mb-2">No Files Available</h3>
  //         <p className="text-gray-500 text-sm">No files have been uploaded for this order yet.</p>
  //       </div>
  //     )}
  //   </div>
  // );
  const formatToIST = (utcDateString) => {
    const date = new Date(utcDateString);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const renderFilesTab = () => (
    <div>
      {loading ? (
        <div className="flex flex-col justify-center items-center py-8 ">
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
                    } 
                  </span>)
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


  const renderAssignTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-purple-50 p-2 rounded-lg">
            <UserPlus className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Assign to Cutout Account</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Assign this order to a Cutout account user who will handle the processing and Cutout of this order.
        </p>
      </div>

      <div className="p-6">
        {/* Cutout user selection */}
        <div className="mb-6">
          <label htmlFor="cutoutUser" className="block text-sm font-medium text-gray-700 mb-2">
            Select Cutout User
          </label>
          <select
            id="cutoutUser"
            value={selectedCutoutUser}
            onChange={(e) => setSelectedCutoutUser(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          >
            <option value="">-- Select Cutout User --</option>
            {cutoutUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Current assignment info */}
        {order.assignedTo && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Currently assigned to:</span>
            </p>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-200 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {order.assignedTo.firstName} {order.assignedTo.lastName}
                </p>
                <p className="text-xs text-gray-500">{order.assignedTo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Response messages */}
        {assignSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg text-green-700">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <p>Order successfully assigned!</p>
            </div>
          </div>
        )}

        {assignError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
            <p>{assignError}</p>
          </div>
        )}

        {/* Assign button */}
        <button
          onClick={handleAssignOrder}
          disabled={assignLoading || !selectedCutoutUser}
          className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
        >
          {assignLoading ? (
            <>
              <Loader className="animate-spin mr-2 h-4 w-4" />
              Assigning...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              Cutout
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderAccountsTab = () => (
    <div className="">
      {/* Accounting User Assignment */}
      <AccountAssign order={order} BASE_URL={BASE_URL} />
    </div>
  );

  const renderLogsTab = () => (
    <div className="">
      {/* Accounting User Assignment */}
      <Logs order={order} BASE_URL={BASE_URL} />
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
          <button
            onClick={() => setActiveTab("cutout")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "cutout"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Cutout
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "accounts"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "logs"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Logs
          </button>
        </div>
        {/* <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === "details" 
            ? renderDetailsTab() 
            : activeTab === "files" 
              ? renderFilesTab() 
              : activeTab === "assign" 
                ? renderAssignTab()
                : renderAccountsTab()}
        </div> */}

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === "details"
            ? renderDetailsTab()
            : activeTab === "files"
              ? renderFilesTab()
              : activeTab === "cutout"
                ? renderAssignTab()
                : activeTab === "accounts"
                  ? renderAccountsTab()
                  : activeTab === "logs"
                    ? renderLogsTab()
                    : null}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
