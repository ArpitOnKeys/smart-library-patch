import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  phone: string;
  message: string;
  studentId: string;
  studentName: string;
}

interface WhatsAppSession {
  id: string;
  qrCode?: string;
  status: 'pending' | 'connected' | 'disconnected';
  connectedAt?: string;
  sessionData?: any;
}

// In-memory store for WhatsApp sessions (in production, use Redis or database)
const sessions = new Map<string, WhatsAppSession>();
const qrCodes = new Map<string, string>();

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'generate-qr':
        return handleGenerateQR(data);
      
      case 'check-session':
        return handleCheckSession(data);
      
      case 'send-message':
        return handleSendMessage(data);
      
      case 'send-bulk-messages':
        return handleSendBulkMessages(data);
      
      case 'disconnect':
        return handleDisconnect(data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('WhatsApp handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGenerateQR(data: any) {
  const sessionId = crypto.randomUUID();
  
  // Generate a mock QR code for demo purposes
  // In production, this would integrate with whatsapp-web.js or similar
  const qrCode = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(`whatsapp-session:${sessionId}`)}`;
  
  sessions.set(sessionId, {
    id: sessionId,
    qrCode,
    status: 'pending'
  });
  
  qrCodes.set(sessionId, qrCode);
  
  // Simulate QR code expiration after 30 seconds for demo
  setTimeout(() => {
    if (sessions.get(sessionId)?.status === 'pending') {
      sessions.delete(sessionId);
      qrCodes.delete(sessionId);
    }
  }, 30000);
  
  return new Response(
    JSON.stringify({ sessionId, qrCode, status: 'pending' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCheckSession(data: { sessionId: string }) {
  const session = sessions.get(data.sessionId);
  
  if (!session) {
    return new Response(
      JSON.stringify({ status: 'not-found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Simulate random connection for demo
  if (session.status === 'pending' && Math.random() > 0.7) {
    session.status = 'connected';
    session.connectedAt = new Date().toISOString();
    session.sessionData = { phone: '+91' + Math.floor(Math.random() * 9000000000 + 1000000000) };
  }
  
  return new Response(
    JSON.stringify(session),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSendMessage(data: WhatsAppMessage) {
  // Simulate message sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log the message
  const logEntry = {
    id: crypto.randomUUID(),
    studentId: data.studentId,
    studentName: data.studentName,
    phoneNumber: data.phone,
    message: data.message,
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.1 ? 'sent' : 'failed' // 90% success rate for demo
  };
  
  return new Response(
    JSON.stringify({ success: true, log: logEntry }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSendBulkMessages(data: { messages: WhatsAppMessage[] }) {
  const results = [];
  
  // Process messages with delay to avoid rate limiting
  for (let i = 0; i < data.messages.length; i++) {
    const message = data.messages[i];
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const logEntry = {
      id: crypto.randomUUID(),
      studentId: message.studentId,
      studentName: message.studentName,
      phoneNumber: message.phone,
      message: message.message,
      timestamp: new Date().toISOString(),
      status: Math.random() > 0.1 ? 'sent' : 'failed'
    };
    
    results.push(logEntry);
  }
  
  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDisconnect(data: { sessionId: string }) {
  sessions.delete(data.sessionId);
  qrCodes.delete(data.sessionId);
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}