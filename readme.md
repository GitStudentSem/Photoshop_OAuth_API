# @relu-ps/oauth-api

Библиотека OAuth-авторизации для Photoshop-плагинов (UXP). Инкапсулирует взаимодействие с серверами Retouch4me: получение OAuth-токена, профиля пользователя, retouch-токена и онлайн-ключа регистрации.

## Установка

Пакет публикуется во внутренний Nexus-репозиторий. Настройте `.npmrc` (см. [PUBLISHING.md](./PUBLISHING.md)) и установите зависимость:

```bash
npm install @relu-ps/oauth-api
```

## Быстрый старт

```ts
import OauthAPI from "@relu-ps/oauth-api";

const oauth = new OauthAPI((type, error) => {
  console.error(error);
});

// 1. Сформировать ссылку для авторизации в браузере (PKCE)
const link = oauth.getLink(deviceId, codeVerifier, codeChallenge);

// 2. После того как пользователь авторизовался — получить токен
const tokenResult = await oauth.getToken(codeVerifier);
if (!tokenResult.failed) {
  const { access_token, token_type } = tokenResult.data;

  // 3. Загрузить профиль
  const profileResult = await oauth.getProfile(token_type, access_token);
  if (!profileResult.failed) {
    console.log(profileResult.data.mail, profileResult.data.name);
  }
}
```

Полный рабочий пример с polling, хранением сессии и UI — в [`examples/via_OAuth`](./examples/via_OAuth).

## API

### Конструктор

```ts
new OauthAPI(errorHandler: ErrorHandlerType)
```

`errorHandler` вызывается при ошибках внутри библиотеки. Все публичные методы (кроме `getOnlineRegistrationKey`) не бросают исключения, а возвращают `{ failed: true, data: ErrorType }`.

### Методы

| Метод | Описание |
| --- | --- |
| `getLink(deviceId, codeVerifier, codeChallenge)` | URL для открытия в браузере и старта OAuth (PKCE, client `retouch4me_photoshop_panel`) |
| `getToken(codeVerifier)` | Получение access token по code verifier |
| `getProfile(tokenType, token)` | Профиль пользователя по OAuth-токену |
| `getRetouchToken(email, session, deviceId, application)` | Retouch-токен и остаток ретушей |
| `getRetouchTokenWithoutEmail(session)` | Альтернативный способ получения токена без email |
| `getOnlineRegistrationKey(params)` | Онлайн-ключ регистрации / подписки |
| `setBaseUrl({ lutCreatorBaseUrl, retouch4meBaseUrl })` | Переключение на stage или другой хост |
| `setFullUrl(links)` | Полная замена всех endpoint URL |

### Окружения

По умолчанию используются production-адреса `retouch4.me` и `3dlutcreator.com`. Для stage:

```ts
oauth.setBaseUrl({
  retouch4meBaseUrl: "https://stage7.reludo.yatsyk.com",
  lutCreatorBaseUrl: "https://3dcom7.reludo.yatsyk.com",
});
```

### Типы

TypeScript-типы (`GetTokenDataType`, `GetProfileDataType`, `ErrorType` и др.) поставляются вместе с пакетом в `dist/OauthAPI.d.ts`.

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка (TypeScript → dist/)
npm run build

# Production-сборка с минификацией
npm run build:prod

# Генерация API-документации (TypeDoc → docs/)
npm run docs
```

### Структура проекта

```
src/
  OauthAPI.ts      # основной класс
  OAuthTypes.d.ts  # типы ответов и ошибок
dist/              # собранный пакет (публикуется в Nexus)
examples/
  via_OAuth/       # пример UXP-плагина
scripts/           # copy-types, minify
```

## Публикация

Инструкция по публикации в Nexus: [PUBLISHING.md](./PUBLISHING.md).

## Лицензия

Внутренний пакет Retouch4me.
