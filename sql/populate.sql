
/* ====================================================
   CP363 Assignment 3: Database Construction & Simple Queries
   Group 13: Employee Performance & HR Management System
   Shermeen Syeda, Luka Zivkovic
   ==================================================== */


USE cp363_a2_group13;


/* ----------------------------------------------------
 JOB_ROLE
 11 positions across 5 departments, annual salary ranges (CAD).
 ---------------------------------------------------- */


INSERT INTO JOB_ROLE (job_role_id, title, min_salary, max_salary, job_description) VALUES
(1, 'HR Manager', 85000.00, 115000.00, 'Leads the HR team and oversees hiring and policies'),
(2, 'Recruiter', 55000.00, 75000.00, 'Finds, interviews, and hires the new employees'),
(3, 'Finance Manager', 95000.00, 130000.00, 'Oversees budgeting and financial reporting for the company'),
(4, 'Accountant', 60000.00, 85000.00, 'Maintains financial records and processes payroll'),
(5, 'Engineering Manager', 120000.00, 160000.00, 'Leads the engineering team and its projects'),
(6, 'Software Engineer', 80000.00, 130000.00, 'Designs and builds software'),
(7, 'UX Designer', 70000.00, 105000.00, 'Designs user interfaces and runs usability testing'),
(8, 'Marketing Manager', 85000.00, 120000.00, 'Plans marketing campaigns and manages the brand'),
(9, 'Social Media Coordinator', 50000.00, 68000.00, 'Runs the company social media accounts and content'),
(10, 'Operations Manager', 85000.00, 115000.00, 'Manages daily operations and vendors'),
(11, 'Logistics Coordinator', 50000.00, 70000.00, 'Coordinates shipping, inventory and suppliers');


/* ----------------------------------------------------
 DEPARTMENT
 5 departments. manager_id starts as NULL because the
 employees don't exist yet, it is set at the end of this file.
 ---------------------------------------------------- */


INSERT INTO DEPARTMENT (department_id, department_name, location, budget, department_email, manager_id) VALUES
(1, 'Human Resources', 'Waterloo, ON', 450000.00, 'hr@company.ca', NULL),
(2, 'Finance', 'Waterloo, ON', 600000.00, 'finance@company.ca', NULL),
(3, 'Engineering', 'Toronto, ON', 1500000.00, 'engineering@company.ca', NULL),
(4, 'Marketing', 'Toronto, ON', 700000.00, 'marketing@company.ca', NULL),
(5, 'Operations', 'Waterloo, ON', 800000.00, 'operations@company.ca', NULL);


/* ----------------------------------------------------
 EMPLOYEE
 15 employees, each linked to a department and a job role.
 ---------------------------------------------------- */
INSERT INTO EMPLOYEE (employee_id, first_name, last_name, email, hire_date, department_id, job_role_id) VALUES
(1, 'Sarah', 'Khan', 'sarah.khan@company.ca', '2018-03-12', 1, 1),
(2, 'Daniel', 'Okafor', 'daniel.okafor@company.ca', '2022-06-01', 1, 2),
(3, 'Priya', 'Sharma', 'priya.sharma@company.ca', '2017-09-18', 2, 3),
(4, 'Michael', 'Chen', 'michael.chen@company.ca', '2021-01-11', 2, 4),
(5, 'Aisha', 'Rahman', 'aisha.rahman@company.ca', '2024-02-05', 2, 4),
(6, 'James', 'Wilson', 'james.wilson@company.ca', '2016-05-23', 3, 5),
(7, 'Hana', 'Malik', 'hana.malik@company.ca', '2020-08-17', 3, 6),
(8, 'Lucas', 'Martin', 'lucas.martin@company.ca', '2023-03-06', 3, 6),
(9, 'Emily', 'Nguyen', 'emily.nguyen@company.ca', '2025-01-13', 3, 7),
(10, 'Omar', 'Haddad', 'omar.haddad@company.ca', '2019-11-04', 4, 8),
(11, 'Chloe', 'Dubois', 'chloe.dubois@company.ca', '2023-09-25', 4, 9),
(12, 'Ryan', 'Patel', 'ryan.patel@company.ca', '2018-07-30', 5, 10),
(13, 'Grace', 'Kim', 'grace.kim@company.ca', '2022-04-19', 5, 11),
(14, 'Ethan', 'Brown', 'ethan.brown@company.ca', '2024-10-07', 5, 11),
(15, 'Noor', 'Siddiqui', 'noor.siddiqui@company.ca', '2025-06-16', 1, 2);


