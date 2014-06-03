modules.define('block-1', ['block-2'], function(provide, b2) {
    provide({
        sum: function () {
            var res = 0;
            var args = Array.prototype.slice.call(arguments);

            args.length && args.forEach(function (arg) {
                res += arg;
            });

            b2.log(res);

            return res;
        }
    });
});
