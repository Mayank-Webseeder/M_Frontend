// import { useState, useEffect } from 'react';
// import { X, Plus, Trash, Download, FilePlus } from 'lucide-react';

// const InvoiceModal = ({ 
//   isOpen, 
//   onClose, 
//   order, 
//   onCreateInvoice,
//   onDownloadInvoice,
//   existingInvoices = []
// }) => {
//   const [items, setItems] = useState([
//     { description: '', rate: 0, quantity: 0 }
//   ]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [subtotal, setSubtotal] = useState(0);
//   const [cgstAmount, setCgstAmount] = useState(0);
//   const [sgstAmount, setSgstAmount] = useState(0);
//   const [total, setTotal] = useState(0);
//   const [viewMode, setViewMode] = useState('create'); // 'create' or 'list'

//   // CGST and SGST rates
//   const CGST_RATE = 9;
//   const SGST_RATE = 9;

//   useEffect(() => {
//     // Reset form when modal opens
//     if (isOpen) {
//       if (existingInvoices.length > 0) {
//         setViewMode('list');
//       } else {
//         setViewMode('create');
//       }
      
//       setItems([{ description: '', rate: '', quantity: '' }]);
//       setError(null);
//       setSuccess(null);
//     }
//   }, [isOpen, existingInvoices]);

//   useEffect(() => {
//     // Calculate totals whenever items change
//     calculateTotals();
//   }, [items]);

//   const calculateTotals = () => {
//     const newSubtotal = items.reduce((sum, item) => {
//       return sum + (parseFloat(item.rate || 0) * parseFloat(item.quantity || 0));
//     }, 0);
    
//     const newCgstAmount = (newSubtotal * CGST_RATE) / 100;
//     const newSgstAmount = (newSubtotal * SGST_RATE) / 100;
//     const newTotal = newSubtotal + newCgstAmount + newSgstAmount;
    
//     setSubtotal(newSubtotal);
//     setCgstAmount(newCgstAmount);
//     setSgstAmount(newSgstAmount);
//     setTotal(newTotal);
//   };

//   const handleItemChange = (index, field, value) => {
//     const newItems = [...items];
    
//     // Convert to number for rate and quantity fields
//     if (field === 'rate' || field === 'quantity') {
//       value = parseFloat(value) || 0;
//     }
    
//     newItems[index] = {
//       ...newItems[index],
//       [field]: value
//     };
    
//     setItems(newItems);
//   };

//   const addItem = () => {
//     setItems([...items, { description: '', rate: 0, quantity: 0 }]);
//   };

//   const removeItem = (index) => {
//     if (items.length > 1) {
//       const newItems = [...items];
//       newItems.splice(index, 1);
//       setItems(newItems);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validate form
//     let isValid = true;
//     let errorMessage = '';
    
//     items.forEach((item, index) => {
//       if (!item.description) {
//         isValid = false;
//         errorMessage = `Please enter a description for item ${index + 1}`;
//       } else if (item.rate <= 0) {
//         isValid = false;
//         errorMessage = `Please enter a valid rate for ${item.description}`;
//       } else if (item.quantity <= 0) {
//         isValid = false;
//         errorMessage = `Please enter a valid quantity for ${item.description}`;
//       }
//     });
    
//     if (!isValid) {
//       setError(errorMessage);
//       return;
//     }
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       await onCreateInvoice(order._id, items);
//       setSuccess('Invoice created successfully');
      
//       // Reset form after successful creation
//       setTimeout(() => {
//         setItems([{ description: '', rate: 0, quantity: 0 }]);
//         setViewMode('list');
//       }, 1000);
      
//     } catch (err) {
//       setError(err.message || 'Failed to create invoice');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownload = async (invoiceId) => {
//     try {
//       await onDownloadInvoice(invoiceId);
//     } catch (err) {
//       setError(err.message || 'Failed to download invoice');
//     }
//   };

//   if (!isOpen) return null;
  
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
//         <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
//           <h2 className="text-xl font-semibold text-gray-800">
//             {viewMode === 'create' ? 'Create Invoice' : 'Manage Invoices'}
//           </h2>
//           <button 
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 transition-colors"
//           >
//             <X className="h-6 w-6" />
//           </button>
//         </div>
        
//         {/* Tab navigation */}
//         {existingInvoices.length > 0 && (
//           <div className="flex border-b border-gray-200">
//             <button
//               className={`px-6 py-3 font-medium text-sm ${viewMode === 'create' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
//               onClick={() => setViewMode('create')}
//             >
//               <FilePlus className="h-4 w-4 inline mr-2" />
//               Create New Invoice
//             </button>
//             <button
//               className={`px-6 py-3 font-medium text-sm ${viewMode === 'list' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
//               onClick={() => setViewMode('list')}
//             >
//               <Download className="h-4 w-4 inline mr-2" />
//               Existing Invoices
//             </button>
//           </div>
//         )}
        
