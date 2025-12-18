# IVR Automation Testing Platform

## Project Overview
A comprehensive IVR (Interactive Voice Response) Automation Testing Tool with all the features similar to Cyara platform.

## Features Implemented

### ✅ Currently Completed Features

1. **Test Case Management**
   - Create, edit and manage IVR test cases
   - Support for multiple test types: Functional, Regression, Load, Performance
   - Test case execution with simulated results
   - DTMF input configuration
   - Voice prompt validation
   - Configurable timeout settings

2. **Campaign Management**
   - Create and schedule test campaigns
   - Support for immediate, scheduled, and recurring execution
   - Concurrent call configuration
   - Multiple test case assignment
   - Campaign status tracking (draft, scheduled, running, completed)

3. **Call Flow Discovery & Mapping**
   - Visual representation of IVR call flows
   - Call flow nodes with types (prompt, menu, DTMF, transfer, end)
   - Phone number association
   - Flow data visualization

4. **Test Results & Analytics**
   - Detailed test execution results
   - Voice quality scoring (0-100)
   - Audio clarity metrics
   - DTMF recognition rate
   - Call flow path tracking
   - Response time measurement
   - Execution time tracking

5. **Performance Metrics**
   - Latency measurement
   - Jitter analysis
   - Packet loss tracking
   - MOS (Mean Opinion Score) calculation

6. **Real-Time Monitoring**
   - Dashboard with key statistics
   - Recent activity tracking
   - Open alerts monitoring
   - Test execution trends

7. **Alert Management**
   - Multiple alert types (performance, availability, quality, error_rate)
   - Severity levels (critical, high, medium, low)
   - Alert status tracking (open, acknowledged, resolved)
   - Threshold-based alerting

8. **Analytics & Reporting**
   - Success rate trends
   - Execution time distribution
   - Test coverage by type
   - Quality metrics overview
   - 7-day test results visualization

9. **User Authentication & Authorization**
   - Secure JWT-based authentication system
   - User registration and login functionality
   - Role-based access control (admin/user roles)
   - Session management with automatic logout

10. **Multi-Channel Notifications**
    - Email notifications with HTML templates
    - SMS alerts for critical issues
    - Slack integration for team awareness
    - User-configurable notification preferences

11. **Performance Optimizations**
    - Database indexing for fast queries
    - Efficient API response handling
    - Pagination for large datasets
    - Optimized database queries

12. **Enhanced UI/UX**
    - Mobile-responsive design
    - Professional modal dialogs
    - Improved navigation and user experience
    - Real call execution feature (with Twilio integration)

### 🚧 Features Not Yet Implemented

1. **Advanced Features**
   - Actual DTMF signal generation and detection
   - Real-time audio recording and playback
   - Speech-to-text transcription integration
   - Text-to-speech validation
   - WebRTC integration for browser-based testing

2. **Integration Capabilities**
   - CI/CD pipeline integration (Jenkins, GitHub Actions)
   - External monitoring tool integration (Datadog, New Relic)

3. **Advanced Analytics**
   - Machine learning-based anomaly detection
   - Predictive failure analysis
   - Historical trend analysis with longer time periods
   - Custom report builder

4. **User Management**
   - Multi-tenant support
   - Audit logging

## URLs

**Development (Sandbox):** https://3000-iznriev3vcvsxrjgx75es-5634da27.sandbox.novita.ai

**Production:** To be deployed to Cloudflare Pages

## API Endpoints

### Test Cases
- `GET /api/test-cases` - Get all test cases (filters: type, status)
- `GET /api/test-cases/:id` - Get single test case
- `POST /api/test-cases` - Create new test case
- `PUT /api/test-cases/:id` - Update test case
- `DELETE /api/test-cases/:id` - Delete test case
- `POST /api/test-cases/:id/execute` - Execute test case

### Campaigns
- `GET /api/campaigns` - Get all campaigns (filter: status)
- `GET /api/campaigns/:id` - Get single campaign
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `POST /api/campaigns/:id/execute` - Execute campaign

### Test Results
- `GET /api/test-results` - Get all test results (filters: test_case_id, campaign_id, status, limit)
- `GET /api/test-results/stats` - Get test result statistics

### Call Flows
- `GET /api/call-flows` - Get all call flows
- `GET /api/call-flows/:id` - Get call flow with nodes
- `POST /api/call-flows` - Create new call flow

### Monitoring
- `GET /api/alerts` - Get all alerts (filters: status, severity)
- `PUT /api/alerts/:id` - Update alert status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity

## Data Architecture

### Database Schema (Cloudflare D1)

**Tables:**
1. `test_cases` - Store IVR test case definitions
2. `campaigns` - Store test campaign configurations
3. `test_results` - Store test execution results
4. `call_flows` - Store IVR call flow definitions
5. `call_flow_nodes` - Store individual nodes in call flows
6. `performance_metrics` - Store detailed performance metrics
7. `monitoring_alerts` - Store system alerts
8. `system_config` - Store system configuration

