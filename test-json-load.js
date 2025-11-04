// Test script to load reading test from JSON
const fetch = require('node-fetch');

async function testLoadFromJson() {
  try {
    console.log('🔐 Logging in as admin...');

    // First login to get token
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

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Now load from JSON
    console.log('📚 Loading reading test from JSON...');
    const loadResponse = await fetch('http://localhost:3000/api/admin/reading-tests/load-from-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`
      }
    });

    const loadData = await loadResponse.json();

    if (loadResponse.ok) {
      console.log('✅ Reading test created successfully!');
      console.log('Test ID:', loadData.readingTest.id);
      console.log('Title:', loadData.readingTest.title);
      console.log('Passages:', loadData.readingTest.passages.length);
      console.log('Total questions:', loadData.readingTest.totalQuestions);
    } else {
      console.log('❌ Failed to create reading test:', loadData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoadFromJson();
