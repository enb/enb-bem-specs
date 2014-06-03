modules.define('spec', function(provide) {

    describe('block__elem', function() {
        it('should be equal to four', function() {
            (2*2).should.to.equal(4);
        });
    });

    provide();

});
