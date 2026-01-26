const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')

router.get('/', bookingController.getBookings)
router.post('/', bookingController.createBooking)
router.delete('/:id', bookingController.deleteBooking)
router.get('/room/:room_id', bookingController.getBookingsByRoom)
router.patch('/:id/status', bookingController.updateBookingStatus)

module.exports = router