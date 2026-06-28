# RSA License Keygen

Node.js утилита для генерации RSA-256 ключей, подписи и проверки лицензионных ключей в формате Base41 (Niobium).

Используется в UXP-панелях Retouch4me (vectorscope, via_OAuth_2): клиент хранит **публичный** ключ, сервер / keygen-машина — **приватный**.

## Установка

```bash
cd examples/rsa-keygen
npm install
npm run build
```

## CLI

```bash
# Сгенерировать пару ключей в ./keys/
npm run keygen -- generate

# Указать свою папку
npm run keygen -- generate --keys ./my-app-keys

# Подписать email + installationId → лицензионный ключ
npm run keygen -- sign user@example.com R4VS-ABCD-1234-XYZZY

# Проверить ключ
npm run keygen -- verify user@example.com R4VS-ABCD-1234-XYZZY <BASE41_KEY>

# Вывести snippet для appInfo.ts
npm run keygen -- export-public
```

## Интеграция в приложение

1. `npm run keygen -- generate`
2. `npm run keygen -- export-public` — скопировать `publicKey` в `appInfo.ts`
3. Приватный ключ (`keys/private.pem`) **не коммитить** и не встраивать в клиент
4. На бэкенде / в keygen: `sign` для выдачи лицензии пользователю

Пример для `via_OAuth_2/src/appInfo.ts`:

```typescript
export const publicKey = `-----BEGIN RSA-256 PUBLIC KEY-----
...
-----END RSA-256 PUBLIC KEY-----`;
```

Клиентская верификация — `verifyLicenseKey()` в `via_OAuth_2/src/rsa.ts`.

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

1. `hash = SHA256(installationId + "|" + email)` — префикс `R4VS-` снимается
2. `signature = hash^d mod n` (приватный ключ)
3. Ключ кодируется в Base41 (Niobium), 32 байта → 48 символов

## Тесты

```bash
npm run test:rsa        # 100 итераций
npm run test:rsa -- 500 # 500 итераций
```

## Программное API

```typescript
import {
  generateKeyPair,
  saveKeyPair,
  signLicenseKey,
  verifyLicenseKey,
  readPrivateKeyFile,
  readPublicKeyFile,
} from './dist/index.js';
```

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
      license.ts     # sign + verify
  keys/              # сгенерированные ключи (gitignored)
```
