import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export class SigninMessage {
  domain: string;
  publicKey: string;
  nonce: string;
  statement: string;

  constructor(message: {
    domain: string;
    publicKey: string;
    nonce: string;
    statement: string;
  }) {
    this.domain = message.domain;
    this.publicKey = message.publicKey;
    this.nonce = message.nonce;
    this.statement = message.statement;
  }

  prepare() {
    return `${this.statement}\n\nDomain: ${this.domain}\nPublic Key: ${this.publicKey}\nNonce: ${this.nonce}`;
  }

  verify(signature: string, publicKey: string): boolean {
    try {
      const message = this.prepare();
      const messageBytes = new TextEncoder().encode(message);
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      const signatureBytes = bs58.decode(signature);

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }
} 