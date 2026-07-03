# RSA License Keygen

Node.js утилита для генерации RSA-256 ключей, подписи и проверки лицензионных ключей в формате Base41 (Niobium).

Используется в UXP-панелях Retouch4me (vectorscope, oauth-rsa-keys): клиент хранит **публичный** ключ, сервер / keygen-машина — **приватный**.

## Установка

```bash
cd examples/rsa-keygen
npm install
npm run build
```

## Когда использовать этот пример

Этот example нужен для серверной части лицензирования:

- сгенерировать RSA-пару ключей (`generate`),
- подписывать лицензии (`sign`),
- проверять корректность подписи в тестах/отладке (`verify`).

Клиентский UXP-плагин не должен генерировать приватные ключи и не должен выполнять `sign`.

## CLI

```bash
# Сгенерировать пару ключей в ./keys/
npm run keygen -- generate

# Указать свою папку
npm run keygen -- generate --keys ./my-app-keys

# Подписать email + installationId → лицензионный ключ (по умолчанию продукт vectorscope)
npm run keygen -- sign user@example.com R4VS-ABCD-1234-XYZZY

# Подписать для другого продукта (свой префикс + соль)
npm run keygen -- sign user@example.com R4WF-GPIE-6439-SHITG --product waveform

# Проверить ключ
npm run keygen -- verify user@example.com R4VS-ABCD-1234-XYZZY <BASE41_KEY>

# Вывести snippet для appInfo.ts
npm run keygen -- export-public
```

### Продукт, префикс и соль

Параметры хеша задаются на продукт (совпадают с серверной записью `keyprefix` / `keysalt`):

| Опция | Назначение | Пример |
| --- | --- | --- |
| `--product <name>` | Пресет из `src/lib/products.ts` | `vectorscope`, `waveform` |
| `--prefix <prefix>` | Переопределить префикс `installationId` | `R4VS`, `R4WF` |
| `--salt <salt>` | Переопределить соль хеша | `''`, `waveform` |

| Продукт | keyprefix | keysalt | Payload для hash |
| --- | --- | --- | --- |
| Vectorscope (304) | `R4VS` | `''` (пусто) | `ABCD-1234-XYZZY\|user@example.com` |
| Waveform (305) | `R4WF` | `waveform` | `GPIE-6439-SHITG\|user@example.comwaveform` |
| WB Compass (306) | `R4WBC` | `wbcompass` | `GPIE-6439-SHITG\|user@example.comwbcompass` |

RSA-пара может быть общей для нескольких продуктов — лицензии различаются за счёт префикса и соли.

## Интеграция в приложение

1. `npm run keygen -- generate`
2. `npm run keygen -- export-public` — скопировать `publicKey` в `appInfo.ts`
3. Приватный ключ (`keys/private.pem`) **не коммитить** и не встраивать в клиент
4. На бэкенде / в keygen: `sign` для выдачи лицензии пользователю (нужны `email` и `installationId` клиента)

Сквозной клиентский flow (OAuth + получение лицензии) описан в:
[`../oauth-rsa-keys/src/README.md`](../oauth-rsa-keys/src/README.md)

Пример для `oauth-rsa-keys/src/appInfo.ts`:

```typescript
export const publicKey = `-----BEGIN RSA-256 PUBLIC KEY-----
...
-----END RSA-256 PUBLIC KEY-----`;
```

Клиентская верификация — `verifyLicenseKey()` в `oauth-rsa-keys/src/rsa.ts`.

### Откуда брать installationId

`installationId` генерируется на стороне клиента (в приложении), а не в `rsa-keygen`.

В примере `oauth-rsa-keys` он собирается в `appInfo.ts` так:

```typescript
_deviceId = await generateDeviceId();
_installationId = `${productConfig.installationIdPrefix}-${_deviceId}`;
```

То есть:

- сначала клиент получает стабильный `deviceId` через `generateDeviceId()` (fingerprint + anchor-файл на диске),
- в `generateDeviceId.ts` для **своего** приложения нужно заменить имя папки и anchor-файла (в примере: `Vectorscope` / `vectorscope_anchor.conf` — только Vectorscope),
- затем формирует `installationId` с префиксом приложения (`R4VS-...` для Vectorscope),
- этот `installationId` отправляется на сервер для подписи лицензии.

