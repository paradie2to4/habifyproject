import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AffordabilityCalculator } from '../services/affordabilityCalculator';
import {
  Calculator,
  X,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';

export const AffordabilityCalculatorModal: React.FC = () => {
  const { preferences, updatePreferences, closeModal, modalData } = useApp();

  const [income, setIncome] = useState<number>(preferences.monthlyIncome || 1000000);
  const [rent, setRent] = useState<number>(modalData?.property?.monthlyRent || preferences.maxBudget || 350000);
  const [otherDebts, setOtherDebts] = useState<number>(150000);

  const analysis = AffordabilityCalculator.analyze(income, rent);

  const totalMonthlyCommitment = rent + otherDebts;
  const netRemaining = income - totalMonthlyCommitment;
  const totalCommitmentRatio = income > 0 ? ((totalMonthlyCommitment / income) * 100).toFixed(1) : '0';

  const applyBudgetToPreferences = () => {
    updatePreferences({
      monthlyIncome: income,
      maxBudget: analysis.maxRecommendedRent
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto">
      <div
        className="animate-pop bg-white rounded-3xl max-w-xl w-full w-full border border-stone-200 overflow-hidden my-6 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="palette-light topo p-5 sm:p-6 bg-tea-700 text-white flex items-center justify-between border-b border-tea-600">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-tea-600/30 border border-tea-500/40 flex items-center justify-center text-tea-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Rent Affordability</h2>
              <p className="text-xs text-stone-400">Find your optimal monthly budget</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-tea-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto text-ink-800">
          
          {/* Inputs */}
          <div className="space-y-4">
            
            {/* Monthly Income Slider */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-700">
                <span>Monthly Income</span>
                <span className="font-mono text-tea-600 text-base font-bold">
                  {income.toLocaleString()} RWF
                </span>
              </div>
              <input
                type="range"
                min="200000"
                max="4000000"
                step="50000"
                value={income}
                onChange={e => setIncome(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-tea-600"
              />
              <div className="flex justify-between text-[10px] text-stone-600 font-mono">
                <span>200k</span>
                <span>2M</span>
                <span>4M</span>
              </div>
            </div>

            {/* Target Rent Slider */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-700">
                <span>Target Rent</span>
                <span className="font-mono text-tea-600 text-base font-bold">
                  {rent.toLocaleString()} RWF
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="25000"
                value={rent}
                onChange={e => setRent(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-tea-600"
              />
              <div className="flex justify-between text-[10px] text-stone-600 font-mono">
                <span>100k</span>
                <span>1M</span>
                <span>2M</span>
              </div>
            </div>

            {/* Other fixed monthly expenses */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-700">
                <span>Other Expenses</span>
                <span className="font-mono text-ink-700 text-sm font-bold">
                  {otherDebts.toLocaleString()} RWF
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="25000"
                value={otherDebts}
                onChange={e => setOtherDebts(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-tea-600"
              />
            </div>

          </div>

          {/* Results Visualizer Card */}
          <div className={`p-5 rounded-lg border transition-all ${
            analysis.status === 'SAFE'
              ? 'bg-tea-50 border-tea-300 text-tea-950'
              : analysis.status === 'MODERATE'
              ? 'bg-saffron-50 border-saffron-300 text-saffron-950'
              : 'bg-saffron-50 border-saffron-300 text-saffron-950'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className={`w-5 h-5 ${analysis.status === 'SAFE' ? 'text-tea-600' : 'text-tea-600'}`} />
                <span>Affordability Status:</span>
              </div>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${
                analysis.status === 'SAFE'
                  ? 'bg-tea-600 text-white'
                  : analysis.status === 'MODERATE'
                  ? 'bg-tea-600 text-white'
                  : 'bg-tea-500 text-ink-900'
              }`}>
                {analysis.status}
              </span>
            </div>

            <p className="text-xs leading-relaxed mb-4">
              {analysis.adviceMessage}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-300/60 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-700 block">Rent / Income</span>
                <strong className="text-base font-bold font-mono">{analysis.rentToIncomeRatioPercentage}%</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-700 block">Safe Max (30%)</span>
                <strong className="text-base font-bold font-mono">{analysis.maxRecommendedRent.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-700 block">Net Surplus</span>
                <strong className={`text-base font-bold font-mono ${netRemaining >= 0 ? 'text-tea-700' : 'text-tea-600'}`}>
                  {netRemaining.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-100 rounded-lg text-[11px] text-stone-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
            <span>This is an educational tool for budgeting guidance only.</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900"
          >
            Close
          </button>

          <button
            onClick={applyBudgetToPreferences}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold bg-tea-600 hover:bg-tea-700 text-white transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sync Budget</span>
          </button>
        </div>

      </div>
    </div>
  );
};
