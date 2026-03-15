// Test: import dist/index.js and hit the API
const http = require('http');

// Start the server
process.env.PORT = '5555';
process.env.NODE_ENV = 'production';

import('./dist/index.js').then(() => {
  console.log('Server started, testing API...');
  setTimeout(() => {
    http.get('http://localhost:5555/api/properties', (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log('API STATUS:', res.statusCode);
        console.log('API BODY:', data.substring(0, 500));
        process.exit(0);
      });
    }).on('error', e => {
      console.log('API ERROR:', e.message);
      process.exit(1);
    });
  }, 3000);
}).catch(e => {
  console.error('IMPORT ERROR:', e);
  process.exit(1);
});
