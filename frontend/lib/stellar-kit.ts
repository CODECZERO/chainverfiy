import {
    StellarWalletsKit,
    WalletNetwork,
    allowAllModules,
} from '@creit.tech/stellar-wallets-kit';

const getNetwork = () => {
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toUpperCase();
    if (network === 'PUBLIC') return WalletNetwork.PUBLIC;
    if (network === 'FUTURENET') return WalletNetwork.FUTURENET;
    return WalletNetwork.TESTNET;
};

let kitInstance: StellarWalletsKit | null = null;

/**
 * Lazy singleton — creates the kit on first call so that browser
 * extension globals (Freighter, Albedo, etc.) have time to inject.
 */
export const getKit = (): StellarWalletsKit => {
    if (typeof window === 'undefined') {
        throw new Error('StellarWalletsKit cannot be used on the server');
    }

    if (!kitInstance) {
        kitInstance = new StellarWalletsKit({
            network: getNetwork(),
            modules: allowAllModules(),
        });
    }
    return kitInstance;
};

/**
 * @deprecated Use getKit() instead. Kept for backward-compat during migration.
 * This now proxies to the lazy getter so extensions are detected properly.
 */
export const kit = new Proxy({} as StellarWalletsKit, {
    get(_target, prop) {
        const instance = getKit();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
});
