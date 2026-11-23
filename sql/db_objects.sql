/* ====================================================
   Database objects from previous assignments
   Group 13: Employee Performance & HR Management System
   Shermeen Syeda, Luka Zivkovic

   Views, stored functions, stored procedures and indexes that the
   saved queries in sql/queries/ depend on (A3 views 2-3, A5 objects).
   schema.sql drops the whole database, so these must be recreated
   after schema.sql and populate.sql. The app's "Reset database"
   button runs this file automatically as the third step.

   Definitions match the objects in the live database the app was
   built against (see README: "Known differences from the A5 report").
   Uses DELIMITER so it also runs as-is in MySQL Workbench.
   ==================================================== */

USE cp363_a2_group13;


/* ----------------------------------------------------
   A3 View 2: Project Workload Summary
   Employee counts and recorded hours for each project.
   Projects with no assignments are included.
   ---------------------------------------------------- */
CREATE OR REPLACE VIEW VW_PROJECT_WORKLOAD AS
SELECT
    PROJECT.project_id AS project_id,
    PROJECT.project_name AS project_name,
    COUNT(ASSIGNED_TO.employee_id) AS assigned_employees,
    COALESCE(SUM(ASSIGNED_TO.hours_worked), 0) AS total_hours,
    ROUND(
        COALESCE(SUM(ASSIGNED_TO.hours_worked), 0)
        / NULLIF(COUNT(ASSIGNED_TO.employee_id), 0),
        2
    ) AS average_hours_per_employee
FROM PROJECT
LEFT JOIN ASSIGNED_TO
    ON PROJECT.project_id = ASSIGNED_TO.project_id
GROUP BY PROJECT.project_id, PROJECT.project_name
ORDER BY total_hours DESC, PROJECT.project_id;


/* ----------------------------------------------------
   A3 View 3: Training Completion Summary
   Enrollment and completion totals for each program.
   Programs with no enrollments are included.
   ---------------------------------------------------- */
CREATE OR REPLACE VIEW VW_TRAINING_COMPLETION AS
SELECT
    TRAINING_PROGRAM.training_id AS training_id,
    TRAINING_PROGRAM.program_name AS program_name,
    COUNT(ENROLLS_IN.employee_id) AS total_enrollments,
    SUM(
        CASE
            WHEN ENROLLS_IN.completion_status = 'Completed'
            THEN 1
            ELSE 0
        END
    ) AS completed_enrollments,
    COALESCE(
        ROUND(
            100.0 * SUM(
                CASE
                    WHEN ENROLLS_IN.completion_status = 'Completed'
                    THEN 1
                    ELSE 0
                END
            ) / NULLIF(COUNT(ENROLLS_IN.employee_id), 0),
            2
        ),
        0.00
    ) AS completion_percentage
FROM TRAINING_PROGRAM
LEFT JOIN ENROLLS_IN
    ON TRAINING_PROGRAM.training_id = ENROLLS_IN.training_id
GROUP BY TRAINING_PROGRAM.training_id,
         TRAINING_PROGRAM.program_name
ORDER BY completion_percentage DESC,
         TRAINING_PROGRAM.training_id;


/* ----------------------------------------------------
   A5 Function 1: fn_current_salary
   An employee's latest salary row (pay history keeps old rows).
   Used in: A5 Q1 and vw_retention_risk.
   ---------------------------------------------------- */
