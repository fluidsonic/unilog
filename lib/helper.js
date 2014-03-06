'use strict';

var Levels = require('./levels');
var Path = require('path');
var Util = require('util');


var Helper = exports;


Helper.formatDate = function formatDate(date) {
	return date
		.toISOString()
		.replace('T', ' ')
		.replace('Z', ' Z');
};


Helper.formatMessage = function formatMessage(content) {
	if (Array.isArray(content)) {
		return content.map(this.formatMessageElement).join('');
	}

	return String(content);
};


Helper.formatMessageElement = function formatMessageElement(element) {
	if (typeof element === 'string') {
		return element;
	}

	return Util.inspect(element);
};


Helper.groupIdForFilePath = function groupIdForFilePath(filePath) {
	if (typeof filePath !== 'string' || filePath.length === 0) {
		return null;
	}

	// TODO .node_modules, .node_libraries, */lib/node

	var mainPath = Path.dirname(require.main.filename);
	var filePathWithoutExtension = filePath.replace(/\.[^/.]*$/, '');
	var relativePathWithoutExtension = Path.relative(mainPath, filePathWithoutExtension);
	var groupIdComponents = relativePathWithoutExtension.split(/[/\\]/);

	var nodeModulesIndex = groupIdComponents.lastIndexOf('node_modules');
	if (nodeModulesIndex >= 0) {
		groupIdComponents = groupIdComponents.slice(nodeModulesIndex + 1);
	}
	else if (groupIdComponents[0] === '..' || groupIdComponents[0] === '') {
		// TODO ../.., c:, d: ...
		groupIdComponents = groupIdComponents.slice(1);
	}
	else {
		groupIdComponents.unshift('main');
	}

	return groupIdComponents.map(this.sanitizeGroupIdComponent).join('.');
};


Helper.groupIdForModule = function grouIdpForModule(mod) {
	if (mod.unilogGroupId) {
		return mod.unilogGroupId;
	}

	return (mod.unilogGroupId = this.groupIdForFilePath(mod.filename));
};


Helper.isValidGroupId = function isValidGroupId(groupId) {
	return (typeof groupId === 'string' && groupId.match(/^([a-z0-9_-]+\.)*[a-z0-9_-]+$/i));
};


Helper.levelName = function levelName(number) {
	var name = levelsByNumber[number];
	if (name) {
		return name;
	}

	return String(number);
};


Helper.levelNumber = function levelNumber(name) {
	var number;
	if (typeof name === 'string') {
		number = Levels[name];
		if (!number) {
			var upperName = name.toUpperCase();
			number = (upperName !== 'OFF' ? Levels[upperName] : 0);
		}
	}
	else {
		number = name;
	}

	if (typeof number !== 'number') {
		throw new Error('Unknown log level "' + name + '".');
	}

	return number;
};


Helper.logInternal = function logInternal() {
	process.stderr.write('UNILOG: ');
	process.stderr.write(this.formatMessage(Array.prototype.slice.call(arguments)));
	process.stderr.write('\n');
};


Helper.resolveEventGroupId = function resolveEventGroupId(event) {
	var stackExamination = this.config.getStackExamination();
	if (stackExamination === 'always') {
		event.captureStack();
	}

	if (!event.deriveGroupId() && !event.stack && stackExamination === 'support') {
		if (event.captureStack()) {
			event.deriveGroupId();
		}
	}
};


Helper.sanitizeGroupId = function sanitizeGroupId(groupId) {
	if (!groupId) {
		return null;
	}

	return String(groupId).replace(/[^a-z0-9_.-]/gi, '_').replace(/^\.+|\.+$|(\.)\.+/g, '$1') || 'unknown';
};


Helper.sanitizeGroupIdComponent = function sanitizeGroupIdComponent(groupIdComponent) {
	if (!groupIdComponent) {
		return null;
	}

	return String(groupIdComponent).replace(/[^a-z0-9_-]/gi, '_').replace(/^_+|_+$|(_)_+/g, '$1') || '_';
};


// see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
Helper.stack = function stack(beginningFrameFunction) {
	var originalStackTrackLimit = Error.stackTraceLimit;
	var originalPrepareStackTrace = Error.prepareStackTrace;

	try {
		Error.stackTraceLimit = Infinity;
		Error.prepareStackTrace = function prepareStackTrace(dummy, stack) {
			return stack;
		};

		var dummy = {};
		Error.captureStackTrace(dummy, beginningFrameFunction || stack);
		return dummy.stack;
	}
	finally {
		Error.prepareStackTrace = originalPrepareStackTrace;
		Error.stackTraceLimit = originalStackTrackLimit;
	}
};



var levelsByNumber = {};
Object.keys(Levels).forEach(function(levelName) {
	levelsByNumber[Levels[levelName]] = levelName;
});
