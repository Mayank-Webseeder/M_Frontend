import { useState, useEffect } from "react";
import { X, Download, File, Image, Trash2, AlertTriangle, FileText } from "lucide-react";

const UploadedFilesModal = ({ order, onClose, baseUrl, filesFetchError }) => {
  const [activeTab, setActiveTab] = useState('images');
  const [fileData, setFileData] = useState({ photo: [], CadFile: [], textFiles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', index: -1 });

  useEffect(() => {
    if (order && order._id) {
      // Skip fetch if we already know there are no files
      if (filesFetchError) {
        setLoading(false);
        return;
      }
      fetchFilesData(order._id);
    }
  }, [order, filesFetchError]);

  const fetchFilesData = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${baseUrl}/api/v1/admin/cutout/getCadFilesAndPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${token}`
        },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        // Don't throw an error, just handle as empty data
        setFileData({ photo: [], CadFile: [], textFiles: [] });
        return;
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const combinedPhotos = result.data.flatMap(item => item.photo || []);
        const combinedCadFiles = result.data.flatMap(item => item.CadFile || []);
        const combinedTextFiles = result.data.flatMap(item => item.textFiles || []);
        setFileData({
          photo: combinedPhotos,
          CadFile: combinedCadFiles,
          textFiles: combinedTextFiles || []
        });
      } else {
        // Don't throw an error, just handle as empty data
        setFileData({ photo: [], CadFile: [], textFiles: [] });
      }

    } catch (err) {
      console.error("Error fetching files:", err);
      // Don't set error state, just handle as empty data
      setFileData({ photo: [], CadFile: [], textFiles: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = (type, index) => {
    setConfirmDelete({ show: true, type, index });
  };

  const confirmDeleteFile = async () => {
    const { type, index } = confirmDelete;
    try {
      setDeleting(true);
      setDeleteError(null);
      const token = localStorage.getItem("token");

      const response = await fetch(`${baseUrl}/api/v1/admin/grpahics/deleteCadFile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${token}`
        },
        body: JSON.stringify({
          orderId: order._id,
          type,
          index
        })
      });

      const result = await response.json();

      if (result.success) {
        fetchFilesData(order._id);
      } else {
        throw new Error(result.message || "Failed to delete file");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
      setConfirmDelete({ show: false, type: '', index: -1 });
    }
  };

  const cancelDelete = () => {
    setConfirmDelete({ show: false, type: '', index: -1 });
  };

  const refreshAfterUpload = () => {
    if (order && order._id) {
      fetchFilesData(order._id);
    }
  };

  const getFileName = (path) => {
    if (!path) return "Unknown file";
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Uploaded Files - {order.orderId}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'images'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('images')}
          >
            Images ({fileData.photo.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'cad'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('cad')}
          >
            CAD Files ({fileData.CadFile.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'text'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('text')}
          >
            Text Files ({fileData.textFiles ? fileData.textFiles.length : 0})
          </button>
        </div>

        {confirmDelete.show && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="bg-white p-6 rounded-lg shadow-xl w-80">
              <div className="flex items-center mb-4 text-amber-500">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-medium">Confirm Deletion</h3>
              </div>
              <p className="mb-4">Are you sure you want to delete this file? This action cannot be undone.</p>
              {deleteError && (
                <p className="text-red-500 text-sm mb-4">{deleteError}</p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteFile}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filesFetchError ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <File className="h-12 w-12 mb-3 text-gray-400" />
            <p className="text-lg font-medium">No files available</p>
            <p className="text-sm text-gray-400 mt-1">Upload files using the Upload button</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {activeTab === 'images' ? (
              fileData.photo.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fileData.photo.map((img, index) => (
                    <div key={index} className="rounded-lg overflow-hidden border border-gray-200 flex flex-col">
                      <div className="h-32 overflow-hidden bg-gray-100">
                        <img
                          src={`${baseUrl}${img}`}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 flex justify-between items-center bg-gray-50">
                        <span className="text-xs truncate">{getFileName(img)}</span>
                        <div className="flex space-x-2">
                          <a
                            href={`${baseUrl}${img}`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile('photo', index)}
                            disabled={fileData.photo.length <= 1}
                            className={`text-red-500 hover:text-red-700 ${fileData.photo.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={fileData.photo.length <= 1 ? "Cannot delete the last image" : "Delete image"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <Image className="h-5 w-5 mr-2" />
                  No images available
                </div>
              )
            ) : activeTab === 'cad' ? (
              fileData.CadFile.length > 0 ? (
                <div className="space-y-2">
                  {fileData.CadFile.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <File className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">{getFileName(file)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`${baseUrl}${file}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                        <button
                          onClick={() => handleDeleteFile('CadFile', index)}
                          disabled={fileData.CadFile.length <= 1}
                          className={`flex items-center text-sm text-red-500 hover:text-red-700 ${fileData.CadFile.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={fileData.CadFile.length <= 1 ? "Cannot delete the last CAD file" : "Delete CAD file"}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <File className="h-5 w-5 mr-2" />
                  No CAD files available
                </div>
              )
            ) : (
              // Text Files Tab
              fileData.textFiles && fileData.textFiles.length > 0 ? (
                <div className="space-y-2">
                  {fileData.textFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">{getFileName(file)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`${baseUrl}${file}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                        <button
                          onClick={() => handleDeleteFile('textFiles', index)}
                          className="flex items-center text-sm text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <FileText className="h-5 w-5 mr-2" />
                  No text files available
                </div>
              )
            )}
          </div>
        )}
        
 
        
      </div>
    </div>
  );
};

export default UploadedFilesModal;