/* ----------------------------------------------------
 MANAGES
 Set each department's manager now that the employees exist.
 Each manager works in the department they manage.
 ---------------------------------------------------- */
UPDATE DEPARTMENT SET manager_id = 1 WHERE department_id = 1;
UPDATE DEPARTMENT SET manager_id = 3 WHERE department_id = 2;
UPDATE DEPARTMENT SET manager_id = 6 WHERE department_id = 3;
UPDATE DEPARTMENT SET manager_id = 10 WHERE department_id = 4;
UPDATE DEPARTMENT SET manager_id = 12 WHERE department_id = 5;


/* ----------------------------------------------------
 EMPLOYEE_PHONE
 Each employee has at least one phone number.
 Some employees have both a work and a personal number.
 ---------------------------------------------------- */
INSERT INTO EMPLOYEE_PHONE (employee_id, phone_number) VALUES
(1, '519-555-0101'),
(1, '226-555-0181'),
(2, '519-555-0102'),
(3, '519-555-0103'),
(3, '226-555-0183'),
(4, '519-555-0104'),
(5, '226-555-0105'),
(6, '416-555-0106'),
(6, '647-555-0186'),
(7, '416-555-0107'),
(8, '647-555-0108'),
(9, '416-555-0109'),
(10, '416-555-0110'),
(10, '647-555-0190'),
(11, '647-555-0111'),
(12, '519-555-0112'),
(13, '226-555-0113'),
(14, '519-555-0114'),
(14, '226-555-0194'),
(15, '519-555-0115');


/* ----------------------------------------------------
 SALARY
 Annual salaries are paid on a bi-weekly basis. Older rows are kept as
 pay history, so employees with raises have more than one row.
 Every amount falls within the employee's job role pay range.
 ---------------------------------------------------- */
 
INSERT INTO SALARY (salary_id, amount, effective_date, pay_frequency, pay_type, employee_id) VALUES
(1, 97500.00, '2023-01-01', 'Bi-weekly', 'Salaried', 1),
(2, 105000.00, '2025-01-01', 'Bi-weekly', 'Salaried', 1),
(3, 65000.00, '2023-01-01', 'Bi-weekly', 'Salaried', 2),
(4, 67000.00, '2024-07-01', 'Bi-weekly', 'Salaried', 2),
(5, 119500.00, '2023-01-01', 'Bi-weekly', 'Salaried', 3),
(6, 125000.00, '2025-01-01', 'Bi-weekly', 'Salaried', 3),
(7, 72000.00, '2023-01-01', 'Bi-weekly', 'Salaried', 4),
(8, 75000.00, '2024-07-01', 'Bi-weekly', 'Salaried', 4),
(9, 63000.00, '2024-02-05', 'Bi-weekly', 'Salaried', 5),
(10, 145000.00, '2023-01-01', 'Bi-weekly', 'Salaried', 6),
(11, 152500.00, '2025-01-01', 'Bi-weekly', 'Salaried', 6),
(12, 103000.00, '2023-01-01', 'Bi-weekly', 'Salaried', 7),
(13, 110000.00, '2024-07-01', 'Bi-weekly', 'Salaried', 7),
(14, 117000.00, '2026-01-01', 'Bi-weekly', 'Salaried', 7),
(15, 89000.00, '2023-03-06', 'Bi-weekly', 'Salaried', 8),
(16, 95000.00, '2025-01-01', 'Bi-weekly', 'Salaried', 8),
(17, 79000.00, '2025-01-13', 'Bi-weekly', 'Salaried', 9),
(18, 105000.00, '2023-01-01', 'Bi-weekly', 'Salaried', 10),
(19, 107000.00, '2025-01-01', 'Bi-weekly', 'Salaried', 10),
(20, 55000.00, '2023-09-25', 'Bi-weekly', 'Salaried', 11),
(21, 96000.00, '2023-01-01', 'Bi-weekly', 'Salaried', 12),
(22, 101000.00, '2024-07-01', 'Bi-weekly', 'Salaried', 12),
(23, 56500.00, '2023-01-01', 'Bi-weekly', 'Salaried', 13),
(24, 61000.00, '2025-01-01', 'Bi-weekly', 'Salaried', 13),
(25, 52500.00, '2024-10-07', 'Bi-weekly', 'Salaried', 14),
(26, 58000.00, '2025-06-16', 'Bi-weekly', 'Salaried', 15);


