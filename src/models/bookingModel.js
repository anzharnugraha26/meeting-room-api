const supabase = require('../config/supabase')

exports.getAllBookings = async () => {
  return await supabase
    .from('bookings')
    .select('*, rooms(name, location)')
    .order('created_at', { ascending: false }) // terbaru di atas
}

exports.createBooking = async (booking) => {
  return await supabase.from('bookings').insert([booking]).select()
}

exports.deleteBooking = async (id) => {
  return await supabase.from('bookings').delete().eq('id', id)
}

exports.checkConflict = async (room_id, start_time, end_time) => {
  return await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', room_id)
    .eq('status', 'approved') // 🔥 HANYA YANG SUDAH DI-ACC
    .lt('start_time', end_time)
    .gt('end_time', start_time)
}

exports.getBookingsByRoom = async (room_id, status, date) => {
  let query = supabase
    .from('bookings')
    .select(`
      id,
      name,
      title,
      description,
      start_time,
      end_time,
      status,
      rooms(name, location)
    `)
    .eq('room_id', room_id)
    .order('start_time', { ascending: true })

  // Filter status (opsional)
  if (status) {
    query = query.eq('status', status)
  }

  // Filter tanggal (opsional)
  if (date) {
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`
    query = query.gte('start_time', startOfDay).lte('start_time', endOfDay)
  }

  return await query
}

exports.getBookingById = async (id) => {
  return await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()
}

exports.updateBookingStatus = async (id, status) => {
  return await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
}