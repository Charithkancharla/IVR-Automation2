#!/bin/bash

# IVR Automation Testing Platform - API Test Script
# This script tests all major API endpoints

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "IVR Automation Testing Platform API Tests"
echo "=========================================="
echo ""

# Test Dashboard Stats
echo "1. Testing Dashboard Stats..."
curl -s "$BASE_URL/api/dashboard/stats" | jq '.data' || echo "❌ Failed"
echo ""

# Test Dashboard Activity
echo "2. Testing Dashboard Activity..."
curl -s "$BASE_URL/api/dashboard/activity" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Get All Test Cases
echo "3. Testing Get All Test Cases..."
curl -s "$BASE_URL/api/test-cases" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Get Single Test Case
echo "4. Testing Get Single Test Case (ID: 1)..."
curl -s "$BASE_URL/api/test-cases/1" | jq '.data.name' || echo "❌ Failed"
echo ""

# Test Filter Test Cases by Type
echo "5. Testing Filter Test Cases by Type (functional)..."
curl -s "$BASE_URL/api/test-cases?type=functional" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Get All Campaigns
echo "6. Testing Get All Campaigns..."
curl -s "$BASE_URL/api/campaigns" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Get Single Campaign
echo "7. Testing Get Single Campaign (ID: 1)..."
curl -s "$BASE_URL/api/campaigns/1" | jq '.data.name' || echo "❌ Failed"
echo ""

# Test Get All Test Results
echo "8. Testing Get All Test Results..."
curl -s "$BASE_URL/api/test-results" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Get Test Results Stats
echo "9. Testing Get Test Results Stats..."
curl -s "$BASE_URL/api/test-results/stats" | jq '.data' || echo "❌ Failed"
echo ""

# Test Get All Call Flows
echo "10. Testing Get All Call Flows..."
curl -s "$BASE_URL/api/call-flows" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Get Call Flow with Nodes
echo "11. Testing Get Call Flow with Nodes (ID: 1)..."
curl -s "$BASE_URL/api/call-flows/1" | jq '.data.nodes | length' || echo "❌ Failed"
echo ""

# Test Get All Alerts
echo "12. Testing Get All Alerts..."
curl -s "$BASE_URL/api/alerts" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Filter Alerts by Severity
echo "13. Testing Filter Alerts by Severity (critical)..."
curl -s "$BASE_URL/api/alerts?severity=critical" | jq '.data | length' || echo "❌ Failed"
echo ""

# Test Execute Test Case
echo "14. Testing Execute Test Case (ID: 1)..."
curl -s -X POST "$BASE_URL/api/test-cases/1/execute" | jq '.success' || echo "❌ Failed"
echo ""

# Test Create Test Case
echo "15. Testing Create Test Case..."
curl -s -X POST "$BASE_URL/api/test-cases" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Case",
    "description": "Test case created via API",
    "type": "functional",
    "phone_number": "+1-800-555-9999",
    "test_steps": ["Call number", "Listen to menu", "Press 1"],
    "dtmf_inputs": ["1"],
    "status": "active",
    "created_by": "api_test"
  }' | jq '.success' || echo "❌ Failed"
echo ""

# Test Get Recently Created Test Case
echo "16. Verifying New Test Case..."
curl -s "$BASE_URL/api/test-cases" | jq '.data | .[] | select(.name == "API Test Case") | .name' || echo "❌ Failed"
echo ""

echo "=========================================="
echo "API Tests Complete!"
echo "=========================================="
