import { useState, useEffect } from "react";
import { X, Download, Image as ImageIcon, Trash2, AlertTriangle, File, FileText, Loader, Search, Eye } from "lucide-react";

const IMAGE_SEARCH_API = import.meta.env.VITE_FAST_API;

const UploadedFilesModal = ({ order, onClose, baseUrl, filesFetchError }) => {
  const [activeTab, setActiveTab] = useState('images');
  const [fileData, setFileData] = useState({ photo: [], CadFile: [], textFiles: [] });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', index: -1 });
  const [searchResults, setSearchResults] = useState([]);
  const [searchingImageIndex, setSearchingImageIndex] = useState(null);

  useEffect(() => {
    if (order && order._id) {
      if (filesFetchError) {
        setLoading(false);
        return;
      }
      fetchFilesData(order._id);
    }
  }, [order, filesFetchError]);

  const fetchFilesData = async (orderId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/v1/admin/cutout/getCadFilesAndPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        setFileData({ photo: [], CadFile: [], textFiles: [] });
      } else {
        const result = await res.json();
        const items = result.data || [];
        setFileData({
          photo: items.flatMap(i => i.photo || []),
          CadFile: items.flatMap(i => i.CadFile || []),
          textFiles: items.flatMap(i => i.textFiles || []),
        });
      }
    } catch {
      setFileData({ photo: [], CadFile: [], textFiles: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value) => `${(value * 100).toFixed(0)}%`;

  const handleDeleteFile = (type, index) => {
    setConfirmDelete({ show: true, type, index });
  };

  const confirmDeleteFile = async () => {
    const { type, index } = confirmDelete;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/v1/admin/grpahics/deleteCadFile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({ orderId: order._id, type, index }),
      });
      const result = await res.json();
      if (result.success) fetchFilesData(order._id);
    } finally {
      setDeleting(false);
      setConfirmDelete({ show: false, type: '', index: -1 });
    }
  };

  const cancelDelete = () => setConfirmDelete({ show: false, type: '', index: -1 });

  const getFileName = (path) => path?.split('/').pop() || "Unknown";

  const handleDownloadFile = async (fileUrl, fileName) => {
    if (!fileUrl || fileUrl.includes('/None')) {
      alert('No valid file available for download');
      return;
    }

    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || fileUrl.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert('Download failed!');
    }
  };

  const handleImageSearch = async (imagePath, idx) => {
    setSearchResults([]);
    setSearchingImageIndex(idx);
    try {
      const response = await fetch(`${baseUrl}${imagePath}`);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, getFileName(imagePath));

      const search = await fetch(`${IMAGE_SEARCH_API}/search`, {
        method: "POST",
        body: formData,
      });

      if (!search.ok) throw new Error(`Search failed: ${search.status} ${search.statusText}`);
      
      const { similar_images } = await search.json();
      const transformedResults = (similar_images || [])
        .filter((result) => result.similarity >= 0.7 && result.img_url && result.name)
        .map((result, index) => ({
          id: index + 1,
          url: result.img_url,
          cad_url: result.cad_url && result.cad_url !== "http://185.199.52.128:10000/None" ? result.cad_url : null,
          name: result.name,
          similarity: result.similarity,
          format: result.name.split('.').pop().toUpperCase(),
        }));
      
      

      setSearchResults(transformedResults);
      setActiveTab('searchResults');
    } catch (e) {
      console.error("Search error:", e);
      alert(`Search failed: ${e.message}`);
    } finally {
      setSearchingImageIndex(null);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Uploaded Files – {order.orderId}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800"><X className="h-5 w-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          {['images', 'cad', 'text', 'searchResults'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-center text-sm font-medium ${
                activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {{
                images: `Images (${fileData.photo.length})`,
                cad: `CAD Files (${fileData.CadFile.length})`,
                text: `Text Files (${fileData.textFiles.length})`,
                searchResults: `Search Results (${searchResults.length})`
              }[tab]}
            </button>
          ))}
        </div>

        {/* Confirmation Modal */}
        {confirmDelete.show && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 z-10">
              <div className="flex items-center mb-4 text-amber-500"><AlertTriangle className="h-6 w-6 mr-2" /><h4 className="font-medium">Confirm Deletion</h4></div>
              <p>Are you sure? This action cannot be undone.</p>
              <div className="mt-4 flex justify-end space-x-2">
                <button onClick={cancelDelete} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={deleting}>Cancel</button>
                <button onClick={confirmDeleteFile} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center" disabled={deleting}>
                  {deleting ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex h-40 justify-center items-center"><Loader className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <>
              {/* Images Tab */}
              {activeTab === 'images' && (
                fileData.photo.length ?
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fileData.photo.map((img, idx) => (
                    <div key={idx} className="relative group border rounded-lg overflow-hidden">
                      <img src={`${baseUrl}${img}`} alt={`upl-${idx}`} className="w-full h-32 object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <a href={`${baseUrl}${img}`} download className="p-1 bg-white rounded-full shadow hover:bg-gray-100">
                          <Download className="h-5 w-5 text-indigo-600" />
                        </a>
                        <button onClick={() => handleDeleteFile('photo', idx)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                        <button onClick={() => handleImageSearch(img, idx)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100" disabled={searchingImageIndex === idx}>
                          <Search className="h-5 w-5 text-indigo-600" />
                        </button>
                      </div>
                      {searchingImageIndex === idx && (
                        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                          <Loader className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                :
                <div className="flex h-32 items-center justify-center text-gray-500">
                  <ImageIcon className="h-6 w-6 mr-2" /> No images found
                </div>
              )}

              {/* CAD Tab */}
              {activeTab === 'cad' && (
                fileData.CadFile.length ?
                <div className="space-y-3">
                  {fileData.CadFile.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-2"><File className="h-5 w-5 text-gray-600" /><span className="text-sm">{getFileName(f)}</span></div>
                      <div className="flex space-x-3">
                        <a href={`${baseUrl}${f}`} download className="text-indigo-600 hover:text-indigo-800 flex items-center"><Download className="h-5 w-5 mr-1" />Download</a>
                        <button onClick={() => handleDeleteFile('CadFile', i)} className="text-red-600 hover:text-red-800 flex items-center">
                          <Trash2 className="h-5 w-5 mr-1" />Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                :
                <div className="flex h-32 items-center justify-center text-gray-500"><File className="h-6 w-6 mr-2" />No CAD files</div>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && (
                fileData.textFiles.length ?
                <div className="space-y-3">
                  {fileData.textFiles.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-2"><FileText className="h-5 w-5 text-gray-600" /><span className="text-sm">{getFileName(f)}</span></div>
                      <div className="flex space-x-3">
                        <a href={`${baseUrl}${f}`} download className="text-indigo-600 hover:text-indigo-800 flex items-center"><Download className="h-5 w-5 mr-1" />Download</a>
                        <button onClick={() => handleDeleteFile('textFiles', i)} className="text-red-600 hover:text-red-800 flex items-center">
                          <Trash2 className="h-5 w-5 mr-1" />Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                :
                <div className="flex h-32 items-center justify-center text-gray-500"><FileText className="h-6 w-6 mr-2" />No text files</div>
              )}

              {/* Search Results Tab */}
              {activeTab === 'searchResults' && (
                searchResults.length ?
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map((r) => (
                    <div key={r.id} className="border rounded p-2 shadow">
                      <img src={r.url} alt={r.name} className="w-full h-24 object-cover mb-2" onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }} />
                      <div className="text-xs font-semibold truncate">{r.name}</div>
                      <div className="text-xs text-gray-600">Similarity: {formatPercentage(r.similarity)}</div>
                      <div className="flex gap-2 mt-2">
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline flex items-center">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </a>
                        <button
                          onClick={() => handleDownloadFile(r.url, r.name)}
                          className="text-blue-600 text-xs hover:underline flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" /> Image
                        </button>
                        <button
                          onClick={() => handleDownloadFile(r.cad_url, r.name.replace(/\.[^/.]+$/, '.dwg'))}
                          disabled={!r.cad_url}
                          className="text-indigo-600 text-xs hover:underline flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <Download className="h-4 w-4 mr-1" /> CAD 
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                :
                <div className="flex h-32 items-center justify-center text-gray-500">
                  <ImageIcon className="h-6 w-6 mr-2" /> No search results
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadedFilesModal;