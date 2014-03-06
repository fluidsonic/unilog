'use strict';

var Event = require('./event');
var Helper = require('./helper');
var Levels = require('./levels');


var Logger = module.exports = exports = function Logger(group, mod) {
	this.group = Helper.sanitizeGroupId(group) || null;
	this.module = mod || null;
};


Logger.prototype.eventEnabled = function eventEnabled(event) {
	event.callee = event.callee || eventEnabled;
	return this.getTarget().eventEnabled(this.extendEvent(event));
};


Logger.prototype.extendEvent = function extendEvent(event) {
	event.group = event.group || this._group;
	event.mod = event.mod || this._mod;

	return event;
};


Logger.prototype.getTarget = function getTarget() {
	return Helper.config.getTarget();
};


Logger.prototype.levelEnabled = function levelEnabled(level) {
	return this.eventEnabled(new Event({
		callee: levelEnabled,
		level:  level,
	}));
};


Logger.prototype.put = function put(level /*, ... */) {
	return this.putEvent(new Event({
		callee:  put,
		level:   level,
		message: Array.prototype.slice.call(arguments, 1),
	}));
};


Logger.prototype.putEvent = function putEvent(event) {
	event.callee = event.callee || putEvent;
	return this.getTarget().putEvent(this.extendEvent(event));
};


Logger.prototype.withGroupId = function withGroupId(groupId) {
	return new Logger(groupId, null);
};


Logger.prototype.withModule = function withModule(mod) {
	return new Logger(null, mod);
};


// redirect <logLevel>(…)       -> putEvent(<logLevel>, …)
// redirect <logLevel>Enabled() -> levelEnabled(<logLevel>)

Object.keys(Levels).forEach(function(levelName) {
	var levelNumber = Levels[levelName];
	var lowercaseLevelName = levelName.toLowerCase();

	Logger.prototype[lowercaseLevelName] = function putX() {
		this.putEvent(new Event({
			callee:  putX,
			level:   levelNumber,
			message: Array.prototype.slice.call(arguments),
		}));
	};

	Logger.prototype[lowercaseLevelName + 'Enabled'] = function xEnabled() {
		this.eventEnabled(new Event({
			callee: xEnabled,
			level:  levelNumber,
		}));
	};
});
