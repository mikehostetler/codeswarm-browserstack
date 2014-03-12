var async   = require('async');
var wd      = require('browserstack-webdriver');
var resultParsers = require('./result_parsers');

var TEST_TIMEOUT_SECS = 60 * 45; // 45 minutes
var POLL_FREQ_MS = 10 * 1000; // 10 seconds

module.exports = test;

///TestRunner.prototype.runTest = function(browsers, url, framework, tunnelIdentifier, testname, tags, build, callback){


function test(build, stage, config, context) {

  stage.fakeCommand('starting tests in Browserstack');

  if (! config.files) return stage.error(new Error('Need config.files'));

  var tunnel = context.browserstack && context.browserstack.tunnel;
  if (! tunnel) return stage.error(new Error('No tunnel is set up'));

  var framework = config.framework;
  if (! framework) return stage.error(new Error('Need config.framework'));

  var urls = config.files.split('\n').map(trim).map(fileToURL);

  var browsers = config.browsers;
  if (! browsers) return stage.error(new Error('Need config.browsers'));
  if (! Array.isArray(browsers)) browsers = [browsers];
  var platforms = parsePlatforms(browsers);

  async.map(urls, testOneUrl, done);

  function testOneUrl(url, cb) {
    async.map(platforms, testOneUrlOneBrowser.bind(null, url), cb);
  }

  function testOneUrlOneBrowser(url, browser, cb) {

    var calledback = false;
    function callback() {
      if (! calledback) {
        calledback = true;
        cb.apply(null, arguments);
      }
    }

    var capabilities = {
      'os': browser.os,
      'os_version': browser.os_version,
      'browser': browser.browser,
      'browser_version': browser.browser_version,
      'browserstack.user' : config.browserstack_username,
      'browserstack.key' : config.browserstack_key,
      'browserstack.local': true,
      'browserstack.localIdentifier': context.browserstack.tunnel.identifier
    };

    var worker = new wd.Builder().
      usingServer('http://hub.browserstack.com/wd/hub').
      withCapabilities(capabilities).
      build();


    console.log('[browserstack] TESTING URL %j on %j', url, browser);
    worker.get(url).then(scheduleWorkerPoll, callback);

    /// Polling for end

    function scheduleWorkerPoll() {
      setTimeout(pollWorker, POLL_FREQ_MS);
    }

    function pollWorker() {
      console.log('polling worker...');
      worker.eval('window.__codeswarm && window.__codeswarm.ended').then(gotPollResults, callback);
    }

    function gotPollResults(ended) {
      console.log('poll results: %j', ended);
      if (ended) testEnded();
      else scheduleWorkerPoll();
    }

    function testEnded() {
      worker.eval('window.__codeswarm && window.__codeswarm.results').then(gotResults, callback);
    }

    function gotResults(results) {
      worker.quit();
      callback(null, results);
    }
  }


  /// Test ended

  function done(err, results) {
    if (err) stage.error(err);

    var failed = false;

    results = parseResults(results);

    if (results.errors.length)
      stage.error(new Error(results.errors.join('\n')));

    stage.end({browsers: results.results});
  }

  function parseResults(results) {
    var url, urlResult, browser, browserResult;
    var finalResults = {}, errors = [];
    for(var urlIndex = 0 ; urlIndex < urls.length; urlIndex ++) {
      url = urls[urlIndex];
      urlResult = results[urlIndex];
      finalResults[url] = {};
      for(var browserIndex = 0 ; browserIndex < browsers.length;  browserIndex ++) {
        browser = browsers[browserIndex];
        browserResult = urlResult[browserIndex];
        finalResults[url][browser] = browserResult;

        if (browserResult && browserResult.results && browserResult.results.failed) {
          errors.push(
            'Tests on browser ' + browser +
            ' had ' + browserResult.results.failed + ' failures: ' +
            (browserResult.errors || ['unknown']).join('\n'));

        }
      }
    }

    return {
      errors: errors,
      results: finalResults
    };
  }

};

/// Misc

function testName(build) {
  return 'CodeSwarm: Testing ' + build.project + ', branch ' + build.branch + ', commit ' + build.commit;
}

function trim(s) {
  return s.trim();
}

function fileToURL(file) {
  if (file.charAt(0) != '/') file = '/' + file;
  return 'http://localhost:8080' + file;
}

function parsePlatforms(browsers){
  return browsers.map(function(browser){
    var parts = browser.split('-');
    return {
      os: parts[0],
      os_version: parts[1],
      browser: parts[2],
      browser_version: parts[3]
    };
  });
};
