const https = require('https');
const url = "https://storage.googleapis.com/eas-workflows-production/logs/c20972c0-5a37-49f5-80f9-7d38334454c0/090ca949-0409-49fd-a928-dbc07d961ec7/2026-08-03T08%3A56%3A21Z-e9833d5a-b1da-4f7c-aad8-611c5c37ab10.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260803%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260803T090304Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=7aa5d4929bef3491683ddce6d412a6d8d1bde21b27aeeb56bf0829f8e28a3683ad192e619de3d042b1a6132a86a24512e3f72094394eb85e66dec637ee499ade480d791ddd2ee5957ea2109c6e3202bbce970cb2eb0cc293247d3d18a94965e6cb0aa84eeb5cc1b6841bd1dceec11f09a6f69edfd1060e84878c35b2354319d273dde4fcb4892f8ef795610fd12cd38ba7948a42e4321b6f2f92368b27042bec2f5fee60ad5fbeb04c821fe8d10a0903e1e6570fca44733c65bc32a1da9ef707b65dd368c58f561ca912ba44eb844e23004a689dff12924b083f99234936d8f5e568418c105dc84afc4a4b49df6241df285cce25d456012b99fdc88f6e30789d";

https.get(url, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const last2000 = body.slice(-2000);
    console.log(last2000);
  });
}).on('error', e => console.error(e));
