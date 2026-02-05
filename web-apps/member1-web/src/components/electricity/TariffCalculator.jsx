import React, { useState } from 'react';
import { Calculator, Zap, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const TariffCalculator = () => {
  const [calcUnits, setCalcUnits] = useState(100);
  const [calcDays, setCalcDays] = useState(30);
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculateTariff = async () => {
    setCalculating(true);
    try {
      const response = await fetch(
        `${API_BASE}/analysis/tariff-calculator?units=${calcUnits}&days=${calcDays}`
      );
      if (!response.ok) throw new Error('Failed to calculate tariff');
      const data = await response.json();
      if (data.success) {
        setCalcResult(data.calculation);
      }
    } catch (error) {
      console.error('Error calculating tariff:', error);
      alert('Failed to calculate tariff. Please check if the backend is running.');
    }
    setCalculating(false);
  };

  const getThresholdInfo = () => {
    if (!calcResult) return null;
    
    const normalizedUnits = calcUnits;
    const threshold = 60;
    
    if (normalizedUnits <= threshold) {
      const remaining = threshold - normalizedUnits;
      return {
        type: 'below',
        message: `You're ${remaining} kWh below the 60 kWh threshold. Great job!`,
        icon: <TrendingDown className="w-5 h-5 text-green-400" />,
        color: 'from-green-600 to-green-700'
      };
    } else {
      const excess = normalizedUnits - threshold;
      return {
        type: 'above',
        message: `You exceeded the 60 kWh threshold by ${excess} kWh. Higher rates apply.`,
        icon: <TrendingUp className="w-5 h-5 text-orange-400" />,
        color: 'from-orange-600 to-orange-700'
      };
    }
  };

  const thresholdInfo = getThresholdInfo();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 shadow-xl border border-indigo-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-700 p-3 rounded-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">CEB Tariff Calculator</h2>
            <p className="text-indigo-200 text-sm">Official rates - October 2025</p>
          </div>
        </div>
        
        <p className="text-indigo-200 mb-6">
          Calculate your electricity bill based on consumption. Get detailed breakdown of charges and tariff slabs.
        </p>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-white mb-2 font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Units Consumed (kWh)
            </label>
            <input
              type="number"
              value={calcUnits}
              onChange={(e) => setCalcUnits(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter units (e.g., 100)"
            />
            <p className="text-indigo-300 text-sm mt-2">💡 Typical household: 60-300 kWh/month</p>
          </div>
          <div>
            <label className="block text-white mb-2 font-medium flex items-center gap-2">
              📅 Billing Period (Days)
            </label>
            <select
              value={calcDays}
              onChange={(e) => setCalcDays(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {[28, 29, 30, 31, 32, 33, 34, 35].map(d => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
            <p className="text-indigo-300 text-sm mt-2">📆 Standard billing cycle: 28-35 days</p>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateTariff}
          disabled={calculating || calcUnits <= 0}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
        >
          {calculating ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-6 h-6" />
              Calculate Bill
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {calcResult && (
        <div className="space-y-6">
          {/* Threshold Alert */}
          {thresholdInfo && (
            <div className={`bg-gradient-to-r ${thresholdInfo.color} rounded-xl p-5 shadow-xl border border-opacity-30`}>
              <div className="flex items-center gap-3">
                {thresholdInfo.icon}
                <p className="text-white font-medium">{thresholdInfo.message}</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 opacity-80" />
                <p className="text-sm opacity-90 font-medium">Energy Charge</p>
              </div>
              <p className="text-3xl font-bold">Rs. {calcResult.energy_charge.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-1">Based on consumption slabs</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 opacity-80" />
                <p className="text-sm opacity-90 font-medium">Fixed Charge</p>
              </div>
              <p className="text-3xl font-bold">Rs. {calcResult.fixed_charge.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-1">Monthly service charge</p>
            </div>

            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg opacity-80">📊</span>
                <p className="text-sm opacity-90 font-medium">SSCL Tax (2.565%)</p>
              </div>
              <p className="text-3xl font-bold">Rs. {calcResult.sscl.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-1">Social Security Levy</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white shadow-xl border-2 border-green-400">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💰</span>
                <p className="text-sm opacity-90 font-medium">Total Bill</p>
              </div>
              <p className="text-3xl font-bold">Rs. {calcResult.total.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-1">Amount payable</p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📋 Calculation Details
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Category</p>
                <p className="text-white font-semibold text-lg">{calcResult.category_name}</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Units Consumed</p>
                <p className="text-blue-400 font-semibold text-lg">{calcResult.units_consumed} kWh</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Billing Period</p>
                <p className="text-purple-400 font-semibold text-lg">{calcResult.billing_days} days</p>
              </div>
            </div>

            {/* Slab Breakdown Table */}
            <div className="mb-6">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Slab-wise Consumption Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-700">
                      <th className="py-3 px-4 text-gray-300 font-semibold">Block (kWh)</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Rate (Rs./kWh)</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Units Used</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcResult.breakdown.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{item.block}</td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">Rs. {item.rate.toFixed(2)}</td>
                        <td className="py-3 px-4 text-purple-400 font-semibold">{item.units} kWh</td>
                        <td className="py-3 px-4 text-green-400 font-semibold">Rs. {item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-5 border border-blue-700/50">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
                <span>💵</span>
                Final Bill Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300 pb-2">
                  <span>Energy Charge:</span>
                  <span className="font-semibold">Rs. {calcResult.energy_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300 pb-2">
                  <span>Fixed Charge:</span>
                  <span className="font-semibold">Rs. {calcResult.fixed_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300 pb-3 border-b border-gray-600">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">Rs. {calcResult.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300 pb-3 border-b-2 border-gray-600">
                  <span>SSCL (2.565%):</span>
                  <span className="font-semibold">Rs. {calcResult.sscl.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-xl pt-2">
                  <span>Total Amount Payable:</span>
                  <span className="text-green-400">Rs. {calcResult.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-xl p-6 border border-amber-700 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Important Tariff Information
                </h4>
                <ul className="space-y-2 text-sm text-gray-200">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Rates based on CEB Domestic Tariff effective <strong>October 15, 2025</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Different tariff structures: <strong>0-60 kWh</strong> (Low Consumption) vs <strong>&gt;60 kWh</strong> (High Consumption)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Fixed charges vary based on your consumption block (ranges from Rs. 80 to Rs. 2,100)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>2.565% SSCL</strong> (Social Security Contribution Levy) applied to subtotal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Stay below 60 kWh threshold to benefit from lower rates and fixed charges</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-green-900 to-teal-900 rounded-xl p-6 border border-green-700 shadow-xl">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              💡 Money-Saving Tips
            </h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-lg">✓</span>
                <span>Keep consumption below 60 kWh for lower rates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-lg">✓</span>
                <span>Use energy-efficient appliances (LED bulbs, inverter ACs)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-lg">✓</span>
                <span>Unplug devices when not in use</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-lg">✓</span>
                <span>Schedule high-consumption tasks during off-peak hours</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!calcResult && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <Calculator className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            Enter your consumption details and click "Calculate Bill" to see the breakdown
          </p>
        </div>
      )}
    </div>
  );
};

export default TariffCalculator;