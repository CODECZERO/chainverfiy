import { createAccount } from './server/dist/services/stellar/account.stellar.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });
createAccount().then(console.log).catch(console.error);
