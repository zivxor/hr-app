/* A3 Query 3: Employees Who Have Never Received a Raise */

SELECT
    EMPLOYEE.employee_id AS 'Employee ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department',
    DATE_FORMAT(
        EMPLOYEE.hire_date, '%Y-%m-%d'
    ) AS 'Hire Date',
    SALARY.amount AS 'Salary'
FROM EMPLOYEE
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
INNER JOIN SALARY
    ON EMPLOYEE.employee_id = SALARY.employee_id
WHERE EMPLOYEE.employee_id IN (
    SELECT SALARY.employee_id
    FROM SALARY
    GROUP BY SALARY.employee_id
    HAVING COUNT(*) = 1
)
ORDER BY EMPLOYEE.hire_date;