import React, { useState } from 'react';
import { X, Upload, Users, PackageCheck, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Loader from '../../pages/Loader';
import useCustomers from "../../pages/useCustomers";
import useGraphicsUsers from "../../pages/useGraphicsUsers";
import toast from "react-hot-toast";

const CreateNewOrder = ({ onClose, addOrder }) => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    // Use custom hooks    
    const { filteredCustomers, filterCustomers, clearFilteredCustomers } = useCustomers(BASE_URL);
    const { filteredUsers, filterUsers, clearFilteredUsers } = useGraphicsUsers(BASE_URL);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isExistingCustomer, setIsExistingCustomer] = useState(true);

    const [order, setOrder] = useState({
        customer: "",
        customerId: "",
        requirements: "",
        dimensions: "",
        status: "graphics_pending",
        assignedTo: "",
        assignedToId: "",
        files: [],
        imagePreview: []
    });

    const [customerData, setCustomerData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNo: "",
        gstNo: "",
        panNo: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            additionalDetail: ""
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));

        if (name === "customer") {
            filterCustomers(value);
            // If user is typing in customer field, show existing customer mode
            if (value.length > 0) {
                setIsExistingCustomer(true);
            }
        }
        if (name === "assignedTo") filterUsers(value);
    };

    const handleCustomerDataChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setCustomerData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setCustomerData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setOrder((prev) => ({
                ...prev,
                files: files,
                imagePreview: files.map((file) => URL.createObjectURL(file)),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate required fields
        if (!order.requirements || !order.dimensions || order.files.length === 0) {
            toast.error("Requirements, dimensions, and images are mandatory");
            setLoading(false);
            return;
        }

        // Validate based on customer selection type
        if (isExistingCustomer && !order.customerId) {
            toast.error("Please select a customer from the dropdown");
            setLoading(false);
            return;
        }

        if (!isExistingCustomer && (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phoneNo)) {
            toast.error("Please fill in all required customer details");
            setLoading(false);
            return;
        }

        // Validate address if any address field is provided
        if (!isExistingCustomer && (customerData.address.street || customerData.address.city || customerData.address.state || customerData.address.pincode)) {
            if (!customerData.address.street || !customerData.address.city || !customerData.address.state || !customerData.address.pincode) {
                toast.error("Address must include street, city, state, and pincode");
                setLoading(false);
                return;
            }
        }

        const formData = new FormData();
        formData.append("requirements", order.requirements);
        formData.append("dimensions", order.dimensions);
        formData.append("assignedTo", order.assignedToId || "");

        // Add customer data based on selection type
        if (isExistingCustomer) {
            formData.append("customerId", order.customerId);
        } else {
            // Add new customer data
            formData.append("firstName", customerData.firstName);
            formData.append("lastName", customerData.lastName);
            formData.append("email", customerData.email);
            formData.append("phoneNo", customerData.phoneNo);
            formData.append("gstNo", customerData.gstNo || "");
            formData.append("panNo", customerData.panNo || "");

            // Add address data only if all required fields are provided
            if (customerData.address.street && customerData.address.city && customerData.address.state && customerData.address.pincode) {
                formData.append("address[street]", customerData.address.street);
                formData.append("address[city]", customerData.address.city);
                formData.append("address[state]", customerData.address.state);
                formData.append("address[pincode]", customerData.address.pincode);
                formData.append("address[additionalDetail]", customerData.address.additionalDetail || "");
            }
        }

        // Add images
        order.files.forEach((file) => {
            formData.append("images", file);
        });

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized: No token found");
                setLoading(false);
                return;
            }

            const response = await fetch(`${BASE_URL}/api/v1/admin/createOrder`, {
                method: "POST",
                headers: {
                    Authorization: `${token}`, // Fixed: Added 'Bearer ' prefix
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to create order: ${response.status}`);
            }

            const result = await response.json();
            toast.success(result.message || "Order created successfully");

            // Reset form
            setOrder({
                customer: "",
                customerId: "",
                requirements: "",
                dimensions: "",
                status: "graphics_pending",
                assignedTo: "",
                assignedToId: "",
                files: [],
                imagePreview: []
            });

            setCustomerData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNo: "",
                gstNo: "",
                panNo: "",
                address: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    additionalDetail: ""
                }
            });

            clearFilteredCustomers();
            clearFilteredUsers();

            if (onClose) onClose();
            window.location.reload(); // Reload to reflect changes

        } catch (error) {
            console.error("Error creating order:", error);
            toast.error(error.message || "Something went wrong while creating the order");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setOrder(prev => ({
            ...prev,
            customer: `${customer.firstName} ${customer.lastName}`,
            customerId: customer._id
        }));
        clearFilteredCustomers();
        setIsExistingCustomer(true);
    };

    const handleSelectUser = (user) => {
        setOrder(prev => ({
            ...prev,
            assignedTo: `${user.firstName} ${user.lastName}`,
            assignedToId: user._id
        }));
        clearFilteredUsers();
    };

    const handleToggleCustomerType = () => {
        setIsExistingCustomer(!isExistingCustomer);
        setShowAddressForm(false);

        // Clear customer selection when switching modes
        setOrder(prev => ({
            ...prev,
            customer: "",
            customerId: ""
        }));

        // Clear customer data when switching to existing customer
        if (isExistingCustomer) {
            setCustomerData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNo: "",
                gstNo: "",
                panNo: "",
                address: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    additionalDetail: ""
                }
            });
        }

        clearFilteredCustomers();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl md:text-2xl font-semibold text-indigo-700 flex items-center">
                        <PackageCheck className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                        Create New Order
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 flex-grow">
                    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
                        {/* Customer Selection Type Toggle */}
                        <div className="border-b pb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-medium text-gray-800">Customer Information</h3>
                                <button
                                    type="button"
                                    onClick={handleToggleCustomerType}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    {isExistingCustomer ? "New Customer" : "Select Existing Customer"}
                                </button>
                            </div>

                            {isExistingCustomer ? (
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer *</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="customer"
                                            placeholder="Search customer name..."
                                            value={order.customer}
                                            onChange={handleChange}
                                            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    {filteredCustomers.length > 0 && (
                                        <ul className="absolute w-full bg-white border rounded-md shadow-md mt-1 z-10 max-h-32 overflow-y-auto">
                                            {filteredCustomers.map((customer) => (
                                                <li key={customer._id}
                                                    className="p-2 cursor-pointer hover:bg-indigo-50 transition-colors text-sm"
                                                    onClick={() => handleSelectCustomer(customer)}
                                                >
                                                    {customer.firstName} {customer.lastName} ({customer.email})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={customerData.firstName}
                                            onChange={handleCustomerDataChange}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={customerData.lastName}
                                            onChange={handleCustomerDataChange}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={customerData.email}
                                            onChange={handleCustomerDataChange}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phoneNo"
                                            value={customerData.phoneNo}
                                            onChange={handleCustomerDataChange}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                                        <input
                                            type="text"
                                            name="gstNo"
                                            value={customerData.gstNo}
                                            onChange={handleCustomerDataChange}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                                        <input
                                            type="text"
                                            name="panNo"
                                            value={customerData.panNo}
                                            onChange={handleCustomerDataChange}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    {/* Address Section */}
                                    <div className="md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressForm(!showAddressForm)}
                                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-2"
                                        >
                                            {showAddressForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            Address Details (Optional)
                                        </button>

                                        {showAddressForm && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                                    <input
                                                        type="text"
                                                        name="address.street"
                                                        value={customerData.address.street}
                                                        onChange={handleCustomerDataChange}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Enter street address"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                    <input
                                                        type="text"
                                                        name="address.city"
                                                        value={customerData.address.city}
                                                        onChange={handleCustomerDataChange}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Enter city"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                                    <input
                                                        type="text"
                                                        name="address.state"
                                                        value={customerData.address.state}
                                                        onChange={handleCustomerDataChange}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Enter state"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                                    <input
                                                        type="text"
                                                        name="address.pincode"
                                                        value={customerData.address.pincode}
                                                        onChange={handleCustomerDataChange}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Enter pincode"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                                                    <input
                                                        type="text"
                                                        name="address.additionalDetail"
                                                        value={customerData.address.additionalDetail}
                                                        onChange={handleCustomerDataChange}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Landmark, building name, etc."
                                                    />
                                                </div>
                                                <div className="md:col-span-2 text-sm text-gray-600">
                                                    <strong>Note:</strong> If you fill any address field, all fields (Street, City, State, Pincode) are required.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label>
                            <textarea
                                name="requirements"
                                placeholder="Enter detailed requirements..."
                                value={order.requirements}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-20"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions *</label>
                            <input
                                type="text"
                                name="dimensions"
                                placeholder="e.g., 10x20x5 cm"
                                value={order.dimensions}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To (Optional)</label>
                            <input
                                type="text"
                                name="assignedTo"
                                placeholder="Search graphics user..."
                                value={order.assignedTo}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {filteredUsers.length > 0 && (
                                <ul className="absolute w-full bg-white border rounded-md shadow-md mt-1 z-10 max-h-32 overflow-y-auto">
                                    {filteredUsers.map((user) => (
                                        <li key={user._id}
                                            className="p-2 cursor-pointer hover:bg-indigo-50 transition-colors text-sm"
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            {user.firstName} {user.lastName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images *</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="file-upload"
                                    required
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center py-2">
                                    <Upload className="h-6 w-6 text-gray-400" />
                                    <span className="mt-1 text-sm text-gray-500">Click to upload images (Required)</span>
                                </label>
                            </div>
                        </div>

                        {order.imagePreview && order.imagePreview.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                                {order.imagePreview.map((preview, index) => (
                                    <img
                                        key={index}
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="h-20 w-full object-cover rounded-md border"
                                    />
                                ))}
                            </div>
                        )}
                    </form>
                </div>

                <div className="border-t p-4 flex justify-end space-x-3 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="relative flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            'Create Order'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateNewOrder;