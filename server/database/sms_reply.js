import supabase from './supabase.js'

// Get all replies
export async function getAllReplies() {
  try {
    const { data, error } = await supabase.from('sms_replies').select('*')
    if (error) throw error
    return data
  } catch (err) {
    console.error('Supabase getAllReplies error:', err);
    return null;
  }
}

export async function insertReply(replyObj) {
  try {
    const { data, error } = await supabase.from('sms_replies').insert(replyObj)
    if (error) throw error
    return data
  } catch (err) {
    console.error('Supabase insertReply error:', err);
    return null;
  }
}