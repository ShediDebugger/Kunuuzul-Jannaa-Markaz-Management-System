import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import GuardiansPage from './pages/GuardiansPage';
import ClassesPage from './pages/ClassesPage';
import TeachersPage from './pages/TeachersPage';
import FeesPage from './pages/FeesPage';
import MigrationPage from './pages/MigrationPage';
import AuditLogPage from './pages/AuditLogPage';
import BackupPage from './pages/BackupPage';
import AttendancePage from './pages/AttendancePage';
import QuranProgressPage from './pages/QuranProgressPage';
import GradesPage from './pages/GradesPage';
import PromotionsPage from './pages/PromotionsPage';
import ReportsPage from './pages/ReportsPage';
import SupportersPage from './pages/SupportersPage';
import PortalPage from './pages/PortalPage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Main Authenticated Layout
function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <UsersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Phase 2: Students, Guardians, Levels, Teachers */}
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['admin', 'reception', 'parent', 'student', 'teacher']}>
                  <MainLayout>
                    <StudentsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/guardians"
              element={
                <ProtectedRoute allowedRoles={['admin', 'reception']}>
                  <MainLayout>
                    <GuardiansPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={['admin', 'reception']}>
                  <MainLayout>
                    <ClassesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'reception']}>
                  <MainLayout>
                    <TeachersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Phase 3: Fees and Payments */}
            <Route
              path="/fees"
              element={
                <ProtectedRoute allowedRoles={['admin', 'cashier', 'parent', 'reception']}>
                  <MainLayout>
                    <FeesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Phase 4: Migration, Audit Log, Backup */}
            <Route
              path="/migration"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <MigrationPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <AuditLogPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/backup"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <BackupPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Phase 5: Attendance, Quran Progress, Grades & Report Cards */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'parent', 'student', 'reception']}>
                  <MainLayout>
                    <AttendancePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quran-progress"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'parent', 'student', 'reception']}>
                  <MainLayout>
                    <QuranProgressPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/grades"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'parent', 'student', 'reception']}>
                  <MainLayout>
                    <GradesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Phase 6: Promotions & Reports */}
            <Route
              path="/promotions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <PromotionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/supporters"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supporter']}>
                  <MainLayout>
                    <SupportersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/portal"
              element={
                <ProtectedRoute allowedRoles={['admin', 'parent', 'student']}>
                  <MainLayout>
                    <PortalPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supporter', 'reception']}>
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
