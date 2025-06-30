import React, { useEffect, useState } from "react";
import { 
  Search, 
  ChevronDown, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Archive, 
  Image,
  Calendar,
  User,
  FileText,
  Tag,
  BarChart3,
  Download
} from "lucide-react";

const Gallery = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [searchQuery, setSearchQuery] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);
  const [imageLoading, setImageLoading] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState("image"); // "image" or "cad"
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Edit form state
  const [editForm, setEditForm] = useState({
    description: "",
    tags: []
  });

  useEffect(() => {
    fetchGalleryItems();
    fetchGalleryStats();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, orderIdFilter]);

  useEffect(() => {
    if (searchQuery || orderIdFilter) {
      const timeoutId = setTimeout(() => {
        fetchGalleryItems();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchGalleryItems();
    }
  }, [searchQuery, orderIdFilter]);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (orderIdFilter) params.append('orderId', orderIdFilter);

      const response = await fetch(`${BASE_URL}/api/v1/gallery?${params}`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch gallery items");
      
      const data = await response.json();
      setGalleryItems(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/gallery/stats`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch gallery stats");
      
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching gallery stats:", error);
    }
  };

  // Helper function to get full URL
  const getFullUrl = (relativePath) => {
    if (!relativePath) return null;
    return relativePath.startsWith('http') ? relativePath : `${BASE_URL}${relativePath}`;
  };

  // Helper function to get display image
  const getDisplayImage = (item) => {
    return item.image ? getFullUrl(item.image) : getFullUrl(item.cadFile);
  };

  // Helper function to check if file is an image
  const isImageFile = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleImageLoad = (itemId) => {
    setImageLoading(prev => ({ ...prev, [itemId]: false }));
  };

  const handleImageError = (itemId) => {
    setImageLoading(prev => ({ ...prev, [itemId]: false }));
  };

  const openPreview = (item, type = "image") => {
    const imageUrl = type === "image" && item.image ? getFullUrl(item.image) : getFullUrl(item.cadFile);
    const title = type === "image" && item.imageName ? item.imageName : item.cadFileName;
    
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setActiveTab(type);
    setShowPreview(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditForm({
      description: item.description || "",
      tags: item.tags || []
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/gallery/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update gallery item");

      const data = await response.json();
      
      // Update the item in the local state
      setGalleryItems(prev => 
        prev.map(item => 
          item._id === selectedItem._id ? data.data : item
        )
      );
      
      setShowEditModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating gallery item:", error);
    }
  };

  const handleArchiveItem = async (itemId) => {
    if (!confirm("Are you sure you want to archive this gallery item?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/gallery/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `${token}` },
      });

      if (!response.ok) throw new Error("Failed to archive gallery item");

      // Remove the item from local state
      setGalleryItems(prev => prev.filter(item => item._id !== itemId));
      setTotalItems(prev => prev - 1);
    } catch (error) {
      console.error("Error archiving gallery item:", error);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim();
      if (!editForm.tags.includes(newTag)) {
        setEditForm(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === number
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
              <p className="text-gray-600 mt-2">Manage your design gallery and uploaded files</p>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Stats</span>
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Gallery Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.recentItems.length}</div>
                <div className="text-sm text-gray-600">Recent Items</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search gallery items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by Order ID..."
                value={orderIdFilter}
                onChange={(e) => setOrderIdFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {galleryItems.length === 0 ? (
            <div className="text-center py-12">
              <Image className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No gallery items found</h3>
              <p className="mt-1 text-sm text-gray-500">No items match your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleryItems.map((item) => {
                const displayImage = getDisplayImage(item);
                const hasImage = item.image && isImageFile(item.imageName);
                const hasCadFile = item.cadFile;
                
                return (
                  <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {imageLoading[item._id] !== false && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={item.imageName || item.cadFileName}
                          className="w-full h-full object-cover cursor-pointer"
                          onLoad={() => handleImageLoad(item._id)}
                          onError={() => handleImageError(item._id)}
                          onClick={() => openPreview(item, hasImage ? "image" : "cad")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {hasImage && (
                          <button
                            onClick={() => openPreview(item, "image")}
                            className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                            title="View Image"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {hasCadFile && (
                          <button
                            onClick={() => openPreview(item, "cad")}
                            className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                            title="View CAD File"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveItem(item._id)}
                          className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* File type indicators */}
                      <div className="absolute top-2 left-2 flex flex-col space-y-1">
                        {hasImage && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">IMG</span>
                        )}
                        {hasCadFile && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">CAD</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.imageName || item.cadFileName}
                      </h3>
                      
                      {item.order && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 mr-1" />
                          <span className="truncate">Order: {item.orderId}</span>
                        </div>
                      )}
                      
                      {item.order?.customerName && (
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span className="truncate">{item.order.customerName}</span>
                        </div>
                      )}
                      
                      {item.uploadedBy && (
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span className="truncate">By: {item.uploadedBy.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.createdAt || item.uploadDate).toLocaleDateString()}
                      </div>
                      
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {renderPagination()}
        </div>
      </div>

      {/* Image/CAD Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900 truncate max-w-md">
                  {previewTitle}
                </h3>
                {selectedItem && (
                  <div className="flex space-x-2">
                    {selectedItem.image && (
                      <button
                        onClick={() => {
                          setPreviewImage(getFullUrl(selectedItem.image));
                          setPreviewTitle(selectedItem.imageName);
                          setActiveTab("image");
                        }}
                        className={`px-3 py-1 text-sm rounded-md ${
                          activeTab === "image" 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Image
                      </button>
                    )}
                    {selectedItem.cadFile && (
                      <button
                        onClick={() => {
                          setPreviewImage(getFullUrl(selectedItem.cadFile));
                          setPreviewTitle(selectedItem.cadFileName);
                          setActiveTab("cad");
                        }}
                        className={`px-3 py-1 text-sm rounded-md ${
                          activeTab === "cad" 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        CAD File
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(previewImage, previewTitle)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 max-h-[80vh] overflow-auto">
              {previewImage && (
                <img
                  src={previewImage}
                  alt={previewTitle}
                  className="max-w-full max-h-full object-contain mx-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              )}
              <div 
                className="hidden items-center justify-center h-64 bg-gray-100 rounded-lg"
                style={{ display: 'none' }}
              >
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Unable to preview this file</p>
                  <button
                    onClick={() => handleDownload(previewImage, previewTitle)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Gallery Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  onKeyDown={handleTagInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Press Enter to add tags..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {editForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;