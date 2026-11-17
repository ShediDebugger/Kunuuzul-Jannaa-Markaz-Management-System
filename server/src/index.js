require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');
const academicRoutes = require('./routes/academicRoutes');
const guardianRoutes = require('./routes/guardianRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const migrationRoutes = require('./routes/migrationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const quranProgressRoutes = require('./routes/quranProgressRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const supporterRoutes = require('./routes/supporterRoutes');
const portalRoutes = require('./routes/portalRoutes');
const { errorResponse } = require('./utils/response');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'not connected', details: err.message });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/quran-progress', quranProgressRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/supporters', supporterRoutes);
app.use('/api/portal', portalRoutes);

// 404 Handler
app.use((req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  return errorResponse(res, message, status);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`KJM Server running on port ${PORT}`));
