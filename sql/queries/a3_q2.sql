/* A3 Query 2: Leave Summary by Department */

SELECT
    DEPARTMENT.department_name AS 'Department',
    COUNT(LEAVE_REQUEST.leave_request_id) AS 'Total Requests',
    COALESCE(
        SUM(
            DATEDIFF(
                LEAVE_REQUEST.end_date,
                LEAVE_REQUEST.start_date
            ) + 1
        ),
        0
    ) AS 'Total Days Requested'
FROM DEPARTMENT
LEFT JOIN EMPLOYEE
    ON DEPARTMENT.department_id = EMPLOYEE.department_id
LEFT JOIN LEAVE_REQUEST
    ON EMPLOYEE.employee_id = LEAVE_REQUEST.employee_id
GROUP BY DEPARTMENT.department_name
ORDER BY COALESCE(
    SUM(
        DATEDIFF(
            LEAVE_REQUEST.end_date,
            LEAVE_REQUEST.start_date
        ) + 1
    ),
    0
) DESC;