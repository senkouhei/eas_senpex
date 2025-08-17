import supabase from './supabase.js'

// Get all settings
export async function getAllSettings() {
  const { data, error } = await supabase.from('settings').select('name, value')
  if (error) throw error
  return data
}

export async function getSetting(name) {
  const { data, error } = await supabase.from('settings').select('value').eq('name', name)
  if (error) throw error
  return data[0].value
}

// Update multiple settings at once
export async function updateSettingsBulk(settingsObj) {
  const updates = Object.entries(settingsObj).map(([name, value]) =>
    supabase.from('settings').update({ value }).eq('name', name)
  );
  // Run all updates in parallel
  const results = await Promise.all(updates);
  // Check for errors
  for (const result of results) {
    if (result.error) throw result.error;
  }
  return { success: true };
}
