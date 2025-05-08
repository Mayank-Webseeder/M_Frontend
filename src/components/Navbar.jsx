import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BellIcon, Cog6ToothIcon, Bars3Icon, ArrowPathIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-hot-toast";
import moment from "moment";
import { useSocketEvents } from "../../src/hooks/useSocketEvents";
import { useSocket } from "../socket";

function Navbar({ toggleSidebar, activeMenuItem }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Get socket state using the hook
  const { socket, connected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [limit, setLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to fetch notifications
  const fetchNotifications = useCallback(async (notifLimit = limit) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/v1/admin/getNotification?limit=${notifLimit}`,
        { headers: { Authorization: `${token}` } }
      );

      const formattedNotifications = res.data.notifications.map(notification => ({
        id: notification._id,
        text: notification.text,
        time: moment(notification.createdAt).format('hh:mm A, MMM DD')
      }));

      setNotifications(formattedNotifications);
      // Set unread count when fetching notifications
      setUnreadCount(formattedNotifications.length);

      console.log("formatted notification", formattedNotifications);
      setHasMore(formattedNotifications.length === notifLimit);
    } catch (error) {
      toast.error("Failed to fetch notifications");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL, token, limit]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Function to load more notifications
  const fetchMoreNotifications = () => {
    const newLimit = limit + 5;
    setLimit(newLimit);
    fetchNotifications(newLimit);
  };

  // Message handler
  const messageHandler = useCallback((message) => {
    // Add the new notification
    const newNotification = {
      id: Date.now(),
      text: message,
      time: moment().format('hh:mm A')
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prevCount => prevCount + 1);
    toast.success(message);
  }, []);

  // Handle newNotification event
  const manageNotification = useCallback(() => {
    // Refresh the notifications list
    fetchNotifications();
    toast.success("New notification received");
  }, [fetchNotifications]);

  // Setup socket event handlers
  useSocketEvents({
    "message": messageHandler,
    "newNotification": manageNotification,
    "assignment": (data) => {
      const newNotification = {
        id: data.orderId || Date.now(),
        text: data.message || "New assignment received",
        time: moment().format('hh:mm A') // Current time in 12-hour format
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prevCount => prevCount + 1);
      toast.success(data.message || "New assignment received");
    }
  });

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${BASE_URL}/api/v1/auth/getUser`, {
          headers: { Authorization: `${token}` },
        });
        setUser(response.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to fetch user details"
        );
      }
    };

    fetchUser();
  }, [token, BASE_URL]);

  const firstLetter = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : "?";

  // Handle toggling notifications dropdown
  const toggleNotifications = () => {
    // If we're opening the dropdown, reset the unread count to 0
    if (!showNotifications) {
      setUnreadCount(0);
    }
    setShowNotifications(!showNotifications);
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        !event.target.closest(".notifications-container")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <nav className="bg-white shadow-lg  border-b ">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 lg:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-gray-800 ml-2 lg:ml-64">
              {activeMenuItem ? activeMenuItem : "CRM"}
            </h1>
            {/* Socket connection indicator */}
            <div className="ml-2 flex items-center">
              <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative notifications-container">
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-1"
                aria-label="Refresh notifications"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>

              <button
                onClick={toggleNotifications}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label={`${unreadCount} notifications`}
                aria-expanded={showNotifications}
              >
                <div className="relative">
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {showNotifications && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-72 sm:w-80 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-700">
                      Notifications
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                          role="menuitem"
                        >
                          <p className="text-sm text-gray-700">
                            {notification.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    )}

                    {isLoading && (
                      <div className="px-4 py-2 text-center">
                        <div className="inline-block animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading...</span>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t text-center">
                    {hasMore && notifications.length > 0 && (
                      <button
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        onClick={fetchMoreNotifications}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Loading...' : 'Fetch more'}
                      </button>
                    )}

                    {notifications.length > 0 && !hasMore && (
                      <span className="text-xs text-gray-500">No more notifications</span>
                    )}

                    {!hasMore && notifications.length === 0 && (
                      <span className="text-xs text-gray-500">No notifications available</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate("/settings")}
              aria-label="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            <div className="relative">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold cursor-pointer shadow-md">
                {firstLetter}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;