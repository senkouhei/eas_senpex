import supabase from './supabase.js'

// Get all settings
export async function getAllSettings() {
  try {
    const { data, error } = await supabase.from('settings').select('name, value')
    if (error) throw error
    return data
  } catch (err) {
    console.error('Supabase getAllSettings error:', err);
    return null;
  }
}

export async function getSetting(name) {
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('name', name)
    if (error) throw error
    return data[0]?.value ?? null
  } catch (err) {
    console.error('Supabase getSetting error:', err);
    return null;
  }
}

// Update multiple settings at once
export async function updateSettingsBulk(settingsObj) {
  try {
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
  } catch (err) {
    console.error('Supabase updateSettingsBulk error:', err);
    return null;
  }
}
