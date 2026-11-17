import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  LogOut,
  Sparkles,
  Layers,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  History,
  GitBranch,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const DECISION_CONFIG = {
  promoted: { labelKey: 'promotions.promoted', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  repeated: { labelKey: 'promotions.repeated', icon: RotateCcw, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  left: { labelKey: 'promotions.left', icon: LogOut, color: 'text-red-700 bg-red-50 border-red-300' },
};

export default function PromotionsPage() {
  const { t } = useTranslation();
  const { formatDate } = useSettings();

  const [activeTab, setActiveTab] = useState('proposals'); // 'proposals' | 'history'
  const [proposals, setProposals] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Load proposals
  const loadProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.promotions.getProposal();
      setProposals(res.data.proposals || []);
    } catch (err) {
      console.error('Failed to load promotion proposals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.promotions.getHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to load promotion history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'proposals') {
      loadProposals();
    } else {
      loadHistory();
    }
  }, [activeTab, loadProposals, loadHistory]);

  const handleDecisionChange = (studentId, newDecision) => {
    setProposals((prev) =>
      prev.map((p) => (p.student_id === studentId ? { ...p, decision: newDecision } : p))
    );
  };

  const handleNoteChange = (studentId, noteText) => {
    setProposals((prev) =>
      prev.map((p) => (p.student_id === studentId ? { ...p, note: noteText } : p))
    );
  };

  const handlePromoteAll = () => {
    setProposals((prev) => prev.map((p) => ({ ...p, decision: 'promoted' })));
  };

  const handleExecute = async () => {
    if (!window.confirm('Are you sure you want to commit these promotions? Student levels will be updated permanently.')) {
      return;
    }
    try {
      setExecuting(true);
      const res = await api.promotions.execute({
        academic_year_id: 1,
        decisions: proposals.map((p) => ({
          student_id: p.student_id,
          from_level_id: p.from_level_id,
          to_level_id: p.to_level_id,
          decision: p.decision,
          note: p.note,
        })),
      });

      setExecutionResult(res.data.summary);
      loadProposals();
    } catch (err) {
      alert(err.message || 'Promotion execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const promotedCount = proposals.filter((p) => p.decision === 'promoted').length;
  const repeatedCount = proposals.filter((p) => p.decision === 'repeated').length;
  const leftCount = proposals.filter((p) => p.decision === 'left').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path d="M20,180 Q100,20 180,180" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="80" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M10
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('promotions.title')}</h1>
              <p className="text-purple-100/90 text-sm sm:text-base mt-1 max-w-xl font-light">
                {t('promotions.subtitle')}
              </p>
            </div>
          </div>

          {activeTab === 'proposals' && (
            <button
              onClick={handleExecute}
              disabled={executing || loading || proposals.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm shadow-lg shadow-black/20 active:scale-95 transition self-start sm:self-auto disabled:opacity-50"
            >
              {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {executing ? t('promotions.executing') : t('promotions.execute_promotions')}
            </button>
          )}
        </div>
      </div>

      {/* Level Progression Visual Diagram Alert */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <GitBranch className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-extrabold text-purple-900 block mb-1">
              Markaz Level Progression Path (Gender-Specific Split)
            </span>
            <div className="flex flex-wrap items-center gap-2 text-gray-700 font-semibold font-mono">
              <span className="bg-white px-2 py-0.5 rounded border border-purple-200">H-01</span>
              <span>→</span>
              <span className="bg-white px-2 py-0.5 rounded border border-purple-200">H-02</span>
              <span>→</span>
              <span className="bg-white px-2 py-0.5 rounded border border-purple-200">QT-03 (Co-ed)</span>
              <span>➔</span>
              <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-300">
                ♂ Boys: QT-04 → QH-06
              </span>
              <span>|</span>
              <span className="bg-pink-100 text-pink-900 px-2 py-0.5 rounded border border-pink-300">
                ♀ Girls: QT-05 → QH-07
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Summary if Executed */}
      {executionResult && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900 text-base">Promotions Successfully Committed</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
              <span className="text-2xl font-black text-emerald-700">{executionResult.promoted}</span>
              <span className="text-xs text-gray-500 block font-medium mt-0.5">Promoted to Next Level</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
              <span className="text-2xl font-black text-amber-700">{executionResult.repeated}</span>
              <span className="text-xs text-gray-500 block font-medium mt-0.5">Repeating Same Level</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
              <span className="text-2xl font-black text-red-700">{executionResult.left}</span>
              <span className="text-xs text-gray-500 block font-medium mt-0.5">Left / Graduated</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'proposals'
              ? 'bg-purple-100 text-purple-900'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {t('promotions.proposed_list')} ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'history'
              ? 'bg-purple-100 text-purple-900'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4" />
          {t('promotions.history_title')}
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'proposals' ? (
        <div className="space-y-4">
          {/* Action Row & Live Counts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Counts:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {promotedCount} Promoted
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {repeatedCount} Repeated
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                {leftCount} Left
              </span>
            </div>
            <button
              onClick={handlePromoteAll}
              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition self-start sm:self-auto flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Reset All to "Promote"
            </button>
          </div>

          {/* Proposals Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">{t('common.loading')}</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No candidates eligible for promotion.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200/80 text-left">
                      <th className="px-4 py-3.5 font-bold text-gray-700 w-12">#</th>
                      <th className="px-4 py-3.5 font-bold text-gray-700">{t('students.full_name')}</th>
                      <th className="px-4 py-3.5 font-bold text-gray-700 w-24">Sex</th>
                      <th className="px-4 py-3.5 font-bold text-gray-700">{t('promotions.from_level')}</th>
                      <th className="px-4 py-3.5 font-bold text-gray-700">{t('promotions.to_level')}</th>
                      <th className="px-4 py-3.5 font-bold text-gray-700 w-44 text-center">{t('promotions.decision')}</th>
                      <th className="px-4 py-3.5 font-bold text-gray-700">Override Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {proposals.map((item, idx) => (
                      <tr key={item.student_id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{item.full_name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{item.registration_number}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            item.sex === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}>
                            {item.sex === 'male' ? '♂ Boy' : '♀ Girl'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-800">{item.from_level_code}</span>
                          <span className="text-xs text-gray-500 block">{item.from_level_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <div>
                              <span className="font-bold text-purple-900">{item.to_level_code || 'Graduation'}</span>
                              <span className="text-xs text-gray-500 block">{item.to_level_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={item.decision}
                            onChange={(e) => handleDecisionChange(item.student_id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="promoted">{t('promotions.promoted')}</option>
                            <option value="repeated">{t('promotions.repeated')}</option>
                            <option value="left">{t('promotions.left')}</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.note || ''}
                            onChange={(e) => handleNoteChange(item.student_id, e.target.value)}
                            placeholder={t('promotions.override_note')}
                            className="w-full px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 placeholder-gray-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Archive */
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-800 text-base">{t('promotions.history_title')}</h2>
            <span className="text-xs text-gray-500">{history.length} Records</span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">{t('common.loading')}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No past promotion records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200/80 text-left">
                    <th className="px-4 py-3.5 font-bold text-gray-700">Date</th>
                    <th className="px-4 py-3.5 font-bold text-gray-700">Student</th>
                    <th className="px-4 py-3.5 font-bold text-gray-700">From Level</th>
                    <th className="px-4 py-3.5 font-bold text-gray-700">To Level</th>
                    <th className="px-4 py-3.5 font-bold text-gray-700">Decision</th>
                    <th className="px-4 py-3.5 font-bold text-gray-700">Decided By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(h.decision_date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{h.student_name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{h.registration_number}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{h.from_level_code}</td>
                      <td className="px-4 py-3 font-semibold text-purple-900">{h.to_level_code || 'Graduation'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          h.decision === 'promoted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {h.decision}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{h.decided_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
