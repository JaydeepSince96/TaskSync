// Direct AWS SES test to isolate the issue
const AWS = require('aws-sdk');

// Configure AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  region: process.env.AWS_SES_REGION || 'ap-south-1'
});

async function testDirectSES() {
  console.log('🧪 Testing Direct AWS SES...\n');
  
  // Check configuration
  console.log('📋 Configuration:');
  console.log('- Access Key:', process.env.AWS_SES_ACCESS_KEY_ID ? `${process.env.AWS_SES_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET');
  console.log('- Secret Key:', process.env.AWS_SES_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
  console.log('- Region:', process.env.AWS_SES_REGION || 'ap-south-1');
  console.log('- From Email:', process.env.AWS_SES_FROM_EMAIL);
  
  console.log('\n📧 Attempting to send test email...');
  
  const params = {
    Source: process.env.AWS_SES_FROM_EMAIL || 'jaydeep.bhattachary@tasksync.org',
    Destination: {
      ToAddresses: ['jaydeep.bhattachary@tasksync.org'] // Your verified email
    },
    Message: {
      Subject: {
        Data: 'SES Test Email - TaskSync',
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: 'This is a test email from TaskSync to verify AWS SES configuration.\n\nTest OTP: 123456',
          Charset: 'UTF-8'
        },
        Html: {
          Data: `
            <h2>SES Test Email - TaskSync</h2>
            <p>This is a test email to verify AWS SES configuration.</p>
            <p><strong>Test OTP: 123456</strong></p>
            <p>If you receive this email, AWS SES is working correctly!</p>
          `,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log('✅ SUCCESS! Email sent successfully');
    console.log('📧 Message ID:', result.MessageId);
    console.log('🎉 Check your inbox at jaydeep.bhattachary@tasksync.org');
    
    return true;
  } catch (error) {
    console.log('❌ FAILED to send email');
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    
    // Specific error handling
    if (error.code === 'MessageRejected') {
      console.log('\n💡 This usually means:');
      console.log('- Email address not verified in SES');
      console.log('- Account is in sandbox mode');
      console.log('- Sending to unverified recipient');
    } else if (error.code === 'InvalidParameterValue') {
      console.log('\n💡 This usually means:');
      console.log('- Invalid email address format');
      console.log('- Missing required parameters');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.log('\n💡 This usually means:');
      console.log('- Invalid AWS credentials');
      console.log('- Incorrect secret access key');
    }
    
    return false;
  }
}

// Also test SES quota and sending statistics
async function checkSESStatus() {
  try {
    console.log('\n📊 Checking SES Account Status...');
    
    const quotaResult = await ses.getSendQuota().promise();
    console.log('📈 Send Quota:', quotaResult);
    
    const statsResult = await ses.getSendStatistics().promise();
    console.log('📊 Send Statistics:', statsResult.SendDataPoints?.slice(-3) || 'No recent data');
    
    const identitiesResult = await ses.listIdentities().promise();
    console.log('📧 Verified Identities:', identitiesResult.Identities);
    
  } catch (error) {
    console.log('❌ Error checking SES status:', error.message);
  }
}

async function main() {
  await testDirectSES();
  await checkSESStatus();
}

main();
