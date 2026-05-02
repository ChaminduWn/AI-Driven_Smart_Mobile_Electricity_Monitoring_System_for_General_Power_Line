const axios = require('axios');

async function testSignup() {
    try {
        const res = await axios.post('http://localhost:8003/api/auth/signup', {
            firstName: 'Test',
            lastName: 'User',
            address: '123 Street',
            district: 'Colombo',
            phone: '0771234567',
            email: 'test@example.com',
            password: 'password123',
            role: 'Householder'
        });
        console.log('Signup Success:', res.data);
    } catch (error) {
        console.error('Signup Error:', error.response ? error.response.data : error.message);
    }
}

testSignup();