## Формат ключей

Публичный PEM (2 строки hex):

```
-----BEGIN RSA-256 PUBLIC KEY-----
{n}
{e}
-----END RSA-256 PUBLIC KEY-----
```

Приватный PEM (3 строки hex):

```
-----BEGIN RSA-256 PRIVATE KEY-----
{n}
{e}
{d}
-----END RSA-256 PRIVATE KEY-----
```

## Алгоритм лицензии

1. `hash = SHA256(normalizedInstallationId + "|" + email + licenseHashSalt)`
   - `normalizedInstallationId` — `installationId` без префикса `<keyprefix>-`.
   - Соль приклеивается к `email` **без** разделителя `|`.
   - Для Vectorscope соль пустая (`''`), payload: `deviceId|email`.
   - `R4VS` / `R4WF` — идентификаторы приложений (Vectorscope / Waveform). Для своего проекта задайте собственные префикс, соль и ключи.
2. `signature = hash^d mod n` (приватный ключ)
3. Ключ кодируется в Base41 (Niobium), 32 байта → 48 символов

Префикс и соль конфигурируются на продукт (`src/lib/products.ts` или флаги `--prefix` / `--salt`), а не хардкодятся.

Важно: RSA-пара ключей (`generate`) создаётся независимо от `installationId`.
`installationId` участвует только в операциях `sign` / `verify` (привязка лицензии к установке).

Коротко: `generate` (один раз) → встроить `publicKey` в клиент → клиент присылает `email + installationId` → сервер делает `sign` приватным ключом → клиент делает `verify` публичным ключом.

## Типичные ошибки интеграции

- Пытаться выполнять `sign` на клиенте (должно быть только на сервере).
- Использовать в проде примерные `R4VS` и `publicKey` из Vectorscope вместо своих.
- Разные префикс/соль на сервере (`sign`) и клиенте (`verify`) — ключ не пройдёт проверку.
- Добавлять разделитель перед солью (`...|email|salt`) — правильно `...|email` + `salt` без `|`.
- Генерировать новую RSA-пару после выдачи лицензий (старые лицензии перестанут проходить проверку).
- Передавать в `sign` один `installationId`, а на клиенте проверять ключ с другим `installationId`.

## Тесты

```bash
npm run test:rsa        # 100 итераций sign/verify на продукт (случайные данные)
npm run test:rsa -- 500 # 500 итераций

# Сверка с реальными ключами (Vectorscope / 304, Waveform / 305) и wbcompass / 306
npm run test:server
```

Фикстуры сервера лежат в `src/lib/server-fixtures.ts` — email, `installationId` и Base41-ключ.
Тест проверяет `verify` по production public key; если в `keys/private.pem` есть приватный ключ,
дополнительно сверяет, что локальный `sign` даёт тот же ключ, что и сервер.

## Программное API

```typescript
import {
  generateKeyPair,
  saveKeyPair,
  signLicenseKey,
  verifyLicenseKey,
  readPrivateKeyFile,
  readPublicKeyFile,
  resolveProduct,
  type LicenseProductConfig,
} from './dist/index.js';

// Конфиг продукта: prefix + salt (совпадает с сервером)
const product: LicenseProductConfig = resolveProduct('waveform');
// { installationIdPrefix: 'R4WF', licenseHashSalt: 'waveform' }

const { signature } = signLicenseKey(email, installationId, privateKey, product);
const ok = verifyLicenseKey(email, installationId, signature, publicKey, product);
```

`signLicenseKey` / `verifyLicenseKey` принимают пятым аргументом `LicenseProductConfig`
(`{ installationIdPrefix, licenseHashSalt }`). Если не передать — используется дефолт
Vectorscope (`R4VS`, пустая соль).

## Структура

```
rsa-keygen/
  src/
    cli.ts           # CLI
    test-rsa.ts      # sign/verify stress test
    lib/
      rsa256.ts      # генерация простых чисел, RSA math
      niobium.ts     # Base41 codec
      pem.ts         # PEM load/save
      license.ts     # sign + verify (prefix + salt)
      products.ts    # пресеты продуктов (prefix + salt)
      server-fixtures.ts  # реальные ключи с сервера для test:server
  keys/              # сгенерированные ключи (gitignored)
```
