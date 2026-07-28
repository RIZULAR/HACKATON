const resendApiKey = process.env.RESEND_API_KEY || '';

async function testSend() {
  console.log('Sending test email via Resend API...');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'MAGISTA Portal <onboarding@resend.dev>',
        to: ['albarnaga123@gmail.com'],
        subject: '[MAGISTA Test] Test Email Sending',
        html: '<p>Halo! Ini adalah email uji coba dari sistem MAGISTA.</p>'
      })
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testSend();
