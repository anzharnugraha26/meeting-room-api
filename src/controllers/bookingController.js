const bookingModel = require('../models/bookingModel')
const supabase = require('../config/supabase') //
const dayjs = require('dayjs')

exports.getBookings = async (req, res, next) => {
  try {
    const { data, error } = await bookingModel.getAllBookings()
    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
}

exports.createBooking = async (req, res, next) => {
  try {
    const { room_id, name, title, description, start_time, end_time } = req.body

    if (!room_id || !name || !start_time || !end_time) {
      return res.status(400).json({ message: 'room_id, name, start_time, end_time wajib diisi' })
    }

    if (dayjs(end_time).isBefore(dayjs(start_time))) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }

    // Cek konflik HANYA dengan booking approved
    const { data: conflict } = await bookingModel.checkConflict(room_id, start_time, end_time)

    if (conflict.length > 0) {
      return res.status(400).json({ message: 'Room already booked (approved booking exists at that time)' })
    }

    // Simpan sebagai PENDING
    const { data, error } = await bookingModel.createBooking({
      room_id,
      name,
      title,
      description,
      start_time,
      end_time,
      status: 'pending'
    })

    if (error) throw error

    res.status(201).json({
      message: 'Booking submitted, waiting for approval',
      booking: data[0]
    })
  } catch (err) {
    next(err)
  }
}

exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params
    const { error } = await bookingModel.deleteBooking(id)
    if (error) throw error
    res.json({ message: 'Booking deleted' })
  } catch (err) {
    next(err)
  }
}

exports.getBookingsByRoom = async (req, res, next) => {
  try {
    const { room_id } = req.params
    const { status, date } = req.query

    if (!room_id) {
      return res.status(400).json({ message: 'room_id is required' })
    }

    const { data, error } = await bookingModel.getBookingsByRoom(room_id, status, date)

    if (error) throw error

    res.json({
      room_id,
      total: data.length,
      bookings: data
    })
  } catch (err) {
    next(err)
  }
}

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowedStatus = ['approved', 'rejected', 'cancelled', 'completed']

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    // Ambil booking
    const { data: booking, error: bookingError } = await bookingModel.getBookingById(id)
    if (bookingError) throw bookingError
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    // 🔥 Kalau mau approve, cek konflik dulu
    if (status === 'approved') {
      const { data: conflict } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', booking.room_id)
        .eq('status', 'approved')
        .neq('id', booking.id)
        .lt('start_time', booking.end_time)
        .gt('end_time', booking.start_time)

      if (conflict.length > 0) {
        return res.status(400).json({
          message: 'Cannot approve. Time slot already used by another approved booking'
        })
      }
    }

    // Update status
    const { data, error } = await bookingModel.updateBookingStatus(id, status)
    if (error) throw error

    res.json({
      message: `Booking status updated to ${status}`,
      booking: data[0]
    })
  } catch (err) {
    next(err)
  }
}