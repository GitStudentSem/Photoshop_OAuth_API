import type {
  ErrorHandlerType,
  ErrorType,
  GetProfileDataType,
  GetProfileReturnType,
  GetRetouchTokenDataType,
  GetRetouchTokenReturnType,
  GetTokenDataType,
  GetTokenReturnType,
} from "./OAuthTypes";

/**
 * @module OauthAPI
 * @description A class representing methods for Oauth authorization with r4me servers
 */
interface OauthLinksType {
  /** Authorization start link. */
  authorizeLink: string;

  /** Link where the response will be sent.  */
  redirectLink: string;

  /** Link to obtain a token. */
  tokenByCodeVerifierLink: string;

  /** Link to get the user profile. */
  getProfileLink: string;

  /** Link for getting a retouch token. */
  getRetouchTokenLink: string;

  /** Link for getting a retouch token without the user's email. */
  getRetouchTokenWithoutEmailLink: string;
}

const pages = {
  authorize: "/api/v1/authorize",
  redirect: "/api/v1/redirect",
  tokenByCodeVerifier: "/api/v1/tokenByCodeVerifier",
  profile: "/api/v1/profile",
  lutgetretouchtoken: "/lutgetretouchtoken.php",
  retouch: "/api/v1/tokens/retouch",
};

export default class OauthAPI {
  /**
   * Links to access all authorization methods.
   * for stage retouch4.me change to stage7.reludo.yatsyk.com
   * Other stage addresses:
   * https://3dcom7.reludo.yatsyk.com/lutgetretouchtoken.php
   * https://stage7.reludo.yatsyk.com/buy.php
   * https://3dlutcreator.com/lutgetretouchtoken.php
   *
   */

  /** The error logging function. */
  errorHandler: ErrorHandlerType;

  /** Authorization start link. */
  authorizeLink: string;

  /** Link where the response will be sent. */
  redirectLink: string;

  /** Link to obtain a token. */
  tokenByCodeVerifierLink: string;

  /** Link to get the user profile. */
  getProfileLink: string;

  /** Link for getting a retouch token. */
  getRetouchTokenLink: string;

  /** Link for getting a retouch token without the user's email. */
  getRetouchTokenWithoutEmailLink: string;

  /** filename for logger function */
  fileName: "OAuthAPI";

  /**
   * Creates a new OauthAPI instance with default production endpoints.
   *
   * @param errorHandler - Callback used to log and handle API errors.
   * @remarks The constructor initializes all endpoint URLs and stores them as mutable instance state.
   * Use `setBaseUrl` or `setFullUrl` to override defaults for staging or custom environments.
   */
  constructor(
    /** The error logging function. */
    errorHandler: ErrorHandlerType,
  ) {
    this.errorHandler = errorHandler;
    this.authorizeLink = `https://retouch4.me${pages.authorize}`;
    this.redirectLink = `https://retouch4.me${pages.redirect}`;
    this.tokenByCodeVerifierLink = `https://retouch4.me${pages.tokenByCodeVerifier}`;
    this.getProfileLink = `https://retouch4.me${pages.profile}`;
    this.getRetouchTokenLink = `https://3dlutcreator.com${pages.lutgetretouchtoken}`;
    this.getRetouchTokenWithoutEmailLink = `https://retouch4.me${pages.retouch}`;

    this.fileName = "OAuthAPI";
  }

  /**
   * Builds a standardized error response object and sends it to the configured error handler.
   *
   * @param data - Error payload with message and optional HTTP status.
   * @param methodName - Source method name used for error attribution.
   * @returns A normalized failed result in the `{ failed: true, data: ErrorType }` format.
   * @remarks This helper does not throw and is used by public API methods to return predictable error objects.
   */
  _generateError(
    data: { message: string; status?: number },
    methodName: string,
  ): { failed: true; data: ErrorType } {
    const errorData: ErrorType = {
      message: data.message,
      status: data.status || 0,
      methodName,
      fileName: this.fileName,
    };
    this.errorHandler("error", errorData);

    return {
      failed: true,
      data: errorData,
    };
  }

