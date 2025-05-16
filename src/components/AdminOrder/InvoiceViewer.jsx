import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Edit, X, Plus, Trash, Save, Loader } from 'lucide-react';
import toast from "react-hot-toast";

const InvoiceViewer = ({ order, BASE_URL }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', or 'edit'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [items, setItems] = useState([
    { description: '', rate: '', quantity: ''}
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [cgstAmount, setCgstAmount] = useState(0);
  const [sgstAmount, setSgstAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingAction, setLoadingAction] = useState(null);
  const [includeCgst, setIncludeCgst] = useState(true);
  const [includeSgst, setIncludeSgst] = useState(true);

  // CGST and SGST rates
  const CGST_RATE = 9;
  const SGST_RATE = 9;

  useEffect(() => {
    if (order && order._id) {
      fetchInvoices(order._id);
    }
  }, [order]);

  useEffect(() => {
    // Calculate totals whenever items or tax inclusion settings change
    calculateTotals();
  }, [items, includeCgst, includeSgst]);

  const calculateTotals = () => {
    const newSubtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.rate || 0) * parseFloat(item.quantity || 0));
    }, 0);

    // Apply tax rates based on inclusion flags
    const newCgstAmount = includeCgst ? (newSubtotal * CGST_RATE) / 100 : 0;
    const newSgstAmount = includeSgst ? (newSubtotal * SGST_RATE) / 100 : 0;
    const newTotal = newSubtotal + newCgstAmount + newSgstAmount;

    setSubtotal(newSubtotal);
    setCgstAmount(newCgstAmount);
    setSgstAmount(newSgstAmount);
    setTotal(newTotal);
  };

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

  const createInvoice = async () => {
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

    setLoadingAction('create');
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/invoices/create`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: order._id,
          items,
          includeCgst,
          includeSgst
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invoice");
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Invoice created successfully');
        toast.success("Invoice created successfully");
        // Refresh the invoices list
        fetchInvoices(order._id);
        // Reset form and switch to list view
        setItems([{ description: '', rate: 0, quantity: 0 }]);
        setActiveTab('list');
      } else {
        throw new Error(data.message || "Error creating invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const editInvoice = async (invoiceId) => {
    setLoadingAction('edit');
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/invoices/edit/${invoiceId}`, {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items,
          includeCgst,
          includeSgst
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update invoice");
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Invoice updated successfully');
        toast.success("Invoice updated successfully");
        // Refresh the invoices list
        fetchInvoices(order._id);
        // Switch to list view
        setActiveTab('list');
      } else {
        throw new Error(data.message || "Error updating invoice");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreview = async (invoiceId) => {
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
    }
  };

  const handleDownload = async (invoiceId) => {
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
    }
  };

  const handleEdit = async (invoice) => {
    setSelectedInvoice(invoice);
    // Set items from the invoice
    if (invoice && invoice.items) {
      setItems(invoice.items);

      // Set tax inclusion based on invoice values
      setIncludeCgst(invoice.cgst > 0);
      setIncludeSgst(invoice.sgst > 0);
    } else {
      setItems([{ description: '', rate: 0, quantity: 0 }]);
      setIncludeCgst(true);
      setIncludeSgst(true);
    }
    setActiveTab('edit');
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }

    setLoadingAction(`delete-${invoiceId}`);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/v1/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete invoice");
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Invoice deleted successfully");
        // Refresh the invoices list
        fetchInvoices(order._id);
      } else {
        throw new Error(data.message || "Error deleting invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const renderInvoiceList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading invoices...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>Error: {error}</p>
        </div>
      );
    }

    if (invoices.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No invoices found for this order</p>
          <button
            onClick={() => setActiveTab('create')}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Create Invoice
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700">Invoices</h3>
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New Invoice
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">₹{invoice.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      {invoice.cgst > 0 && <span>CGST: {invoice.cgst}%</span>}
                      {invoice.sgst > 0 && <span>SGST: {invoice.sgst}%</span>}
                      {invoice.cgst === 0 && invoice.sgst === 0 && <span>No Tax</span>}
                    </div>
                  </td>
                  {/* <td className="px-4 py-3 text-sm flex space-x-2">
                    <button
                      onClick={() => handlePreview(invoice._id)}
                      className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors inline-flex items-center"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(invoice._id)}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors inline-flex items-center"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="px-3 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors inline-flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                  </td> */}
                  <td className="px-4 py-3 text-sm flex space-x-2">
                    <button
                      onClick={() => handlePreview(invoice._id)}
                      className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors inline-flex items-center"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(invoice._id)}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors inline-flex items-center"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="px-3 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors inline-flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    {/* Add the delete button here */}
                    <button
                      onClick={() => handleDelete(invoice._id)}
                      disabled={loadingAction === `delete-${invoice._id}`}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors inline-flex items-center"
                    >
                      {loadingAction === `delete-${invoice._id}` ? (
                        <Loader className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash className="h-3 w-3 mr-1" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInvoiceForm = (isEdit = false) => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700">
            {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
          </h3>
          <button
            onClick={() => setActiveTab('list')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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

        {/* Tax toggles - separate controls for CGST and SGST */}
        <div className="mb-4 space-y-3">
          <h3 className="font-medium text-gray-700">Tax Options</h3>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeCgst}
                  onChange={() => setIncludeCgst(!includeCgst)}
                />
                <div className={`block w-10 h-6 rounded-full ${includeCgst ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${includeCgst ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div className="ml-3 text-sm font-medium text-gray-700">
                Include CGST ({CGST_RATE}%)
              </div>
            </label>

            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeSgst}
                  onChange={() => setIncludeSgst(!includeSgst)}
                />
                <div className={`block w-10 h-6 rounded-full ${includeSgst ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${includeSgst ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div className="ml-3 text-sm font-medium text-gray-700">
                Include SGST ({SGST_RATE}%)
              </div>
            </label>
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
            <table className="w-full">
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
            {includeCgst && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">CGST ({CGST_RATE}%):</span>
                <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
              </div>
            )}
            {includeSgst && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">SGST ({SGST_RATE}%):</span>
                <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
              </div>
            )}
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
            onClick={() => setActiveTab('list')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={isEdit ? () => editInvoice(selectedInvoice._id) : createInvoice}
            disabled={loadingAction}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-md font-medium ${loadingAction ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'} transition-colors flex items-center`}
          >
            {loadingAction ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : isEdit ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Invoice
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {activeTab === 'list' && renderInvoiceList()}
      {activeTab === 'create' && renderInvoiceForm(false)}
      {activeTab === 'edit' && renderInvoiceForm(true)}
    </div>
  );
};

export default InvoiceViewer;