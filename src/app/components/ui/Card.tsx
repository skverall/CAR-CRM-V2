import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & { title?: string; subtitle?: string };

export default function Card({ className = "", title, subtitle, children, ...props }: Props) {
  return (
    <div className={"bg-white border rounded-lg " + className} {...props}>
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

