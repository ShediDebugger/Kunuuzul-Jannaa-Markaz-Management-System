const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Get all system settings as a key-value map
 */
const getSettings = async () => {
  const [rows] = await pool.query('SELECT setting_key, setting_value, description FROM settings');
  const settingsMap = {};
  rows.forEach((row) => {
    settingsMap[row.setting_key] = row.setting_value;
  });
  return {
    raw: rows,
    map: settingsMap,
  };
};

/**
 * Update or insert a setting
 */
const updateSetting = async (key, value, userId, ipAddress) => {
  const [existing] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
  const oldValue = existing.length > 0 ? existing[0].setting_value : null;

  await pool.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [key, value, value]
  );

  await logAudit({
    userId,
    action: 'UPDATE_SETTING',
    tableName: 'settings',
    oldValues: { [key]: oldValue },
    newValues: { [key]: value },
    ipAddress,
  });

  return { key, value };
};

/**
 * Update multiple settings at once
 */
const updateMultipleSettings = async (settingsObject, userId, ipAddress) => {
  const updated = [];
  for (const [key, value] of Object.entries(settingsObject)) {
    await updateSetting(key, String(value), userId, ipAddress);
    updated.push({ key, value });
  }
  return updated;
};

module.exports = {
  getSettings,
  updateSetting,
  updateMultipleSettings,
};
