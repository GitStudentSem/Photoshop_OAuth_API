import type OauthAPI from "@relu-ps/oauth-api";

/**
 * OAuth static servers — server selection and URL mapping for credentials example.
 *
 * Mirrors ServerStore.ts + OauthAPI.setBaseUrl() from photoshop-panel.
 * Use buildOAuthLinks() → oauth.setFullUrl(links) when user picks a server.
 */

export const OAUTH_PATHS = {
  authorize: "/api/v1/authorize",
  redirect: "/api/v1/redirect",
  tokenByCodeVerifier: "/api/v1/tokenByCodeVerifier",
  profile: "/api/v1/profile",
  retouchToken: "/api/v1/auth/token",
  retouchTokenWithoutEmail: "/api/v1/tokens/retouch",
  loginViaEmailPassword: "/api/v1/auth/login",
} as const;

export type OAuthLinks = {
  authorizeLink: string;
  redirectLink: string;
  tokenByCodeVerifierLink: string;
  getProfileLink: string;
  getRetouchTokenLink: string;
  getRetouchTokenWithoutEmailLink: string;
  loginViaEmailPasswordLink: string;
};

export type StaticServerConfig = {
  id: string;
  displayName: string;
  retouchBaseUrl: string;
  retouch4meBaseUrl: string;
};

export type OAuthClient = Pick<OauthAPI, "setFullUrl">;

export const SELECTED_SERVER_ID_KEY = "selectedServerId";

export const STATIC_SERVERS: StaticServerConfig[] = [
  {
    id: "static_1",
    displayName: "Main",
    retouchBaseUrl: "https://retoucher.hz.labs.retouch4.me",
    retouch4meBaseUrl: "https://retouch4.me",
  },
  {
    id: "static_2",
    displayName: "World",
    retouchBaseUrl: "https://cf-retoucher.retouch4.me",
    retouch4meBaseUrl: "https://global.retouch4.me",
  },
  {
    id: "static_3",
    displayName: "Eastern EU & Central Asia",
    retouchBaseUrl: "https://retoucher.kz.retouch4.me",
    retouch4meBaseUrl: "https://ru.retouch4.me",
  },
  {
    id: "static_4",
    displayName: "Eastern EU 2",
    retouchBaseUrl: "https://ru-retoucher.retouch4.me",
    retouch4meBaseUrl: "https://ru.retouch4.me",
  },
];

export const DEFAULT_STATIC_SERVER_ID = "static_1";

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

export function buildOAuthLinks(server: StaticServerConfig): OAuthLinks {
  const retoucher = trimTrailingSlash(server.retouchBaseUrl);
  const retouch4me = trimTrailingSlash(server.retouch4meBaseUrl);

  return {
    authorizeLink: `${retouch4me}${OAUTH_PATHS.authorize}`,
    redirectLink: `${retouch4me}${OAUTH_PATHS.redirect}`,
    tokenByCodeVerifierLink: `${retouch4me}${OAUTH_PATHS.tokenByCodeVerifier}`,
    getProfileLink: `${retouch4me}${OAUTH_PATHS.profile}`,
    getRetouchTokenLink: `${retoucher}${OAUTH_PATHS.retouchToken}`,
    getRetouchTokenWithoutEmailLink: `${retouch4me}${OAUTH_PATHS.retouchTokenWithoutEmail}`,
    loginViaEmailPasswordLink: `${retoucher}${OAUTH_PATHS.loginViaEmailPassword}`,
  };
}

export function getStaticServer(serverId: string): StaticServerConfig {
  const server = STATIC_SERVERS.find((s) => s.id === serverId);
  if (!server) {
    throw new Error(
      `Unknown static server "${serverId}". Valid: ${STATIC_SERVERS.map((s) => s.id).join(", ")}`,
    );
  }
  return server;
}

export function applyOAuthLinks(
  oauth: OAuthClient,
  serverId: string,
): OAuthLinks {
  const server = getStaticServer(serverId);
  const links = buildOAuthLinks(server);
  oauth.setFullUrl(links);
  return links;
}

export function getSelectedServerId(): string {
  return (
    localStorage.getItem(SELECTED_SERVER_ID_KEY) ?? DEFAULT_STATIC_SERVER_ID
  );
}

export function setSelectedServerId(serverId: string): void {
  localStorage.setItem(SELECTED_SERVER_ID_KEY, serverId);
}

export function initServerSelect(
  oauth: OAuthClient,
  onServerChange?: () => void,
): void {
  const serverSelect = document.getElementById("server") as HTMLSelectElement | null;
  if (!serverSelect) {
    throw new Error("Server select element not found");
  }

  for (const server of STATIC_SERVERS) {
    const option = document.createElement("option");
    option.value = server.id;
    option.textContent = server.displayName;
    serverSelect.appendChild(option);
  }

  const selectedServerId = getSelectedServerId();
  serverSelect.value = selectedServerId;
  applyOAuthLinks(oauth, selectedServerId);

  serverSelect.addEventListener("change", () => {
    const serverId = serverSelect.value;
    setSelectedServerId(serverId);
    applyOAuthLinks(oauth, serverId);
    onServerChange?.();
  });
}