//         <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
//           {/* Create invoice form */}
//           {viewMode === 'create' && (
//             <form onSubmit={handleSubmit} className="p-6">
//               <div className="mb-6">
//                 <h3 className="font-medium text-gray-700 mb-2">Order Information</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
//                   <div>
//                     <p className="text-sm text-gray-600">Order ID:</p>
//                     <p className="font-medium">{order?.orderId || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Customer:</p>
//                     <p className="font-medium">{order?.customer?.name || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Status:</p>
//                     <p className="font-medium capitalize">{order?.status || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Date:</p>
//                     <p className="font-medium">{new Date().toLocaleDateString()}</p>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="mb-6">
//                 <div className="flex justify-between items-center mb-2">
//                   <h3 className="font-medium text-gray-700">Invoice Items</h3>
//                   <button
//                     type="button"
//                     onClick={addItem}
//                     className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
//                   >
//                     <Plus className="h-4 w-4 mr-1" />
//                     Add Item
//                   </button>
//                 </div>
                
//                 <div className="border border-gray-200 rounded-lg overflow-hidden">
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Rate</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Quantity</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Amount</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {items.map((item, index) => (
//                         <tr key={index}>
//                           <td className="px-4 py-2">
//                             <input
//                               type="text"
//                               value={item.description}
//                               onChange={(e) => handleItemChange(index, 'description', e.target.value)}
//                               placeholder="Enter item description"
//                               className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//                               required
//                             />
//                           </td>
//                           <td className="px-4 py-2">
//                             <input
//                               type="number"
//                               value={item.rate}
//                               onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
//                               placeholder="0.00"
//                               min="0"
//                               step="0.01"
//                               className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//                               required
//                             />
//                           </td>
//                           <td className="px-4 py-2">
//                             <input
//                               type="number"
//                               value={item.quantity}
//                               onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
//                               placeholder="0"
//                               min="0"
//                               step="0.1"
//                               className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//                               required
//                             />
//                           </td>
//                           <td className="px-4 py-2 text-right">
//                             {(item.rate * item.quantity).toFixed(2)}
//                           </td>
//                           <td className="px-4 py-2">
//                             <button
//                               type="button"
//                               onClick={() => removeItem(index)}
//                               disabled={items.length === 1}
//                               className={`p-1 rounded-full ${items.length === 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
//                             >
//                               <Trash className="h-4 w-4" />
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
              
//               {/* Summary */}
//               <div className="mb-6">
//                 <h3 className="font-medium text-gray-700 mb-2">Invoice Summary</h3>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex justify-between py-2">
//                     <span className="text-gray-600">Subtotal:</span>
//                     <span className="font-medium">₹{subtotal.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between py-2">
//                     <span className="text-gray-600">CGST ({CGST_RATE}%):</span>
//                     <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between py-2">
//                     <span className="text-gray-600">SGST ({SGST_RATE}%):</span>
//                     <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
//                     <span>Total:</span>
//                     <span>₹{total.toFixed(2)}</span>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Status messages */}
//               {error && (
//                 <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
//                   {error}
//                 </div>
//               )}
              
//               {success && (
//                 <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
//                   {success}
//                 </div>
//               )}
              
//               {/* Action buttons */}
//               <div className="flex justify-end space-x-3">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className={`px-4 py-2 bg-indigo-600 text-white rounded-md font-medium ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'} transition-colors flex items-center`}
//                 >
//                   {loading ? (
//                     <span className="inline-block animate-spin mr-2">⟳</span>
//                   ) : null}
//                   Create Invoice
//                 </button>
//               </div>
//             </form>
//           )}
          
//           {/* List existing invoices */}
//           {viewMode === 'list' && (
//             <div className="p-6">
//               <h3 className="font-medium text-gray-700 mb-4">Existing Invoices</h3>
              
//               {existingInvoices.length === 0 ? (
//                 <div className="text-center py-8 bg-gray-50 rounded-lg">
//                   <p className="text-gray-500">No invoices found for this order</p>
//                   <button
//                     onClick={() => setViewMode('create')}
//                     className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
//                   >
//                     Create Invoice
//                   </button>
//                 </div>
//               ) : (
//                 <div className="border border-gray-200 rounded-lg overflow-hidden">
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {existingInvoices.map((invoice) => (
//                         <tr key={invoice._id} className="hover:bg-gray-50">
//                           <td className="px-4 py-3 text-sm">{invoice.invoiceNumber}</td>
//                           <td className="px-4 py-3 text-sm">
//                             {new Date(invoice.invoiceDate).toLocaleDateString()}
//                           </td>
//                           <td className="px-4 py-3 text-sm">₹{invoice.total.toFixed(2)}</td>
//                           <td className="px-4 py-3 text-sm">
//                             <button
//                               onClick={() => handleDownload(invoice._id)}
//                               className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors inline-flex items-center"
//                             >
//                               <Download className="h-3 w-3 mr-1" />
//                               Download
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
              
//               {/* Action buttons */}
//               <div className="flex justify-end space-x-3 mt-6">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
//                 >
//                   Close
//                 </button>
//                 {existingInvoices.length > 0 && (
//                   <button
//                     type="button"
//                     onClick={() => setViewMode('create')}
//                     className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
//                   >
//                     Create New Invoice
//                   </button>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InvoiceModal;

import { useState, useEffect } from 'react';
import { X, Plus, Trash, Download, FilePlus, Eye } from 'lucide-react';

const InvoiceModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onCreateInvoice,
  onDownloadInvoice,
  onPreviewInvoice,  // New prop for previewing invoice
  existingInvoices = []
}) => {
  const [items, setItems] = useState([
    { description: '', rate: 0, quantity: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [cgstAmount, setCgstAmount] = useState(0);
  const [sgstAmount, setSgstAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('create'); // 'create' or 'list'

  // CGST and SGST rates
  const CGST_RATE = 9;
  const SGST_RATE = 9;

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      if (existingInvoices.length > 0) {
        setViewMode('list');
      } else {
        setViewMode('create');
      }
      
      setItems([{ description: '', rate: '', quantity: '' }]);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, existingInvoices]);

  useEffect(() => {
    // Calculate totals whenever items change
    calculateTotals();
  }, [items]);

  const calculateTotals = () => {
    const newSubtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.rate || 0) * parseFloat(item.quantity || 0));
    }, 0);
    
    const newCgstAmount = (newSubtotal * CGST_RATE) / 100;
    const newSgstAmount = (newSubtotal * SGST_RATE) / 100;
    const newTotal = newSubtotal + newCgstAmount + newSgstAmount;
    
    setSubtotal(newSubtotal);
    setCgstAmount(newCgstAmount);
    setSgstAmount(newSgstAmount);
    setTotal(newTotal);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    
    // Convert to number for rate and quantity fields
    if (field === 'rate' || field === 'quantity') {
      value = parseFloat(value) || 0;
    }
    
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', rate: 0, quantity: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    let isValid = true;
    let errorMessage = '';
    
    items.forEach((item, index) => {
      if (!item.description) {
        isValid = false;
        errorMessage = `Please enter a description for item ${index + 1}`;
      } else if (item.rate <= 0) {
        isValid = false;
        errorMessage = `Please enter a valid rate for ${item.description}`;
      } else if (item.quantity <= 0) {
        isValid = false;
        errorMessage = `Please enter a valid quantity for ${item.description}`;
      }
    });
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onCreateInvoice(order._id, items);
      setSuccess('Invoice created successfully');
      
      // Reset form after successful creation
      setTimeout(() => {
        setItems([{ description: '', rate: 0, quantity: 0 }]);
        setViewMode('list');
      }, 1000);
      
    } catch (err) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      await onDownloadInvoice(invoiceId);
    } catch (err) {
      setError(err.message || 'Failed to download invoice');
    }
  };

  const handlePreview = async (invoiceId) => {
    try {
      await onPreviewInvoice(invoiceId);
    } catch (err) {
      setError(err.message || 'Failed to preview invoice');
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {viewMode === 'create' ? 'Create Invoice' : 'Manage Invoices'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Tab navigation */}
        {existingInvoices.length > 0 && (
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 font-medium text-sm ${viewMode === 'create' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('create')}
            >
              <FilePlus className="h-4 w-4 inline mr-2" />
              Create New Invoice
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${viewMode === 'list' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('list')}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Existing Invoices
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Create invoice form */}
          {viewMode === 'create' && (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Order Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Order ID:</p>
                    <p className="font-medium">{order?.orderId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer:</p>
                    <p className="font-medium">{order?.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status:</p>
                    <p className="font-medium capitalize">{order?.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date:</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-700">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full ">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Enter item description"
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              step="0.1"
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            {(item.rate * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className={`p-1 rounded-full ${items.length === 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Invoice Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">CGST ({CGST_RATE}%):</span>
                    <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">SGST ({SGST_RATE}%):</span>
                    <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Status messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md font-medium ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'} transition-colors flex items-center`}
                >
                  {loading ? (
                    <span className="inline-block animate-spin mr-2">⟳</span>
                  ) : null}
                  Create Invoice
                </button>
              </div>
            </form>
          )}
          
          {/* List existing invoices */}
          {viewMode === 'list' && (
            <div className="p-6">
              <h3 className="font-medium text-gray-700 mb-4">Existing Invoices</h3>
              
              {existingInvoices.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No invoices found for this order</p>
                  <button
                    onClick={() => setViewMode('create')}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Create Invoice
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden justify-between">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {existingInvoices.map((invoice) => (
                        <tr key={invoice._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{invoice.invoiceNumber}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">₹{invoice.total.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm flex space-x-2">
                            <button
                              onClick={() => handlePreview(invoice._id)}
                              className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors inline-flex items-center"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </button>
                           
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDownload(invoice._id)}
                              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors inline-flex items-center"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>
                {existingInvoices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('create')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Create New Invoice
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;