  /**
   * Converts an unknown caught exception into a normalized API error result.
   *
   * @param error - Caught exception or arbitrary value from a `catch` block.
   * @param methodName - Source method name used for error attribution.
   * @returns A normalized failed result in the `{ failed: true, data: ErrorType }` format.
   * @remarks This helper does not rethrow and always returns a structured error object.
   */
  _catchError(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    error: Error | any,
    methodName: string,
  ): { failed: true; data: ErrorType } {
    const errorData: ErrorType = {
      message: error.message || "unknown catch error",
      status: 0,
      methodName,
      fileName: this.fileName,
    };
    this.errorHandler("error", errorData);

    if (error instanceof Error) {
      return {
        failed: true,
        data: errorData,
      };
    }
    return {
      failed: true,
      data: errorData,
    };
  }

  /**
   * Replaces all OAuth-related endpoint URLs with explicitly provided full links.
   *
   * @param links - Complete set of endpoint URLs used by all authorization methods.
   * @returns `void`.
   * @remarks This method mutates instance URL state and affects all subsequent API calls made by this instance.
   */
  setFullUrl(links: OauthLinksType) {
    this.authorizeLink = links.authorizeLink;
    this.redirectLink = links.redirectLink;
    this.tokenByCodeVerifierLink = links.tokenByCodeVerifierLink;
    this.getProfileLink = links.getProfileLink;
    this.getRetouchTokenLink = links.getRetouchTokenLink;
    this.getRetouchTokenWithoutEmailLink =
      links.getRetouchTokenWithoutEmailLink;
  }

  /**
   * Rebuilds endpoint URLs from base domains for Retouch4me and LUT Creator services.
   *
   * @param baseUrls - Base URLs used to compose all known endpoint paths.
   * @param baseUrls.lutCreatorBaseUrl - Base URL for LUT Creator-related endpoints.
   * @param baseUrls.retouch4meBaseUrl - Base URL for Retouch4me OAuth endpoints.
   * @returns `void`.
   * @remarks This method mutates instance URL state and affects all subsequent API calls made by this instance.
   */
  setBaseUrl(baseUrls: {
    lutCreatorBaseUrl: string;
    retouch4meBaseUrl: string;
  }) {
    this.authorizeLink = `${baseUrls.retouch4meBaseUrl}${pages.authorize}`;
    this.redirectLink = `${baseUrls.retouch4meBaseUrl}${pages.redirect}`;
    this.tokenByCodeVerifierLink = `${baseUrls.retouch4meBaseUrl}${pages.tokenByCodeVerifier}`;
    this.getProfileLink = `${baseUrls.retouch4meBaseUrl}${pages.profile}`;
    this.getRetouchTokenLink = `${baseUrls.lutCreatorBaseUrl}${pages.lutgetretouchtoken}`;
    this.getRetouchTokenWithoutEmailLink = `${baseUrls.retouch4meBaseUrl}${pages.retouch}`;
  }

  /**
   * @method getLink
   * @description Generating a link for authorization, the user will follow this link.
   * @param  deviceid - Hardware identifier, must be tied to the computer.
   * @param  codeVerifier - Calculated value,
   * @param  codeChallenge - Computed value,
   * @returns Authorization URL that should be opened by a user to start OAuth flow.
   * @example
   * ```ts
   * const oauth = new OauthAPI(console.error as any);
   * const link = oauth.getLink("device-id", "verifier", "challenge");
   * ```
   * @remarks This method only generates a URL and does not perform network requests.
   * @see https://docs.google.com/document/d1gX_YwTV0v1hI2-shIlj_Fdk23P9S1Dz8B3wZvjLlIBw/edit.
   */
  getLink(
    deviceid: string,
    codeVerifier: string,
    codeChallenge: string,
  ): string {
    const responseType = "code";
    const clientId = "retouch4me_photoshop_panel";
    const scope = "profile";
    const codeChallengeMethod = "S256";

    const link = `${this.authorizeLink}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${this.redirectLink}&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}&code_verifier=${codeVerifier}&deviceid=${deviceid}`;

    return link;
  }

