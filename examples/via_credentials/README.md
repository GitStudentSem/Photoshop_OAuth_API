# via_credentials — пример UXP-плагина

Минимальный Photoshop-плагин (UXP + TypeScript + Webpack), демонстрирующий авторизацию по email и паролю через `@relu-ps/oauth-api`: вход, сохранение сессии и получение retouch-токена.

## Что делает пример

1. Пользователь вводит email и пароль в поля панели.
2. По кнопке **Login** вызывается `loginViaEmailPassword` с `deviceId` и именем приложения.
3. При успешном ответе сохраняется `authSession` и данные пользователя в `UserStore`.
4. Запрашивается retouch-токен (`getRetouchToken`) с HMAC-сессией на основе `authSession`.
5. В панели отображаются email, имя и остаток ретушей. Кнопка **Logout** сбрасывает сессию.
6. Выпадающий список **Server** переключает production-окружение (см. раздел «Выбор сервера»).

## Подключение библиотеки

В `package.json` пакет подключён локально — так же, как у потребителей после публикации в Nexus, только через `file:`:

```json
"@relu-ps/oauth-api": "file:../.."
```

Перед сборкой example автоматически пересобирается корневая библиотека (`prebuild` / `predev`). Если меняете API в корне, достаточно запустить `npm run build` или `npm run dev` в этой папке.

```ts
import OauthAPI from "@relu-ps/oauth-api";
```

URL эндпоинтов по умолчанию заданы в библиотеке. В этом примере они переопределяются через общий модуль `examples/shared/oauthStaticServers.ts`.

## Выбор сервера

Логика серверов вынесена в `examples/shared/` и подключается относительным импортом:

```ts
import { initServerSelect } from "../../shared/oauthStaticServers";
```

При сборке webpack встраивает этот файл в `dist/index.js` — отдельный скрипт в manifest не нужен.

**Нюансы:**

- Репозиторий нужно копировать целиком: путь `../../shared/` валиден только при структуре `examples/via_credentials/` + `examples/shared/`.
- Если выносите один пример отдельно — скопируйте `examples/shared/` рядом или перенесите `oauthStaticServers.ts` в `src/` примера.
- Выбор сервера хранится в `localStorage` (`selectedServerId`) и общий для всех `via_*` примеров.
- При смене сервера активная сессия сбрасывается — токены привязаны к конкретному окружению.

## Структура

```
examples/
  shared/
    oauthStaticServers.ts   # список серверов, applyOAuthLinks, initServerSelect
via_credentials/
  manifest.json     # манифест UXP-плагина
  index.html        # UI панели (Spectrum Web Components)
  src/
    index.ts        # login/password flow, обработчики кнопок
    UserStore.ts    # хранение сессии в localStorage
  dist/
    index.js        # бандл webpack (создаётся при сборке)
```

## Сборка

```bash
cd examples/via_credentials
npm install
npm run build
```

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
5. Переключитесь в Photoshop — панель **Login via credentials** появится в меню плагинов.

## Credentials-flow в коде

Основная логика — в `src/index.ts`:

- `loginViaEmailPassword()` — вход по email и паролю, сохранение `authSession`.
- `getRetouchToken()` — запрос retouch-токена с HMAC-сессией от `authSession`.
- `generateRetouchSession()` — HMAC-SHA512(session + `"retouchtoken"`).

`UserStore` (`src/UserStore.ts`) хранит `isAuth`, email, имя и остаток ретушей в `localStorage`.

## Зависимости

| Пакет | Назначение |
| --- | --- |
| `@relu-ps/oauth-api` | OAuth / auth API Retouch4me |
| `crypto-js` | HMAC для retouch-сессии |

## Требования

- Adobe Photoshop 23.0.0+ (см. `manifest.json`)
- Node.js для сборки
