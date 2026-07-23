const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vxittblwbyusehsrgffd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4aXR0Ymx3Ynl1c2Voc3JnZmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mjg5MTMsImV4cCI6MjEwMDMwNDkxM30.LbBkhoiFM2NcJaZWtal0dDkBHjrMzOYz4VXVegC4YHo';

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
