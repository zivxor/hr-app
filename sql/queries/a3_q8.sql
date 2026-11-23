/* A3 Query 8: Employees Who Completed Online Training */

SELECT
    EMPLOYEE.employee_id AS 'Employee ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department'
FROM EMPLOYEE
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
WHERE EMPLOYEE.employee_id IN (
    SELECT ENROLLS_IN.employee_id
    FROM ENROLLS_IN
    INNER JOIN TRAINING_PROGRAM
        ON ENROLLS_IN.training_id = TRAINING_PROGRAM.training_id
    WHERE ENROLLS_IN.completion_status = 'Completed'
      AND TRAINING_PROGRAM.delivery_method = 'Online'
)
ORDER BY EMPLOYEE.last_name, EMPLOYEE.first_name,
         EMPLOYEE.employee_id;
