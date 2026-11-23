/* A5 Q1: HR Attention List (UNION) */

SELECT EMPLOYEE.employee_id AS 'Employee ID',
       CONCAT(EMPLOYEE.first_name, ' ', EMPLOYEE.last_name) AS 'Employee',
       DEPARTMENT.department_name AS 'Department',
       'Pending leave request' AS 'Reason',
       CONCAT(LEAVE_REQUEST.leave_type, ' leave starting ',
              DATE_FORMAT(LEAVE_REQUEST.start_date, '%Y-%m-%d')) AS 'Details'
FROM LEAVE_REQUEST
INNER JOIN EMPLOYEE ON LEAVE_REQUEST.employee_id = EMPLOYEE.employee_id
INNER JOIN DEPARTMENT ON EMPLOYEE.department_id = DEPARTMENT.department_id
WHERE LEAVE_REQUEST.status = 'Pending'

UNION

SELECT EMPLOYEE.employee_id,
       CONCAT(EMPLOYEE.first_name, ' ', EMPLOYEE.last_name),
       DEPARTMENT.department_name,
       'No pay change in over 2 years',
       CONCAT('Last change on ', DATE_FORMAT(MAX(SALARY.effective_date), '%Y-%m-%d'))
FROM EMPLOYEE
INNER JOIN DEPARTMENT ON EMPLOYEE.department_id = DEPARTMENT.department_id
INNER JOIN SALARY ON EMPLOYEE.employee_id = SALARY.employee_id
WHERE SALARY.effective_date <= CURDATE()
GROUP BY EMPLOYEE.employee_id, EMPLOYEE.first_name, EMPLOYEE.last_name,
         DEPARTMENT.department_name
HAVING MAX(SALARY.effective_date) < CURDATE() - INTERVAL 2 YEAR

UNION

SELECT EMPLOYEE.employee_id,
       CONCAT(EMPLOYEE.first_name, ' ', EMPLOYEE.last_name),
       DEPARTMENT.department_name,
       'Salary near job role max',
       CONCAT(fn_current_salary(EMPLOYEE.employee_id), ' of ',
              JOB_ROLE.max_salary, ' max')
FROM EMPLOYEE
INNER JOIN DEPARTMENT ON EMPLOYEE.department_id = DEPARTMENT.department_id
INNER JOIN JOB_ROLE ON EMPLOYEE.job_role_id = JOB_ROLE.job_role_id
WHERE fn_current_salary(EMPLOYEE.employee_id) >= JOB_ROLE.max_salary * 0.95

ORDER BY 2, 4;
