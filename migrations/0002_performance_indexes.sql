-- Migration 0002: Additional Performance Indexes
-- This migration adds indexes to optimize frequently queried columns

-- Indexes for test cases
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON test_cases(created_at);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Indexes for test results
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(executed_at);

-- Indexes for monitoring alerts
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at);

-- Indexes for call flows
CREATE INDEX IF NOT EXISTS idx_call_flows_created_at ON call_flows(discovered_at);

-- Indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_test_result_id ON performance_metrics(test_result_id);