  /**
   * Obtains OAuth access token data by `code_verifier`.
   *
   * @param codeVerifier - PKCE code verifier that was used for authorization link generation.
   * @returns A promise resolving to a successful token payload or a normalized error object.
   * @example
   * ```ts
   * const result = await oauth.getToken(codeVerifier);
   * if (!result.failed) {
   *   console.log(result.data.access_token);
   * }
   * ```
   * @remarks This method does not throw network/API errors; it returns `{ failed: true, data: ErrorType }`.
   * @see https://docs.google.com/document/d/1gX_YwTV0v1hI2-shIlj_Fdk23P9S1Dz8B3wZvjLlIBw/edit#heading=h.2vd8zkzi6cd9
   */
  async getToken(codeVerifier: string): GetTokenReturnType {
    const methodName = "getToken";
    try {
      const response = await fetch(
        `${this.tokenByCodeVerifierLink}?code_verifier=${codeVerifier}`,
      );

      if (response.ok) {
        const result: GetTokenDataType = await response.json();
        return { failed: false, data: result };
      }

      return this._generateError(
        { message: response.statusText, status: response.status },
        methodName,
      );
    } catch (error) {
      return this._catchError(error, methodName);
    }
  }

  /**
   * Fetches user profile data using an OAuth token.
   *
   * @param tokenType - Token type returned by `getToken` (for example `Bearer`).
   * @param token - Access token returned by `getToken`.
   * @returns A promise resolving to profile data or a normalized error object.
   * @example
   * ```ts
   * const tokenResult = await oauth.getToken(codeVerifier);
   * if (!tokenResult.failed) {
   *   const profileResult = await oauth.getProfile(
   *     tokenResult.data.token_type,
   *     tokenResult.data.access_token,
   *   );
   * }
   * ```
   * @remarks This method does not throw network/API errors; it returns `{ failed: true, data: ErrorType }`.
   */
  async getProfile(tokenType: string, token: string): GetProfileReturnType {
    const methodName = "getProfile";
    try {
      const response = await fetch(this.getProfileLink, {
        headers: { Authorization: `${tokenType} ${token}` },
      });

      if (response.ok) {
        const result: GetProfileDataType = await response.json();
        return { failed: false, data: result };
      }

      return this._generateError(
        { message: response.statusText, status: response.status },
        methodName,
      );
    } catch (error) {
      return this._catchError(error, methodName);
    }
  }

