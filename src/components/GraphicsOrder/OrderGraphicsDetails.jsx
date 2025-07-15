import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader, Download } from "lucide-react";
import toast from "react-hot-toast";

const OrderGraphicsDetails = ({ order, onClose, baseUrl }) => {

  const baseUrl2 = import.meta.env.VITE_BASE_URL;
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingImageId, setSearchingImageId] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef(null);
  const IMAGE_SEARCH_API = import.meta.env.VITE_FAST_API;

  const handleImageSearch = async (imageUrl, filename, imageId) => {
    try {
      setIsSearching(true);
      setSearchingImageId(imageId);
      setShowSearchResults(true);

      const response = await fetch(imageUrl);
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

      // Handle the new API response structure with "similar_images" key
      const transformedResults = (results.similar_images || [])
        .filter((result) => result.similarity >= 0.7)
        .map((result, index) => ({
          id: index + 1,
          url: result.img_url,
          cad_url: result.cad_url === "None" ? null : result.cad_url, // Handle "None" CAD URL
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
    // Prevent download if fileUrl is null or "None"
    if (!fileUrl || fileUrl === "None") {
      toast.error(`No file available for download: ${fileName}`);
      return;
    }

    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || fileUrl.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl); // Cleanup

      toast.success(`Downloading ${fileName || fileUrl.split("/").pop()}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(`Download failed: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Order Details - {order.orderId}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Requirements</h3>
            <p className="text-gray-600 mt-2">{order.requirements || "No requirements provided"}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Dimensions</h3>
            <p className="text-gray-600 mt-2">{order.dimensions || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Reference Images</h3>
            {order.image && order.image.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {order.image.map((img, index) => (
                  <div key={index} className="group relative rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                    <img
                      src={`${baseUrl2}${img}`}
                      alt={`Reference Image ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => handleImageSearch(`${baseUrl2}${img}`, `ref_image_${index + 1}.jpg`, `img-${order._id}-${index}`)}
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
            ) : (
              <p className="text-gray-500 mt-2">No reference images available</p>
            )}
          </div>
        </div>

        {showSearchResults && (
          <div ref={searchResultsRef} className="p-6">
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
                              disabled={!result.cad_url} // Disable button if cad_url is null
                              className="flex-1 flex items-center justify-center px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-200 transition-colors disabled:bg-gray-200 disabled:text-gray-500"
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
    </div>
  );
};

export default OrderGraphicsDetails;

