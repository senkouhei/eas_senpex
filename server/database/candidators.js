import supabase from './supabase.js';
import { timestampToSupabaseTimestamp } from '../utils/date.js';

/**
 * Inserts a new candidator row into Supabase.
 * @param {Object} data - The data to insert.
 * @param {string} data.gmail_id - The sender's id.
 * @param {string} data.gmail_name - The sender's name or email.
 * @param {string|number} data.gmail_timestamp - The timestamp in ms.
 * @param {string} data.url - The resume link.
 * @returns {Promise<Object>} - The result of the insert operation.
 */
export async function insertCandidator({ gmail_id, gmail_name, gmail_timestamp, url }) {
  const isoTimestamp = timestampToSupabaseTimestamp(gmail_timestamp);
  const { data, error } = await supabase
    .from('candidators')
    .insert([{ gmail_id, gmail_name, gmail_timestamp: isoTimestamp, url }]);
  if (error) throw error;
  return data;
}

// getCandidatorsWithoutContactInfo
export async function getCandidatorsWithoutContactInfo() {
  const { data, error } = await supabase.from('candidators').select('*').eq('contact_extracted', false);
  if (error) throw error;
  return data;
}

// getCandidatorsWithoutDownloadLink
export async function getCandidatorsWithoutUrl() {
  const { data, error } = await supabase.from('candidators').select('*').is('resume_url', null).is('phone_number', null).limit(100000);
  if (error) throw error;
  return data;
}


// updateCandidatorDownloadLink
export async function updateCandidatorDownloadLink(gmail_id, download_link) {
  const { data, error } = await supabase.from('candidators').update({ download_link }).eq('gmail_id', gmail_id);
  if (error) throw error;
  return data;
}

// updateCandidatorContactInfo
export async function updateCandidatorContactInfo(gmail_id, contact_info) {
  const { data, error } = await supabase.from('candidators').update(contact_info).eq('gmail_id', gmail_id);
  if (error) throw error;
  return data;
}

/**
 * Given an array of Gmail IDs, returns only those not present in Supabase (batching by 100).
 * @param {string[]} gmailIds
 * @returns {Promise<string[]>} - Array of unknown Gmail IDs
 */
export async function getUnknownGmailIds(gmailIds) {
  const { data, error } = await supabase.rpc('get_missing_gmail_ids', { input_ids: gmailIds }); 
  if (error) throw error;
  return data;
}

// for gmail_fetch_bot
export async function getCountOfAllCandidators() {
  const { data, error, count } = await supabase
    .from('candidators')
    .select('*', { count: 'exact', head: true }); // head: true returns no rows, just the count
  if (error) throw error;
  return count;
}

// for resume_download_link_bot
export async function getCandidatorsCountWithUrl() {
  const { data, error, count } = await supabase
    .from('candidators')
    .select('*', { count: 'exact', head: true })
    .or('resume_url.not.is.null,phone_number.not.is.null');
  if (error) throw error;
  return count;
}

// for contact_info_extraction_bot
export async function getCandidatorsCountWithContactInfo() {
  const { data, error, count } = await supabase
    .from('candidators')
    .select('*', { count: 'exact', head: true })
    .neq('phone_number', null);
  if (error) throw error;
  return count;
}

// for twilio_sms_bot
export async function getCandidatorsCountWithTwilioSMS() {
  const { data, error, count } = await supabase
    .from('candidators')
    .select('*', { count: 'exact', head: true })
    .eq('sms_transferred', true);
  if (error) throw error;
  return count;
}
