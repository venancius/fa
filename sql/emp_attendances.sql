CREATE TABLE employees.emp_attendances (
	emp_no INT NOT NULL,
	start_date TIMESTAMP NOT NULL,
	end_date TIMESTAMP NOT NULL,
	break_time INT NOT NULL,
	CONSTRAINT emp_attendances_FK FOREIGN KEY (emp_no) REFERENCES employees.employees(emp_no) ON DELETE CASCADE ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX emp_attendances_emp_no_IDX USING BTREE ON employees.emp_attendances (emp_no,start_date);
