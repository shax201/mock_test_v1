const fetch = require('node-fetch');

async function testLoadFromJson() {
  try {
    console.log('🔐 Testing login...');

    // First login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@radiance.edu',
        password: 'admin123'
      })
    });

    console.log('Login response status:', loginResponse.status);

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token length:', token.length);

    // Test the load-from-json endpoint
    console.log('📚 Testing load-from-json API...');
    const loadResponse = await fetch('http://localhost:3000/api/admin/reading-tests/load-from-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`
      }
    });

    console.log('Load API response status:', loadResponse.status);
    console.log('Load API response headers:', Object.fromEntries(loadResponse.headers.entries()));

    const responseText = await loadResponse.text();
    console.log('Load API response body:', responseText);

    if (loadResponse.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLoadFromJson();
