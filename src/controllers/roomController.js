const supabase = require('../config/supabase') //
const roomModel = require('../models/roomModel')
const dayjs = require('dayjs')


exports.getRooms = async (req, res, next) => {
  try {
    const { data: rooms, error } = await roomModel.getAllRooms()
    if (error) throw error

    const now = dayjs().toISOString()

    // 1️⃣ Booking yang sedang berlangsung
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('room_id')
      .eq('status', 'approved')
      .lte('start_time', now)
      .gte('end_time', now)

    // 2️⃣ Booking yang akan datang (approved & belum mulai)
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select('room_id, start_time')
      .eq('status', 'approved')
      .gt('start_time', now)
      .order('start_time', { ascending: true })

    const occupiedRoomIds = activeBookings.map(b => b.room_id)

    const nextBookingMap = {}
    upcomingBookings.forEach(b => {
      if (!nextBookingMap[b.room_id]) {
        nextBookingMap[b.room_id] = b.start_time
      }
    })

    const roomsWithStatus = rooms.map(room => {
      const isOccupied = occupiedRoomIds.includes(room.id)
      return {
        ...room,
        realtime_status: isOccupied ? 'occupied' : room.status,
        next_booking_start: nextBookingMap[room.id] || null
      }
    })

    res.json(roomsWithStatus)
  } catch (err) {
    next(err)
  }
}

exports.createRoom = async (req, res, next) => {
  try {
    const { name, location, capacity } = req.body
    const { data, error } = await roomModel.createRoom({ name, location, capacity })
    if (error) throw error
    res.status(201).json(data[0])
  } catch (err) {
    next(err)
  }
}