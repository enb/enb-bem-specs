'use strict';

const enb = require('enb');
const buildFlow = enb.buildFlow || require('enb/lib/build-flow');
const File = require('enb-source-map/lib/file');

module.exports = buildFlow.create()
    .name('define-mock')
    .target('target', '?.js')
    .defineRequiredOption('target')
    .defineRequiredOption('source')
    .defineOption('variables', {})
    .defineOption('variablesLoader')
    .defineOption('sourcemap', false)
    .defineOption('placeholder', { before: '___LOADMOCK:', after: '___' })
    .useSourceText('source')
    .builder(function (source) {
        const sourcemap = this._sourcemap;
        const fileName = this._source;
        const variablesLoader = this._variablesLoader;
        const target = this._target;
        const variables = Object.assign({}, this._variables);
        const placeholder = typeof this._placeholder === 'string' ?
                { before: this._placeholder, after: this._placeholder } :
                this._placeholder;
        const placeholderRegExp = new RegExp(
            `${regExpEscape(placeholder.before)}(.*?)${regExpEscape(placeholder.after)}`, 'g');

        const replaceAndReturn = varsList => {
            const replacedSource = replacePlaceholder(source, varsList, placeholderRegExp, !variablesLoader);

            return sourcemap ? renderWithSourceMaps(fileName, replacedSource, target) : replacedSource;
        };

        const varsToLoad = variablesLoader ? extractVars(source, placeholderRegExp) : [];

        if (!variablesLoader || !varsToLoad.length) return replaceAndReturn(variables);

        return variablesLoader(varsToLoad)
            .then(loadedVars => {
                Object.assign(variables, loadedVars);

                return replaceAndReturn(variables);
            });
    })
    .createTech();

// https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
function regExpEscape(s) {
    return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

function replacePlaceholder(source, variables, placeholderRegExp) {
    return source.replace(placeholderRegExp, function (match, varName) {
        if (typeof variables[varName] === 'undefined') {
            throw new Error('enb-define: There is no value for ' + varName + ' placeholder and no data loader defined');
        }

        // экранируем экранированные символы, чтобы экранирование не пропадало при раскрытии внешних кавычек(скороговорка)
        return variables[varName].replace(/\\|'/g, '\\$&');
    });
}

function renderWithSourceMaps(fileName, content, target) {
    var targetFile = new File(target, { sourceMap: true, comment: 'block' });
    targetFile.writeFileContent(fileName, content);

    return targetFile.render();
}

function extractVars(source, placeholderRegExp) {
    const res = [];
    let chunk;
    while ((chunk = placeholderRegExp.exec(source)) !== null) res.push(chunk[1]);

    return res;
}
