/* A5 Q3: Salary Rank Within Department (ROW_NUMBER, RANK, MAX window functions) */

SELECT DEPARTMENT.department_name AS 'Department',
       CONCAT(EMPLOYEE.first_name, ' ', EMPLOYEE.last_name) AS 'Employee',
       JOB_ROLE.title AS 'Job Title',
       CURRENT_PAY.amount AS 'Current Salary',
       RANK() OVER (PARTITION BY DEPARTMENT.department_id
                    ORDER BY CURRENT_PAY.amount DESC) AS 'Dept Rank',
       MAX(CURRENT_PAY.amount) OVER (PARTITION BY DEPARTMENT.department_id)
           - CURRENT_PAY.amount AS 'Gap From Top Earner'
FROM (
    SELECT SALARY.employee_id,
           SALARY.amount,
           ROW_NUMBER() OVER (PARTITION BY SALARY.employee_id
                              ORDER BY SALARY.effective_date DESC) AS row_num
    FROM SALARY
    WHERE SALARY.effective_date <= CURDATE()
) AS CURRENT_PAY
INNER JOIN EMPLOYEE ON CURRENT_PAY.employee_id = EMPLOYEE.employee_id
INNER JOIN DEPARTMENT ON EMPLOYEE.department_id = DEPARTMENT.department_id
INNER JOIN JOB_ROLE ON EMPLOYEE.job_role_id = JOB_ROLE.job_role_id
WHERE CURRENT_PAY.row_num = 1
ORDER BY DEPARTMENT.department_name, 5;
