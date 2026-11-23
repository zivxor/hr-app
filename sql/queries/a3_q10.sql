/* A3 Query 10: Employees with Training Still in Progress */

SELECT
    EMPLOYEE.employee_id AS 'Employee ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    TRAINING_PROGRAM.program_name AS 'Training Program',
    TRAINING_PROGRAM.delivery_method AS 'Delivery Method',
    DATE_FORMAT(
        ENROLLS_IN.enrollment_date, '%Y-%m-%d'
    ) AS 'Enrollment Date',
    ENROLLS_IN.completion_status AS 'Completion Status'
FROM ENROLLS_IN
INNER JOIN EMPLOYEE
    ON ENROLLS_IN.employee_id = EMPLOYEE.employee_id
INNER JOIN TRAINING_PROGRAM
    ON ENROLLS_IN.training_id = TRAINING_PROGRAM.training_id
WHERE ENROLLS_IN.completion_status = 'In Progress'
ORDER BY ENROLLS_IN.enrollment_date,
         EMPLOYEE.employee_id, TRAINING_PROGRAM.training_id;
