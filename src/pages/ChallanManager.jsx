import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Loader, Edit, X } from 'lucide-react';
import ChallanModal from './ChallanModal';
import { toast } from 'react-toastify';

const ChallanManager = ({ order }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Fetch challans when modal opens
  useEffect(() => {
    if (isModalOpen && order?._id) {
      fetchChallans(order._id);
    }
  }, [isModalOpen, order]);

  const fetchChallans = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/challan/order/${orderId}`, {
        method: "GET",
        headers: { 
          Authorization: `${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch challans");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setChallans(data.data);
      } else {
        throw new Error(data.message || "Error fetching challans");
      }
    } catch (error) {
      console.error("Error fetching challans:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallan = async (orderId, challanData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/challan/create`, {
        method: "POST",
        headers: { 
          Authorization: `${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ orderId, ...challanData })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create challan");
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Challan created successfully");
        // Refresh the list of challans
        fetchChallans(orderId);
        return data.data;
      } else {
        throw new Error(data.message || "Error creating challan");
      }
    } catch (error) {
      console.error("Error creating challan:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleUpdateChallan = async (challanId, challanData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/challan/update/${challanId}`, {
        method: "PUT",
        headers: { 
          Authorization: `${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(challanData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update challan");
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Challan updated successfully");
        // Refresh the list of challans
        fetchChallans(order._id);
        return data.data;
      } else {
        throw new Error(data.message || "Error updating challan");
      }
    } catch (error) {
      console.error("Error updating challan:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleDownloadChallan = async (challanId) => {
    try {
      const token = localStorage.getItem("token");
      window.open(
        `${BASE_URL}/api/v1/challan/download/${challanId}?token=${encodeURIComponent(token)}`,
        '_blank'
      );
      toast.success("Challan download started");
    } catch (error) {
      console.error("Error downloading challan:", error);
      toast.error("Failed to download challan");
    }
  };

  const handlePreviewChallan = async (challanId) => {
  try {
    const token = localStorage.getItem("token");
    window.open(
      `${BASE_URL}/api/v1/challan/preview/${challanId}?token=${encodeURIComponent(token)}`,
      '_blank'
    );
    toast.success("Challan preview opened");
  } catch (error) {
    console.error("Error previewing challan:", error);
    toast.error("Failed to preview challan");
  }
};

  const handleOpenEditModal = async (challanId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/challan/${challanId}`, {
        method: "GET",
        headers: { 
          Authorization: `${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch challan details");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedChallan(data.data);
        setEditMode(true);
      } else {
        throw new Error(data.message || "Error fetching challan details");
      }
    } catch (error) {
      console.error("Error fetching challan details:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditMode(false);
    setSelectedChallan(null);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
      >
        <FileText className="h-4 w-4 mr-1.5" />
        Manage Challan
      </button>
      
      {isModalOpen && (
        <ChallanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={order}
          onCreateChallan={handleCreateChallan}
          onDownloadChallan={handleDownloadChallan}
         onPreviewChallan={handlePreviewChallan}
          onEditChallan={handleOpenEditModal}
          existingChallans={challans}
        />
      )}

      {editMode && selectedChallan && (
        <EditChallanModal
          isOpen={editMode}
          onClose={handleCloseEditModal}
          challan={selectedChallan}
          onUpdateChallan={handleUpdateChallan}
        />
      )}
    </>
  );
};

// Component for editing challan details
const EditChallanModal = ({ isOpen, onClose, challan, onUpdateChallan }) => {
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

  useEffect(() => {
    if (isOpen && challan) {
      setChallanData({
        transporterName: challan.transporterName || '',
        transporterContact: challan.transporterContact || '',
        transporterAddress: challan.transporterAddress || '',
        materialQuantity: challan.materialQuantity || '',
        squareFeet: challan.squareFeet || '',
        weightInKg: challan.weightInKg || '',
        bundles: challan.bundles || '',
      });
    }
  }, [isOpen, challan]);

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
      await onUpdateChallan(challan._id, challanData);
      setSuccess('Challan updated successfully');
      
      // Close modal after successful update
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (err) {
      setError(err.message || 'Failed to update challan');
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
            Edit Challan: #{challan.challanNumber}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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
                {loading ? 'Updating...' : 'Update Challan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChallanManager;