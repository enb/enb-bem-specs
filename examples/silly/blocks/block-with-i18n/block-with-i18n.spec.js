modules.define('spec', ['block-with-i18n'], function(provide, block) {

    it('should be equal to one', function() {
        block.foo().should.eql('block-with-i18n:bar');
    });

    provide();

});
