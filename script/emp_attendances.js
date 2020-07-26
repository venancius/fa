"use strict"

/*

The idea is to create larger chunk of data,
then store it via bulk insert everytime chunk contains x numbers of data,

on my machine it it runs 4x faster than storing it one query at a time
(with 100 maxUserChunk to keep memory usage relatively low)

*/

const mysql = require('mysql')
const { Transform, Writable } = require('stream')

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

const maxUserChunk = 100
let chunks = []
let hasNext = true

const dates = getWeekdayDates(new Date('2020-05-01'),new Date('2020-07-31'))
const datesLength = dates.length
const maxChunkLength = maxUserChunk * datesLength

const transformer = Transform({
  objectMode: true,
  transform: function(data,encoding,callback) {
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
    chunks = chunks.concat(data)
    if(chunks.length < maxChunkLength && hasNext) {
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

connection.query('SELECT * from employees')
  .stream()
  .pipe(transformer)
  .pipe(outStream)


transformer.on('finish', function(data) {
  hasNext = false
  console.log('reaches the end of file')
})

outStream.on('finish', () => {
  console.timeEnd('stream')
  process.exit()
})
