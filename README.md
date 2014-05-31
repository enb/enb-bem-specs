enb-bem-specs [![NPM version](https://badge.fury.io/js/enb-bem-specs.svg)](http://badge.fury.io/js/enb-bem-specs) [![Build Status](https://travis-ci.org/andrewblond/enb-bem-specs.svg?branch=master)](https://travis-ci.org/andrewblond/enb-bem-specs) [![Dependency Status](https://gemnasium.com/andrewblond/enb-bem-specs.svg)](https://gemnasium.com/andrewblond/enb-bem-specs)
=============

Инструмент для сборка и запуска БЭМ-спеков для ENB.

Как использовать?
-----------------

```js
var specsSets = require('enb-bem-specs');

module.exports = function (config) {
    var specs = specsSets                      // Создаём конфигуратор сетов
        .create('specs', config);              //  в рамках `specs` таска.

    specs.build({                              // Декларируем сборку и запуск спеков
        destPath: 'desktop.specs',             //  по пути `desktop.specs`
        levels: getDesktopLevels(config)       //  на основе уровней для десктопов.
    });

    specs.build({                              // Декларируем сборку и запуск спеков
        destPath: 'touch.specs',               //  по пути `touch.specs`
        levels: getTouchLevels(config)         //  на основе уровней для тачей.
    });
};

function getDesktopLevels(config) {
    return [
        'common.blocks',
        'desktop.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getTouchLevels(config) {
    return [
        'common.blocks',
        'touch.blocks'
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

Для работы модуля требуется зависимость от пакета enb версии 0.12.0 или выше,<br/> а так же от enb-bem-sets версии 0.3.3 или выше.

Разработка
----------

Руководство на [отдельной странице](/CONTRIBUTION.md).
