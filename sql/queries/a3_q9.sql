/* A3 Query 9: Competencies Needing Development */

SELECT
    COMPETENCY.competency_id AS 'Competency ID',
    COMPETENCY.competency_name AS 'Competency',
    COMPETENCY.category AS 'Category',
    COUNT(*) AS 'Assessment Count',
    ROUND(AVG(ASSESSES.score), 2) AS 'Average Score'
FROM COMPETENCY
INNER JOIN ASSESSES
    ON COMPETENCY.competency_id = ASSESSES.competency_id
GROUP BY COMPETENCY.competency_id,
         COMPETENCY.competency_name,
         COMPETENCY.category
HAVING AVG(ASSESSES.score) < 3
ORDER BY AVG(ASSESSES.score),
         COMPETENCY.competency_id;
