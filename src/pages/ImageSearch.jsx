// import React, { useState, useRef, useEffect } from 'react';
// import {
//   Upload, X, Search, Image as ImageIcon,
//   Download, Eye, Filter, ChevronDown,
//   Grid, List, SortAsc, SortDesc, AlertCircle,
//   Plus, Database, Sparkles, Camera,
//   ChevronLeft, ChevronRight, FolderOpen
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const ImageSearch = () => {
//   const [uploadedImage, setUploadedImage] = useState(null);
//   const [uploadedImageUrl, setUploadedImageUrl] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [allImages, setAllImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [addingToDatabase, setAddingToDatabase] = useState(false);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [viewMode, setViewMode] = useState('grid');
//   const [sortBy, setSortBy] = useState('similarity');
//   const [sortOrder, setSortOrder] = useState('desc');
//   const [minSimilarity, setMinSimilarity] = useState(70);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalImg, setTotalImg] = useState(0);
//   const itemsPerPage = 20;
//   const fileInputRef = useRef(null);
//   const addImageInputRef = useRef(null);
//   const [nameFilter, setNameFilter] = useState('');

//   // API base URL from environment variable
//   const API_BASE_URL = import.meta.env.VITE_FAST_API;

//   // Load all images on component mount or page change
//   useEffect(() => {
//     loadAllImages();
//   }, [currentPage]);

//   // Auto-clear messages after 5 seconds
//   useEffect(() => {
//     if (successMessage) {
//       const timer = setTimeout(() => setSuccessMessage(''), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [successMessage]);

//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => setError(''), 8000);
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   const loadAllImages = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${API_BASE_URL}/list?page=${currentPage}&per_page=${itemsPerPage}`);
//       if (!response.ok) throw new Error('Failed to load images');

//       const { data, total, pages } = await response.json();
//       const transformedImages = data.map((item, index) => ({
//         id: index + 1,
//         url: item.url,
//         cad_url: item.cad_url && item.cad_url !== "http://185.199.52.128:10000/None" ? item.cad_url : null,
//         name: item.name,
//         similarity: 0,
//         size: 'Unknown',
//         format: item.name.split('.').pop().toUpperCase(),
//       }));
//       setAllImages(transformedImages);
//       setTotalImg(total || 0);
//       setTotalPages(pages || 1);
//     } catch (err) {
//       console.error('Error loading images:', err);
//       setError('Failed to load image gallery');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       if (!file.type.startsWith('image/')) {
//         setError('Please select a valid image file');
//         return;
//       }

//       if (file.size > 10 * 1024 * 1024) {
//         setError('File size must be less than 10MB');
//         return;
//       }

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setUploadedImageUrl(e.target.result);
//         setUploadedImage(file);
//         setError('');
//         setSearchResults([]);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleAddImageToDatabase = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       setError('Please select a valid image file');
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       setError('File size must be less than 10MB');
//       return;
//     }

//     setAddingToDatabase(true);
//     setError('');

//     try {
//       const response = await fetch(`${API_BASE_URL}/list?page=1&per_page=1`);
//       if (!response.ok) throw new Error('Failed to fetch image count');
//       const { total } = await response.json();
//       const totalImages = total || 0;

//       const fileExtension = file.name.split('.').pop().toLowerCase();
//       const newImageNumber = totalImages + 1;
//       const newFilename = `IMG${String(newImageNumber).padStart(5, '0')}.${fileExtension}`;

//       const renamedFile = new File([file], newFilename, { type: file.type });

//       const formData = new FormData();
//       formData.append('file', renamedFile);

//       const addResponse = await fetch(`${API_BASE_URL}/add`, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!addResponse.ok) {
//         throw new Error(`Failed to add image: ${addResponse.status} ${addResponse.statusText}`);
//       }

//       const result = await addResponse.json();
//       setSuccessMessage(`✨ ${result.message || `Image added successfully as ${newFilename}!`}`);

//       setCurrentPage(1);
//       await loadAllImages();

//       if (addImageInputRef.current) {
//         addImageInputRef.current.value = '';
//       }
//     } catch (err) {
//       console.error('Add image error:', err);
//       setError(`Failed to add image: ${err.message}`);
//     } finally {
//       setAddingToDatabase(false);
//     }
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     const files = e.dataTransfer.files;
//     if (files.length > 0) {
//       const file = files[0];
//       if (file.type.startsWith('image/')) {
//         if (file.size > 10 * 1024 * 1024) {
//           setError('File size must be less than 10MB');
//           return;
//         }

//         const reader = new FileReader();
//         reader.onload = (e) => {
//           setUploadedImageUrl(e.target.result);
//           setUploadedImage(file);
//           setError('');
//           setSearchResults([]);
//         };
//         reader.readAsDataURL(file);
//       } else {
//         setError('Please drop a valid image file');
//       }
//     }
//   };

//   const handleSearch = async (file = uploadedImage) => {
//     if (!file) {
//       setError('No image available for search');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       const response = await fetch(`${API_BASE_URL}/search`, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error(`Search failed: ${response.status} ${response.statusText}`);
//       }

//       const { similar_images } = await response.json();

//       const transformedResults = (similar_images || [])
//         .filter((result) => result.similarity >= 0.7 && result.img_url && result.name)
//         .map((result, index) => ({
//           id: index + 1,
//           url: result.img_url,
//           cad_url: result.cad_url && result.cad_url !== "http://185.199.52.128:10000/None" ? result.cad_url : null,
//           name: result.name,
//           similarity: Math.round(result.similarity * 100),
//           size: 'Unknown',
//           format: result.name.split('.').pop().toUpperCase(),
//         }));

//       setSearchResults(transformedResults);
//       setUploadedImage(file);
//       setUploadedImageUrl(URL.createObjectURL(file));
//     } catch (err) {
//       console.error('Search error:', err);
//       setError(`Search failed: ${err.message}`);
//       toast.error(`Search failed: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleGalleryImageSearch = async (imageUrl) => {
//   //   setLoading(true);
//   //   setError('');

//   //   try {
//   //     const response = await fetch(imageUrl, { mode: 'cors' });
//   //     if (!response.ok) throw new Error('Failed to fetch image');

//   //     const blob = await response.blob();
//   //     const file = new File([blob], 'temp-image.jpg', { type: blob.type });

//   //     await handleSearch(file);
//   //   } catch (err) {
//   //     console.error('Gallery image search error:', err);
//   //     setError('Failed to search with this image');
//   //     toast.error('Failed to search with this image');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const handleDownloadFile = async (fileUrl, fileName) => {
//     if (!fileUrl || fileUrl.includes('/None')) {
//       toast.error('No valid file available for download');
//       return;
//     }

//     try {
//       const response = await fetch(fileUrl, { mode: 'cors' });
//       if (!response.ok) throw new Error('Failed to fetch file');
//       const blob = await response.blob();
//       const blobUrl = URL.createObjectURL(blob);

//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.download = fileName || fileUrl.split('/').pop();
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       URL.revokeObjectURL(blobUrl);
//       toast.success(`Downloading ${fileName || fileUrl.split('/').pop()}`);
//     } catch (error) {
//       console.error('Download failed:', error);
//       toast.error('Download failed!');
//     }
//   };

//   const clearUploadedImage = () => {
//     setUploadedImage(null);
//     setUploadedImageUrl('');
//     setSearchResults([]);
//     setError('');
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const filteredAndSortedResults = searchResults
//     .filter((result) =>
//       result.similarity >= minSimilarity &&
//       result.name.toLowerCase().includes(nameFilter.toLowerCase())
//     )
//     .sort((a, b) => {
//       if (sortBy === 'similarity') {
//         return sortOrder === 'desc' ? b.similarity - a.similarity : a.similarity - b.similarity;
//       } else {
//         return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
//       }
//     });

//   const getSimilarityColor = (similarity) => {
//     if (similarity >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
//     if (similarity >= 70) return 'text-amber-700 bg-amber-100 border-amber-200';
//     return 'text-red-700 bg-red-100 border-red-200';
//   };

//   const viewImage = (imageUrl) => {
//     window.open(imageUrl, '_blank');
//   };

//   const displayResults = searchResults.length > 0
//     ? filteredAndSortedResults
//     : allImages
//         .filter((img) => img.name.toLowerCase().includes(nameFilter.toLowerCase()))
//         .map((img) => ({
//           id: img.id,
//           url: img.url,
//           cad_url: img.cad_url,
//           name: img.name,
//           similarity: img.similarity,
//           size: img.size,
//           format: img.format,
//         }));

//   const filteredResults = searchResults.length > 0 ? filteredAndSortedResults : allImages.filter((img) => img.name.toLowerCase().includes(nameFilter.toLowerCase()));
//   const startIndex = (currentPage - 1) * itemsPerPage + 1;
//   const endIndex = Math.min(currentPage * itemsPerPage, filteredResults.length);

//   return (
//     <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen p-4 sm:p-6 md:p-8">
//       <div className="container mx-auto max-w-7xl">
//         {/* Success Message */}
//         {successMessage && (
//           <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
//             <Sparkles className="h-5 w-5 text-emerald-600 mr-3" />
//             <span className="text-emerald-800 font-medium">{successMessage}</span>
//             <button
//               onClick={() => setSuccessMessage('')}
//               className="ml-auto text-emerald-600 hover:text-emerald-800 transition-colors"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//         )}

//         {/* Error Message */}
//         {error && (
//           <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
//             <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
//             <span className="text-red-800">{error}</span>
//             <button
//               onClick={() => setError('')}
//               className="ml-auto text-red-600 hover:text-red-800 transition-colors"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//         )}

//         {/* Action Cards */}
//         <div className="w-full gap-6 mb-8">
//           {/* Upload for Search Card */}
//           <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300">
//             <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
//               <h2 className="text-xl font-bold flex items-center">
//                 <Search className="mr-3 h-6 w-6" />
//                 Search Similar Images
//               </h2>
//             </div>

//             <div className="p-6">
//               {!uploadedImageUrl ? (
//                 <div
//                   className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 cursor-pointer group "
//                   onDragOver={handleDragOver}
//                   onDrop={handleDrop}
//                   onClick={() => fileInputRef.current?.click()}
//                 >
//                   <div className="group-hover:scale-110 transition-transform duration-300">
//                     <Camera className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
//                   </div>
//                   <p className="text-lg font-semibold text-gray-900 mb-2">
//                     Drop your image here, or click to browse
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     Supports JPG, PNG, WebP files up to 10MB
//                   </p>
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageUpload}
//                     className="hidden"
//                   />
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="relative group">
//                     <img
//                       src={uploadedImageUrl}
//                       alt="Uploaded"
//                       className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-sm"
//                     />
//                     <button
//                       onClick={clearUploadedImage}
//                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
//                     >
//                       <X className="h-4 w-4" />
//                     </button>
//                   </div>

//                   <div className="bg-gray-50 rounded-lg p-4">
//                     <h3 className="font-semibold text-gray-900 mb-3">Image Details</h3>
//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
//                       <div>
//                         <span className="font-medium text-gray-700">Name:</span>
//                         <p className="text-gray-600 truncate">{uploadedImage?.name}</p>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Size:</span>
//                         <p className="text-gray-600">{(uploadedImage?.size / 1024 / 1024).toFixed(2)} MB</p>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Type:</span>
//                         <p className="text-gray-600">{uploadedImage?.type}</p>
//                       </div>
//                     </div>
//                   </div>

//                   <button
//                     onClick={() => handleSearch()}
//                     disabled={loading}
//                     className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
//                   >
//                     <Search className="mr-2 h-5 w-5" />
//                     {loading ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
//                         Searching...
//                       </>
//                     ) : (
//                       'Search Similar Images'
//                     )}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Add to Database Card */}
//           {/* <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300">
//             <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
//               <h2 className="text-xl font-bold flex items-center">
//                 <Database className="mr-3 h-6 w-6" />
//                 Add to Database
//               </h2>
//               <p className="text-emerald-100 mt-1">Upload images to expand the search database</p>
//             </div>

//             <div className="p-6">
//               <div className="text-center">
//                 <div className="mb-6">
//                   <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-6 border border-emerald-200">
//                     <Upload className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
//                     <p className="text-emerald-800 font-medium mb-2">
//                       Expand the image database
//                     </p>
//                     <p className="text-emerald-600 text-sm">
//                       Images will be renamed to IMG00001, IMG00002, etc.
//                     </p>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => addImageInputRef.current?.click()}
//                   disabled={addingToDatabase}
//                   className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
//                 >
//                   <Plus className="mr-2 h-5 w-5" />
//                   {addingToDatabase ? (
//                     <>
//                       <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
//                       Adding...
//                     </>
//                   ) : (
//                     'Choose Image to Add'
//                   )}
//                 </button>
//                 <input
//                   ref={addImageInputRef}
//                   type="file"
//                   accept="image/*"
//                   onChange={handleAddImageToDatabase}
//                   className="hidden"
//                 />
//               </div>
//             </div>
//           </div> */}
//         </div>

//         {/* Results Section */}
//         <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20">
//           <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100/50 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
//             <div className="flex items-center space-x-4">
//               <h2 className="text-xl font-bold text-gray-900">
//                 {searchResults.length > 0 ? `Search Results (${filteredAndSortedResults.length})` : `Gallery (${filteredResults.length})`}
//               </h2>
//               <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
//                 <button
//                   onClick={() => setViewMode('grid')}
//                   className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
//                 >
//                   <Grid className="h-4 w-4" />
//                 </button>
//                 <button
//                   onClick={() => setViewMode('list')}
//                   className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
//                 >
//                   <List className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>

//             <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
//               <Search className="h-4 w-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search by image name..."
//                 value={nameFilter}
//                 onChange={(e) => setNameFilter(e.target.value)}
//                 className="outline-none text-sm font-medium bg-transparent placeholder-gray-400 min-w-[200px]"
//               />
//               {nameFilter && (
//                 <button
//                   onClick={() => setNameFilter('')}
//                   className="text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   <X className="h-4 w-4" />
//                 </button>
//               )}
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               {searchResults.length > 0 && (
//                 <div className="flex items-center space-x-3 bg-white rounded-lg px-3 py-2 shadow-sm border">
//                   <label className="text-sm font-medium text-gray-700">Min Similarity:</label>
//                   <input
//                     type="range"
//                     min="0"
//                     max="100"
//                     value={minSimilarity}
//                     onChange={(e) => setMinSimilarity(Number(e.target.value))}
//                     className="w-20 accent-indigo-600"
//                   />
//                   <span className="text-sm font-medium text-indigo-600 min-w-[2rem]">{minSimilarity}%</span>
//                 </div>
//               )}

//               <div className="flex items-center gap-2">
//                 <div className="relative">
//                   <select
//                     value={sortBy}
//                     onChange={(e) => setSortBy(e.target.value)}
//                     className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
//                   >
//                     <option value="similarity">Sort by Similarity</option>
//                     <option value="name">Sort by Name</option>
//                   </select>
//                   <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
//                 </div>

//                 <button
//                   onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
//                   className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
//                 >
//                   {sortOrder === 'desc' ? <SortDesc className="h-4 w-4 text-gray-600" /> : <SortAsc className="h-4 w-4 text-gray-600" />}
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="p-6">
//             {loading ? (
//               <div className="flex flex-col items-center justify-center h-64">
//                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
//                 <p className="text-gray-600 font-medium">Loading images...</p>
//               </div>
//             ) : filteredResults.length === 0 ? (
//               <div className="text-center py-12">
//                 <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
//                 <p className="mt-1 text-sm text-gray-500">Try adjusting the filters or upload an image to search.</p>
//               </div>
//             ) : (
//               <>
//                 {viewMode === 'grid' ? (
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                     {displayResults.map((result) => (
//                       <div key={result.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
//                         <div className="relative overflow-hidden">
//                           <img
//                             src={result.url}
//                             alt={result.name}
//                             className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
//                             onError={(e) => {
//                               e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
//                             }}
//                           />
//                           <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                             <button
//                               onClick={() => viewImage(result.url)}
//                               className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
//                               title="View Image"
//                             >
//                               <Eye className="h-4 w-4 text-gray-700" />
//                             </button>
//                             {/* <button
//                               onClick={() => handleGalleryImageSearch(result.url)}
//                               className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
//                               title="Search Similar Images"
//                             >
//                               <Search className="h-4 w-4 text-gray-700" />
//                             </button> */}
//                           </div>
//                         </div>
//                         <div className="p-4">
//                           <h3 className="font-semibold text-gray-900 truncate mb-3">{result.name}</h3>
//                           <div className="flex items-center justify-between mb-2">
//                             {searchResults.length > 0 && result.similarity > 0 ? (
//                               <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSimilarityColor(result.similarity)}`}>
//                                 {result.similarity}% match
//                               </span>
//                             ) : (
//                               <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
//                                 Gallery
//                               </span>
//                             )}
//                             <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{result.format}</span>
//                           </div>
//                           <div className="flex gap-2">
//                             <button
//                               onClick={() => handleDownloadFile(result.url, result.name)}
//                               className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors"
//                             >
//                               <Download className="h-3 w-3 mr-1.5" />
//                               Download Image
//                             </button>
//                             <button
//                               onClick={() => handleDownloadFile(result.cad_url, result.name.replace(/\.[^/.]+$/, '.dwg'))}
//                               disabled={!result.cad_url}
//                               className="flex-1 flex items-center justify-center px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
//                             >
//                               <Download className="h-3 w-3 mr-1.5" />
//                               Download CAD
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity</th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {displayResults.map((result) => (
//                           <tr key={result.id} className="hover:bg-gray-50">
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <img
//                                 src={result.url}
//                                 alt={result.name}
//                                 className="w-16 h-16 object-cover rounded-lg border border-gray-200"
//                                 onError={(e) => {
//                                   e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OL0E8L3RleHQ+PC9zdmc+';
//                                 }}
//                               />
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{result.name}</td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.format}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               {searchResults.length > 0 && result.similarity > 0 ? (
//                                 <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getSimilarityColor(result.similarity)}`}>
//                                   {result.similarity}%
//                                 </span>
//                               ) : (
//                                 <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200">
//                                   N/A
//                                 </span>
//                               )}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm">
//                               <div className="flex space-x-2 flex-wrap gap-2">
//                                 <button
//                                   onClick={() => viewImage(result.url)}
//                                   className="text-indigo-600 hover:text-indigo-900 flex items-center"
//                                   title="View Image"
//                                 >
//                                   <Eye className="h-4 w-4 mr-1" />
//                                   View
//                                 </button>
//                                 {/* <button
//                                   onClick={() => handleGalleryImageSearch(result.url)}
//                                   className="text-indigo-600 hover:text-indigo-900 flex items-center"
//                                   title="Search Similar Images"
//                                 >
//                                   <Search className="h-4 w-4 mr-1" />
//                                   Search
//                                 </button> */}

//                                 <button
//                                   onClick={() => handleDownloadFile(result.url, result.name)}
//                                   className="text-blue-600 hover:text-blue-900 flex items-center"
//                                   title="Download Image"
//                                 >
//                                   <Download className="h-4 w-4 mr-1" />
//                                   Image
//                                 </button>
//                                 <button
//                                   onClick={() => handleDownloadFile(result.cad_url, result.name.replace(/\.[^/.]+$/, '.dwg'))}
//                                   disabled={!result.cad_url}
//                                   className="text-indigo-600 hover:text-indigo-900 flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
//                                   title="Download CAD"
//                                 >
//                                   <Download className="h-4 w-4 mr-1" />
//                                   CAD
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                       </table>
//                     </div>
//                   )}

//                   {totalPages > 1 && (
//                     <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
//                       <div className="flex-1 flex items-center justify-between">
//                         <div>
//                           <p className="text-sm text-gray-700">
//                             Showing <span className="font-medium">{startIndex}</span> to
//                             <span className="font-medium">{endIndex}</span> of
//                             <span className="font-medium">{totalImg}</span> images
//                           </p>
//                         </div>
//                         <div>
//                           <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//                             <button
//                               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                               disabled={currentPage === 1}
//                               className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                               <ChevronLeft className="h-5 w-5" />
//                             </button>
//                             {[...Array(totalPages).keys()].map((page) => (
//                               <button
//                                 key={page + 1}
//                                 onClick={() => setCurrentPage(page + 1)}
//                                 className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page + 1 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
//                               >
//                                 {page + 1}
//                               </button>
//                             ))}
//                             <button
//                               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                               disabled={currentPage === totalPages}
//                               className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                               <ChevronRight className="h-5 w-5" />
//                             </button>
//                           </nav>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
// };

// export default ImageSearch;



import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, X, Search, Image as ImageIcon,
  Download, Eye, Filter, ChevronDown,
  Grid, List, SortAsc, SortDesc, AlertCircle,
  Plus, Database, Sparkles, Camera,
  ChevronLeft, ChevronRight, FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const ImageSearch = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingToDatabase, setAddingToDatabase] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('similarity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minSimilarity, setMinSimilarity] = useState(70);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImg, setTotalImg] = useState(0);
  const itemsPerPage = 20;
  const fileInputRef = useRef(null);
  const addImageInputRef = useRef(null);
  const [nameFilter, setNameFilter] = useState('');


  const API_BASE_URL = import.meta.env.VITE_FAST_API;
  const BASE_URL = import.meta.env.VITE_BASE_URL

  const token = localStorage.getItem("token");// Adjust based on your auth implementation

  console.log("token", token);
  // Load all images on component mount or page change
  useEffect(() => {
    loadAllImages();
  }, [currentPage]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadAllImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/list?page=${currentPage}&per_page=${itemsPerPage}`);
      if (!response.ok) throw new Error('Failed to load images');

      const { data, total, pages } = await response.json();
      const transformedImages = data.map((item, index) => ({
        id: index + 1,
        url: item.url,
        cad_url: item.cad_url && item.cad_url !== "http://185.199.52.128:10000/None" ? item.cad_url : null,
        name: item.name,
        similarity: 0,
        size: 'Unknown',
        format: item.name.split('.').pop().toUpperCase(),
      }));
      setAllImages(transformedImages);
      setTotalImg(total || 0);
      setTotalPages(pages || 1);
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load image gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImageUrl(e.target.result);
        setUploadedImage(file);
        setError('');
        setSearchResults([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageToDatabase = async (event) => {
    const files = Array.from(event.target.files); // Get all selected files
    if (!files.length) return;

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not a valid image file`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
    }

    setAddingToDatabase(true);
    setError('');

    try {
      const formData = new FormData();

      // Append all selected images
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${BASE_URL}/api/v1/admin/add-to-db`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to add images: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setSuccessMessage(`✨ ${result.message || `Successfully added ${files.length} image(s) to database!`}`);

      setCurrentPage(1);
      await loadAllImages();

      if (addImageInputRef.current) {
        addImageInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Add images error:', err);
      setError(`Failed to add images: ${err.message}`);
      toast.error(`Failed to add images: ${err.message}`);
    } finally {
      setAddingToDatabase(false);
    }
  };


  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImageUrl(e.target.result);
          setUploadedImage(file);
          setError('');
          setSearchResults([]);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please drop a valid image file');
      }
    }
  };

  const handleSearch = async (file = uploadedImage) => {
    if (!file) {
      setError('No image available for search');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const { similar_images } = await response.json();

      const transformedResults = (similar_images || [])
        .filter((result) => result.similarity >= 0.7 && result.img_url && result.name)
        .map((result, index) => ({
          id: index + 1,
          url: result.img_url,
          cad_url: result.cad_url && result.cad_url !== "http://185.199.52.128:10000/None" ? result.cad_url : null,
          name: result.name,
          similarity: Math.round(result.similarity * 100),
          size: 'Unknown',
          format: result.name.split('.').pop().toUpperCase(),
        }));

      setSearchResults(transformedResults);
      setUploadedImage(file);
      setUploadedImageUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error('Search error:', err);
      setError(`Search failed: ${err.message}`);
      toast.error(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    if (!fileUrl || fileUrl.includes('/None')) {
      toast.error('No valid file available for download');
      return;
    }

    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || fileUrl.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloading ${fileName || fileUrl.split('/').pop()}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed!');
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageUrl('');
    setSearchResults([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredAndSortedResults = searchResults
    .filter((result) =>
      result.similarity >= minSimilarity &&
      result.name.toLowerCase().includes(nameFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'similarity') {
        return sortOrder === 'desc' ? b.similarity - a.similarity : a.similarity - b.similarity;
      } else {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
    });

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (similarity >= 70) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const viewImage = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const displayResults = searchResults.length > 0
    ? filteredAndSortedResults
    : allImages
      .filter((img) => img.name.toLowerCase().includes(nameFilter.toLowerCase()))
      .map((img) => ({
        id: img.id,
        url: img.url,
        cad_url: img.cad_url,
        name: img.name,
        similarity: img.similarity,
        size: img.size,
        format: img.format,
      }));

  const filteredResults = searchResults.length > 0 ? filteredAndSortedResults : allImages.filter((img) => img.name.toLowerCase().includes(nameFilter.toLowerCase()));
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredResults.length);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="h-5 w-5 text-emerald-600 mr-3" />
            <span className="text-emerald-800 font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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

        {/* Action Cards */}
        <div className="w-full gap-6 mb-8 flex flex-col md:flex-row">
          {/* Upload for Search Card */}
          <div className="w-full md:w-1/2 bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <h2 className="text-xl font-bold flex items-center">
                <Search className="mr-3 h-6 w-6" />
                Search Similar Images
              </h2>
            </div>

            <div className="p-6">
              {!uploadedImageUrl ? (
                <div
                  className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 cursor-pointer group "
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <Camera className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Drop your image here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, WebP files up to 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded"
                      className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-sm"
                    />
                    <button
                      onClick={clearUploadedImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Image Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <p className="text-gray-600 truncate">{uploadedImage?.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <p className="text-gray-600">{(uploadedImage?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <p className="text-gray-600">{uploadedImage?.type}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    disabled={loading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      'Search Similar Images'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <h2 className="text-xl font-bold flex items-center">
                <Database className="mr-3 h-6 w-6" />
                Add to Database
              </h2>
              <p className="text-emerald-100 mt-1">Upload multiple images to expand the search database</p>
            </div>

            <div className="p-6">
              <div className="text-center">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-6 border border-emerald-200">
                    <Upload className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                    <p className="text-emerald-800 font-medium mb-2">
                      Expand the image database
                    </p>
                    <p className="text-emerald-600 text-sm">
                      Select multiple images to upload at once
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => addImageInputRef.current?.click()}
                  disabled={addingToDatabase}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {addingToDatabase ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Choose Images to Add'
                  )}
                </button>
                <input
                  ref={addImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple // Added multiple attribute
                  onChange={handleAddImageToDatabase}
                  className="hidden"
                />

                {/* Optional: Show selected files count */}
                <p className="text-xs text-gray-500 mt-2">
                  Hold Ctrl/Cmd to select multiple images
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100/50 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-900">
                {searchResults.length > 0 ? `Search Results (${filteredAndSortedResults.length})` : `Gallery (${filteredResults.length})`}
              </h2>
              <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by image name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="outline-none text-sm font-medium bg-transparent placeholder-gray-400 min-w-[200px]"
              />
              {nameFilter && (
                <button
                  onClick={() => setNameFilter('')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {searchResults.length > 0 && (
                <div className="flex items-center space-x-3 bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <label className="text-sm font-medium text-gray-700">Min Similarity:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minSimilarity}
                    onChange={(e) => setMinSimilarity(Number(e.target.value))}
                    className="w-20 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-indigo-600 min-w-[2rem]">{minSimilarity}%</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
                  >
                    <option value="similarity">Sort by Similarity</option>
                    <option value="name">Sort by Name</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {sortOrder === 'desc' ? <SortDesc className="h-4 w-4 text-gray-600" /> : <SortAsc className="h-4 w-4 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <p className="text-gray-600 font-medium">Loading images...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting the filters or upload an image to search.</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayResults.map((result) => (
                      <div key={result.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="relative overflow-hidden">
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
                              className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
                              title="View Image"
                            >
                              <Eye className="h-4 w-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 truncate mb-3">{result.name}</h3>
                          <div className="flex items-center justify-between mb-2">
                            {searchResults.length > 0 && result.similarity > 0 ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSimilarityColor(result.similarity)}`}>
                                {result.similarity}% match
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                Gallery
                              </span>
                            )}
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{result.format}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadFile(result.url, result.name)}
                              className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Download className="h-3 w-3 mr-1.5" />
                              Image
                            </button>
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
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayResults.map((result) => (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <img
                                src={result.url}
                                alt={result.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OL0E8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{result.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.format}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {searchResults.length > 0 && result.similarity > 0 ? (
                                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getSimilarityColor(result.similarity)}`}>
                                  {result.similarity}%
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2 flex-wrap gap-2">
                                <button
                                  onClick={() => viewImage(result.url)}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                  title="View Image"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(result.url, result.name)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                  title="Download Image"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Image
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(result.cad_url, result.name.replace(/\.[^/.]+$/, '.dwg'))}
                                  disabled={!result.cad_url}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
                                  title="Download CAD"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  CAD
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex}</span> to
                          <span className="font-medium">{endIndex}</span> of
                          <span className="font-medium">{totalImg}</span> images
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
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page + 1 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
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
      </div>
    </div>
  );
};

export default ImageSearch;

