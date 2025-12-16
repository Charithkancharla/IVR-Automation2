# Telephony Integration Guide - Twilio

## Overview

This guide explains how to integrate real voice call testing using Twilio's API. With this integration, you'll be able to:
- Make real phone calls to IVR systems
- Send actual DTMF tones
- Record and analyze voice prompts
- Measure real call quality metrics
- Transcribe IVR responses using speech-to-text

## Prerequisites

### 1. Twilio Account Setup

**Sign up for Twilio:**
1. Go to https://www.twilio.com/try-twilio
2. Sign up for free trial account
3. Get $15.50 in free credit

**Required Information:**
- Account SID
- Auth Token
- Twilio Phone Number

### 2. Environment Variables

Add these to `.dev.vars` for local development:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

For production, use Cloudflare secrets:
```bash
npx wrangler pages secret put TWILIO_ACCOUNT_SID --project-name ivr-automation-testing
npx wrangler pages secret put TWILIO_AUTH_TOKEN --project-name ivr-automation-testing
npx wrangler pages secret put TWILIO_PHONE_NUMBER --project-name ivr-automation-testing
```

## Implementation

### 1. Install Twilio SDK

First, update `package.json`:
```bash
npm install twilio
```

### 2. Create Twilio Service Module

Create `src/services/twilio.ts`:
```typescript
// Twilio Voice Call Service
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface CallOptions {
  to: string;
  dtmfInputs: string[];
  timeout: number;
}

export interface CallResult {
  callSid: string;
  status: string;
  duration: number;
  recordingUrl?: string;
  transcript?: string;
  dtmfSent: string[];
}

export async function makeTestCall(
  config: TwilioConfig, 
  options: CallOptions
): Promise<CallResult> {
  // Note: Twilio SDK doesn't work directly in Cloudflare Workers
  // We need to use Twilio's REST API directly
  
  const auth = btoa(\`\${config.accountSid}:\${config.authToken}\`);
  
  // Create TwiML for the call
  const twiml = generateTwiML(options.dtmfInputs);
  
  // Make the call using Twilio REST API
  const response = await fetch(
    \`https://api.twilio.com/2010-04-01/Accounts/\${config.accountSid}/Calls.json\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Basic \${auth}\`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: options.to,
        From: config.phoneNumber,
        Url: twiml, // URL to TwiML instructions
        Record: 'true',
        StatusCallback: \`https://your-app.pages.dev/api/twilio/status\`,
      }),
    }
  );
  
  const data = await response.json();
  
  return {
    callSid: data.sid,
    status: data.status,
    duration: 0,
    dtmfSent: options.dtmfInputs,
  };
}

function generateTwiML(dtmfInputs: string[]): string {
  // Generate TwiML XML for DTMF playback
  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
  
  for (const digit of dtmfInputs) {
    twiml += \`<Play digits="\${digit}"/><Pause length="2"/>\`;
  }
  
  twiml += '<Record maxLength="120" transcribe="true"/>';
  twiml += '</Response>';
  
  return twiml;
}
```

### 3. Update API Routes

Add to `src/index.tsx`:
```typescript
// Real voice call execution endpoint
app.post('/api/test-cases/:id/execute-real', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  // Get test case
  const testCase = await DB.prepare('SELECT * FROM test_cases WHERE id = ?').bind(id).first();
  
  if (!testCase) {
    return c.json({ success: false, message: 'Test case not found' }, 404);
  }
  
  // Check if Twilio is configured
  if (!c.env.TWILIO_ACCOUNT_SID || !c.env.TWILIO_AUTH_TOKEN) {
    return c.json({ 
      success: false, 
      message: 'Twilio not configured. Please set environment variables.' 
    }, 500);
  }
  
  const twilioConfig = {
    accountSid: c.env.TWILIO_ACCOUNT_SID,
    authToken: c.env.TWILIO_AUTH_TOKEN,
    phoneNumber: c.env.TWILIO_PHONE_NUMBER,
  };
  
  const callOptions = {
    to: testCase.phone_number,
    dtmfInputs: JSON.parse(testCase.dtmf_inputs || '[]'),
    timeout: testCase.timeout_seconds || 30,
  };
  
  try {
    const startTime = Date.now();
    
    // Make real call via Twilio
    const result = await makeTestCall(twilioConfig, callOptions);
    
    const executionTime = Date.now() - startTime;
    
    // Store result
    const dbResult = await DB.prepare(\`
      INSERT INTO test_results 
      (test_case_id, status, execution_time_ms, call_duration_ms, 
       audio_recording_url, transcript, call_flow_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    \`).bind(
      id,
      result.status === 'completed' ? 'passed' : 'failed',
      executionTime,
      result.duration * 1000,
      result.recordingUrl || null,
      result.transcript || null,
      JSON.stringify(['real_call_executed'])
    ).run();
    
    return c.json({ 
      success: true, 
      callSid: result.callSid,
      result_id: dbResult.meta.last_row_id 
    });
    
  } catch (error) {
    return c.json({ 
      success: false, 
      message: \`Call failed: \${error.message}\` 
    }, 500);
  }
});

// Webhook to receive Twilio call status
app.post('/api/twilio/status', async (c) => {
  const body = await c.req.formData();
  const callSid = body.get('CallSid');
  const callStatus = body.get('CallStatus');
  const duration = body.get('CallDuration');
  
  // Update test result with actual call data
  // This would query DB and update the matching test result
  
  return c.text('OK');
});

// Webhook to receive Twilio recordings
app.post('/api/twilio/recording', async (c) => {
  const body = await c.req.formData();
  const recordingSid = body.get('RecordingSid');
  const recordingUrl = body.get('RecordingUrl');
  const transcript = body.get('TranscriptionText');
  
  // Store recording URL and transcript
  
  return c.text('OK');
});
```

