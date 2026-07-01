import type { ErrorType } from "./OAuthTypes";

const DEFAULT_FILE_NAME = "OAuthAPI";

/**
 * Typed error thrown by {@link OauthAPI} methods on API or network failures.
 */
export class OAuthAPIError extends Error {
  /** HTTP status code if available; `0` for non-HTTP/runtime errors. */
  readonly status: number;

  /** Name of the method where the error originated. */
  readonly methodName: string;

  /** Name of the source module/class where the error originated. */
  readonly fileName: string;

  constructor(data: ErrorType) {
    super(data.message);
    this.name = "OAuthAPIError";
    this.status = data.status;
    this.methodName = data.methodName;
    this.fileName =  DEFAULT_FILE_NAME;
  }

  /** `getToken` returned 404 — user has not finished authorization in the browser yet. */
  get isAuthPending(): boolean {
    return this.status === 404 && this.methodName === "getToken";
  }
}
