import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  console.log('--- Testing WhatsApp Hook Logic ---');
  
  const senderPhone = "+1234567890";
  const shopSlug = "werthjk";
  
  try {
    // 1. Test Session Upsert
    console.log('1. Trying to upsert session...');
    const { error: sessionError } = await supabaseAdmin
      .from("whatsapp_sessions")
      .upsert({ 
        phone_number: senderPhone, 
        shop_slug: shopSlug,
        updated_at: new Date().toISOString()
      });
    
    if (sessionError) {
      console.error('Session Upsert Failed:', sessionError.message);
      return;
    }
    console.log('Session Upsert Success');

    // 2. Test Shop Lookup
    console.log('2. Trying to find shop...');
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, name")
      .ilike("slug", shopSlug)
      .single();

    if (shopError || !shop) {
      console.error('Shop Lookup Failed:', shopError?.message || 'Shop not found');
      return;
    }
    console.log('Shop Found:', shop.name);

    // 3. Test File Placeholder
    // (We won't actually upload to storage in the test for now)
    console.log('3. Test finished - logic up to job creation is sound.');
    
  } catch (e: any) {
    console.error('Unexpected error:', e.message);
  }
}

test();
