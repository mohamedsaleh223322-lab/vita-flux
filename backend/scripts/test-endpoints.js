const API_URL = 'http://localhost:3000/api/mobile';

async function test() {
  try {
    console.log('--- Testing /api/mobile/governorates ---');
    const govRes = await fetch(`${API_URL}/governorates`);
    console.log('Status:', govRes.status);
    const govData = await govRes.json();
    console.log('Governorates list sample (first 3):', govData.slice(0, 3));

    console.log('--- Testing /api/mobile/auth/register (missing fields) ---');
    const res1 = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test User' })
    });
    console.log('Expected failure (missing fields):', res1.status, await res1.json());

    console.log('--- Testing /api/mobile/auth/register (successful registration) ---');
    const phone = '01' + Math.floor(100000000 + Math.random() * 900000000);
    const registerPayload = {
      fullName: 'John Doe Mobile',
      phone: phone,
      password: 'password123',
      confirmPassword: 'password123',
      governorateId: 1, // Cairo
    };
    console.log('Registering with payload:', registerPayload);
    const res2 = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });
    console.log('Register response status:', res2.status);
    console.log('Register response data:', await res2.json());

    console.log('--- Testing /api/mobile/auth/register (without optional email) ---');
    const phone2 = '01' + Math.floor(100000000 + Math.random() * 900000000);
    const registerPayload2 = {
      fullName: 'No Email User',
      phone: phone2,
      password: 'password123',
      confirmPassword: 'password123',
      governorateId: 2, // Alexandria
    };
    console.log('Registering with payload:', registerPayload2);
    const res3 = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload2)
    });
    console.log('Register response status:', res3.status);
    console.log('Register response data:', await res3.json());

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
