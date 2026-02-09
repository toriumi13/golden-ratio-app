import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import PurchasesUI from 'react-native-purchases-ui';
import { auth } from './firebase';

// --- CONFIGURATION ---
const API_KEYS = {
    apple: 'test_OLlUzblBxPYokRisjtgrZqvYdOO',
    google: 'test_OLlUzblBxPYokRisjtgrZqvYdOO',
};

export const ENTITLEMENT_ID = 'goledn-raito-app standard';

/**
 * Initializes RevenueCat and identifies the user with their Firebase UID.
 */
export const initializeSubscription = async () => {
    if (Platform.OS === 'web') return; // RevenueCat RN SDK doesn't support Web directly

    try {
        const apiKey = Platform.select({
            ios: API_KEYS.apple,
            android: API_KEYS.google,
            default: '',
        });

        if (!apiKey) return;

        Purchases.configure({ apiKey });

        // Sync with Firebase User if logged in
        const user = auth.currentUser;
        if (user) {
            await Purchases.logIn(user.uid);
        }
    } catch (e) {
        console.error('RevenueCat initialization failed:', e);
    }
};

/**
 * Syncs RevenueCat user whenever Firebase auth state changes.
 */
export const syncSubscriptionUser = async (uid: string | null) => {
    if (Platform.OS === 'web') return;

    try {
        if (uid) {
            await Purchases.logIn(uid);
        } else {
            await Purchases.logOut();
        }
    } catch (e) {
        console.error('RevenueCat sync failed:', e);
    }
};

/**
 * Checks if the user has the 'standard' entitlement.
 */
export const checkSubscriptionStatus = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false; // Handle web subscription separately via Stripe

    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        console.error('Failed to check subscription status:', e);
        return false;
    }
};

/**
 * Fetches available packages for the paywall.
 */
export const getAvailablePackages = async (): Promise<PurchasesPackage[]> => {
    if (Platform.OS === 'web') return [];

    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
            return offerings.current.availablePackages;
        }
    } catch (e) {
        console.error('Failed to fetch offerings:', e);
    }
    return [];
};

/**
 * Performs a purchase.
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        // Handle cancellation or error
        if ((e as any).userCancelled) {
            console.log('User cancelled purchase');
        } else {
            console.error('Purchase failed:', e);
        }
        return false;
    }
};

/**
 * Restores previous purchases.
 */
export const restorePurchases = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
        const customerInfo = await Purchases.restorePurchases();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        console.error('Restore failed:', e);
        return false;
    }
};

/**
 * Presents the RevenueCat native Paywall.
 */
export const presentPaywall = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
        const result = await PurchasesUI.presentPaywall();
        // Returns true if the user has the entitlement after closing/completing
        return result === PurchasesUI.PAYWALL_RESULT.PURCHASED || result === PurchasesUI.PAYWALL_RESULT.RESTORED;
    } catch (e) {
        console.error('Paywall error:', e);
        return false;
    }
};

/**
 * Presents the RevenueCat native Paywall only if the user doesn't have the entitlement.
 */
export const presentPaywallIfNeeded = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
        const result = await PurchasesUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: ENTITLEMENT_ID
        });
        return result === PurchasesUI.PAYWALL_RESULT.PURCHASED || result === PurchasesUI.PAYWALL_RESULT.RESTORED;
    } catch (e) {
        console.error('Paywall request error:', e);
        return false;
    }
};

/**
 * Presents the RevenueCat Customer Center for subscription management.
 */
export const presentCustomerCenter = async () => {
    if (Platform.OS === 'web') return;
    try {
        await PurchasesUI.presentCustomerCenter();
    } catch (e) {
        console.error('Customer Center error:', e);
    }
};

