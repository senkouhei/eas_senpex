-- Create database schema for candidator dashboard

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  openai_api_key VARCHAR(255),
  telnyx_api_key VARCHAR(255),
  telnyx_phone_number VARCHAR(50),
  twilio_auth_token VARCHAR(255),
  twilio_account_sid VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidators table
CREATE TABLE IF NOT EXISTS candidators (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(50),
  url VARCHAR(500),
  resume_fetched BOOLEAN DEFAULT FALSE,
  contact_extracted BOOLEAN DEFAULT FALSE,
  sms_transferred BOOLEAN DEFAULT FALSE,
  sms_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (openai_api_key, telnyx_api_key, telnyx_phone_number, twilio_auth_token, twilio_account_sid) 
VALUES ('', '', '', '', '') 
ON CONFLICT DO NOTHING;

-- Insert sample candidators
INSERT INTO candidators (name, email, phone_number, city, state, url, resume_fetched, contact_extracted, sms_transferred, sms_status) VALUES
('John Doe', 'john.doe@email.com', '+1234567890', 'New York', 'NY', 'https://linkedin.com/in/johndoe', true, true, false, 'pending'),
('Jane Smith', 'jane.smith@email.com', '+1234567891', 'Los Angeles', 'CA', 'https://linkedin.com/in/janesmith', true, false, false, 'pending'),
('Mike Johnson', 'mike.johnson@email.com', '+1234567892', 'Chicago', 'IL', 'https://linkedin.com/in/mikejohnson', false, false, false, 'pending'),
('Sarah Wilson', 'sarah.wilson@email.com', '+1234567893', 'Houston', 'TX', 'https://linkedin.com/in/sarahwilson', true, true, true, 'sent'),
('David Brown', 'david.brown@email.com', '+1234567894', 'Phoenix', 'AZ', 'https://linkedin.com/in/davidbrown', true, true, true, 'delivered')
ON CONFLICT (email) DO NOTHING;