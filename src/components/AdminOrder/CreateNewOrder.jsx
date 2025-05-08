import React, { useState } from 'react';
import { X, Upload, Users, PackageCheck } from "lucide-react";
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
    const [order, setOrder] = useState({
        customer: "",
        customerId: "",
        requirements: "",
        dimensions: "",
        status: "graphics_pending",
        assignedTo: "",
        files: [],
        imagePreview: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));

        if (name === "customer") filterCustomers(value);
        if (name === "assignedTo") filterUsers(value);
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
    
        if (!order.customerId) {
            toast.error("Please select a customer from the dropdown");
            setLoading(false);
            return;
        }
    
        const formData = new FormData();
        formData.append("requirements", order.requirements);
        formData.append("dimensions", order.dimensions);
        formData.append("assignedTo", order.assignedToId || "undefined");
    
        if (order.files.length > 0) {
            order.files.forEach((file) => {
                formData.append("images", file);
            });
        }
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Unauthorized: No token found");
                return;
            }
    
            const response = await fetch(`${BASE_URL}/api/v1/admin/createOrder/${order.customerId}`, {
                method: "POST",
                headers: {
                    Authorization: `${token}`,
                },
                body: formData,
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create order: ${errorText}`);
            }
    
            const result = await response.json();
            console.log("Order Created:", result);
            toast.success("Order created successfully");
    
            if (onClose) onClose();
            window.location.reload();
    
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error(`Something went wrong: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setOrder(prev => ({
            ...prev,
            customer: customer.name ,
            customerId: customer._id
        }));
        clearFilteredCustomers();
    };

    const handleSelectUser = (user) => {
        setOrder(prev => ({
            ...prev,
            assignedTo: `${user.firstName} ${user.lastName}`,
            assignedToId: user._id
        }));
        clearFilteredUsers();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-hidden flex flex-col">
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
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
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
                                    {filteredCustomers.map((user) => (
                                        <li key={user._id} 
                                            className="p-2 cursor-pointer hover:bg-indigo-50 transition-colors text-sm"
                                            onClick={() => handleSelectCustomer(user)}
                                        >
                                            {user.name} ({user.email})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                            <textarea
                                name="requirements"
                                placeholder="Detailed requirements..."
                                value={order.requirements}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-20"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                            <input
                                type="text"
                                name="dimensions"
                                placeholder="length x breadth x height"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center py-2">
                                    <Upload className="h-6 w-6 text-gray-400" />
                                    <span className="mt-1 text-sm text-gray-500">Click to upload images</span>
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
                                        className="h-20 w-full object-cover rounded-md"
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
                        create order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateNewOrder;