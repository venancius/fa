const { pipeline, Readable } = require('stream');
const pipe = require('pipeline-pipe');
const mysql = require('mysql')
const { randomIntFromInterval, getWeekdayDates } = require('./helper')
const { promisify } = require('util')
const dates = getWeekdayDates(new Date('2020-05-01'),new Date('2020-07-31'))


const pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : 'employees',
})

const query = promisify(pool.query).bind(pool);

pipeline(
  pool.query('SELECT * from employees limit 100').stream(),
  pipe( data => {
    const userChunk = dates.map( date => {
      const startHour = new Date(date)
      startHour.setHours(randomIntFromInterval(8,10))
      startHour.setMinutes(randomIntFromInterval(0,59))
      startHour.setSeconds(randomIntFromInterval(0,59))

      const endHour = new Date(date)
      endHour.setHours(randomIntFromInterval(17,19))
      endHour.setMinutes(randomIntFromInterval(0,59))
      endHour.setSeconds(randomIntFromInterval(0,59))

      return [
        data.emp_no,
        startHour,
        endHour,
        randomIntFromInterval(30, 90)
      ]
    })
    // console.log(userChunk)
    return userChunk
  }),
  pipe( async transformed => await query(
      `INSERT INTO emp_attendances (emp_no,start_date,end_date,break_time) VALUES ?`,
      [transformed]      )
  ),
  (err) => console.log('all done'),
);
