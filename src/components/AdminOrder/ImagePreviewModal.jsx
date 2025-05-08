import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const ImagePreviewModal = ({ imageUrl, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl].filter(Boolean);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg z-10"
        >
          <X className="h-6 w-6 text-gray-800" />
        </button>
        
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
          </>
        )}
        
        <img
          src={images[currentIndex]}
          alt="Preview"
          className="max-h-[80vh] max-w-full object-contain mx-auto"
        />
        
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full ${
                  index === currentIndex ? "bg-white" : "bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewModal;