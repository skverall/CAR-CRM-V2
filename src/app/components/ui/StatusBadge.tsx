"use client";

type StatusType = 'in_transit' | 'for_sale' | 'reserved' | 'sold' | 'archived' | 'available' | 'repair' | 'listed';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
}

const statusStyles: Record<StatusType, string> = {
  in_transit: "bg-blue-100 text-blue-800 border-blue-200",
  for_sale: "bg-green-100 text-green-800 border-green-200",
  listed: "bg-green-100 text-green-800 border-green-200",
  reserved: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sold: "bg-purple-100 text-purple-800 border-purple-200",
  available: "bg-gray-100 text-gray-800 border-gray-200",
  repair: "bg-orange-100 text-orange-800 border-orange-200",
  archived: "bg-red-100 text-red-800 border-red-200",
};

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors";
  const statusClasses = statusStyles[status] || statusStyles.available;
  
  return (
    <span className={`${baseClasses} ${statusClasses}`}>
      {children}
    </span>
  );
}
