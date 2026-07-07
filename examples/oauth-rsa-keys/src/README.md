# oauth-rsa-keys — OAuth + RSA license keys

Минимальный UXP-пример авторизации в стиле Vectorscope: OAuth PKCE + получение лицензионного ключа + RSA-верификация.

> **Интеграция через нейросеть / без опыта в коде:** см. **[INTEGRATION_CHECKLIST.md](../INTEGRATION_CHECKLIST.md)** — чеклист, промпт для AI, отладка логов `[LICENSE]`.

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

1. `onAuth()` — PKCE + `getLink()` + `shell.openExternal()`
2. `getToken()` — polling каждые 3s (404 = ждём)
3. `getProfile()` — `UserStore.login()`
4. `getLicenceKey()` — HMAC-сессия + `getOnlineRegistrationKey()` (на сервер уходит `email` + `installationId`)
5. `verifyLicenseKey()` — проверка ключа публичным RSA-ключом с `productConfig` (`installationIdPrefix` + `licenseHashSalt`)

Хеш: `SHA256(normalizedInstallationId + "|" + email + licenseHashSalt)`. Префикс и соль (`productConfig` в `appInfo.ts`) должны совпадать с серверной записью продукта (`keyprefix` / `keysalt`).

## Продукты Retouch4me

Пресеты из [`../../rsa-keygen/src/lib/products.ts`](../../rsa-keygen/src/lib/products.ts):

| Ключ (`--product`) | `client_id` (OAuth) | keyprefix | keysalt | Payload для hash (пример) |
| --- | --- | --- | --- | --- |
| `vectorscope` | `retouch4me_vectorscope_panel` | `R4VS` | `''` (пусто) | `ABCD-1234-XYZZY\|user@example.com` |
| `waveform` | `retouch4me_waveform_panel` | `R4WF` | `waveform` | `GPIE-6439-SHITG\|user@example.comwaveform` |
| `wbcompass` | `retouch4me_wbcompass_panel` | `R4WBC` | `wbcompass` | `GPIE-6439-SHITG\|user@example.comwbcompass` |

Подпись на сервере:

```bash
cd examples/rsa-keygen
npm run keygen -- sign user@example.com R4WF-GPIE-6439-SHITG --product waveform
```

На клиенте — те же `installationIdPrefix` и `licenseHashSalt` в `productConfig` (`appInfo.ts`). RSA-пара может быть общей для всех продуктов.

`getLink()` требует `application` (client_id) четвёртым аргументом — в примере это `applicationName` из `src/applicationName.ts`.

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

В `getTimeStamp()` захардкожены пути **только для Vectorscope** (для других продуктов — см. таблицу в корневом README):

| Продукт | Папка | Файл метки |
|---------|-------|------------|
| Vectorscope | `Vectorscope` | `vectorscope_anchor.conf` |
| Waveform | `Waveform` | `waveform_anchor.conf` |
| WB Compass | `WBCompass` | `wbcompass_anchor.conf` |

Пути на диске: `C:/ProgramData/` (Windows) или `~/Library/Application Support` (macOS).

Для другого приложения замените обе строки в `generateDeviceId.ts` на значения из таблицы выше.

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
- Куда смотреть, если «недействительная подпись»?  
  [INTEGRATION_CHECKLIST.md](../INTEGRATION_CHECKLIST.md) — раздел «Отладка» и таблица «7 мест в коде».
- Какой код брать за основу?  
  Файлы в этой папке (`auth.ts`, `rsa.ts`, `appInfo.ts`, `generateDeviceId.ts`) — эталон для переноса в свой плагин.

## Важно

- `applicationName` в `src/applicationName.ts` — единый `client_id` / `programName` для `getLink`, `getOnlineRegistrationKey` и других методов
- Ссылка авторизации строится через `oauth.getLink(..., applicationName)`
- Генерация RSA-ключей и подпись лицензий: см. [`../rsa-keygen`](../rsa-keygen)
