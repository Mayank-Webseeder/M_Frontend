// import { useState, useEffect } from 'react';
// import { FileText, Download, AlertCircle } from 'lucide-react';
// import InvoiceModal from './InvoiceModal';
// import { toast } from 'react-toastify';

// const InvoiceManager = ({ order }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   const BASE_URL = import.meta.env.VITE_BASE_URL;

//   useEffect(() => {
//     if (order && order._id && order.status === 'accounts_paid') {
//       fetchInvoices(order._id);
//     }
//   }, [order]);

//   const fetchInvoices = async (orderId) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${BASE_URL}/api/v1/invoices/order/${orderId}`, {
//         method: "GET",
//         headers: { Authorization: `${token}` },
//       });
      
//       if (!response.ok) {
//         throw new Error("Failed to fetch invoices");
//       }
      
//       const data = await response.json();
      
//       if (data.success) {
//         setInvoices(data.data || []);
//       } else {
//         throw new Error(data.message || "Error fetching invoices");
//       }
//     } catch (error) {
//       console.error("Error fetching invoices:", error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createInvoice = async (orderId, items) => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${BASE_URL}/api/v1/invoices/create`, {
//         method: "POST",
//         headers: { 
//           Authorization: `${token}`,
//           "Content-Type": "application/json" 
//         },
//         body: JSON.stringify({ orderId, items })
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to create invoice");
//       }
      
//       const data = await response.json();
      
//       if (data.success) {
//         toast.success("Invoice created successfully");
//         // Refresh the invoices list
//         fetchInvoices(orderId);
//         return data.data;
//       } else {
//         throw new Error(data.message || "Error creating invoice");
//       }
//     } catch (error) {
//       console.error("Error creating invoice:", error);
//       toast.error(error.message);
//       throw error;
//     }
//   };

//   const downloadInvoice = async (invoiceId) => {
//     try {
//       const token = localStorage.getItem("token");
      
//       // Use window.open for PDF download
//       window.open(
//         `${BASE_URL}/api/v1/invoices/download/${invoiceId}?token=${encodeURIComponent(token)}`,
//         '_blank'
//       );
      
//       toast.success("Invoice download started");
//     } catch (error) {
//       console.error("Error downloading invoice:", error);
//       toast.error("Failed to download invoice");
//       throw error;
//     }
//   };

//   // Only show for accounts_paid orders
//   if (!order || order.status !== 'accounts_paid') {
//     return null;
//   }

//   return (
//     <>
//       <div className="mt-4">
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="inline-flex items-center w-[170px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
//         >
//           <FileText className="h-4 w-4 mr-2" />
//           {invoices.length > 0 ? 'Manage Invoices' : 'Create Invoice'}
//         </button>

//       </div>
      
//       <InvoiceModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         order={order}
//         onCreateInvoice={createInvoice}
//         onDownloadInvoice={downloadInvoice}
//         existingInvoices={invoices}
//       />
//     </>
//   );
// };

// export default InvoiceManager;

import { useState, useEffect } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import InvoiceModal from './InvoiceModal';
// import { toast } from 'react-toastify';
import toast from "react-hot-toast";

const InvoiceManager = ({ order }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (order && order._id && (order.status === 'accounts_paid' || order.status === 'order_completed')) {
      fetchInvoices(order._id);
    }
  }, [order]);

  const fetchInvoices = async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/invoices/order/${orderId}`, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.data || []);
      } else {
        throw new Error(data.message || "Error fetching invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (orderId, items) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/invoices/create`, {
        method: "POST",
        headers: { 
          Authorization: `${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ orderId, items })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invoice");
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Invoice created successfully");
        // Refresh the invoices list
        fetchInvoices(orderId);
        return data.data;
      } else {
        throw new Error(data.message || "Error creating invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Use window.open for PDF download
      window.open(
        `${BASE_URL}/api/v1/invoices/download/${invoiceId}?token=${encodeURIComponent(token)}`,
        '_blank'
      );
      
      toast.success("Invoice download started");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
      throw error;
    }
  };

  const previewInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Use window.open for PDF preview (inline display)
      window.open(
        `${BASE_URL}/api/v1/invoices/preview/${invoiceId}?token=${encodeURIComponent(token)}`,
        '_blank'
      );
      
      toast.success("Opening invoice preview");
    } catch (error) {
      console.error("Error previewing invoice:", error);
      toast.error("Failed to preview invoice");
      throw error;
    }
  };

  // Only show for accounts_paid orders
  if (!order || (order.status !== 'accounts_paid' && order.status !== 'order_completed')) {
    return null;
  }

  return (
    <>
      <div className="mt-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center w-[170px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
        >
          <FileText className="h-4 w-4 mr-2" />
          {invoices.length > 0 ? 'Manage Invoices' : 'Create Invoice'}
        </button>
        {error && (
          <div className="mt-2 text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{error}</span>
          </div>
        )}
      </div>
      
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={order}
        onCreateInvoice={createInvoice}
        onDownloadInvoice={downloadInvoice}
        onPreviewInvoice={previewInvoice}
        existingInvoices={invoices}
      />
    </>
  );
};

export default InvoiceManager;