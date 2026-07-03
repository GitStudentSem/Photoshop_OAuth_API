import type { LicenseProductConfig } from './license.js';

/**
 * Known Retouch4me products with their license hash parameters.
 *
 * `installationIdPrefix` (server `keyprefix`) and `licenseHashSalt`
 * (server `keysalt`) must match the server product record. The RSA key pair
 * may be shared between products — licenses differ via prefix + salt.
 */
export interface Product extends LicenseProductConfig {
  /** Human-readable label (not part of the license hash). */
  label: string;

}

export const PRODUCTS: Record<string, Product> = {
  vectorscope: {
    label: 'retouch4me_vectorscope_panel',
    installationIdPrefix: 'R4VS',
    licenseHashSalt: '',
  },
  waveform: {
    label: 'retouch4me_waveform_panel',
    installationIdPrefix: 'R4WF',
    licenseHashSalt: 'waveform',
  },
  wbcompass: {
    label: 'retouch4me_wbcompass_panel',
    installationIdPrefix: 'R4WBC',
    licenseHashSalt: 'wbcompass',
  },
};

export const DEFAULT_PRODUCT_KEY = 'vectorscope';

export function resolveProduct(key?: string): Product {
  const resolved = PRODUCTS[(key || DEFAULT_PRODUCT_KEY).toLowerCase()];
  if (!resolved) {
    throw new Error(
      `Unknown product "${key}". Available: ${Object.keys(PRODUCTS).join(', ')}`,
    );
  }
  return resolved;
}
