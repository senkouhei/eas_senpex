import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { log } from '../utils/log.js';

dotenv.config();

class SupabaseClient {
  constructor() {
    if (!SupabaseClient.instance) {
      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      SupabaseClient.instance = this;
      log('SupabaseClient initialized');
    }
    return SupabaseClient.instance;
  }

  getClient() {
    return this.client;
  }
}

const supabase = new SupabaseClient().getClient();
export default supabase;