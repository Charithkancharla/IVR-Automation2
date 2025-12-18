-- Insert sample test cases
INSERT OR IGNORE INTO test_cases (id, name, description, type, status, phone_number, test_steps, expected_results, dtmf_inputs, voice_prompts, timeout_seconds, created_by) VALUES 
(1, 'Basic IVR Navigation Test', 'Test basic menu navigation and DTMF input', 'functional', 'active', '+1-800-555-0100', 
 '["Call phone number", "Listen to welcome message", "Press 1 for Sales", "Listen to sales menu", "Press 9 to return to main menu"]',
 '["Call connects successfully", "Welcome message plays", "Sales menu is reached", "Main menu is reached"]',
 '["1", "9"]',
 '["Welcome to our service", "For Sales press 1", "Sales Department", "Main Menu"]',
 60, 'admin'),

(2, 'Account Balance Inquiry', 'Test account balance lookup flow', 'functional', 'active', '+1-800-555-0100',
 '["Call phone number", "Press 2 for Account Services", "Press 1 for Balance Inquiry", "Enter account number", "Listen to balance"]',
 '["Call connects", "Account Services menu reached", "Balance Inquiry selected", "Account recognized", "Balance announced"]',
 '["2", "1", "1234567890#"]',
 '["Welcome", "For Account Services press 2", "For Balance press 1", "Please enter account number", "Your balance is"]',
 90, 'admin'),

(3, 'Call Transfer to Agent', 'Test call transfer functionality', 'functional', 'active', '+1-800-555-0100',
 '["Call phone number", "Press 0 for Agent", "Wait for transfer", "Verify agent connection"]',
 '["Call connects", "Transfer initiated", "Agent answered", "Call connected to agent"]',
 '["0"]',
 '["Welcome", "For Agent press 0", "Transferring to agent", "Please hold"]',
 120, 'admin'),

(4, 'Load Test - 100 Concurrent Calls', 'Stress test with 100 simultaneous calls', 'load', 'active', '+1-800-555-0100',
 '["Initiate 100 concurrent calls", "Navigate main menu", "Complete basic flow"]',
 '["All calls connect", "Average response time < 2s", "Success rate > 95%"]',
 '["1"]',
 '["Welcome to our service"]',
 180, 'admin'),

(5, 'Voice Quality Assessment', 'Test audio clarity and quality metrics', 'performance', 'active', '+1-800-555-0100',
 '["Call phone number", "Record welcome message", "Analyze audio quality", "Measure MOS score"]',
 '["Clear audio", "MOS score > 4.0", "No distortion detected"]',
 '[]',
 '["Welcome to our service"]',
 60, 'admin');

-- Insert sample campaigns
INSERT OR IGNORE INTO campaigns (id, name, description, status, schedule_type, schedule_time, concurrent_calls, total_calls, test_case_ids, created_by) VALUES 
(1, 'Daily Smoke Test', 'Daily automated smoke tests for IVR system', 'scheduled', 'recurring', datetime('now', '+1 hour'), 5, 25, '[1, 2, 3]', 'admin'),
(2, 'Weekly Load Test', 'Weekly load testing campaign', 'scheduled', 'recurring', datetime('now', '+7 days'), 100, 500, '[4]', 'admin'),
(3, 'Voice Quality Monitoring', 'Continuous voice quality monitoring', 'running', 'recurring', datetime('now'), 1, 10, '[5]', 'admin');

-- Insert sample test results
INSERT OR IGNORE INTO test_results (test_case_id, campaign_id, status, execution_time_ms, call_duration_ms, voice_quality_score, audio_clarity_score, dtmf_recognition_rate, call_flow_path, transcript, response_times, executed_at) VALUES 
(1, 1, 'passed', 15234, 45000, 95.5, 98.2, 100.0, 
 '["welcome", "main_menu", "sales", "main_menu"]',
 'Welcome to our service. For Sales press 1. You have reached the Sales Department. Returning to Main Menu.',
 '[{"step": 1, "time_ms": 1200}, {"step": 2, "time_ms": 800}, {"step": 3, "time_ms": 1500}]',
 datetime('now', '-2 hours')),

(2, 1, 'passed', 22456, 62000, 94.8, 97.5, 100.0,
 '["welcome", "account_services", "balance_inquiry"]',
 'Welcome to our service. For Account Services press 2. For Balance Inquiry press 1. Your current balance is $1,234.56.',
 '[{"step": 1, "time_ms": 1300}, {"step": 2, "time_ms": 900}, {"step": 3, "time_ms": 2100}]',
 datetime('now', '-1 hour')),

(3, 1, 'failed', 125000, 125000, 88.3, 90.1, 100.0,
 '["welcome", "agent_transfer", "timeout"]',
 'Welcome to our service. For Agent press 0. Transferring to agent. [TIMEOUT - No agent available]',
 '[{"step": 1, "time_ms": 1400}, {"step": 2, "time_ms": 45000}]',
 datetime('now', '-30 minutes')),

