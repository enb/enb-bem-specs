enb-bem-specs [![NPM version](https://badge.fury.io/js/enb-bem-specs.svg)](http://badge.fury.io/js/enb-bem-specs) [![Build Status](https://travis-ci.org/andrewblond/enb-bem-specs.svg?branch=master)](https://travis-ci.org/andrewblond/enb-bem-specs) [![Dependency Status](https://gemnasium.com/andrewblond/enb-bem-specs.svg)](https://gemnasium.com/andrewblond/enb-bem-specs)
=============

Инструмент для сборка и запуска БЭМ-спеков для ENB.

Как использовать?
-----------------

```js
var sets = require('enb-bem-sets');            // Подключаем инструмент для сетов.
var specsPlugin = require('enb-bem-specs');    // Подключаем плагин для спек.

module.exports = function (config) {
    var maker = sets.create('specs', config);  // Создаём конфигуратор сетов
                                               //  в рамках `specs` таска.
    var specs = sets.use(specsPlugin, maker);  // Инициализируем плагин
                                               //  в рамках `specs` таска.

    specs.build({                              // Декларируем сборку и запуск спеков
        destPath: 'desktop.specs',             //  по пути `desktop.specs`
        levels: getLevels(config)              //  на основе указанных уровней.
    });
};

function getLevels(config) {
    return [
        'common.blocks',
        'desktop.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
```

Для сборки и запуска всех наборов спеков, запускаем `specs` таск:

```
$ ./node_modules/.bin/enb make specs
```

Для сборки и запуска спеков, относящихся к конкретной БЭМ-сущности, запускаем:

```
$ ./node_modules/.bin/enb make specs desktop.specs/block__elem
```

Установка:
----------

```
$ npm install --save-dev enb-bem-specs
```

Для работы модуля требуется зависимость от пакета enb версии 0.12.0 или выше,<br/> а так же enb-bem-sets версии 0.3.3 или выше.

Разработка
----------

Руководство на [отдельной странице](/CONTRIBUTION.md).
