"use client";

interface TopBarProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TopBar({ title, action }: TopBarProps) {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </header>
  );
}
