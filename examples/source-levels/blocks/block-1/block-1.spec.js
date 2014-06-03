modules.define('spec', ['block-1'], function(provide, b1) {

    describe('block', function() {
        it('should be equal to six', function() {
            b1.sum(1, 2, 3).should.to.equal(6);
        });
    });

    provide();

});
