"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let profiler = require('./profiler/profiler');
let nestedCounters = require('./profiler/nestedCounters');
let memoryReporting = require('./profiler/memoryReporting');
let statistics = require('./statistics/index');
exports.default = Object.assign(Object.assign(Object.assign(Object.assign({}, profiler), nestedCounters), memoryReporting), statistics);
//# sourceMappingURL=index.js.map