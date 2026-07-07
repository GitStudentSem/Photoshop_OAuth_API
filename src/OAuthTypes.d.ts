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
  remaining: GetRetouchTokenRemainingByModeType;
  /** Backend status code for retouch token response. */
  status: number;
  /** Retouch token string used by downstream services. */
  token: string;
};

/**
 * Remaining operations grouped by mode.
 */
export type GetRetouchTokenRemainingByModeType = {
  /** Remaining operations in `professional` mode. */
  professional: number;
};

/**
 * Result of `getRetouchToken`.
 */
export type GetRetouchTokenReturnType = Promise<GetRetouchTokenDataType>;

/**
 * Response payload shape for `getRetouchTokenWithoutEmail`.
 *
 * Backend response may evolve, so unknown fields are preserved.
 */
export type GetRetouchTokenWithoutEmailDataType = Record<string, unknown>;

/**
 * Result of `getRetouchTokenWithoutEmail`.
 */
export type GetRetouchTokenWithoutEmailReturnType =
  Promise<GetRetouchTokenWithoutEmailDataType>;

/**
 * Successful login-via-email-password response payload.
 */
export type LoginViaEmailPasswordDataType = {
  /** Access level. */
  result: number;
  /** User session string. */
  session: string;
  /** Numeric gateway identifier returned by backend. */
  gateway: number;
  /** `1` when the user is authorized, `0` otherwise. */
  loggedin: boolean;
  /** User email address. */
  mail: string;
  /** User first name. */
  firstname: string;
  /** User last name. */
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

/**
 * Input payload for `loginViaEmailPassword`.
 */
export type LoginViaEmailPasswordParamsType = {
  /** User email address. */
  email: string;
  /** User password. */
  password: string;
  /** Hardware identifier tied to the client computer. */
  deviceid: string;
  /** Client application identifier. */
  application: string;
};

/**
 * Input payload for `getOnlineRegistrationKey`.
 */
export type GetOnlineRegistrationKeyParamsType = {
  /** User email. */
  email: string;
  /** Application identifier used by backend APIs. */
  programName: string;
  /** Device identifier tied to the client machine. */
  deviceId: string;
  /** Application installation identifier. */
  installationId: string;
  /** Platform identifier (for example `win32`, `win10`, `darwin`). */
  platform: string;
  /** Session/access token used by backend validation. */
  session: string;
  /** Whether to request key confirmation mode (`confirm=1`). */
  withkey?: boolean;
  /** Whether to request subscription mode (`momentary=1`). */
  subscription?: boolean;
  /** Callback executed when request handling fails. */
  onLogout?: () => void;
};

/**
 * Parsed online registration key response payload.
 */
export type GetOnlineRegistrationKeyDataType = {
  /** Backend error code string. */
  error: string;
  /** Backend error message. */
  errormsg: string;
  /** License key string when available. */
  key: string;
  /** Remaining keys count. */
  keysleft: number;
  /** Maximum keys limit. */
  keylimit: number;
  /** Already used keys count. */
  keyscount: number;
};

/**
 * Result of `getOnlineRegistrationKey`.
 */
export type GetOnlineRegistrationKeyReturnType =
  Promise<GetOnlineRegistrationKeyDataType>;
