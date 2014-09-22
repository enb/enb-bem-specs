enb-bem-specs
=============

[![NPM version](http://img.shields.io/npm/v/enb-bem-specs.svg?style=flat)](http://npmjs.org/package/enb-bem-specs) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-specs/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem-specs) [![Dependency Status](http://img.shields.io/david/enb-bem/enb-bem-specs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-specs)

Инструмент для сборки и запуска спеков (тестов) на клиентский JavaScript. В процессе сборки генерируются
уровни-сеты из спеков БЭМ-блоков с помощью [ENB](http://enb-make.info/).

Установка:
----------

```sh
$ npm install --save-dev enb-bem-specs
```

Для работы модуля требуется зависимость от пакета `enb-magic-factory` версии `0.2.x` или выше.

Технология `spec.js` на файловой системе
----------------------------------------

У каждой БЭМ-сущности может быть свой набор спеков, которые будут выполняться независимо от спеков
остальных БЭМ-сущностей.

```sh
$ tree -a <level>.blocks/<block-name>/

<block-name>/
 └── spec.js
```

В результате сборки будет построен уровень-сет из обычных бандлов (`nested`-уровнень), каждый из которых представляет собой:

```sh
$ tree -a <set-name>.specs

<set-name>.specs
 └── <block-name>/              # Бандл для БЭМ-сущности.
      ├── <block-name>.js       # Клиенский JavaScript,
                                #  необходимый для выполнения спеков.
      ├── <block-name>.css      # Стили, необходимые для выполнения спеков.
      ├── <block-name>.spec.js  # Код спеков.
      └── <block-name>.html     # Html, необходимый для выполнения спеков.
                                #  Включает в себя js, css и spec.js таргеты.
```

Frameworks
----------

* [`mocha`](https://github.com/visionmedia/mocha)
* [`should`](https://github.com/shouldjs/should.js)

Как написать тест?
------------------

Тесты пишутся в BDD стиле с использованием асинхронной модульной системы [`YModules`](https://github.com/ymaps/modules).
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

После сборки уровней-сетов произойдёт запуск спеков для указанных БЭМ-сущностей.

Собранные html-файлы для каждой БЭМ-сущности содержат в себе необходимый код стилей и JavaScript, а так же код спеков
и передаются в [`PhantomJS`](https://github.com/ariya/phantomjs).

![2014-09-21 23 40 20](https://cloud.githubusercontent.com/assets/2225579/4349827/76e6ade2-41c7-11e4-8d1b-8d1faea381ad.png)

Покрытие кода
-------------

Если при запуске переменная окружения `ISTANBUL_COVERAGE` будет равна значению `yes`,
то после выполнения спеков в корне появится `coverage.json` файл с иформацией о покрытии исходного
JavaScript-кода спеками.

С помощью команды `report` инструмента [`istanbul`](https://github.com/gotwarlost/istanbul)
можно составить `html` отчёт на основе `coverage.json` файла:

```sh
$ istanbul report coverage.json
```

![2014-09-21 23 51 31](https://cloud.githubusercontent.com/assets/2225579/4352776/5020f592-422a-11e4-8770-8515ab046a35.png)

Как использовать?
-----------------

В `make`-файле (`.enb/make.js`) нужно подключить `enb-bem-specs` модуль.
С помощью этого модуля следует создать конфигуратор, указав название таска в рамках которого будет происходить сборка
уровней сетов из спеков.

Конфигуратор имеет единственный метод `configure`. Его можно вызывать несколько раз, чтобы задекларировать сборку
нескольких уровней-сетов.

```js
module.exports = function (config) {
    config.includeConfig('enb-bem-specs'); // Подключаем `enb-bem-specs` модуль.

    var examples = config.module('enb-bem-specs') // Создаём конфигуратор сетов
        .createConfigurator('specs');             //  в рамках `specs` таска.

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

* *String* `destPath` &mdash;&nbsp;Путь относительный корня до&nbsp;нового уровня-сета со&nbsp;спеками, которые нужно собрать. Обязательная опция.
* *String[] | Object[]* `levels` &mdash;&nbsp;Уровни, в&nbsp;которых следует искать спеки. Обязательная опция.
* *String[] | Object[]* `sourceLevels` &mdash;&nbsp;Уровни, в&nbsp;которых следует искать JavaScript код, необходимый для запуска спеков.
* *String[]* `jsSuffixes` &mdash;&nbsp;Суффиксы `js`-файлов БЭМ-сущностей. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['js']`.
* *String[]* `specSuffixes` &mdash;&nbsp;Суффиксы `spec.js`-файлов БЭМ-сущностей. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['spec.js']`.

Запуск из консоли
-----------------

В `make`-файле декларируется таск, в котором будет выполняться сборка уровней-сетов из спеков.

В ENB запуск таска осуществляется с помощью команды `make`, которой передаётся имя таска:

```sh
$ ./node_modules/.bin/enb make <task-name>
```

### Сборка и запуск всех спеков

Если сборка уровней-сетов из спеков была задекларарована в `specs`-таске:

```sh
$ ./node_modules/.bin/enb make specs
```

### Сборка всех спеков для указанной БЭМ-сущности

Чтобы собрать спеки БЭМ-сущности `block__elem` для уровня-сета `desktop.specs`:

```sh
$ ./node_modules/.bin/enb make specs desktop.specs/block__elem
```
