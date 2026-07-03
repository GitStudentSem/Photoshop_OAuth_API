# oauth-rsa-keys — пример UXP-плагина

Минимальный Photoshop-плагин (UXP + TypeScript + Webpack), демонстрирующий OAuth-flow с проверкой RSA-лицензии через `@relu-ps/oauth-api`: авторизация в браузере, polling токена, загрузка профиля и получение license key.

## Для кого этот пример

Используйте этот пример, если в вашем плагине лицензия привязывается к установке и проверяется локально по RSA-подписи.

## Что делает пример

1. По кнопке **Authorize** генерируются `deviceId`, PKCE-пара (`codeVerifier` / `codeChallenge`) и ссылка авторизации.
2. Ссылка открывается во внешнем браузере через `shell.openExternal`.
3. Плагин опрашивает `getToken` каждые 3 секунды (до 20 попыток), пока пользователь не завершит вход.
4. После получения токена загружается профиль (`getProfile`) и retouch-токен (`getRetouchToken`).
5. В панели отображаются email, имя и статус license key. Кнопка **Logout** сбрасывает сессию.
6. Выпадающий список **Server** переключает production-окружение (см. раздел «Выбор сервера»).

## Подключение библиотеки

В `package.json` пакет подключён локально — так же, как у потребителей после публикации в Nexus, только через `file:`:

```json
"@relu-ps/oauth-api": "file:../.."
```

Перед сборкой example автоматически пересобирается корневая библиотека (`prebuild` / `predev`). Если меняете `src/OauthAPI.ts` в корне, достаточно запустить `npm run build` или `npm run dev` в этой папке.

```ts
import OauthAPI from "@relu-ps/oauth-api";
```

URL эндпоинтов переопределяются через `examples/shared/oauthStaticServers.ts`.

## Выбор сервера

```ts
import { initServerSelect } from "../../shared/oauthStaticServers";

// До validateSavedSession() и любых запросов:
initServerSelect(oauth, () => {
  if (UserStore.isAuth) UserStore.logout();
});
```

**Нюансы:** те же, что в `oauth-browser` — нужна папка `examples/shared/`, общий `selectedServerId` в localStorage, сброс сессии при смене сервера. Подробнее: `examples/shared/README.md`.

## Структура

```
examples/
  shared/
    oauthStaticServers.ts
oauth-rsa-keys/
  manifest.json
  index.html
  src/
    index.ts        # UI, initServerSelect, validateSavedSession
    auth.ts         # OAuth-flow, oauth instance
    UserStore.ts
    rsa.ts          # проверка license key
  dist/
    index.js
```

## Сборка

```bash
cd examples/oauth-rsa-keys
npm install
npm run build
```

Быстрый smoke-check после сборки: убедитесь, что появился файл `dist/index.js`.

Для разработки с автопересборкой:

```bash
npm run dev
```

Скрипт `build` запускает webpack и собирает `dist/index.js` из `src/index.ts`.

## Загрузка в Photoshop

1. Установите [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/).
2. Откройте Developer Tool → **Add Plugin...**
3. Укажите `manifest.json` из этой папки.
4. Нажмите **•••** → **Load** напротив плагина.
5. Переключитесь в Photoshop — панель **oauth-rsa-keys** появится в меню плагинов.

## OAuth-flow в коде

Основная логика — в `src/auth.ts` и `src/index.ts`:

- `onAuth()` — старт авторизации (генерация PKCE, открытие браузера).
- `getToken()` — polling `oauth.getToken()` до успеха или таймаута.
- `getProfile()` — сохранение пользователя в `UserStore`.
- `validateSavedSession()` — проверка RSA license key при старте.

`UserStore` (`src/UserStore.ts`) хранит `isAuth`, email, имя и license key в `localStorage`.

## Что заменить под свой проект

- `productConfig` в `src/appInfo.ts` — `installationIdPrefix` (серверный `keyprefix`) и `licenseHashSalt` (серверный `keysalt`). Для Vectorscope: `R4VS` + `''`, для Waveform: `R4WF` + `waveform`.
- `publicKey` в `src/appInfo.ts` (встройте ваш публичный ключ).
- `client_id` / `programName` в OAuth-части.
- Серверный endpoint выдачи лицензии (куда клиент отправляет `email + installationId`).
- **Пути хранения anchor-метки для `deviceId`** в `src/generateDeviceId.ts` (функция `getTimeStamp`) — см. ниже.

Соль и префикс должны совпадать с серверной записью продукта — иначе `verifyLicenseKey` вернёт `false`.

### Пути anchor-файла (`generateDeviceId.ts`)

Стабильный `deviceId` строится из fingerprint машины и **временной метки**, которая один раз записывается в файл на диске. В примере для Vectorscope зашиты **имена папки и файла** — это не общие константы для всех Retouch4me-приложений.

В `getTimeStamp()` нужно вручную заменить под своё приложение:

| Что | В примере (Vectorscope) | Для своего приложения |
|-----|-------------------------|------------------------|
| Папка в `ProgramData` / `Application Support` | `Vectorscope` | уникальное имя продукта, напр. `Waveform`, `MyPanel` |
| Файл метки | `vectorscope_anchor.conf` | свой файл, напр. `waveform_anchor.conf` |

```typescript
// generateDeviceId.ts — getTimeStamp()
vectorsopeFolder = await commonFolder.getEntry('Vectorscope');
// ...
stampFile = await vectorsopeFolder.getEntry('vectorscope_anchor.conf');
```

Для другого продукта замените обе строки на свои значения. Параметры CLI/конфига для этого не предусмотрены: задаётся один раз при форке примера. Разные приложения **не должны** делить одну папку и один anchor-файл — иначе `deviceId` может совпасть между продуктами на одной машине.

Подробнее: [`src/README.md`](./src/README.md).

## Формула лицензии

```
hash = SHA256(normalizedInstallationId + "|" + email + licenseHashSalt)
```

- `normalizedInstallationId` — `installationId` без префикса `<installationIdPrefix>-`.
- Соль приклеивается к `email` без разделителя `|` (для Vectorscope соль пустая).
- Подпись/проверка — RSA-256 (`hash^d mod n` / `hash^e mod n`), кодирование — Base41 (Niobium).

Детали генерации ключей и подписи: [`../rsa-keygen/README.md`](../rsa-keygen/README.md).

## Важный момент про безопасность

- Приватный ключ находится только на сервере (или keygen-машине).
- Клиент получает только `licenseKey` и проверяет его публичным ключом.
- Если приватный ключ попадёт в клиент, схема RSA-лицензирования теряет смысл.

## Зависимости

| Пакет | Назначение |
| --- | --- |
| `@relu-ps/oauth-api` | OAuth API Retouch4me |
| `crypto-js` | PKCE (`codeVerifier` / `codeChallenge`) и HMAC для retouch-сессии |

## Требования

- Adobe Photoshop 23.0.0+ (см. `manifest.json`)
- Node.js для сборки