/* ----------------------------------------------------
 LEAVE_REQUEST
 Time-off requests submitted from 2023 to 2026. The status is either
 Pending, Approved or Rejected. Marketing Dept. has no requests on purpose.
 ---------------------------------------------------- */
INSERT INTO LEAVE_REQUEST (leave_request_id, leave_type, start_date, end_date, status, request_date, employee_id) VALUES
(1, 'Bereavement', '2023-07-10', '2023-07-14', 'Approved', '2023-07-09', 1),
(2, 'Sick', '2024-02-12', '2024-02-13', 'Approved', '2024-02-12', 2),
(3, 'Vacation', '2024-08-05', '2024-08-16', 'Approved', '2024-06-01', 3),
(4, 'Personal', '2024-11-08', '2024-11-08', 'Rejected', '2024-11-01', 4),
(5, 'Parental', '2025-03-03', '2025-08-29', 'Approved', '2024-12-15', 7),
(6, 'Vacation', '2025-06-23', '2025-07-04', 'Rejected', '2025-04-20', 6),
(7, 'Sick', '2025-09-15', '2025-09-17', 'Approved', '2025-09-15', 8),
(8, 'Vacation', '2025-12-22', '2026-01-02', 'Rejected', '2025-11-10', 12),
(9, 'Bereavement', '2026-02-09', '2026-02-13', 'Approved', '2026-02-08', 13),
(10, 'Vacation', '2026-07-06', '2026-07-17', 'Approved', '2026-05-01', 5),
(11, 'Sick', '2026-08-20', '2026-08-21', 'Approved', '2026-08-20', 9),
(12, 'Vacation', '2026-11-02', '2026-11-06', 'Pending', '2026-10-05', 14),
(13, 'Personal', '2026-11-13', '2026-11-13', 'Pending', '2026-10-09', 15),
(14, 'Parental', '2026-12-14', '2027-03-12', 'Pending', '2026-10-12', 4),
(15, 'Vacation', '2026-12-21', '2026-12-31', 'Pending', '2026-10-14', 1);


/* ----------------------------------------------------
 DEPENDENT
 Family members who are covered under an employee's benefits.
 Identified by employee_id + dependent_name (weak entity).
 Some employees have several dependents, and others have none.
 ---------------------------------------------------- */
INSERT INTO DEPENDENT (employee_id, dependent_name, relationship_type, date_of_birth, coverage_start_date, coverage_status) VALUES
(1, 'Adam Khan', 'Spouse', '1985-04-22', '2023-01-01', 'Active'),
(1, 'Zara Khan', 'Child', '2014-09-03', '2023-01-01', 'Active'),
(1, 'Yusuf Khan', 'Child', '2018-01-17', '2023-01-01', 'Active'),
(2, 'Smith Okafor', 'Spouse', '1993-11-08', '2023-01-01', 'Active'),
(3, 'Dylan Sharma', 'Spouse', '1983-06-30', '2023-01-01', 'Active'),
(3, 'Meera Sharma', 'Child', '2012-02-14', '2023-01-01', 'Active'),
(3, 'Rohan Sharma', 'Child', '2003-05-09', '2023-01-01', 'Inactive'),
(4, 'Lily Chen', 'Spouse', '1994-03-07', '2024-06-15', 'Active'),
(6, 'Laura Wilson', 'Spouse', '1980-12-02', '2023-01-01', 'Active'),
(6, 'Ben Wilson', 'Child', '2010-07-19', '2023-01-01', 'Active'),
(6, 'Ella Wilson', 'Child', '2013-03-25', '2023-01-01', 'Active'),
(6, 'Noah Wilson', 'Child', '2016-10-11', '2023-01-01', 'Active'),
(7, 'Moeez Malik', 'Spouse', '1990-08-15', '2023-01-01', 'Active'),
(7, 'Layla Malik', 'Child', '2025-02-27', '2025-03-03', 'Active'),
(10, 'Nadia Haddad', 'Spouse', '1987-01-29', '2023-01-01', 'Active'),
(10, 'Karim Haddad', 'Child', '2019-06-05', '2023-01-01', 'Active'),
(12, 'Anjali Patel', 'Spouse', '1986-09-12', '2023-01-01', 'Active'),
(13, 'Minjun Kim', 'Child', '2021-04-18', '2023-01-01', 'Active');








