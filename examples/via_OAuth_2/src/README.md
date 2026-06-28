# via_OAuth_2 — OAuth + RSA license keys

Минимальный UXP-пример авторизации в стиле Vectorscope: OAuth PKCE + получение лицензионного ключа + RSA-верификация.

## Файлы

| Файл | Назначение |
|------|------------|
| `auth.ts` | OAuth flow, polling, получение и проверка ключа |
| `rsa.ts` | RSA-256 верификация лицензии (публичный ключ) |
| `UserStore.ts` | Состояние пользователя в localStorage |
| `appInfo.ts` | deviceId, installationId (`R4VS-…`), publicKey |
| `generateDeviceId.ts` | Стабильный deviceId по fingerprint машины |
| `index.ts` | UI wiring |

## Flow

1. `onAuth()` — PKCE + `getAuthLink()` + `shell.openExternal()`
2. `getToken()` — polling каждые 3s (404 = ждём)
3. `getProfile()` — `UserStore.login()`
4. `getLicenceKey()` — HMAC-сессия + `getOnlineRegistrationKey()`
5. `verifyLicenseKey()` — проверка ключа публичным RSA-ключом

## Важно

- `client_id` / `programName`: `retouch4me_vectorscope_panel` (как в vectorscope, не `retouch4me_photoshop_panel` из npm по умолчанию)
- Ссылка авторизации строится через `getAuthLink()`, т.к. npm-пакет использует другой client_id
- Генерация RSA-ключей и подпись лицензий: см. [`../rsa-keygen`](../rsa-keygen)
