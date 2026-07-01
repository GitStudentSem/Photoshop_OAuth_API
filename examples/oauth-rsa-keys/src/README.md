# oauth-rsa-keys — OAuth + RSA license keys

Минимальный UXP-пример авторизации в стиле Vectorscope: OAuth PKCE + получение лицензионного ключа + RSA-верификация.

## Быстрый onboarding (для своего приложения)

1. Сгенерируйте RSA-пару через `examples/rsa-keygen` (`generate`).
2. Встройте `publicKey` в клиент (`appInfo.ts`), а `privateKey` храните только на сервере.
3. В клиенте сформируйте `installationId` в формате `<APP_PREFIX>-<deviceId>`.
4. Отправьте `email` + `installationId` на серверный endpoint выдачи лицензии.
5. На сервере подпишите данные приватным ключом (`sign`) и верните `licenseKey`.
6. В клиенте проверьте `licenseKey` публичным ключом (`verifyLicenseKey`).

`sign` — это серверная операция. Клиент UXP не должен иметь доступ к приватному ключу.

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
4. `getLicenceKey()` — HMAC-сессия + `getOnlineRegistrationKey()` (на сервер уходит `email` + `installationId`)
5. `verifyLicenseKey()` — проверка ключа публичным RSA-ключом

## Что откуда берётся

| Что | Где создаётся | Где используется |
|------|----------------|------------------|
| `deviceId` | Клиент (`generateDeviceId`) | Основа для `installationId` |
| `installationId` | Клиент (`appInfo.ts`) | Передаётся на сервер для подписи |
| `privateKey` | Сервер / keygen-машина | Только `sign` (выдача лицензий) |
| `publicKey` | Копия из keygen | Клиентская `verifyLicenseKey` |
| `licenseKey` | Сервер (результат `sign`) | Клиентская верификация и активация |

## Минимальный API контракт (клиент ↔ сервер)

Пример запроса на выдачу лицензии:

```json
POST /api/license/sign
{
  "email": "user@example.com",
  "installationId": "MYAPP-ABCD-1234"
}
```

Пример ответа:

```json
{
  "licenseKey": "<BASE41_KEY>"
}
```

Детали генерации RSA-ключей и CLI-команды: [`../../rsa-keygen/README.md`](../../rsa-keygen/README.md)

## Важно

- `client_id` / `programName`: `retouch4me_vectorscope_panel` (как в vectorscope, не `retouch4me_photoshop_panel` из npm по умолчанию)
- Ссылка авторизации строится через `getAuthLink()`, т.к. npm-пакет использует другой client_id
- Генерация RSA-ключей и подпись лицензий: см. [`../rsa-keygen`](../rsa-keygen)
