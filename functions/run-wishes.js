weChristianBdaysRunV3().then(() => console.log('Bdays Run Completed')).catch(e => console.error(e));
setTimeout(() => console.log('Waiting 15 seconds for async jobs...'), 5000);
setTimeout(() => console.log('Exiting...'), 15000);
