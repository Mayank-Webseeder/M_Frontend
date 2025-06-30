import React, { useState, useEffect } from "react";
import { UserPlus, User, CheckCircle, Loader } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const OrderAssignTab = ({ order, BASE_URL }) => {
  const [cutoutUsers, setCutoutUsers] = useState([]);
  const [selectedCutoutUser, setSelectedCutoutUser] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (order) {
      fetchCutoutUsers();
    }
  }, [order]);

  const fetchCutoutUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/v1/auth/getAllUsers`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        const filteredUsers = response.data.data.filter(user => user.accountType === "Cutout");
        setCutoutUsers(filteredUsers);

        // If the order is already assigned to a Cutout user, preselect them
        if (order.assignedTo && filteredUsers.some(user => user._id === order.assignedTo._id)) {
          setSelectedCutoutUser(order.assignedTo._id);
        }
      }
    } catch (error) {
      console.error("Error fetching Cutout users:", error);
      setAssignError("Failed to load cutout users");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOrder = async () => {
    if (!selectedCutoutUser) {
      setAssignError("Please select a Cutout user");
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError(null);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${BASE_URL}/api/v1/admin/cutout/assignOrder/${order._id}`,
        { cutoutUserId: selectedCutoutUser },
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAssignSuccess(true);
        toast.success("Order assigned successfully!");
        // Reset success message after 3 seconds
        setTimeout(() => {
          setAssignSuccess(false);
          // Optionally refresh the page or update the order data
          window.location.reload();
        }, 2000);
      } else {
        setAssignError("Failed to assign order");
        toast.error("Failed to assign order");
      }
    } catch (error) {
      console.error("Error assigning order:", error);
      const errorMessage = error.response?.data?.message || "Failed to assign order";
      setAssignError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <Loader className="animate-spin h-8 w-8 text-purple-600 mb-3" />
        <span className="text-gray-500 text-sm">Loading cutout users...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-purple-50 p-2 rounded-lg">
            <UserPlus className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Assign to Cutout Account</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Assign this order to a Cutout account user who will handle the processing and cutout of this order.
        </p>
      </div>

      <div className="p-6">
        {/* Current assignment info */}
        {order.assignedTo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 mb-2 font-medium">
              Currently assigned to:
            </p>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800">
                  {order.assignedTo.firstName} {order.assignedTo.lastName}
                </p>
                <p className="text-xs text-blue-600">{order.assignedTo.email}</p>
                <p className="text-xs text-blue-500 mt-1">
                  Account Type: {order.assignedTo.accountType}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cutout user selection */}
        <div className="mb-6">
          <label htmlFor="cutoutUser" className="block text-sm font-medium text-gray-700 mb-2">
            Select Cutout User {cutoutUsers.length > 0 && `(${cutoutUsers.length} available)`}
          </label>
          {cutoutUsers.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                No cutout users available. Please contact administrator to create cutout accounts.
              </p>
            </div>
          ) : (
            <select
              id="cutoutUser"
              value={selectedCutoutUser}
              onChange={(e) => setSelectedCutoutUser(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
            >
              <option value="">-- Select Cutout User --</option>
              {cutoutUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Response messages */}
        {assignSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              <p className="text-green-700 font-medium">Order successfully assigned!</p>
            </div>
            <p className="text-green-600 text-sm mt-1">
              The page will refresh automatically to show the updated assignment.
            </p>
          </div>
        )}

        {assignError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-700 font-medium">Assignment Failed</p>
            <p className="text-red-600 text-sm mt-1">{assignError}</p>
          </div>
        )}

        {/* Order Status Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">Order Status</p>
              <p className="text-xs text-gray-500 mt-1">Current processing stage</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              order.status === "New" ? "bg-gray-100 text-gray-800" :
              order.status === "InProgress" ? "bg-blue-100 text-blue-800" :
              order.status === "PendingApproval" ? "bg-orange-100 text-orange-800" :
              order.status === "Approved" ? "bg-green-100 text-green-800" :
              order.status === "Completed" ? "bg-green-100 text-green-800" :
              order.status === "Billed" ? "bg-indigo-100 text-indigo-800" :
              order.status === "Paid" ? "bg-emerald-100 text-emerald-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Assign button */}
        <button
          onClick={handleAssignOrder}
          disabled={assignLoading || !selectedCutoutUser || cutoutUsers.length === 0 || assignSuccess}
          className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
        >
          {assignLoading ? (
            <>
              <Loader className="animate-spin mr-2 h-4 w-4" />
              Assigning Order...
            </>
          ) : assignSuccess ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Successfully Assigned!
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              {order.assignedTo && selectedCutoutUser === order.assignedTo._id 
                ? "Reassign Order" 
                : "Assign to Cutout"}
            </>
          )}
        </button>

        {/* Help text */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-blue-700 text-xs">
            <strong>Note:</strong> Once assigned, the cutout user will be able to view and process this order. 
            You can reassign the order to a different cutout user at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderAssignTab;