# Kunuuzul-Jannaa-Markaz Management System: General Developer Manual

**Prepared by:** Shedi  
**Version:** 0.3 (draft for review)  
**Date:** November 14, 2026  
> *Note:* Items marked **[TO CONFIRM]** are assumptions that must be checked with the Markaz and corrected in the next version.

---

## 1. Purpose and Scope

### Purpose
Digitize the daily work of **Kunuuzul-Jannaa-Markaz**, a Quran memorization school, in one modern web system: registration, classes, attendance, Quran progress, monthly fees, reports, and communication with parents and supporters.

### Goals
- Replace the two Excel files (registration and monthly payments) with one connected system.
- Remove repeated typing and inconsistent data.
- Give each person only the screens they need.
- Work on computers, tablets, and phones, in English, Arabic, and Afaan Oromo, with a switchable Ethiopian or Hijri calendar.

### In Scope (Version 1)
Login and roles, students and guardians, levels and sections, teachers, attendance, fees and payments, Quran progress, grades, promotion, reports, settings, audit log, backup, Excel import and export.

### Out of Scope (For Now)
Online payment gateways, SMS sending, mobile apps, biometric attendance. These can be added later as agreed extensions.

---

## 2. Users and Roles

| Role | Main Purpose | Can | Cannot |
| :--- | :--- | :--- | :--- |
| **Admin / General Manager** | Controls the system | Everything, including users, settings, fee plans, reports, and approval of free students | Delete payments (reversal only) |
| **Reception** | Registers students | Add and edit students and guardians, search, record a free-student request with its reason | See financial reports, change fees |
| **Teacher** | Teaches and records | Mark attendance, record Quran progress, enter marks for own sections | Edit other sections, see payments |
| **Cashier** | Handles money | Record payments, print receipts, see unpaid list | Edit student records, change fee plans |
| **Parent** | Follows their children | View own children: attendance, progress, balance, receipts | Edit anything |
| **Student** | Follows own progress | View own attendance and progress | Edit anything |
| **Financial Supporter** | Follows support given | View all supporters' donations, the school's general achievements, and reports | See student personal data |

> **Security Rule:** Access is decided by the backend on every request. Hiding a button in the screen is not enough.

---

## 3. Technology and Architecture

- **Frontend:** React (Vite), React Router, Tailwind CSS, `react-i18next` for languages.
- **Backend:** Node.js with Express, REST API, `mysql2`, `bcrypt` for passwords, `jsonwebtoken` for login, `express-validator` for input checks.
- **Database:** MySQL, with schema files kept in the repository.
- **Languages:** English, Arabic, Afaan Oromo. Arabic needs right-to-left (RTL) layout. No text is written directly in screens; every label comes from a translation file.
- **Calendars:** Dates are stored once in standard (Gregorian) format. The user switches the display between Ethiopian and Hijri, the same way as the language switch. Conversion happens only when showing or reading a date.
- **Responsive Design:** Every screen must work on phone, tablet, and computer. Design for the phone first.

### Project Folders
- `client`: `src` with `pages`, `components`, `locales`, `services`
- `server`: `src` with `routes`, `controllers`, `services`, `middleware`, `config`
- `database`: `schema.sql` and `seed.sql` (fake sample data only)
- `docs`: developer manual, diagrams, user guide

### Request Flow
$$\text{Browser (React)} \longrightarrow \text{REST API (Express)} \longrightarrow \text{MySQL}$$
The API checks login, role, and input, then runs the business rule, then saves.

---

## 4. Business Rules

- **Level Path:** H-01 $\rightarrow$ H-02 $\rightarrow$ QT-03 (boys and girls together). After QT-03, boys go to QT-04 and girls go to QT-05. After QT-04, boys go to QH-06. After QT-05, girls go to QH-07. This path is stored as data in the `levels` table (`next_level_male_id`, `next_level_female_id`), not hardcoded in application logic.
- **Tracks:**
  - Huruufa: H-01, H-02
  - Qurana Tilaawa: QT-03, QT-04, QT-05
  - Qurana Hifzi: QH-06, QH-07
