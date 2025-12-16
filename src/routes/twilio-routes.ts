// Twilio Integration Routes
import { Hono } from 'hono';
import { 
  makeTestCall, 
  generateTwiML, 
  getCallQuality, 
  getCallDetails,
  getCallRecordings,
  formatPhoneNumber 
} from '../services/twilio';

type Bindings = {
  DB: D1Database;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
};

const twilioRoutes = new Hono<{ Bindings: Bindings }>();

// ==================== REAL VOICE CALL EXECUTION ====================

// Execute test case with real Twilio call
twilioRoutes.post('/test-cases/:id/execute-real', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');

  // Check if Twilio is configured
  if (!c.env.TWILIO_ACCOUNT_SID || !c.env.TWILIO_AUTH_TOKEN || !c.env.TWILIO_PHONE_NUMBER) {
    return c.json({
      success: false,
      message: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
    }, 500);
  }

  // Get test case
  const testCase = await DB.prepare('SELECT * FROM test_cases WHERE id = ?').bind(id).first();

  if (!testCase) {
    return c.json({ success: false, message: 'Test case not found' }, 404);
  }

  if (!testCase.phone_number) {
    return c.json({ success: false, message: 'Test case has no phone number configured' }, 400);
  }

  const twilioConfig = {
    accountSid: c.env.TWILIO_ACCOUNT_SID,
    authToken: c.env.TWILIO_AUTH_TOKEN,
    phoneNumber: c.env.TWILIO_PHONE_NUMBER,
  };

  const dtmfInputs = JSON.parse(testCase.dtmf_inputs as string || '[]');

  const callOptions = {
    to: formatPhoneNumber(testCase.phone_number as string),
    dtmfInputs: dtmfInputs,
    timeout: (testCase.timeout_seconds as number) || 30,
    recordCall: true,
    transcribe: true,
  };

  try {
    const startTime = Date.now();
    
    // Get the base URL for callbacks
    const baseUrl = new URL(c.req.url).origin;

    // Make real call via Twilio
    const result = await makeTestCall(twilioConfig, callOptions, baseUrl);

    const executionTime = Date.now() - startTime;

    if (!result.success) {
      return c.json({
        success: false,
        message: result.errorMessage || 'Call failed',
      }, 500);
    }

    // Store initial result (will be updated via webhooks)
    const dbResult = await DB.prepare(`
      INSERT INTO test_results 
      (test_case_id, status, execution_time_ms, call_duration_ms, call_flow_path)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      'running', // Status will be updated via webhook
      executionTime,
      0, // Duration will be updated via webhook
      JSON.stringify({ callSid: result.callSid, type: 'real_call' })
    ).run();

    return c.json({
      success: true,
      callSid: result.callSid,
      result_id: dbResult.meta.last_row_id,
      message: 'Real call initiated successfully',
    });
  } catch (error) {
    console.error('Error executing real call:', error);
    return c.json({
      success: false,
      message: `Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, 500);
  }
});

// ==================== TWILIO WEBHOOKS ====================

// TwiML endpoint for call instructions
twilioRoutes.get('/twilio/twiml', (c) => {
  const dtmfParam = c.req.query('dtmf');
  const dtmfInputs = dtmfParam ? JSON.parse(decodeURIComponent(dtmfParam)) : [];

  const twiml = generateTwiML(dtmfInputs, true);

  return c.text(twiml, 200, {
    'Content-Type': 'application/xml',
  });
});

// Status callback webhook
twilioRoutes.post('/twilio/status', async (c) => {
  const { DB } = c.env;
  const body = await c.req.parseBody();

  const callSid = body.CallSid as string;
  const callStatus = body.CallStatus as string;
  const callDuration = parseInt(body.CallDuration as string || '0', 10);

  try {
    // Find the test result with this call SID
    const result = await DB.prepare(`
      SELECT id FROM test_results 
      WHERE call_flow_path LIKE ? 
      ORDER BY executed_at DESC 
      LIMIT 1
    `).bind(`%${callSid}%`).first();

    if (result) {
      // Update test result with call status
      const status = callStatus === 'completed' ? 'passed' : 'failed';
      
      await DB.prepare(`
        UPDATE test_results 
        SET status = ?, call_duration_ms = ?
        WHERE id = ?
      `).bind(status, callDuration * 1000, result.id).run();

      // Try to get quality metrics
      if (c.env.TWILIO_ACCOUNT_SID && c.env.TWILIO_AUTH_TOKEN) {
        const twilioConfig = {
          accountSid: c.env.TWILIO_ACCOUNT_SID,
          authToken: c.env.TWILIO_AUTH_TOKEN,
          phoneNumber: c.env.TWILIO_PHONE_NUMBER || '',
        };

        // Wait a bit for metrics to be available
        setTimeout(async () => {
          const quality = await getCallQuality(twilioConfig, callSid);
          
          if (quality) {
            // Store performance metrics
            await DB.prepare(`
              INSERT INTO performance_metrics (test_result_id, metric_name, metric_value, unit)
              VALUES (?, 'mos_score', ?, 'score'), (?, 'latency', ?, 'ms'), 
                     (?, 'jitter', ?, 'ms'), (?, 'packet_loss', ?, 'percent')
            `).bind(
              result.id, quality.mos,
              result.id, quality.latency,
              result.id, quality.jitter,
              result.id, quality.packetLoss
            ).run();

            // Update voice quality score
            await DB.prepare(`
              UPDATE test_results 
              SET voice_quality_score = ?
              WHERE id = ?
            `).bind(quality.mos * 20, result.id).run(); // Convert MOS (1-5) to score (20-100)
          }
        }, 5000); // Wait 5 seconds for metrics
      }
    }
  } catch (error) {
    console.error('Error processing status callback:', error);
  }

  return c.text('OK');
});

