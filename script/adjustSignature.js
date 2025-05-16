const ethers = require('ethers');
const signature = '0x959d1e416c0bacba0170be6252badf8d831abfafda350d772a1bc25af65f44bc1edc263fc90ad3c0214ff35ad2460ba47d298ce182bde901d29ca202fcc387611b';
const newSignature = signature.slice(0, -2) + '1c';
console.log('New signature (v=28):', newSignature);
