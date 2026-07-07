# Чеклист интеграции OAuth + RSA в свой UXP-плагин

Документ для **не-программистов** и для **нейросетей** (ChatGPT, Cursor и т.д.).  
Цель: встроить авторизацию в уже существующий плагин без глубокого понимания кода.

**Эталонный пример кода:** [`examples/oauth-rsa-keys/`](./) — готовый UXP-плагин (TypeScript + Webpack).  
Смотрите файлы `src/auth.ts`, `src/rsa.ts`, `src/generateDeviceId.ts`, `src/appInfo.ts` — их можно переносить в свой проект целиком или по частям.

---

## Что нужно получить от команды Retouch4me **до** интеграции

| Что | Пример (Vectorscope, как в `oauth-rsa-keys`) | Зачем |
| --- | --- | --- |
| `client_id` (OAuth) | `retouch4me_vectorscope_panel` | Вход через браузер |
| `programName` (лицензия) | `retouch4me_vectorscope_panel` | Запрос ключа на `3dlutcreator.com` |
| `keyprefix` | `R4VS` | Префикс `installationId` |
| `keysalt` | `''` (пустая строка) | Соль в формуле хэша (у Waveform — `waveform`) |
| `publicKey` (RSA) | PEM из keygen | Проверка ключа на клиенте |
| Имя папки anchor | `Vectorscope` | Стабильный `deviceId` |
| Имя anchor-файла | `vectorscope_anchor.conf` | То же |
| Продукт на сервере | да / нет | Без записи на сервере лицензия не выдаётся |

Полная таблица продуктов: [`../rsa-keygen/src/lib/products.ts`](../rsa-keygen/src/lib/products.ts).

---

## 7 мест в коде, которые **обязаны** совпадать

Частая ошибка: поменять значение в одном месте и забыть про другое.  
Попросите нейросеть **найти все вхождения** и сверить с таблицей продукта.

| # | Что менять | Должно быть (пример Vectorscope) | Где обычно лежит |
| --- | --- | --- | --- |
| 1 | OAuth `client_id` / `application` | `retouch4me_vectorscope_panel` | `src/applicationName.ts` — используется в `getLink`, `getLicenceKey` |
| 2 | `programName` | то же значение, что `applicationName` | тот же `src/applicationName.ts` |
| 3 | `installationIdPrefix` | `R4VS` | `productConfig`, `appInfo.ts` |
| 4 | `licenseHashSalt` | `''` | `productConfig` (у Waveform — `waveform`) |
| 5 | Сборка `installationId` | `R4VS-<deviceId>` | `initAppInfo`, `getInstallationId` — **часто захардкожено отдельно от п.3!** |
| 6 | Папка + файл anchor | `Vectorscope` / `vectorscope_anchor.conf` | `getTimeStamp()` в `generateDeviceId.ts` |
| 7 | `publicKey` | ваш PEM | `appInfo.ts` |

**Правило:** префикс в п.3 и п.5 — **одна и та же строка**.  
Если в `productConfig` стоит `R4VS`, а в `getInstallationId` другой prefix (например `VS-`) — лицензия **не пройдёт проверку**, даже если сервер выдал ключ.

Сверяйтесь с эталоном: [`src/appInfo.ts`](./src/appInfo.ts), [`src/applicationName.ts`](./src/applicationName.ts) и [`src/auth.ts`](./src/auth.ts).

---

## Чеклист «готово ли к тесту»

Отметьте каждый пункт после интеграции:

- [ ] Продукт зарегистрирован на сервере (или для теста временно подставлены данные **другого** уже зарегистрированного продукта — см. раздел «Временный тест» ниже).
- [ ] Все 7 значений из таблицы выше совпадают между собой.
- [ ] `deviceId` **не** случайная строка из `localStorage` — строится из fingerprint машины + anchor-файл на диске (см. `generateDeviceId.ts`).
- [ ] В OAuth-ссылке в параметр `deviceid` передаётся **голый** `deviceId` (без префикса `R4VS-`).
- [ ] В запрос лицензии передаётся `installationid=<keyprefix>-<deviceId>` (с префиксом).
- [ ] `verifyLicenseKey` вызывается с **`installationId`**, а не с сырым `deviceId`.
- [ ] В `manifest.json` разрешён сетевой доступ к `retouch4.me` **и** `3dlutcreator.com` (или `"domains": "all"`).
- [ ] В `manifest.json` есть `launchProcess` для `https` (открытие браузера).
- [ ] Приватный RSA-ключ **не** попал в плагин (только `publicKey`).

