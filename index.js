module.exports = {
  workerImage: 'browser',
  env:         require('./env'),
  prepare:     require('./prepare'),
  test:        require('./test'),
  config:      require('./config')
};