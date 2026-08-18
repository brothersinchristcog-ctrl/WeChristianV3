let bdone = false;
let adone = false;
let pdone = false;

testBdays.get().then(() => { bdone = true; console.log('Bdays done'); }).catch(e => console.error(e));
testAnnivs.get().then(() => { adone = true; console.log('Annivs done'); }).catch(e => console.error(e));
testBaptisms.get().then(() => { pdone = true; console.log('Baptisms done'); }).catch(e => console.error(e));

setInterval(() => {
  if (bdone && adone && pdone) {
    console.log("All done, exiting now");
    process.exit(0);
  }
}, 1000);
