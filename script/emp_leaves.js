"use strict"

const mysql = require('mysql')
const { Transform, Writable } = require('stream')

const { getWeekdayDates } = require('./helper')

const connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : 'employees',
})

const dates = getWeekdayDates(new Date('2020-05-01'),new Date('2020-07-31'))

const leaveDurationInDays = {
  maternity: 90,
  sick: 1,
  unpaid: 1,
  annual: 1,
}

const maxChunkLength = 10
let chunks = []
let hasNext = true

const transformer = Transform({
  objectMode: true,
  transform: function(data,encoding,callback) {
    const hasLeave = Math.random() >= 0.5

    if(!hasLeave) { callback() }
    else {

    let baseDate = dates
    const leaveTypes = ['maternity', 'sick', 'unpaid', 'annual']
    const isFemale = data.gender === 'F'
    const leaves = []

    leaveTypes.forEach( leaveType => {
      const leaveChance = Math.random() >= 0.5

      if(!leaveChance || baseDate.length === 0) {
        return
      }

      if(leaveType === 'maternity' && isFemale) {
        const randomDate = baseDate[Math.floor(Math.random() * baseDate.length)]
        const maternityLeaveStartDate = new Date(randomDate)
        const maternityLeaveEndDate = new Date(randomDate)
        maternityLeaveEndDate.setDate(maternityLeaveEndDate.getDate() + leaveDurationInDays.maternity);

        leaves.push([
          data.emp_no, maternityLeaveStartDate, maternityLeaveEndDate, 'maternity'
        ])

        baseDate = baseDate.filter (date => (date < maternityLeaveStartDate || date > maternityLeaveEndDate))

      }

      if((leaveType === 'sick' || leaveType === 'unpaid')) {
        for(let i = 0; i<leaveDurationInDays[leaveType]; i++  ){

          const randomDate = baseDate[Math.floor(Math.random() * baseDate.length)]

          leaves.push([
            data.emp_no, randomDate, randomDate, leaveType
          ])

          baseDate = baseDate.filter(date => (date != randomDate))

        }
      }

      if((leaveType === 'annual')) {
        const randomDate = baseDate[Math.floor(Math.random() * baseDate.length)]

        leaves.push([
          data.emp_no, randomDate, randomDate, leaveType
        ])
      }

    })
    if(leaves.length > 0){
      this.push(leaves)
    }
    callback()
  }

  }
 })

const outStream = new Writable({
  objectMode: true,
  write(data, encoding, callback) {
    const toInsert = data

    const deletable = data.reduce( (prev, curr) => {
      if(curr[3] === 'maternity') {
        const maternityDates = getWeekdayDates(curr[1],curr[2])
        const matternityDatesOnly = maternityDates.map( mDates => {
          const month = mDates.getUTCMonth() + 1; //months from 1-12
          const day = mDates.getUTCDate();
          const year = mDates.getUTCFullYear();

          return `${year}/${month}/${day}`
        })

        return [
          ...prev,
          ...matternityDatesOnly,
        ]
      }

      const month = curr[1].getUTCMonth() + 1; //months from 1-12
      const day = curr[1].getUTCDate();
      const year = curr[1].getUTCFullYear();

      return [
        ...prev,
        `${year}/${month}/${day}`]
    }, [])

    const toDelete = [data[0][0], [deletable]]

    chunks.push({
      toDelete,
      toInsert
    })

    if(chunks.length < maxChunkLength && hasNext) {
      callback()
    }
else {
    connection.query(
      `INSERT INTO emp_leaves (emp_no,start_date,end_date,type) VALUES ?`,
      [chunks.reduce( (prev, curr) =>[...prev, ...curr.toInsert], [])],
      async function (err) {
        if(err) throw err

        await Promise.all( chunks.map( ({ toDelete }) => {
          return new Promise( (resolve, reject) => {
            connection.query(`DELETE FROM emp_attendances where emp_no = ? and date(start_date) in ?`,
              toDelete,
            function (err) {
              if(err) throw err
              resolve()
            }
            )
          })
        }))
        chunks = []
        callback()
      }
      )
  }
    }
  })
console.time('stream')

connection.query('SELECT * from employees limit 50')
  .stream()
  .pipe(transformer)
  .pipe(outStream)


  transformer.on('finish', function(data) {
    hasNext = false
    transformer.push(null)
    console.log('reaches the end of file')
  })

outStream.on('finish', () => {
  console.timeEnd('stream')
  process.exit()
})
