const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eisdlhbrigmwsfycvkdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpc2RsaGJyaWdtd3NmeWN2a2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDY4OTcsImV4cCI6MjA5MDY4Mjg5N30.S61mG_fOAtupBDaTKgYHeiDk7DKqYtRp3yLpyLgFbyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Fetching shops with coordinates...');
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, slug, shop_location, shop_lat, shop_lng, is_open');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${shops.length} total shops.`);
    const withCoords = shops.filter(s => s.shop_lat && s.shop_lng);
    console.log(`Found ${withCoords.length} shops with coordinates:`);
    console.log(withCoords);
  }
}

test();
