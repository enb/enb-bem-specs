modules.define('block-2', function(provide) {
    provide({
        log: function (res) {
            console.log('res = ' + res);
        }
    });
});
