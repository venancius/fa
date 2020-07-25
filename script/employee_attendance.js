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

const transformer = Transform({
  objectMode: true,
  transform: function(data,encoding,callback) {
    this.emit('id',data.emp_no)
    callback()
  }
 })

const inStream = new Readable({
  objectMode: true,
  read() {
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

const start = async function() {
  console.time('etlProcess')
  const bulkInsertLimit = 100

  const dates = getWeekdayDates(new Date('2020-05-01'),new Date('2020-07-31'))
  const datesLength = dates.length
  let chunk = []

  connection.query('SELECT * from employees').stream().pipe(transformer).on('finish', function() {console.log('done selecting')})
  inStream.pipe(outStream)

  inStream.on('end', function() {console.log('reaches the end of input')})
  outStream.on('finish', function() {
    console.log('finished inserting data')
    console.timeEnd('etlProcess')
    process.exit()
  })

  transformer.on('id', function(id){
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
        id,
        startHour,
        endHour,
        randomIntFromInterval(30, 90)
      ]
    })

    // inStream.push(userChunk)

    // const userChunk = [
    //   [
    //     id,
    //     '22-11-07 22:22:22',
    //     '22-11-07 23:23:23',
    //     30
    //   ]
    // ]

    // connection.query(
    //   `INSERT INTO emp_attendances (emp_no,start_date,end_date,break_time) VALUES ?`,
    //   [userChunk],
    //   function (err) {
    //     if(err) throw err
    //     // callback()
    //   }
    //   )

    chunk = chunk.concat(userChunk)

    if(chunk.length % (datesLength * bulkInsertLimit) === 0) {
      inStream.push(chunk)
      chunk = []
    }
  })

  transformer.on('finish', function() {
    if(chunk.length > 0) {
      inStream.push(chunk)
    }
    inStream.push(null)
  })
}

start()


