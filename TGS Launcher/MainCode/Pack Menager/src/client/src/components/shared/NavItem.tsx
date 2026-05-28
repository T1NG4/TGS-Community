import React from 'react';

export const NavItem = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-[13px] text-sm rounded-2xl cursor-pointer transition-all mb-1 ${
      active ? 'bg-white text-black shadow-inner' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
    }`}
  >
    {icon}
    {label}
  </div>
);
