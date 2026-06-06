# Photoshop TypeScript / Webpack Sample

Пример UXP-плагина с OAuth-авторизацией через `@relu-ps/oauth-api`.

Пакет подключён так же, как у потребителей библиотеки — локально через `file:../..` в `package.json`. Перед сборкой example автоматически пересобирается корневой пакет (`prebuild` / `predev`).

```ts
import OauthAPI from "@relu-ps/oauth-api";
```

Если вы меняете исходники в `src/OauthAPI.ts`, пересоберите библиотеку в корне (`npm run build`) или просто запустите `npm run build` / `npm run dev` в этой папке — скрипт сделает это сам.

## Building the plugin

In the plugin folder (that contains the `package.json` file), install the dependencies by running:

```shell
npm install
```

or

```shell
yarn install
```

After that, you need to build the plugin's `dist/index.js` file (that the `index.html` loads) by running:

```shell
npm run build
```

or

```shell
yarn build
```

This, internally, runs `webpack` and builds the `dist/index.js` from the `src/index.ts` file.

After that, you can load the plugin into Photoshop using the UXP Developer Tool:

## Loading in Photoshop

You can load this plugin directly in Photoshop by using the UXP Developer Tools application. Once started, click "Add Plugin...", and navigate to the "manifest.json" file in this folder. Then click the ••• button next to the corresponding entry in the developer tools and click "Load". Switch over to Photoshop, and the plugin's panel will be running.
