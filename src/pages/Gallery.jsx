import React, { useState } from 'react';
import { Upload, Search, Download, Eye, Trash2 } from 'lucide-react';

const Gallery = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const gallery = [
    {
      id: 1,
      title: 'Banner Design',
      description: 'Corporate event banner',
      image: 'https://images.unsplash.com/photo-1626785774625-8a0b485dc208?w=400&auto=format&fit=crop&q=60',
      orderId: 'ORD001',
      uploadedBy: 'Sarah Designer',
      uploadedAt: '2024-03-15'
    },
    {
      id: 2,
      title: 'Logo Design',
      description: 'Modern minimalist logo',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=60',
      orderId: 'ORD002',
      uploadedBy: 'Mike Artist',
      uploadedAt: '2024-03-14'
    },
    {
      id: 3,
      title: 'Product Banner',
      description: 'E-commerce product showcase',
      image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&auto=format&fit=crop&q=60',
      orderId: 'ORD003',
      uploadedBy: 'Lisa Graphics',
      uploadedAt: '2024-03-13'
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gallery</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Design
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search designs..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Types</option>
              <option value="banner">Banners</option>
              <option value="logo">Logos</option>
              <option value="product">Product Designs</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {gallery.map((item) => (
            <div key={item.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-w-16 aspect-h-9 group relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                  <button className="p-2 bg-white rounded-full text-gray-800 hover:text-blue-600">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="p-2 bg-white rounded-full text-gray-800 hover:text-green-600">
                    <Download className="h-5 w-5" />
                  </button>
                  <button className="p-2 bg-white rounded-full text-gray-800 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Order: {item.orderId}</p>
                  <p>Uploaded by: {item.uploadedBy}</p>
                  <p>Date: {item.uploadedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  
  );
};

export default Gallery;