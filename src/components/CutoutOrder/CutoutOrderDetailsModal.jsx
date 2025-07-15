import React, { useState, useEffect, useRef } from "react";
import { X, Download, Loader, FileText, Camera, Package, User, Calendar, List, CheckCircle, UserPlus, ThumbsUp, ThumbsDown, ZoomIn, Search, Eye } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const OrderDetailsModal = ({ order, onClose }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_PREFIX = "/api/v1/admin";
  const IMAGE_SEARCH_API = import.meta.env.VITE_FAST_API;
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [cutoutUsers, setCutoutUsers] = useState([]);
  const [selectedCutoutUser, setSelectedCutoutUser] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingImageId, setSearchingImageId] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef(null);

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
      setError(err.message);
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
        if (order.assignedTo && filteredUsers.some(user => user._id === order.assignedTo._id)) {
          setSelectedCutoutUser(order.assignedTo._id);
        }
      }
    } catch (error) {
      console.error("Error fetching Cutout users:", error);
    }
  };

  const handleImageSearch = async (imageUrl, filename, imageId) => {
    try {
      setIsSearching(true);
      setSearchingImageId(imageId);
      setError(null);
      setShowSearchResults(true);

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });

      const formData = new FormData();
      formData.append("file", file);

      const searchResponse = await fetch(`${IMAGE_SEARCH_API}/search`, {
        method: "POST",
        body: formData,
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const results = await searchResponse.json();

      const transformedResults = (results.similar_images || [])
        .filter((result) => result.similarity >= 0.7 && result.img_url && result.name)
        .map((result, index) => ({
          id: index + 1,
          url: result.img_url,
          cad_url: result.cad_url && result.cad_url !== "http://185.199.52.128:10000/None" ? result.cad_url : null,
          name: result.name,
          similarity: Math.round(result.similarity * 100),
          format: result.name.split(".").pop().toUpperCase(),
          searchedImage: { imageUrl, filename },
        }));

      setSearchResults(transformedResults);

      if (searchResultsRef.current) {
        searchResultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (err) {
      console.error("Image search error:", err);
      setError(`Image search failed: ${err.message}`);
      setSearchResults([]);
      toast.error(`Image search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
      setSearchingImageId(null);
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return "text-emerald-700 bg-emerald-100 border-emerald-200";
    if (similarity >= 70) return "text-amber-700 bg-amber-100 border-amber-200";
    return "text-red-700 bg-red-100 border-red-200";
  };

  const viewImage = (imageUrl) => {
    window.open(imageUrl, "_blank");
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    if (!fileUrl || fileUrl.includes("/None")) {
      toast.error("No valid file available for download");
      return;
    }

    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || fileUrl.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloading ${fileName || fileUrl.split("/").pop()}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed!");
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

      switch (downloadType) {
        case "all":
          url = `${API_PREFIX}/files/download-all/${documentId}`;
          break;
        case "type":
          url = `${API_PREFIX}/files/download-all-type/${documentId}?type=${fileType}`;
          break;
        case "single":
          url = `${API_PREFIX}/files/download/${documentId}/${fileIndex}?type=${fileType}`;
          break;
        default:
          throw new Error("Invalid download type");
      }

      const token = localStorage.getItem("token");
      const fullUrl = `${BASE_URL}${url}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { Authorization: `${token}` },
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

      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.error("Failed to download file");
    } finally {
      setTimeout(() => setDownloadingFile(null), 1000);
    }
  };

  const formatToIST = (utcDateString) => {
    const date = new Date(utcDateString);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const renderDetailsTab = () => (
    // ... (unchanged renderDetailsTab code)
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
                  {loadingButton === "admin_rejected" ? (
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

  const renderFilesTab = () => (
    <div className="space-y-6">
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage.src}
              alt={previewImage.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-12">
          <Loader className="animate-spin h-10 w-10 text-indigo-600 mb-4" />
          <span className="text-gray-500 text-sm">Loading files...</span>
        </div>
      ) : error ? (
        <div className="w-full rounded-xl border-red-300 border bg-red-50 shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Files</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : !fileData || fileData.length === 0 ? (
        <div className="w-full rounded-xl border-purple-300 border bg-white shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Files Available</h3>
          <p className="text-gray-500 text-sm">No files have been uploaded for this order yet.</p>
        </div>
      ) : (
        fileData.map((doc) => (
          <div key={doc.id} className="w-full rounded-xl border-2 border-indigo-200 bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Files
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {(doc.cadFiles?.length || 0) + (doc.images?.length || 0) + (doc.textFiles?.length || 0)}
                    </span>
                  </h2>
                  <p className="text/listsm text-gray-500 mt-1">{formatToIST(doc.createdAt)}</p>
                </div>
                <button
                  onClick={() => downloadFile(doc.id, null, "all", null, `all_files_${order.orderId}.zip`)}
                  disabled={downloadingFile === `all-all-${doc.id}`}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {downloadingFile === `all-all-${doc.id}` ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download All</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-200 mb-6"></div>
              <div className="flex flex-col lg:flex-row gap-6">
                {doc.images && doc.images.length > 0 && (
                  <div className="w-full lg:w-1/2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Images</h3>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {doc.images.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {doc.images.map((img) => (
                        <div key={img.index} className="group relative rounded-xl overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all shadow-md hover:shadow-lg">
                          <img
                            src={`${BASE_URL}${img.path}`}
                            alt={img.filename}
                            className="w-full h-54 object-cover cursor-pointer"
                            onClick={() => setPreviewImage({ src: `${BASE_URL}${img.path}`, filename: img.filename })}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <button
                                onClick={() => setPreviewImage({ src: `${BASE_URL}${img.path}`, filename: img.filename })}
                                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 text-gray-700 transition-all"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadFile(doc.id, "image", "single", img.index, img.filename)}
                                disabled={downloadingFile === `single-image-${doc.id}-${img.index}`}
                                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 text-purple-600 disabled:text-purple-300 transition-all"
                              >
                                {downloadingFile === `single-image-${doc.id}-${img.index}` ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleImageSearch(`${BASE_URL}${img.path}`, img.filename, `img-${doc.id}-${img.index}`)}
                                disabled={isSearching && searchingImageId === `img-${doc.id}-${img.index}`}
                                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full transition-all"
                                title="Search Similar Images"
                              >
                                {isSearching && searchingImageId === `img-${doc.id}-${img.index}` ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Search className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                            <p className="text-white text-xs font-medium truncate">{img.filename}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="w-full lg:w-1/2">
                  <div className="space-y-6">
                    {doc.cadFiles && doc.cadFiles.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-lg">
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800">CAD Files</h4>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                            {doc.cadFiles.length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {doc.cadFiles.map((file) => (
                            <div key={file.index} className="flex items-center justify-between p-2 bg-white rounded-lg border hover:border-indigo-300 transition-all">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-700 truncate">{file.filename}</span>
                              </div>
                              <button
                                onClick={() => downloadFile(doc.id, "cad", "single", file.index, file.filename)}
                                disabled={downloadingFile === `single-cad-${doc.id}-${file.index}`}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 disabled:text-indigo-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
                              >
                                {downloadingFile === `single-cad-${doc.id}-${file.index}` ? (
                                  <Loader className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {doc.textFiles && doc.textFiles.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-1.5 rounded-lg">
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800">Text Files</h4>
                          </div>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            {doc.textFiles.length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {doc.textFiles.map((file) => (
                            <div key={file.index} className="flex items-center justify-between p-2 bg-white rounded-lg border hover:border-green-300 transition-all">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-700 truncate">{file.filename}</span>
                              </div>
                              <button
                                onClick={() => downloadFile(doc.id, "text", "single", file.index, file.filename)}
                                disabled={downloadingFile === `single-text-${doc.id}-${file.index}`}
                                className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 disabled:text-green-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
                              >
                                {downloadingFile === `single-text-${doc.id}-${file.index}` ? (
                                  <Loader className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      {showSearchResults && (
        <div ref={searchResultsRef} className="p-4">
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden mb-8 border border-white/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-blue-900 flex items-center">
                <Search className="mr-3 h-6 w-6 text-blue-600" />
                Image Search Results ({searchResults.length})
              </h2>
              {searchResults[0]?.searchedImage && (
                <p className="text-sm text-blue-700 mt-1 truncate">
                  Similar images for: {searchResults[0].searchedImage.filename}
                </p>
              )}
              <button
                onClick={() => {
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Results
              </button>
            </div>
            <div className="p-6">
              {searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">🖼️</div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No similar images found</h3>
                  <p className="mt-1 text-sm text-gray-500">No images with ≥70% similarity were found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((result) => (
                    <div key={result.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className="relative">
                        <img
                          src={result.url}
                          alt={result.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                          }}
                        />
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => viewImage(result.url)}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-sm hover:scale-110 transition-all duration-200"
                            title="View Image"
                          >
                            <Eye className="h-4 w-4 text-gray-700" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-medium text-gray-900 truncate mb-2">{result.name}</p>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${getSimilarityColor(result.similarity)}`}>
                            {result.similarity}% match
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{result.format}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadFile(result.url, result.name)}
                            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Download className="h-3 w-3 mr-1.5" />
                             Image
                          </button>
                          {/* <button
                            onClick={() => handleDownloadFile(result.cad_url, result.name.replace(/\.[^/.]+$/, ".cad"))}
                            disabled={!result.cad_url}
                            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                          >
                            <Download className="h-3 w-3 mr-1.5" />
                            Download CAD
                          </button> */}

                          {result.cad_url && (
                            <button
                              onClick={() => handleDownloadFile(result.cad_url, result.name)}
                              className="flex-1 flex items-center justify-center px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-200 transition-colors"
                            >
                              <Download className="h-3 w-3 mr-1.5" />
                              CAD
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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