  /**
   * Requests a retouch token using user profile, session, and device metadata.
   *
   * @param email - User email obtained from `getProfile`.
   * @param session - `access_token` value obtained from `getToken`.
   * @param deviceid - Hardware identifier tied to the client computer.
   * @param application - Client application identifier (for example `retouch4me_photoshop_panel`).
   * @returns A promise resolving to retouch token data or a normalized error object.
   * @example
   * ```ts
   * const result = await oauth.getRetouchToken(
   *   "user@example.com",
   *   accessToken,
   *   "device-id",
   *   "retouch4me_photoshop_panel",
   * );
   * ```
   * @remarks This method does not throw network/API errors; it returns `{ failed: true, data: ErrorType }`.
   */
  async getRetouchToken(
    email: string,
    session: string,
    deviceid: string,
    application: string,
  ): GetRetouchTokenReturnType {
    const methodName = "getRetouchToken";
    try {
      const body = new FormData();
      body.append("application", application);
      body.append("email", email);
      body.append("deviceid", deviceid);
      body.append("session", session);
      body.append("modes[]", "professional");

      const response = await fetch(this.getRetouchTokenLink, {
        method: "POST",
        mode: "cors",
        headers: {
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body,
      });

      if (response.ok) {
        const result: GetRetouchTokenDataType = await response.json();
        return { failed: false, data: result };
      }

      return this._generateError(
        { message: response.statusText, status: response.status },
        methodName,
      );
    } catch (error) {
      return this._catchError(error, methodName);
    }
  }

  /**
   * Retrieves an online registration key (or key status) for the current user/device pair.
   *
   * @param params - Input parameters used to construct the registration request.
   * @param params.email - User email.
   * @param params.programName - Application identifier used by backend APIs.
   * @param params.deviceId - Device identifier tied to the client machine.
   * @param params.installationId - Application installation identifier.
   * @param params.platform - Platform identifier (for example `win32`, `win10`, `darwin`).
   * @param params.session - Session/access token used by backend validation.
   * @param params.withkey - Whether to request key confirmation mode (`confirm=1`).
   * @param params.subscription - Whether to request subscription mode (`momentary=1`).
   * @param params.onLogout - Callback executed when request handling fails.
   * @returns A parsed object with backend error code/message and key usage fields.
   * @throws Error When HTTP response is not successful, response is empty/invalid, session is invalid,
   * or no keys are available.
   * @remarks
   * - `platform` is normalized internally (`win32`/`win10` -> `win`, `darwin` -> `mac`).
   * - On any failure path, `onLogout()` is called and the error is rethrown.
   */
  async getOnlineRegistrationKey({
    email,
    programName,
    deviceId,
    installationId,
    platform,
    session,
    withkey = false,
    subscription = false,
    onLogout = () => {},
  }: {
    email: string;
    programName: string;
    deviceId: string;
    installationId: string;
    platform: string;
    session: string;
    withkey?: boolean;
    subscription?: boolean;
    onLogout?: () => void;
  }) {
    // Определяем ОС через UXP
    if (platform === 'win32') platform = 'win';
    if (platform === 'win10') platform = 'win';
    else if (platform === 'darwin') platform = 'mac';

    // let url = 'https://retouch4.me/products/cloud-retouch/304';
    let url = 'https://3dlutcreator.com/getsubscriptionkey.php';
    const queryParams = [
      `email=${encodeURIComponent(email)}`,
      `application=${encodeURIComponent(programName)}`,
      `deviceid=${encodeURIComponent(deviceId)}`,
      `installationid=${encodeURIComponent(installationId)}`,
      `session=${encodeURIComponent(session)}`,
    ];

    if (platform) queryParams.push(`os=${platform}`);
    if (withkey) queryParams.push('confirm=1');
    if (subscription) queryParams.push('momentary=1');

    url += '?' + queryParams.join('&');

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `HTTP status: ${response.status} message: ${response.statusText}`,
        );
      }

      const text = await response.text();

      if (!text.trim()) {
        throw new Error('Server response is empty');
      }

      // Пытаемся распарсить JSON
      let json;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('JSON payload is missing in server response');
        }
        json = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      const result = {
        error: json.error,
        errorMsg: json.errormsg || '',
        key: json.key || '',
        keysleft: json.keysleft || 0,
        keylimit: json.keylimit || 0,
        keycount: json.keyscount || 0,
      };

      if (result.error === 'WEBAPIERROR_SESSION_INVALID') {
        throw new Error('Session is invalid');
      }
      const noKeysLeft = result.keysleft === 0 && !result.key;
      const keysLmit = result.keylimit === result.keycount && !result.key;
      if (noKeysLeft || keysLmit) {
        throw new Error('No keys left');
      }
      return result;
    } catch (error) {
      onLogout();
      throw error;
    }
  }

  /**
   * Obtains an access token without explicitly passing the user's email.
   *
   * @param session - Access token obtained from `getToken`.
   * @returns A promise resolving to backend response data or a normalized error object.
   * @remarks
   * - This endpoint path is considered less stable/experimental in current project usage.
   * - This method does not throw network/API errors; it returns `{ failed: true, data: ErrorType }`.
   */
  async getRetouchTokenWithoutEmail(session: string) {
    const methodName = "getRetouchTokenWithoutEmail";
    try {
      const response = await fetch(this.getRetouchTokenWithoutEmailLink, {
        headers: { Authorization: session },
      });

      if (response.ok) {
        const result = await response.json();

        return { failed: false, data: result };
      }

      return this._generateError(
        { message: response.statusText, status: response.status },
        methodName,
      );
    } catch (error) {
      return this._catchError(error, methodName);
    }
  }
}
