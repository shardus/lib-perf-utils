let profiler = require('./profiler/profiler')
let nestedCounters = require('./profiler/nestedCounters')
let memoryReporting = require('./profiler/memoryReporting')
let statistics = require('./statistics/index')

export default {...profiler, ...nestedCounters, ...memoryReporting, ...statistics}
