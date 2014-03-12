var browsers   = require('./browsers');
var frameworks = require('./frameworks');

module.exports = [
  {
    name: 'browserstack_username',
    label: 'Browserstack username',
    type: 'string',
    required: true
  },
  {
    name: 'browserstack_key',
    label: 'Browserstack access key',
    type: 'string',
    required: true
  },
  {
    name: 'files',
    label: 'Test files (one per line)',
    type: 'text',
    required: true
  },
  {
    name: 'framework',
    label: 'Framework',
    type: 'selectOne',
    from: frameworks
  },
  {
    name: 'types',
    label: 'File types',
    type: 'selectMultiple',
    from: [
      'php'
    ]
  },
  {
    name: 'before_script',
    label: 'Before test scripts (one per line)',
    type: 'text'
  },
  {
    name: 'browsers',
    label: 'Browsers',
    type: 'selectMultiple',
    from: browsers
  }
];