/* ----------------------------------------------------
  COMPETENCY
  5 areas used to assess employee performance.
  The weights add up to 1.00.
  ---------------------------------------------------- */


INSERT INTO COMPETENCY (
   competency_id, competency_name, category, description, weight
) VALUES
(1, 'Communication', 'Interpersonal',
'Communicates information clearly with coworkers and clients', 0.20),
(2, 'Teamwork', 'Interpersonal',
'Works effectively with others and supports team goals', 0.20),
(3, 'Problem Solving', 'Professional',
'Identifies problems and develops practical solutions', 0.25),
(4, 'Time Management', 'Professional',
'Organizes work and meets agreed deadlines', 0.15),
(5, 'Job Knowledge', 'Technical',
'Applies the knowledge and skills required for the job', 0.20);




/* ----------------------------------------------------
  PERFORMANCE_REVIEW
  10 reviews covering the 2025 calendar year.
  Reviews only cover periods after each employee was hired.
  Overall scores use the whole-number scale from 1 to 5.
  ---------------------------------------------------- */


INSERT INTO PERFORMANCE_REVIEW (
   review_id, review_date, review_period_start,
   review_period_end, overall_score, overall_comments, employee_id
) VALUES
(1, '2026-01-12', '2025-01-01', '2025-12-31', 4,
'Provided strong leadership and supported the HR team', 1),
(2, '2026-01-13', '2025-01-01', '2025-12-31', 3,
'Met recruitment targets but should improve scheduling', 2),
(3, '2026-01-14', '2025-01-01', '2025-12-31', 5,
'Delivered accurate financial reporting and strong leadership', 3),
(4, '2026-01-15', '2025-01-01', '2025-12-31', 3,
'Maintained reliable records with some reporting delays', 4),
(5, '2026-01-16', '2025-01-01', '2025-12-31', 4,
'Improved payroll accuracy and worked well with the team', 5),
(6, '2026-01-19', '2025-01-01', '2025-12-31', 5,
'Led successful software delivery and mentored engineers', 6),
(7, '2026-01-20', '2025-01-01', '2025-12-31', 4,
'Delivered reliable software and solved difficult issues', 8),
(8, '2026-01-21', '2025-01-13', '2025-12-31', 4,
'Created effective designs and responded well to feedback', 9),
(9, '2026-01-22', '2025-01-01', '2025-12-31', 3,
'Produced consistent content but needs better deadline planning', 11),
(10, '2026-01-23', '2025-01-01', '2025-12-31', 2,
'Needs support with scheduling and resolving delivery issues', 14);




/* ----------------------------------------------------
  ASSESSES
  Each review includes scores for all 5 competencies.
  Scores use the same 1 to 5 scale as performance reviews.
  ---------------------------------------------------- */


INSERT INTO ASSESSES (
   review_id, competency_id, score, comments
) VALUES
(1, 1, 4, 'Communicates HR policies clearly'),
(1, 2, 5, 'Provides strong support to the team'),
(1, 3, 4, 'Resolves employee concerns effectively'),
(1, 4, 3, 'Some internal tasks needed follow-up'),
(1, 5, 4, 'Demonstrates strong HR knowledge'),


