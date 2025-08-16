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
  const { data, error } = await supabase.from('candidators').select('*').not('resume_url', 'is', null).is('phone_number', null).is('is_available', true);
  if (error) throw error;
  return data;
}

// getCandidatorsWithoutDownloadLink
export async function getCandidatorsWithoutUrl() {
  const { data, error } = await supabase.from('candidators').select('*').is('resume_url', null).is('phone_number', null).not('url', 'is', null).order('gmail_timestamp', { ascending: false }).limit(100000);
  if (error) throw error;
  return data;
}


// updateCandidatorDownloadLink
export async function updateCandidatorDownloadLink(gmail_id, download_link, resume_fetched) {
  const { data, error } = await supabase.from('candidators').update({ resume_url: download_link, resume_fetched: resume_fetched ? 1 : 2 }).eq('gmail_id', gmail_id);
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
    .select('*', { count: 'exact', head: true })
    .is('is_available', true); // head: true returns no rows, just the count
  if (error) throw error;
  return count;
}

// for resume_download_link_bot
export async function getCandidatorsCountWithUrl() {
  const { data, error, count } = await supabase
    .from('candidators')
    .select('*', { count: 'exact', head: true })
    .or('resume_url.not.is.null,phone_number.not.is.null')
    .is('is_available', true);
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
    .eq('sms_transferred', 1);
  if (error) throw error;
  return count;
}

export async function getCandidatorsToNotify() {
  const { data, error } = await supabase.from('candidators').select('*').neq('phone_number', null).neq('sms_transferred', 1).limit(100000);
  if (error) throw error;
  return data;
}

export async function setCandidatorSMSStatus(gmail_id, status) {
  const { data, error } = await supabase.from('candidators').update({ sms_transferred: status }).eq('gmail_id', gmail_id);
  if (error) throw error;
  return data;
}

// for get candidators by status
export async function getCandidatorsByStatus(status, page, limit, search) {
  // Use coalesce to select name or gmail_name as name
  let query = supabase.from('candidators_with_name').select('*', { count: 'exact' });
  switch (status) {
    case 'fetched':
      query = query.or('resume_url.not.is.null,phone_number.not.is.null')
      break;
    case 'extracted':
      query = query.neq('phone_number', null);
      break;
    case 'transferred':
      query = query.eq('sms_transferred', 1);
      break;
    default:
      // no filter
      break;
  }
  
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  query = query.order('gmail_timestamp', { ascending: false });
  query = query.range((page - 1) * limit, page * limit - 1);
  const { data, error, count } = await query;
  if (error) {
    console.log('error', error);
    throw error;
  }
  return { data, count };
}