modules.define('spec', function(provide) {

    describe('block__elem_modName_modVal-2', function() {
        it('should be equal to four', function() {
            (2*2).should.to.equal(4);
        });
    });

    provide();

});
