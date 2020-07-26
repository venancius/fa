"use strict"

const mysql = require('mysql')
const { Writable } = require('stream')
const { promisify } = require('util')

const connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : 'employees',
})

const query = promisify(connection.query).bind(connection)

const outStream = Writable({
  objectMode: true,
  write: async function(data,encoding,callback) {
    let salaryIncrementPercentage = 0
    let salaryIncrementAmount = 0

    const latestTitle = await query(`SELECT title FROM titles WHERE emp_no = ? ORDER BY to_date DESC LIMIT 1`,
    data.emp_no)
    const latestSalary = await query(`SELECT salary, to_date FROM salaries WHERE emp_no = ? ORDER BY to_date DESC LIMIT 1`,
    data.emp_no)

    const unpaidLeavesCount = await query(`SELECT count(*) as count FROM emp_leaves WHERE emp_no = ? and type = 'unpaid' `,
    data.emp_no)

    const avgWorkingHour = data.working_hours / (data.working_days + unpaidLeavesCount[0].count)
    const avgBreakTime = data.sum_break_time / data.working_days
    // check working hours
    if(avgWorkingHour >= 12) {
      salaryIncrementPercentage += 5
    } else if (avgWorkingHour <= 8) {
      salaryIncrementPercentage += 2.5
    } else if (avgWorkingHour <= 7) {
      salaryIncrementPercentage += 0.5
    } else if (avgWorkingHour < 5) {
      salaryIncrementPercentage += 0
    }

    // break time
    if(avgBreakTime > 60) {
      salaryIncrementPercentage -=1
    }

    // job title
    switch(latestTitle[0].title) {
      case 'Staff':
        salaryIncrementPercentage +=1
        break
      case 'Senior Engineer':
        salaryIncrementPercentage +=3
        break
      case 'Engineer':
        salaryIncrementPercentage +=2
        break
      case 'Assistant Engineer':
        salaryIncrementPercentage +=2.5
        break
      case 'Technique Leader':
        salaryIncrementPercentage +=4
        break
      default:
        salaryIncrementAmount += 1000
    }
    let totalIncrement = (latestSalary[0].salary * (salaryIncrementPercentage/100)) + salaryIncrementAmount

    if(totalIncrement < 0) { totalIncrement = 0 }
    if(totalIncrement > 5000) { totalIncrement = 5000 }

    const newSalary = latestSalary[0].salary + totalIncrement
    const date = new Date()

    // update latest salary
    await query('UPDATE salaries SET to_date = ?  WHERE emp_no = ? AND to_date = ? ',
    [date, data.emp_no, latestSalary[0].to_date]
    )
    // insert new salary
    await query('INSERT INTO salaries (emp_no, salary, from_date, to_date) VALUES ? ',
    [[[data.emp_no, newSalary, date, '9999-01-01']]]
    )

    callback()
  }
 })

console.time('stream')

const sqlQuery = `SELECT (SUM(TIME_TO_SEC(TIMEDIFF(end_date, start_date ))))/3600 as working_hours,
COUNT(*) as working_days,
SUM(break_time) as sum_break_time, emp_no
FROM emp_attendances ea
GROUP BY emp_no LIMIT 1000;`


connection.query(sqlQuery)
  .stream()
  .pipe(outStream)


outStream.on('finish', data => {
  console.log('reaches the end of file')
})

outStream.on('finish', () => {
  console.timeEnd('stream')
  process.exit()
})
