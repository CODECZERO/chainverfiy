import { createAccount } from './dist/services/stellar/account.stellar.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
createAccount().then(console.log).catch(console.error);
