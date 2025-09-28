import React from "react";

type Props = React.TableHTMLAttributes<HTMLTableElement> & {
  maxHeightClass?: string; // e.g. "max-h-[70vh]"
};

export default function TableShell({ className = "", children, maxHeightClass = "max-h-[70vh]", ...props }: Props) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden`}>
      <div className={`${maxHeightClass} overflow-auto`}>
        <table className={`min-w-full ${className}`} {...props}>
          {/* Pass <thead> and <tbody> as children. For sticky header, add
              className="bg-gray-50 sticky top-0 z-10" to your <thead>. */}
          {children}
        </table>
      </div>
    </div>
  );
}

