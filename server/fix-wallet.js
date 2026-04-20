import { prisma } from './dist/lib/prisma.js';
import { createAccount } from './dist/services/stellar/account.stellar.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  const email = 'ankitmahardev2@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { supplierProfile: true }
  });

  if (!user) {
    console.log(`User ${email} not found!`);
    return;
  }

  console.log(`Found user: ${user.id}. Current wallet: ${user.stellarWallet}`);

  if (user.stellarWallet) {
    console.log('User already has a wallet address. Generating a new one anyway to override...');
  }

  console.log('Generating new Stellar account on testnet...');
  const account = await createAccount();
  
  if (!account || !account.publicKey) {
    throw new Error('Failed to create account');
  }
  
  console.log(`Created account! PublicKey: ${account.publicKey}`);
  
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
