import { OAuthAPIError } from "./OAuthAPIError";
import type {
  GetOnlineRegistrationKeyDataType,
  GetOnlineRegistrationKeyParamsType,
  GetOnlineRegistrationKeyReturnType,
  GetProfileDataType,
  GetProfileReturnType,
  GetRetouchTokenDataType,
  GetRetouchTokenReturnType,
  GetRetouchTokenWithoutEmailDataType,
  GetRetouchTokenWithoutEmailReturnType,
  GetTokenDataType,
  GetTokenReturnType,
  LoginViaEmailPasswordParamsType,
  LoginViaEmailPasswordDataType,
  LoginViaEmailPasswordReturnType,
} from "./OAuthTypes";

export { OAuthAPIError } from "./OAuthAPIError";
export type {
  ErrorType,
  GetOnlineRegistrationKeyDataType,
  GetOnlineRegistrationKeyParamsType,
  GetOnlineRegistrationKeyReturnType,
  GetProfileDataType,
  GetProfileReturnType,
  GetRetouchTokenDataType,
  GetRetouchTokenReturnType,
  GetRetouchTokenWithoutEmailDataType,
  GetRetouchTokenWithoutEmailReturnType,
  GetTokenDataType,
  GetTokenReturnType,
  LoginViaEmailPasswordParamsType,
  LoginViaEmailPasswordDataType,
  LoginViaEmailPasswordReturnType,
} from "./OAuthTypes";

/**
 * Complete list of OAuth endpoint links used by {@link OauthAPI}.
 */
export interface OauthLinksType {
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

  /** Link for login via email and password. */
  loginViaEmailPasswordLink: string;
}
// https://retoucher.kz.retouch4.me/api/v1/auth/token
const pages = {
  authorize: "/api/v1/authorize",
  redirect: "/api/v1/redirect",
  tokenByCodeVerifier: "/api/v1/tokenByCodeVerifier",
  profile: "/api/v1/profile",
  lutgetretouchtoken: "/api/v1/auth/token",
  retouch: "/api/v1/tokens/retouch",
  loginViaEmailPassword: "/api/v1/auth/login",
};

/**
 * OAuth API client for Retouch4me services.
 *
 * Provides methods to build OAuth links, exchange tokens, fetch user profile,
 * authorize via email/password, and request registration keys.
 */
export default class OauthAPI {
  /**
   * Links to access all authorization methods.
   *
   */

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

  /** Link for login via email and password. */
  loginViaEmailPasswordLink: string;

  /**
   * Creates a new OauthAPI instance with default production endpoints.
   *
   * @remarks The constructor initializes all endpoint URLs and stores them as mutable instance state.
   * Use `setBaseUrl` or `setFullUrl` to override defaults for staging or custom environments.
   */
  constructor() {
    this.authorizeLink = `https://retouch4.me${pages.authorize}`;
    this.redirectLink = `https://retouch4.me${pages.redirect}`;
    this.tokenByCodeVerifierLink = `https://retouch4.me${pages.tokenByCodeVerifier}`;
    this.getProfileLink = `https://retouch4.me${pages.profile}`;
    this.getRetouchTokenLink = `https://retoucher.hz.labs.retouch4.me${pages.lutgetretouchtoken}`;
    this.getRetouchTokenWithoutEmailLink = `https://retouch4.me${pages.retouch}`;
    this.loginViaEmailPasswordLink = `https://retoucher.hz.labs.retouch4.me${pages.loginViaEmailPassword}`;
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
    this.loginViaEmailPasswordLink = links.loginViaEmailPasswordLink;
  }

  /**
   * Rebuilds endpoint URLs from base domains for Retouch4me and LUT Creator services.
   *
   * @param baseUrls - Base URLs used to compose all known endpoint paths.
   * @param baseUrls.lutCreatorBaseUrl - Base URL for LUT Creator-related endpoints.
   * @param baseUrls.retouch4meBaseUrl - Base URL for Retouch4me OAuth endpoints.
   * @param baseUrls.loginViaEmailPasswordLink - Base URL for login via email and password endpoint.
   * @returns `void`.
   * @remarks This method mutates instance URL state and affects all subsequent API calls made by this instance.
   */
  setBaseUrl(baseUrls: {
    lutCreatorBaseUrl: string;
    retouch4meBaseUrl: string;
    loginViaEmailPasswordLink: string;
  }) {
    this.authorizeLink = `${baseUrls.retouch4meBaseUrl}${pages.authorize}`;
    this.redirectLink = `${baseUrls.retouch4meBaseUrl}${pages.redirect}`;
    this.tokenByCodeVerifierLink = `${baseUrls.retouch4meBaseUrl}${pages.tokenByCodeVerifier}`;
    this.getProfileLink = `${baseUrls.retouch4meBaseUrl}${pages.profile}`;
    this.getRetouchTokenLink = `${baseUrls.lutCreatorBaseUrl}${pages.lutgetretouchtoken}`;
    this.getRetouchTokenWithoutEmailLink = `${baseUrls.retouch4meBaseUrl}${pages.retouch}`;
    this.loginViaEmailPasswordLink = `${baseUrls.loginViaEmailPasswordLink}${pages.loginViaEmailPassword}`;
  }

