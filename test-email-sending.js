#!/usr/bin/env node
require('dotenv').config();

async function testSendGridEmail() {
  console.log('🧪 Testing SendGrid Email Sending...\n');

  // Check credentials
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL || !process.env.SENDGRID_FROM_NAME) {
    console.log('❌ Missing SendGrid credentials. Please set:');
    console.log('   SENDGRID_API_KEY');
    console.log('   SENDGRID_FROM_EMAIL');
    console.log('   SENDGRID_FROM_NAME');
    return;
  }

  // Test email data
  const testEmail = {
    to: process.env.SENDGRID_FROM_EMAIL, // Send to yourself for testing
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'TaskSync - SendGrid Test Email',
    text: 'This is a test email from TaskSync using SendGrid!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">TaskSync Email Test</h2>
        <p>🎉 <strong>Congratulations!</strong> Your SendGrid integration is working!</p>
        <p>This email was sent using:</p>
        <ul>
          <li>SendGrid API</li>
          <li>From: ${process.env.SENDGRID_FROM_NAME} (${process.env.SENDGRID_FROM_EMAIL})</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <p>Your email system is ready for:</p>
        <ul>
          <li>✅ User registration OTP</li>
          <li>✅ User invitations</li>
          <li>✅ Task notifications</li>
        </ul>
        <hr style="margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is a test email from TaskSync application.
        </p>
      </div>
    `
  };

  try {
    console.log('📧 Sending test email...');
    console.log(`   From: ${testEmail.from}`);
    console.log(`   To: ${testEmail.to}`);
    console.log(`   Subject: ${testEmail.subject}`);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: testEmail.to }]
        }],
        from: { 
          email: testEmail.from, 
          name: process.env.SENDGRID_FROM_NAME 
        },
        subject: testEmail.subject,
        content: [
          {
            type: 'text/plain',
            value: testEmail.text
          },
          {
            type: 'text/html',
            value: testEmail.html
          }
        ]
      })
    });

    if (response.ok) {
      console.log('\n✅ Email sent successfully!');
      console.log('📬 Check your inbox for the test email.');
      console.log('\n🚀 Your SendGrid integration is working perfectly!');
    } else {
      const errorData = await response.text();
      console.log('\n❌ Failed to send email:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData}`);
    }

  } catch (error) {
    console.log('\n❌ Error sending email:');
    console.log(`   ${error.message}`);
  }
}

// Run the test
testSendGridEmail();