// Recording callback webhook
twilioRoutes.post('/twilio/recording', async (c) => {
  const { DB } = c.env;
  const body = await c.req.parseBody();

  const callSid = body.CallSid as string;
  const recordingSid = body.RecordingSid as string;
  const recordingUrl = body.RecordingUrl as string;

  try {
    // Find the test result with this call SID
    const result = await DB.prepare(`
      SELECT id FROM test_results 
      WHERE call_flow_path LIKE ? 
      ORDER BY executed_at DESC 
      LIMIT 1
    `).bind(`%${callSid}%`).first();

    if (result) {
      // Update with recording URL
      await DB.prepare(`
        UPDATE test_results 
        SET audio_recording_url = ?
        WHERE id = ?
      `).bind(recordingUrl, result.id).run();
    }
  } catch (error) {
    console.error('Error processing recording callback:', error);
  }

  return c.text('OK');
});

// Transcription callback webhook
twilioRoutes.post('/twilio/transcription', async (c) => {
  const { DB } = c.env;
  const body = await c.req.parseBody();

  const callSid = body.CallSid as string;
  const transcriptionText = body.TranscriptionText as string;

  try {
    // Find the test result with this call SID
    const result = await DB.prepare(`
      SELECT id FROM test_results 
      WHERE call_flow_path LIKE ? 
      ORDER BY executed_at DESC 
      LIMIT 1
    `).bind(`%${callSid}%`).first();

    if (result) {
      // Update with transcript
      await DB.prepare(`
        UPDATE test_results 
        SET transcript = ?
        WHERE id = ?
      `).bind(transcriptionText, result.id).run();
    }
  } catch (error) {
    console.error('Error processing transcription callback:', error);
  }

  return c.text('OK');
});

// ==================== CALL MANAGEMENT ====================

// Get call details
twilioRoutes.get('/twilio/calls/:callSid', async (c) => {
  const callSid = c.req.param('callSid');

  if (!c.env.TWILIO_ACCOUNT_SID || !c.env.TWILIO_AUTH_TOKEN) {
    return c.json({ success: false, message: 'Twilio not configured' }, 500);
  }

  const twilioConfig = {
    accountSid: c.env.TWILIO_ACCOUNT_SID,
    authToken: c.env.TWILIO_AUTH_TOKEN,
    phoneNumber: c.env.TWILIO_PHONE_NUMBER || '',
  };

  try {
    const details = await getCallDetails(twilioConfig, callSid);
    return c.json({ success: true, data: details });
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get call recordings
twilioRoutes.get('/twilio/calls/:callSid/recordings', async (c) => {
  const callSid = c.req.param('callSid');

  if (!c.env.TWILIO_ACCOUNT_SID || !c.env.TWILIO_AUTH_TOKEN) {
    return c.json({ success: false, message: 'Twilio not configured' }, 500);
  }

  const twilioConfig = {
    accountSid: c.env.TWILIO_ACCOUNT_SID,
    authToken: c.env.TWILIO_AUTH_TOKEN,
    phoneNumber: c.env.TWILIO_PHONE_NUMBER || '',
  };

  try {
    const recordings = await getCallRecordings(twilioConfig, callSid);
    return c.json({ success: true, data: recordings });
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Check Twilio configuration status
twilioRoutes.get('/twilio/status', (c) => {
  const configured = !!(
    c.env.TWILIO_ACCOUNT_SID &&
    c.env.TWILIO_AUTH_TOKEN &&
    c.env.TWILIO_PHONE_NUMBER
  );

  return c.json({
    success: true,
    configured,
    message: configured
      ? 'Twilio is configured and ready'
      : 'Twilio is not configured. Please set environment variables.',
  });
});

export default twilioRoutes;