(2, 1, 4, 'Builds positive relationships with candidates'),
(2, 2, 3, 'Works well with hiring managers'),
(2, 3, 3, 'Handles routine recruitment issues'),
(2, 4, 2, 'Interview scheduling needs improvement'),
(2, 5, 3, 'Meets expectations for recruitment knowledge'),


(3, 1, 5, 'Explains financial results clearly'),
(3, 2, 5, 'Supports colleagues across departments'),
(3, 3, 5, 'Resolves complex budgeting issues'),
(3, 4, 4, 'Meets reporting deadlines'),
(3, 5, 5, 'Demonstrates excellent financial knowledge'),


(4, 1, 3, 'Provides clear routine updates'),
(4, 2, 4, 'Helps colleagues during busy periods'),
(4, 3, 3, 'Resolves standard accounting issues'),
(4, 4, 2, 'Some reports were submitted late'),
(4, 5, 3, 'Maintains the required accounting knowledge'),


(5, 1, 4, 'Explains payroll corrections clearly'),
(5, 2, 4, 'Coordinates effectively with HR'),
(5, 3, 4, 'Identifies and corrects payroll errors'),
(5, 4, 3, 'Usually completes work on schedule'),
(5, 5, 4, 'Applies accounting procedures accurately'),


(6, 1, 5, 'Communicates technical goals clearly'),
(6, 2, 5, 'Mentors and supports the engineering team'),
(6, 3, 5, 'Resolves complex technical problems'),
(6, 4, 4, 'Keeps major deliveries on schedule'),
(6, 5, 5, 'Demonstrates excellent technical knowledge'),


(7, 1, 4, 'Provides useful progress updates'),
(7, 2, 4, 'Contributes positively to code reviews'),
(7, 3, 5, 'Develops effective solutions to software defects'),
(7, 4, 3, 'Some task estimates needed revision'),
(7, 5, 4, 'Applies software engineering skills well'),


(8, 1, 4, 'Explains design decisions clearly'),
(8, 2, 5, 'Works closely with developers and stakeholders'),
(8, 3, 4, 'Uses feedback to improve designs'),
(8, 4, 3, 'Usually meets design milestones'),
(8, 5, 4, 'Demonstrates strong user experience knowledge'),


(9, 1, 4, 'Creates clear and engaging content'),
(9, 2, 3, 'Coordinates with the marketing team'),
(9, 3, 3, 'Handles routine campaign problems'),
(9, 4, 2, 'Content scheduling needs improvement'),
(9, 5, 3, 'Meets expectations for social media knowledge'),


(10, 1, 3, 'Provides adequate delivery updates'),
(10, 2, 3, 'Works cooperatively with colleagues'),
(10, 3, 2, 'Needs help resolving delivery problems'),
(10, 4, 1, 'Frequently misses scheduling deadlines'),
(10, 5, 2, 'Needs further logistics training');




/* ----------------------------------------------------
  PROJECT
  5 projects involving different departments.
  NULL end dates represent ongoing projects.
  ---------------------------------------------------- */


INSERT INTO PROJECT (
   project_id, project_name, project_description,
   start_date, end_date, budget
) VALUES
(1, 'Employee Onboarding Update',
'Improve onboarding documents and new employee procedures',
'2025-07-07', '2025-10-31', 25000.00),
(2, 'Payroll Process Improvement',
'Improve payroll checks and reduce processing errors',
'2025-02-03', '2025-08-29', 45000.00),
(3, 'Employee Self-Service Portal',
'Build a portal for employee information and HR requests',
'2025-02-03', NULL, 180000.00),
(4, 'Brand Awareness Campaign',
'Create and deliver a company social media campaign',
'2025-04-01', '2025-09-30', 60000.00),
(5, 'Inventory Tracking Upgrade',
'Improve inventory tracking and delivery coordination',
'2026-02-02', NULL, 95000.00);




/* ----------------------------------------------------
  ASSIGNED_TO
  Employees can work on more than one project.
  Every project has at least one assigned employee.
  Ongoing assignments may not have a project rating yet.
  ---------------------------------------------------- */


