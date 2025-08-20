import { logEvent } from '../utils/log.js';
import supabase from './supabase.js';

// Get SMS Sent by Date
export async function getAnalyticsByDate(start_date, end_date) {
  try {
    const { data, error } = await supabase.rpc('sms_sent_by_date', { start_date, end_date });
    if (error) throw error;
    return data;
  } catch (err) {
    logEvent('analytics.js', 'ERROR', 'Supabase getAnalyticsByDate error: ' + err.message);
    return null;
  }
}

export async function getAnalyticsByState(start_date, end_date) {
  try {
    const { data, error } = await supabase.rpc('sms_sent_by_state', { start_date, end_date });
    if (error) throw error;
    return data;
  } catch (err) {
    logEvent('analytics.js', 'ERROR', 'Supabase getAnalyticsByState error: ' + err.message);
    return null;
  }
}