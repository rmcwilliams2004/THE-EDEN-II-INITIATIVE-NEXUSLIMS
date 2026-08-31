import React from 'react';

interface Props {
  targetLang: string;
  setTargetLang: (lang: string) => void;
  disabled?: boolean;
}

export const LanguageSelector = ({ targetLang, setTargetLang, disabled }: Props) => {
  const languages = [
    { code: 'en', label: 'English (US)' },
    { code: 'sw', label: 'Kiswahili (KE)' },
    { code: 'es', label: 'Español (ES)' },
    { code: 'pt', label: 'Português (BR)' },
    { code: 'fr', label: 'Français (FR)' }
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        Target Comms Language
      </label>
      <select 
        value={targetLang} 
        onChange={(e) => setTargetLang(e.target.value)}
        disabled={disabled}
        className="bg-slate-900 border border-slate-700 text-sm text-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 disabled:opacity-50"
      >
        {languages.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
};
