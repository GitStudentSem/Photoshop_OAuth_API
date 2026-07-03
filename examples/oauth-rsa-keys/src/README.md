# oauth-rsa-keys — OAuth + RSA license keys

Минимальный UXP-пример авторизации в стиле Vectorscope: OAuth PKCE + получение лицензионного ключа + RSA-верификация.

## Быстрый onboarding (для своего приложения)

1. Сгенерируйте RSA-пару через `examples/rsa-keygen` (`generate`).
2. Встройте `publicKey` в клиент (`appInfo.ts`), а `privateKey` храните только на сервере.
3. В `generateDeviceId.ts` задайте **свои** имя папки и anchor-файла для метки `deviceId` (в примере — `Vectorscope` / `vectorscope_anchor.conf`, только для Vectorscope).
4. В клиенте сформируйте `installationId` в формате `<APP_PREFIX>-<deviceId>`.
5. Отправьте `email` + `installationId` на серверный endpoint выдачи лицензии.
6. На сервере подпишите данные приватным ключом (`sign`) и верните `licenseKey`.
7. В клиенте проверьте `licenseKey` публичным ключом (`verifyLicenseKey`).

`sign` — это серверная операция. Клиент UXP не должен иметь доступ к приватному ключу.

## Файлы

| Файл | Назначение |
|------|------------|
| `auth.ts` | OAuth flow, polling, получение и проверка ключа |
| `rsa.ts` | RSA-256 верификация лицензии (публичный ключ) |
| `UserStore.ts` | Состояние пользователя в localStorage |
| `appInfo.ts` | deviceId, installationId (`R4VS-…`), `productConfig` (prefix+salt), publicKey |
| `generateDeviceId.ts` | Стабильный `deviceId` (fingerprint + anchor-файл на диске); **имена папки/файла — под Vectorscope, для своего приложения менять вручную** |
| `index.ts` | UI wiring |

## Flow

1. `onAuth()` — PKCE + `getAuthLink()` + `shell.openExternal()`
2. `getToken()` — polling каждые 3s (404 = ждём)
3. `getProfile()` — `UserStore.login()`
4. `getLicenceKey()` — HMAC-сессия + `getOnlineRegistrationKey()` (на сервер уходит `email` + `installationId`)
5. `verifyLicenseKey()` — проверка ключа публичным RSA-ключом с `productConfig` (`installationIdPrefix` + `licenseHashSalt`)

Хеш: `SHA256(normalizedInstallationId + "|" + email + licenseHashSalt)`. Префикс и соль (`productConfig` в `appInfo.ts`) должны совпадать с серверной записью продукта (`keyprefix` / `keysalt`). Для Vectorscope соль пустая.

`getAuthLink()` в этом примере — локальная функция из `auth.ts`, а не метод npm-пакета.  
В `@relu-ps/oauth-api` есть метод `getLink()`, но он использует client_id по умолчанию (`retouch4me_photoshop_panel`).

## Что откуда берётся

| Что | Где создаётся | Где используется |
|------|----------------|------------------|
| `deviceId` | Клиент (`generateDeviceId`) | Основа для `installationId` |
| `installationId` | Клиент (`appInfo.ts`) | Передаётся на сервер для подписи |
| `privateKey` | Сервер / keygen-машина | Только `sign` (выдача лицензий) |
| `publicKey` | Копия из keygen | Клиентская `verifyLicenseKey` |
| `licenseKey` | Сервер (результат `sign`) | Клиентская верификация и активация |

## Anchor-файл для `deviceId` (`generateDeviceId.ts`)

`deviceId` не только из железа (hostname, CPU, память), но и из **временной метки**, которая при первом запуске пишется в файл и потом читается оттуда. Так метка стабильна между сессиями.

В `getTimeStamp()` захардкожены пути **только для Vectorscope**:

- папка: `Vectorscope` (в `C:/ProgramData/` на Windows или `~/Library/Application Support` на macOS);
- файл: `vectorscope_anchor.conf`.

Для другого приложения замените обе строки в `generateDeviceId.ts` на свои (например `Waveform` + `waveform_anchor.conf`). Это не параметры npm-пакета и не общие константы — настраивается один раз в коде вашего плагина. У разных продуктов должны быть **разные** папка и файл, иначе на одной машине возможен одинаковый `deviceId`.

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

## Типичные вопросы

- Нужен ли `installationId` для генерации RSA-пары?  
  Нет. RSA-пара создаётся отдельно (`generate`), без `installationId`.
- Где выполняется `sign`?  
  На сервере (или keygen-машине), где хранится приватный ключ.
- Что хранится в клиенте?  
  `publicKey`, `deviceId`, `installationId`, полученный `licenseKey`.

## Важно

- `client_id` / `programName`: `retouch4me_vectorscope_panel` (как в vectorscope, не `retouch4me_photoshop_panel` из npm по умолчанию)
- Ссылка авторизации строится через локальный `getAuthLink()` из `auth.ts`, т.к. `oauth.getLink()` из npm-пакета использует другой `client_id`
- Генерация RSA-ключей и подпись лицензий: см. [`../rsa-keygen`](../rsa-keygen)
