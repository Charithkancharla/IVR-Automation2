import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== TEST CASES API ====================

// Get all test cases
app.get('/api/test-cases', async (c) => {
  const { DB } = c.env
  const { type, status } = c.req.query()
  
  let query = 'SELECT * FROM test_cases WHERE 1=1'
  const params: string[] = []
  
  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY created_at DESC'
  
  const result = await DB.prepare(query).bind(...params).all()
  
  return c.json({ 
    success: true, 
    data: result.results.map(row => ({
      ...row,
      test_steps: JSON.parse(row.test_steps as string),
      expected_results: row.expected_results ? JSON.parse(row.expected_results as string) : null,
      dtmf_inputs: row.dtmf_inputs ? JSON.parse(row.dtmf_inputs as string) : null,
      voice_prompts: row.voice_prompts ? JSON.parse(row.voice_prompts as string) : null
    }))
  })
})

// Get single test case
app.get('/api/test-cases/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const result = await DB.prepare('SELECT * FROM test_cases WHERE id = ?').bind(id).first()
  
  if (!result) {
    return c.json({ success: false, message: 'Test case not found' }, 404)
  }
  
  return c.json({ 
    success: true, 
    data: {
      ...result,
      test_steps: JSON.parse(result.test_steps as string),
      expected_results: result.expected_results ? JSON.parse(result.expected_results as string) : null,
      dtmf_inputs: result.dtmf_inputs ? JSON.parse(result.dtmf_inputs as string) : null,
      voice_prompts: result.voice_prompts ? JSON.parse(result.voice_prompts as string) : null
    }
  })
})

// Create test case
app.post('/api/test-cases', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO test_cases (name, description, type, status, phone_number, test_steps, expected_results, dtmf_inputs, voice_prompts, timeout_seconds, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.name,
    body.description || null,
    body.type,
    body.status || 'active',
    body.phone_number || null,
    JSON.stringify(body.test_steps),
    body.expected_results ? JSON.stringify(body.expected_results) : null,
    body.dtmf_inputs ? JSON.stringify(body.dtmf_inputs) : null,
    body.voice_prompts ? JSON.stringify(body.voice_prompts) : null,
    body.timeout_seconds || 30,
    body.created_by || 'system'
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// Update test case
app.put('/api/test-cases/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await DB.prepare(`
    UPDATE test_cases 
    SET name = ?, description = ?, type = ?, status = ?, phone_number = ?, 
        test_steps = ?, expected_results = ?, dtmf_inputs = ?, voice_prompts = ?, 
        timeout_seconds = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.description || null,
    body.type,
    body.status,
    body.phone_number || null,
    JSON.stringify(body.test_steps),
    body.expected_results ? JSON.stringify(body.expected_results) : null,
    body.dtmf_inputs ? JSON.stringify(body.dtmf_inputs) : null,
    body.voice_prompts ? JSON.stringify(body.voice_prompts) : null,
    body.timeout_seconds || 30,
    id
  ).run()
  
  return c.json({ success: true })
})