- **Sessions:** One shift, morning, afternoon, all day, boarding (sleeps at school) **[TO CONFIRM exact meaning of one shift]**.
- **Monthly Fee:** The amount depends on level, session, and day or boarding student. It comes from a fee plan table, not typed by hand each time.
- **Free Students:** Some students pay nothing. The receptionist first records the student as free, with a written reason, and the request stays pending. The General Manager must approve it before the student counts as free. There are no other discounts or scholarships.
- **Payments:** Payments can be partial. Each payment is recorded against one or more months. Payment methods seen in current files: cash, e-birr, CBE.
- **Guardians:** One guardian can have several students. A parent login shows all of them.
- **Status:** A student is active or inactive. Inactive students are kept for history, hidden from daily lists, and skipped in fee lists.
- **Registration Number:** Generated automatically, never reused. Old numbers from Excel are kept for migrated students.
- **No Hard Deletes:** No hard deletes of students or payments. Use status or reversal, so history stays correct.

---

## 5. Modules

*Priority Labels: **Must** (system cannot work without it), **Should** (build in a later phase), **Could** (only if time remains).*

### M1. Authentication and Roles (Must)
- **Properties:** username, password hash, role, status (active or blocked), last login.
- **Functions:** Log in, log out, change own password, admin creates users and resets passwords, menus shown by role.
- **Rules:** Passwords hashed with bcrypt; login token expires; temporary lock after repeated wrong passwords; every protected API route checks the role.

### M2. Student Registration and Records (Must)
- **Properties:** registration number (auto), full name, sex, date of birth, level, section, session, boarding (yes or no), support type (independent or family-dependent), guardian, kebele, specific place (ganda), registration date, status, current Juz, photo (Could).
- **Functions:** Register, edit, search and filter (name, number, phone, level, session, status), deactivate and reactivate, view full history.
- **Rules:** Sex, level, session, and support type are dropdowns with fixed values; age is calculated from date of birth; warn when name, date of birth, and guardian phone match an existing student; every edit is written to the audit log.

### M3. Guardians (Must)
- **Properties:** full name, primary phone, second phone (optional), relationship to student **[TO CONFIRM]**, address, linked parent account (optional).
- **Functions:** Add, edit, link several students, find by phone.
- **Rules:** Phone numbers use one standard format; a guardian cannot be deleted while linked to a student.

### M4. Levels, Sections, Sessions and Academic Years (Must)
- **Properties:** level code, level name, track, next level for male, next level for female; section name (e.g., A and B) **[TO CONFIRM]**; session name; academic year with start and end.
- **Functions:** Admin creates and edits these lists; assign students to sections.
- **Rules:** A level cannot be removed while students use it; only one academic year is current.

### M5. Teachers (Must)
- **Properties:** full name, sex, phone, linked user account, assigned sections, status.
- **Functions:** Add, edit, assign to sections, deactivate.
- **Rules:** A teacher sees and edits only the sections assigned to them.

### M6. Attendance (Should)
- **Properties:** student, date, status (present, absent, late, excused), recorded by, note.
- **Functions:** Mark a whole section in one screen, correct the same day, view per student and per section, monthly summary.
- **Rules:** One record per student per date; teachers mark only their sections; changes after the day are logged.

### M7. Fees and Payments (Must)
- **Properties:**
  - *Fee plan:* level, session, boarding, monthly amount, valid from.
  - *Payment:* student, amount, method, payment date, receipt number (auto), reference number for e-birr or bank, received by.
  - *Payment months:* which month each part of a payment covers.
  - *Free status:* requested by, reason, approved by, status (pending, approved, rejected), dates.
- **Functions:** Record a full or partial payment, print receipt, show balance, unpaid list per month, payment history per student, daily cashier summary, manager approves or rejects free-student requests.
- **Rules:** Amount must be greater than zero; receipt numbers run in sequence; a payment is never deleted, only reversed by an admin with a reason; approved free students are excluded from unpaid lists, while a pending request stays on the list marked pending **[TO CONFIRM]**; payments are recorded by cashier and admin only; free-student requests are created by reception and approved by admin only.

