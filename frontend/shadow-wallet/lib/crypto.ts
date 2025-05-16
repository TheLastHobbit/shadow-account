import { ethers } from 'ethers';
import { ec as EC } from 'elliptic';

const secp256k1 = new EC('secp256k1');

export const H2 = (pk: string, m: string): any => {
  console.log("H2 Pk:",pk)
  const hash = ethers.utils.keccak256(ethers.utils.concat([pk, m]));
  return secp256k1.g.mul(BigInt(hash));
};