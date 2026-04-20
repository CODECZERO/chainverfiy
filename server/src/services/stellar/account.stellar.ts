import { STELLAR_CONFIG, createKeypair } from './config.stellar.js';
import { Operation, Keypair, xdr, TransactionBuilder } from '@stellar/stellar-sdk';
import { adminSequenceManager, horizonServer } from './smartContract.handler.stellar.js';
import dotenv from 'dotenv';
dotenv.config();

// This function creates a new Stellar keypair locally.
// We no longer fund it with admin XLM to prevent draining the platform's funds
// in production. The account will be inactive on the network until the user
// deposits at least 1 XLM into it.
export const createAccount = async () => {
  try {
    const newPair = createKeypair();
    console.log(`Generated local Stellar account: ${newPair.publicKey()}`);
    
    return {
      publicKey: newPair.publicKey(),
      secret: newPair.secret(),
    };
  } catch (error) {
    console.error('Error creating local Stellar account:', error);
    throw error;
  }
};

//destination is the public key that will receive the remaining native balance
export const DeletAccount = async (secret: string, destination: string) => {
  const keypair = Keypair.fromSecret(secret);
  const Account = await STELLAR_CONFIG.server.loadAccount(keypair.publicKey());

  const tx = new TransactionBuilder(Account, {
    fee: (await STELLAR_CONFIG.server.fetchBaseFee()).toString(),
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(Operation.accountMerge({ destination }))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  await STELLAR_CONFIG.server.submitAsyncTransaction(tx);
};

// those two upper code are wrong , they are for testnet or horizon , make them for Futurenet(correct one , as soroban is need for it)
