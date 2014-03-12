var os           = require('os');
var inherits     = require('util').inherits;
var proc         = require('child_process');
var EventEmitter = require('events').EventEmitter;
var uuid         = require('node-uuid').v4;


module.exports = BrowserstackTunnel;

function BrowserstackTunnel(stage, user, key, identifier) {
  EventEmitter.call(this);
  this.stage = stage;
  this.user = user;
  this.key = key;
  this.identifier = identifier || uuid();
}

inherits(BrowserstackTunnel, EventEmitter);

BrowserstackTunnel.prototype.openTunnel = function(callback) {
  var me = this;

  var execPath = process.env.BROWSERSTACK_LOCAL_PATH || browserStackLocalPath();

  var args = [];
  if (this.identifier)
    args.push("-localIdentifier", this.identifier);

  args.push(this.key);

  var hostname = 'localhost';
  var port = '8080';
  var ssl = '0';
  args.push([hostname, port, ssl].join(','));

  args.push('-skipCheck');

  this.proc = this.stage.command(execPath, args, { silent: true, background: true });
  this.proc.stdout.setEncoding('utf8');
  var calledBack = false;

  this.proc.stdout.on('data', function(d) {
    process.stdout.write(('[BROWSERSTACK] tunnel data:' + d).green);

    var data = typeof d !== 'undefined' ? d.toString() : '';
    if (typeof data === 'string' && !data.match(/^\[-u,/g)) {
      me.emit('verbose:debug', data.replace(/[\n\r]/g, ''));
    }
    if (typeof data === 'string' && data.match(/Press Ctrl-C to exit/)) {
      me.emit('verbose:ok', '=> Browserstack Tunnel established');
      if (!calledBack) {
        calledBack = true;
        callback();
      }
    }
  });

  this.proc.stderr.on('data', function(data) {
    me.emit('log:error', data.toString().replace(/[\n\r]/g, ''));
  });

  this.proc.on('close', function(code) {
    me.emit('verbose:ok', '[BROWSERSTACK] Tunnel disconnected ', code);
    if (!calledBack) {
      calledBack = true;
      callback(new Error('[BROWSERSTACK] tunnel disconnected'));
    }
  });
};

BrowserstackTunnel.prototype.start = function(callback) {
  var me = this;
  this.emit('verbose:writeln', "=> Browserstack trying to open tunnel".inverse);
  this.openTunnel(callback);
};


function browserStackLocalPath() {
  var platformDir = os.platform() + '-' + os.arch();
  return __dirname + '/bin/browserstack/' + platformDir + '/BrowserStackLocal';
}