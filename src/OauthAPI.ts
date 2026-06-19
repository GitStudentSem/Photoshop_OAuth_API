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

export default class OauthAPI {
  /**
   * Links to access all authorization methods.
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

  /** Link for login via email and password. */
  loginViaEmailPasswordLink: string;

  /** filename for logger function */
  fileName: "OAuthAPI";

  constructor(
    /** The error logging function. */
    errorHandler: ErrorHandlerType,
  ) {
    this.errorHandler = errorHandler;
    this.authorizeLink = `https://retouch4.me${pages.authorize}`;
    this.redirectLink = `https://retouch4.me${pages.redirect}`;
    this.tokenByCodeVerifierLink = `https://retouch4.me${pages.tokenByCodeVerifier}`;
    this.getProfileLink = `https://retouch4.me${pages.profile}`;
    this.getRetouchTokenLink = `https://retoucher.hz.labs.retouch4.me"${pages.lutgetretouchtoken}`;
    this.getRetouchTokenWithoutEmailLink = `https://retouch4.me${pages.retouch}`;
    this.loginViaEmailPasswordLink = `https://retouch4.me${pages.loginViaEmailPassword}`;
    this.fileName = "OAuthAPI";
  }

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
   * @method getLink
   * @description Generating a link for authorization, the user will follow this link.
   * @param  deviceid - Hardware identifier, must be tied to the computer.
   * @param  codeVerifier - Calculated value,
   * @param  codeChallenge - Computed value,
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
   * Obtaining an access token
   * @param codeVerifier - Calculated value
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
   * Get user data
   * @param  tokenType - The token type obtained from getToken().
   * @param  token - The access token obtained from getToken().
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
   * Receiving a token for retouching
   * @param  email - User email obtained from getProfile().
   * @param  session - access_token obtained from getToken
   * @param  deviceid - Hardware identifier, must be tied to the computer.
   * @param  application - Application name for examle - retouch4me_photoshop_panel.
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

      console.log(methodName, this.getRetouchTokenLink);
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
      console.error(error);
      return this._catchError(error, methodName);
    }
  }

  async loginViaEmailPassword({
    email,
    password,
    deviceid,
    application,
  }: {
    email: string;
    password: string;
    deviceid: string;
    application: string;
  }) {
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

      console.log(methodName, this.loginViaEmailPasswordLink);
      const response = await fetch(this.loginViaEmailPasswordLink, {
        method: "POST",
        body: formdata,
      });

      if (response.ok) {
        const result: {
          /** уровень доступа **/
          result: number;
          /** строка с сессией пользователя **/
          session: string;
          /** ? **/
          gateway: number;
          /** 1 - пользователь авторизован
           *
           * 0 - пользователь не авторизован
           * **/
          loggedin: boolean;
          mail: string;
          firstname: string;
          lastname: string;
          /** возможные значения:
           * true - не заполнено имя или фамилия
           * false - данные пользователя заполнены
           * **/
          askname: boolean;
          /** ввозможные значения:
           * 1 - показывать пользователю ретушь
           * 0 - не показывать пользователю ретушь
           * **/
          retouching: number;
        } = await response.json();
        console.log(methodName, "result", result);
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
   * Obtaining an access token without using the user's email
   * P.S. I didn't use this method, it wasn't ready yet
   * @param {string} session - the access_token obtained from getToken.
   */
  async getRetouchTokenWithoutEmail(session: string) {
    const methodName = "getRetouchTokenWithEmail";
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
