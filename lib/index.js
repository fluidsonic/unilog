'use strict';

var Config = require('./config');
var Helper = require('./helper');
var Logger = require('./logger');

Helper.config = new Config();

module.exports = exports = new Logger();

// expose some internals which other libraries can reuse
exports.Config = Config;
exports.Event = require('./event');
exports.Filter = require('./filter');
exports.Helper = Helper;
exports.Levels = require('./levels');
exports.Logger = Logger;
exports.Target = require('./target');
