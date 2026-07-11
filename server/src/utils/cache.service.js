const NodeCache = require("node-cache");

// seconds - 5 minutes
const TTL = 60 * 5;

const cache = new NodeCache({
  stdTTL: TTL,
  checkperiod: 120,
  useClones: false, //perf
});

module.exports = cache;
