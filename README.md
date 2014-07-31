enb-bem-specs
=============

[![NPM version](https://badge.fury.io/js/enb-bem-specs.svg)](http://badge.fury.io/js/enb-bem-specs) [![Build Status](https://travis-ci.org/enb-bem/enb-bem-specs.svg?branch=master)](https://travis-ci.org/enb-bem/enb-bem-specs) [![Dependency Status](https://david-dm.org/enb-bem/enb-bem-specs.svg)](https://david-dm.org/andrewblond/enb-bem-specs)

Инструмент для генерации уровней-сетов из спеков (тестов) БЭМ-блоков с помощью [ENB](http://enb-make.info/).

Установка:
----------

```sh
$ npm install --save-dev enb-bem-specs
```

Для работы модуля требуется зависимость от пакета `enb-bem-sets` версии `0.5.0` или выше.

Как использовать?
-----------------

```js
module.exports = function (config) {
    config.includeConfig('enb-bem-specs');

    var specs = config.module('enb-bem-specs') // Создаём конфигуратор сетов
        .createConfigurator('specs');          //  в рамках `specs` таска.

    specs.configure({                          // Декларируем сборку и запуск спеков.
        destPath: 'desktop.specs',             // Указываем путь до уровня-сета.
        levels: getLevels(config),             // Указываем уровни для БЭМ-сущностей
                                               //  которых нужно собирать
                                               //  и запускать спеки.
        sourceLevels: getSourceLevels(config)  // Указываем уровни которые нужно
                                               //  подключать при сборке спеков.
    });
};

function getLevels(config) {
    return [
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getSourceLevels(config) {
    return [
        { path: '../libs/bem-core/common.blocks', check: false },
        { path: '../libs/bem-pr/spec.blocks', check: false },
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
```

Для сборки и запуска всех наборов спеков, запускаем сборку `desktop.specs` сета:

```sh
$ ./node_modules/.bin/sets make desktop.specs
```

Для сборки и запуска спеков, относящихся к конкретной БЭМ-сущности, запускаем:

```sh
$ ./node_modules/.bin/sets make desktop.specs/block__elem
```

Пример использования можно посмотреть в директории `examples/silly`.
