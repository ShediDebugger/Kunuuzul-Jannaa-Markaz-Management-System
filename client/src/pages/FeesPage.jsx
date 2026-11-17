import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Printer,
  RotateCcw,
  PlusCircle,
  ShieldAlert,
  UserCheck,
  X,
  Layers,
  Phone,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function FeesPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const { formatDateWithPref } = useSettings();

  const [activeTab, setActiveTab] = useState('record'); // 'record', 'receipts', 'unpaid', 'daily', 'free', 'plans'

  // Reference Data
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [feePlans, setFeePlans] = useState([]);

  // Notifications
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 1. Record Payment Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentFeeInfo, setStudentFeeInfo] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'e_birr', 'cbe'
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() + 1]);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [justRecordedReceipt, setJustRecordedReceipt] = useState(null);

  // 2. Receipts History State
  const [payments, setPayments] = useState([]);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Reversal Modal
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState('');

  // 3. Unpaid List State
  const [unpaidMonth, setUnpaidMonth] = useState(new Date().getMonth() + 1);
  const [unpaidLevelId, setUnpaidLevelId] = useState('');
  const [unpaidData, setUnpaidData] = useState({ students: [], total_unpaid_amount: 0 });
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);

  // 4. Daily Cashier Summary State
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // 5. Free Student Requests State
  const [freeRequests, setFreeRequests] = useState([]);
  const [freeStudentId, setFreeStudentId] = useState('');
  const [freeReason, setFreeReason] = useState('');
  const [isNewFreeModalOpen, setIsNewFreeModalOpen] = useState(false);

  // Fetch initial references
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [stuRes, lvlRes, plansRes] = await Promise.all([
          api.students.getAll({ limit: 200, status: 'active' }),
          api.academics.getLevels(),
          api.fees.getPlans(),
        ]);
        setStudents(stuRes.data.students);
        setLevels(lvlRes.data);
        setFeePlans(plansRes.data);
      } catch (err) {
        console.error('Failed to load references:', err);
      }
    };
    fetchReferences();
  }, []);

  // Fetch student fee info when selected
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentFeeInfo(null);
      setPaymentAmount('');
      return;
    }
    const loadFeeInfo = async () => {
      try {
        const res = await api.fees.getStudentFee(selectedStudentId);
        setStudentFeeInfo(res.data);
        setPaymentAmount(String(res.data.effective_monthly_amount));
      } catch (err) {
        console.error('Error fetching student fee:', err);
      }
    };
    loadFeeInfo();
  }, [selectedStudentId]);

  // Load Tab-specific data
  useEffect(() => {
    if (activeTab === 'receipts') {
      loadPayments();
    } else if (activeTab === 'unpaid') {
      loadUnpaidList();
    } else if (activeTab === 'daily') {
      loadDailySummary();
    } else if (activeTab === 'free') {
      loadFreeRequests();
    }
  }, [activeTab, unpaidMonth, unpaidLevelId, summaryDate, methodFilter, dateFilter]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.fees.getAllPayments({
        search: receiptSearch || undefined,
        payment_method: methodFilter || undefined,
        payment_date: dateFilter || undefined,
      });
      setPayments(res.data.payments);
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadUnpaidList = async () => {
    setLoadingUnpaid(true);
    try {
      const res = await api.fees.getUnpaidList({
        month_number: unpaidMonth,
        level_id: unpaidLevelId || undefined,
      });
      setUnpaidData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load unpaid list');
    } finally {
      setLoadingUnpaid(false);
    }
  };

  const loadDailySummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.fees.getDailySummary(summaryDate);
      setDailySummary(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load daily summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadFreeRequests = async () => {
    try {
      const res = await api.fees.getFreeRequests();
      setFreeRequests(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load free student requests');
    }
  };

  // 1. Submit Payment Handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmittingPayment(true);

    try {
      const res = await api.fees.recordPayment({
        student_id: Number(selectedStudentId),
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        payment_date: paymentDate,
        months: selectedMonths,
      });

      setSuccess(`Payment recorded successfully! Receipt: ${res.data.receipt_number}`);
      setJustRecordedReceipt(res.data);
      // Reset form
      setSelectedStudentId('');
      setPaymentAmount('');
      setReferenceNumber('');
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Toggle Month Checkbox
  const toggleMonth = (m) => {
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter((item) => item !== m));
      }
    } else {
      setSelectedMonths([...selectedMonths, m].sort((a, b) => a - b));
    }
  };

  // 2. Admin Reversal Handler
  const handleOpenReverse = (p) => {
    setReversalTarget(p);
    setReversalReason('');
    setReversalError('');
    setIsReverseModalOpen(true);
  };

  const handleConfirmReverse = async (e) => {
    e.preventDefault();
    setReversalError('');
    try {
      await api.fees.reversePayment(reversalTarget.id, reversalReason);
      setIsReverseModalOpen(false);
      setSuccess(`Payment ${reversalTarget.receipt_number} reversed successfully.`);
      loadPayments();
    } catch (err) {
      setReversalError(err.message || 'Failed to reverse payment');
    }
  };

  // 5. Free Student Handler
  const handleCreateFreeRequest = async (e) => {
    e.preventDefault();
    try {
      await api.fees.createFreeRequest({
        student_id: Number(freeStudentId),
        reason: freeReason,
      });
      setIsNewFreeModalOpen(false);
      setFreeReason('');
      setSuccess('Free student request submitted and pending manager approval.');
      loadFreeRequests();
    } catch (err) {
      setError(err.message || 'Failed to submit free request');
    }
  };

  const handleDecideFreeRequest = async (requestId, decision) => {
    try {
      await api.fees.decideFreeRequest(requestId, decision);
      setSuccess(`Request has been marked as ${decision}.`);
      loadFreeRequests();
    } catch (err) {
      setError(err.message || 'Failed to process decision');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('fees.title')}</h2>
        <p className="text-xs sm:text-sm text-gray-500">{t('fees.subtitle')}</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4 text-emerald-500" /></button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-500" /></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-2 text-xs font-semibold">
        {hasRole('cashier', 'admin') && (
          <button
            onClick={() => setActiveTab('record')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'record'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('fees.record_payment')}
          </button>
        )}

        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-3.5 py-2 rounded-xl transition ${
            activeTab === 'receipts'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {t('fees.receipt_history')}
        </button>

        {hasRole('cashier', 'admin') && (
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'unpaid'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('fees.unpaid_list')}
          </button>
        )}

        {hasRole('cashier', 'admin') && (
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'daily'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('fees.daily_summary')}
          </button>
        )}

        {hasRole('admin', 'reception') && (
          <button
            onClick={() => setActiveTab('free')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'free'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('fees.free_students')}
          </button>
        )}

        {hasRole('admin') && (
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'plans'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('fees.fee_plans')}
          </button>
        )}
      </div>

      {/* TAB 1: RECORD PAYMENT */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-700" />
              <span>Record Fee Payment</span>
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Enrolled Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="">Choose a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.registration_number}) - {s.level_code} ({s.session_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Banner for Student */}
              {studentFeeInfo && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>Expected Fee: {studentFeeInfo.base_monthly_amount} ETB / month</span>
                    {studentFeeInfo.is_free_student && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                        {t('fees.free_student_badge')} (0 ETB)
                      </span>
                    )}
                    {studentFeeInfo.is_free_pending && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                        {t('fees.free_pending_badge')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Level: {studentFeeInfo.student.level_name} • Session: {studentFeeInfo.student.session_name}
                  </div>
                </div>
              )}

              {/* Amount and Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('fees.amount')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 500.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('fees.payment_method')} *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="cash">{t('fees.cash')}</option>
                    <option value="e_birr">{t('fees.e_birr')}</option>
                    <option value="cbe">{t('fees.cbe')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('fees.reference_number')}
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Transaction ID / slip number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('fees.payment_date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Month Allocation */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  {t('fees.months_to_cover')} (Select one or more)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-xs">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                    const isSelected = selectedMonths.includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => toggleMonth(m)}
                        className={`py-1.5 px-2 rounded-lg font-semibold border transition ${
                          isSelected
                            ? 'bg-brand-700 border-brand-700 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Month {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingPayment || !selectedStudentId}
                  className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submittingPayment ? t('common.loading') : 'Save & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Receipt Preview Panel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-brand-700" />
                <span>Last Issued Receipt</span>
              </h4>

              {justRecordedReceipt ? (
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-3 text-xs">
                  <div className="text-center pb-2 border-b border-gray-200">
                    <div className="font-bold text-sm text-brand-900">Kunuuzul-Jannaa-Markaz</div>
                    <div className="text-[11px] text-gray-500 font-mono font-bold">
                      {justRecordedReceipt.receipt_number}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Student:</span>
                      <span className="font-semibold text-gray-900">{justRecordedReceipt.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reg No:</span>
                      <span className="font-mono text-gray-800">{justRecordedReceipt.registration_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {justRecordedReceipt.amount} ETB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span className="uppercase font-semibold">{justRecordedReceipt.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>{formatDateWithPref(justRecordedReceipt.payment_date)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingReceipt(justRecordedReceipt)}
                    className="w-full mt-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View / Print Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400 italic">
                  Record a payment to preview and print its official receipt.
                </div>
              )}
            </div>

            <div className="pt-4 text-[11px] text-gray-400 border-t border-gray-100">
              * Receipt numbers are sequentially issued by the server and cannot be reused.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS & PAYMENT HISTORY */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder="Search receipt #, student name, or reference ID..."
                className="w-full ps-9 pe-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Search className="w-4 h-4 absolute start-3 top-2.5 text-gray-400" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Methods</option>
                <option value="cash">{t('fees.cash')}</option>
                <option value="e_birr">{t('fees.e_birr')}</option>
                <option value="cbe">{t('fees.cbe')}</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-4 py-3 text-start">{t('fees.receipt_number')}</th>
                    <th className="px-4 py-3 text-start">Student</th>
                    <th className="px-4 py-3 text-start">{t('fees.amount')}</th>
                    <th className="px-4 py-3 text-start">{t('fees.payment_method')}</th>
                    <th className="px-4 py-3 text-start">{t('fees.payment_date')}</th>
                    <th className="px-4 py-3 text-start">{t('fees.received_by')}</th>
                    <th className="px-4 py-3 text-start">{t('common.status')}</th>
                    <th className="px-4 py-3 text-end">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingPayments ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        {t('common.no_data')}
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-brand-800 text-xs">
                          {p.receipt_number}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{p.student_name}</div>
                          <div className="text-[11px] text-gray-500">{p.registration_number}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {parseFloat(p.amount).toFixed(2)} ETB
                        </td>
                        <td className="px-4 py-3 uppercase text-xs font-semibold text-gray-700">
                          {p.payment_method}
                          {p.reference_number && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              Ref: {p.reference_number}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDateWithPref(p.payment_date)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.received_by_name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.is_reversed
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {p.is_reversed ? t('fees.reversed') : 'Valid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setViewingReceipt(p)}
                              className="p-1.5 text-gray-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {hasRole('admin') && !p.is_reversed && (
                              <button
                                onClick={() => handleOpenReverse(p)}
                                className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title={t('fees.reverse')}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNPAID STUDENTS LIST */}
      {activeTab === 'unpaid' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  School Month
                </label>
                <select
                  value={unpaidMonth}
                  onChange={(e) => setUnpaidMonth(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>Month {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Filter Level
                </label>
                <select
                  value={unpaidLevelId}
                  onChange={(e) => setUnpaidLevelId(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="">All Levels</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.code} - {l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-end">
              <div className="text-[11px] text-amber-800 font-bold uppercase">Total Outstanding</div>
              <div className="text-xl font-extrabold text-amber-900">
                {parseFloat(unpaidData.total_unpaid_amount || 0).toFixed(2)} ETB
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-4 py-3 text-start">Student</th>
                    <th className="px-4 py-3 text-start">Level & Session</th>
                    <th className="px-4 py-3 text-start">Guardian Contact</th>
                    <th className="px-4 py-3 text-start">Expected Fee</th>
                    <th className="px-4 py-3 text-start">Paid</th>
                    <th className="px-4 py-3 text-start">Balance Due</th>
                    <th className="px-4 py-3 text-start">Free Status Note</th>
                    <th className="px-4 py-3 text-end">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingUnpaid ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : unpaidData.students?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        No unpaid balances for this month!
                      </td>
                    </tr>
                  ) : (
                    unpaidData.students?.map((row) => (
                      <tr key={row.student_id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {row.full_name}
                          <div className="text-[11px] text-gray-500 font-mono">{row.registration_number}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.level_code}
                          <div className="text-[11px] text-gray-500">{row.session_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-medium">{row.guardian_name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{row.guardian_phone}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.expected_amount} ETB</td>
                        <td className="px-4 py-3 text-gray-700">{row.amount_paid} ETB</td>
                        <td className="px-4 py-3 font-bold text-red-700">
                          {row.balance_due} ETB
                        </td>
                        <td className="px-4 py-3">
                          {row.free_status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Pending Free Approval
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <button
                            onClick={() => {
                              setSelectedStudentId(String(row.student_id));
                              setActiveTab('record');
                            }}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-xs font-semibold transition"
                          >
                            Pay Now
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY CASHIER SUMMARY */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-700" />
              <span className="font-bold text-sm text-gray-900">Summary Date:</span>
              <input
                type="date"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="text-xs text-gray-500">
              Active Display Calendar: <strong>{formatDateWithPref(summaryDate)}</strong>
            </div>
          </div>

          {dailySummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Income</span>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {parseFloat(dailySummary.total_amount).toFixed(2)} ETB
                </h3>
                <div className="mt-2 text-xs text-gray-500">
                  {dailySummary.total_receipts} receipts issued
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-emerald-700 uppercase">{t('fees.cash')}</span>
                <h3 className="text-2xl font-bold text-emerald-800 mt-1">
                  {dailySummary.breakdown.cash.amount.toFixed(2)} ETB
                </h3>
                <div className="mt-2 text-xs text-gray-500">
                  {dailySummary.breakdown.cash.count} receipts
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-blue-700 uppercase">{t('fees.e_birr')}</span>
                <h3 className="text-2xl font-bold text-blue-800 mt-1">
                  {dailySummary.breakdown.e_birr.amount.toFixed(2)} ETB
                </h3>
                <div className="mt-2 text-xs text-gray-500">
                  {dailySummary.breakdown.e_birr.count} receipts
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-purple-700 uppercase">{t('fees.cbe')}</span>
                <h3 className="text-2xl font-bold text-purple-800 mt-1">
                  {dailySummary.breakdown.cbe.amount.toFixed(2)} ETB
                </h3>
                <div className="mt-2 text-xs text-gray-500">
                  {dailySummary.breakdown.cbe.count} receipts
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FREE STUDENT APPROVALS WORKFLOW */}
      {activeTab === 'free' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-500">
              Rule: Reception creates free requests with written reason. General Manager reviews and approves or rejects.
            </p>
            {hasRole('reception', 'admin') && (
              <button
                onClick={() => setIsNewFreeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('fees.request_free')}</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-start">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-4 py-3 text-start">Student</th>
                    <th className="px-4 py-3 text-start">Written Reason</th>
                    <th className="px-4 py-3 text-start">Requested By</th>
                    <th className="px-4 py-3 text-start">Status</th>
                    <th className="px-4 py-3 text-start">Approved By</th>
                    <th className="px-4 py-3 text-end">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {freeRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No free student requests recorded.
                      </td>
                    </tr>
                  ) : (
                    freeRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {req.student_name}
                          <div className="text-[11px] text-gray-500 font-mono">{req.registration_number}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs">{req.reason}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{req.requested_by_name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {req.approved_by_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-end">
                          {hasRole('admin') && req.status === 'pending' && (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleDecideFreeRequest(req.id, 'approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                              >
                                {t('fees.approve')}
                              </button>
                              <button
                                onClick={() => handleDecideFreeRequest(req.id, 'rejected')}
                                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold"
                              >
                                {t('fees.reject')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FEE PLANS */}
      {activeTab === 'plans' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-bold text-sm text-gray-900">
            Official Markaz Monthly Fee Plans
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-start">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3 text-start">Level</th>
                  <th className="px-4 py-3 text-start">Session</th>
                  <th className="px-4 py-3 text-start">Type</th>
                  <th className="px-4 py-3 text-start">Monthly Amount</th>
                  <th className="px-4 py-3 text-start">Valid From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feePlans.map((fp) => (
                  <tr key={fp.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-bold text-gray-900">{fp.level_code} - {fp.level_name}</td>
                    <td className="px-4 py-3 text-gray-700">{fp.session_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        fp.is_boarding ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {fp.is_boarding ? 'Boarding' : 'Day'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-800">{fp.monthly_amount} ETB</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDateWithPref(fp.valid_from)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Printable Receipt View */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="font-bold text-sm text-gray-500 uppercase tracking-wider">
                Official Payment Receipt
              </span>
              <button onClick={() => setViewingReceipt(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-5 bg-gray-50/50 border border-gray-200 rounded-xl space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-brand-900">Kunuuzul-Jannaa-Markaz</h3>
                <p className="text-[11px] text-gray-500">Quran Memorization School</p>
                <div className="mt-2 font-mono font-bold text-sm text-brand-800">
                  {viewingReceipt.receipt_number}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Student Name:</span>
                  <span className="font-bold text-gray-900">{viewingReceipt.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registration No:</span>
                  <span className="font-mono">{viewingReceipt.registration_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Level:</span>
                  <span>{viewingReceipt.level_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Date:</span>
                  <span>{formatDateWithPref(viewingReceipt.payment_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="uppercase font-semibold">{viewingReceipt.payment_method}</span>
                </div>
                {viewingReceipt.reference_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ref / Txn ID:</span>
                    <span className="font-mono">{viewingReceipt.reference_number}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                  <span className="font-bold text-gray-800">Total Amount:</span>
                  <span className="font-extrabold text-emerald-800">
                    {parseFloat(viewingReceipt.amount).toFixed(2)} ETB
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Received By:</span>
                  <span>{viewingReceipt.received_by_name || user?.full_name}</span>
                </div>
              </div>

              {viewingReceipt.is_reversed && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] font-semibold text-center">
                  VOID - REVERSED ({viewingReceipt.reversal_reason})
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{t('fees.print_receipt')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reversal Reason (Admin only) */}
      {isReverseModalOpen && reversalTarget && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{t('fees.reverse')}</h3>
              <button onClick={() => setIsReverseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Reversing receipt <strong>{reversalTarget.receipt_number}</strong> for student {reversalTarget.student_name}.
              This action cannot be undone and will be logged in the audit trail.
            </p>

            {reversalError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {reversalError}
              </div>
            )}

            <form onSubmit={handleConfirmReverse} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('fees.reversal_reason')} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Explain why this payment is being reversed (e.g. entered wrong amount, duplicate entry)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReverseModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Free Student Status */}
      {isNewFreeModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{t('fees.request_free')}</h3>
              <button onClick={() => setIsNewFreeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFreeRequest} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={freeStudentId}
                  onChange={(e) => setFreeStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="">Choose a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('fees.written_reason')} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={freeReason}
                  onChange={(e) => setFreeReason(e.target.value)}
                  placeholder="Provide background context (e.g. orphan, financial hardship, sponsored family)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewFreeModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
