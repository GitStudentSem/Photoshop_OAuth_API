# OAuthAPI — пример (Vectorscope)

UXP-пример авторизации в стиле `retouch4me_photoshop_panel`.

Отличие: вместо `getRetouchToken()` используется `getLicenceKey()` → `getOnlineRegistrationKey()`.

## Файлы

| Файл | Назначение |
|------|------------|
| `auth.js` | OAuth flow + UI wiring |
| `UserStore.js` | Состояние пользователя |
| `appInfo.js` | deviceId + installationId (`R4VS-…`) |
| `index.html` | Разметка demo-панели |

## Подключение в UXP-панель

```html
<script type="module" src="./auth.js"></script>
```

## Flow

1. `onAuth()` — PKCE + `oauth.getLink()` + `shell.openExternal()`
2. `getToken()` — polling каждые 3s (404 = ждём)
3. `getProfile()` — `UserStore.login()`
4. `getLicenceKey()` — HMAC-сессия + `getOnlineRegistrationKey()`
