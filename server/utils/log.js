import { insertLog } from '../database/logs.js';

/**
 * Log an event to the database.
 * @param {string} bot - The bot name
 * @param {string} type - The log type
 * @param {string} content - The log content
 * @param {string} [url] - Optional URL
 * @returns {Promise<Object>} - The inserted log or error
 */
export async function logEvent(bot, type, content, url = null) {
  console.log('Logging event:', { bot, type, content, url });
  return await insertLog({ bot, type, content, url });
}
