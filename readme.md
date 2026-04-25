# Публикация npm-пакета в Nexus

Инструкция для подготовки и публикации npm-пакета в Nexus.

## Шаг 0. Подготовка git-репозитория

1. Создайте отдельный репозиторий под пакет.
2. Добавьте в `.gitignore` минимум следующие записи:

```gitignore
node_modules
dist/
.DS_Store
.npmrc
*.tgz
```

3. Добавьте другие служебные/локальные файлы, которые не должны попадать в git.

## Шаг 1. Доступ в Nexus

1. Получите логин и пароль для [nexus.hz.labs.retouch4.me](https://nexus.hz.labs.retouch4.me/#browse/browse:relu) в чате retoucher API.

## Шаг 2. Настройка `.npmrc`

1. Сгенерируйте base64-токен на компьютере:

```bash
echo -n 'login:pass' | openssl base64
```

2. Добавьте настройки в локальный `.npmrc`:

```ini
//nexus.hz.labs.retouch4.me/repository/relu/:_auth="{echo_base64_token}"

@relu:registry=https://nexus.hz.labs.retouch4.me/repository/relu/
@relu-ps:registry=https://nexus.hz.labs.retouch4.me/repository/relu/

email=your-work-email@example.com
always-auth=true
```

> Важно: `.npmrc` содержит чувствительные данные, не коммитьте его в репозиторий.

## Шаг 3. Настройка `package.json`

1. Используйте scope `@relu-ps` в имени пакета:

```json
"name": "@relu-ps/oauth-api"
```

2. Добавьте `publishConfig`:

```json
"publishConfig": {
  "registry": "https://nexus.example.com/repository/npm-internal/"
}
```

3. Ограничьте публикуемые файлы только собранной директорией:

```json
"files": ["dist"]
```

Это нужно, чтобы в Nexus уходил не весь исходный код, а только собранная версия.

## Шаг 4. Сборка и публикация

1. Проверьте содержимое пакета:

```bash
npm pack
tar -tzf relu-ps-oauth-api-1.0.0.tgz
```

2. Обновите версию проекта:

```bash
npm version major
# или
npm version minor
# или
npm version patch
```

3. Соберите проект:

```bash
npm run build
```

4. Опубликуйте пакет:

```bash
npm publish
```