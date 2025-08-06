import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SupabaseClient {
  constructor() {
    if (!SupabaseClient.instance) {
      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      SupabaseClient.instance = this;
    }
    return SupabaseClient.instance;
  }

  getClient() {
    return this.client;
  }
}

const supabase = new SupabaseClient().getClient();
export default supabase;