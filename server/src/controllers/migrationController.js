const migrationService = require('../services/migrationService');
const backupService = require('../services/backupService');
const auditQueryService = require('../services/auditQueryService');
const { successResponse, errorResponse } = require('../utils/response');

const previewMigration = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse(res, 'No data rows provided for preview', 400);
    }
    const result = await migrationService.validateMigrationData(rows);
    return successResponse(res, result, 'Data parsed and validated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const executeMigration = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { validRows } = req.body;
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return errorResponse(res, 'No valid rows to import', 400);
    }
    const result = await migrationService.executeBatchImport(validRows, req.user.id, ipAddress);
    return successResponse(res, result, 'Batch migration completed successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { table_name, action, user_id, search, page, limit } = req.query;
    const logs = await auditQueryService.getAuditLogs({
      table_name,
      action,
      user_id,
      search,
      page,
      limit,
    });
    return successResponse(res, logs, 'Audit trail logs retrieved');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createBackup = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const backup = await backupService.generateDatabaseBackup(req.user.id, ipAddress);
    return successResponse(res, backup, 'Database backup generated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const exportData = async (req, res) => {
  try {
    const { dataset } = req.params; // 'students' or 'payments'
    const data = await backupService.exportToCsv(dataset);
    return successResponse(res, data, `${dataset} exported successfully`);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  previewMigration,
  executeMigration,
  getAuditLogs,
  createBackup,
  exportData,
};
