/* A3 Query 4: Employees with No Dependents */

SELECT
    EMPLOYEE.employee_id AS 'Employee ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department',
    JOB_ROLE.title AS 'Job Title',
    DATE_FORMAT(
        EMPLOYEE.hire_date, '%Y-%m-%d'
    ) AS 'Hire Date'
FROM EMPLOYEE
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
INNER JOIN JOB_ROLE
    ON EMPLOYEE.job_role_id = JOB_ROLE.job_role_id
WHERE EMPLOYEE.employee_id NOT IN (
    SELECT DEPENDENT.employee_id
    FROM DEPENDENT
)
ORDER BY
    DEPARTMENT.department_name,
    EMPLOYEE.last_name;