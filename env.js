var BrowserstackTunnel = require('./browserstack_tunnel');

module.exports = env;

function env(build, stage, config, context) {
  context.browserstack = {};
  context.browserstack.tunnel =
    new BrowserstackTunnel(stage, config.browserstack_username, config.browserstack_key);

  context.browserstack.tunnel.start(started);

  function started(err) {
    console.log('[codeswarm-browser] TUNNEL STARTED'.green, err);
    if (err) stage.error(err);
    stage.end();
  }
}