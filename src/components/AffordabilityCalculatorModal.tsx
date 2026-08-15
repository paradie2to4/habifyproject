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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-xl w-full shadow-xl border border-cream-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-sage-600/30 border border-sage-500/40 flex items-center justify-center text-sage-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Rent Affordability</h2>
              <p className="text-xs text-cream-400">Find your optimal monthly budget</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-cream-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto text-navy-800">
          
          {/* Inputs */}
          <div className="space-y-4">
            
            {/* Monthly Income Slider */}
            <div className="bg-cream-50 p-4 rounded-lg border border-cream-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-700">
                <span>Monthly Income</span>
                <span className="font-mono text-sage-600 text-base font-black">
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
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-sage-600"
              />
              <div className="flex justify-between text-[10px] text-cream-600 font-mono">
                <span>200k</span>
                <span>2M</span>
                <span>4M</span>
              </div>
            </div>

            {/* Target Rent Slider */}
            <div className="bg-cream-50 p-4 rounded-lg border border-cream-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-700">
                <span>Target Rent</span>
                <span className="font-mono text-terra-600 text-base font-black">
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
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-terra-600"
              />
              <div className="flex justify-between text-[10px] text-cream-600 font-mono">
                <span>100k</span>
                <span>1M</span>
                <span>2M</span>
              </div>
            </div>

            {/* Other fixed monthly expenses */}
            <div className="bg-cream-50 p-4 rounded-lg border border-cream-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-700">
                <span>Other Expenses</span>
                <span className="font-mono text-navy-700 text-sm font-bold">
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
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-navy-700"
              />
            </div>

          </div>

          {/* Results Visualizer Card */}
          <div className={`p-5 rounded-lg border transition-all ${
            analysis.status === 'SAFE'
              ? 'bg-sage-50 border-sage-300 text-sage-950'
              : analysis.status === 'MODERATE'
              ? 'bg-terra-50 border-terra-300 text-terra-950'
              : 'bg-terra-50 border-terra-300 text-terra-950'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className={`w-5 h-5 ${analysis.status === 'SAFE' ? 'text-sage-600' : 'text-terra-600'}`} />
                <span>Affordability Status:</span>
              </div>
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${
                analysis.status === 'SAFE'
                  ? 'bg-sage-600 text-white'
                  : analysis.status === 'MODERATE'
                  ? 'bg-terra-500 text-white'
                  : 'bg-terra-400 text-navy-900'
              }`}>
                {analysis.status}
              </span>
            </div>

            <p className="text-xs leading-relaxed mb-4">
              {analysis.adviceMessage}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-cream-300/60 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-cream-700 block">Rent / Income</span>
                <strong className="text-base font-black font-mono">{analysis.rentToIncomeRatioPercentage}%</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cream-700 block">Safe Max (30%)</span>
                <strong className="text-base font-black font-mono">{analysis.maxRecommendedRent.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cream-700 block">Net Surplus</span>
                <strong className={`text-base font-black font-mono ${netRemaining >= 0 ? 'text-sage-700' : 'text-terra-600'}`}>
                  {netRemaining.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-cream-100 rounded-lg text-[11px] text-cream-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-cream-600 flex-shrink-0 mt-0.5" />
            <span>This is an educational tool for budgeting guidance only.</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-cream-50 border-t border-cream-200 flex items-center justify-between">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-navy-600 hover:text-navy-900"
          >
            Close
          </button>

          <button
            onClick={applyBudgetToPreferences}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold bg-sage-600 hover:bg-sage-700 text-white transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sync Budget</span>
          </button>
        </div>

      </div>
    </div>
  );
};
