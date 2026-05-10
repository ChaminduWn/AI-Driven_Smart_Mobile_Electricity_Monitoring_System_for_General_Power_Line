import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Hash, MapPin, Globe, Check, AlertTriangle, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, SectionHeader, Btn, Field } from '../components/UI';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    default_account_number: '',
    address: '',
    city: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        default_account_number: user.default_account_number || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
      });
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease] max-w-4xl mx-auto pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-2">Profile</h1>
        <p className="text-[#94A3B8] text-sm">Manage your account details and connected electricity profile.</p>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
            <span className="text-red-400 text-sm font-bold">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <Check className="text-green-400 shrink-0" size={20} />
            <span className="text-green-400 text-sm font-bold">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <SectionHeader title="Personal Information" className="!mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={16} className="text-[#64748B]" />
                </div>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={handleChange('full_name')}
                  placeholder="John Doe"
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </Field>

            <Field label="Email">
              <div className="relative opacity-70">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-[#64748B]" />
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-[#94A3B8] cursor-not-allowed"
                />
              </div>
            </Field>

            <Field label="Phone Number">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={16} className="text-[#64748B]" />
                </div>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={handleChange('phone_number')}
                  placeholder="+94 77 123 4567"
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </Field>

            <Field label="Account Number">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash size={16} className="text-[#64748B]" />
                </div>
                <input
                  type="text"
                  value={form.default_account_number}
                  onChange={handleChange('default_account_number')}
                  placeholder="123456789"
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </Field>
          </div>

          <div className="w-full h-[1px] bg-[#1E293B] my-2" />

          <SectionHeader title="Location Details" className="!mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Address" className="md:col-span-2">
              <div className="relative">
                <div className="absolute top-3.5 left-0 pl-4 flex items-start pointer-events-none">
                  <MapPin size={16} className="text-[#64748B]" />
                </div>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={handleChange('address')}
                  placeholder="123 Main Street"
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors resize-y"
                />
              </div>
            </Field>

            <Field label="City">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-[#64748B]" />
                </div>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Colombo"
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </Field>

            <Field label="Country">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe size={16} className="text-[#64748B]" />
                </div>
                <input
                  type="text"
                  value={form.country}
                  onChange={handleChange('country')}
                  placeholder="Sri Lanka"
                  className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <Btn type="submit" loading={saving} disabled={saving} icon={<Save size={16} />} className="!px-8 !py-3 !text-sm !bg-[#00E5FF] !text-black hover:!bg-[#00B8CC] font-bold tracking-wide rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
