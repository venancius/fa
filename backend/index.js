const express = require('express')
const cors = require('cors')
const app = express()
const port = 4000
const services = require('./services')

app.use(cors())

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/average-employee-age', services.getAverageEmployeeAge)
app.get('/average-title-salary', services.getAverageTitleSalary)


app.listen(port, () => console.log(`App running at port: ${port}`))