(4, 2, 'passed', 8234, 30000, 92.1, 94.8, 98.5,
 '["welcome", "main_menu"]',
 'Load test execution - Average performance across 100 calls',
 '[{"step": 1, "time_ms": 980}]',
 datetime('now', '-3 hours')),

(5, 3, 'passed', 5678, 15000, 96.8, 99.1, 100.0,
 '["welcome"]',
 'Welcome to our service. This is a voice quality assessment call.',
 '[{"step": 1, "time_ms": 750}]',
 datetime('now', '-15 minutes'));

-- Insert sample call flows
INSERT OR IGNORE INTO call_flows (id, name, description, phone_number, status, flow_data, created_by) VALUES 
(1, 'Main Customer Service IVR', 'Primary customer service IVR flow', '+1-800-555-0100', 'active',
 '{"start": "welcome", "nodes": {"welcome": {"type": "prompt", "next": "main_menu"}, "main_menu": {"type": "menu", "options": {"1": "sales", "2": "account", "0": "agent"}}}}',
 'admin'),
(2, 'Technical Support IVR', 'Technical support hotline flow', '+1-800-555-0200', 'active',
 '{"start": "welcome", "nodes": {"welcome": {"type": "prompt", "next": "tech_menu"}}}',
 'admin');

-- Insert sample call flow nodes
INSERT OR IGNORE INTO call_flow_nodes (flow_id, node_id, node_type, node_label, prompt_text, parent_node_id, dtmf_options, position_x, position_y) VALUES 
(1, 'welcome', 'prompt', 'Welcome Message', 'Welcome to our service. Please listen to the following options.', NULL, NULL, 100, 50),
(1, 'main_menu', 'menu', 'Main Menu', 'For Sales press 1, For Account Services press 2, For Agent press 0.', 'welcome', '{"1": "sales", "2": "account", "0": "agent"}', 300, 50),
(1, 'sales', 'menu', 'Sales Department', 'You have reached Sales. Press 1 for new orders, Press 2 for existing orders.', 'main_menu', '{"1": "new_order", "2": "existing_order"}', 500, 20),
(1, 'account', 'menu', 'Account Services', 'For Balance Inquiry press 1, For Payment press 2.', 'main_menu', '{"1": "balance", "2": "payment"}', 500, 80),
(1, 'agent', 'transfer', 'Transfer to Agent', 'Transferring you to the next available agent.', 'main_menu', NULL, 500, 140),
(1, 'balance', 'prompt', 'Balance Inquiry', 'Please enter your account number followed by the pound key.', 'account', NULL, 700, 60),
(1, 'payment', 'prompt', 'Payment Processing', 'Please enter your payment amount.', 'account', NULL, 700, 100);

-- Insert sample performance metrics
INSERT OR IGNORE INTO performance_metrics (test_result_id, metric_name, metric_value, unit) VALUES 
(1, 'latency', 45.2, 'ms'),
(1, 'jitter', 8.5, 'ms'),
(1, 'packet_loss', 0.2, 'percent'),
(1, 'mos_score', 4.35, 'score'),
(2, 'latency', 52.1, 'ms'),
(2, 'jitter', 12.3, 'ms'),
(2, 'packet_loss', 0.5, 'percent'),
(2, 'mos_score', 4.21, 'score'),
(5, 'latency', 38.7, 'ms'),
(5, 'jitter', 6.2, 'ms'),
(5, 'packet_loss', 0.1, 'percent'),
(5, 'mos_score', 4.52, 'score');

-- Insert sample monitoring alerts
INSERT OR IGNORE INTO monitoring_alerts (alert_type, severity, message, test_case_id, campaign_id, threshold_value, actual_value, status) VALUES 
('availability', 'critical', 'Test case "Call Transfer to Agent" failed - timeout waiting for agent', 3, 1, 95.0, 0.0, 'open'),
('performance', 'medium', 'Average response time exceeded threshold', 4, 2, 2000.0, 2350.0, 'acknowledged'),
('quality', 'low', 'Voice quality score below optimal level', 3, 1, 95.0, 88.3, 'resolved');

-- Insert default users
INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name, is_active) VALUES 
('admin', 'admin@ivrtesting.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin', 'Admin', 'User', 1),
('user1', 'user1@ivrtesting.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'user', 'Test', 'User', 1);

-- Insert system configuration
INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES 
('default_timeout', '60', 'Default timeout for test cases in seconds'),
('max_concurrent_calls', '100', 'Maximum number of concurrent calls allowed'),
('voice_quality_threshold', '90.0', 'Minimum acceptable voice quality score'),
('alert_email', 'admin@example.com', 'Email address for alert notifications'),
('recording_enabled', 'true', 'Enable audio recording for test calls');

-- Insert default notification preferences for users
INSERT OR IGNORE INTO user_notification_preferences (user_id, email_enabled, sms_enabled, slack_enabled, email_addresses, phone_numbers, slack_webhooks) VALUES 
(1, 1, 0, 0, '["admin@ivrtesting.com"]', '[]', '[]'),
(2, 1, 0, 0, '["user1@ivrtesting.com"]', '[]', '[]');
