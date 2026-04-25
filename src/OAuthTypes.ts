export type ErrorType = {
  message: string;
  /** response status */
  status: number;
  methodName: string;
  fileName: string;
};

export type ErrorHandlerType = (
  type: string,
  error: ErrorType,
  isShowLog?: boolean,
) => void;

// Get Token
export type GetTokenDataType = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type GetTokenReturnType = Promise<
  { failed: false; data: GetTokenDataType } | { failed: true; data: ErrorType }
>;

// Get Profile
export type GetProfileDataType = {
  avatar: string;
  family: string;
  geocity: string;
  geocountry: string;
  id: number;
  mail: string;
  name: string;
  roles: string[];
};

export type GetProfileReturnType = Promise<
  | {
      failed: false;
      data: GetProfileDataType;
    }
  | { failed: true; data: ErrorType }
>;

// Get Retouch Token
export type GetRetouchTokenDataType = {
  remaining: { professional: number };
  status: number;
  token: string;
};

export type GetRetouchTokenReturnType = Promise<
  | {
      failed: false;
      data: GetRetouchTokenDataType;
    }
  | { failed: true; data: ErrorType }
>;
