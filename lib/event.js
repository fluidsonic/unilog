'use strict';

var Helper = require('./helper');


var Event = module.exports = exports = function Event(data) {
	this.callee = data.callee;
	this.date = data.date || new Date();
	this.filePath = data.filePath;
	this.formattedMessage = null;
	this.formattedTimestamp = null;
	this.groupId = data.groupId;
	this.lineNumber = data.lineNumber;
	this.message = data.message;
	this.module = data.module;
	this.level = data.level;
	this.stack = data.stack;
};


Event.prototype.captureStack = function captureStack() {
	if (!this.stack && this.callee) {
		this.stack = Helper.stack(this.callee);
	}

	return this.stack;
};


Event.prototype.deriveFormattedDate = function deriveFormattedDate() {
	if (!this.formattedDate) {
		this.formattedDate = Helper.formatDate(this.date);
	}

	return this.formattedDate;
};


Event.prototype.deriveFormattedMessage = function deriveFormattedMessage() {
	if (!this.formattedMessage) {
		this.formattedMessage = Helper.formatMessage(this.message);
	}

	return this.formattedMessage;
};


Event.prototype.deriveGroupId = function deriveGroupId() {
	if (this.groupId) {
		return;
	}

	if (this.module) {
		this.groupId = Helper.groupIdForModule(this.module);
	}
	else {
		this.deriveLocation();
		this.groupId = Helper.groupIdForFilePath(this.filePath);
	}

	return this.groupId;
};


Event.prototype.deriveLocation = function deriveFilePathAndLineNumber() {
	if (this.filePath && this.lineNumber) {
		return;
	}

	var stack = this.stack;
	if (stack && stack.length) {
		var lastFrame = stack[0];
		this.filePath = lastFrame.getFileName();
		this.lineNumber = lastFrame.getLineNumber();
	}
	else if (this.module && !this.filePath) {
		this.filePath = this.module.filename;
	}
};
