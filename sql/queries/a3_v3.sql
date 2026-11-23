/* A3 View 3: Training Completion Summary (SELECT from VW_TRAINING_COMPLETION) */

SELECT
    training_id AS 'Training ID',
    program_name AS 'Training Program',
    total_enrollments AS 'Total Enrollments',
    completed_enrollments AS 'Completed Enrollments',
    completion_percentage AS 'Completion Percentage'
FROM VW_TRAINING_COMPLETION
ORDER BY completion_percentage DESC, training_id;