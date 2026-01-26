const supabase = require('../config/supabase')

exports.getAllRooms = async () => {
  return await supabase.from('rooms').select('*').order('created_at')
}

exports.createRoom = async (room) => {
  return await supabase.from('rooms').insert([room]).select()
}