---

## Готовый промпт для нейросети

Скопируйте блок ниже, подставьте свои значения в `<…>` и приложите свой плагин:

```text
Нужно встроить OAuth + RSA-лицензирование Retouch4me в мой UXP-плагин Photoshop.

Документация и эталон:
- examples/oauth-rsa-keys/INTEGRATION_CHECKLIST.md
- examples/oauth-rsa-keys/README.md
- examples/oauth-rsa-keys/src/ (auth.ts, rsa.ts, generateDeviceId.ts, appInfo.ts)

Параметры моего продукта:
- client_id / programName: <retouch4me_MYAPP_panel>
- keyprefix (installationIdPrefix): <R4XXX>
- keysalt: <myapp или пустая строка>
- anchor папка: <MyAppFolder>
- anchor файл: <myapp_anchor.conf>
- publicKey: <вставить PEM>

Требования:
1. Найди ВСЕ места, где должны быть client_id, programName, prefix, salt, installationId — они должны совпадать.
2. installationId = <prefix>-<deviceId>, deviceId стабильный (fingerprint + anchor-файл).
3. После получения licenseKey с сервера — локальная verifyLicenseKey с productConfig.
4. Добавь console.log с префиксом [LICENSE] для отладки (см. раздел «Отладка» в INTEGRATION_CHECKLIST.md).
5. Проверь manifest.json: network domains и launchProcess.

Не используй client_id retouch4me_photoshop_panel — у каждого продукта свой.
Ориентируйся на пример oauth-rsa-keys, не изобретай flow с нуля.
```

---

## Порядок работы при авторизации (что должно происходить)

Как в [`src/auth.ts`](./src/auth.ts) и [`src/index.ts`](./src/index.ts):

1. Пользователь нажимает **Authorize**.
2. Генерируются `deviceId`, PKCE, ссылка → открывается браузер (`shell.openExternal`).
3. Пользователь логинится на retouch4.me.
4. Плагин каждые 3 секунды опрашивает токен (до 20 попыток).
5. Загружается профиль (email).
6. Запрос на `3dlutcreator.com/getsubscriptionkey.php` с `email`, `application`, `deviceid`, `installationid`, `session` (HMAC).
7. Сервер возвращает `key` (license key в Base41).
8. Клиент проверяет подпись публичным ключом (`verifyLicenseKey`) → если OK, сохраняет и пускает в плагин.

Если падает на шаге 6–7 — чаще всего продукт **не зарегистрирован** на сервере или неверный `programName`.  
Если ключ пришёл, но шаг 8 падает — неверны **prefix / salt / installationId** в коде клиента.

---

## Временный тест, если ваш продукт ещё не на сервере

Можно **временно** подставить данные уже зарегистрированного продукта (Vectorscope — он же в примере `oauth-rsa-keys` по умолчанию), чтобы проверить, что код авторизации работает:

| Поле | Vectorscope (тест) |
| --- | --- |
| `client_id` / `programName` | `retouch4me_vectorscope_panel` |
| prefix | `R4VS` |
| salt | `''` (пусто) |
| `installationId` | `R4VS-<deviceId>` |
| anchor | `Vectorscope` / `vectorscope_anchor.conf` |

Публичный ключ можно оставить общий. Интерфейс вашего плагина при этом не меняется.  
**После теста верните значения своего продукта** и дождитесь регистрации на сервере.

---

## Отладка: что смотреть в консоли UXP

Откройте консоль в [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/) при загрузке плагина.

Попросите нейросеть добавить логи с префиксом `[LICENSE]` в ключевых точках (см. `getLicenceKey` и `verifyLicenseKey` в эталоне). Ниже — **что должно быть при успешной активации** (пример Vectorscope).

### 1. Запрос лицензии

```
[LICENSE] fetchLicenseKey request: {
  email: "user@example.com",
  application: "retouch4me_vectorscope_panel",
  deviceId: "ABCD-1234-XYZZY",
  installationId: "R4VS-ABCD-1234-XYZZY",
  ...
}
```

