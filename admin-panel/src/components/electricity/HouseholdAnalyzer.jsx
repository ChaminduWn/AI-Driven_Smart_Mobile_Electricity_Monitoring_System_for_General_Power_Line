import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Home, Plus, Trash2, Activity, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { MEMBER1_API_BASE } from '../../config/apiBases';

const API_BASE = MEMBER1_API_BASE;

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444'];

const HouseholdAnalyzer = () => {
  const [accountNumber, setAccountNumber] = useState('123456789');
  const [members, setMembers] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    member_type: 'male',
    occupation_status: 'working',
    age: 30,
    weekday_hours_at_home: 12,
    weekend_hours_at_home: 24
  });

  useEffect(() => {
    if (accountNumber) {
      fetchMembers();
      fetchAppliances();
    }
  }, [accountNumber]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/household/members/${accountNumber}`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.members || []);
        if (data.members && data.members.length > 0) {
          analyzeHousehold(data.members);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load household members');
    }
    setLoading(false);
  };

  const fetchAppliances = async () => {
    try {
      const response = await fetch(`${API_BASE}/appliances/account/${accountNumber}`);
      const data = await response.json();
      if (data.success) {
        setAppliances(data.appliances || []);
      }
    } catch (error) {
      console.error('Error fetching appliances:', error);
    }
  };

  const addMember = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/household/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          ...formData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Member added successfully!');
        setShowAddForm(false);
        setFormData({
          member_type: 'male',
          occupation_status: 'working',
          age: 30,
          weekday_hours_at_home: 12,
          weekend_hours_at_home: 24
        });
        fetchMembers(); // Refresh the list
      } else {
        alert('❌ Failed to add member: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('❌ Failed to add member. Check console for details.');
    }
    setSaving(false);
  };

  const deleteMember = async (memberId) => {
    if (!confirm('Delete this household member?')) return;

    try {
      const response = await fetch(`${API_BASE}/household/members/${memberId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Member deleted successfully');
        fetchMembers(); // Refresh the list
      } else {
        alert('❌ Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('❌ Failed to delete member');
    }
  };

  const analyzeHousehold = async (householdMembers) => {
    if (householdMembers.length === 0 || appliances.length === 0) {
      setAnalysis(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/nilm/disaggregate-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          household_members: householdMembers.map(m => ({
            type: m.member_type,
            status: m.occupation_status
          }))
        })
      });

      const data = await response.json();
      if (data.success && data.data && data.data.household_context) {
        setAnalysis(data.data.household_context);
      }
    } catch (error) {
      console.error('Error analyzing household:', error);
    }
  };

  const getMemberIcon = (type, status) => {
    const icons = {
      male_working: '👨‍💼',
      male_home: '👨‍🏫',
      female_working: '👩‍💼',
      female_home: '👩‍🏫',
      child_school: '👦',
      child_home: '👧',
      elderly_retired: '👴',
      elderly_home: '👵'
    };
    return icons[`${type}_${status}`] || '👤';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8" />
              Household Energy Analyzer
            </h2>
            <p className="text-teal-100 mt-2">
              Analyze consumption patterns based on household composition
            </p>
          </div>
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Account Number */}
        <div className="max-w-md">
          <label className="block text-teal-100 text-sm mb-2">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter account number"
            className="w-full px-4 py-2 bg-teal-800 bg-opacity-50 border border-teal-400 rounded-lg text-white placeholder-teal-300 focus:ring-2 focus:ring-white focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
            <p className="text-blue-100 text-sm mb-1">Household Size</p>
            <p className="text-4xl font-bold text-white">{analysis.household_size}</p>
            <p className="text-blue-200 text-xs mt-1">Members</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl">
            <p className="text-purple-100 text-sm mb-1">Daily Est.</p>
            <p className="text-4xl font-bold text-white">
              {analysis.estimated_daily_kwh.toFixed(1)}
              <span className="text-lg"> kWh</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-6 shadow-xl">
            <p className="text-pink-100 text-sm mb-1">Monthly Est.</p>
            <p className="text-4xl font-bold text-white">
              {analysis.estimated_monthly_kwh.toFixed(0)}
              <span className="text-lg"> kWh</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
            <p className="text-green-100 text-sm mb-1">Synergy Factor</p>
            <p className="text-4xl font-bold text-white">
              {(analysis.synergy_factor * 100).toFixed(0)}%
            </p>
            <p className="text-green-200 text-xs mt-1">Efficiency</p>
          </div>
        </div>
      )}

      {/* Add Member Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          Add Household Member
        </button>
      )}

      {/* Add Member Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Add Household Member</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Type</label>
              <select
                value={formData.member_type}
                onChange={(e) => setFormData({...formData, member_type: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="child">Child</option>
                <option value="elderly">Elderly</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Status</label>
              <select
                value={formData.occupation_status}
                onChange={(e) => setFormData({...formData, occupation_status: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="working">Working</option>
                <option value="home">Home</option>
                <option value="school">School</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Weekday Hours at Home</label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.weekday_hours_at_home}
                onChange={(e) => setFormData({...formData, weekday_hours_at_home: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Weekend Hours at Home</label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.weekend_hours_at_home}
                onChange={(e) => setFormData({...formData, weekend_hours_at_home: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={addMember}
            disabled={saving}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Add Member
              </>
            )}
          </button>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading household members...</p>
        </div>
      ) : members.length > 0 ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Household Members ({members.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div key={member.id} className="bg-gray-750 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getMemberIcon(member.member_type, member.occupation_status)}</span>
                    <div>
                      <p className="text-white font-semibold capitalize">
                        {member.member_type} - {member.occupation_status}
                      </p>
                      <p className="text-gray-400 text-sm">Age: {member.age}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMember(member.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
                    title="Delete member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-400">Weekday @ Home</p>
                    <p className="text-blue-400 font-semibold">{member.weekday_hours_at_home}h</p>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-400">Weekend @ Home</p>
                    <p className="text-purple-400 font-semibold">{member.weekend_hours_at_home}h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Analysis Charts */}
      {analysis && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contribution Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Energy Contribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Member Patterns', value: analysis.member_contribution },
                    { name: 'Appliances', value: analysis.appliance_contribution }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)} kWh`}
                >
                  <Cell fill={CHART_COLORS[0]} />
                  <Cell fill={CHART_COLORS[1]} />
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

          {/* Efficiency Analysis */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Household Efficiency</h3>
            <div className="space-y-4">
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Base Consumption (Individual)</p>
                <p className="text-2xl font-bold text-white">
                  {(analysis.member_contribution + analysis.appliance_contribution).toFixed(1)} kWh/day
                </p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Actual with Synergy</p>
                <p className="text-2xl font-bold text-green-400">
                  {analysis.estimated_daily_kwh.toFixed(1)} kWh/day
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-4">
                <p className="text-green-100 text-sm mb-2">Efficiency Gain</p>
                <p className="text-3xl font-bold text-white">
                  {((1 - analysis.synergy_factor) * 100).toFixed(0)}%
                </p>
                <p className="text-green-200 text-xs mt-1">
                  Saved through shared appliances
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Notices */}
      {appliances.length === 0 && (
        <div className="bg-amber-900 bg-opacity-30 border border-amber-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-100 font-semibold mb-1">No Appliances Registered</p>
              <p className="text-amber-200 text-sm">
                Go to the Appliance Manager to add your household appliances first. 
                The analyzer combines member patterns with actual appliance usage for accurate estimates.
              </p>
            </div>
          </div>
        </div>
      )}

      {members.length > 0 && appliances.length > 0 && !analysis && (
        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-100 font-semibold mb-1">Analysis in Progress</p>
              <p className="text-blue-200 text-sm">
                Analyzing your household composition and appliance usage patterns. 
                This combines member behavior patterns with registered appliances for accurate consumption estimates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && !showAddForm && !loading && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Household Members</h3>
          <p className="text-gray-400 mb-6">
            Add household members to analyze consumption patterns based on family composition
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all"
          >
            Add First Member
          </button>
        </div>
      )}
    </div>
  );
};

export default HouseholdAnalyzer;