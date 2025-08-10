import supabase from './supabase.js'
import settingsService from '../services/SettingsService.js';

// Get all settings
export async function getAllSettings() {
  const { data, error } = await supabase.from('settings').select('name, value')
  if (error) throw error
  return data
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
  await settingsService.reload();
  return { success: true };
}
