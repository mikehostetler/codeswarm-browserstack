var async = require('async');

module.exports = prepare;

function prepare(build, stage, config, context) {

  async.series([
    runBeforeScripts,
    startGateway
  ], done);

  function runBeforeScripts(cb) {
    if (config.before_script) {
      var scripts = config.before_script.split('\n').map(trim);
      async.eachSeries(scripts, runScript, cb);

    } else cb();

    function runScript(script, cb) {
      stage.command('bash', ['-c', script]).once('close', onCommandClose);

      function onCommandClose(code) {
        if (code != 0) cb(new Error('Exit code: ' + code));
        else cb();
      }
    }
  }

  function startGateway(cb) {
    var types = config.types || [];
    if (!Array.isArray(types)) types = [types];

    var args = [];
    types.forEach(function(type) {
      args.push('--type', type);
    });

    args.push('--docroot', '.');

    args.push('--port', '8080');

    var files = config.files;
    if (! Array.isArray(files)) files = [files];
    files.forEach(function(file) {
      args.push('--inject', file + ':' + config.framework);
    });

    var gateway = stage.command('codeswarm-gateway', args, { background: true });
    gateway.stdout.setEncoding('utf8');
    gateway.stdout.on('data', onGatewayData);

    var success = false;
    var out = '';
    function onGatewayData(d) {
      console.log('[GATEWAY] %s'.yellow, d);
      if (! success) {
        out += d;
        detectSuccess();
      }
    }

    function detectSuccess() {
      var match = out.match(/listening on port/);
      if (match) {
        success = true;
        cb();
      }
    }
  }


  function done(err) {
    if (err) stage.error(err);
    stage.end();
  }

}


/// Misc

function trim(s) {
  return s.trim();
}