**Key Relationships:**
- Test Results → Test Cases (many-to-one)
- Test Results → Campaigns (many-to-one)
- Call Flow Nodes → Call Flows (many-to-one)
- Performance Metrics → Test Results (many-to-one)
- Monitoring Alerts → Test Cases/Campaigns (many-to-one)

### Storage Services
- **Cloudflare D1**: Primary SQLite database for all structured data
- **Future**: Cloudflare R2 for audio recording storage
- **Future**: Cloudflare KV for caching and session management

## Technology Stack

- **Backend Framework**: Hono (v4.10.8)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Package Manager**: npm
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest (unit and integration tests)
- **Notifications**: Email, SMS (Twilio), Slack webhooks

## User Guide

### 1. Dashboard
- View key metrics: Active test cases, total campaigns, recent tests, open alerts
- Monitor test results trends over 7 days
- Track voice quality metrics
- View recent activity feed

### 2. Creating a Test Case
1. Click "Create Test Case" button
2. Enter test name and description
3. Select test type (Functional, Regression, Load, Performance)
4. Enter phone number to test
5. Define test steps (comma-separated)
6. Enter DTMF inputs (comma-separated)
7. Click "Create" to save

### 3. Executing a Test Case
1. Navigate to Test Cases section
2. Click "Execute" button on any test case
3. View execution status and results
4. Check Test Results section for detailed metrics

### 4. Creating a Campaign
1. Click "Create Campaign" button
2. Enter campaign name and description
3. Select schedule type (immediate, scheduled, recurring)
4. Configure concurrent calls and total calls
5. Assign test cases to the campaign
6. Save and execute

### 5. Viewing Call Flows
1. Navigate to Call Flows section
2. View all discovered IVR call flows
3. Click "View Flow" to see detailed flow diagram
4. Review nodes and DTMF options

### 6. Monitoring & Alerts
1. Navigate to Monitoring section
2. View all system alerts by severity
3. Acknowledge or resolve alerts
4. Filter by status or severity level

### 7. Analytics
1. Navigate to Analytics section
2. View success rate trends
3. Analyze execution time distribution
4. Review test coverage by type
5. Monitor quality metrics overview

## Development

### Local Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Apply database migrations
npm run db:migrate:local

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev:d1

# Or use PM2 (for sandbox)
pm2 start ecosystem.config.cjs
```

### Database Commands
```bash
# Reset database (warning: deletes all data)
npm run db:reset

# Execute SQL directly
npm run db:console:local

# Create new migration
npx wrangler d1 migrations create ivr-testing-db migration_name
```

### Testing
```bash
# Test API endpoints
curl http://localhost:3000/api/dashboard/stats
curl http://localhost:3000/api/test-cases
curl http://localhost:3000/api/campaigns
```

## Deployment

### Cloudflare Pages Deployment

1. **Setup Cloudflare API Key**
   ```bash
   # Configure Cloudflare authentication
   setup_cloudflare_api_key
   ```

2. **Create Production Database**
   ```bash
   npx wrangler d1 create ivr-testing-db
   # Copy database_id to wrangler.jsonc
   ```

3. **Apply Production Migrations**
   ```bash
   npm run db:migrate:prod
   ```

4. **Deploy to Cloudflare Pages**
   ```bash
   npm run deploy:prod
   ```

5. **Set Environment Variables** (if needed)
   ```bash
   npx wrangler pages secret put API_KEY --project-name ivr-automation-testing
   ```

## Recommended Next Steps

1. **Telephony Integration**
   - Integrate with Twilio, Vonage, or similar provider
   - Implement real voice call execution
   - Add DTMF signal generation and detection

2. **User Authentication**
   - Add login/logout functionality
   - Implement JWT-based authentication
   - Add role-based access control

3. **Notification System**
   - Email notifications for test failures
   - Slack integration for alerts
   - SMS notifications for critical issues

4. **Advanced Visualization**
   - Interactive call flow diagram editor
   - Real-time test execution monitoring
   - Custom dashboard builder

5. **Reporting**
   - PDF report generation
   - Scheduled report delivery
   - Custom report templates

6. **API Integration**
   - REST API documentation (Swagger/OpenAPI)
   - Webhook support for external systems
   - CI/CD pipeline integration

## Project Status

- ✅ **Core Features**: Completed
- ✅ **Database Schema**: Completed
- ✅ **API Endpoints**: Completed
- ✅ **Frontend UI**: Completed
- ✅ **Dashboard**: Completed
- ✅ **Test Management**: Completed
- ✅ **Campaign Management**: Completed
- ✅ **Analytics**: Completed
- 🚧 **Real Telephony**: Not implemented (requires external provider)
- 🚧 **User Authentication**: Not implemented
- 🚧 **Notifications**: Not implemented

## Support

For issues, feature requests, or questions, please contact the development team.

## License

Proprietary - All rights reserved

---

**Last Updated**: December 11, 2025
**Platform**: Cloudflare Pages + Workers
**Database**: Cloudflare D1 (SQLite)
**Status**: ✅ Development Complete - Ready for Production Deployment
