module.exports = {
    'extends': 'standard',
    'plugins': [
        'standard'
    ],
    'rules': {
       'indent': ['error', 4, { "SwitchCase": 1 }],
       'one-var': ['off'],
       'semi': ['error', 'always'],
       'eol-last': ['error', 'always'],
       'no-multiple-empty-lines': ['error', {'max': 2, 'maxEOF': 0, 'maxBOF': 0}],
       'no-trailing-spaces': ['error'],
       'array-callback-return': ['error'],
       'complexity': ['error', 10],
       'max-len': ['error', 120, 0],
       'max-params': ['error', 5],
       'max-statements': ['error', 20],
       'max-depth': ['error', 2],
       'curly': 'error',
       'default-case': 'error',
       'radix': 'error',
       'camelcase': 'error',
       'require-jsdoc': ['error', {
           'require': {
               'FunctionDeclaration': true,
               'MethodDefinition': true,
               'ClassDeclaration': true
           }
       }],
       'valid-jsdoc': 'error',
       'padded-blocks': ['off']
    }
};
