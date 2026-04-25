'use client'
import React, { useEffect, useState } from "react";
import { Search, Filter, Clock, Tag, AlertCircle, CheckCircle, XCircle, Eye, MessageSquare, Paperclip, Calendar, Hash, Loader2, X, User } from "lucide-react";
import BASE_URL from "@/app/config/api/api";
import TicketFilter from "./TicketFilter";

type Ticket = {
  id: string;
  category: string;
  status: "NEW" | "OPEN" | "CLOSED";
  subject: string;
  content: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  attachments: string[];
  launchTimestamp: string;
  updatedAt: string;
   replies: string[];  
};

type TicketConversationMessage = {
  actorRole: string;
  channel: string;
  message: string;
  timestamp: string;
};

type TicketContext = {
  ticketId: number;
  status: string;
  issueDescription: string;
  subject: string;
  issuerEmail: string;
  assignedAgent: string;
  channelOfOrigin: string;
  launchTimestamp: string;
  updatedAt: string;
  servedTimestamp: string;
  openTicket: boolean;
  minutesOpen: number;
  conversationHistory: TicketConversationMessage[];
};

type TicketLookupResponse = {
  found: boolean;
  message: string;
  tickets: TicketContext[];
};

type TicketStats = {
  all: number;
  new: number;
  open: number;
  closed: number;
};