DROP FUNCTION IF EXISTS fn_current_salary;
DELIMITER //
CREATE FUNCTION fn_current_salary(p_empid INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_salary DECIMAL(10,2);
    SELECT amount
      INTO v_salary
      FROM SALARY
     WHERE employee_id = p_empid
     ORDER BY effective_date DESC
     LIMIT 1;
    RETURN v_salary;
END //
DELIMITER ;


/* ----------------------------------------------------
   A5 Function 2: fn_weighted_review_score
   Competency-weighted score of one review:
   SUM(score x weight) / SUM(weight). Used in: A5 Q5.
   ---------------------------------------------------- */
DROP FUNCTION IF EXISTS fn_weighted_review_score;
DELIMITER //
CREATE FUNCTION fn_weighted_review_score(p_review_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE v_score DECIMAL(5,2);

    SELECT ROUND(SUM(a.score * c.weight) / NULLIF(SUM(c.weight), 0), 2)
      INTO v_score
      FROM ASSESSES a
      JOIN COMPETENCY c ON c.competency_id = a.competency_id
     WHERE a.review_id = p_review_id;

    RETURN v_score;
END //
DELIMITER ;


/* ----------------------------------------------------
   A5 Function 3: fn_project_count
   How many projects an employee is assigned to.
   Used in: vw_retention_risk.
   ---------------------------------------------------- */
DROP FUNCTION IF EXISTS fn_project_count;
DELIMITER //
CREATE FUNCTION fn_project_count(p_emp_id INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*)
      INTO v_count
      FROM ASSIGNED_TO
     WHERE employee_id = p_emp_id;

    RETURN v_count;
END //
DELIMITER ;


/* ----------------------------------------------------
   A5 Procedure 2: sp_review_period_report
   Performance report for every review held between two dates.
   ---------------------------------------------------- */
DROP PROCEDURE IF EXISTS sp_review_period_report;
DELIMITER //
CREATE PROCEDURE sp_review_period_report(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
    SELECT pr.review_id,
           CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
           d.department_name,
           pr.review_date,
           pr.overall_score,
           fn_weighted_review_score(pr.review_id) AS weighted_score
      FROM PERFORMANCE_REVIEW pr
      JOIN EMPLOYEE e ON e.employee_id = pr.employee_id
      JOIN DEPARTMENT d ON d.department_id = e.department_id
     WHERE pr.review_date BETWEEN p_start_date AND p_end_date
     ORDER BY pr.review_date, employee_name;
END //
DELIMITER ;


/* ----------------------------------------------------
   A5 Procedure 3: sp_enroll_low_performers
   Enrolls every employee scoring at or below a threshold into a
   training program, skipping anyone already enrolled (NOT EXISTS
   guards the composite primary key, so re-running never fails).
   ---------------------------------------------------- */
DROP PROCEDURE IF EXISTS sp_enroll_low_performers;
DELIMITER //
CREATE PROCEDURE sp_enroll_low_performers(IN p_training_id INT, IN p_threshold INT)
BEGIN
    INSERT INTO ENROLLS_IN (employee_id, training_id, enrollment_date, completion_status)
    SELECT pr.employee_id,
           p_training_id,
           CURDATE(),
           'Enrolled'
      FROM PERFORMANCE_REVIEW pr
     WHERE pr.overall_score <= p_threshold
       AND NOT EXISTS (SELECT 1
                         FROM ENROLLS_IN ei
                        WHERE ei.employee_id = pr.employee_id
                          AND ei.training_id = p_training_id);

    SELECT ROW_COUNT() AS employees_enrolled;
END //
DELIMITER ;


/* ----------------------------------------------------
   A5 View 3: vw_retention_risk (subquery in WHERE)
   High performers (score >= 4) paid below their job role's
   salary band midpoint. Created after the functions it calls.
   ---------------------------------------------------- */
CREATE OR REPLACE VIEW vw_retention_risk AS
SELECT e.employee_id,
       CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
       d.department_name,
       jr.title AS job_title,
       fn_current_salary(e.employee_id) AS current_salary,
       fn_project_count(e.employee_id) AS active_projects,
       pr.overall_score
  FROM EMPLOYEE e
  JOIN DEPARTMENT d ON d.department_id = e.department_id
  JOIN JOB_ROLE jr ON jr.job_role_id = e.job_role_id
  JOIN PERFORMANCE_REVIEW pr ON pr.employee_id = e.employee_id
 WHERE pr.overall_score >= 4
   AND fn_current_salary(e.employee_id) < (SELECT (jr2.min_salary + jr2.max_salary) / 2
                                             FROM JOB_ROLE jr2
                                            WHERE jr2.job_role_id = e.job_role_id);


/* ----------------------------------------------------
   A5 Analysis 1: composite index matching Q6's window
   (PARTITION BY project_id ORDER BY hours_worked DESC).
   ---------------------------------------------------- */
CREATE INDEX idx_assigned_to_project_hours ON ASSIGNED_TO (project_id, hours_worked DESC);