### M8. Quran Progress (Should)
- **Properties:** student, date, type (new memorization, revision, recitation), from and to (Juz, surah, or page **[TO CONFIRM unit]**), evaluation, teacher, note.
- **Functions:** Add an entry, view history, current Juz updates automatically, progress summary per student and per section.
- **Rules:** Only the student's teacher or admin may add entries; entries are corrected by a new entry or an edit that is logged.

### M9. Grades and Report Cards (Should)
- **Properties:** student, subject **[TO CONFIRM]**, term, marks for mid, assignment, quiz, test, and final (numbers only), total out of 100 (calculated), letter grade from A+ to F (calculated), teacher, remark.
- **Functions:** Teachers enter the five marks as numbers, the system calculates the total and the letter grade automatically, view results per student and per section, print report card.
- **Rules:** Teachers type numbers only and never the letter; each mark is limited to its maximum **[TO CONFIRM maximums]**; the letter comes from a grade scale kept in settings **[TO CONFIRM which marks give which letter]**; marks are locked after the term is closed; only the student's teacher or admin may enter or change marks, and every change is logged.

### M10. Promotion (Should)
- **Properties:** student, from level, to level, academic year, decision (promoted, repeated, left), date.
- **Functions:** Generate the proposed list at year end using the level path, admin reviews and overrides, confirm in bulk, keep the history.
- **Rules:** Boys and girls follow different next levels after QT-03; inactive students are skipped; nothing changes until the admin confirms.

### M11. Parent and Student Portal (Should)
- **Properties:** Uses existing users, students, and guardians.
- **Functions:** Parent sees each child's attendance, progress, balance, and receipts; student sees own attendance and progress.
- **Rules:** Read-only; a parent sees only their own children.

### M12. Supporters and Donations (Could)
- **Properties:** Supporter name, organization, contact; donation amount, date, method, purpose, note. Donations are general and are never linked to a specific student.
- **Functions:** Record donations, supporter report, total support per period, view the school's general achievements and reports.
- **Rules:** A supporter sees all supporters' donations, the school's general achievements, and reports, but no student personal data.

### M13. Reports and Dashboard (Should; basic reports are Must)
- **Dashboard for the General Manager:** Total students, boys and girls, students per level and session, income this month, unpaid total.
- **Reports:** Student list, per level, per session, unpaid fees per month, income by period and method, attendance summary, Quran progress summary, grade summary, general achievements summary for supporters **[TO CONFIRM what counts as achievements]**.
- **Functions:** Filters, export to Excel and PDF.

### M14. Settings (Must)
- **Properties:** School name and logo, languages, calendar choice, academic year, fee plans, sessions, payment methods.
- **Functions:** Language switch and calendar switch (saved per user), admin edits lists.

### M15. Audit Log, Backup, Import and Export (Must for audit; Should for the rest)
- **Audit Log Properties:** User, action, table, record, old value, new value, time. Required for all payment and student changes.
- **Backup:** Automatic scheduled database backup, with a tested restore.
- **Import:** Read the current Excel files with a preview and an error report, so bad rows are fixed before saving.
- **Export:** Any list or report to Excel and PDF.

---

## 6. Moving Data from the Excel Files

| Old Column | New Place | Note |
| :--- | :--- | :--- |
| Full name | student full name | Trim extra spaces |
| Registration no. (L/G) | registration number | Kept for old students |
| Sex (SAALA) | sex | Map F, M, dhala, dhira to two values |
| Age (UMRI) | date of birth | Ask for date of birth; estimate if unknown |
| Class (KUTAA) | level | Map spelling variations to the seven levels |
| Juz (JUZA) | current Juz | Number |
| Guardian (MAQAA WABII) | guardian name and phone | Create one guardian per phone, link siblings |
| Kebele (AANAA), place (GANDA) | kebele, specific place | Text |
| Independent or family-dependent | support type | Fixed list |
| Registration date | registration date | Convert from Ethiopian calendar |
| Session (YEROO) | session and boarding | Map all values |
| Fee (KAFFALTI) | fee plan, free flag | Amount comes from the plan; check differences |
| Payment method | payment method | Cash, e-birr, CBE |
| Class code (COOD) | not stored | Derived from the level |
| Active or inactive (B/J) | status | Fixed list |
| Payment date and amount per month | payments and payment months | One row per payment |

