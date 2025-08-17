import supabase from './supabase.js';

/**
 * Insert a log entry into the logs table.
 * @param {Object} log
 * @param {string} log.bot - The bot name
 * @param {string} log.type - The log type
 * @param {string} log.content - The log content
 * @param {string} [log.url] - Optional URL
 * @returns {Promise<Object>} - The inserted log or error
 */
export async function insertLog({ bot, type, content, url = null }) {
  const { data, error } = await supabase
    .from('logs')
    .insert([{ bot, type, content, url }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
