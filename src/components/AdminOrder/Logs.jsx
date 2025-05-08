import React, { useState, useEffect } from "react";
import { Clock, Loader, AlertCircle, FileText, UserCheck, RefreshCw, CheckCircle } from "lucide-react";
import axios from "axios";

const Logs = ({ order, BASE_URL }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order && order._id) {
      fetchLogs();
    }
  }, [order]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/v1/admin/getAllLog/${order._id}`,
        {
          headers: { Authorization: `${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setLogs(response.data.allLog);
      } else {
        setError(response.data.message || "Failed to fetch logs");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.response?.data?.message || "Error fetching logs");
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (log) => {
    if (log.changes && log.changes.includes("Status changed")) {
      return <RefreshCw className="h-5 w-5 text-blue-600" />;
    } else if (log.changes && log.changes.includes("Assigned to")) {
      return <UserCheck className="h-5 w-5 text-indigo-600" />;
    } else if (log.changes && log.changes.includes("Requirements")) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (log.previmage?.length > 0 || log.afterimage?.length > 0) {
      return <CheckCircle className="h-5 w-5 text-purple-600" />;
    } else {
      return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <Loader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
        <span className="text-gray-500">Loading logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-8 text-center border border-red-100">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-red-700 mb-2">Error Loading Logs</h3>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-200 p-3 rounded-full">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Logs Available</h3>
        <p className="text-gray-500 text-sm">No activity logs have been recorded for this order yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center border-b border-gray-100 px-5 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Activity Timeline</h3>
          </div>
        </div>

        <div className="p-5">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-0 left-5 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Timeline Items */}
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log._id} className="relative pl-14 ">
                  {/* Timeline Icon */}
                  <div className="absolute left-0 p-2 rounded-full bg-white border-2 border-gray-200">
                    {getLogIcon(log)}
                  </div>

                  {/* Log Content */}
                  <div className="bg-gray-50 rounded-lg p-4 ">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-800">
                        {log.changes || "Image Update"}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>

                    {/* Show images if available */}
                    {(log.previmage?.length > 0 || log.afterimage?.length > 0) && (
                      <div className="mt-3 space-y-3">
                        {log.previmage?.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">Previous Image:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {log.previmage.map((img, idx) => (
                                <div key={`prev-${idx}`} className="rounded-lg overflow-hidden border border-gray-200">
                                  <img
                                    src={`${BASE_URL}${img}`}
                                    alt={`Previous ${idx + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.afterimage?.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">Updated Image:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {log.afterimage.map((img, idx) => (
                                <div key={`after-${idx}`} className="rounded-lg overflow-hidden border border-gray-200">
                                  <img
                                    src={`${BASE_URL}${img}`}
                                    alt={`Updated ${idx + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;

