import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Camera, TrendingDown, TrendingUp, Zap, DollarSign, Calendar, AlertCircle, CheckCircle, Target, Activity, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6'
};

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#06B6D4'];

const ElectricityDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [budgetPlan, setBudgetPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch(`${API_BASE}/bills`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      if (data.success) {
        setBills(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedBill(data.data[0]);
          fetchAnalysis(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchAnalysis = async (billId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/analysis/past-month/${billId}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/bills/extract`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Bill extracted successfully!\nBill ID: ${data.bill_id}\nTotal Charge: Rs. ${data.data?.total_charge || 'N/A'}`);
        setFile(null);
        fetchBills();
      } else {
        alert(`❌ Upload failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload bill. Please try again.');
    }
    setUploading(false);
  };

  const deleteBill = async (billId) => {
    if (!confirm('Delete this bill? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_BASE}/bills/${billId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Bill deleted successfully');
        fetchBills();
        if (selectedBill?.id === billId) {
          setSelectedBill(null);
          setAnalysis(null);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete bill');
    }
  };

  const BillList = () => (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Recent Bills ({bills.length})
      </h3>
      {bills.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No bills uploaded yet. Upload your first bill to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-gray-300 font-semibold">Date</th>
                <th className="py-3 px-4 text-gray-300 font-semibold">Units</th>
                <th className="py-3 px-4 text-gray-300 font-semibold">Cost</th>
                <th className="py-3 px-4 text-gray-300 font-semibold">Days</th>
                <th className="py-3 px-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.slice(0, 5).map((bill) => (
                <tr key={bill.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">
                        {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-400">{bill.account_number || 'No account'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-blue-400 font-semibold">
                    {bill.units_consumed || 0} kWh
                  </td>
                  <td className="py-3 px-4 text-green-400 font-semibold">
                    Rs. {(bill.total_charge || 0).toFixed(2)}
                  </td>
                  
                  <td className="py-3 px-4 text-purple-400">{bill.billing_period_days || 0} days</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBill(bill);
                          fetchAnalysis(bill.id);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-900/20 rounded transition-colors"
                        title="Analyze"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const OverviewTab = () => {
    if (loading) return <div className="text-center py-12 text-gray-400">Loading analysis...</div>;
    if (!analysis) return (
      <div className="text-center py-12 text-gray-400">
        <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No analysis available. Select a bill or upload a new one to get started.</p>
      </div>
    );

    const { summary, week_breakdown, tariff_details } = analysis;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            label="Total Units"
            value={`${summary.total_units} kWh`}
            trend={`${summary.daily_average_units.toFixed(1)} kWh/day`}
            color="blue"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Cost"
            value={`Rs. ${summary.total_cost.toFixed(2)}`}
            trend={`Rs. ${summary.daily_average_cost.toFixed(2)}/day`}
            color="green"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="Billing Period"
            value={`${summary.billing_days} days`}
            trend="Last month"
            color="purple"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Weekly Average"
            value={`${summary.weekly_average_units.toFixed(1)} kWh`}
            trend={`Rs. ${summary.weekly_average_cost.toFixed(2)}`}
            color="teal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              Weekly Consumption
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={week_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Bar dataKey="units" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-green-400" />
              Weekly Cost Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={week_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Line type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Tariff Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <TariffItem label="Category" value={tariff_details.category} />
            <TariffItem label="Energy Charge" value={`Rs. ${tariff_details.energy_charge.toFixed(2)}`} />
            <TariffItem label="Fixed Charge" value={`Rs. ${tariff_details.fixed_charge.toFixed(2)}`} />
            <TariffItem label="SSCL (2.5%)" value={`Rs. ${tariff_details.sscl.toFixed(2)}`} />
            <TariffItem label="Total" value={`Rs. ${tariff_details.total.toFixed(2)}`} highlight />
          </div>
        </div>
      </div>
    );
  };

  const BudgetPlannerTab = () => {
    const [targetBudget, setTargetBudget] = useState(0);
    const [planningDays, setPlanningDays] = useState(30);

    useEffect(() => {
      if (selectedBill && selectedBill.total_charge) {
        setTargetBudget((selectedBill.total_charge * 0.9).toFixed(2));
      }
    }, [selectedBill]);

    const createBudgetPlan = async () => {
      if (!selectedBill) {
        alert('Please select a bill first');
        return;
      }
      const minBudget = selectedBill.total_charge * 0.5;
      const maxBudget = selectedBill.total_charge * 1.5;
      if (targetBudget < minBudget || targetBudget > maxBudget) {
        alert(`Budget must be between Rs. ${minBudget.toFixed(2)} and Rs. ${maxBudget.toFixed(2)}`);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/analysis/create-budget-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bill_id: selectedBill.id,
            target_budget: parseFloat(targetBudget),
            planning_days: planningDays
          })
        });
        const data = await response.json();
        if (data.success) {
          setBudgetPlan(data.plan);
          alert('✅ Budget plan created successfully!');
        } else {
          alert(`❌ Error: ${data.message || 'Failed to create plan'}`);
        }
      } catch (error) {
        console.error('Error creating plan:', error);
        alert('❌ Failed to create budget plan');
      }
      setLoading(false);
    };

    const minBudget = selectedBill ? (selectedBill.total_charge * 0.5).toFixed(2) : 0;
    const maxBudget = selectedBill ? (selectedBill.total_charge * 1.5).toFixed(2) : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-6 shadow-xl border border-blue-700">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-7 h-7" />
            Create Budget Plan
          </h3>
         
          {selectedBill && (
            <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-300 text-sm">Past Bill</p>
                  <p className="text-2xl font-bold text-white">Rs. {selectedBill.total_charge.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Units</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedBill.units_consumed} kWh</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Days</p>
                  <p className="text-2xl font-bold text-purple-400">{selectedBill.billing_period_days}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white mb-2 font-medium">Target Budget (Rs.)</label>
              <input
                type="number"
                value={targetBudget}
                onChange={(e) => setTargetBudget(e.target.value)}
                min={minBudget}
                max={maxBudget}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-gray-400 text-sm mt-2">Range: Rs. {minBudget} - {maxBudget}</p>
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Planning Period (Days)</label>
              <select
                value={planningDays}
                onChange={(e) => setPlanningDays(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {[28, 29, 30, 31, 32, 33, 34, 35].map(d => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={createBudgetPlan}
            disabled={loading || !selectedBill}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Plan...' : 'Create Budget Plan'}
          </button>
        </div>

        {budgetPlan && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90">Target Budget</p>
                <p className="text-2xl font-bold">Rs. {budgetPlan.budget_info.target_budget.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90">Daily Target</p>
                <p className="text-2xl font-bold">{budgetPlan.daily_targets.units.toFixed(1)} kWh</p>
                <p className="text-xs opacity-75">Rs. {budgetPlan.daily_targets.cost.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90">Weekly Target</p>
                <p className="text-2xl font-bold">{budgetPlan.weekly_targets[0].target_units.toFixed(1)} kWh</p>
                <p className="text-xs opacity-75">Rs. {budgetPlan.weekly_targets[0].target_cost.toFixed(2)}</p>
              </div>
              <div className={`bg-gradient-to-br rounded-lg p-4 text-white ${
                budgetPlan.budget_info.percentage_change < 0 ? 'from-green-600 to-green-700' : 'from-orange-600 to-orange-700'
              }`}>
                <p className="text-sm opacity-90">Change</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {budgetPlan.budget_info.percentage_change < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  {Math.abs(budgetPlan.budget_info.percentage_change).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Weekly Targets</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-gray-300">Week</th>
                      <th className="py-3 px-4 text-gray-300">Days</th>
                      <th className="py-3 px-4 text-gray-300">Target Units</th>
                      <th className="py-3 px-4 text-gray-300">Target Cost</th>
                      <th className="py-3 px-4 text-gray-300">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetPlan.weekly_targets.map((week, idx) => (
                      <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3 px-4 text-white font-semibold">Week {week.week}</td>
                        <td className="py-3 px-4 text-gray-300">{week.days}</td>
                        <td className="py-3 px-4 text-blue-400">{week.target_units.toFixed(1)} kWh</td>
                        <td className="py-3 px-4 text-green-400">Rs. {week.target_cost.toFixed(2)}</td>
                        <td className="py-3 px-4 text-purple-400">Rs. {week.cumulative_cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-xl p-6 border border-amber-700">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {budgetPlan.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-200">
                    <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-10 h-10" />
            Smart Electricity Monitor
          </h1>
          <p className="text-blue-100 mt-2">AI-Powered Bill Analysis & Budget Planning</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-400" />
            Upload Electricity Bill
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload & Extract'
              )}
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-3">Supports PDF and images. AI will extract all data automatically.</p>
        </div>

        <BillList />

        <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-xl">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'budget'} onClick={() => setActiveTab('budget')}>
            Budget Planner
          </TabButton>
        </div>

        <div>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'budget' && <BudgetPlannerTab />}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color }) => {
  const colors = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700',
    teal: 'from-teal-600 to-teal-700'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white opacity-90">{icon}</div>
      </div>
      <p className="text-white text-sm opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-white opacity-75">{trend}</p>
    </div>
  );
};

const TariffItem = ({ label, value, highlight }) => (
  <div className={`${highlight ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gray-700'} rounded-lg p-4`}>
    <p className="text-gray-300 text-sm">{label}</p>
    <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-gray-100'} mt-1`}>{value}</p>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
        : 'text-gray-400 hover:text-white hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

export default ElectricityDashboard;

