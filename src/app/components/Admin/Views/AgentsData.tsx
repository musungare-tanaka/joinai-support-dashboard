'use client'
import BASE_URL from "@/app/config/api/api";
import React, { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, FiCalendar, FiRefreshCw, FiLoader } from "react-icons/fi";
import { FaUserShield } from "react-icons/fa";
import { motion } from "framer-motion";

interface AgentData {
  id: number | null;
  firstName: string;
  username: string;
  email: string;
  role: string;
  localDate: string;
  gender: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  enabled?: boolean | null;
}

const AgentDataComponent: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusUpdatingEmail, setStatusUpdatingEmail] = useState<string | null>(null);

  const isAgentActive = (agent: AgentData): boolean => agent.enabled !== false;

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("email");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${BASE_URL}/admin/getAgents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data: AgentData[] = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch agents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (agent: AgentData) => {
    try {
      const token = localStorage.getItem("email");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${BASE_URL}/admin/editProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, agent }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit agent profile");
      }

      const updatedAgent: AgentData = await response.json();
      setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to edit agent");
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    
    try {
      const token = localStorage.getItem("email");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${BASE_URL}/admin/deleteProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, agent: selectedAgent }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }

      setAgents(agents.filter((a) => a.id !== selectedAgent.id));
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to delete agent");
    }
  };

  const handleToggleStatus = async (agent: AgentData) => {
    const token = localStorage.getItem("email");
    if (!token) {
      setError("Admin email is missing. Please log in again.");
      return;
    }

    const nextEnabled = !isAgentActive(agent);
    setStatusUpdatingEmail(agent.email);

    try {
      const response = await fetch(`${BASE_URL}/admin/updateAgentStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          agentEmail: agent.email,
          enabled: nextEnabled,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You are not authorized to update account status.");
        }
        throw new Error("Failed to update account status.");
      }

      const updatedAgent: AgentData = await response.json();
      setAgents((prev) => prev.map((a) => (a.email === updatedAgent.email ? updatedAgent : a)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update account status.");
    } finally {
      setStatusUpdatingEmail(null);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.phone && agent.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchAgents();
  }, []);

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <FiRefreshCw className="animate-spin text-4xl text-blue-500" />
          <p className="text-lg font-medium text-gray-700">Loading agent data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md bg-red-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchAgents}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agent Management</h1>
          <p className="text-gray-600 mt-1">View and manage all registered agents</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder="Search agents..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={fetchAgents}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiUser className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No agents found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm ? 'No agents match your search criteria' : 'There are currently no agents registered in the system'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map((agent) => (
                  <motion.tr 
                    key={agent.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiUser className="text-blue-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.firstName || "Unnamed"}</div>
                          <div className="text-sm text-gray-500">@{agent.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiMail className="mr-2 text-gray-400" />
                        {agent.email}
                      </div>
                      {agent.phone && (
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <FiPhone className="mr-2 text-gray-400" />
                          {agent.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUserShield className="mr-2 text-purple-500" />
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {agent.role || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-gray-400" />
                        {agent.localDate || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isAgentActive(agent) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isAgentActive(agent) ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(agent)}
                          disabled={statusUpdatingEmail === agent.email}
                          className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                            isAgentActive(agent)
                              ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                              : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          } ${statusUpdatingEmail === agent.email ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {statusUpdatingEmail === agent.email ? (
                            <span className="inline-flex items-center gap-1">
                              <FiLoader className="animate-spin" />
                              Updating...
                            </span>
                          ) : isAgentActive(agent) ? (
                            'Set Inactive'
                          ) : (
                            'Set Active'
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  defaultValue={selectedAgent.firstName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={selectedAgent.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  defaultValue={selectedAgent.phone || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(selectedAgent)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Agent</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {selectedAgent.firstName || 'this agent'}? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AgentDataComponent;