Проверьте:

- `application` = ваш `applicationName` из `src/applicationName.ts` (не `retouch4me_photoshop_panel`).
- `installationId` = `<keyprefix>-<deviceId>` (префикс **с** дефисом).
- `deviceId` **без** префикса.

### 2. Ответ сервера

```
[LICENSE] fetchLicenseKey parsed json: { key: "...", keysleft: ..., ... }
[LICENSE] fetchLicenseKey key from server: <BASE41-СТРОКА>
```

Если `key` пустой или ошибка `WEBAPIERROR_*` — проблема на стороне сервера / сессии / лимита ключей.

### 3. Расчёт хэша (самое важное для сверки с сервером)

```
[LICENSE] createHash256: {
  installationId: "R4VS-ABCD-1234-XYZZY",
  prefix: "R4VS",
  normalizedId: "ABCD-1234-XYZZY",
  salt: "",
  hashPayload: "ABCD-1234-XYZZY|user@example.com",
  sha256: "<64 hex символа>"
}
```

**Сверка с документацией:**

- `normalizedId` = `installationId` **без** префикса `R4VS-`.
- `hashPayload` = `normalizedId + "|" + email + salt` (соль **без** `|` перед ней).
- Для продукта с солью (Waveform): `hashPayload` = `GPIE-6439-SHITG|user@example.comwaveform`.

Попросите команду сервера подтвердить, что они подписывают **ту же** строку `hashPayload`.

### 4. Проверка подписи

```
[LICENSE] verifyLicenseKey: {
  isValid: true,
  decryptedFromSignature: "abc123...",
  expectedHashMod: "abc123..."
}
```

**Успех:** `isValid: true` и `decryptedFromSignature` **полностью равен** `expectedHashMod`.

**Провал:** значения разные → неверный `publicKey`, prefix, salt или сервер подписал другой payload.

### 5. Повторный запуск (сохранённая сессия)

```
[LICENSE] checkSession: verifying stored key { storedLicenseKey: "...", installationId: "R4VS-..." }
```

Ключ из `localStorage` должен совпадать с тем, что вернул сервер при первом входе.

---

## Типичные ошибки и что делать

| Симптом | Вероятная причина | Что проверить |
| --- | --- | --- |
| «Время ожидания истекло» | Пользователь не завершил вход в браузере | Шаг 3–4, интернет |
| `License API error` / пустой ответ | Нет доступа к `3dlutcreator.com` | `manifest.json` → `network.domains` |
| Ключ не найден / keysleft = 0 | Продукт не на сервере или лимит активаций | `programName`, регистрация продукта |
| `Недействительная подпись ключа` | Prefix/salt/installationId не совпадают | Таблица «7 мест», лог `hashPayload` |
| Работало с Vectorscope, не работает со своим | Продукт не добавлен на сервер | Не баг кода — ждать сервер |
| Каждый запуск новый `deviceId` | Случайный ID вместо fingerprint | `generateDeviceId.ts` + anchor-файл |
| OAuth OK, лицензия падает | Разные `client_id` и `programName` | Оба должны быть от **одного** продукта |
| Prefix в `productConfig` ≠ prefix в `getInstallationId` | Дублирование констант | Сверить с `appInfo.ts` в эталоне |

---

## Формула лицензии (кратко)

```
installationId = <keyprefix>-<deviceId>
normalizedId   = installationId без префикса "<keyprefix>-"
hashPayload    = normalizedId + "|" + email + keysalt
hash           = SHA256(hashPayload)
licenseKey     = RSA_sign(hash) в кодировке Base41 (Niobium)
```

Клиент делает обратное: расшифровывает `licenseKey` публичным ключом и сравнивает с `hash mod n`.

Подробнее: [README.md](./README.md), [rsa-keygen/README.md](../rsa-keygen/README.md).

---

## После успешной интеграции

- Уберите или закомментируйте отладочные `console.log` с email и license key перед релизом.
- Не коммитьте `private.pem` в репозиторий.
- Сохраните таблицу параметров своего продукта (prefix, salt, client_id) — пригодится при обновлениях.
