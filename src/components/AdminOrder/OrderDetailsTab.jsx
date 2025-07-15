import React, { useState, useEffect, useRef } from "react";
import { Package, User, List, Camera, CheckCircle, Loader, ThumbsUp, ThumbsDown, Search, Download } from "lucide-react";
import toast from "react-hot-toast";

const OrderDetailsTab = ({ order, BASE_URL }) => {
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingImageId, setSearchingImageId] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef(null);
  const IMAGE_SEARCH_API = import.meta.env.VITE_FAST_API;

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

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);
      setLoadingButton(newStatus);
      const token = localStorage.getItem("token");

      const submitData = new FormData();
      submitData.append("status", newStatus);
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
      toast.success(`Order status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      window.location.reload();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update status: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
      setLoadingButton(null);
    }
  };

  const handleImageSearch = async (imageUrl, filename, imageId) => {
    try {
      setIsSearching(true);
      setSearchingImageId(imageId);
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

      // Validate and transform the API response
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
        searchResultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error("Image search error:", err);
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

  return (
    <div className="space-y-8">
      {/* Order Information and Customer Details */}
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

        {/* Requirements Section */}
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

      {/* Order Images */}
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
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => handleImageSearch(`${BASE_URL}${img}`, `order_image_${index + 1}.jpg`, `img-${order._id}-${index}`)}
                        disabled={isSearching && searchingImageId === `img-${order._id}-${index}`}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full transition-all"
                        title="Search Similar Images"
                      >
                        {isSearching && searchingImageId === `img-${order._id}-${index}` ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white text-xs font-medium">Image {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
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
                            e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                          }}
                        />
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
                            Download Image
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
};

export default OrderDetailsTab;