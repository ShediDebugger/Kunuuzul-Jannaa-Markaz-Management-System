import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  Phone,
  MapPin,
  Search,
  GraduationCap,
  X,
  CheckCircle,
  AlertCircle,
  Edit,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GuardiansPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();

  const [guardians, setGuardians] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  const fetchGuardians = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.guardians.getAll({ search: search || undefined });
      setGuardians(res.data.guardians);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message || 'Failed to load guardians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGuardians();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFullName('');
    setPrimaryPhone('');
    setSecondaryPhone('');
    setRelationship('');
    setAddress('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g) => {
    setEditingId(g.id);
    setFullName(g.full_name);
    setPrimaryPhone(g.primary_phone);
    setSecondaryPhone(g.secondary_phone || '');
    setRelationship(g.relationship || '');
    setAddress(g.address || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (g) => {
    try {
      const res = await api.guardians.getById(g.id);
      setSelectedGuardian(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load guardian details');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        await api.guardians.update(editingId, {
          full_name: fullName,
          primary_phone: primaryPhone,
          secondary_phone: secondaryPhone,
          relationship,
          address,
        });
        setSuccess('Guardian updated successfully');
      } else {
        await api.guardians.create({
          full_name: fullName,
          primary_phone: primaryPhone,
          secondary_phone: secondaryPhone,
          relationship,
          address,
        });
        setSuccess('Guardian added successfully');
      }
      setIsModalOpen(false);
      fetchGuardians();
    } catch (err) {
      setFormError(err.message || 'Failed to save guardian');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('guardians.title')}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{t('guardians.subtitle')}</p>
        </div>
        {hasRole('admin', 'reception') && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('guardians.add_guardian')}</span>
          </button>
        )}
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guardian name or phone number..."
            className="w-full ps-9 pe-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 absolute start-3 top-2.5 text-gray-400" />
        </form>
      </div>

      {/* Guardians Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-4 py-3 text-start">{t('guardians.full_name')}</th>
                <th className="px-4 py-3 text-start">{t('guardians.primary_phone')}</th>
                <th className="px-4 py-3 text-start">{t('guardians.relationship')}</th>
                <th className="px-4 py-3 text-start">{t('guardians.address')}</th>
                <th className="px-4 py-3 text-center">{t('guardians.linked_students')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : guardians.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {t('common.no_data')}
                  </td>
                </tr>
              ) : (
                guardians.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <button
                        onClick={() => handleOpenDetail(g)}
                        className="text-start hover:text-brand-800 transition"
                      >
                        {g.full_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{g.primary_phone}</span>
                      </div>
                      {g.secondary_phone && (
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {g.secondary_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.relationship || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {g.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate max-w-xs">{g.address}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenDetail(g)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 font-bold text-xs hover:bg-brand-100 transition"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{g.student_count}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1.5 text-gray-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Guardian Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? t('common.edit') : t('guardians.add_guardian')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('guardians.full_name')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('guardians.primary_phone')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+251911..."
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('guardians.secondary_phone')} (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+251..."
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('guardians.relationship')} (e.g. Father, Mother, Uncle)
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('guardians.address')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Kebele, House Number, City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guardian Details & Linked Siblings Modal */}
      {isDetailOpen && selectedGuardian && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedGuardian.full_name}</h3>
                <p className="text-xs text-gray-500">{selectedGuardian.primary_phone} • {selectedGuardian.relationship || 'Guardian'}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                {t('guardians.linked_students')} ({selectedGuardian.students?.length || 0})
              </h4>
              {selectedGuardian.students?.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                  {t('guardians.no_students')}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedGuardian.students?.map((stu) => (
                    <div
                      key={stu.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{stu.full_name}</div>
                        <div className="text-[11px] text-gray-500">
                          {stu.registration_number} • {stu.level_name} ({stu.section_name || 'No Section'})
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        stu.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {stu.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
