import { X, FileText, Image, Maximize2 } from "lucide-react";

const FilePreviewComponent = ({ 
  files, 
  fileType, 
  onRemove, 
  onPreview, 
  baseUrl 
}) => {
  // Function to show file name with extension
  const  getCutoutFileName = (fileName) => {
    if (fileName.length <= 20) return fileName;
    const extension = fileName.split('.').pop();
    return `${fileName.substr(0, 15)}...${extension}`;
  };

  // Function to determine if file is an image
  const isImageFile = (file) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    return imageTypes.includes(file.type);
  };

  // Function to get file icon based on type
  const getFileIcon = (file) => {
    if (fileType === 'images' || isImageFile(file)) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-2 mt-2">
      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, index) => {
            // Check if it's an actual file object or a URL string
            const isFileObject = file instanceof File;
            
            return (
              <div 
                key={index} 
                className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center overflow-hidden">
                  {getFileIcon(file)}
                  <span className="text-sm ml-2 truncate">
                    {isFileObject ?  getCutoutFileName(file.name) :  getCutoutFileName(file)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {(fileType === 'images' || isImageFile(file)) && (
                    <button
                      onClick={() => onPreview(index)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Preview"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500 text-sm">
            No {fileType === 'cadFiles' ? 'CAD files' : 'image files'} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default FilePreviewComponent;