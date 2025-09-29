import React from "react";

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  icon?: React.ReactNode;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-800 border-gray-200",
  primary: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  info: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  dot = false,
}: BadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 rounded-full font-medium border transition-colors";
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <span className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

