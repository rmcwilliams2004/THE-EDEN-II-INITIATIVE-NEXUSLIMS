import React, { useState } from 'react';
import { Calculator, Users, CheckCircle2, DollarSign, Award, HelpCircle } from 'lucide-react';

export const OnboardingCalculatorView: React.FC = () => {
  const [equipmentCost, setEquipmentCost] = useState<number>(2560000);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(35);
  const [applyReapGrant, setApplyReapGrant] = useState<boolean>(true);
  const [coopName, setCoopName] = useState('Rift Valley Farmers Cooperative');
  const [cardCount, setCardCount] = useState<number>(250);
  const [cardsProvisioned, setCardsProvisioned] = useState(false);

  // Financial Calculations
  const section179Cap = 2560000;
  const eligibleSection179 = Math.min(equipmentCost, section179Cap);
  const taxSavingsFrom179 = eligibleSection179 * (taxRatePercent / 100);
  const reapGrantAmount = applyReapGrant ? equipmentCost * 0.50 : 0;
  const netEffectiveCost = equipmentCost - taxSavingsFrom179 - reapGrantAmount;
  const annualCarbonDividends = 142000;
  const annualFertilizerSavings = 280000;
  const paybackYears = (netEffectiveCost / (annualCarbonDividends + annualFertilizerSavings)).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
          ENTERPRISE ONBOARDING & FINANCIAL TAX INCENTIVE ENGINE
        </h2>
        <p className="text-xs text-slate-400">
          Model Section 179 first-year accelerated depreciation ($2.56M cap), USDA REAP 50% grants, and batch provision humanitarian smart cards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Deduction & Grant Calculator */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <Calculator className="w-5 h-5" />
            Section 179 & USDA REAP Grant Optimizer
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Equipment Purchase Price ($)</label>
              <input
                type="number"
                value={equipmentCost}
                onChange={(e) => setEquipmentCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Corporate Tax Bracket (%)</label>
                <input
                  type="number"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={applyReapGrant}
                    onChange={(e) => setApplyReapGrant(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>USDA REAP 50% Grant</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Section 179 First-Year Write-off:</span>
              <span className="text-emerald-400 font-bold">${eligibleSection179.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax Cash Savings ({taxRatePercent}%):</span>
              <span className="text-emerald-400 font-bold">${taxSavingsFrom179.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>USDA REAP 50% Non-Dilutive Grant:</span>
              <span className="text-blue-400 font-bold">${reapGrantAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm">
              <span className="text-white font-bold">Net Effective Out-of-Pocket:</span>
              <span className="text-emerald-300 font-extrabold text-base">${Math.max(0, netEffectiveCost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Estimated ROI / Payback:</span>
              <span className="text-amber-400 font-bold">{paybackYears} Years</span>
            </div>
          </div>
        </div>

        {/* NGO Humanitarian Batch Provisioning */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider mb-4">
              <Users className="w-5 h-5" />
              NGO Humanitarian RFID Card Provisioner
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Batch generate cryptographic RFID access cards for rural cooperative smallholders with pre-allocated foliar fertilizer allowances.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Sister Cooperative Name</label>
                <input
                  type="text"
                  value={coopName}
                  onChange={(e) => setCoopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Batch Quantity of Smart NFC Cards</label>
                <input
                  type="number"
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            {cardsProvisioned ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold">PROVISIONING COMPLETE</div>
                  <div>{cardCount} NFC Cards assigned to {coopName}. Keys written to Hedera Token Service.</div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCardsProvisioned(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white transition-colors"
              >
                Provision {cardCount} Sister-Link Smart Cards
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
