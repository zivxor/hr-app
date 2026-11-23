/* A3 Query 6: Employees with No Project Assignments */

SELECT
    EMPLOYEE.employee_id AS 'Employee ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department'
FROM EMPLOYEE
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
WHERE NOT EXISTS (
    SELECT 1
    FROM ASSIGNED_TO
    WHERE ASSIGNED_TO.employee_id = EMPLOYEE.employee_id
)
ORDER BY EMPLOYEE.last_name, EMPLOYEE.first_name,
         EMPLOYEE.employee_id;
