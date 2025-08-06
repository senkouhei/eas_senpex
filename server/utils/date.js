// Converts a timestamp (ms since epoch) to 'YYYY-MM-DD HH:mm' string
export function timestampToDateString(timestamp) {
  const date = new Date(Number(timestamp));
  const pad = n => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${min}`;
}

// Converts a JS timestamp (ms) to ISO string for Supabase/Postgres timestamp
export function timestampToSupabaseTimestamp(timestamp) {
  return new Date(Number(timestamp)).toISOString();
}
