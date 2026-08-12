const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const path = require('path');

async function test() {
  try {
    const auth = new GoogleAuth({
      keyFilename: path.join(__dirname, 'google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/meetings.space.created'],
    });
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    console.log('Attempting to create space...');
    const response = await axios.post('https://meet.googleapis.com/v2/spaces', {
      config: {
        accessType: 'OPEN'
      }
    }, {
      headers: {
        Authorization: `Bearer ${token.token}`
      }
    });
    
    console.log('SUCCESS! Meeting link:', response.data.meetingUri);
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    }
  }
}

test();
