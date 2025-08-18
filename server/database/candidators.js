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
  try {
    const isoTimestamp = timestampToSupabaseTimestamp(gmail_timestamp);
    const { data, error } = await supabase
      .from('candidators')
      .insert([{ gmail_id, gmail_name, gmail_timestamp: isoTimestamp, url }]);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase insertCandidator error:', err);
    return null;
  }
}

// Get All Candidates
export async function getAllCandidates(page = 1, limit = 1000) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from('candidators')
      .select('*', { count: 'exact' })
      .order('gmail_timestamp', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, count };
  } catch (err) {
    console.error('Supabase getAllCandidates error:', err);
    return null;
  }
}


// getCandidatorsWithoutContactInfo
export async function getCandidatorsWithoutContactInfo() {
  try {
    const { data, error } = await supabase.from('candidators').select('*').not('resume_url', 'is', null).is('phone_number', null).is('is_available', true).eq('contact_extracted', 0).order('gmail_timestamp', { ascending: false }).limit(100000);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase getCandidatorsWithoutContactInfo error:', err);
    return null;
  }
}

// getCandidatorsWithoutDownloadLink
export async function getCandidatorsWithoutUrl() {
  try {
    const { data, error } = await supabase.from('candidators').select('*').is('resume_url', null).is('phone_number', null).not('url', 'is', null).eq('resume_fetched', 0).order('gmail_timestamp', { ascending: false }).limit(100000);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase getCandidatorsWithoutUrl error:', err);
    return null;
  }
}


// updateCandidatorDownloadLink
export async function updateCandidatorDownloadLink(gmail_id, download_link, resume_fetched) {
  try {
    const { data, error } = await supabase.from('candidators').update({ resume_url: download_link, resume_fetched: resume_fetched ? 1 : 2 }).eq('gmail_id', gmail_id);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase updateCandidatorDownloadLink error:', err);
    return null;
  }
}

// updateCandidatorContactInfo
export async function updateCandidatorContactInfo(gmail_id, contact_info) {
  try {
    const { data, error } = await supabase.from('candidators').update(contact_info).eq('gmail_id', gmail_id);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase updateCandidatorContactInfo error:', err);
    return null;
  }
}

/**
 * Given an array of Gmail IDs, returns only those not present in Supabase (batching by 100).
 * @param {string[]} gmailIds
 * @returns {Promise<string[]>} - Array of unknown Gmail IDs
 */
export async function getUnknownGmailIds(gmailIds) {
  try {
    const { data, error } = await supabase.rpc('get_missing_gmail_ids', { input_ids: gmailIds });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase getUnknownGmailIds error:', err);
    return null;
  }
}

// for gmail_fetch_bot
export async function getCountOfAllCandidators() {
  try {
    const { data, error, count } = await supabase
      .from('candidators')
      .select('*', { count: 'exact', head: true })
      .is('is_available', true); // head: true returns no rows, just the count
    if (error) throw error;
    return count;
  } catch (err) {
    console.error('Supabase getCountOfAllCandidators error:', err);
    return null;
  }
}

// for resume_download_link_bot
export async function getCandidatorsCountWithUrl() {
  try {
    const { data, error, count } = await supabase
      .from('candidators')
      .select('*', { count: 'exact', head: true })
      .or('resume_url.not.is.null,phone_number.not.is.null')
      .is('is_available', true);
    if (error) throw error;
    return count;
  } catch (err) {
    console.error('Supabase getCandidatorsCountWithUrl error:', err);
    return null;
  }
}

// for contact_info_extraction_bot
export async function getCandidatorsCountWithContactInfo() {
  try {
    const { data, error, count } = await supabase
      .from('candidators')
      .select('*', { count: 'exact', head: true })
      .neq('phone_number', null);
    if (error) throw error;
    return count;
  } catch (err) {
    console.error('Supabase getCandidatorsCountWithContactInfo error:', err);
    return null;
  }
}

// for twilio_sms_bot
export async function getCandidatorsCountWithTwilioSMS() {
  try {
    const { data, error, count } = await supabase
      .from('candidators')
      .select('*', { count: 'exact', head: true })
      .eq('sms_transferred', 1);
    if (error) throw error;
    return count;
  } catch (err) {
    console.error('Supabase getCandidatorsCountWithTwilioSMS error:', err);
    return null;
  }
}

export async function getCandidatorsToNotify() {
  try {
    const { data, error } = await supabase.from('candidators').select('*').neq('phone_number', null).eq('sms_transferred', 0).order('gmail_timestamp', { ascending: false }).limit(100000);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase getCandidatorsToNotify error:', err);
    return null;
  }
}

export async function setCandidatorSMSStatus(gmail_id, transfered, sid, datetime, status, body) {
  try {
    const { data, error } = await supabase.from('candidators').update({ sms_transferred: transfered, sms_sid: sid, sms_transfered_datetime: datetime || new Date().toISOString(), sms_text: body }).eq('gmail_id', gmail_id);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase setCandidatorSMSStatus error:', err);
    return null;
  }
}

// for get candidators by status
export async function getCandidatorsByStatus(status, page, limit, search) {
  try {
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
    if (error) throw error;
    return { data, count };
  } catch (err) {
    console.error('Supabase getCandidatorsByStatus error:', err);
    return null;
  }
}

export async function updateCandidatorSMSStatus({phone_number, sid, datetime, status, body}) {
  try {
    const { data, error } = await supabase
      .from('candidators')
      .update({ sms_status: status, sms_sid: sid, sms_transfered_datetime: datetime, sms_text: body })
      .eq('phone_number', phone_number);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase updateCandidatorSMSStatus error:', err);
    return null;
  }
}

export async function updateCandidatorSMSStatusBySid(sid, status) {
  try {
    const { data, error } = await supabase
      .from('candidators')
      .update({ sms_status: status })
      .eq('sms_sid', sid);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase updateCandidatorSMSStatus error:', err);
    return null;
  }
}

export async function getCandidatesPedingSMS() {
  try {
    const { data, error } = await supabase
      .from('candidators')
      .select('*')
      .neq('sms_status', 'delivered')
      .neq('sms_status', 'failed')
      .neq('sms_sid', null);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase updateCandidatorSMSStatus error:', err);
    return null;
  }
}