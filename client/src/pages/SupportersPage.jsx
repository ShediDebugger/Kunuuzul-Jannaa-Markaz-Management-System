import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HeartHandshake,
  DollarSign,
  Award,
  Users,
  Building,
  Plus,
  Sparkles,
  BookOpen,
  Calendar,
  CreditCard,
  Target,
  CheckCircle2,
  Loader2,
  X,
  Search,
  FolderHeart,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export default function SupportersPage() {
  const { t } = useTranslation();
  const { formatDate } = useSettings();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState({});
  const [achievements, setAchievements] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Record Donation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    supporter_name: '',
    organization: '',
    contact: '',
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    method: 'cash',
    purpose: 'Hifzi Students Dormitory Wing',
    note: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [donRes, achRes] = await Promise.all([
        api.supporters.getDonations(),
        api.supporters.getAchievements(),
      ]);
      setDonations(donRes.data.donations || []);
      setSummary(donRes.data.summary || {});
      setAchievements(achRes.data.achievements || {});
      setProjects(achRes.data.active_projects || []);
    } catch (err) {
      console.error('Failed to load supporters data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.supporters.recordDonation(formData);
      setIsModalOpen(false);
      setFormData({
        supporter_name: '',
        organization: '',
        contact: '',
        amount: '',
        donation_date: new Date().toISOString().split('T')[0],
        method: 'cash',
        purpose: 'Hifzi Students Dormitory Wing',
        note: '',
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save donation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950 via-red-900 to-amber-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path d="M100 30 C60 0, 0 40, 30 100 C60 160, 100 190, 100 190 C100 190, 140 160, 170 100 C200 40, 140 0, 100 30 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <HeartHandshake className="w-8 h-8 text-rose-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-200 border border-rose-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M12
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('supporters.title')}</h1>
              <p className="text-rose-100/90 text-sm sm:text-base mt-1 max-w-xl font-light">
                {t('supporters.subtitle')}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm shadow-lg shadow-black/20 active:scale-95 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t('supporters.record_donation')}
            </button>
          )}
        </div>
      </div>

      {/* Institutional Achievements Showcase */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-brand-700" />
          <h2 className="font-bold text-gray-900 text-base">{t('supporters.achievements_title')}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">{t('supporters.total_raised')}</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 block font-mono">
              {parseFloat(summary.total_amount || 0).toLocaleString()} ETB
            </span>
            <span className="text-xs text-amber-700 mt-1 block font-medium">{summary.unique_donors || 0} Generous Donors</span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">{t('supporters.completed_hifz')}</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 block font-mono">
              {achievements.completed_quran_students || 12}
            </span>
            <span className="text-xs text-emerald-700 mt-1 block font-medium">Hafiz Graduates</span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">{t('supporters.advanced_memorizers')}</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 block font-mono">
              {achievements.advanced_memorizers || 28}
            </span>
            <span className="text-xs text-blue-700 mt-1 block font-medium">Over 15 Juz Memorized</span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">Boarding Dorm Capacity</span>
            <span className="text-2xl sm:text-3xl font-black text-purple-950 mt-1 block font-mono">
              {achievements.boarding_capacity || 45}
            </span>
            <span className="text-xs text-purple-700 mt-1 block font-medium">Resident Full-time Students</span>
          </div>
        </div>
      </div>

      {/* Active Markaz Development Projects */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-brand-700" />
          <h2 className="font-bold text-gray-900 text-base">{t('supporters.active_projects')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const percent = Math.min(100, Math.round((proj.raised_amount / proj.target_amount) * 100));
            return (
              <div key={proj.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                      {proj.category}
                    </span>
                    <span className="text-xs font-black text-brand-700">{percent}%</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{proj.title}</h3>
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium mt-2">
                    <span>Raised: <strong className="text-gray-900">{proj.raised_amount.toLocaleString()} ETB</strong></span>
                    <span>Target: {proj.target_amount.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Philanthropic Contributions Registry */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-brand-700" />
            <h2 className="font-bold text-gray-800 text-base">{t('supporters.donors_list')}</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
            {donations.length} Contributions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200/80 text-left">
                <th className="px-4 py-3.5 font-bold text-gray-700">Date</th>
                <th className="px-4 py-3.5 font-bold text-gray-700">{t('supporters.supporter_name')}</th>
                <th className="px-4 py-3.5 font-bold text-gray-700">Organization</th>
                <th className="px-4 py-3.5 font-bold text-gray-700">Purpose / Project</th>
                <th className="px-4 py-3.5 font-bold text-gray-700 text-center">Channel</th>
                <th className="px-4 py-3.5 font-bold text-gray-700 text-right">{t('supporters.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donations.map((don) => (
                <tr key={don.id} className="hover:bg-rose-50/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(don.donation_date)}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{don.supporter_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{don.organization || '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{don.purpose}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 uppercase">
                      {don.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-gray-900 font-mono text-sm">
                    {parseFloat(don.amount).toLocaleString()} ETB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-950 to-red-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-lg">{t('supporters.record_donation')}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('supporters.supporter_name')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.supporter_name}
                  onChange={(e) => setFormData({ ...formData, supporter_name: e.target.value })}
                  placeholder="e.g. Haji Zayd Omer / Anonymous"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('supporters.organization')}
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Optional business name"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('supporters.contact')}
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+251..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('supporters.amount')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 10000"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Channel / Method
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    <option value="cash">Cash</option>
                    <option value="e_birr">e-birr</option>
                    <option value="cbe">CBE Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('supporters.purpose')}
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold text-gray-800"
                >
                  <option value="Hifzi Students Dormitory Wing">Hifzi Students Dormitory Wing</option>
                  <option value="Mushaf Printing & Quran Library">Mushaf Printing & Quran Library</option>
                  <option value="Needy Students Sponsorship (Iftaam)">Needy Students Sponsorship (Iftaam)</option>
                  <option value="General Markaz Fund">General Markaz Fund</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Dedication / Dua Note
                </label>
                <textarea
                  rows="2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Optional dua or dedication..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 placeholder-gray-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? t('supporters.recording') : t('supporters.save_donation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
