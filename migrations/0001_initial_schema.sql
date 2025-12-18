-- IVR Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'functional', 'regression', 'load', 'performance'
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'draft'
  phone_number TEXT,
  test_steps TEXT NOT NULL, -- JSON array of test steps
  expected_results TEXT, -- JSON array of expected results
  dtmf_inputs TEXT, -- JSON array of DTMF inputs
  voice_prompts TEXT, -- JSON array of voice prompts to expect
  timeout_seconds INTEGER DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Test Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'completed', 'paused'
  schedule_type TEXT, -- 'immediate', 'scheduled', 'recurring'
  schedule_time DATETIME,
  recurrence_pattern TEXT, -- JSON for cron-like pattern
  concurrent_calls INTEGER DEFAULT 1,
  total_calls INTEGER DEFAULT 1,
  test_case_ids TEXT NOT NULL, -- JSON array of test case IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_case_id INTEGER NOT NULL,
  campaign_id INTEGER,
  status TEXT NOT NULL, -- 'passed', 'failed', 'error', 'timeout'
  execution_time_ms INTEGER,
  call_duration_ms INTEGER,
  voice_quality_score REAL, -- 0-100 score
  audio_clarity_score REAL, -- 0-100 score
  dtmf_recognition_rate REAL, -- 0-100 percentage
  call_flow_path TEXT, -- JSON array of nodes traversed
  error_message TEXT,
  audio_recording_url TEXT,
  transcript TEXT, -- Call transcript
  response_times TEXT, -- JSON array of response times for each step
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Call Flow Nodes Table (for IVR Discovery/Mapping)
CREATE TABLE IF NOT EXISTS call_flow_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_id INTEGER NOT NULL,
  node_id TEXT UNIQUE NOT NULL, -- unique identifier for the node
  node_type TEXT NOT NULL, -- 'prompt', 'menu', 'dtmf', 'transfer', 'end'
  node_label TEXT NOT NULL,
  prompt_text TEXT,
  audio_file_url TEXT,
  parent_node_id TEXT,
  dtmf_options TEXT, -- JSON array of DTMF options
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flow_id) REFERENCES call_flows(id)
);

-- Call Flows Table
CREATE TABLE IF NOT EXISTS call_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  flow_data TEXT, -- JSON representation of the entire flow
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_result_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL, -- 'latency', 'jitter', 'packet_loss', 'mos_score'
  metric_value REAL NOT NULL,
  unit TEXT, -- 'ms', 'percent', 'score'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_result_id) REFERENCES test_results(id)
);

-- Monitoring Alerts Table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL, -- 'performance', 'availability', 'quality', 'error_rate'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  message TEXT NOT NULL,
  test_case_id INTEGER,
  campaign_id INTEGER,
  threshold_value REAL,
  actual_value REAL,
  status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'resolved'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin', 'user', 'viewer'
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  slack_enabled BOOLEAN DEFAULT FALSE,
  email_addresses TEXT, -- JSON array of email addresses
  phone_numbers TEXT, -- JSON array of phone numbers
  slack_webhooks TEXT, -- JSON array of Slack webhook URLs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_type ON test_cases(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_campaign_id ON test_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_executed_at ON test_results(executed_at);
CREATE INDEX IF NOT EXISTS idx_call_flow_nodes_flow_id ON call_flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Additional indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON test_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(executed_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_call_flows_created_at ON call_flows(discovered_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_test_result_id ON performance_metrics(test_result_id);