INSERT INTO ASSIGNED_TO (
   employee_id, project_id, project_role,
   assigned_date, project_rating, hours_worked
) VALUES
(1, 1, 'Project Lead', '2025-07-07', 5, 95.00),
(2, 1, 'Recruitment Advisor', '2025-07-07', 4, 120.00),
(15, 1, 'Onboarding Coordinator', '2025-07-07', 4, 140.00),


(3, 2, 'Project Lead', '2025-02-03', 5, 110.00),
(4, 2, 'Payroll Analyst', '2025-02-03', 3, 175.50),
(5, 2, 'Payroll Tester', '2025-02-10', 4, 160.00),


(6, 3, 'Technical Lead', '2025-02-03', NULL, 240.00),
(8, 3, 'Software Developer', '2025-02-03', NULL, 420.50),
(9, 3, 'UX Designer', '2025-02-10', NULL, 210.00),
(1, 3, 'HR Advisor', '2025-02-03', NULL, 65.00),


(10, 4, 'Campaign Lead', '2025-04-01', 4, 130.00),
(11, 4, 'Content Coordinator', '2025-04-01', 3, 250.00),


(12, 5, 'Project Lead', '2026-02-02', NULL, 125.00),
(13, 5, 'Logistics Analyst', '2026-02-02', NULL, 180.00),
(14, 5, 'Inventory Coordinator', '2026-02-09', NULL, 145.50),
(8, 5, 'Software Developer', '2026-02-09', NULL, 90.00);




/* ----------------------------------------------------
  TRAINING_PROGRAM
  6 programs covering professional and technical skills.
  Programs include online, in-person and hybrid delivery.
  ---------------------------------------------------- */


INSERT INTO TRAINING_PROGRAM (
   training_id, program_name, provider,
   duration_hours, training_category, delivery_method
) VALUES
(1, 'Workplace Communication', 'Ontario Professional Learning',
8, 'Communication', 'Online'),
(2, 'Leadership Foundations', 'Waterloo Management Training',
16, 'Leadership', 'Hybrid'),
(3, 'Advanced Excel for Finance', 'Business Skills Academy',
12, 'Finance', 'Online'),
(4, 'Secure Software Development', 'Canadian Technology Training',
20, 'Technical', 'Online'),
(5, 'Time Management Workshop', 'Workplace Development Centre',
6, 'Professional Development', 'In-person'),
(6, 'Supply Chain Fundamentals', 'Logistics Learning Centre',
18, 'Operations', 'Hybrid');




/* ----------------------------------------------------
  ENROLLS_IN
  Includes completed, ongoing and withdrawn enrollments.
  Only completed enrollments have a completion date.
  Program 6 has no enrollments yet.
  ---------------------------------------------------- */


INSERT INTO ENROLLS_IN (
   employee_id, training_id, enrollment_date,
   completion_status, completion_date
) VALUES
(1, 2, '2025-02-03', 'Completed', '2025-02-21'),
(2, 1, '2025-03-03', 'Completed', '2025-03-07'),
(3, 2, '2025-02-03', 'Completed', '2025-02-21'),
(4, 3, '2025-04-07', 'Completed', '2025-04-25'),
(5, 3, '2025-04-07', 'Completed', '2025-04-25'),
(6, 2, '2025-02-03', 'Completed', '2025-02-21'),
(8, 4, '2025-06-02', 'Completed', '2025-06-27'),
(9, 1, '2025-05-05', 'Completed', '2025-05-09'),
(10, 2, '2025-02-03', 'Completed', '2025-02-21'),
(11, 1, '2025-05-05', 'Withdrawn', NULL),
(12, 2, '2025-02-03', 'Completed', '2025-02-21'),
(13, 5, '2026-09-14', 'Completed', '2026-09-14'),
(14, 5, '2026-10-05', 'In Progress', NULL),
(15, 1, '2026-10-12', 'In Progress', NULL),
(2, 5, '2026-10-26', 'Enrolled', NULL),
(4, 5, '2026-10-26', 'Enrolled', NULL);
