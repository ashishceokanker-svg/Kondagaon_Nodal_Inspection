const { createClient } = require('@supabase/supabase-js');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const s = createClient(
  'https://rovjavynllqsftslgeup.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvdmphdnlubGxxc2Z0c2xnZXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTYyNDUsImV4cCI6MjEwNDI5MjI0NX0.4xjJTT6GUygb6iYvhEgp6HOQaXoq2WjqDePrwnQiZbY'
);

async function test() {
  const r1 = await s.from('inspections_nirman').select('*').limit(1);
  console.log('inspections_nirman result:', r1);

  const r2 = await s.from('inspections_awas').select('*').limit(1);
  console.log('inspections_awas result:', r2);
}

test();
