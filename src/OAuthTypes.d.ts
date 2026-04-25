/**
 * Standardized error payload returned by API methods on failure.
 */
export type ErrorType = {
  /** Human-readable error message. */
  message: string;
  /** HTTP status code if available; `0` for non-HTTP/runtime errors. */
  status: number;
  /** Name of the method where the error originated. */
  methodName: string;
  /** Name of the source module/class where the error originated. */
  fileName: string;
};

/**
 * Callback signature used to report API logs and structured errors.
 */
export type ErrorHandlerType = (
  /** Log severity/type, for example `error`. */
  type: string,
  /** Structured error payload. */
  error: ErrorType,
  /** Optional flag to control UI/console visibility of the log entry. */
  isShowLog?: boolean,
) => void;

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
 * Result of `getToken`: success payload or normalized error payload.
 */
export type GetTokenReturnType = Promise<
  /** Successful result with token data. */
  { failed: false; data: GetTokenDataType } | { failed: true; data: ErrorType }
>;

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
 * Result of `getProfile`: success payload or normalized error payload.
 */
export type GetProfileReturnType = Promise<
  | {
      /** Failure flag for successful branch. */
      failed: false;
      /** Parsed user profile payload. */
      data: GetProfileDataType;
    }
  | { failed: true; data: ErrorType }
>;

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
 * Result of `getRetouchToken`: success payload or normalized error payload.
 */
export type GetRetouchTokenReturnType = Promise<
  | {
      /** Failure flag for successful branch. */
      failed: false;
      /** Parsed retouch token payload. */
      data: GetRetouchTokenDataType;
    }
  | { failed: true; data: ErrorType }
>;
