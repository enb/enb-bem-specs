modules.define('spec', function(provide) {

    describe('block', function() {
        it('Два умножить на два должно равняться четырем', function() {
            (2*2).should.to.equal(4);
        });
    });

    provide();

});
