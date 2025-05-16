import React, { useState, useEffect } from "react";
import { Download, Eye, FileText, Info, Loader, X, Plus, Edit } from "lucide-react";
import { toast } from "react-toastify";

const ChallanViewer = ({ order, BASE_URL }) => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [selectedChallan, setSelectedChallan] = useState(null);

  useEffect(() => {
    if (order && order._id) {
      fetchChallans();
    }
  }, [order]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/challan/order/${order._id}`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch challans");
      }

      const responseData = await response.json();
      // Check if the data structure matches what we expect
      if (responseData.success && responseData.data) {
        setChallans(responseData.data);
      } else {
        setChallans(responseData.challans || []);
      }
    } catch (err) {
      console.error("Error fetching challans:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (challanId) => {
    try {
      const token = localStorage.getItem("token");
      window.open(
        `${BASE_URL}/api/v1/challan/preview/${challanId}?token=${encodeURIComponent(token)}`,
        '_blank'
      );
      toast.success("Challan preview opened");
    } catch (err) {
      console.error("Error previewing challan:", err);
      toast.error("Failed to preview challan");
    }
  };

  const handleDownload = async (challanId) => {
    try {
      const token = localStorage.getItem("token");
      window.open(
        `${BASE_URL}/api/v1/challan/download/${challanId}?token=${encodeURIComponent(token)}`,
        '_blank'
      );
      toast.success("Challan download started");
    } catch (err) {
      console.error("Error downloading challan:", err);
      toast.error("Failed to download challan");
    }
  };

  const handleEdit = async (challanId) => {
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
        setModalMode("edit");
        setIsModalOpen(true);
      } else {
        throw new Error(data.message || "Error fetching challan details");
      }
    } catch (err) {
      console.error("Error fetching challan details:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedChallan(null);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-50 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Challans</h3>
          </div>
          {order.status}
          {/* <button 
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-3 py-2 rounded text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Challan
          </button> */}
          {(order.status === "accounts_paid" || order.status === "order_completed") && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-3 py-2 rounded text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Challan
            </button>
          )}

        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 space-y-2">
              <span className="text-lg font-medium">Error loading challans</span>
              <span className="text-sm">{error}</span>
            </div>
          ) : challans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Info className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg">No challans or invoices found for this order</p>
              {/* <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center px-4 py-2 rounded text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Challan
              </button> */}
              {(order.status === "accounts_paid" || order.status === "order_completed") && (
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Challan
                </button>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {challans.map((challan) => (
                    <tr key={challan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{challan.challanNumber || challan._id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(challan.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{challan.transporterName || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-4">
                        <button
                          onClick={() => handlePreview(challan._id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Preview
                        </button>
                        <button
                          onClick={() => handleDownload(challan._id)}
                          className="text-green-600 hover:text-green-800 transition-colors flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" /> Download
                        </button>
                        <button
                          onClick={() => handleEdit(challan._id)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Challan Modal for Create/Edit */}
      {isModalOpen && (
        <ChallanModal
          isOpen={isModalOpen}
          mode={modalMode}
          challan={selectedChallan}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchChallans}
          order={order}
          BASE_URL={BASE_URL}
        />
      )}
    </div>
  );
};

// Challan Modal Component
const ChallanModal = ({ isOpen, mode, challan, onClose, onSave, order, BASE_URL }) => {
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
    if (isOpen) {
      setError(null);
      setSuccess(null);

      if (mode === "edit" && challan) {
        setChallanData({
          transporterName: challan.transporterName || '',
          transporterContact: challan.transporterContact || '',
          transporterAddress: challan.transporterAddress || '',
          materialQuantity: challan.materialQuantity || '',
          squareFeet: challan.squareFeet || '',
          weightInKg: challan.weightInKg || '',
          bundles: challan.bundles || '',
        });
      } else {
        // Reset form for create mode
        setChallanData({
          transporterName: '',
          transporterContact: '',
          transporterAddress: '',
          materialQuantity: '',
          squareFeet: '',
          weightInKg: '',
          bundles: '',
        });
      }
    }
  }, [isOpen, mode, challan]);

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
      const token = localStorage.getItem("token");
      let response;

      if (mode === "create") {
        // Create a new challan
        response = await fetch(`${BASE_URL}/api/v1/challan/create`, {
          method: "POST",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderId: order._id,
            ...challanData
          })
        });
      } else {
        // Update existing challan
        response = await fetch(`${BASE_URL}/api/v1/challan/update/${challan._id}`, {
          method: "PUT",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(challanData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${mode} challan`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(`Challan ${mode === "create" ? "created" : "updated"} successfully`);

        // Close modal after successful action
        setTimeout(() => {
          onSave(); // Refresh the challans list
          onClose();
        }, 1000);
      } else {
        throw new Error(data.message || `Error ${mode === "create" ? "creating" : "updating"} challan`);
      }
    } catch (err) {
      console.error(`Error ${mode} challan:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === "create" ? "Create New Challan" : `Edit Challan: ${challan.challanNumber || challan._id}`}
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
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {mode === "create" ? 'Creating...' : 'Updating...'}
                  </span>
                ) : (
                  mode === "create" ? 'Create Challan' : 'Update Challan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChallanViewer;