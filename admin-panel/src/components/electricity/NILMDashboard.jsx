import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Zap, TrendingUp, Activity, AlertCircle, CheckCircle, RefreshCw, Info, Plus, Trash2, Settings } from 'lucide-react';
import { MEMBER1_API_BASE } from '../../config/apiBases';

const API_BASE = MEMBER1_API_BASE;

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#06B6D4', '#10B981', '#F472B6'];

const NILMDashboard = () => {
  const [accountNumber, setAccountNumber] = useState('2109117907');
  const [disaggregation, setDisaggregation] = useState(null);
  const [accuracyReport, setAccuracyReport] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [setupStatus, setSetupStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (accountNumber) {
      checkSetup();
    }
  }, [accountNumber]);

  const checkSetup = async () => {
    try {
      const response = await fetch(`${API_BASE}/nilm/verify-setup/${accountNumber}`);
      const data = await response.json();
      setSetupStatus(data);
      
      if (data.is_ready) {
        fetchDisaggregation();
        fetchAccuracyReport();
        fetchHistoricalBreakdown();
      }
    } catch (err) {
      console.error('Setup check error:', err);
      setError('Cannot connect to backend. Make sure server is running on http://localhost:8000');
    }
  };

  const fetchDisaggregation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/nilm/disaggregate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setDisaggregation(data);
        setSuccess('Disaggregation completed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to disaggregate consumption');
        if (data.suggestion) {
          setError(data.message + '\n\nSuggestion: ' + data.suggestion);
        }
      }
    } catch (err) {
      console.error('Error fetching disaggregation:', err);
      setError('Backend connection error. Check if server is running and CORS is enabled.');
    }
    setLoading(false);
  };

  const fetchAccuracyReport = async () => {
    try {
      const response = await fetch(`${API_BASE}/nilm/accuracy-report/${accountNumber}`);
      const data = await response.json();
      if (data.success) {
        setAccuracyReport(data);
      }
    } catch (err) {
      console.error('Error fetching accuracy report:', err);
    }
  };

  const fetchHistoricalBreakdown = async () => {
    try {
      const response = await fetch(`${API_BASE}/nilm/historical-breakdown/${accountNumber}?days=30`);
      const data = await response.json();
      if (data.success) {
        setHistoricalData(data);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-600';
    if (confidence >= 0.6) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  const SetupTab = () => (
    <div className="space-y-6">
      {/* Setup Status Card */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          NILM System Setup Status
        </h3>

        {setupStatus ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className={`p-4 rounded-lg ${setupStatus.is_ready ? 'bg-green-900 border-green-700' : 'bg-yellow-900 border-yellow-700'} border`}>
              <div className="flex items-center gap-3">
                {setupStatus.is_ready ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                )}
                <div>
                  <p className="text-white font-bold text-lg">{setupStatus.status_message}</p>
                  <p className="text-gray-300 text-sm">Account: {setupStatus.account_number}</p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Appliances Registered</span>
                  {setupStatus.appliances_registered >= 3 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <p className="text-3xl font-bold text-white">{setupStatus.appliances_registered}</p>
                <p className="text-gray-400 text-sm mt-1">Minimum: 3 required</p>
              </div>

              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Bills Uploaded</span>
                  {setupStatus.bills_uploaded >= 1 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <p className="text-3xl font-bold text-white">{setupStatus.bills_uploaded}</p>
                <p className="text-gray-400 text-sm mt-1">Minimum: 1 required</p>
              </div>
            </div>

            {/* Issues */}
            {setupStatus.issues && setupStatus.issues.length > 0 && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
                <p className="text-red-100 font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Issues Found:
                </p>
                <ul className="space-y-1">
                  {setupStatus.issues.map((issue, idx) => (
                    <li key={idx} className="text-red-200 text-sm">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
              <p className="text-blue-100 font-semibold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Recommendations:
              </p>
              <ul className="space-y-2">
                {setupStatus.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-blue-200 text-sm flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            {setupStatus.is_ready && (
              <button
                onClick={() => {
                  setActiveTab('current');
                  fetchDisaggregation();
                }}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Start AI Disaggregation
              </button>
            )}

            {!setupStatus.is_ready && (
              <div className="flex gap-3">
                <button
                  onClick={() => window.open('/appliances', '_blank')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Appliances
                </button>
                <button
                  onClick={() => window.open('/bills', '_blank')}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Upload Bills
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Checking system status...</p>
          </div>
        )}
      </div>

      {/* What is NILM */}
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl p-6 border border-purple-700">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="w-6 h-6" />
          What is NILM Technology?
        </h3>
        <div className="space-y-3 text-purple-100">
          <p>
            <strong className="text-white">Non-Intrusive Load Monitoring (NILM)</strong> uses AI to break down your total 
            electricity consumption into individual appliances <strong>without installing any hardware</strong>.
          </p>
          <p>
            <strong className="text-white">How it works:</strong>
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">1.</span>
              <span><strong>Bayesian Inference:</strong> Uses probability theory to match power patterns with known appliance signatures</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">2.</span>
              <span><strong>Pattern Recognition:</strong> Identifies unique electrical signatures (e.g., AC has high power + long duration)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">3.</span>
              <span><strong>ML Clustering:</strong> Groups similar consumption patterns using K-means clustering</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">4.</span>
              <span><strong>User Data:</strong> Improves accuracy using YOUR registered appliances and usage patterns</span>
            </li>
          </ul>
          <p className="mt-3 text-sm bg-purple-950 bg-opacity-50 p-3 rounded">
            <strong>Accuracy:</strong> Typically 80-92% depending on the number of registered appliances and data quality. 
            More appliances = better accuracy!
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8" />
              AI Energy Disaggregation (NILM)
            </h2>
            <p className="text-cyan-100 mt-2">Non-Intrusive Load Monitoring - No Hardware Required</p>
          </div>
          <button
            onClick={() => {
              checkSetup();
              if (setupStatus?.is_ready) {
                fetchDisaggregation();
                fetchAccuracyReport();
                fetchHistoricalBreakdown();
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {/* Account Number Input */}
        <div className="max-w-md">
          <label className="block text-cyan-100 text-sm mb-2">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter account number"
            className="w-full px-4 py-2 bg-cyan-800 bg-opacity-50 border border-cyan-400 rounded-lg text-white placeholder-cyan-300 focus:ring-2 focus:ring-white focus:outline-none"
          />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-100 font-semibold mb-1">Error</p>
            <p className="text-red-200 text-sm whitespace-pre-line">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-100">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-900 bg-opacity-50 border border-green-600 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
          <p className="text-green-100">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-300 hover:text-green-100">
            ✕
          </button>
        </div>
      )}

      {/* Accuracy Report */}
      {accuracyReport && activeTab !== 'setup' && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            AI Accuracy Report
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4">
              <p className="text-green-100 text-sm mb-1">Estimated Accuracy</p>
              <p className="text-3xl font-bold text-white">{accuracyReport.estimated_accuracy}%</p>
              <p className="text-green-200 text-xs mt-1">{accuracyReport.confidence_level.toUpperCase()}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-1">Registered Appliances</p>
              <p className="text-3xl font-bold text-white">{accuracyReport.registered_appliances}</p>
              <p className="text-blue-200 text-xs mt-1">{accuracyReport.total_registered_power_w}W Total</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4">
              <p className="text-purple-100 text-sm mb-1">Method</p>
              <p className="text-lg font-bold text-white">Bayesian + ML</p>
              <p className="text-purple-200 text-xs mt-1">Hybrid Approach</p>
            </div>
          </div>

          {accuracyReport.coverage_factors && accuracyReport.coverage_factors.length > 0 && (
            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-4">
              <p className="text-blue-100 text-sm font-semibold mb-2">Coverage Factors:</p>
              <ul className="space-y-1">
                {accuracyReport.coverage_factors.map((factor, idx) => (
                  <li key={idx} className="text-blue-200 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-750 rounded-lg p-4">
            <p className="text-gray-400 text-sm font-semibold mb-2">Recommendations:</p>
            <ul className="space-y-1">
              {accuracyReport.recommendations.map((rec, idx) => (
                <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'setup'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Setup & Info
        </button>
        <button
          onClick={() => setActiveTab('current')}
          disabled={!setupStatus?.is_ready}
          className={`flex-1 py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'current'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Current Breakdown
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          disabled={!setupStatus?.is_ready}
          className={`flex-1 py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'historical'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Historical Analysis
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'setup' && <SetupTab />}

      {/* Current Breakdown Tab */}
      {activeTab === 'current' && disaggregation && disaggregation.data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4">
              <p className="text-purple-100 text-sm mb-1">Total Consumption</p>
              <p className="text-3xl font-bold text-white">
                {disaggregation.data.total_kwh} <span className="text-lg">kWh</span>
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4">
              <p className="text-green-100 text-sm mb-1">Accounted</p>
              <p className="text-3xl font-bold text-white">
                {disaggregation.data.accounted_percentage}%
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4">
              <p className="text-blue-100 text-sm mb-1">AI Accuracy</p>
              <p className="text-3xl font-bold text-white">
                {disaggregation.accuracy.overall_accuracy}%
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-4">
              <p className="text-pink-100 text-sm mb-1">Confidence</p>
              <p className="text-3xl font-bold text-white">
                {disaggregation.accuracy.confidence_level.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Consumption Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={disaggregation.data.breakdown}
                    dataKey="estimated_kwh"
                    nameKey="appliance_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.appliance_name}: ${entry.percentage}%`}
                  >
                    {disaggregation.data.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Appliance Consumption</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={disaggregation.data.breakdown.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="appliance_name" 
                    stroke="#9CA3AF" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px' 
                    }}
                  />
                  <Bar dataKey="estimated_kwh" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-700">
                    <th className="py-3 px-4 text-gray-300 font-semibold">Appliance</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold">Category</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold">Estimated kWh</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold">Percentage</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold">Est. Hours</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {disaggregation.data.breakdown.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4 text-white font-medium">{item.appliance_name}</td>
                      <td className="py-3 px-4 text-gray-300">{item.category || '-'}</td>
                      <td className="py-3 px-4 text-blue-400 font-semibold">{item.estimated_kwh}</td>
                      <td className="py-3 px-4 text-purple-400">{item.percentage}%</td>
                      <td className="py-3 px-4 text-gray-300">{item.estimated_hours || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getConfidenceBadge(item.confidence)}`}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Notice */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-100 font-semibold mb-1">How NILM Works</p>
                <p className="text-blue-200 text-sm">
                  This AI system analyzes your total electricity consumption and uses Bayesian inference combined 
                  with machine learning to estimate individual appliance usage without additional hardware. 
                  Accuracy improves as you register more appliances and the system learns your usage patterns.
                </p>
                <p className="text-blue-300 text-xs mt-2">
                  Note: {disaggregation.note}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Analysis Tab */}
      {activeTab === 'historical' && historicalData && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4">
              <p className="text-purple-100 text-sm mb-1">Period</p>
              <p className="text-2xl font-bold text-white">{historicalData.period_days} Days</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4">
              <p className="text-blue-100 text-sm mb-1">Total Consumption</p>
              <p className="text-2xl font-bold text-white">{historicalData.total_consumption_kwh} kWh</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4">
              <p className="text-green-100 text-sm mb-1">Bills Analyzed</p>
              <p className="text-2xl font-bold text-white">{historicalData.number_of_bills}</p>
            </div>
          </div>

          {/* Category Summary */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Category Summary (Last {historicalData.period_days} Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalData.category_summary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px' 
                  }}
                />
                <Bar dataKey="total_kwh" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Breakdown List */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Billing Period Breakdown</h3>
            <div className="space-y-4">
              {historicalData.historical_breakdown.map((period, idx) => (
                <div key={idx} className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-semibold">{period.bill_date}</p>
                      <p className="text-gray-400 text-sm">{period.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-semibold text-lg">{period.total_kwh} kWh</p>
                      <p className="text-gray-400 text-sm">{period.daily_avg_kwh} kWh/day avg</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {period.breakdown.slice(0, 4).map((item, i) => (
                      <div key={i} className="bg-gray-800 rounded p-2">
                        <p className="text-gray-400 text-xs">{item.appliance_name}</p>
                        <p className="text-white font-semibold text-sm">{item.estimated_kwh} kWh</p>
                        <p className="text-purple-400 text-xs">{item.percentage}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing consumption patterns...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !disaggregation && activeTab !== 'setup' && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400 mb-4">Upload bills and register appliances to enable AI disaggregation</p>
          <button
            onClick={fetchDisaggregation}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default NILMDashboard;