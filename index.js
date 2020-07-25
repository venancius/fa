const mysql = require('mysql');
const { Transform, Readable, Writable } = require('stream')
const { promisify } = require('util');

const connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : 'employees',
});

let chunk = []

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
});

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
});


const query = promisify(connection.query).bind(connection);
// get employees count

const startETL = async () => {
  // const employeesCount = (await query('SELECT count(emp_no) as count from employees'))[0].count

  connection.query('SELECT * from employees limit 100052').stream().pipe(transformer).on('finish', () => console.log('done selecting'))
  inStream.pipe(outStream)

  inStream.on('end', () => console.log('input end'))
  outStream.on('finish', () => {
    console.log('done inserting')
    process.exit(200)
  })

  transformer.on('id', function(id){
    chunk.push([id, '2020-07-22 12:00:00', '2020-07-22 15:00:00', 30])

    if(chunk.length % 10000 === 0) {
      inStream.push(chunk)
      chunk = []
    }
  })

  transformer.on('finish', () => {
    inStream.push(chunk)
    inStream.push(null)
  })
}

startETL()


