import React from 'react';

export const metadata = {
  title: 'EDEN II INITIATIVE / NEXUSLIMS Global Portal',
  description: 'Fleet Management, Financial Deductions, & Hedera dMRV Carbon Credits',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05070a] text-slate-100 min-h-screen antialiased">
        <div className="flex flex-col min-h-screen">
          <header className="border-b border-slate-800/80 bg-[#05070a]/90 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs">
                E2
              </div>
              <span className="font-bold tracking-wider text-sm">EDEN II / NEXUSLIMS</span>
            </div>
            <nav className="flex items-center gap-6 text-xs font-semibold text-slate-400">
              <a href="/fleet" className="hover:text-emerald-400">Global Fleet</a>
              <a href="/onboarding" className="hover:text-emerald-400">Section 179 & Grants</a>
              <a href="/ecocreditx" className="hover:text-emerald-400">EcoCreditX dMRV</a>
            </nav>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
