(['<!DOCTYPE html>',
{
    tag: 'html',
    content: [
        {
            tag: 'head',
            content: [
                {
                    tag: 'meta',
                    attrs: { charset: 'utf-8'}
                },
                {
                    tag: 'link',
                    attrs: {
                        href: '<%= name %>.css', rel: 'stylesheet'
                    }
                },
                {
                    tag: 'script',
                    attrs: { src: '<%= name %>.spec.js' }
                }
            ]
        },
        {
            tag: 'body',
            content: {
                block: 'spec'
            }
        },
        {
            block: 'spec-runner'
        }
    ]
}]);