// Delete test case
app.delete('/api/test-cases/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM test_cases WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// Execute test case (simulation)
app.post('/api/test-cases/:id/execute', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const testCase = await DB.prepare('SELECT * FROM test_cases WHERE id = ?').bind(id).first()
  
  if (!testCase) {
    return c.json({ success: false, message: 'Test case not found' }, 404)
  }
  
  // Simulate test execution
  const startTime = Date.now()
  const executionTime = Math.floor(Math.random() * 20000) + 5000
  const callDuration = Math.floor(Math.random() * 60000) + 30000
  const success = Math.random() > 0.2 // 80% success rate
  
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay
  
  const result = await DB.prepare(`
    INSERT INTO test_results (test_case_id, status, execution_time_ms, call_duration_ms, 
                               voice_quality_score, audio_clarity_score, dtmf_recognition_rate,
                               call_flow_path, transcript, response_times)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    success ? 'passed' : 'failed',
    executionTime,
    callDuration,
    Math.random() * 10 + 90, // 90-100
    Math.random() * 10 + 90,
    Math.random() * 10 + 90,
    JSON.stringify(['welcome', 'main_menu']),
    'Test execution completed',
    JSON.stringify([{step: 1, time_ms: 1200}])
  ).run()
  
  return c.json({ 
    success: true, 
    result_id: result.meta.last_row_id,
    status: success ? 'passed' : 'failed'
  })
})

// ==================== CAMPAIGNS API ====================

// Get all campaigns
app.get('/api/campaigns', async (c) => {
  const { DB } = c.env
  const { status } = c.req.query()
  
  let query = 'SELECT * FROM campaigns WHERE 1=1'
  const params: string[] = []
  
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY created_at DESC'
  
  const result = await DB.prepare(query).bind(...params).all()
  
  return c.json({ 
    success: true, 
    data: result.results.map(row => ({
      ...row,
      test_case_ids: JSON.parse(row.test_case_ids as string),
      recurrence_pattern: row.recurrence_pattern ? JSON.parse(row.recurrence_pattern as string) : null
    }))
  })
})

// Get single campaign
app.get('/api/campaigns/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const result = await DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first()
  
  if (!result) {
    return c.json({ success: false, message: 'Campaign not found' }, 404)
  }
  
  return c.json({ 
    success: true, 
    data: {
      ...result,
      test_case_ids: JSON.parse(result.test_case_ids as string),
      recurrence_pattern: result.recurrence_pattern ? JSON.parse(result.recurrence_pattern as string) : null
    }
  })
})

// Create campaign
app.post('/api/campaigns', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO campaigns (name, description, status, schedule_type, schedule_time, 
                          recurrence_pattern, concurrent_calls, total_calls, test_case_ids, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.name,
    body.description || null,
    body.status || 'draft',
    body.schedule_type || 'immediate',
    body.schedule_time || null,
    body.recurrence_pattern ? JSON.stringify(body.recurrence_pattern) : null,
    body.concurrent_calls || 1,
    body.total_calls || 1,
    JSON.stringify(body.test_case_ids),
    body.created_by || 'system'
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// Update campaign
app.put('/api/campaigns/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await DB.prepare(`
    UPDATE campaigns 
    SET name = ?, description = ?, status = ?, schedule_type = ?, schedule_time = ?,
        recurrence_pattern = ?, concurrent_calls = ?, total_calls = ?, test_case_ids = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.description || null,
    body.status,
    body.schedule_type,
    body.schedule_time || null,
    body.recurrence_pattern ? JSON.stringify(body.recurrence_pattern) : null,
    body.concurrent_calls,
    body.total_calls,
    JSON.stringify(body.test_case_ids),
    id
  ).run()
  
  return c.json({ success: true })
})

// Execute campaign
app.post('/api/campaigns/:id/execute', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const campaign = await DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first()
  
  if (!campaign) {
    return c.json({ success: false, message: 'Campaign not found' }, 404)
  }
  
  // Update campaign status to running
  await DB.prepare('UPDATE campaigns SET status = ? WHERE id = ?').bind('running', id).run()
  
  return c.json({ 
    success: true, 
    message: 'Campaign execution started',
    campaign_id: id 
  })
})

// ==================== TEST RESULTS API ====================

// Get all test results
app.get('/api/test-results', async (c) => {
  const { DB } = c.env
  const { test_case_id, campaign_id, status, limit = '50' } = c.req.query()
  
  let query = 'SELECT * FROM test_results WHERE 1=1'
  const params: string[] = []
  
  if (test_case_id) {
    query += ' AND test_case_id = ?'
    params.push(test_case_id)
  }
  if (campaign_id) {
    query += ' AND campaign_id = ?'
    params.push(campaign_id)
  }
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY executed_at DESC LIMIT ?'
  params.push(limit)
  
  const result = await DB.prepare(query).bind(...params).all()
  
  return c.json({ 
    success: true, 
    data: result.results.map(row => ({
      ...row,
      call_flow_path: row.call_flow_path ? JSON.parse(row.call_flow_path as string) : null,
      response_times: row.response_times ? JSON.parse(row.response_times as string) : null
    }))
  })
})

// Get test result statistics
app.get('/api/test-results/stats', async (c) => {
  const { DB } = c.env
  
  const stats = await DB.prepare(`
    SELECT 
      COUNT(*) as total_tests,
      SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      AVG(execution_time_ms) as avg_execution_time,
      AVG(voice_quality_score) as avg_voice_quality,
      AVG(audio_clarity_score) as avg_audio_clarity
    FROM test_results
  `).first()
  
  return c.json({ success: true, data: stats })
})

// ==================== CALL FLOWS API ====================

