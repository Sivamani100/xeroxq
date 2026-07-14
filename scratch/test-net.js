const https = require('https');

function testUrl(url) {
  console.log(`Testing connection to: ${url}`);
  https.get(url, (res) => {
    console.log(`Response Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
  }).on('error', (err) => {
    console.error(`Error connecting to ${url}:`, err.message);
  });
}

testUrl('https://a.basemaps.cartocdn.com/rastertiles/voyager/0/0/0.png');
testUrl('https://a.basemaps.cartocdn.com/light_all/0/0/0.png');
