module.exports = {
  jasmine: function(result){
    return result.passed;
  },
  qunit: function(result){
    if (result.passed === undefined){ return undefined; }
    return result.passed == result.total;
  },
  mocha: function(result){
    if (result.passes === undefined){ return undefined; }
    return result.failures === 0;
  },
  'YUI Test': function(result){
    if (result.passed === undefined){ return undefined; }
    return result.passed == result.total;
  }
};