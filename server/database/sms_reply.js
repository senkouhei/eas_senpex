import supabase from './supabase.js'

// Get all replies
export async function getAllReplies() {
  const { data, error } = await supabase.from('sms_replies').select('*')
  if (error) throw error
  return data
}

export async function insertReply(replyObj) {
  const { data, error } = await supabase.from('sms_replies').insert(replyObj)
  if (error) throw error
  return data
}