// Get all call flows
app.get('/api/call-flows', async (c) => {
  const { DB } = c.env
  
  const result = await DB.prepare('SELECT * FROM call_flows ORDER BY last_updated DESC').all()
  
  return c.json({ 
    success: true, 
    data: result.results.map(row => ({
      ...row,
      flow_data: row.flow_data ? JSON.parse(row.flow_data as string) : null
    }))
  })
})

// Get call flow with nodes
app.get('/api/call-flows/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const flow = await DB.prepare('SELECT * FROM call_flows WHERE id = ?').bind(id).first()
  
  if (!flow) {
    return c.json({ success: false, message: 'Call flow not found' }, 404)
  }
  
  const nodes = await DB.prepare('SELECT * FROM call_flow_nodes WHERE flow_id = ? ORDER BY position_y, position_x').bind(id).all()
  
  return c.json({ 
    success: true, 
    data: {
      ...flow,
      flow_data: flow.flow_data ? JSON.parse(flow.flow_data as string) : null,
      nodes: nodes.results.map(node => ({
        ...node,
        dtmf_options: node.dtmf_options ? JSON.parse(node.dtmf_options as string) : null
      }))
    }
  })
})

// Create call flow
app.post('/api/call-flows', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO call_flows (name, description, phone_number, status, flow_data, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    body.name,
    body.description || null,
    body.phone_number || null,
    body.status || 'active',
    JSON.stringify(body.flow_data),
    body.created_by || 'system'
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// ==================== MONITORING ALERTS API ====================

// Get all alerts
app.get('/api/alerts', async (c) => {
  const { DB } = c.env
  const { status, severity } = c.req.query()
  
  let query = 'SELECT * FROM monitoring_alerts WHERE 1=1'
  const params: string[] = []
  
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  if (severity) {
    query += ' AND severity = ?'
    params.push(severity)
  }
  
  query += ' ORDER BY created_at DESC LIMIT 100'
  
  const result = await DB.prepare(query).bind(...params).all()
  
  return c.json({ success: true, data: result.results })
})

// Update alert status
app.put('/api/alerts/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await DB.prepare('UPDATE monitoring_alerts SET status = ? WHERE id = ?').bind(body.status, id).run()
  
  return c.json({ success: true })
})

// ==================== DASHBOARD API ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', async (c) => {
  const { DB } = c.env
  
  const testCasesCount = await DB.prepare('SELECT COUNT(*) as count FROM test_cases WHERE status = ?').bind('active').first()
  const campaignsCount = await DB.prepare('SELECT COUNT(*) as count FROM campaigns').first()
  const recentResults = await DB.prepare(`
    SELECT status, COUNT(*) as count 
    FROM test_results 
    WHERE executed_at >= datetime('now', '-24 hours')
    GROUP BY status
  `).all()
  
  const openAlerts = await DB.prepare('SELECT COUNT(*) as count FROM monitoring_alerts WHERE status = ?').bind('open').first()
  
  return c.json({ 
    success: true, 
    data: {
      active_test_cases: testCasesCount?.count || 0,
      total_campaigns: campaignsCount?.count || 0,
      recent_test_results: recentResults.results,
      open_alerts: openAlerts?.count || 0
    }
  })
})

// Get recent activity
app.get('/api/dashboard/activity', async (c) => {
  const { DB } = c.env
  
  const recentResults = await DB.prepare(`
    SELECT tr.*, tc.name as test_case_name
    FROM test_results tr
    LEFT JOIN test_cases tc ON tr.test_case_id = tc.id
    ORDER BY tr.executed_at DESC
    LIMIT 10
  `).all()
  
  return c.json({ success: true, data: recentResults.results })
})

