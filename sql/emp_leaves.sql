CREATE TABLE employees.emp_leaves (
	emp_no INT NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	`type` varchar(100) NOT NULL,
	CONSTRAINT emp_leaves_FK FOREIGN KEY (emp_no) REFERENCES employees.employees(emp_no) ON DELETE CASCADE ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;
