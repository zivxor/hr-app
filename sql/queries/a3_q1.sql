/* A3 Query 1: Pending Leave Requests */

SELECT
    LEAVE_REQUEST.leave_request_id AS 'Request ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department',
    LEAVE_REQUEST.leave_type AS 'Leave Type',
    DATE_FORMAT(
        LEAVE_REQUEST.start_date, '%Y-%m-%d'
    ) AS 'Start Date',
    DATE_FORMAT(
        LEAVE_REQUEST.end_date, '%Y-%m-%d'
    ) AS 'End Date',
    DATE_FORMAT(
        LEAVE_REQUEST.request_date, '%Y-%m-%d'
    ) AS 'Request Date'
FROM LEAVE_REQUEST
INNER JOIN EMPLOYEE
    ON LEAVE_REQUEST.employee_id = EMPLOYEE.employee_id
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
WHERE LEAVE_REQUEST.status = 'Pending'
ORDER BY LEAVE_REQUEST.request_date DESC;