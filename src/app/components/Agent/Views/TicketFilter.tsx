
// TicketFilter.tsx
import React from "react";

interface TicketStats {
  all: number;
  new: number;
  open: number;
  closed: number;
}

type FilterType = "all" | "open" | "closed";

interface TicketFilterProps {
  ticketStats: TicketStats;
  onFilterChange: (filter: FilterType) => void;
  selectedFilter: FilterType;
}

const TicketFilter: React.FC<TicketFilterProps> = ({
  ticketStats,
  onFilterChange,
  selectedFilter,
}) => {
  const getButtonClass = (filter: FilterType) => {
    const hasTickets = ticketStats[filter] > 0;
    return `rounded-lg border px-4 py-2.5 text-center transition-colors text-sm font-medium ${
      selectedFilter === filter
        ? "bg-[#3F5C79] border-[#3F5C79] text-white shadow-sm"
        : hasTickets 
          ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50" 
          : "border-slate-200 bg-slate-50 text-slate-400"
    }`;
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 p-2 bg-[#F4F7FA] rounded-xl border border-slate-200 text-black w-full max-w-3xl">
      <button
        type="button"
        aria-pressed={selectedFilter === "all"}
        className={getButtonClass("all")}
        onClick={() => onFilterChange("all")}
      >
        All Tickets ({ticketStats.all})
      </button>
      <button
        type="button"
        aria-pressed={selectedFilter === "open"}
        className={getButtonClass("open")}
        onClick={() => onFilterChange("open")}
      >
        Open ({ticketStats.open})
      </button>
      <button
        type="button"
        aria-pressed={selectedFilter === "closed"}
        className={getButtonClass("closed")}
        onClick={() => onFilterChange("closed")}
      >
        Closed ({ticketStats.closed})
      </button>
    </div>
  );
};

export default TicketFilter;
