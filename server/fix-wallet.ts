import { prisma } from './src/lib/prisma.js';
import { createAccount } from './src/services/stellar/account.stellar.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  const email = 'ankitmahardev2@gmail.com';
  
  let user;
  let attempts = 0;
  while (attempts < 3) {
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { supplierProfile: true }
      });
      break;
    } catch (e) {
      attempts++;
      console.log(`Failed findUnique, retrying... (${attempts}/3)`);
      await new Promise(r => setTimeout(r, 1000));
      if (attempts === 3) throw e;
    }
  }

  if (!user) {
    console.log(`User ${email} not found!`);
    return;
  }

  console.log(`Found user: ${user.id}. Current wallet: ${user.stellarWallet}`);

  console.log('Generating new Stellar account on testnet...');
  const account = await createAccount();
  
  if (!account || !account.publicKey) {
    throw new Error('Failed to create account');
  }
  
  console.log(`Created account! PublicKey: ${account.publicKey}`);
  
  attempts = 0;
  while (attempts < 3) {
    try {
      // Update User
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stellarWallet: account.publicKey,
          managedSecret: account.secret,
        }
      });
      
      // Update Supplier if exists
      if (user.supplierProfile) {
        await prisma.supplier.update({
          where: { id: user.supplierProfile.id },
          data: {
            stellarWallet: account.publicKey,
            managedSecret: account.secret,
          }
        });
        console.log('Updated Supplier profile too.');
      }
      break;
    } catch (e) {
      attempts++;
      console.log(`Failed update, retrying... (${attempts}/3)`);
      await new Promise(r => setTimeout(r, 1000));
      if (attempts === 3) throw e;
    }
  }

  console.log('Successfully updated DB!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
