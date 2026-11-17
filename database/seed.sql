-- Kunuuzul-Jannaa-Markaz Management System
-- Seed Data (Sample / Test Data Only)
-- Note: Passwords for all seeded users are "<role>123", e.g., admin123, reception123, teacher123, cashier123, parent123, student123, supporter123

USE kjm_system;

-- 1. System Settings (M14)
INSERT INTO settings (setting_key, setting_value, description) VALUES
('school_name', 'Kunuuzul-Jannaa-Markaz', 'Name of the Markaz institution'),
('default_language', 'en', 'Default system language (en, ar, om)'),
('default_calendar', 'ethiopian', 'Default display calendar (gregorian, ethiopian, hijri)'),
('current_academic_year', '2026-2027', 'Active academic year'),
('phone_contact', '+251911234567', 'Official school contact phone'),
('address', 'Addis Ababa, Ethiopia', 'School physical address')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 2. Academic Years (M4)
INSERT INTO academic_years (id, name, start_date, end_date, is_current) VALUES
(1, '2026-2027', '2026-09-01', '2027-06-30', TRUE)
ON DUPLICATE KEY UPDATE is_current = VALUES(is_current);

-- 3. Sessions (M4)
INSERT INTO sessions (id, name, description, is_boarding) VALUES
(1, 'One Shift', 'Standard single daytime shift session', FALSE),
(2, 'Morning', 'Morning session (Ganama)', FALSE),
(3, 'Afternoon', 'Afternoon session (Wabari)', FALSE),
(4, 'All Day', 'Full day study session', FALSE),
(5, 'Boarding', 'Full-time resident students (sleeps at school)', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. Levels (M4)
-- Level path: H-01 -> H-02 -> QT-03
-- After QT-03: boys -> QT-04, girls -> QT-05
-- After QT-04: boys -> QH-06
-- After QT-05: girls -> QH-07
INSERT INTO levels (id, code, name, track, next_level_male_id, next_level_female_id, description) VALUES
(1, 'H-01', 'Huruufa Level 1', 'Huruufa', NULL, NULL, 'Introductory Arabic alphabet and pronunciation'),
(2, 'H-02', 'Huruufa Level 2', 'Huruufa', NULL, NULL, 'Advanced word formation and reading practice'),
(3, 'QT-03', 'Qurana Tilaawa Level 3', 'Qurana Tilaawa', NULL, NULL, 'Quran recitation foundational level'),
(4, 'QT-04', 'Qurana Tilaawa Level 4 (Boys)', 'Qurana Tilaawa', NULL, NULL, 'Quran recitation intermediate level for boys'),
(5, 'QT-05', 'Qurana Tilaawa Level 5 (Girls)', 'Qurana Tilaawa', NULL, NULL, 'Quran recitation intermediate level for girls'),
(6, 'QH-06', 'Qurana Hifzi Level 6 (Boys)', 'Qurana Hifzi', NULL, NULL, 'Quran full memorization track for boys'),
(7, 'QH-07', 'Qurana Hifzi Level 7 (Girls)', 'Qurana Hifzi', NULL, NULL, 'Quran full memorization track for girls')
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- Update next level relationships
UPDATE levels SET next_level_male_id = 2, next_level_female_id = 2 WHERE id = 1;
UPDATE levels SET next_level_male_id = 3, next_level_female_id = 3 WHERE id = 2;
UPDATE levels SET next_level_male_id = 4, next_level_female_id = 5 WHERE id = 3;
UPDATE levels SET next_level_male_id = 6, next_level_female_id = NULL WHERE id = 4;
UPDATE levels SET next_level_male_id = NULL, next_level_female_id = 7 WHERE id = 5;
UPDATE levels SET next_level_male_id = NULL, next_level_female_id = NULL WHERE id = 6;
UPDATE levels SET next_level_male_id = NULL, next_level_female_id = NULL WHERE id = 7;

-- 5. Sections (M4)
INSERT INTO sections (id, level_id, session_id, academic_year_id, name) VALUES
(1, 1, 2, 1, 'Section A'),
(2, 1, 3, 1, 'Section B'),
(3, 2, 2, 1, 'Section A'),
(4, 3, 4, 1, 'Section A'),
(5, 4, 4, 1, 'Boys Section A'),
(6, 5, 4, 1, 'Girls Section A'),
(7, 6, 5, 1, 'Hifzi Boys Dorm A')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 6. Fee Plans (M7)
INSERT INTO fee_plans (level_id, session_id, is_boarding, monthly_amount, valid_from) VALUES
(1, 1, FALSE, 500.00, '2026-09-01'),
(1, 2, FALSE, 400.00, '2026-09-01'),
(1, 3, FALSE, 400.00, '2026-09-01'),
(2, 2, FALSE, 450.00, '2026-09-01'),
(3, 4, FALSE, 700.00, '2026-09-01'),
(4, 4, FALSE, 800.00, '2026-09-01'),
(5, 4, FALSE, 800.00, '2026-09-01'),
(6, 5, TRUE, 1500.00, '2026-09-01'),
(7, 5, TRUE, 1500.00, '2026-09-01')
ON DUPLICATE KEY UPDATE monthly_amount = VALUES(monthly_amount);

-- 7. Users (M1)
-- Default passwords:
-- admin -> admin123
-- reception -> reception123
-- teacher_ahmed -> teacher123
-- cashier -> cashier123
-- parent_fatima -> parent123
-- student_bilal -> student123
-- supporter_zayd -> supporter123
INSERT INTO users (id, username, password_hash, full_name, role, status) VALUES
(1, 'admin', '$2b$10$wTrx21/DSLvMYvxBRDsH2.5faWzA4IAPc3SCJE2bfls6bd1ngWX8C', 'Sheikh Mohammed (General Manager)', 'admin', 'active'),
(2, 'reception', '$2b$10$gLdYpuqBUyNFf0ivgGI0LujU4knn0az3pYY9vI/fYMLNZyP2EQza2', 'Amina Ibrahim', 'reception', 'active'),
(3, 'teacher_ahmed', '$2b$10$R.UXWRj7n0HO6r8cK.48ReXcaOiYcpqqYHGaUNKlTA/mWnIIu8m9u', 'Ustaz Ahmed Nur', 'teacher', 'active'),
(4, 'cashier', '$2b$10$VpYuW4sHY.tfQ0mE5ws3mulE6HaChWL96kYoBSMceChJi0Z1NPGZG', 'Khalid Abdullahi', 'cashier', 'active'),
(5, 'parent_fatima', '$2b$10$yEvM3Eu49GSvdEfMmXKy6..jLaYMd67Gzu.ZkpqIAy1bvCl9n/WKG', 'Fatima Hassan', 'parent', 'active'),
(6, 'student_bilal', '$2b$10$tAIgHtZEouYon7u6Nqy0mO1rRmRWbvljxCcP/Mc3TBwGx8wFprBnO', 'Bilal Jamal', 'student', 'active'),
(7, 'supporter_zayd', '$2b$10$i405dZ8e3kREs8FmYCGrTe0LA51kgniavFX6CFiMzwNw0TooBH8sm', 'Haji Zayd Omer', 'supporter', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 8. Teachers (M5)
INSERT INTO teachers (id, user_id, full_name, sex, phone, status) VALUES
(1, 3, 'Ustaz Ahmed Nur', 'male', '+251911000001', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Link teacher to sections (1 and 4)
INSERT IGNORE INTO teacher_sections (teacher_id, section_id) VALUES
(1, 1),
(1, 4);

-- 9. Guardians (M3)
INSERT INTO guardians (id, user_id, full_name, primary_phone, secondary_phone, relationship, address) VALUES
(1, 5, 'Fatima Hassan', '+251911999901', '+251911999902', 'Mother', 'Kebele 04, House 120')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 10. Students (M2)
INSERT INTO students (id, registration_number, full_name, sex, date_of_birth, level_id, section_id, session_id, is_boarding, support_type, guardian_id, user_id, kebele, specific_place, registration_date, status, current_juz) VALUES
(1, 'KJM-2026-0001', 'Bilal Jamal', 'male', '2014-05-12', 1, 1, 2, FALSE, 'family_dependent', 1, 6, 'Kebele 04', 'Ganda Baha', '2026-09-05', 'active', 1),
(2, 'KJM-2026-0002', 'Sumayya Jamal', 'female', '2016-08-20', 1, 1, 2, FALSE, 'family_dependent', 1, NULL, 'Kebele 04', 'Ganda Baha', '2026-09-05', 'active', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 11. Initial Audit Log Entry (M15)
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES
(1, 'SEED_INITIALIZE', 'system', 1, JSON_OBJECT('status', 'initialized', 'version', '0.3'), '127.0.0.1');
