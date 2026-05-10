const http = require('http');

http.get('http://localhost:8003/api/admin/dashboard', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => console.log('RESPONSE:', data));
}).on('error', (e) => console.log('Error:', e.message));
