
import React, { useState, useEffect, useCallback } from "react";
import { User, UserPlus, CheckCircle, Loader } from "lucide-react";
import axios from "axios";
import { useSocketEvents } from "../../../src/hooks/useSocketEvents";
import { useSocket } from "../../socket";
import toast from "react-hot-toast";

const AccountAssign = ({ order: initialOrder, BASE_URL }) => {
  const [order, setOrder] = useState(initialOrder);
  const [accountUsers, setAccountUsers] = useState([]);
  const [selectedAccountUser, setSelectedAccountUser] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const { socket, connected } = useSocket();

  const setStatusHandler = useCallback(({ orderId, status }) => {
    alert("you are in setting status");
    if (order._id === orderId) {
      setOrder((prevOrder) => ({
        ...prevOrder,
        status,
      }));
    }
  }, [order]);

  useSocketEvents({
    "changeStatus": setStatusHandler,
  });


  useEffect(() => {
    fetchAccountUsers();

    if (order.assignedTo && order.assignedTo.accountType === "Accounts") {
      setSelectedAccountUser(order.assignedTo._id);
    }
  }, [order]);

  const fetchAccountUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/v1/auth/getAllUsers`, {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        const filteredUsers = response.data.data.filter(user => user.accountType === "Accounts");
        setAccountUsers(filteredUsers);
      }
    } catch (error) {
      console.error("Error fetching account users:", error);
      toast.error("Failed to fetch account users.");
    }
  };

  const handleAssignOrder = async () => {
    if (!selectedAccountUser) {
      setAssignError("Please select an account user");
      toast.error("Please select an account user before assigning.");
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError(null);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${BASE_URL}/api/v1/admin/accounts/assignOrderToAccount/${order._id}`,
        { accountUserId: selectedAccountUser },
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
        toast.success("Order assigned to account successfully!");
        setTimeout(() => setAssignSuccess(false), 3000);
      } else {
        setAssignError("Failed to assign order to accounting");
        toast.error("Failed to assign order.");
      }
    } catch (error) {
      console.error("Error assigning order to accounting:", error);
      setAssignError(error.response?.data?.message || "Failed to assign order to accounting");
    } finally {
      setAssignLoading(false);
    }
  };

  const canAssignToAccounting = [ "cutout_completed",
    "accounts_billed",
    "accounts_paid"].includes(order.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-green-50 p-2 rounded-lg">
            <UserPlus className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Assign to Accounting</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Assign this order to an accounting user for billing and payment processing.
        </p>
      </div>

      <div className="p-6">
        {!canAssignToAccounting ? (
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-700 mb-4">
            <p className="text-sm">
              Order must be in "Completed", "Billed", or "ReadyForBilling" status to be assigned to accounting.
              Current status: <span className="font-semibold">{order.status}</span>
            </p>
          </div>
        ) : null}

        <div className="mb-6">
          <label htmlFor="accountUser" className="block text-sm font-medium text-gray-700 mb-2">
            Select Accounting User
          </label>
          <select
            id="accountUser"
            value={selectedAccountUser}
            onChange={(e) => setSelectedAccountUser(e.target.value)}
            disabled={!canAssignToAccounting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">-- Select Account User --</option>
            {accountUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {order.assignedTo && order.assignedTo.accountType === "Accounts" && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Currently assigned to accounting user:</span>
            </p>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-200 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {order.assignedTo.firstName} {order.assignedTo.lastName}
                </p>
                <p className="text-xs text-gray-500">{order.assignedTo.email}</p>
              </div>
            </div>
          </div>
        )}

        {assignSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg text-green-700">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <p>Order successfully assigned to accounting!</p>
            </div>
          </div>
        )}

        {assignError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
            <p>{assignError}</p>
          </div>
        )}

        <button
          onClick={handleAssignOrder}
          disabled={assignLoading || !selectedAccountUser || !canAssignToAccounting}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
        >
          {assignLoading ? (
            <>
              <Loader className="animate-spin mr-2 h-4 w-4" />
              Assigning...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              Assign to Accounting
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountAssign;
