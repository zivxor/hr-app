/* A5 Q2: Pay Position Within Job Role Band */

SELECT JOB_ROLE.title AS 'Job Title',
       COUNT(*) AS 'Employees',
       JOB_ROLE.min_salary AS 'Band Min',
       JOB_ROLE.max_salary AS 'Band Max',
       ROUND(AVG(BAND.band_position), 1) AS 'Avg Band Position %',
       SUM(CASE WHEN BAND.band_position >= 75 THEN 1 ELSE 0 END) AS 'In Top Quarter',
       SUM(CASE WHEN BAND.band_position < 25 THEN 1 ELSE 0 END) AS 'In Bottom Quarter'
FROM (
    SELECT EMPLOYEE.job_role_id,
           (SALARY.amount - JOB_ROLE.min_salary)
             / (JOB_ROLE.max_salary - JOB_ROLE.min_salary) * 100 AS band_position
    FROM SALARY
    INNER JOIN (SELECT SALARY.employee_id, MAX(SALARY.effective_date) AS latest_date
                FROM SALARY
                WHERE SALARY.effective_date <= CURDATE()
                GROUP BY SALARY.employee_id) AS LATEST
        ON SALARY.employee_id = LATEST.employee_id
       AND SALARY.effective_date = LATEST.latest_date
    INNER JOIN EMPLOYEE ON SALARY.employee_id = EMPLOYEE.employee_id
    INNER JOIN JOB_ROLE ON EMPLOYEE.job_role_id = JOB_ROLE.job_role_id
) AS BAND
INNER JOIN JOB_ROLE ON BAND.job_role_id = JOB_ROLE.job_role_id
GROUP BY JOB_ROLE.job_role_id, JOB_ROLE.title, JOB_ROLE.min_salary, JOB_ROLE.max_salary
HAVING SUM(CASE WHEN BAND.band_position >= 75 OR BAND.band_position < 25
                THEN 1 ELSE 0 END) > 0
ORDER BY 5 DESC;