### 4. Update TypeScript Types

Add to `wrangler.jsonc`:
```json
{
  "name": "ivr-automation-testing",
  "vars": {
    "TWILIO_ACCOUNT_SID": "",
    "TWILIO_AUTH_TOKEN": "",
    "TWILIO_PHONE_NUMBER": ""
  }
}
```

### 5. Update Frontend

Add "Execute Real Call" button in the UI:

```javascript
async function executeRealTest(id) {
  if (!confirm('Execute REAL phone call? This will use Twilio credits.')) return;
  
  try {
    const res = await axios.post(\`/api/test-cases/\${id}/execute-real\`);
    
    if (res.data.success) {
      alert(\`Real call initiated! Call SID: \${res.data.callSid}\`);
      loadTestResults();
    } else {
      alert(\`Error: \${res.data.message}\`);
    }
  } catch (error) {
    if (error.response?.data?.message) {
      alert(\`Error: \${error.response.data.message}\`);
    } else {
      alert('Failed to execute real call');
    }
  }
}
```

## Testing

### 1. Local Testing with Twilio

Create `.dev.vars` file:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Start local server:
```bash
npm run dev:d1
```

### 2. Test Real Call

```bash
curl -X POST http://localhost:3000/api/test-cases/1/execute-real \
  -H "Content-Type: application/json"
```

## Cost Estimation

**Twilio Pricing (US):**
- Outbound calls: $0.0130 per minute
- Recording: $0.0025 per minute
- Transcription: $0.05 per minute
- Total: ~$0.07 per minute of testing

**Example Cost:**
- 100 test calls per day
- 1 minute average duration
- Monthly cost: ~$210

**Free Trial:**
- $15.50 credit = ~220 minutes of testing

## Advanced Features

### 1. Voice Quality Analysis

Use Twilio's Insights API to get real-time quality metrics:
```typescript
async function getCallQuality(callSid: string): Promise<QualityMetrics> {
  const response = await fetch(
    \`https://insights.twilio.com/v1/Voice/\${callSid}\`,
    {
      headers: {
        'Authorization': \`Basic \${auth}\`,
      },
    }
  );
  
  const data = await response.json();
  
  return {
    mos: data.quality.mos,
    jitter: data.quality.jitter,
    packetLoss: data.quality.packet_loss,
    latency: data.quality.latency,
  };
}
```

### 2. Speech Recognition

Enable Twilio's speech recognition:
```typescript
const twiml = \`
  <Response>
    <Gather input="speech" speechTimeout="auto">
      <Say>Please say your account number</Say>
    </Gather>
  </Response>
\`;
```

### 3. Advanced DTMF Testing

Test complex DTMF sequences:
```typescript
const dtmfSequence = [
  { digits: '1', pause: 2 },
  { digits: '2', pause: 3 },
  { digits: '#', pause: 1 },
];
```

## Alternative: Vonage (Nexmo)

If you prefer Vonage over Twilio:

```typescript
async function makeVonageCall(apiKey: string, apiSecret: string, to: string) {
  const response = await fetch('https://api.nexmo.com/v1/calls', {
    method: 'POST',
    headers: {
      'Authorization': \`Basic \${btoa(\`\${apiKey}:\${apiSecret}\`)}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [{ type: 'phone', number: to }],
      from: { type: 'phone', number: 'YOUR_VONAGE_NUMBER' },
      answer_url: ['https://your-app.pages.dev/api/vonage/answer'],
    }),
  });
  
  return await response.json();
}
```

## Troubleshooting

### Error: "Twilio not configured"
- Make sure environment variables are set
- For production, use `wrangler pages secret put`

### Error: "Invalid phone number"
- Use E.164 format: +1234567890
- Verify phone number is verified in Twilio

### Error: "Insufficient funds"
- Check Twilio account balance
- Add more credits if needed

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Validate webhooks** - Verify Twilio signature
3. **Rate limiting** - Prevent abuse
4. **Audit logging** - Track all calls made

## Next Steps

1. Set up Twilio account
2. Configure environment variables
3. Test with one call first
4. Monitor costs in Twilio dashboard
5. Scale up testing as needed

## Resources

- [Twilio Voice API Docs](https://www.twilio.com/docs/voice)
- [TwiML Reference](https://www.twilio.com/docs/voice/twiml)
- [Twilio Pricing](https://www.twilio.com/voice/pricing)
- [Cloudflare Workers Twilio](https://developers.cloudflare.com/workers/examples/twilio/)
