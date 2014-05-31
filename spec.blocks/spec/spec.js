(function() {

typeof modules === 'object'?
    modules.define('spec', ['mocha', 'chai', 'sinon', 'sinon-chai'], function(provide) {
        define.apply(this.global, Array.prototype.slice.call(arguments, 1));
        provide();
    }) :
    define(this.mocha, this.chai, this.sinon, this.sinonChai);

function define(mocha, chai, sinon, sinonChai) {
    mocha.ui('bdd');
    mocha.bail(true);

    chai.use(sinonChai);
    chai.should();
}

}());
