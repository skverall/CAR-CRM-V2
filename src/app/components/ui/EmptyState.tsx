import React from "react";

type Props = { title?: string; description?: string };

export default function EmptyState({ title = "Ma'lumot topilmadi", description = "Filtrlarni o'zgartirib ko'ring yoki yangi yozuv qo'shing." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 text-gray-500">
      <div className="text-3xl mb-2">🗒️</div>
      <div className="font-medium">{title}</div>
      <div className="text-sm">{description}</div>
    </div>
  );
}

