import supabase from './supabase.js'

// Get a setting by name
export async function getSetting(name) {
  const { data, error } = await supabase.from('settings').select('name, value').eq('name', name).single()
  if (error) throw error
  return data
}

// Get all settings
export async function getAllSettings() {
  const { data, error } = await supabase.from('settings').select('name, value')
  if (error) throw error
  return data
}

// Create a new setting
export async function createSetting(name, value) {
  const { data, error } = await supabase.from('settings').insert([{ name, value }]).select().single()
  if (error) throw error
  return data
}

// Update a setting by name
export async function updateSetting(name, value) {
  const { data, error } = await supabase.from('settings').update({ value }).eq('name', name).select().single()
  if (error) throw error
  return data
}

// Delete a setting by name
export async function deleteSetting(name) {
  const { error } = await supabase.from('settings').delete().eq('name', name)
  if (error) throw error
  return { success: true }
}
