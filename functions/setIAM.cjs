const { GoogleAuth } = require('google-auth-library');

async function setIAM() {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
  });
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  console.log('Project:', projectId);

  const url = `https://cloudfunctions.googleapis.com/v2beta/projects/${projectId}/locations/us-central1/functions/processWhatsAppImageGreeting:setIamPolicy`;
  
  const res = await client.request({
    url,
    method: 'POST',
    data: {
      policy: {
        bindings: [
          {
            role: 'roles/cloudfunctions.invoker',
            members: ['allUsers']
          }
        ]
      }
    }
  });
  
  console.log('IAM Policy Set for Cloud Function:', res.data);

  try {
    const runUrl = `https://run.googleapis.com/v1/projects/${projectId}/locations/us-central1/services/processwhatsappimagegreeting:setIamPolicy`;
    const runRes = await client.request({
      url: runUrl,
      method: 'POST',
      data: {
        policy: {
          bindings: [
            {
              role: 'roles/run.invoker',
              members: ['allUsers']
            }
          ]
        }
      }
    });
    console.log('IAM Policy Set for Cloud Run:', runRes.data);
  } catch(e) {
    console.log('Could not set Cloud Run IAM:', e.message);
  }
}

setIAM().catch(console.error);
