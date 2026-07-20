const { GoogleAuth } = require('google-auth-library');

async function main() {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
  });
  
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  
  const url = `https://run.googleapis.com/v1/projects/${projectId}/locations/us-central1/services/startdonation:setIamPolicy`;
  
  const response = await client.request({
    url,
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
  
  console.log('IAM Policy updated:', response.data);
}

main().catch(console.error);
