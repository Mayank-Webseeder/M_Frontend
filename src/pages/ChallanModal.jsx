import { useState, useEffect } from 'react';
import { X, Plus, Download, FilePlus, Eye, Edit } from 'lucide-react';

const ChallanModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onCreateChallan,
  onDownloadChallan,
  onPreviewChallan,
  onEditChallan,
  existingChallans = []
}) => {
  const [challanData, setChallanData] = useState({
    transporterName: '',
    transporterContact: '',
    transporterAddress: '',
    materialQuantity: '',
    squareFeet: '',
    weightInKg: '',
    bundles: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('create'); // 'create' or 'list'

  useEffect(() => {
    if (isOpen) {
      if (existingChallans.length > 0) {
        setViewMode('list');
      } else {
        setViewMode('create');
      }
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, existingChallans]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallanData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!challanData.transporterName || !challanData.transporterContact) {
      setError('Transporter name and contact are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onCreateChallan(order._id, challanData);
      setSuccess('Challan created successfully');
      
      // Reset form after successful creation
      setTimeout(() => {
        setChallanData({
          transporterName: '',
          transporterContact: '',
          transporterAddress: '',
          materialQuantity: '',
          squareFeet: '',
          weightInKg: '',
          bundles: '',
        });
        setViewMode('list');
      }, 1000);
      
    } catch (err) {
      setError(err.message || 'Failed to create challan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {viewMode === 'create' ? 'Create Challan' : 'Manage Challans'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Tab navigation */}
        {existingChallans.length > 0 && (
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 font-medium text-sm ${viewMode === 'create' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('create')}
            >
              <FilePlus className="h-4 w-4 inline mr-2" />
              Create New Challan
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${viewMode === 'list' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('list')}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Existing Challans
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {viewMode === 'create' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transporter Name
                  </label>
                  <input
                    type="text"
                    name="transporterName"
                    value={challanData.transporterName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="transporterContact"
                    value={challanData.transporterContact}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="transporterAddress"
                    value={challanData.transporterAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Quantity
                  </label>
                  <input
                    type="text"
                    name="materialQuantity"
                    value={challanData.materialQuantity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Square Feet (SQFT)
                  </label>
                  <input
                    type="number"
                    name="squareFeet"
                    value={challanData.squareFeet}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (KG)
                  </label>
                  <input
                    type="number"
                    name="weightInKg"
                    value={challanData.weightInKg}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bundles
                  </label>
                  <input
                    type="number"
                    name="bundles"
                    value={challanData.bundles}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                >
                  {loading ? 'Creating...' : 'Create Challan'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <h3 className="font-medium text-gray-700 mb-4">Existing Challans</h3>
              
              {existingChallans.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No challans found for this order</p>
                  <button
                    onClick={() => setViewMode('create')}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Challan
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transporter</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {existingChallans.map((challan) => (
                        <tr key={challan._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{challan.challanNumber}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(challan.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{challan.transporterName}</td>
                          <td className="px-4 py-3 text-sm flex justify-center space-x-2">
                            <button
                              onClick={() => onPreviewChallan(challan._id)} 
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 inline-flex items-center"
                              title="Preview Challan"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </button>
                            <button
                              onClick={() => onDownloadChallan(challan._id)}
                              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 inline-flex items-center"
                              title="Download Challan"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </button>
                            <button
                              onClick={() => onEditChallan(challan._id)}
                              className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 inline-flex items-center"
                              title="Edit Challan"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {existingChallans.length > 0 && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setViewMode('create')}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create New Challan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallanModal;