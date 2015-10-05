enb-bem-specs
=============

[![NPM version](https://img.shields.io/npm/v/enb-bem-specs.svg?style=flat)](http://npmjs.org/package/enb-bem-specs) [![Build Status](https://img.shields.io/travis/enb-bem/enb-bem-specs/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem-specs) [![Dependency Status](https://img.shields.io/david/enb-bem/enb-bem-specs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-specs)

Инструмент для сборки и запуска тестов (спеков) на клиентский JavaScript. В процессе сборки генерируются сеты из тестов БЭМ-блоков с помощью [ENB](http://enb-make.info/).

Установка
----------

```sh
$ npm install --save-dev enb-bem-specs
```

Для работы модуля требуется зависимость от пакетов `enb-magic-factory` версии `0.3.x`  или выше, а так же `enb` версии `0.13.0` или выше.

Технология `spec.js` в файловой системе
----------------------------------------

У каждой БЭМ-сущности может быть свой набор тестов, которые будут выполняться независимо от тестов остальных БЭМ-сущностей.

```sh
$ tree -a <level>.blocks/<block-name>/

<block-name>/
 └── spec.js
```

В результате сборки будет построен сет из обычных бандлов (`nested`-уровень), каждый из которых представляет собой:

```sh
$ tree -a <set-name>.specs

<set-name>.specs
 └── <block-name>/              # Бандл для БЭМ-сущности.
      ├── <block-name>.js       # Клиентский JavaScript,
                                # необходимый для выполнения тестов.
      ├── <block-name>.css      # Стили, необходимые для выполнения тестов.
      ├── <block-name>.spec.js  # Код тестов.
      └── <block-name>.html     # HTML, необходимый для выполнения тестов.
                                # Включает в себя js, css и spec.js таргеты.
```

Frameworks
----------

* [mocha](https://github.com/visionmedia/mocha)
* [should](https://github.com/shouldjs/should.js)

Как написать тест?
------------------

Тесты пишутся в BDD-стиле с использованием асинхронной модульной системы [YModules](https://ru.bem.info/tools/bem/modules/).
Чтобы добавить тест для БЭМ-сущности, нужно в её директории на требуемом уровне переопределения создать файл с названием `<bem-name>.spec.js`.

Пример:

```js
modules.define(
    'spec',
    ['button', 'i-bem__dom', 'BEMHTML'],
    function(provide, Button, BEMDOM, BEMHTML) {

describe('button', function() {
    var button;

    beforeEach(function() {
        button = BEMDOM.init($(BEMHTML.apply({ block: 'button', text: 'foo' })).appendTo('body'))
            .bem('button');
    });

    afterEach(function() {
        BEMDOM.destruct(button.domElem);
    });

    it('should be focused on pressrelease on itself', function() {
        button.hasMod('focused').should.be.false;
        button.domElem
            .trigger('pointerpress')
            .trigger('pointerrelease');
        button.hasMod('focused').should.be.true;
    });
});

provide();

});
```

Запуск спеков
-------------

После сборки сетов произойдёт запуск тестов для указанных БЭМ-сущностей.

Собранные HTML-файлы для каждой БЭМ-сущности содержат в себе необходимый код стилей и JavaScript, а так же код тестов. Эти HTML-файлы передаются в [PhantomJS](https://github.com/ariya/phantomjs).

![2014-09-21 23 40 20](https://cloud.githubusercontent.com/assets/2225579/4349827/76e6ade2-41c7-11e4-8d1b-8d1faea381ad.png)

Покрытие кода
-------------

Если при запуске переменная окружения `ISTANBUL_COVERAGE` будет равна значению `yes`,
то после выполнения тестов в корне появится файл `coverage.json` с информацией о покрытии исходного JavaScript-кода тестами.

С помощью команды `report` инструмента [istanbul](https://github.com/gotwarlost/istanbul)
можно составить `HTML`-отчёт на основе файла `coverage.json`:

```sh
$ istanbul report coverage.json
```

![2014-09-21 23 51 31](https://cloud.githubusercontent.com/assets/2225579/4352776/5020f592-422a-11e4-8770-8515ab046a35.png)

Как использовать?
-----------------

В `make`-файле (`.enb/make.js`) нужно подключить модуль `enb-bem-specs`.
С помощью этого модуля следует создать конфигуратор, указав название таска, в рамках которого будет происходить сборка уровней сетов из тестов.

Конфигуратор имеет единственный метод `configure`. Его можно вызывать несколько раз, чтобы задекларировать сборку нескольких сетов.

```js
module.exports = function (config) {
    config.includeConfig('enb-bem-specs'); // Подключаем модуль `enb-bem-specs`.

    var examples = config.module('enb-bem-specs') // Создаём конфигуратор сетов
        .createConfigurator('specs');             //  в рамках `specs`-таска.

    examples.configure({
        destPath: 'desktop.specs',
        levels: ['blocks'],
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: '../libs/bem-pr/spec.blocks', check: false },
            'blocks'
        ]
    });
};
```

### Опции

* *String* `destPath` &mdash;&nbsp;путь относительно корня до&nbsp;нового сета с&nbsp;тестами, которые нужно собрать. Обязательная опция.
* *String[] | Object[]* `levels` &mdash;&nbsp;уровни, в&nbsp;которых следует искать тесты. Обязательная опция.
* *String[] | Object[]* `sourceLevels` &mdash;&nbsp;уровни, в&nbsp;которых следует искать JavaScript-код, необходимый для запуска тестов.
* *String[]* `jsSuffixes` &mdash;&nbsp;суффиксы `js`-файлов БЭМ-сущностей. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['js']`.
* *String[]* `specSuffixes` &mdash;&nbsp;суффиксы `spec.js`-файлов БЭМ-сущностей. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['spec.js']`.
* *String|Function* `depsTech` — технология для раскрытия зависимостей. По умолчанию — `deps-old`.
* *Boolean* `langs` — включает в сборку `i18n`.
* *String[]* `scripts` &mdash;&nbsp;дополнительные js-скрипты, которые необходимо подключить на тестируемую страницу. Например:
```js
scripts: ['https://yastatic.net/jquery/1.8.3/jquery.min.js',
        'https://yastatic.net/lodash/2.4.1/lodash.min.js'],
```

Запуск из консоли
-----------------

В `make`-файле декларируется таск, в котором будет выполняться сборка сетов из тестов.

В ENB запуск таска осуществляется с помощью команды `make`, которой передаётся имя таска:

```sh
$ ./node_modules/.bin/enb make <task-name>
```

### Сборка и запуск всех тестов

Если сборка сетов из тестов была задекларирована в `specs`-таске:

```sh
$ ./node_modules/.bin/enb make specs
```

### Сборка всех тестов для указанной БЭМ-сущности

Чтобы собрать тесты БЭМ-сущности `block__elem` для сета `desktop.specs`:

```sh
$ ./node_modules/.bin/enb make specs desktop.specs/block__elem
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
