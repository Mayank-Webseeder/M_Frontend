import React, { useState, useEffect } from 'react';
import {
  Search, Download, Eye, Grid, List,
  Filter, ChevronDown, SortAsc, SortDesc,
  AlertCircle, X, Image as ImageIcon, FileText,
  Calendar, User, Hash, ChevronLeft, ChevronRight,
  ZoomIn, FolderOpen, ExternalLink, Sparkles
} from 'lucide-react';

const Gallery = () => {
  const [orders, setOrders] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [filteredGalleryImages, setFilteredGalleryImages] = useState([]); // For name search
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingImageId, setSearchingImageId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [nameSearch, setNameSearch] = useState(''); // Search by image name

  // API Configuration
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_PREFIX = '/api/v1';
  const IMAGE_SEARCH_API = import.meta.env.VITE_FAST_API;

  // Load orders and their files on component mount
  useEffect(() => {
    fetchOrdersWithFiles();
  }, []);

  // Auto-clear error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filter gallery by image name
  useEffect(() => {
    const filtered = galleryImages.filter(item => {
      if (!nameSearch) return true;
      const searchLower = nameSearch.toLowerCase();
      return (
        item.referenceImages.some(img => img.filename.toLowerCase().includes(searchLower)) ||
        item.uploadedImages.some(img => img.filename.toLowerCase().includes(searchLower))
      );
    });
    setFilteredGalleryImages(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [nameSearch, galleryImages]);

  const fetchOrdersWithFiles = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("token");
      const ordersResponse = await fetch(`${BASE_URL}/api/v1/admin/getOrders`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });

      if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders);

      const galleryItems = [];

      for (const order of ordersData.orders) {
        try {
          const fileResponse = await fetch(`${BASE_URL}${API_PREFIX}/admin/files/order/${order._id}`, {
            method: "GET",
            headers: { Authorization: `${token}` },
          });

          if (fileResponse.ok) {
            const fileData = await fileResponse.json();

            let allUploadedImages = [];
            let allCadFiles = [];
            let allTextFiles = [];

            fileData.data.forEach((dataEntry, dataIndex) => {
              if (dataEntry.images) {
                dataEntry.images.forEach((image, imageIndex) => {
                  allUploadedImages.push({
                    id: `up_${order._id}_${dataIndex}_${imageIndex}`,
                    imageUrl: `${BASE_URL}${image.path}`,
                    filename: image.filename,
                    downloadUrl: `${BASE_URL}${image.downloadUrl}`,
                    index: imageIndex,
                    dataIndex: dataIndex,
                    type: 'uploaded'
                  });
                });
              }

              if (dataEntry.cadFiles) {
                dataEntry.cadFiles.forEach((cadFile, cadIndex) => {
                  allCadFiles.push({
                    ...cadFile,
                    id: `cad_${order._id}_${dataIndex}_${cadIndex}`,
                    dataIndex: dataIndex
                  });
                });
              }

              if (dataEntry.textFiles) {
                dataEntry.textFiles.forEach((textFile, textIndex) => {
                  allTextFiles.push({
                    ...textFile,
                    id: `text_${order._id}_${dataIndex}_${textIndex}`,
                    dataIndex: dataIndex
                  });
                });
              }
            });

            if (allUploadedImages.length > 0 || allCadFiles.length > 0 || order.image?.length > 0) {
              galleryItems.push({
                id: order._id,
                orderId: order.orderId,
                orderObjectId: order._id,
                referenceImages: order.image ? order.image.map((imagePath, index) => ({
                  id: `ref_${order._id}_${index}`,
                  imageUrl: `${BASE_URL}${imagePath}`,
                  filename: imagePath.split('/').pop(),
                  downloadUrl: `${BASE_URL}${imagePath}`,
                  index: index,
                  type: 'reference'
                })) : [],
                uploadedImages: allUploadedImages,
                customer: order.customer,
                status: order.status,
                requirements: order.requirements,
                dimensions: order.dimensions,
                createdAt: order.createdAt,
                assignedTo: order.assignedTo,
                cadFiles: allCadFiles,
                textFiles: allTextFiles,
                cadCount: allCadFiles.length,
                uploadedImageCount: allUploadedImages.length,
                referenceImageCount: order.image ? order.image.length : 0,
                totalImageCount: (order.image ? order.image.length : 0) + allUploadedImages.length
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching files for order ${order._id}:`, err);
        }
      }

      setGalleryImages(galleryItems);
      setFilteredGalleryImages(galleryItems); // Initialize filtered gallery
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load gallery data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async (imageUrl, filename, imageId) => {
    try {
      setIsSearching(true);
      setSearchingImageId(imageId);
      setError('');

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });

      const formData = new FormData();
      formData.append('file', file);

      const searchResponse = await fetch(`${IMAGE_SEARCH_API}/search`, {
        method: 'POST',
        body: formData,
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const results = await searchResponse.json();

      const transformedResults = results
        .filter(result => result.similarity >= 0.7) // Filter for >= 70% similarity
        .map((result, index) => ({
          id: index + 1,
          url: result.url,
          name: result.name,
          similarity: Math.round(result.similarity * 100),
          format: result.name.split('.').pop().toUpperCase(),
          searchedImage: { imageUrl, filename }
        }));

      setSearchResults(transformedResults);
      setShowOrderModal(false);
    } catch (err) {
      console.error('Image search error:', err);
      setError(`Image search failed: ${err.message}`);
      setSearchResults([]); // Clear results on error to show "not found"
    } finally {
      setIsSearching(false);
      setSearchingImageId(null);
      // Close pop-up after 3 seconds if results are found
      if (searchResults.length > 0) {
        setTimeout(() => setSearchResults([]), 3000);
      }
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'order_completed': 'text-emerald-700 bg-emerald-100 border-emerald-200',
      'accounts_paid': 'text-blue-700 bg-blue-100 border-blue-200',
      'in_progress': 'text-amber-700 bg-amber-100 border-amber-200',
      'graphics_pending': 'text-orange-700 bg-orange-100 border-orange-200',
      'pending': 'text-gray-700 bg-gray-100 border-gray-200',
      'cancelled': 'text-red-700 bg-red-100 border-red-200'
    };
    return statusColors[status] || 'text-gray-700 bg-gray-100 border-gray-200';
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (similarity >= 70) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const downloadImage = async (downloadUrl, filename) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file');
    }
  };

  const viewImage = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Filter and sort gallery items
  const filteredAndSortedImages = filteredGalleryImages
    .filter(item => filterStatus === 'all' || item.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (sortBy === 'orderId') {
        return sortOrder === 'desc'
          ? b.orderId.localeCompare(a.orderId)
          : a.orderId.localeCompare(b.orderId);
      } else if (sortBy === 'customer') {
        return sortOrder === 'desc'
          ? b.customer.name.localeCompare(a.customer.name)
          : a.customer.name.localeCompare(b.customer.name);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedImages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayImages = filteredAndSortedImages.slice(startIndex, startIndex + itemsPerPage);

  const uniqueStatuses = [...new Set(galleryImages.map(item => item.status))];

  // Image carousel component
  const ImageCarousel = ({ images, title, onImageSearch, onViewImage, onDownloadImage }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const currentImage = images[currentImageIndex];

    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title} ({images.length})</h4>
        <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <img
            src={currentImage.imageUrl}
            alt={currentImage.filename}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
            }}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </>
          )}

          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={() => onViewImage(currentImage.imageUrl)}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-sm hover:scale-110 transition-all duration-200"
              title="View Image"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDownloadImage(currentImage.downloadUrl, currentImage.filename)}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-sm hover:scale-110 transition-all duration-200"
              title="Download Image"
            >
              <Download className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onImageSearch(currentImage.imageUrl, currentImage.filename, currentImage.id)}
              disabled={isSearching && searchingImageId === currentImage.id}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-2 rounded-lg shadow-sm hover:scale-110 transition-all duration-200"
              title="Search Similar Images"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrderModal = ({ order, isOpen, onClose }) => {
    if (!isOpen || !order) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details - {order.orderId}
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="space-y-3 text-sm">
                    <p className="flex items-center">
                      <User className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium">Customer:</span> <span className="ml-1">{order.customer.name}</span>
                    </p>
                    <p className="flex items-center">
                      <ExternalLink className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium">Email:</span> <span className="ml-1 truncate">{order.customer.email}</span>
                    </p>
                    <p className="flex items-center">
                      <Hash className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <ImageIcon className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium">Dimensions:</span> <span className="ml-1">{order.dimensions}</span>
                    </p>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium">Created:</span> <span className="ml-1">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </p>
                    {order.assignedTo && (
                      <p className="flex items-center">
                        <User className="h-4 w-4 text-indigo-600 mr-2" />
                        <span className="font-medium">Assigned to:</span> <span className="ml-1">{order.assignedTo.firstName} {order.assignedTo.lastName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{order.requirements}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* {order.referenceImages?.length > 0 && (
                  <ImageCarousel
                    images={order.referenceImages}
                    title="Reference Images"
                    onImageSearch={handleImageSearch}
                    onViewImage={viewImage}
                    onDownloadImage={downloadImage}
                  />
                )} */}

                {order.uploadedImages?.length > 0 && (
                  <ImageCarousel
                    images={order.uploadedImages}
                    title="Uploaded Images"
                    onImageSearch={handleImageSearch}
                    onViewImage={viewImage}
                    onDownloadImage={downloadImage}
                  />
                )}
              </div>
            </div>

            {order.cadFiles?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">CAD Files ({order.cadFiles.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.cadFiles.map((file, index) => (
                    <div key={index} className="flex items-center p-3 bg-white/50 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <FileText className="h-6 w-6 text-blue-600 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                        <button
                          onClick={() => downloadImage(`${BASE_URL}${file.downloadUrl}`, file.filename)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.textFiles?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Text Files ({order.textFiles.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.textFiles.map((file, index) => (
                    <div key={index} className="flex items-center p-3 bg-white/50 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <FileText className="h-6 w-6 text-gray-600 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                        <button
                          onClick={() => downloadImage(`${BASE_URL}${file.downloadUrl}`, file.filename)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Order Images Gallery
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore images and files from orders. Click an order to view details, images, and CAD files.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search Results Section */}
        {searchResults.length > 0 && (
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
                onClick={() => setSearchResults([])}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Results
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((result) => (
                  <div key={result.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="relative">
                      <img
                        src={result.url}
                        alt={result.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
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
                        <button 
                          onClick={() => downloadImage(result.url, result.name)}
                          className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-sm hover:scale-110 transition-all duration-200"
                          title="Download Image"
                        >
                          <Download className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-900 truncate mb-2">{result.name}</p>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${getSimilarityColor(result.similarity)}`}>
                          {result.similarity}% match
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{result.format}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Search Results Message */}
        {searchResults.length === 0 && isSearching === false && searchingImageId === null && searchResults.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden mb-8 border border-white/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Similar images not found in database</h3>
              <p className="mt-1 text-sm text-gray-500">No images with ≥70% similarity were found.</p>
            </div>
          </div>
        )}

        {/* Controls and Gallery */}
        <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100/50 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-900">
                Gallery ({filteredAndSortedImages.length} orders)
              </h2>
              <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Name Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Search images by name..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="orderId">Sort by Order ID</option>
                  <option value="customer">Sort by Customer</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                title={sortOrder === 'desc' ? 'Sort Ascending' : 'Sort Descending'}
              >
                {sortOrder === 'desc' ? <SortDesc className="h-4 w-4 text-gray-600" /> : <SortAsc className="h-4 w-4 text-gray-600" />}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <p className="text-gray-600 font-medium">Loading orders...</p>
              </div>
            ) : filteredAndSortedImages.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {nameSearch ? 'No images match the search criteria.' : 'Try adjusting the filters or search criteria.'}
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayImages.map((item) => (
                      <div 
                        key={item.id} 
                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                        onClick={() => openOrderModal(item)}
                      >
                        <div className="relative">
                          {(item.referenceImages?.length > 0 || item.uploadedImages?.length > 0) ? (
                            <img
                              src={item.referenceImages?.length > 0 ? item.referenceImages[0].imageUrl : item.uploadedImages[0].imageUrl}
                              alt={item.referenceImages?.length > 0 ? item.referenceImages[0].filename : item.uploadedImages[0].filename}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ZoomIn className="h-5 w-5 text-white bg-black/50 rounded-full p-1" />
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{item.orderId}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600">
                            <p className="flex items-center">
                              <User className="h-3 w-3 mr-1 text-indigo-600" />
                              {item.customer.name}
                            </p>
                            <p className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-indigo-600" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                            <p className="flex items-center">
                              <ImageIcon className="h-3 w-3 mr-1 text-indigo-600" />
                              {item.totalImageCount} images
                            </p>
                            {item.cadCount > 0 && (
                              <p className="flex items-center">
                                <FileText className="h-3 w-3 mr-1 text-indigo-600" />
                                {item.cadCount} CAD files
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAD Files</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayImages.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.orderId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.customer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalImageCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.cadCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => openOrderModal(item)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredAndSortedImages.length)}</span> of{' '}
                          <span className="font-medium">{filteredAndSortedImages.length}</span> orders
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          {[...Array(totalPages).keys()].map((page) => (
                            <button
                              key={page + 1}
                              onClick={() => setCurrentPage(page + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === page + 1 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Order Detail Modal */}
        <OrderModal
          order={selectedOrder}
          isOpen={showOrderModal}
          onClose={closeOrderModal}
        />
      </div>
    </div>
  );
};

export default Gallery