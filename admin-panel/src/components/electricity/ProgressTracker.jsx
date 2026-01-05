import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, Zap, DollarSign, Target, Activity, AlertCircle, User } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const ProgressTracker = () => {
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [readings, setReadings] = useState([]);
  const [currentReading, setCurrentReading] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableAccounts();
  }, []);

  const fetchAvailableAccounts = async () => {
    try {
      // Fetch all bills to get available account numbers
      const response = await fetch(`${API_BASE}/bills`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Get unique account numbers
        const accounts = [...new Set(data.data
          .map(bill => bill.account_number)
          .filter(acc => acc !== null && acc !== undefined)
        )];
        
        setAvailableAccounts(accounts);
        
        // Auto-select first account if available
        if (accounts.length > 0) {
          const firstAccount = accounts[0];
          setSelectedAccount(firstAccount);
          fetchPlansForAccount(firstAccount);
        }
      } else {
        setError('No bills found. Upload a bill first!');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load accounts. Check backend connection.');
    }
  };

  const fetchPlansForAccount = async (accountNumber) => {
    if (!accountNumber) return;
    
    try {
      const response = await fetch(`${API_BASE}/analysis/plans/account/${accountNumber}`);
      const data = await response.json();
      
      if (data.success && data.plans && data.plans.length > 0) {
        setPlans(data.plans);
        const firstPlan = data.plans[0];
        setSelectedPlan(firstPlan);
        fetchReadings(firstPlan.id);
        fetchNotifications(accountNumber);
        setError(null);
      } else {
        setPlans([]);
        setSelectedPlan(null);
        setReadings([]);
        setError(`No budget plan found for account ${accountNumber}. Create a plan first!`);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load budget plans.');
    }
  };

  const handleAccountChange = (e) => {
    const account = e.target.value;
    setSelectedAccount(account);
    setProgress(null); // Reset progress when changing accounts
    fetchPlansForAccount(account);
  };

  const fetchReadings = async (planId) => {
    try {
      const response = await fetch(`${API_BASE}/analysis/readings/plan/${planId}`);
      const data = await response.json();
      if (data.success) {
        setReadings(data.readings || []);
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  const fetchNotifications = async (accountNumber) => {
    try {
      const response = await fetch(`${API_BASE}/analysis/notifications/${accountNumber}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.alerts || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const handlePlanChange = (e) => {
    const planId = parseInt(e.target.value);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      fetchReadings(plan.id);
      setProgress(null);
    }
  };

  const submitReading = async () => {
    if (!currentReading || !selectedPlan) {
      alert('Please enter a meter reading');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/analysis/track-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          current_reading: parseInt(currentReading),
          reading_date: readingDate,
          notes: notes
        })
      });

      const data = await response.json();
      if (data.success) {
        setProgress(data.progress);
        fetchReadings(selectedPlan.id);
        fetchNotifications(selectedAccount);
        setCurrentReading('');
        setNotes('');
        alert('✅ Reading recorded successfully!');
      } else {
        alert('❌ ' + (data.detail || data.message || 'Failed to submit reading'));
      }
    } catch (error) {
      console.error('Error submitting reading:', error);
      alert('❌ Failed to submit reading. Check console for details.');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track': return 'text-green-400 bg-green-900/30 border-green-500';
      case 'under_budget': return 'text-blue-400 bg-blue-900/30 border-blue-500';
      case 'over_budget': return 'text-red-400 bg-red-900/30 border-red-500';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on_track': return <CheckCircle className="w-5 h-5" />;
      case 'under_budget': return <TrendingDown className="w-5 h-5" />;
      case 'over_budget': return <AlertTriangle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-8 h-8" />
          Progress Tracker
        </h2>
        <p className="text-indigo-100 mt-2">Monitor your daily electricity consumption against your budget plan</p>
      </div>

      {/* Account Selector */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <label className="block text-white font-medium mb-2 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          Select Account Number
        </label>
        <select
          value={selectedAccount}
          onChange={handleAccountChange}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">-- Select an account --</option>
          {availableAccounts.map(account => (
            <option key={account} value={account}>
              Account: {account}
            </option>
          ))}
        </select>
        {availableAccounts.length === 0 && (
          <p className="text-gray-400 text-sm mt-2">No accounts found. Upload bills first.</p>
        )}
      </div>

      {/* Error State */}
      {error && !selectedPlan && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{error}</h3>
          <p className="text-gray-400 mb-6">
            {error.includes('plan') 
              ? 'Go to the Budget Planner tab to create a budget plan for this account.'
              : 'Go to the Dashboard to upload your electricity bill.'}
          </p>
        </div>
      )}

      {/* Due Checkpoint Reminders */}
      {notifications.length > 0 && selectedPlan && (
        <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-xl p-6 shadow-xl border border-amber-700 animate-pulse">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <AlertCircle className="w-7 h-7" />
            Reminder: Meter Reading Due Today!
          </h3>
          <ul className="space-y-2">
            {notifications.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-100">
                <CheckCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{alert.message}</span>
                  <p className="text-sm text-gray-300 mt-1">{alert.purpose}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-amber-200 text-sm">
            💡 Tip: Enter your current meter reading below to stay on track!
          </p>
        </div>
      )}

      {/* Plan Selection (if multiple plans for same account) */}
      {plans.length > 1 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-white font-medium mb-2">Select Budget Plan</label>
          <select
            value={selectedPlan?.id || ''}
            onChange={handlePlanChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                Budget: Rs. {plan.target_budget} | Days: {plan.planning_days} | Created: {new Date(plan.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlan && (
        <>
          {/* Current Plan Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-indigo-200" />
                <span className="text-indigo-200 text-sm">Target Budget</span>
              </div>
              <p className="text-3xl font-bold text-white">Rs. {selectedPlan.target_budget}</p>
              <p className="text-indigo-200 text-xs mt-1">Account: {selectedAccount}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-200" />
                <span className="text-blue-200 text-sm">Daily Target</span>
              </div>
              <p className="text-3xl font-bold text-white">{selectedPlan.target_daily_units?.toFixed(1)} <span className="text-lg">kWh</span></p>
              <p className="text-blue-200 text-xs mt-1">Rs. {selectedPlan.target_daily_cost?.toFixed(2)}/day</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-200" />
                <span className="text-purple-200 text-sm">Planning Period</span>
              </div>
              <p className="text-3xl font-bold text-white">{selectedPlan.planning_days} <span className="text-lg">days</span></p>
              <p className="text-purple-200 text-xs mt-1">Started: {new Date(selectedPlan.plan_start_date).toLocaleDateString()}</p>
            </div>

            <div className={`rounded-lg p-5 shadow-xl border-2 ${getStatusColor(selectedPlan.current_progress_status || selectedPlan.progress_status || 'on_track')}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(selectedPlan.current_progress_status || selectedPlan.progress_status || 'on_track')}
                <span className="text-sm font-medium uppercase">
                  {(selectedPlan.current_progress_status || selectedPlan.progress_status || 'on_track').replace('_', ' ')}
                </span>
              </div>
              <p className="text-2xl font-bold">{readings.length} Readings</p>
            </div>
          </div>

          {/* Record New Reading */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Record Meter Reading
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Current Meter Reading</label>
                <input
                  type="number"
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value)}
                  placeholder="e.g., 45621"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Reading Date & Time</label>
                <input
                  type="datetime-local"
                  value={readingDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Day 7 checkpoint"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={submitReading}
              disabled={loading || !currentReading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Reading
                </>
              )}
            </button>
          </div>

          {/* Latest Progress Result */}
          {progress && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border-2 border-indigo-500">
              <h3 className="text-xl font-semibold text-white mb-4">Latest Progress Check</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-indigo-300 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Current Status
                  </h4>
                  <div className="space-y-3">
                    <ProgressItem label="Days Elapsed" value={`${progress.current_status.days_elapsed} / ${selectedPlan.planning_days}`} color="blue" />
                    <ProgressItem label="Days Remaining" value={progress.current_status.days_remaining} color="purple" />
                    <ProgressItem label="Units Used" value={`${progress.current_status.units_used} kWh`} color="yellow" />
                    <ProgressItem label="Actual Cost" value={`Rs. ${progress.current_status.actual_cost.toFixed(2)}`} color="green" />
                    <ProgressItem label="Expected Cost" value={`Rs. ${progress.current_status.expected_cost.toFixed(2)}`} color="gray" />
                    <ProgressItem
                      label="Variance"
                      value={`Rs. ${Math.abs(progress.current_status.variance_cost).toFixed(2)} ${progress.current_status.variance_cost < 0 ? 'under' : 'over'}`}
                      color={progress.current_status.variance_cost < 0 ? 'green' : 'red'}
                      highlight
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-green-300 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    End-of-Period Projection
                  </h4>
                  <div className="space-y-3">
                    <ProgressItem label="Projected Total Units" value={`${progress.projection.projected_total_units.toFixed(1)} kWh`} color="blue" />
                    <ProgressItem
                      label="Projected Total Cost"
                      value={`Rs. ${progress.projection.projected_total_cost.toFixed(2)}`}
                      color="purple"
                      highlight
                    />
                    <ProgressItem label="Target Budget" value={`Rs. ${progress.projection.target_budget.toFixed(2)}`} color="gray" />
                    <ProgressItem
                      label="Projected Variance"
                      value={`Rs. ${Math.abs(progress.projection.budget_variance).toFixed(2)} ${progress.projection.budget_variance < 0 ? 'under' : 'over'}`}
                      color={progress.projection.budget_variance < 0 ? 'green' : 'red'}
                      highlight
                    />
                  </div>

                  <div className={`mt-6 rounded-lg p-4 border-2 ${getStatusColor(progress.current_status.status)}`}>
                    <div className="flex items-center gap-3 justify-center">
                      {getStatusIcon(progress.current_status.status)}
                      <span className="font-bold text-lg uppercase">{progress.current_status.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-lg p-5 border border-amber-600">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Smart Recommendations
                </h4>
                <ul className="space-y-2">
                  {progress.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-200">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Consumption History Chart */}
          {readings.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Consumption History</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={readings}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="days_elapsed" stroke="#9CA3AF" label={{ value: 'Days Elapsed', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#9CA3AF" label={{ value: 'Cost (Rs.)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }} />
                  <Legend />
                  <Area type="monotone" dataKey="actual_cost" stroke="#3B82F6" fillOpacity={1} fill="url(#colorActual)" name="Actual Cost" />
                  <Area type="monotone" dataKey="expected_cost" stroke="#10B981" fillOpacity={1} fill="url(#colorExpected)" name="Expected Cost" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Reading History Table */}
          {readings.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Reading History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-700">
                      <th className="py-3 px-4 text-gray-300 font-semibold">Date</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Day</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Reading</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Units Used</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Actual Cost</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Variance</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading, idx) => (
                      <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                        <td className="py-3 px-4 text-gray-200">{new Date(reading.reading_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">{reading.days_elapsed}</td>
                        <td className="py-3 px-4 text-white">{reading.reading_value}</td>
                        <td className="py-3 px-4 text-yellow-400">{reading.units_consumed} kWh</td>
                        <td className="py-3 px-4 text-green-400">Rs. {reading.actual_cost?.toFixed(2)}</td>
                        <td className={`py-3 px-4 font-semibold ${reading.variance_cost < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {reading.variance_cost < 0 ? '↓' : '↑'} Rs. {Math.abs(reading.variance_cost || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reading.status)}`}>
                            {reading.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ProgressItem = ({ label, value, color, highlight }) => {
  const colors = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    gray: 'text-gray-400'
  };

  return (
    <div className={`flex justify-between items-center ${highlight ? 'bg-gray-700 p-3 rounded-lg' : 'p-2'}`}>
      <span className="text-gray-300 text-sm">{label}</span>
      <span className={`font-bold text-lg ${colors[color]}`}>{value}</span>
    </div>
  );
};

export default ProgressTracker;