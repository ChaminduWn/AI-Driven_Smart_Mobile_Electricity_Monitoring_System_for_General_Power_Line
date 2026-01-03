import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Plus, Trash2, Edit, TrendingUp, AlertCircle, Lightbulb, Search } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';
const ACCOUNT_NUMBER = '123456789'; // Demo account

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#06B6D4', '#10B981'];

const ApplianceManager = () => {
  const [appliances, setAppliances] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [commonAppliances, setCommonAppliances] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    appliance_name: '',
    appliance_category: 'Other',
    wattage: '',
    usage_duration_minutes: 60,
    usage_times_per_day: 1,
    usage_frequency: 'daily'
  });

  useEffect(() => {
    fetchAppliances();
    fetchAnalysis();
    fetchRecommendations();
    fetchCommonAppliances();
  }, []);

  const fetchAppliances = async () => {
    try {
      const response = await fetch(`${API_BASE}/appliances/account/${ACCOUNT_NUMBER}`);
      const data = await response.json();
      if (data.success) {
        setAppliances(data.appliances);
      }
    } catch (error) {
      console.error('Error fetching appliances:', error);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE}/appliances/analysis/${ACCOUNT_NUMBER}`);
      const data = await response.json();
      if (data.success) {
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${API_BASE}/appliances/recommendations/${ACCOUNT_NUMBER}`);
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchCommonAppliances = async () => {
    try {
      const response = await fetch(`${API_BASE}/appliances/common-appliances`);
      const data = await response.json();
      if (data.success) {
        setCommonAppliances(data.appliances);
      }
    } catch (error) {
      console.error('Error fetching common appliances:', error);
    }
  };

  const addAppliance = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/appliances/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          account_number: ACCOUNT_NUMBER
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${formData.appliance_name} added! Estimated monthly cost: Rs. ${data.estimated_cost.toFixed(2)}`);
        setShowAddForm(false);
        setFormData({
          appliance_name: '',
          appliance_category: 'Other',
          wattage: '',
          usage_duration_minutes: 60,
          usage_times_per_day: 1,
          usage_frequency: 'daily'
        });
        fetchAppliances();
        fetchAnalysis();
        fetchRecommendations();
      }
    } catch (error) {
      console.error('Error adding appliance:', error);
      alert('❌ Failed to add appliance');
    }
    setLoading(false);
  };

  const deleteAppliance = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/appliances/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Appliance deleted');
        fetchAppliances();
        fetchAnalysis();
        fetchRecommendations();
      }
    } catch (error) {
      console.error('Error deleting appliance:', error);
    }
  };

  const useCommonAppliance = (appliance) => {
    setFormData({
      appliance_name: appliance.name,
      appliance_category: appliance.category,
      wattage: appliance.typical_wattage,
      usage_duration_minutes: 60,
      usage_times_per_day: 1,
      usage_frequency: 'daily'
    });
    setShowAddForm(true);
  };

  const filteredAppliances = appliances.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryColor = (category) => {
    const colors = {
      'Cooling': '#3B82F6',
      'Heating': '#EF4444',
      'Cooking': '#F59E0B',
      'Cleaning': '#14B8A6',
      'Entertainment': '#8B5CF6',
      'Lighting': '#F59E0B',
      'Other': '#6B7280'
    };
    return colors[category] || '#6B7280';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Zap className="w-8 h-8" />
          Appliance Manager
        </h2>
        <p className="text-purple-100 mt-2">Track and optimize your appliance energy consumption</p>
      </div>

      {/* Summary Cards */}
      {analysis && analysis.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
            <p className="text-blue-100 text-sm mb-1">Total Appliances</p>
            <p className="text-4xl font-bold text-white">{analysis.summary.total_appliances}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl">
            <p className="text-purple-100 text-sm mb-1">Daily Consumption</p>
            <p className="text-4xl font-bold text-white">{analysis.summary.total_daily_kwh} <span className="text-xl">kWh</span></p>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-6 shadow-xl">
            <p className="text-pink-100 text-sm mb-1">Monthly Consumption</p>
            <p className="text-4xl font-bold text-white">{analysis.summary.total_monthly_kwh} <span className="text-xl">kWh</span></p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
            <p className="text-green-100 text-sm mb-1">Estimated Cost</p>
            <p className="text-4xl font-bold text-white">Rs. {analysis.summary.estimated_monthly_cost.toFixed(0)}</p>
          </div>
        </div>
      )}

      {/* Add Appliance Button & Form */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" />
            Add New Appliance
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Add Appliance</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Appliance Name *</label>
                <input
                  type="text"
                  required
                  value={formData.appliance_name}
                  onChange={(e) => setFormData({...formData, appliance_name: e.target.value})}
                  placeholder="e.g., Living Room TV"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">Category</label>
                <select
                  value={formData.appliance_category}
                  onChange={(e) => setFormData({...formData, appliance_category: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Cooling">Cooling</option>
                  <option value="Heating">Heating</option>
                  <option value="Cooking">Cooking</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">Power (Watts) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.wattage}
                  onChange={(e) => setFormData({...formData, wattage: e.target.value})}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">Usage Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_duration_minutes}
                  onChange={(e) => setFormData({...formData, usage_duration_minutes: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">Times Per Day</label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_times_per_day}
                  onChange={(e) => setFormData({...formData, usage_times_per_day: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">Frequency</label>
                <select
                  value={formData.usage_frequency}
                  onChange={(e) => setFormData({...formData, usage_frequency: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <button
              onClick={addAppliance}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Appliance'}
            </button>

            {/* Quick Add from Common Appliances */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Or quick add from common appliances:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonAppliances.slice(0, 6).map((app, idx) => (
                  <button
                    key={idx}
                    onClick={() => useCommonAppliance(app)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {app.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      {analysis && analysis.breakdown && analysis.breakdown.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart - Consumption Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Consumption by Appliance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analysis.breakdown.slice(0, 7)}
                  dataKey="monthly_kwh"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.monthly_kwh} kWh`}
                  labelLine={false}
                >
                  {analysis.breakdown.slice(0, 7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Cost Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Estimated Monthly Cost</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.breakdown.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Bar dataKey="estimated_monthly_cost" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Appliances List */}
      {appliances.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Your Appliances</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-700">
                  <th className="py-3 px-4 text-gray-300 font-semibold">Appliance</th>
                  <th className="py-3 px-4 text-gray-300 font-semibold">Category</th>
                  <th className="py-3 px-4 text-gray-300 font-semibold">Power</th>
                  <th className="py-3 px-4 text-gray-300 font-semibold">Daily kWh</th>
                  <th className="py-3 px-4 text-gray-300 font-semibold">Monthly kWh</th>
                  <th className="py-3 px-4 text-gray-300 font-semibold">Est. Cost</th>
                  <th className="py-3 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppliances.map((appliance) => (
                  <tr key={appliance.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: getCategoryColor(appliance.category)}}></div>
                        <span className="text-white font-medium">{appliance.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{appliance.category || '-'}</td>
                    <td className="py-3 px-4 text-yellow-400 font-semibold">{appliance.wattage}W</td>
                    <td className="py-3 px-4 text-blue-400">{appliance.daily_kwh.toFixed(3)}</td>
                    <td className="py-3 px-4 text-purple-400 font-semibold">{appliance.monthly_kwh.toFixed(2)}</td>
                    <td className="py-3 px-4 text-green-400 font-semibold">Rs. {appliance.estimated_cost.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteAppliance(appliance.id, appliance.name)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-xl p-6 border border-amber-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Energy Saving Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-black bg-opacity-30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 px-2 py-1 rounded text-xs font-bold ${
                    rec.priority === 'high' ? 'bg-red-600 text-white' :
                    rec.priority === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{rec.message}</p>
                    <p className="text-amber-200 text-sm mt-1">{rec.suggestion}</p>
                    {rec.potential_savings_kwh && (
                      <p className="text-green-400 text-sm mt-1 font-semibold">
                        💡 Potential savings: {rec.potential_savings_kwh} kWh/month
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {appliances.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Appliances Yet</h3>
          <p className="text-gray-400 mb-6">Add your first appliance to start tracking energy consumption</p>
        </div>
      )}
    </div>
  );
};

export default ApplianceManager;