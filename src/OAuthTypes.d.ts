/**
 * Standardized error payload used inside {@link OAuthAPIError}.
 */
export type ErrorType = {
  /** Human-readable error message. */
  message: string;
  /** HTTP status code if available; `0` for non-HTTP/runtime errors. */
  status: number;
  /** Name of the method where the error originated. */
  methodName: string;
};

/**
 * Successful OAuth token response payload.
 */
export type GetTokenDataType = {
  /** OAuth access token used for authorized API calls. */
  access_token: string;
  /** Access token lifetime in seconds. */
  expires_in: number;
  /** Token type, typically `Bearer`. */
  token_type: string;
};

/**
 * Result of `getToken`.
 */
export type GetTokenReturnType = Promise<GetTokenDataType>;

/**
 * Successful user profile response payload.
 */
export type GetProfileDataType = {
  /** URL of the user's avatar image. */
  avatar: string;
  /** User's family/last name. */
  family: string;
  /** User city (geo profile field). */
  geocity: string;
  /** User country (geo profile field). */
  geocountry: string;
  /** Numeric user identifier. */
  id: number;
  /** User email address. */
  mail: string;
  /** User first/display name. */
  name: string;
  /** Role names granted to the user account. */
  roles: string[];
};

/**
 * Result of `getProfile`.
 */
export type GetProfileReturnType = Promise<GetProfileDataType>;

/**
 * Successful retouch token response payload.
 */
export type GetRetouchTokenDataType = {
  /** Remaining operations by mode. */
  remaining: { professional: number };
  /** Backend status code for retouch token response. */
  status: number;
  /** Retouch token string used by downstream services. */
  token: string;
};

/**
 * Result of `getRetouchToken`.
 */
export type GetRetouchTokenReturnType = Promise<GetRetouchTokenDataType>;

/**
 * Successful login-via-email-password response payload.
 */
export type LoginViaEmailPasswordDataType = {
  /** Access level. */
  result: number;
  /** User session string. */
  session: string;
  gateway: number;
  /** `1` when the user is authorized, `0` otherwise. */
  loggedin: boolean;
  mail: string;
  firstname: string;
  lastname: string;
  /** `true` when first or last name is missing. */
  askname: boolean;
  /** `1` to show retouch UI, `0` to hide it. */
  retouching: number;
};

/**
 * Result of `loginViaEmailPassword`.
 */
export type LoginViaEmailPasswordReturnType =
  Promise<LoginViaEmailPasswordDataType>;
