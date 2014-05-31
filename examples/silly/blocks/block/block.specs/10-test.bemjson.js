({
    block : 'page',
    head : [
        { elem : 'css', url : '_block.css', ie : false },
        { elem : 'js', url : '_block.spec.js' }
    ],
    content : [
        {
            block : 'spec'
        },
        {
            block : 'spec-runner'
        }
    ]
})
