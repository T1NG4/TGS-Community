import React from 'react';

export const MetaField = ({
  label,
  value,
  onChange,
  type = 'text',
  helper,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  helper?: string;
}) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</label>
    <input
      type={type}
      value={value}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black border border-zinc-800 rounded-xl h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
    />
    {helper && <div className="text-[9px] text-zinc-600">{helper}</div>}
  </div>
);
