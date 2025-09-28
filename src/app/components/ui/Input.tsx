import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const base =
  "w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50";

const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className = "", ...props },
  ref
) {
  return <input ref={ref} className={`${base} ${className}`} {...props} />;
});

export default Input;

