import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

const base =
  "w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white";

const Select = React.forwardRef<HTMLSelectElement, Props>(function Select(
  { className = "", children, ...props },
  ref
) {
  return (
    <select ref={ref} className={`${base} ${className}`} {...props}>
      {children}
    </select>
  );
});

export default Select;

