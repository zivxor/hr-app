/* ====================================================
  CP363 Assignment 2: Schema Design
  Group 13: Employee Performance & HR Management System
  Shermeen Syeda, Luka Zivkovic
  ==================================================== */


DROP DATABASE IF EXISTS cp363_a2_group13;
CREATE DATABASE cp363_a2_group13;
USE cp363_a2_group13;


/* ----------------------------------------------------
  JOB_ROLE
  Stores each position in the company and its pay range.
  Maps to the JOB_ROLE entity (1 side of HOLDS).
  ---------------------------------------------------- */


CREATE TABLE JOB_ROLE (
   job_role_id      INT            AUTO_INCREMENT PRIMARY KEY,
   title            VARCHAR(75)    NOT NULL UNIQUE,
   min_salary       DECIMAL(10,2)  NOT NULL,
   max_salary       DECIMAL(10,2)  NOT NULL,
   job_description  VARCHAR(255)   NOT NULL,
   CONSTRAINT chk_job_role_salary_range CHECK (max_salary >= min_salary)
) ENGINE = InnoDB;


/* ----------------------------------------------------
  DEPARTMENT
  Stores each team a part of the company, and who manages it.
  Maps to the DEPARTMENT entity (1 side of WORKS_IN, total side of MANAGES).
  manager_id represents MANAGES;
  its foreign key is added after EMPLOYEE is created.
  ---------------------------------------------------- */


CREATE TABLE DEPARTMENT (
   department_id     INT            AUTO_INCREMENT PRIMARY KEY,
   department_name   VARCHAR(50)    NOT NULL UNIQUE,
   location          VARCHAR(100)   NOT NULL,
   budget            DECIMAL(12,2)  NOT NULL,
   department_email  VARCHAR(100)   NOT NULL UNIQUE,
   manager_id        INT            NULL UNIQUE
) ENGINE = InnoDB;


/* ----------------------------------------------------
  EMPLOYEE
  Stores each individual employed by the company.
  Maps to the EMPLOYEE entity (N side of WORKS_IN and HOLDS).
  phone_number (multivalued) is stored in EMPLOYEE_PHONE.
  ---------------------------------------------------- */


