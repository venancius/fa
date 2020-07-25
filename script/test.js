"use strict"

const mysql = require('mysql')
const { Transform, Readable, Writable } = require('stream')

const { randomIntFromInterval, getWeekdayDates } = require('./utils')

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000))
  return this
}

const connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : 'employees',
})

const dates = getWeekdayDates(new Date('2020-05-01'),new Date('2020-07-31'))

const transformer = Transform({
  objectMode: true,
  transform: function(data,encoding,callback) {
    // console
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
    connection.query(
      `INSERT INTO emp_attendances (emp_no,start_date,end_date,break_time) VALUES ?`,
      [userChunk],
      function (err) {
        if(err) throw err
        callback()
      }
      )
  }
 })

const outStream = new Writable({
  objectMode: true,
  write(data, encoding, callback) {
    connection.query(
      `INSERT INTO emp_attendances (emp_no,start_date,end_date,break_time) VALUES ?`,
      [data],
      function (err) {
        if(err) throw err
        callback()
      }
      )
    }
  })

console.time('stream')
connection.query('SELECT * from employees')
  .stream()
  .pipe(transformer)
  .pipe(outStream)


transformer.on('end', () => console.log('reaches the end of file'))
outStream.on('finish', () => {
  console.timeEnd('stream')
  process.exit()
})
