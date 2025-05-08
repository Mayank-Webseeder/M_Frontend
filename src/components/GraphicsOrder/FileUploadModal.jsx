import { useRef, useState } from "react";
import { Upload, X, File, RefreshCw, FileText, Image } from "lucide-react";
// import { toast } from 'react-toastify';
import toast from "react-hot-toast";


const FileUploadModal = ({ orderId, onClose, onSuccess, baseUrl }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState({
    cadFiles: [],
    images: [],
    textFiles: []
  });
  
  const cadFileInputRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const textFileInputRef = useRef(null);
  
  const handleFileUploadClick = (fileType) => {
    if (fileType === 'cad') {
      cadFileInputRef.current?.click();
    } else if (fileType === 'image') {
      imageFileInputRef.current?.click();
    } else if (fileType === 'text') {
      textFileInputRef.current?.click();
    }
  };

  const handleFileChange = (e, fileType) => {
    const files = Array.from(e.target.files);
    
    setUploadFiles(prev => ({
      ...prev,
      [fileType]: files
    }));
  };

  const handleRemoveFile = (fileType, index) => {
    setUploadFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  };

  // Function to cutout file name with extension
  const getCutoutFileName = (fileName) => {
    if (fileName.length <= 20) return fileName;
    const extension = fileName.split('.').pop();
    return `${fileName.substr(0, 15)}...${extension}`;
  };

  const handleFileUpload = async () => {
    // Validate files first
    if (uploadFiles.cadFiles.length === 0) {
      toast.error("Please select at least one CAD file");
      return;
    }
    
    if (uploadFiles.images.length === 0) {
      toast.error("Please select at least one image file");
      return;
    }
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("orderId", orderId);
      
      // Append each CAD file
      uploadFiles.cadFiles.forEach(file => {
        formData.append("cadFiles", file);
      });
      
      // Append each image file
      uploadFiles.images.forEach(file => {
        formData.append("images", file);
      });
      
      // Append each text file (if any)
      uploadFiles.textFiles.forEach(file => {
        formData.append("textFiles", file);
      });
      
      const response = await fetch(`${baseUrl}/api/v1/admin/fileupload`, {
        method: "POST",
        headers: { 
          "Authorization": `${token}` 
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to upload files");
      }
      
      toast.success("Files uploaded successfully");
      
      // Call the onSuccess callback to refresh orders and close modal
      onSuccess();
      
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Files</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <File className="h-4 w-4 mr-1" />
                CAD Files <span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            <div className="space-y-2">
              {uploadFiles.cadFiles.length > 0 ? (
                uploadFiles.cadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <File className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{ getCutoutFileName(file.name)}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile('cadFiles', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500 text-sm">No CAD files selected</p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleFileUploadClick('cad')}
              className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Upload className="h-4 w-4 mr-1" /> Select CAD Files
            </button>
            <p className="text-xs text-gray-500 mt-1">Supported formats: .dwg, .dxf, .step, .stp, .stl</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <Image className="h-4 w-4 mr-1" />
                Image Files <span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            <div className="space-y-2">
              {uploadFiles.images.length > 0 ? (
                uploadFiles.images.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <Image className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{ getCutoutFileName(file.name)}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile('images', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500 text-sm">No image files selected</p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleFileUploadClick('image')}
              className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Upload className="h-4 w-4 mr-1" /> Select Images
            </button>
            <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF, etc.</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Text Files <span className="text-gray-400 ml-1">(Optional)</span>
              </div>
            </label>
            <div className="space-y-2">
              {uploadFiles.textFiles.length > 0 ? (
                uploadFiles.textFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{ getCutoutFileName(file.name)}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile('textFiles', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500 text-sm">No text files selected</p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleFileUploadClick('text')}
              className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Upload className="h-4 w-4 mr-1" /> Select Text Files
            </button>
            <p className="text-xs text-gray-500 mt-1">Supported formats: .txt, .pdf, .doc, .docx, .md, .rtf, .odt, .lxd</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleFileUpload}
            disabled={isUploading || uploadFiles.cadFiles.length === 0 || uploadFiles.images.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cadFileInputRef}
        onChange={(e) => handleFileChange(e, 'cadFiles')}
        multiple
        className="hidden"
        accept=".dwg,.dxf,.step,.stp,.stl"
      />
      
      <input
        type="file"
        ref={imageFileInputRef}
        onChange={(e) => handleFileChange(e, 'images')}
        multiple
        className="hidden"
        accept="image/*"
      />
      
      <input
        type="file"
        ref={textFileInputRef}
        onChange={(e) => handleFileChange(e, 'textFiles')}
        multiple
        className="hidden"
        accept=".txt,.pdf,.doc,.docx,.md,.rtf,.odt,.lxd"
      />
    </div>
  );
};

export default FileUploadModal;