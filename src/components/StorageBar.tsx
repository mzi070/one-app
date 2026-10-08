"use client";

import { getUsageColor, getUsageTextColor } from "@/lib/utils";

interface StorageBarProps {
  used: number;
  total: number;
  label?: string;
  showPercent?: boolean;
  height?: string;
}

export default function StorageBar({ used, total, label, showPercent = true, height = "h-2" }: StorageBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = getUsageColor(pct);
  const textColor = getUsageTextColor(pct);

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
          {showPercent && (
            <span className={`text-xs font-semibold ${textColor}`}>{pct}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${height} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
