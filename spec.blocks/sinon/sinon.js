(function(name, ctx, define) {
    var module = define.call(ctx);
    typeof modules === 'object'?
        modules.define(name, function(provide) { provide(module); }) :
        (ctx[name] = module);
}('sinon', this, function() {

/*borschik:include:__v1-9/sinon__v1-9.js*/;
return this.sinon;

}));
