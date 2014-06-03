modules.define('spec', function(provide) {

    describe('block', function() {
        it('should be equal to nine', function() {
            (3*3).should.to.equal(9);
        });
    });

    provide();

});
