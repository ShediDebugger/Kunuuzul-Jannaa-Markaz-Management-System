-- Kunuuzul-Jannaa-Markaz Management System
-- Database Schema (Version 0.3)
-- Standards: snake_case, plural table names, primary key id on every table

CREATE DATABASE IF NOT EXISTS kjm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kjm_system;

-- 1. Users and Authentication (M1)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'reception', 'teacher', 'cashier', 'parent', 'student', 'supporter') NOT NULL,
    status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Audit Logs (M15)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Academic Years (M4)
CREATE TABLE IF NOT EXISTS academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Levels & Tracks (M4)
CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    track ENUM('Huruufa', 'Qurana Tilaawa', 'Qurana Hifzi') NOT NULL,
    next_level_male_id INT NULL,
    next_level_female_id INT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_level_next_male FOREIGN KEY (next_level_male_id) REFERENCES levels(id) ON DELETE SET NULL,
    CONSTRAINT fk_level_next_female FOREIGN KEY (next_level_female_id) REFERENCES levels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Sessions (M4)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    is_boarding BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Sections (M4)
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_id INT NOT NULL,
    session_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_section_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_section_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_section_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_section (academic_year_id, level_id, session_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Teachers (M5)
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    sex ENUM('male', 'female') NOT NULL,
    phone VARCHAR(30) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Teacher Assigned Sections (M5)
CREATE TABLE IF NOT EXISTS teacher_sections (
    teacher_id INT NOT NULL,
    section_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (teacher_id, section_id),
    CONSTRAINT fk_ts_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Guardians (M3)
CREATE TABLE IF NOT EXISTS guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    primary_phone VARCHAR(30) NOT NULL,
    secondary_phone VARCHAR(30) NULL,
    relationship VARCHAR(50) NULL,
    address VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_guardian_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_guardian_phone (primary_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Students (M2)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    sex ENUM('male', 'female') NOT NULL,
    date_of_birth DATE NOT NULL,
    level_id INT NOT NULL,
    section_id INT NULL,
    session_id INT NOT NULL,
    is_boarding BOOLEAN NOT NULL DEFAULT FALSE,
    support_type ENUM('independent', 'family_dependent') NOT NULL DEFAULT 'family_dependent',
    guardian_id INT NOT NULL,
    user_id INT NULL UNIQUE,
    kebele VARCHAR(100) NULL,
    specific_place VARCHAR(100) NULL,
    registration_date DATE NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    current_juz INT NOT NULL DEFAULT 1,
    current_page INT NOT NULL DEFAULT 1,
    current_surah VARCHAR(100) NULL DEFAULT 'Al-Faatiha',
    current_ayah INT NOT NULL DEFAULT 1,
    photo_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    CONSTRAINT fk_student_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_status (status),
    INDEX idx_student_reg_no (registration_number),
    INDEX idx_student_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Fee Plans (M7)
CREATE TABLE IF NOT EXISTS fee_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_id INT NOT NULL,
    session_id INT NOT NULL,
    is_boarding BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_amount DECIMAL(10, 2) NOT NULL,
    valid_from DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fee_plan_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fee_plan_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_fee_plan (level_id, session_id, is_boarding, valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Free Student Requests (M7)
CREATE TABLE IF NOT EXISTS free_student_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by INT NULL,
    decision_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fsr_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fsr_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fsr_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_fsr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Payments (M7)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'e_birr', 'cbe') NOT NULL,
    reference_number VARCHAR(100) NULL,
    payment_date DATE NOT NULL,
    received_by INT NOT NULL,
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_reason TEXT NULL,
    reversed_by INT NULL,
    reversed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_receiver FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_reverser FOREIGN KEY (reversed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_receipt (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Payment Covered Months (M7)
CREATE TABLE IF NOT EXISTS payment_months (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    month_number INT NOT NULL,
    amount_allocated DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_pm_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    INDEX idx_pm_year_month (academic_year_id, month_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Attendance (M6)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    recorded_by INT NOT NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE RESTRICT,
    CONSTRAINT fk_att_recorder FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_student_attendance_date (student_id, date),
    INDEX idx_attendance_date (date),
    INDEX idx_attendance_section (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Quran Progress (M8)
CREATE TABLE IF NOT EXISTS quran_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    type ENUM('new_memorization', 'revision', 'recitation') NOT NULL,
    page_number INT NOT NULL,
    surah_name VARCHAR(100) NOT NULL,
    surah_number INT NULL,
    ayah_number INT NOT NULL,
    from_page INT NULL,
    to_page INT NULL,
    from_ayah INT NULL,
    to_ayah INT NULL,
    from_unit VARCHAR(100) NULL,
    to_unit VARCHAR(100) NULL,
    juz_number INT NULL,
    evaluation ENUM('Mumtaz', 'Jayyid Jiddan', 'Jayyid', 'Maqbool', 'Daif') NULL,
    teacher_id INT NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qp_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_qp_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    INDEX idx_qp_student (student_id),
    INDEX idx_qp_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Grades & Report Cards (M9)
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    term VARCHAR(50) NOT NULL,
    academic_year_id INT NOT NULL,
    mid_mark DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    assignment_mark DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    quiz_mark DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    test_mark DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    final_mark DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_mark DECIMAL(5,2) GENERATED ALWAYS AS (mid_mark + assignment_mark + quiz_mark + test_mark + final_mark) STORED,
    letter_grade VARCHAR(5) NULL,
    teacher_id INT NOT NULL,
    remark TEXT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_grade_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    CONSTRAINT fk_grade_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_student_grade_term (student_id, academic_year_id, term, subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Promotion History (M10)
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    from_level_id INT NOT NULL,
    to_level_id INT NULL,
    academic_year_id INT NOT NULL,
    decision ENUM('promoted', 'repeated', 'left') NOT NULL,
    decision_date DATE NOT NULL,
    decided_by INT NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_promo_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_promo_from_level FOREIGN KEY (from_level_id) REFERENCES levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_promo_to_level FOREIGN KEY (to_level_id) REFERENCES levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_promo_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    CONSTRAINT fk_promo_decider FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Supporters & Donations (M12)
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supporter_name VARCHAR(150) NOT NULL,
    organization VARCHAR(150) NULL,
    contact VARCHAR(100) NULL,
    amount DECIMAL(12, 2) NOT NULL,
    donation_date DATE NOT NULL,
    method VARCHAR(50) NOT NULL,
    purpose VARCHAR(255) NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_donation_date (donation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. System Settings (M14)
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