// ==================== MAIN APPLICATION ====================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IVR Automation Testing Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            .fade-in { animation: fadeIn 0.5s; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .nav-item { transition: all 0.3s; }
            .nav-item:hover { background-color: rgba(255, 255, 255, 0.1); }
            .nav-item.active { background-color: rgba(255, 255, 255, 0.2); border-left: 4px solid white; }
            .card { transition: all 0.3s; }
            .card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
            .modal.active { display: flex; align-items: center; justify-content: center; }
            .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .status-passed { background: #10b981; color: white; }
            .status-failed { background: #ef4444; color: white; }
            .status-running { background: #3b82f6; color: white; }
            .status-scheduled { background: #f59e0b; color: white; }
        </style>
    </head>
    <body class="bg-gray-50">
        <div class="flex h-screen overflow-hidden">
            <!-- Sidebar -->
            <div class="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col">
                <div class="p-6 border-b border-blue-700">
                    <h1 class="text-2xl font-bold flex items-center">
                        <i class="fas fa-phone-volume mr-3"></i>
                        IVR Testing
                    </h1>
                    <p class="text-blue-200 text-sm mt-1">Automation Platform</p>
                </div>
                
                <nav class="flex-1 p-4 space-y-2">
                    <a href="#" class="nav-item active flex items-center p-3 rounded" onclick="showSection('dashboard')">
                        <i class="fas fa-tachometer-alt w-6"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="#" class="nav-item flex items-center p-3 rounded" onclick="showSection('test-cases')">
                        <i class="fas fa-clipboard-list w-6"></i>
                        <span>Test Cases</span>
                    </a>
                    <a href="#" class="nav-item flex items-center p-3 rounded" onclick="showSection('campaigns')">
                        <i class="fas fa-calendar-alt w-6"></i>
                        <span>Campaigns</span>
                    </a>
                    <a href="#" class="nav-item flex items-center p-3 rounded" onclick="showSection('call-flows')">
                        <i class="fas fa-project-diagram w-6"></i>
                        <span>Call Flows</span>
                    </a>
                    <a href="#" class="nav-item flex items-center p-3 rounded" onclick="showSection('results')">
                        <i class="fas fa-chart-line w-6"></i>
                        <span>Test Results</span>
                    </a>
                    <a href="#" class="nav-item flex items-center p-3 rounded" onclick="showSection('monitoring')">
                        <i class="fas fa-bell w-6"></i>
                        <span>Monitoring</span>
                    </a>
                    <a href="#" class="nav-item flex items-center p-3 rounded" onclick="showSection('analytics')">
                        <i class="fas fa-chart-bar w-6"></i>
                        <span>Analytics</span>
                    </a>
                </nav>
                
                <div class="p-4 border-t border-blue-700">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="ml-3">
                            <div class="font-semibold">Admin User</div>
                            <div class="text-xs text-blue-200">admin@ivr.com</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="flex-1 overflow-y-auto">
                <!-- Header -->
                <div class="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <h2 id="page-title" class="text-2xl font-bold text-gray-800">Dashboard</h2>
                        <p id="page-subtitle" class="text-sm text-gray-500">Overview of your IVR testing platform</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button onclick="refreshData()" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                            <i class="fas fa-sync-alt mr-2"></i>Refresh
                        </button>
                    </div>
                </div>
                
                <!-- Dashboard Section -->
                <div id="section-dashboard" class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="card bg-white p-6 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm">Active Test Cases</p>
                                    <p id="stat-test-cases" class="text-3xl font-bold text-gray-800 mt-2">0</p>
                                </div>
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-clipboard-list text-blue-600 text-xl"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card bg-white p-6 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm">Total Campaigns</p>
                                    <p id="stat-campaigns" class="text-3xl font-bold text-gray-800 mt-2">0</p>
                                </div>
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-green-600 text-xl"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card bg-white p-6 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm">Tests (24h)</p>
                                    <p id="stat-recent-tests" class="text-3xl font-bold text-gray-800 mt-2">0</p>
                                </div>
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card bg-white p-6 rounded-lg shadow">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm">Open Alerts</p>
                                    <p id="stat-alerts" class="text-3xl font-bold text-gray-800 mt-2">0</p>
                                </div>
                                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-bell text-red-600 text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h3 class="text-lg font-semibold mb-4">Test Results (Last 7 Days)</h3>
                            <canvas id="resultsChart" height="200"></canvas>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h3 class="text-lg font-semibold mb-4">Voice Quality Metrics</h3>
                            <canvas id="qualityChart" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-6 border-b border-gray-200">
                            <h3 class="text-lg font-semibold">Recent Activity</h3>
                        </div>
                        <div class="p-6">
                            <div id="recent-activity" class="space-y-3">
                                <div class="text-center text-gray-500 py-4">Loading activity...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Test Cases Section -->
                <div id="section-test-cases" class="p-6 space-y-6" style="display:none;">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold">Test Cases</h3>
                            <p class="text-gray-500 text-sm">Manage and execute IVR test cases</p>
                        </div>
                        <button onclick="showCreateTestCaseModal()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Create Test Case
                        </button>
                    </div>
                    
                    <div class="flex space-x-4">
                        <select id="filter-test-type" class="px-4 py-2 border border-gray-300 rounded-lg" onchange="loadTestCases()">
                            <option value="">All Types</option>
                            <option value="functional">Functional</option>
                            <option value="regression">Regression</option>
                            <option value="load">Load</option>
                            <option value="performance">Performance</option>
                        </select>
                        <select id="filter-test-status" class="px-4 py-2 border border-gray-300 rounded-lg" onchange="loadTestCases()">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    
                    <div id="test-cases-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="text-center text-gray-500 py-8">Loading test cases...</div>
                    </div>
                </div>
                
                <!-- Campaigns Section -->
                <div id="section-campaigns" class="p-6 space-y-6" style="display:none;">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold">Campaigns</h3>
                            <p class="text-gray-500 text-sm">Schedule and manage test campaigns</p>
                        </div>
                        <button onclick="showCreateCampaignModal()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Create Campaign
                        </button>
                    </div>
                    
                    <div id="campaigns-list" class="space-y-4">
                        <div class="text-center text-gray-500 py-8">Loading campaigns...</div>
                    </div>
                </div>
                
                <!-- Call Flows Section -->
                <div id="section-call-flows" class="p-6 space-y-6" style="display:none;">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold">Call Flows</h3>
                            <p class="text-gray-500 text-sm">Visualize and map IVR call flows</p>
                        </div>
                        <button onclick="showCreateFlowModal()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Create Flow
                        </button>
                    </div>
                    
                    <div id="call-flows-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="text-center text-gray-500 py-8">Loading call flows...</div>
                    </div>
                </div>
                
                <!-- Test Results Section -->
                <div id="section-results" class="p-6 space-y-6" style="display:none;">
                    <div>
                        <h3 class="text-xl font-bold">Test Results</h3>
                        <p class="text-gray-500 text-sm">View and analyze test execution results</p>
                    </div>
                    
                    <div id="test-results-list" class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="text-center text-gray-500 py-8">Loading test results...</div>
                    </div>
                </div>
                
                <!-- Monitoring Section -->
                <div id="section-monitoring" class="p-6 space-y-6" style="display:none;">
                    <div>
                        <h3 class="text-xl font-bold">Monitoring & Alerts</h3>
                        <p class="text-gray-500 text-sm">Real-time monitoring and alert management</p>
                    </div>
                    
                    <div id="alerts-list" class="space-y-4">
                        <div class="text-center text-gray-500 py-8">Loading alerts...</div>
                    </div>
                </div>
                
                <!-- Analytics Section -->
                <div id="section-analytics" class="p-6 space-y-6" style="display:none;">
                    <div>
                        <h3 class="text-xl font-bold">Analytics & Reports</h3>
                        <p class="text-gray-500 text-sm">Detailed analytics and performance reports</p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="font-semibold mb-4">Success Rate Trend</h4>
                            <canvas id="successRateChart" height="200"></canvas>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="font-semibold mb-4">Execution Time Distribution</h4>
                            <canvas id="executionTimeChart" height="200"></canvas>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="font-semibold mb-4">Test Coverage by Type</h4>
                            <canvas id="coverageChart" height="200"></canvas>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="font-semibold mb-4">Quality Metrics Overview</h4>
                            <div id="quality-metrics" class="space-y-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modals -->
        <div id="modal-create-test" class="modal">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold">Create Test Case</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Test Name</label>
                        <input id="test-name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <textarea id="test-description" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Type</label>
                            <select id="test-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="functional">Functional</option>
                                <option value="regression">Regression</option>
                                <option value="load">Load</option>
                                <option value="performance">Performance</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Phone Number</label>
                            <input id="test-phone" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="+1-800-555-0100">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Test Steps (comma-separated)</label>
                        <textarea id="test-steps" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Call number, Listen to menu, Press 1"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">DTMF Inputs (comma-separated)</label>
                        <input id="test-dtmf" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="1, 2, 3, #">
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 flex justify-end space-x-4">
                    <button onclick="closeModal('modal-create-test')" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onclick="createTestCase()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let charts = {};
            
            // Navigation
            function showSection(section) {
                document.querySelectorAll('[id^="section-"]').forEach(el => el.style.display = 'none');
                document.getElementById('section-' + section).style.display = 'block';
                
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                event.target.closest('.nav-item').classList.add('active');
                
                const titles = {
                    'dashboard': ['Dashboard', 'Overview of your IVR testing platform'],
                    'test-cases': ['Test Cases', 'Manage and execute IVR test cases'],
                    'campaigns': ['Campaigns', 'Schedule and manage test campaigns'],
                    'call-flows': ['Call Flows', 'Visualize and map IVR call flows'],
                    'results': ['Test Results', 'View and analyze test execution results'],
                    'monitoring': ['Monitoring & Alerts', 'Real-time monitoring and alert management'],
                    'analytics': ['Analytics & Reports', 'Detailed analytics and performance reports']
                };
                
                document.getElementById('page-title').textContent = titles[section][0];
                document.getElementById('page-subtitle').textContent = titles[section][1];
                
                // Load section data
                if (section === 'dashboard') loadDashboard();
                else if (section === 'test-cases') loadTestCases();
                else if (section === 'campaigns') loadCampaigns();
                else if (section === 'call-flows') loadCallFlows();
                else if (section === 'results') loadTestResults();
                else if (section === 'monitoring') loadAlerts();
                else if (section === 'analytics') loadAnalytics();
            }
            
            // Load Dashboard
            async function loadDashboard() {
                try {
                    const statsRes = await axios.get('/api/dashboard/stats');
                    const stats = statsRes.data.data;
                    
                    document.getElementById('stat-test-cases').textContent = stats.active_test_cases;
                    document.getElementById('stat-campaigns').textContent = stats.total_campaigns;
                    document.getElementById('stat-alerts').textContent = stats.open_alerts;
                    
                    let totalRecent = 0;
                    stats.recent_test_results.forEach(r => totalRecent += r.count);
                    document.getElementById('stat-recent-tests').textContent = totalRecent;
                    
                    // Load recent activity
                    const activityRes = await axios.get('/api/dashboard/activity');
                    const activities = activityRes.data.data;
                    
                    const activityHtml = activities.slice(0, 5).map(a => \`
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex-1">
                                <div class="font-medium">\${a.test_case_name || 'Unknown Test'}</div>
                                <div class="text-sm text-gray-500">\${new Date(a.executed_at).toLocaleString()}</div>
                            </div>
                            <span class="status-badge status-\${a.status}">\${a.status.toUpperCase()}</span>
                        </div>
                    \`).join('');
                    
                    document.getElementById('recent-activity').innerHTML = activityHtml || '<div class="text-center text-gray-500 py-4">No recent activity</div>';
                    
                    // Create charts
                    createResultsChart();
                    createQualityChart();
                } catch (error) {
                    console.error('Error loading dashboard:', error);
                }
            }
            
            function createResultsChart() {
                const ctx = document.getElementById('resultsChart');
                if (charts.results) charts.results.destroy();
                
                charts.results = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Passed',
                            data: [45, 52, 48, 61, 58, 55, 62],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4
                        }, {
                            label: 'Failed',
                            data: [5, 8, 6, 4, 7, 5, 3],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }
            
            function createQualityChart() {
                const ctx = document.getElementById('qualityChart');
                if (charts.quality) charts.quality.destroy();
                
                charts.quality = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Voice Quality', 'Audio Clarity', 'DTMF Recognition', 'MOS Score'],
                        datasets: [{
                            label: 'Average Score',
                            data: [95.5, 97.2, 98.8, 4.35],
                            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
            
            // Load Test Cases
            async function loadTestCases() {
                try {
                    const type = document.getElementById('filter-test-type')?.value || '';
                    const status = document.getElementById('filter-test-status')?.value || '';
                    
                    const params = new URLSearchParams();
                    if (type) params.append('type', type);
                    if (status) params.append('status', status);
                    
                    const res = await axios.get('/api/test-cases?' + params.toString());
                    const testCases = res.data.data;
                    
                    const html = testCases.map(tc => \`
                        <div class="card bg-white p-6 rounded-lg shadow">
                            <div class="flex items-start justify-between mb-4">
                                <div>
                                    <h4 class="font-semibold text-lg">\${tc.name}</h4>
                                    <p class="text-sm text-gray-500 mt-1">\${tc.description || 'No description'}</p>
                                </div>
                                <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">\${tc.type}</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-phone w-5"></i>
                                    <span>\${tc.phone_number || 'No phone number'}</span>
                                </div>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-clock w-5"></i>
                                    <span>Timeout: \${tc.timeout_seconds}s</span>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                                <button onclick="executeTest(\${tc.id})" class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                                    <i class="fas fa-play mr-1"></i>Execute
                                </button>
                                <button onclick="deleteTest(\${tc.id})" class="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    \`).join('');
                    
                    document.getElementById('test-cases-list').innerHTML = html || '<div class="col-span-full text-center text-gray-500 py-8">No test cases found</div>';
                } catch (error) {
                    console.error('Error loading test cases:', error);
                }
            }
            
            // Load Campaigns
            async function loadCampaigns() {
                try {
                    const res = await axios.get('/api/campaigns');
                    const campaigns = res.data.data;
                    
                    const html = campaigns.map(c => \`
                        <div class="bg-white p-6 rounded-lg shadow">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-lg">\${c.name}</h4>
                                    <p class="text-sm text-gray-500 mt-1">\${c.description || 'No description'}</p>
                                </div>
                                <span class="status-badge status-\${c.status}">\${c.status.toUpperCase()}</span>
                            </div>
                            <div class="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div class="text-gray-500">Concurrent Calls</div>
                                    <div class="font-semibold">\${c.concurrent_calls}</div>
                                </div>
                                <div>
                                    <div class="text-gray-500">Total Calls</div>
                                    <div class="font-semibold">\${c.total_calls}</div>
                                </div>
                                <div>
                                    <div class="text-gray-500">Test Cases</div>
                                    <div class="font-semibold">\${c.test_case_ids.length}</div>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                                <button onclick="executeCampaign(\${c.id})" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                                    <i class="fas fa-play mr-1"></i>Execute
                                </button>
                            </div>
                        </div>
                    \`).join('');
                    
                    document.getElementById('campaigns-list').innerHTML = html || '<div class="text-center text-gray-500 py-8">No campaigns found</div>';
                } catch (error) {
                    console.error('Error loading campaigns:', error);
                }
            }
            
            // Load Call Flows
            async function loadCallFlows() {
                try {
                    const res = await axios.get('/api/call-flows');
                    const flows = res.data.data;
                    
                    const html = flows.map(f => \`
                        <div class="card bg-white p-6 rounded-lg shadow">
                            <div class="flex items-start justify-between mb-4">
                                <div>
                                    <h4 class="font-semibold text-lg">\${f.name}</h4>
                                    <p class="text-sm text-gray-500 mt-1">\${f.description || 'No description'}</p>
                                </div>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-phone w-5"></i>
                                    <span>\${f.phone_number || 'No phone number'}</span>
                                </div>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-calendar w-5"></i>
                                    <span>\${new Date(f.last_updated).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-200">
                                <button onclick="viewFlow(\${f.id})" class="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm">
                                    <i class="fas fa-eye mr-1"></i>View Flow
                                </button>
                            </div>
                        </div>
                    \`).join('');
                    
                    document.getElementById('call-flows-list').innerHTML = html || '<div class="col-span-full text-center text-gray-500 py-8">No call flows found</div>';
                } catch (error) {
                    console.error('Error loading call flows:', error);
                }
            }
            
            // Load Test Results
            async function loadTestResults() {
                try {
                    const res = await axios.get('/api/test-results?limit=20');
                    const results = res.data.data;
                    
                    const html = \`
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Case ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Execution Time</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voice Quality</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executed At</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                \${results.map(r => \`
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4">#\${r.test_case_id}</td>
                                        <td class="px-6 py-4"><span class="status-badge status-\${r.status}">\${r.status}</span></td>
                                        <td class="px-6 py-4">\${(r.execution_time_ms / 1000).toFixed(2)}s</td>
                                        <td class="px-6 py-4">\${r.voice_quality_score ? r.voice_quality_score.toFixed(1) : 'N/A'}</td>
                                        <td class="px-6 py-4">\${new Date(r.executed_at).toLocaleString()}</td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    \`;
                    
                    document.getElementById('test-results-list').innerHTML = html || '<div class="text-center text-gray-500 py-8">No test results found</div>';
                } catch (error) {
                    console.error('Error loading test results:', error);
                }
            }
            
            // Load Alerts
            async function loadAlerts() {
                try {
                    const res = await axios.get('/api/alerts');
                    const alerts = res.data.data;
                    
                    const severityColors = {
                        critical: 'bg-red-50 border-red-200 text-red-800',
                        high: 'bg-orange-50 border-orange-200 text-orange-800',
                        medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                        low: 'bg-blue-50 border-blue-200 text-blue-800'
                    };
                    
                    const html = alerts.map(a => \`
                        <div class="border rounded-lg p-4 \${severityColors[a.severity]}">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <i class="fas fa-\${a.severity === 'critical' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
                                        <span class="font-semibold uppercase text-sm">\${a.severity}</span>
                                        <span class="text-sm">•</span>
                                        <span class="text-sm">\${a.alert_type}</span>
                                    </div>
                                    <p class="text-sm mb-2">\${a.message}</p>
                                    <p class="text-xs">\${new Date(a.created_at).toLocaleString()}</p>
                                </div>
                                <span class="px-3 py-1 bg-white rounded text-xs font-medium">\${a.status}</span>
                            </div>
                        </div>
                    \`).join('');
                    
                    document.getElementById('alerts-list').innerHTML = html || '<div class="text-center text-gray-500 py-8">No alerts found</div>';
                } catch (error) {
                    console.error('Error loading alerts:', error);
                }
            }
            
            // Load Analytics
            async function loadAnalytics() {
                try {
                    const res = await axios.get('/api/test-results/stats');
                    const stats = res.data.data;
                    
                    const metricsHtml = \`
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-600">Average Voice Quality</div>
                            <div class="text-2xl font-bold text-blue-600">\${stats.avg_voice_quality ? stats.avg_voice_quality.toFixed(1) : 'N/A'}</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-600">Average Audio Clarity</div>
                            <div class="text-2xl font-bold text-green-600">\${stats.avg_audio_clarity ? stats.avg_audio_clarity.toFixed(1) : 'N/A'}</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-600">Success Rate</div>
                            <div class="text-2xl font-bold text-purple-600">\${stats.total_tests > 0 ? ((stats.passed / stats.total_tests) * 100).toFixed(1) : 0}%</div>
                        </div>
                    \`;
                    
                    document.getElementById('quality-metrics').innerHTML = metricsHtml;
                } catch (error) {
                    console.error('Error loading analytics:', error);
                }
            }
            
            // Modal Functions
            function showCreateTestCaseModal() {
                document.getElementById('modal-create-test').classList.add('active');
            }
            
            function showCreateCampaignModal() {
                alert('Campaign creation modal coming soon!');
            }
            
            function showCreateFlowModal() {
                alert('Flow creation modal coming soon!');
            }
            
            function closeModal(modalId) {
                document.getElementById(modalId).classList.remove('active');
            }
            
            // CRUD Operations
            async function createTestCase() {
                try {
                    const data = {
                        name: document.getElementById('test-name').value,
                        description: document.getElementById('test-description').value,
                        type: document.getElementById('test-type').value,
                        phone_number: document.getElementById('test-phone').value,
                        test_steps: document.getElementById('test-steps').value.split(',').map(s => s.trim()),
                        dtmf_inputs: document.getElementById('test-dtmf').value.split(',').map(s => s.trim()).filter(s => s),
                        status: 'active',
                        created_by: 'admin'
                    };
                    
                    await axios.post('/api/test-cases', data);
                    closeModal('modal-create-test');
                    loadTestCases();
                    alert('Test case created successfully!');
                } catch (error) {
                    console.error('Error creating test case:', error);
                    alert('Failed to create test case');
                }
            }
            
            async function executeTest(id) {
                if (!confirm('Execute this test case?')) return;
                
                try {
                    const res = await axios.post(\`/api/test-cases/\${id}/execute\`);
                    alert(\`Test executed! Status: \${res.data.status}\`);
                    loadTestResults();
                } catch (error) {
                    console.error('Error executing test:', error);
                    alert('Failed to execute test');
                }
            }
            
            async function deleteTest(id) {
                if (!confirm('Delete this test case?')) return;
                
                try {
                    await axios.delete(\`/api/test-cases/\${id}\`);
                    loadTestCases();
                    alert('Test case deleted successfully!');
                } catch (error) {
                    console.error('Error deleting test:', error);
                    alert('Failed to delete test case');
                }
            }
            
            async function executeCampaign(id) {
                if (!confirm('Execute this campaign?')) return;
                
                try {
                    await axios.post(\`/api/campaigns/\${id}/execute\`);
                    alert('Campaign execution started!');
                    loadCampaigns();
                } catch (error) {
                    console.error('Error executing campaign:', error);
                    alert('Failed to execute campaign');
                }
            }
            
            async function viewFlow(id) {
                alert('Call flow visualization coming soon!');
            }
            
            function refreshData() {
                const section = document.querySelector('[id^="section-"][style="display: block;"]').id.replace('section-', '');
                showSection(section);
            }
            
            // Initialize
            document.addEventListener('DOMContentLoaded', () => {
                loadDashboard();
            });
        </script>
    </body>
    </html>
  `)
})

export default app
