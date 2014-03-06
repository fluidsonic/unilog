'use strict';

var Filter = require('./filter');
var Helper = require('./helper');
var Levels = require('./levels');
var Target = require('./target');


var Config = module.exports = exports = function Config() {
	// parse environment variable early so that errors show up during startup
	this.getFilter();
};


Config.prototype.getFilter = function getFilter() {
	var storage = this.getStorage();
	if (!storage.filter) {
		storage.filter = new Filter(Levels.INFO);
		try {
			storage.filter.parse(process.env.UNILOG);
		}
		catch (e) {
			Helper.logInternal('Error in environment variable: ', e.message);
		}
	}

	return storage.filter;
};


Config.prototype.getStackExamination = function getStackExamination() {
	return (this.getStorage().stackExamination || 'always');
};


Config.prototype.getStorage = function getStorage() {
	return (global.unilog || (global.unilog = {}));
};


Config.prototype.getTarget = function getTarget() {
	return (this.getStorage().target || new Target());
};
