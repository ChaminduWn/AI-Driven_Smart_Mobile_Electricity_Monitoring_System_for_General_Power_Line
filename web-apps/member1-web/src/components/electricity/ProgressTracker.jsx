import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, Zap, DollarSign, Target, Activity, AlertCircle, User, Trash2, Edit2, Download, Share2, Bell } from 'lucide-react';

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
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [editingReading, setEditingReading] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [motivationalTip, setMotivationalTip] = useState('');
  const [readingStats, setReadingStats] = useState({ count: 0, minRequired: 4, maxAllowed: 8 });
  const [manualStartReading, setManualStartReading] = useState('');
  const [savingManualReading, setSavingManualReading] = useState(false);

  useEffect(() => {
    fetchAvailableAccounts();
  }, []);

  const fetchAvailableAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE}/bills`);
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        const accounts = [...new Set(data.data.map(bill => bill.account_number).filter(Boolean))];
        setAvailableAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0]);
          fetchPlansForAccount(accounts[0]);
        }
      } else {
        setError('No bills found. Please upload a bill first in the Dashboard.');
      }
    } catch (err) {
      setError('Failed to load accounts. Is the backend running?');
    }
  };

  const fetchPlansForAccount = async (accountNumber) => {
    if (!accountNumber) return;
    try {
      const response = await fetch(`${API_BASE}/analysis/plans/account/${accountNumber}?active_only=false`);
      const data = await response.json();
      if (data.success && data.plans?.length > 0) {
        setPlans(data.plans);
        const latestPlan = data.plans[0];
        setSelectedPlan(latestPlan);
        fetchReadings(latestPlan.id);
        fetchNotifications(accountNumber); // Optional – may fail due to CORS
        fetchBudgetAlerts(latestPlan.id); // Optional – may 404
        setError(null);
      } else {
        setPlans([]);
        setSelectedPlan(null);
        setReadings([]);
        setError('No budget plan found. Create one in the Budget Planner tab.');
      }
    } catch (err) {
      setError('Failed to load plans.');
    }
  };

  const handleAccountChange = (e) => {
    const account = e.target.value;
    setSelectedAccount(account);
    setProgress(null);
    setReadings([]);
    setMotivationalTip('');
    fetchPlansForAccount(account);
  };

  const fetchReadings = async (planId) => {
    try {
      const response = await fetch(`${API_BASE}/analysis/readings/plan/${planId}`);
      const data = await response.json();
      if (data.success) {
        const readingsList = data.readings || [];
        setReadings(readingsList);
        setReadingStats({
          count: readingsList.length,
          minRequired: 4,
          maxAllowed: 8
        });
        updateMotivationalTip(readingsList);
        // Show current progress from latest reading so the block is visible without submitting
        if (readingsList.length > 0) {
          const last = readingsList[readingsList.length - 1];
          setProgress({
            current_cost: last.actual_cost,
            days_elapsed: last.days_elapsed,
            status: last.status,
            projected_cost: last.projected_total_cost
          });
        }
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
    }
  };

  // Optional: Notifications (may fail due to CORS)
  const fetchNotifications = async (accountNumber) => {
    try {
      const response = await fetch(`${API_BASE}/analysis/notifications/${accountNumber}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.alerts || []);
      }
    } catch (err) {
      // Silently ignore CORS or network errors
      setNotifications([]);
    }
  };

  // Optional: Budget alerts (may 404)
  const fetchBudgetAlerts = async (planId) => {
    try {
      const response = await fetch(`${API_BASE}/analysis/plans/${planId}/alerts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) setBudgetAlerts(data.alerts || []);
      }
    } catch (err) {
      setBudgetAlerts([]);
    }
  };

  const handlePlanChange = (e) => {
    const planId = parseInt(e.target.value);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      fetchReadings(plan.id);
      fetchBudgetAlerts(plan.id);
      setProgress(null);
    }
  };

  const submitReading = async () => {
    if (!currentReading || !selectedPlan) return alert('Enter a valid reading');
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/analysis/track-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          current_reading: parseInt(currentReading),
          reading_date: readingDate,
          notes: notes
        })
      });
      const data = await response.json();
      if (data.success) {
        // Map backend shape (current_status, projection) to flat UI shape
        const p = data.progress;
        setProgress({
          current_cost: p?.current_status?.actual_cost,
          days_elapsed: p?.current_status?.days_elapsed,
          status: p?.current_status?.status,
          projected_cost: p?.projection?.projected_total_cost,
          weekly_status: p?.weekly_status,
          appliance_recommendations: p?.appliance_recommendations || [],
        });
        fetchReadings(selectedPlan.id);
        fetchBudgetAlerts(selectedPlan.id);
        setCurrentReading('');
        setNotes('');
        alert('✅ Reading saved!');
      } else {
        alert('❌ ' + (data.detail || data.message || 'Failed'));
      }
    } catch (err) {
      alert('❌ Network error');
    }
    setLoading(false);
  };

  const updateReading = async () => {
    if (!editingReading) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/analysis/readings/${editingReading.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading_value: parseInt(editingReading.reading_value),
          reading_date: editingReading.reading_date,
          notes: editingReading.notes || ''
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Updated!');
        setEditingReading(null);
        fetchReadings(selectedPlan.id);
      }
    } catch (err) {
      alert('❌ Failed to update');
    }
    setLoading(false);
  };

  const handleSaveStartReading = async () => {
    if (!manualStartReading || !selectedPlan?.reference_bill_id) return alert('Enter a valid reading');
    setSavingManualReading(true);
    try {
      const response = await fetch(`${API_BASE}/bills/${selectedPlan.reference_bill_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_reading: parseInt(manualStartReading)
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Start reading saved! You can now track progress.');
        fetchPlansForAccount(selectedAccount); // Refresh to get updated plan data
      } else {
        alert('❌ ' + (data.detail || 'Failed to save'));
      }
    } catch (err) {
      alert('❌ Failed');
    }
    setSavingManualReading(false);
  };

  const deleteReading = async (readingId) => {
    if (!confirm('Delete this reading?')) return;
    try {
      const response = await fetch(`${API_BASE}/analysis/readings/${readingId}`, { method: 'DELETE' });
      if (response.ok) {
        alert('✅ Deleted');
        fetchReadings(selectedPlan.id);
      }
    } catch (err) {
      alert('❌ Failed');
    }
  };

  const exportData = () => {
    if (readings.length === 0) return alert('No data to export');
    const headers = ['Date', 'Day', 'Reading', 'Units Used', 'Actual Cost', 'Variance', 'Status'];
    const rows = readings.map(r => [
      new Date(r.reading_date).toLocaleString(),
      r.days_elapsed,
      r.reading_value,
      r.units_consumed,
      r.actual_cost?.toFixed(2) || 'N/A',
      r.variance_cost?.toFixed(2) || 'N/A',
      r.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress_${selectedAccount}_${selectedPlan.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateMotivationalTip = (readingsList) => {
    if (readingsList.length === 0) {
      setMotivationalTip('');
      return;
    }
    const last = readingsList[readingsList.length - 1];
    const status = last.status;
    const tips = {
      on_track: 'Excellent! You’re perfectly on track. Keep going! 🌟',
      under_budget: 'Amazing! You’re saving money. Treat yourself! 🎉',
      over_budget: 'A bit over? Try turning off unused appliances tonight. 💡'
    };
    setMotivationalTip(tips[status] || 'Keep tracking for better control!');
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

  // Safe projection calculation
  const projectionData = (() => {
    if (!readings.length || !selectedPlan) return [];
    const lastReading = readings[readings.length - 1];
    const currentDay = lastReading.days_elapsed || 0;
    const remaining = selectedPlan.planning_days - currentDay;
    if (remaining <= 0) return [];

    const avgDailyUnits = readings.length > 0 ? readings.reduce((sum, r) => sum + (r.units_consumed || 0), 0) / readings.length : 0;
    const dailyCostRate = (selectedPlan.target_daily_units > 0) ? (selectedPlan.target_daily_cost / selectedPlan.target_daily_units) : 0;
    const actualCost = lastReading.actual_cost || 0;

    return Array.from({ length: Math.min(remaining, 30) }, (_, i) => {
      const projected = actualCost + ((i + 1) * avgDailyUnits * dailyCostRate);
      return {
        day: currentDay + i + 1,
        projectedCost: isFinite(projected) ? projected : actualCost
      };
    });
  })();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white flex items-center gap-4">
          <Activity className="w-10 h-10" />
          Advanced Progress Tracker
        </h2>
        <p className="text-indigo-100 text-xl mt-3">Track, analyze, and stay in control of your electricity budget</p>
      </div>

      {/* Account Selector */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <label className="block text-white font-medium mb-3 text-lg flex items-center gap-3">
          <User className="w-6 h-6 text-blue-400" />
          Select Account
        </label>
        <select
          value={selectedAccount}
          onChange={handleAccountChange}
          className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:ring-4 focus:ring-indigo-500"
        >
          <option value="">-- Choose Account --</option>
          {availableAccounts.map(acc => (
            <option key={acc} value={acc}>Account: {acc}</option>
          ))}
        </select>
      </div>

      {/* Global Error */}
      {error && !selectedPlan && (
        <div className="bg-red-900/30 border border-red-600 rounded-xl p-12 text-center">
          <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">{error}</h3>
        </div>
      )}

      {/* Optional Alerts */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-xl p-8 shadow-xl border-2 border-amber-600 animate-pulse">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
            <Bell className="w-9 h-9" />
            Reading Reminder
          </h3>
          <ul className="space-y-3">
            {notifications.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-amber-100">
                <CheckCircle className="w-6 h-6 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-bold">{a.message}</p>
                  <p className="text-sm">{a.purpose}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {budgetAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-xl p-8 shadow-xl border-2 border-red-600">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
            <AlertTriangle className="w-9 h-9" />
            Budget Alerts
          </h3>
          <ul className="space-y-3">
            {budgetAlerts.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-red-100">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold">{a.message}</p>
                  <p className="text-sm">{a.details}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plans.length > 1 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-white font-medium mb-3 text-lg">Select Plan</label>
          <select
            value={selectedPlan?.id || ''}
            onChange={handlePlanChange}
            className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg"
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                Rs. {p.target_budget} • {p.planning_days} days • {new Date(p.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlan && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<Target className="w-6 h-6" />} label="Target" value={`Rs. ${selectedPlan.target_budget?.toFixed(2) || 'N/A'}`} color="purple" />
            <StatCard icon={<Zap className="w-6 h-6" />} label="Daily Units" value={`${selectedPlan.target_daily_units?.toFixed(1) || 'N/A'} kWh`} color="blue" />
            <StatCard icon={<DollarSign className="w-6 h-6" />} label="Daily Cost" value={`Rs. ${selectedPlan.target_daily_cost?.toFixed(2) || 'N/A'}`} color="green" />
            <StatCard icon={<Calendar className="w-6 h-6" />} label="Period" value={`${selectedPlan.planning_days} days`} color="teal" />
          </div>

          {/* Start point from latest bill / Manual Entry */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {selectedPlan.reference_bill_current_reading != null ? (
              <p className="text-gray-300 text-sm">
                Latest bill date:{" "}
                <span className="text-white font-semibold">
                  {selectedPlan.reference_bill_date
                    ? new Date(selectedPlan.reference_bill_date).toLocaleString()
                    : "N/A"}
                </span>{" "}
                • Start meter reading:{" "}
                <span className="text-white font-semibold">
                  {selectedPlan.reference_bill_current_reading}
                </span>
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                  <h4 className="font-bold text-lg">Missing Start Meter Reading</h4>
                </div>
                <p className="text-gray-400 text-sm">
                  We couldn't extract the meter reading from your last bill.
                  Please enter the <b>Current Reading</b> shown on your bill (or the reading at the start of this plan) to enable tracking.
                </p>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={manualStartReading}
                    onChange={e => setManualStartReading(e.target.value)}
                    placeholder="Enter Start Reading"
                    className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={handleSaveStartReading}
                    disabled={savingManualReading || !manualStartReading}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    {savingManualReading ? 'Saving...' : 'Save Reading'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Motivational Tip */}
          {motivationalTip && (
            <div className="bg-gradient-to-r from-teal-900 to-green-900 rounded-xl p-6 text-center text-white">
              <p className="text-xl font-semibold">{motivationalTip}</p>
            </div>
          )}

          {/* Record Reading */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-2xl border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">Record Reading</h3>
            <p className="text-gray-300 mb-4 text-sm">
              Readings for this plan:{" "}
              <span className="font-semibold text-blue-400">
                {readingStats.count}/{readingStats.maxAllowed}
              </span>{" "}
              (minimum {readingStats.minRequired} over the plan period, maximum {readingStats.maxAllowed}).
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Meter Reading</label>
                <input type="number" value={currentReading} onChange={e => setCurrentReading(e.target.value)} className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Date & Time</label>
                <input type="datetime-local" value={readingDate} onChange={e => setReadingDate(e.target.value)} className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white" />
              </div>
            </div>
            <button
              onClick={submitReading}
              disabled={loading || !currentReading || readingStats.count >= readingStats.maxAllowed}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Submit Reading'}
            </button>
          </div>

          {/* Progress Bar */}
          {progress && selectedPlan?.target_budget > 0 && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4">Current Progress</h3>
              <ProgressBar value={Math.min(((progress.current_cost || 0) / selectedPlan.target_budget) * 100, 100)} status={progress.status} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <ProgressItem label="Days Passed" value={progress.days_elapsed ?? '—'} color="blue" />
                <ProgressItem label="Remaining" value={selectedPlan.planning_days - (progress.days_elapsed ?? 0)} color="purple" />
                <ProgressItem label="Spent" value={`Rs. ${(progress.current_cost != null ? progress.current_cost : 0).toFixed(2)}`} color="green" />
                <ProgressItem label="Projected" value={progress.projected_cost != null ? `Rs. ${Number(progress.projected_cost).toFixed(2)}` : 'N/A'} color="yellow" />
              </div>

              {/* Weekly status and appliance-wise suggestions */}
              {progress.weekly_status && (
                <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-2">This Week</h4>
                  <p className="text-gray-300 text-sm">
                    Week {progress.weekly_status.week_number}: target cumulative units{" "}
                    <span className="font-semibold text-blue-400">
                      {progress.weekly_status.target_cumulative_units?.toFixed(1) ?? 'N/A'}
                    </span>{" "}
                    vs actual{" "}
                    <span className={`font-semibold ${progress.weekly_status.exceeded ? 'text-red-400' : 'text-green-400'}`}>
                      {progress.weekly_status.actual_units?.toFixed(1) ?? 'N/A'}
                    </span>
                  </p>
                  {progress.weekly_status.exceeded && (
                    <p className="text-red-300 text-sm mt-1">
                      You are above the target for this week. Consider reducing usage of the high-consumption appliances below.
                    </p>
                  )}
                </div>
              )}

              {progress.appliance_recommendations && progress.appliance_recommendations.length > 0 && (
                <div className="mt-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-2">AI Appliance Tips</h4>
                  <ul className="space-y-2 text-sm">
                    {progress.appliance_recommendations.map((rec) => (
                      <li key={rec.appliance_id} className="flex flex-col text-gray-200">
                        <span className="font-semibold">
                          {rec.appliance_name} {rec.category ? `(${rec.category})` : ''}
                        </span>
                        <span className="text-gray-400">
                          Uses ~{rec.monthly_kwh?.toFixed(1)} kWh/month. Suggest reducing usage by{" "}
                          {rec.suggested_reduction_percent}% to save about {rec.potential_saving_kwh?.toFixed(1)} kWh.
                        </span>
                        {rec.hint && <span className="text-gray-400 italic">{rec.hint}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* History Chart */}
          {readings.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Consumption Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={readings}>
                  <defs>
                    <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="days_elapsed" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Area type="monotone" dataKey="actual_cost" stroke="#3B82F6" fill="url(#actual)" name="Actual Cost" />
                  <Area type="monotone" dataKey="expected_cost" stroke="#10B981" fill="url(#expected)" name="Target Pace" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Projection Chart */}
          {projectionData.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Future Projection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="projectedCost" stroke="#F59E0B" strokeWidth={3} dot={false} name="Projected Total Cost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Readings Table */}
          {readings.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Reading History</h3>
                <button onClick={exportData} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">
                  <Download className="w-5 h-5" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-700">
                      <th className="py-4 px-6 text-gray-300">Date</th>
                      <th className="py-4 px-6 text-gray-300">Day</th>
                      <th className="py-4 px-6 text-gray-300">Reading</th>
                      <th className="py-4 px-6 text-gray-300">Units</th>
                      <th className="py-4 px-6 text-gray-300">Cost</th>
                      <th className="py-4 px-6 text-gray-300">Variance</th>
                      <th className="py-4 px-6 text-gray-300">Status</th>
                      <th className="py-4 px-6 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map(r => (
                      <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-4 px-6 text-gray-200">{new Date(r.reading_date).toLocaleString()}</td>
                        <td className="py-4 px-6 text-blue-400">{r.days_elapsed}</td>
                        <td className="py-4 px-6 text-white font-bold">{r.reading_value}</td>
                        <td className="py-4 px-6 text-yellow-400">{r.units_consumed || 0} kWh</td>
                        <td className="py-4 px-6 text-green-400">Rs. {r.actual_cost?.toFixed(2) || '0.00'}</td>
                        <td className={`py-4 px-6 font-bold ${(r.variance_cost || 0) < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(r.variance_cost || 0) < 0 ? '↓' : '↑'} Rs. {Math.abs(r.variance_cost || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(r.status)}`}>
                            {getStatusIcon(r.status)} {r.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="py-4 px-6 flex gap-3">
                          <button onClick={() => setEditingReading({ ...r })} className="text-blue-400 hover:text-blue-300">
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteReading(r.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingReading && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-600 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Edit Reading</h3>
                <div className="space-y-5">
                  <input type="number" value={editingReading.reading_value} onChange={e => setEditingReading({ ...editingReading, reading_value: e.target.value })} className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white" placeholder="Reading" />
                  <input type="datetime-local" value={editingReading.reading_date.slice(0, 16)} onChange={e => setEditingReading({ ...editingReading, reading_date: e.target.value })} className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white" />
                  <input type="text" value={editingReading.notes || ''} onChange={e => setEditingReading({ ...editingReading, notes: e.target.value })} className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white" placeholder="Notes" />
                </div>
                <div className="flex gap-4 mt-8">
                  <button onClick={updateReading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">Save</button>
                  <button onClick={() => setEditingReading(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = { blue: 'from-blue-600 to-blue-700', green: 'from-green-600 to-green-700', purple: 'from-purple-600 to-purple-700', teal: 'from-teal-600 to-teal-700' };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 shadow-xl`}>
      <div className="flex items-center justify-between mb-4">{icon}</div>
      <p className="text-white text-sm opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

const ProgressItem = ({ label, value, color }) => {
  const colors = { blue: 'text-blue-400', purple: 'text-purple-400', green: 'text-green-400', yellow: 'text-yellow-400' };
  return (
    <div className="bg-gray-700 rounded-lg p-4 text-center">
      <p className="text-gray-300 text-sm">{label}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
};

const ProgressBar = ({ value, status }) => {
  const color = status === 'on_track' ? 'bg-green-500' : status === 'under_budget' ? 'bg-blue-500' : 'bg-red-500';
  const num = Number(value);
  const pct = Number.isFinite(num) ? Math.min(100, Math.max(0, num)) : 0;
  return (
    <div className="relative w-full bg-gray-700 rounded-full h-8 overflow-hidden">
      <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-white font-bold">{pct.toFixed(1)}%</span>
    </div>
  );
};

export default ProgressTracker;