  /**
   * Generates an OAuth authorization link for browser login flow.
   *
   * @param  deviceid - Hardware identifier, must be tied to the computer.
   * @param  codeVerifier - Calculated value,
   * @param  codeChallenge - Computed value,
   * @returns Authorization URL that should be opened by a user to start OAuth flow.
   * @example
   * ```ts
   * const oauth = new OauthAPI();
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
   * @returns A promise resolving to token data.
   * @example
   * ```ts
   * const token = await oauth.getToken(codeVerifier);
   * console.log(token.access_token);
   * ```
   * @throws {@link OAuthAPIError} On HTTP or network failures. Use {@link OAuthAPIError.isAuthPending}
   * to detect OAuth polling state (`404` from `getToken`).
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
        return result;
      }

      throw new OAuthAPIError({
        message: response.statusText,
        status: response.status,
        methodName,
      });
    } catch (error) {
      if (error instanceof OAuthAPIError) {
        throw error;
      }
      throw new OAuthAPIError({
        message: error instanceof Error ? error.message : "unknown catch error",
        status: 0,
        methodName,
      });
    }
  }

  /**
   * Fetches user profile data using an OAuth token.
   *
   * @param tokenType - Token type returned by `getToken` (for example `Bearer`).
   * @param token - Access token returned by `getToken`.
   * @returns A promise resolving to profile data.
   * @example
   * ```ts
   * const token = await oauth.getToken(codeVerifier);
   * const profile = await oauth.getProfile(token.token_type, token.access_token);
   * ```
   * @throws {@link OAuthAPIError} On HTTP or network failures.
   */
  async getProfile(tokenType: string, token: string): GetProfileReturnType {
    const methodName = "getProfile";
    try {
      const response = await fetch(this.getProfileLink, {
        headers: { Authorization: `${tokenType} ${token}` },
      });

      if (response.ok) {
        const result: GetProfileDataType = await response.json();
        return result;
      }

      throw new OAuthAPIError({
        message: response.statusText,
        status: response.status,
        methodName,
      });
    } catch (error) {
      if (error instanceof OAuthAPIError) {
        throw error;
      }
      throw new OAuthAPIError({
        message: error instanceof Error ? error.message : "unknown catch error",
        status: 0,
        methodName,
      });
    }
  }

