import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, Zap, DollarSign, Target, Activity } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const ProgressTracker = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [readings, setReadings] = useState([]);
  const [currentReading, setCurrentReading] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // For demo, we'll use a hardcoded account number
      const response = await fetch(`${API_BASE}/analysis/plans/account/123456789`);
      const data = await response.json();
      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlan(data.plans[0]);
        fetchReadings(data.plans[0].id);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchReadings = async (planId) => {
    try {
      const response = await fetch(`${API_BASE}/analysis/readings/plan/${planId}`);
      const data = await response.json();
      if (data.success) {
        setReadings(data.readings);
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  const submitReading = async () => {
    if (!currentReading || !selectedPlan) return;

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
        setCurrentReading('');
        setNotes('');
        alert('✅ Reading recorded successfully!');
      }
    } catch (error) {
      console.error('Error submitting reading:', error);
      alert('❌ Failed to submit reading');
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

      {/* Plan Selection */}
      {plans.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-white font-medium mb-2">Active Budget Plan</label>
          <select
            value={selectedPlan?.id || ''}
            onChange={(e) => {
              const plan = plans.find(p => p.id === parseInt(e.target.value));
              setSelectedPlan(plan);
              if (plan) fetchReadings(plan.id);
            }}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                Budget: Rs. {plan.target_budget} | Days: {plan.planning_days} | Status: {plan.progress_status}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlan && (
        <>
          {/* Current Plan Status */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-indigo-200" />
                <span className="text-indigo-200 text-sm">Target Budget</span>
              </div>
              <p className="text-3xl font-bold text-white">Rs. {selectedPlan.target_budget}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-200" />
                <span className="text-blue-200 text-sm">Daily Target</span>
              </div>
              <p className="text-3xl font-bold text-white">{selectedPlan.target_daily_units.toFixed(1)} <span className="text-lg">kWh</span></p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-200" />
                <span className="text-purple-200 text-sm">Planning Days</span>
              </div>
              <p className="text-3xl font-bold text-white">{selectedPlan.planning_days} <span className="text-lg">days</span></p>
            </div>

            <div className={`rounded-lg p-5 shadow-xl border-2 ${getStatusColor(selectedPlan.progress_status)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(selectedPlan.progress_status)}
                <span className="text-sm font-medium uppercase">{selectedPlan.progress_status.replace('_', ' ')}</span>
              </div>
              <p className="text-2xl font-bold">{readings.length} Readings</p>
            </div>
          </div>

          {/* Add New Reading */}
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
                  placeholder="e.g., 1240"
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
                  placeholder="e.g., Day 10 check"
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
                {/* Current Status */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-indigo-300 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Current Status
                  </h4>
                  
                  <div className="space-y-3">
                    <ProgressItem
                      label="Days Elapsed"
                      value={`${progress.current_status.days_elapsed} / ${selectedPlan.planning_days}`}
                      color="blue"
                    />
                    <ProgressItem
                      label="Days Remaining"
                      value={progress.current_status.days_remaining}
                      color="purple"
                    />
                    <ProgressItem
                      label="Units Used"
                      value={`${progress.current_status.units_used} kWh`}
                      color="yellow"
                    />
                    <ProgressItem
                      label="Actual Cost"
                      value={`Rs. ${progress.current_status.actual_cost.toFixed(2)}`}
                      color="green"
                    />
                    <ProgressItem
                      label="Expected Cost"
                      value={`Rs. ${progress.current_status.expected_cost.toFixed(2)}`}
                      color="gray"
                    />
                    <ProgressItem
                      label="Variance"
                      value={`Rs. ${progress.current_status.variance_cost.toFixed(2)}`}
                      color={progress.current_status.variance_cost < 0 ? 'green' : 'red'}
                      highlight
                    />
                  </div>
                </div>

                {/* Projection */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-green-300 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Projection
                  </h4>
                  
                  <div className="space-y-3">
                    <ProgressItem
                      label="Projected Total Units"
                      value={`${progress.projection.projected_total_units.toFixed(1)} kWh`}
                      color="blue"
                    />
                    <ProgressItem
                      label="Projected Total Cost"
                      value={`Rs. ${progress.projection.projected_total_cost.toFixed(2)}`}
                      color="purple"
                      highlight
                    />
                    <ProgressItem
                      label="Target Budget"
                      value={`Rs. ${progress.projection.target_budget.toFixed(2)}`}
                      color="gray"
                    />
                    <ProgressItem
                      label="Budget Variance"
                      value={`Rs. ${progress.projection.budget_variance.toFixed(2)}`}
                      color={progress.projection.budget_variance < 0 ? 'green' : 'red'}
                      highlight
                    />
                  </div>

                  {/* Status Badge */}
                  <div className={`mt-4 rounded-lg p-4 border-2 ${getStatusColor(progress.current_status.status)}`}>
                    <div className="flex items-center gap-2 justify-center">
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
                  Recommendations
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

          {/* Readings History Chart */}
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
                  <XAxis 
                    dataKey="days_elapsed" 
                    stroke="#9CA3AF"
                    label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis stroke="#9CA3AF" label={{ value: 'Rs.', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="actual_cost" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    name="Actual Cost"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expected_cost" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorExpected)" 
                    name="Expected Cost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Readings Table */}
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
                      <th className="py-3 px-4 text-gray-300 font-semibold">Units</th>
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
                        <td className="py-3 px-4 text-green-400">Rs. {reading.actual_cost.toFixed(2)}</td>
                        <td className={`py-3 px-4 font-semibold ${reading.variance_cost < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {reading.variance_cost < 0 ? '↓' : '↑'} Rs. {Math.abs(reading.variance_cost).toFixed(2)}
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

      {!selectedPlan && plans.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Budget Plan</h3>
          <p className="text-gray-400 mb-6">Create a budget plan first to start tracking your progress</p>
          <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
            Create Budget Plan
          </button>
        </div>
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