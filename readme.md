# @relu-ps/oauth-api

Библиотека OAuth-авторизации для Photoshop-плагинов (UXP). Инкапсулирует взаимодействие с серверами Retouch4me: получение OAuth-токена, профиля пользователя, retouch-токена и онлайн-ключа регистрации.

## Установка

Пакет публикуется во внутренний Nexus-репозиторий. Настройте `.npmrc` (см. [PUBLISHING.md](./PUBLISHING.md)) и установите зависимость:

```bash
npm install @relu-ps/oauth-api
```

## Быстрый старт

```ts
import OauthAPI, { OAuthAPIError } from "@relu-ps/oauth-api";

const oauth = new OauthAPI();

// 1. Сформировать ссылку для авторизации в браузере (PKCE)
const link = oauth.getLink(deviceId, codeVerifier, codeChallenge);

try {
  // 2. После того как пользователь авторизовался — получить токен
  const token = await oauth.getToken(codeVerifier);
  const { access_token, token_type } = token;

  // 3. Загрузить профиль
  const profile = await oauth.getProfile(token_type, access_token);
  console.log(profile.mail, profile.name);
} catch (error) {
  if (error instanceof OAuthAPIError && error.isAuthPending) {
    // пользователь ещё не завершил авторизацию в браузере
    return;
  }
  console.error(error);
}
```

Полный рабочий пример с polling, хранением сессии и UI — в [`examples/oauth-browser`](./examples/oauth-browser).

## API

### Конструктор

```ts
new OauthAPI()
```

Создаёт экземпляр с production endpoint URL. Ошибки API не логируются внутри библиотеки — публичные методы бросают `OAuthAPIError`, обработку и логирование выполняет вызывающий код.

### Ошибки

```ts
import { OAuthAPIError } from "@relu-ps/oauth-api";

try {
  await oauth.getToken(codeVerifier);
} catch (error) {
  if (error instanceof OAuthAPIError) {
    console.error(error.status, error.methodName, error.message);
  }
}
```

`OAuthAPIError.isAuthPending` — `true` для `404` от `getToken` (ожидание авторизации в браузере при polling).

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

TypeScript-типы (`GetTokenDataType`, `GetProfileDataType`, `OAuthAPIError`, `ErrorType` и др.) поставляются вместе с пакетом в `dist/`.

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
  OauthAPI.ts       # основной класс
  OAuthAPIError.ts  # типизированная ошибка API
  OAuthTypes.d.ts   # типы ответов
dist/              # собранный пакет (публикуется в Nexus)
examples/
  oauth-browser/       # пример UXP-плагина
scripts/           # copy-types, minify
```

## Публикация

Инструкция по публикации в Nexus: [PUBLISHING.md](./PUBLISHING.md).

## Лицензия

Внутренний пакет Retouch4me.