  /**
   * Requests a retouch token using user profile, session, and device metadata.
   *
   * @param email - User email obtained from `getProfile`.
   * @param session - `access_token` value obtained from `getToken`.
   * @param deviceid - Hardware identifier tied to the client computer.
   * @param application - Client application identifier (for example `retouch4me_photoshop_panel`).
   * @returns A promise resolving to retouch token data.
   * @example
   * ```ts
   * const result = await oauth.getRetouchToken(
   *   "user@example.com",
   *   accessToken,
   *   "device-id",
   *   "retouch4me_photoshop_panel",
   * );
   * ```
   * @throws {@link OAuthAPIError} On HTTP or network failures.
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
        return result;
      }

      throw new OAuthAPIError({
        message: response.statusText,
        status: response.status,
        methodName,
      });
    } catch (error) {
      if (error instanceof OAuthAPIError) {
        throw error;
      }
      throw new OAuthAPIError({
        message: error instanceof Error ? error.message : "unknown catch error",
        status: 0,
        methodName,
      });
    }
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param params - Login credentials and client metadata.
   * @param params.email - User email address.
   * @param params.password - User password.
   * @param params.deviceid - Hardware identifier tied to the client computer.
   * @param params.application - Client application identifier.
   * @returns A promise resolving to session data.
   * @throws {@link OAuthAPIError} On HTTP or network failures.
   */
  async loginViaEmailPassword({
    email,
    password,
    deviceid,
    application,
  }: LoginViaEmailPasswordParamsType): LoginViaEmailPasswordReturnType {
    const methodName = "loginViaEmailPassword";
    try {
      const formdata = new FormData();
      formdata.append("version", "1");
      formdata.append("application", application);
      formdata.append("desktop", "1");
      formdata.append("email", email);
      formdata.append("json", "1");
      formdata.append("password", password);
      formdata.append("deviceid", deviceid);

      const response = await fetch(this.loginViaEmailPasswordLink, {
        method: "POST",
        body: formdata,
      });

      if (response.ok) {
        const result: LoginViaEmailPasswordDataType = await response.json();
        if (!result.loggedin) {
          throw new OAuthAPIError({
            message: "Login via email password failed",
            status: 0,
            methodName,
          });
        }
        return result;
      }

      throw new OAuthAPIError({
        message: response.statusText,
        status: response.status,
        methodName,
      });
    } catch (error) {
      if (error instanceof OAuthAPIError) {
        throw error;
      }
      throw new OAuthAPIError({
        message: error instanceof Error ? error.message : "unknown catch error",
        status: 0,
        methodName,
      });
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
   * @throws {@link OAuthAPIError} When HTTP response is not successful, response is empty/invalid, session is invalid,
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
  }: GetOnlineRegistrationKeyParamsType): GetOnlineRegistrationKeyReturnType {
    const methodName = "getOnlineRegistrationKey";

    // Определяем ОС через UXP
    if (platform === "win32") platform = "win";
    if (platform === "win10") platform = "win";
    else if (platform === "darwin") platform = "mac";

    // let url = 'https://retouch4.me/products/cloud-retouch/304';
    let url = "https://3dlutcreator.com/getsubscriptionkey.php";
    const queryParams = [
      `email=${encodeURIComponent(email)}`,
      `application=${encodeURIComponent(programName)}`,
      `deviceid=${encodeURIComponent(deviceId)}`,
      `installationid=${encodeURIComponent(installationId)}`,
      `session=${encodeURIComponent(session)}`,
    ];

    if (platform) queryParams.push(`os=${platform}`);
    if (withkey) queryParams.push("confirm=1");
    if (subscription) queryParams.push("momentary=1");

    url += "?" + queryParams.join("&");

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new OAuthAPIError({
          message: response.statusText,
          status: response.status,
          methodName,
        });
      }

      const text = await response.text();

      if (!text.trim()) {
        throw new OAuthAPIError({
          message: "Server response is empty",
          status: 0,
          methodName,
        });
      }

      // Пытаемся распарсить JSON
      let result: GetOnlineRegistrationKeyDataType;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new OAuthAPIError({
            message: "JSON payload is missing in server response",
            status: 0,
            methodName,
          });
        }
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        if (e instanceof OAuthAPIError) {
          throw e;
        }
        throw new OAuthAPIError({
          message: "Failed to parse server response",
          status: 0,
          methodName,
        });
      }

      if (result.error === "WEBAPIERROR_SESSION_INVALID") {
        throw new OAuthAPIError({
          message: "Session is invalid",
          status: 0,
          methodName,
        });
      }
      const noKeysLeft = result.keysleft === 0 && !result.key;
      const keysLmit = result.keylimit === result.keyscount && !result.key;
      if (noKeysLeft || keysLmit) {
        throw new OAuthAPIError({
          message: "No keys left",
          status: 0,
          methodName,
        });
      }
      return result;
    } catch (error) {
      onLogout();
      if (error instanceof OAuthAPIError) {
        throw error;
      }
      throw new OAuthAPIError({
        message: error instanceof Error ? error.message : "unknown catch error",
        status: 0,
        methodName,
      });
    }
  }

  /**
   * Obtains an access token without explicitly passing the user's email.
   *
   * @param session - Access token obtained from `getToken`.
   * @returns A promise resolving to backend response data.
   * @remarks
   * - This endpoint path is considered less stable/experimental in current project usage.
   * @throws {@link OAuthAPIError} On HTTP or network failures.
   */
  async getRetouchTokenWithoutEmail(
    session: string,
  ): GetRetouchTokenWithoutEmailReturnType {
    const methodName = "getRetouchTokenWithoutEmail";
    try {
      const response = await fetch(this.getRetouchTokenWithoutEmailLink, {
        headers: { Authorization: session },
      });

      if (response.ok) {
        const result: GetRetouchTokenWithoutEmailDataType =
          await response.json();

        return result;
      }

      throw new OAuthAPIError({
        message: response.statusText,
        status: response.status,
        methodName,
      });
    } catch (error) {
      if (error instanceof OAuthAPIError) {
        throw error;
      }
      throw new OAuthAPIError({
        message: error instanceof Error ? error.message : "unknown catch error",
        status: 0,
        methodName,
      });
    }
  }
}