type FilterType = "all" | "new" | "open" | "closed";

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
    type === 'success' 
      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
      : type === 'error'
      ? 'bg-red-50/90 border-red-200 text-red-800'
      : 'bg-blue-50/90 border-blue-200 text-blue-800'
  }`}>
    {type === 'success' ? 
      <CheckCircle className="w-5 h-5 text-emerald-600" /> : 
      type === 'error' ?
      <AlertCircle className="w-5 h-5 text-red-600" /> :
      <AlertCircle className="w-5 h-5 text-blue-600" />
    }
    <span className="font-medium">{message}</span>
    <button 
      onClick={onClose}
      className="ml-2 hover:opacity-70 transition-opacity"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    all: 0,
    new: 0,
    open: 0,
    closed: 0,
  });
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState("")
  const [comment, setComment] = useState("");
  const [ticketContext, setTicketContext] = useState<TicketContext | null>(null);
  const [isContextLoading, setIsContextLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const email = localStorage.getItem("email") ?? "";
      const response = await fetch(`${BASE_URL}/ticket/getMyTickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Ticket[] = await response.json();
      setTickets(data);
      calculateTicketStats(data);
      showToast('success', `Loaded ${data.length} tickets successfully`);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      showToast('error', 'Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("email") ?? "";
    setAuthToken(token)
  }, []); 

  // Calculate ticket stats
  const calculateTicketStats = (data: Ticket[]) => {
    const allTickets = data.length;
    const newTickets = data.filter((ticket) => ticket.status === "NEW").length;
    const openTickets = data.filter((ticket) => ticket.status === "OPEN").length;
    const closedTickets = data.filter((ticket) => ticket.status === "CLOSED").length;

    setTicketStats({
      all: allTickets,
      new: newTickets,
      open: openTickets,
      closed: closedTickets,
    });
  };

  const filteredData = tickets.filter((ticket) => {
    const matchesFilter = filter === "all" || ticket.status.toLowerCase() === filter;
    const matchesSearch =
      searchTerm === "" ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const fetchTicketContext = async (ticketId: string) => {
    setIsContextLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/ticket/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: Number(ticketId),
          includeClosed: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TicketLookupResponse = await response.json();
      if (data.found && data.tickets && data.tickets.length > 0) {
        setTicketContext(data.tickets[0]);
      } else {
        setTicketContext(null);
      }
    } catch (error) {
      console.error("Error loading ticket context:", error);
      setTicketContext(null);
      showToast('error', 'Failed to load ticket conversation context.');
    } finally {
      setIsContextLoading(false);
    }
  };

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    setComment("");
    fetchTicketContext(ticket.id);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setIsModalOpen(false);
    setComment("");
    setTicketContext(null);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: "NEW" | "OPEN" | "CLOSED") => {
    const updateData = {
      status: newStatus,
      token: authToken,
      ticketId: ticketId,
      reply: comment
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${BASE_URL}/ticket/updateTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchTickets();
      showToast('success', `Ticket ${newStatus.toLowerCase()} successfully`);
      
      if (isModalOpen) {
        closeModal();
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      showToast('error', 'Failed to update ticket. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const resolveTicket = (ticketId: string) => {
    updateTicketStatus(ticketId, "CLOSED");
  };

  const reopenTicket = (ticketId: string) => {
    updateTicketStatus(ticketId, "OPEN");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
          dot: "bg-red-500"
        };
      case "HIGH":
        return {
          bg: "bg-orange-100",
          text: "text-orange-800",
          border: "border-orange-200",
          dot: "bg-orange-500"
        };
      case "MEDIUM":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200",
          dot: "bg-yellow-500"
        };
      case "LOW":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          dot: "bg-green-500"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          dot: "bg-gray-500"
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: AlertCircle
        };
      case "CLOSED":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: CheckCircle
        };
      case "NEW":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          border: "border-purple-200",
          icon: XCircle
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: AlertCircle
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-3">
              Support Ticket Dashboard
            </h1>
            <p className="text-lg text-slate-600">
              Manage and track customer support tickets efficiently
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tickets by subject, content, or category..."
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-700 placeholder-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filters:</span>
              </div>
            </div>
            
            <div className="mt-4">
              <TicketFilter
                ticketStats={ticketStats}
                onFilterChange={setFilter}
                selectedFilter={filter}
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Tickets</h3>
              <p className="text-slate-600">Please wait while we fetch your support tickets...</p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Tickets Found</h3>
              <p className="text-slate-600">
                {searchTerm ? `No tickets match "${searchTerm}"` : `No ${filter === 'all' ? '' : filter} tickets available`}
              </p>
            </div>
          </div>
        ) : (
          /* Tickets List */
          <div className="space-y-4">
            {filteredData.map((ticket) => {
              const statusConfig = getStatusConfig(ticket.status);
              const priorityConfig = getPriorityConfig(ticket.priority);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={ticket.id}
                  className="bg-white border-2 border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Main Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        {/* Status and Priority Badges */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span>{ticket.status}</span>
                          </span>
                          <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-bold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                            <div className={`w-2 h-2 rounded-full ${priorityConfig.dot}`}></div>
                            <span>{ticket.priority}</span>
                          </span>
                        </div>
                        
                        {/* Subject */}
                        <h2 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2">
                          {ticket.subject}
                        </h2>
                        
                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Category:</span>
                            <span className="bg-slate-100 px-2 py-1 rounded-md font-medium">
                              {ticket.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Created:</span>
                            <span>{formatDate(ticket.launchTimestamp)}</span>
                          </div>
                         
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Hash className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">ID:</span>
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md">
                              {String(ticket.id).substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                          onClick={() => openModal(ticket)}
                          disabled={isUpdating}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        {(ticket.status === "NEW" || ticket.status === "OPEN") && (
                          <button
                            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => resolveTicket(ticket.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            <span>Resolve</span>
                          </button>
                        )}
                        {ticket.status === "CLOSED" && (
                          <button
                            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => reopenTicket(ticket.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span>Reopen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced Modal */}
        {isModalOpen && selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="text-2xl font-bold mb-3 leading-tight">
                      {selectedTicket.subject}
                    </h2>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const statusConfig = getStatusConfig(selectedTicket.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <>
                            <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30`}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{selectedTicket.status}</span>
                            </span>
                            <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30`}>
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                              <span>{selectedTicket.priority}</span>
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    disabled={isUpdating}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Modal Content */}
                <div className="p-6">
                  {/* Ticket Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <Hash className="w-4 h-4" />
                        <span>Ticket ID</span>
                      </div>
                      <p className="font-mono text-sm bg-white px-3 py-2 rounded-lg border font-medium">
                        {selectedTicket.id}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <Tag className="w-4 h-4" />
                        <span>Category</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium">
                        {selectedTicket.category}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <User className="w-4 h-4" />
                        <span>Assigned Agent</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium">
                        {ticketContext?.assignedAgent || "Unassigned"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <MessageSquare className="w-4 h-4" />
                        <span>Customer Email</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium break-all">
                        {ticketContext?.issuerEmail || "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Open Duration</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium">
                        {ticketContext ? `${ticketContext.minutesOpen} mins` : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <Tag className="w-4 h-4" />
                        <span>Origin Channel</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium">
                        {ticketContext?.channelOfOrigin || "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>Created</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium">
                        {formatDate(selectedTicket.launchTimestamp)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Last Updated</span>
                      </div>
                      <p className="bg-white px-3 py-2 rounded-lg border font-medium">
                        {formatDate(selectedTicket.updatedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Ticket Description */}
                  <div className="mb-6">
                    <h3 className="flex items-center space-x-2 text-xl font-bold text-slate-800 mb-4">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      <span>Description</span>
                    </h3>
                    <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl min-h-[120px]">
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.content}
                      </p>
                    </div>
                  </div>

                  {/* Full Conversation Timeline */}
                  <div className="mb-6">
                    <h3 className="flex items-center space-x-2 text-xl font-bold text-slate-800 mb-4">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <span>Conversation Timeline</span>
                    </h3>

                    {isContextLoading ? (
                      <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-slate-600">Loading full ticket conversation context...</span>
                      </div>
                    ) : ticketContext?.conversationHistory && ticketContext.conversationHistory.length > 0 ? (
                      <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl max-h-80 overflow-y-auto space-y-3">
                        {[...ticketContext.conversationHistory]
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((entry, index) => (
                            <div key={`${entry.timestamp}-${index}`} className="bg-white border border-slate-200 rounded-xl p-4">
                              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                  {entry.actorRole || "SYSTEM"}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                                  {entry.channel || "unknown"}
                                </span>
                                <span className="text-slate-500">
                                  {entry.timestamp ? formatDate(entry.timestamp) : "Unknown time"}
                                </span>
                              </div>
                              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                                {entry.message}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl">
                        <p className="text-slate-600">
                          No prior bot/agent conversation history found for this ticket yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Replies Section */}
                  {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                    <div className="mb-6">
                      <h3 className="flex items-center space-x-2 text-xl font-bold text-slate-800 mb-4">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        <span>Replies ({selectedTicket.replies.length})</span>
                      </h3>
                      <div className="space-y-4">
                        {selectedTicket.replies.map((reply, index) => (
                          <div 
                            key={index}
                            className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-semibold text-slate-800">Support Agent</span>
                                  <span className="text-xs text-slate-500">#{index + 1}</span>
                                </div>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                  {reply}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Attachments Section */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="flex items-center space-x-2 text-xl font-bold text-slate-800 mb-4">
                        <Paperclip className="w-6 h-6 text-blue-600" />
                        <span>Attachments ({selectedTicket.attachments.length})</span>
                      </h3>
                      <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm italic">Attachments will be displayed here</p>
                      </div>
                    </div>
                  )}

                  {/* Comment/Reply Section */}
                  <div className="mb-6">
                    <h3 className="flex items-center space-x-2 text-xl font-bold text-slate-800 mb-4">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      <span>Add Response</span>
                    </h3>
                    <textarea
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 resize-none text-slate-700 placeholder-slate-400"
                      rows={4}
                      placeholder="Add your response or internal notes here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
                            {/* Modal Footer - Enhanced with Fixed Positioning */}
                <div className="bg-slate-50 border-t-2 border-slate-200 p-6 sticky bottom-0">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                      {(selectedTicket.status === "NEW" || selectedTicket.status === "OPEN") && (
                        <button
                          className="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial min-w-[140px]"
                          onClick={() => resolveTicket(selectedTicket.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                          <span>Resolve Ticket</span>
                        </button>
                      )}
                      
                      {selectedTicket.status === "CLOSED" && (
                        <button
                          className="flex items-center justify-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial min-w-[140px]"
                          onClick={() => reopenTicket(selectedTicket.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                          <span>Reopen Ticket</span>
                        </button>
                      )}
                    </div>
                    
                    <button
                      className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg min-w-[100px]"
                      onClick={closeModal}
                      disabled={isUpdating}
                    >
                      Close
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
