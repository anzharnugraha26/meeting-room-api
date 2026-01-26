const express = require('express')
const cors = require('cors')
const roomRoutes = require('./routes/roomRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const { errorHandler } = require('./middlewares/errorMiddleware')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)

app.use(errorHandler)

module.exports = app