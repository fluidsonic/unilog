'use strict';

var Console = require('unilog-console');

if (!global._unilog_console) {
	global._unilog_console = new Console();
}


var Logger = module.exports = exports = function Logger(groupId, mod) {
	this._groupId = sanitizeGroupId(groupId) || null;
	this._module = mod || null;
};


Logger.prototype.eventEnabled = function eventEnabled(event) {
	event.callee = event.callee || eventEnabled;
	return this.getFinalTarget().eventEnabled(this.prepareEvent(event));
};


Logger.prototype.getConsole = function getConsole() {
	return global._unilog_console;
};


Logger.prototype.getFinalTarget = function getFinalTarget() {
	var globalTarget;
	if (globalTarget && globalTarget !== this) {
		return globalTarget;
	}

	return global._unilog_console;
};


Logger.prototype.getGlobalTarget = function getGlobalTarget() {
	return global.unilogTarget;
};


Logger.prototype.prepareEvent = function prepareEvent(event) {
	event.groupId = event.groupId || this._groupId;
	event.module = event.module || this._module;

	return event;
};


Logger.prototype.putEvent = function putEvent(event) {
	event.callee = event.callee || putEvent;
	return this.getFinalTarget().putEvent(this.prepareEvent(event));
};


Logger.prototype.setGlobalTarget = function setGlobalTarget(target) {
	global.unilogTarget = target;
};


Logger.prototype.withGroupId = function withGroupId(groupId) {
	return new Logger(groupId, null);
};


Logger.prototype.withModule = function withModule(mod) {
	return new Logger(null, mod);
};


// redirect <logLevel>(…)       -> putEvent()
// redirect <logLevel>Enabled() -> eventEnabled()

['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function(level) {
	Logger.prototype[level] = function x() {
		this.putEvent({
			callee:  x,
			level:   level,
			message: Array.prototype.slice.call(arguments),
		});
	};

	Logger.prototype[level + 'Enabled'] = function xEnabled() {
		this.eventEnabled({
			callee: xEnabled,
			level:  level,
		});
	};
});



function sanitizeGroupId(groupId) {
	if (!groupId) {
		return null;
	}

	return String(groupId).replace(/[^a-z0-9_.-]/gi, '_').replace(/^\.+|\.+$|(\.)\.+/g, '$1') || 'unknown';
}
