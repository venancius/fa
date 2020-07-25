"use strict"

const mysql = require('mysql')
const { Transform, Readable, Writable } = require('stream')

const { randomIntFromInterval, getWeekdayDates } = require('./helper')

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

const maxConcurrent = 10
let chunks = []
let count = 0

const dates = getWeekdayDates(new Date('2020-05-01'),new Date('2020-07-31'))
const datesLength = dates.length

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

    this.push(userChunk)
    callback()
  }
 })

const outStream = new Writable({
  objectMode: true,
  write(data, encoding, callback) {
    // console.log(chunks.length, maxConcurrent * datesLength)
    chunks = chunks.concat(data)
    if(chunks.length < (maxConcurrent * datesLength)) {
      callback()
    }

    else {
      connection.query(
        `INSERT INTO emp_attendances (emp_no,start_date,end_date,break_time) VALUES ?`,
        [chunks],
        function (err) {
          if(err) throw err
          chunks = []
          callback()
        }
        )
    }
    }
  })

connection.query('SELECT * from employees limit 1000')
  .stream()
  .pipe(transformer)
  .pipe(outStream)


transformer.on('end', () => console.log('reaches the end of file'))

outStream.on('finish', () => {
  console.timeEnd('stream')
  process.exit()
})