CREATE TABLE EMPLOYEE (
   employee_id    INT           AUTO_INCREMENT PRIMARY KEY,
   first_name     VARCHAR(50)   NOT NULL,
   last_name      VARCHAR(50)   NOT NULL,
   email          VARCHAR(100)  NOT NULL UNIQUE,
   hire_date      DATE          NOT NULL,
   department_id  INT           NOT NULL,
   job_role_id    INT           NOT NULL,
   CONSTRAINT fk_employee_department
       FOREIGN KEY (department_id) REFERENCES DEPARTMENT (department_id)
       ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT fk_employee_job_role
       FOREIGN KEY (job_role_id) REFERENCES JOB_ROLE (job_role_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


/* ----------------------------------------------------
  MANAGES (1:1 relationship between EMPLOYEE and DEPARTMENT)
  Since now EMPLOYEE exists, link DEPARTMENT.manager_id to it.
  ---------------------------------------------------- */


ALTER TABLE DEPARTMENT
   ADD CONSTRAINT fk_department_manager
       FOREIGN KEY (manager_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE SET NULL ON UPDATE CASCADE;


/* ----------------------------------------------------
  EMPLOYEE_PHONE
  Stores each phone number that belongs to an employee.
  Maps to phone_number, the multivalued attribute of EMPLOYEE.
  ---------------------------------------------------- */
CREATE TABLE EMPLOYEE_PHONE (
   employee_id   INT          NOT NULL,
   phone_number  VARCHAR(16)  NOT NULL,
   PRIMARY KEY (employee_id, phone_number),
   CONSTRAINT fk_employee_phone_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;


/* ----------------------------------------------------
  SALARY
  Stores each pay for an employee starting from a beginning date.
  Old records are kept as pay history.
  Maps to the SALARY entity (N side of EARNS).
  ---------------------------------------------------- */
CREATE TABLE SALARY (
   salary_id       INT            AUTO_INCREMENT PRIMARY KEY,
   amount          DECIMAL(10,2)  NOT NULL,
   effective_date  DATE           NOT NULL,
   pay_frequency   VARCHAR(20)    NOT NULL,
   pay_type        VARCHAR(20)    NOT NULL,
   employee_id     INT            NOT NULL,
   CONSTRAINT fk_salary_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


/* ----------------------------------------------------
  LEAVE_REQUEST
  Stores each request an employee submits to HR for time off.
  Maps to the LEAVE_REQUEST entity (N side of SUBMITS).
  ---------------------------------------------------- */


CREATE TABLE LEAVE_REQUEST (
   leave_request_id  INT          AUTO_INCREMENT PRIMARY KEY,
   leave_type        VARCHAR(30)  NOT NULL,
   start_date        DATE         NOT NULL,
   end_date          DATE         NOT NULL,
   status            VARCHAR(20)  NOT NULL DEFAULT 'Pending',
   request_date      DATE         NOT NULL,
   employee_id       INT          NOT NULL,
   CONSTRAINT chk_leave_dates
       CHECK (end_date >= start_date),
   CONSTRAINT chk_leave_status
       CHECK (status IN ('Pending', 'Approved', 'Rejected')),
   CONSTRAINT fk_leave_request_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


/* ----------------------------------------------------
  DEPENDENT (weak entity)
  Stores each family member covered under an employee's benefits.
  Maps to the DEPENDENT entity, identified through HAS_DEPENDENT.
  Primary key = employee_id (owner) + dependent_name (partial key)
  ---------------------------------------------------- */
CREATE TABLE DEPENDENT (
   employee_id          INT           NOT NULL,
   dependent_name       VARCHAR(100)  NOT NULL,
   relationship_type    VARCHAR(30)   NOT NULL,
   date_of_birth        DATE          NOT NULL,
   coverage_start_date  DATE          NOT NULL,
   coverage_status      VARCHAR(20)   NOT NULL,
   PRIMARY KEY (employee_id, dependent_name),
   CONSTRAINT fk_dependent_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;


/* ----------------------------------------------------
  COMPETENCY
  Stores each skill or area employees are assessed on.
  Maps to the COMPETENCY entity (M side of ASSESSES).
  ---------------------------------------------------- */




CREATE TABLE COMPETENCY (
   competency_id    INT            AUTO_INCREMENT PRIMARY KEY,
   competency_name  VARCHAR(75)    NOT NULL UNIQUE,
   category         VARCHAR(50)    NOT NULL,
   description      VARCHAR(255)   NOT NULL,
   weight           DECIMAL(3,2)   NOT NULL,
   CONSTRAINT chk_competency_weight
       CHECK (weight BETWEEN 0 AND 1)
) ENGINE = InnoDB;




/* ----------------------------------------------------
  PROJECT
  Stores each project employees may be assigned to.
  Maps to the PROJECT entity (M side of ASSIGNED_TO).
  ---------------------------------------------------- */




CREATE TABLE PROJECT (
   project_id           INT            AUTO_INCREMENT PRIMARY KEY,
   project_name         VARCHAR(100)   NOT NULL UNIQUE,
   project_description  VARCHAR(255)   NOT NULL,
   start_date           DATE           NOT NULL,
   end_date             DATE           NULL,
   budget               DECIMAL(12,2)  NOT NULL,
   CONSTRAINT chk_project_dates
       CHECK (end_date IS NULL OR end_date >= start_date),
   CONSTRAINT chk_project_budget
       CHECK (budget >= 0)
) ENGINE = InnoDB;




/* ----------------------------------------------------
  TRAINING_PROGRAM
  Stores each course, module, or program employees may enroll in.
  Maps to the TRAINING_PROGRAM entity (M side of ENROLLS_IN).
  ---------------------------------------------------- */




CREATE TABLE TRAINING_PROGRAM (
   training_id        INT           AUTO_INCREMENT PRIMARY KEY,
   program_name       VARCHAR(100)  NOT NULL UNIQUE,
   provider           VARCHAR(100)  NOT NULL,
   duration_hours     INT           NOT NULL,
   training_category  VARCHAR(50)   NOT NULL,
   delivery_method    VARCHAR(30)   NOT NULL,
   CONSTRAINT chk_training_program_duration
       CHECK (duration_hours > 0),
   CONSTRAINT chk_training_program_delivery_method
       CHECK (delivery_method IN ('In-person', 'Online', 'Hybrid'))
) ENGINE = InnoDB;




/* ----------------------------------------------------
  PERFORMANCE_REVIEW
  Stores formal evaluations of an employee's work over a review period.
  Maps to the PERFORMANCE_REVIEW entity (N side of RECEIVES).
  ---------------------------------------------------- */




CREATE TABLE PERFORMANCE_REVIEW (
   review_id            INT           AUTO_INCREMENT PRIMARY KEY,
   review_date          DATE          NOT NULL,
   review_period_start  DATE          NOT NULL,
   review_period_end    DATE          NOT NULL,
   overall_score        DECIMAL(3,2)           NOT NULL,
   overall_comments    VARCHAR(500)  NULL,
   employee_id          INT           NOT NULL,
   CONSTRAINT chk_performance_review_dates
       CHECK (review_period_end >= review_period_start),
   CONSTRAINT chk_performance_review_score
       CHECK (overall_score BETWEEN 1 AND 5),
   CONSTRAINT fk_performance_review_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;




/* ----------------------------------------------------
  ASSESSES
  Stores the competency scores included in a performance review.
  Maps to ASSESSES, the M:N relationship between
  PERFORMANCE_REVIEW and COMPETENCY.
  Primary key = review_id + competency_id.
  ---------------------------------------------------- */




CREATE TABLE ASSESSES (
   review_id      INT           NOT NULL,
   competency_id  INT           NOT NULL,
   score          INT           NOT NULL,
   comments       VARCHAR(500)  NULL,
   PRIMARY KEY (review_id, competency_id),
   CONSTRAINT chk_assesses_score
       CHECK (score BETWEEN 1 AND 5),
   CONSTRAINT fk_assesses_review
       FOREIGN KEY (review_id) REFERENCES PERFORMANCE_REVIEW (review_id)
       ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT fk_assesses_competency
       FOREIGN KEY (competency_id) REFERENCES COMPETENCY (competency_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;




/* ----------------------------------------------------
  ASSIGNED_TO
  Stores employee assignments to projects.
  Maps to ASSIGNED_TO, the M:N relationship between
  EMPLOYEE and PROJECT.
  Primary key = employee_id + project_id.
  ---------------------------------------------------- */




CREATE TABLE ASSIGNED_TO (
   employee_id      INT            NOT NULL,
   project_id       INT            NOT NULL,
   project_role     VARCHAR(50)    NOT NULL,
   assigned_date    DATE           NOT NULL,
   project_rating   INT            NULL,
   hours_worked     DECIMAL(6,2)   NOT NULL DEFAULT 0,
   PRIMARY KEY (employee_id, project_id),
   CONSTRAINT chk_assigned_to_project_rating
       CHECK (project_rating IS NULL OR project_rating BETWEEN 1 AND 5),
   CONSTRAINT chk_assigned_to_hours_worked
       CHECK (hours_worked >= 0),
   CONSTRAINT fk_assigned_to_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT fk_assigned_to_project
       FOREIGN KEY (project_id) REFERENCES PROJECT (project_id)
       ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;




/* ----------------------------------------------------
  ENROLLS_IN
  Stores employee enrollments in training programs.
  Maps to ENROLLS_IN, the M:N relationship between
  EMPLOYEE and TRAINING_PROGRAM.
  Primary key = employee_id + training_id.
  ---------------------------------------------------- */




CREATE TABLE ENROLLS_IN (
   employee_id        INT           NOT NULL,
   training_id        INT           NOT NULL,
   enrollment_date    DATE          NOT NULL,
   completion_status  VARCHAR(20)   NOT NULL DEFAULT 'Enrolled',
   completion_date    DATE          NULL,
   PRIMARY KEY (employee_id, training_id),
   CONSTRAINT chk_enrolls_in_status
       CHECK (
           completion_status IN (
               'Enrolled',
               'In Progress',
               'Completed',
               'Withdrawn'
           )
       ),
   CONSTRAINT chk_enrolls_in_completion_date
       CHECK (
           completion_date IS NULL
           OR completion_date >= enrollment_date
       ),
   CONSTRAINT fk_enrolls_in_employee
       FOREIGN KEY (employee_id) REFERENCES EMPLOYEE (employee_id)
       ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT fk_enrolls_in_training_program
       FOREIGN KEY (training_id) REFERENCES TRAINING_PROGRAM (training_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;