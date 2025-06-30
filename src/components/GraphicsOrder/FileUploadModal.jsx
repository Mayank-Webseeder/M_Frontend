import { useRef, useState } from "react";
import { Upload, X, File, FileText, Image } from "lucide-react";
import toast from "react-hot-toast";

const IMAGE_SEARCH_API = import.meta.env.VITE_FAST_API;

const FileUploadModal = ({ orderId, onClose, onSuccess, baseUrl }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState({
    cadFiles: [],
    images: [],
    textFiles: [],
  });

  const cadFileInputRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const textFileInputRef = useRef(null);

  const handleFileUploadClick = (fileType) => {
    if (fileType === "cad") cadFileInputRef.current?.click();
    else if (fileType === "image") imageFileInputRef.current?.click();
    else if (fileType === "text") textFileInputRef.current?.click();
  };

  const handleFileChange = (e, fileType) => {
    const files = Array.from(e.target.files);
    setUploadFiles((prev) => ({
      ...prev,
      [fileType]: files,
    }));
  };

  const handleRemoveFile = (fileType, index) => {
    setUploadFiles((prev) => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index),
    }));
  };

  const getCutoutFileName = (fileName) => {
    if (fileName.length <= 20) return fileName;
    const extension = fileName.split(".").pop();
    return `${fileName.substr(0, 15)}...${extension}`;
  };

  const createRenamedFile = (originalFile, newFilename) => {
    try {
      return new File([originalFile], newFilename, {
        type: originalFile.type,
        lastModified: originalFile.lastModified,
      });
    } catch (error) {
      const blob = new Blob([originalFile], { type: originalFile.type });
      Object.defineProperty(blob, "name", {
        value: newFilename,
        writable: false,
      });
      Object.defineProperty(blob, "lastModified", {
        value: originalFile.lastModified || Date.now(),
        writable: false,
      });
      return blob;
    }
  };

  const uploadToFastAPI = async (imageFile, cadFile) => {
    try {
      // Fetch current image count to generate sequential filenames
      const listResponse = await fetch(
        `${IMAGE_SEARCH_API}/list?page=1&per_page=1`
      );
      if (!listResponse.ok) {
        throw new Error("Failed to fetch image count for naming");
      }

      const listData = await listResponse.json();
      const totalImages = listData.total || 0;
      const newImageNumber = totalImages + 1;

      // Generate filenames
      const imageExtension = imageFile.name.split(".").pop().toLowerCase();
      const cadExtension = cadFile.name.split(".").pop().toLowerCase();
      const newImageFilename = `IMG${String(newImageNumber).padStart(
        5,
        "0"
      )}.${imageExtension}`;
      const newCadFilename = `CAD${String(newImageNumber).padStart(
        5,
        "0"
      )}.${cadExtension}`;

      // Create renamed files
      const renamedImageFile = createRenamedFile(imageFile, newImageFilename);
      const renamedCadFile = createRenamedFile(cadFile, newCadFilename);

      // Prepare FormData
      const formData = new FormData();
      formData.append("image", renamedImageFile, newImageFilename);
      formData.append("cad_file", renamedCadFile, newCadFilename);

      // Make request to /v2/add
      const response = await fetch(`${IMAGE_SEARCH_API}/v2/add`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Upload to /v2/add failed");
      }

      toast.success(
        `✨ Files uploaded to image-search API as ${newImageFilename} and ${newCadFilename}`
      );
    } catch (err) {
      console.error("FastAPI upload error:", err);
      toast.error(`Upload to secondary API failed: ${err.message}`);
    }
  };

  const handleFileUpload = async () => {
    if (uploadFiles.cadFiles.length === 0) {
      toast.error("Please select at least one CAD file");
      return;
    }

    if (uploadFiles.images.length === 0) {
      toast.error("Please select at least one image file");
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("orderId", orderId);

      uploadFiles.cadFiles.forEach((file) => formData.append("cadFiles", file));
      uploadFiles.images.forEach((file) => formData.append("images", file));
      uploadFiles.textFiles.forEach((file) =>
        formData.append("textFiles", file)
      );

      // Upload to main API
      const response = await fetch(`${baseUrl}/api/v1/admin/fileupload`, {
        method: "POST",
        headers: { Authorization: `${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to upload files");

      toast.success("Files uploaded successfully");
      onSuccess();

      // Upload first image and CAD file to /v2/add
      // if (uploadFiles.images.length > 0 && uploadFiles.cadFiles.length > 0) {
      //   await uploadToFastAPI(uploadFiles.images[0], uploadFiles.cadFiles[0]);
      // }
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
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CAD Section */}
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
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">{getCutoutFileName(file.name)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile("cadFiles", index)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center border border-dashed p-4 rounded-md text-sm text-gray-500">
                No CAD files selected
              </div>
            )}
          </div>
          <button
            onClick={() => handleFileUploadClick("cad")}
            className="mt-2 text-sm text-indigo-600 flex items-center"
          >
            <Upload className="h-4 w-4 mr-1" /> Select CAD Files
          </button>
        </div>

        {/* Image Section */}
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
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                >
                  <div className="flex items-center">
                    <Image className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">{getCutoutFileName(file.name)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile("images", index)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center border border-dashed p-4 rounded-md text-sm text-gray-500">
                No image files selected
              </div>
            )}
          </div>
          <button
            onClick={() => handleFileUploadClick("image")}
            className="mt-2 text-sm text-indigo-600 flex items-center"
          >
            <Upload className="h-4 w-4 mr-1" /> Select Image Files
          </button>
        </div>

        {/* Text Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Text Files (Optional)
            </div>
          </label>
          <div className="space-y-2">
            {uploadFiles.textFiles.length > 0 ? (
              uploadFiles.textFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">{getCutoutFileName(file.name)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile("textFiles", index)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center border border-dashed p-4 rounded-md text-sm text-gray-500">
                No text files selected
              </div>
            )}
          </div>
          <button
            onClick={() => handleFileUploadClick("text")}
            className="mt-2 text-sm text-indigo-600 flex items-center"
          >
            <Upload className="h-4 w-4 mr-1" /> Select Text Files
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleFileUpload}
            disabled={isUploading}
            className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        <input
          ref={cadFileInputRef}
          type="file"
          accept=".dwg,.dxf,.step,.stp,.stl"
          multiple
          hidden
          onChange={(e) => handleFileChange(e, "cadFiles")}
        />
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFileChange(e, "images")}
        />
        <input
          ref={textFileInputRef}
          type="file"
          accept=".txt,.doc,.docx"
          multiple
          hidden
          onChange={(e) => handleFileChange(e, "textFiles")}
        />
      </div>
    </div>
  );
};

export default FileUploadModal;