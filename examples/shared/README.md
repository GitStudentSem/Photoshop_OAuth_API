# examples/shared

Общий код для примеров `via_*`: список production-серверов Retouch4me и переключение URL через `OauthAPI.setFullUrl()`.

Подключается **относительным импортом** из `src/` каждого примера:

```ts
import { initServerSelect } from "../../shared/oauthStaticServers";
```

Webpack при сборке встраивает этот файл в `dist/index.js` плагина — отдельно в manifest его указывать не нужно.

## Важно при копировании репозитория

Примеры рассчитаны на структуру monorepo:

```
examples/
  shared/
  via_credentials/
  via_OAuth/
  via_OAuth_2/
```

Если выносить один пример в отдельный проект, скопируйте вместе с ним папку `examples/shared/` и сохраните относительный путь `../../shared/` (или скопируйте `oauthStaticServers.ts` в `src/` примера).

Выбор сервера сохраняется в `localStorage` под ключом `selectedServerId` и общий для всех примеров в одном Photoshop.
