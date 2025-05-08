
import { useState, useEffect } from "react";

const useCustomers = (BASE_URL) => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BASE_URL}/api/v1/admin/getAllCustomers`, {
                method: "GET",
                headers: { Authorization: `${token}` },
                withCredentials: true,
            });

            if (!response.ok) throw new Error("Failed to fetch customers");
            const data = await response.json();

            const customersList = data.customers.map(user => ({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                // Name:user.name,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone,
            }));

            setCustomers(customersList);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const filterCustomers = (searchValue) => {
        if (!searchValue.trim()) {
            setFilteredCustomers([]);
        } else {
            const filtered = customers.filter(user =>
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchValue.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    };

    const clearFilteredCustomers = () => {
        setFilteredCustomers([]); // Clears the filtered list when a user is selected
    };

    return { filteredCustomers, filterCustomers, clearFilteredCustomers };
};

export default useCustomers;