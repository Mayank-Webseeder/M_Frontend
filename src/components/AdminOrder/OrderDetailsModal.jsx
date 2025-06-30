import React, { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import OrderDetailsTab from "./OrderDetailsTab";
import OrderFilesTab from "./OrderFilesTab";
import OrderAssignTab from "./OrderAssignTab";
import AccountAssign from "./AccountAssign";
import Logs from "./Logs";
import ChallanViewer from "./ChallanViewer";
import InvoiceViewer from "./InvoiceViewer";

const OrderDetailsModal = ({ order, onClose }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [activeTab, setActiveTab] = useState("details");

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "bg-gray-100 text-gray-800";
      case "InProgress":
        return "bg-blue-100 text-blue-800";
      case "PendingApproval":
        return "bg-orange-100 text-orange-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Billed":
        return "bg-indigo-100 text-indigo-800";
      case "Paid":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return <OrderDetailsTab order={order} BASE_URL={BASE_URL} />;
      case "files":
        return <OrderFilesTab order={order} BASE_URL={BASE_URL} />;
      case "cutout":
        return <OrderAssignTab order={order} BASE_URL={BASE_URL} />;
      case "accounts":
        return <AccountAssign order={order} BASE_URL={BASE_URL} />;
      case "logs":
        return <Logs order={order} BASE_URL={BASE_URL} />;
      case "challan":
        return <ChallanViewer order={order} BASE_URL={BASE_URL} />;
      case "invoice":
        return <InvoiceViewer order={order} BASE_URL={BASE_URL} />;
      default:
        return null;
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center border-b z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Order #{order.orderId}</h2>
            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: "details", label: "Order Details" },
            { id: "files", label: "Files" },
            { id: "cutout", label: "Cutout" },
            { id: "accounts", label: "Accounts" },
            { id: "logs", label: "Logs" },
            { id: "challan", label: "Challan" },
            { id: "invoice", label: "Invoice" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
