const mysql = require('mysql')
const { Writable } = require('stream')

const kue = require('kue')
const queue = kue.createQueue()

const connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : 'employees',
})

exports.getAverageEmployeeAge =  function(req, res){
  const job = queue.create('getAverageEmployeeAge')
  console.log('on queue')
  job.on('failed', (err) => {
    console.log(err)
  })
  job.on('complete', (result) => {
    res.send(result)
  })
  job.save()
};

exports.getAverageTitleSalary =  function(req, res){
  const job = queue.create('getAverageTitleSalary')
  console.log('on queue')
  job.on('failed', (err) => {
    console.log(err)
  })
  job.on('complete', (result) => {
    res.send(result)
  })
  job.save()
};

queue.process('getAverageEmployeeAge', (job, done) => {
  try {
    const maxAge = 100
    const ageGap = 10
    const result = []

    for(let i=1; i < maxAge; i+=ageGap) {
      result.push({
        name: `${i} - ${i+9}`,
        value: 0,
      })
    }

    const outStream = new Writable({
      objectMode: true,
      write({ age }, encoding, callback) {
        for(let i = maxAge;i > 0; i-= ageGap) {
          if(age<=i && (age + 1) >= (i - ageGap)) {
            result[(i/ageGap)-1].value += 1
            callback()
            break
          }
        }
      }
    })

    const ageQuery = `SELECT *, YEAR(CURDATE()) - YEAR(birth_date) AS age FROM employees;`

    connection.query(ageQuery)
      .stream()
      .pipe(outStream)

    outStream.on('finish', () => {
      const filteredResult = result.filter( ({ value }) => value > 0).map( ({ value, name}) => ({ angle: value, label: name}))
      done(null, filteredResult)
    })
  }
  catch (e) {
    done(e)
  }
})


queue.process('getAverageTitleSalary', (job, done) => {
  try {
    console.time('getAverageTitleSalary')
    const result = []

    const outStream = new Writable({
      objectMode: true,
      write({ title, averageSalary}, encoding, callback) {
        result.push({
          y: averageSalary / 1000,
          x: title
        })
        callback()
      }
    })

    const avgSalaryQuery = `
    SELECT data.title, AVG(data.salary) AS averageSalary FROM (
      SELECT e.emp_no ,titles.title, salaries.salary FROM employees e
      INNER JOIN (SELECT max(to_date) as to_date, emp_no from titles group by emp_no) as latest_title
      ON e.emp_no = latest_title.emp_no
      INNER JOIN titles ON latest_title.emp_no = titles.emp_no AND latest_title.to_date = titles.to_date
      INNER JOIN (select max(to_date) as to_date, emp_no from salaries group by emp_no) as latest_salary
      ON e.emp_no = latest_salary.emp_no
      INNER JOIN salaries ON latest_salary .emp_no = salaries.emp_no AND latest_salary .to_date = salaries.to_date
    ) as data
    GROUP BY data.title
    ;`

    connection.query(avgSalaryQuery)
      .stream()
      .pipe(outStream)

    outStream.on('finish', () => {
      console.timeEnd('getAverageTitleSalary')
      done(null, result)
    })
  }
  catch(e) {
    done(e)
  }
})
