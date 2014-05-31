modules.define('spec', function(provide) {

    describe('block__elem', function() {
        it('Три умножить на три должно равняться девяти', function() {
            (3*3).should.to.equal(9);
        });
    });

    provide();

});
