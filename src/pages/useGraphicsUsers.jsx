import { useState, useEffect } from "react";
import axios from "axios";

const useGraphicsUsers = (BASE_URL) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        fetchGraphicsUsers();
    }, []);

    const fetchGraphicsUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${BASE_URL}/api/v1/auth/getAllUsers`, {
                headers: { Authorization: `${token}` },
                withCredentials: true,
            });

            if (response.data.success) {
                const graphicsUsers = response.data.data.filter(user => user.accountType === "Graphics" );
                setUsers(graphicsUsers);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const filterUsers = (searchValue) => {
        if (!searchValue.trim()) {
            setFilteredUsers([]); // 🔥 Clears suggestions if input is empty
        } else {
            const filtered = users.filter(user =>
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchValue.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    };

    const clearFilteredUsers = () => {
        setFilteredUsers([]); // ✅ Clears suggestions when user is selected
    };

    return { filteredUsers, filterUsers, clearFilteredUsers }; // 🔥 Return the new function
};

export default useGraphicsUsers;