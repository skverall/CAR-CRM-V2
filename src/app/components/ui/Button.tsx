"use client";
import React from "react";
import { useFormStatus } from "react-dom";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loadingText?: string;
};

export default function Button({ className = "", children, loadingText = "Yuklanmoqda...", ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 " +
        className
      }
      disabled={pending || props.disabled}
    >
      {pending ? loadingText : children}
    </button>
  );
}

