modules.define('block-with-i18n', ['i18n'], function(provide, i18n) {

    provide({
        foo: function () {
            return i18n('block-with-i18n','bar');
        }
    });

});
