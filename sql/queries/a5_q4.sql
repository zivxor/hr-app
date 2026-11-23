/* A5 Q4: Salary Growth History (LAG, RANK window functions) */

SELECT CONCAT(EMPLOYEE.first_name, ' ', EMPLOYEE.last_name) AS 'Employee',
       DEPARTMENT.department_name AS 'Department',
       DATE_FORMAT(HISTORY.effective_date, '%Y-%m-%d') AS 'Raise Date',
       HISTORY.prev_amount AS 'Previous Salary',
       HISTORY.amount AS 'New Salary',
       HISTORY.amount - HISTORY.prev_amount AS 'Raise Amount',
       ROUND((HISTORY.amount - HISTORY.prev_amount)
             / HISTORY.prev_amount * 100, 2) AS 'Raise %',
       RANK() OVER (ORDER BY (HISTORY.amount - HISTORY.prev_amount)
                             / HISTORY.prev_amount DESC) AS 'Raise % Rank'
FROM (
    SELECT SALARY.employee_id,
           SALARY.effective_date,
           SALARY.amount,
           LAG(SALARY.amount) OVER (PARTITION BY SALARY.employee_id
                                    ORDER BY SALARY.effective_date) AS prev_amount
    FROM SALARY
    WHERE SALARY.effective_date <= CURDATE()
) AS HISTORY
INNER JOIN EMPLOYEE ON HISTORY.employee_id = EMPLOYEE.employee_id
INNER JOIN DEPARTMENT ON EMPLOYEE.department_id = DEPARTMENT.department_id
WHERE HISTORY.prev_amount IS NOT NULL
ORDER BY 8;