> **Development Notice:** Use only fake data while developing. The real data is loaded only on the Markaz system at go-live, and the Excel files are never placed in a shared repository.

---

## 7. Non-Functional Requirements

- **Security:** Hashed passwords, HTTPS when hosted, role checks on every route, parameterized queries only, no secrets in the repository.
- **Privacy:** The system holds children's data and guardians' phone numbers; only the roles that need it can see it.
- **Usability:** Simple screens, large buttons, clear error messages, each common task in as few steps as possible.
- **Reliability:** Daily backup, tested restore, errors logged.
- **Performance:** Lists are paged and searchable; main screens open in under 3 seconds on a normal connection **[TO CONFIRM the Markaz's internet]**.
- **Compatibility:** Current Chrome, Edge, and Firefox on computers; Chrome and Safari on phones and tablets.

---

## 8. Development Standards

- **Database:** Table and column names in `snake_case`, plural table names, a primary key `id` on every table, foreign keys with clear rules.
- **API:** REST paths like `/api/students`, one consistent response shape (`{ success: boolean, data: any, message: string }`), proper status codes.
- **Code:** One controller per module, business rules in services, no business rules in screens.
- **Version Control:** Small commits with clear messages, one branch per module.
- **Testing:** Test every business rule with at least one normal and one wrong input.
- **Documentation:** Update this manual whenever a rule or property changes, and record it in the change log.

---

## 9. Development Roadmap

| Phase | Content | Result |
| :---: | :--- | :--- |
| **0** | Analysis and this manual | Agreed requirements |
| **1** | Project setup, database, M1 login and roles, M14 languages and calendar base | Secure login, working language switch |
| **2** | M4, M3, M2, M5 | Students, guardians, levels, teachers |
| **3** | M7 fees and payments, receipts, unpaid list | Cashier can replace the payment Excel file |
| **4** | M15 import and audit, then first delivery and review | Real data migrated, Markaz tests it |
| **5** | M6 attendance, M8 Quran progress, M9 grades | Daily teaching work digital |
| **6** | M13 reports, M10 promotion | Manager dashboard, year-end process |
| **7** | M11 portal, M12 supporters | Parents and supporters connected |
| **8** | Testing, security review, hosting, backup, user guide, staff training | Final delivery |

> *Strategic Goal: Deliver after Phase 4 first. A working core in the Markaz's hands is better than a perfect system delivered late.*

---

## 10. Open Questions for the Markaz

1. Meaning of the session values, especially "one shift", and any difference from morning and afternoon.
2. Free students: can the manager reject or later withdraw a free status, and does it apply for a set period?
3. Does QH-07 exist yet, and where is it recorded?
4. Are the extra sheets (*Eybif 03A*, *Ganama2*, *03 B*) parallel sections of the same level?
5. Which month starts the school year, and what is month 6?
6. How is Quran progress measured: Juz, surah, page, or lines?
7. Grades: what is the maximum for each of mid, assignment, quiz, test, and final (adding up to 100), which marks give each letter from A+ to F, what is the pass mark, which subjects are graded, and should parents and students see grades in their portal?
8. Supporters: which achievements and reports should they see (e.g., student numbers, Quran completions, income and spending), and may donor names be shown to other supporters?
9. How many computers, cashiers, and teachers will use the system, and is the internet reliable?
10. Where will the system be hosted, and what are the agreed price and deadline?

---

## 11. Change Log

| Version | Date | Change |
| :---: | :--- | :--- |
| **0.1** | November 14, 2026 | First general manual from requirements gathered and the two Excel files |
| **0.2** | November 14, 2026 | Free students need a reception request with reason plus manager approval; supporters give general donations only |
| **0.3** | November 14, 2026 | Grades module defined (five numeric marks, automatic letter A+ to F); supporters see all donations, school achievements, and reports |
