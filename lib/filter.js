'use strict';

var Helper = require('./helper');


var Filter = module.exports = exports = function Filter(rootLevel) {
	this._levels = { '*': Helper.levelNumber(rootLevel) || 0 };
};


Filter.prototype.getLevel = function getLevel(groupId) {
	return this._levels[groupId];
};


Filter.prototype.getLevels = function getLevels() {
	return this._levels;
};


Filter.prototype.parse = function parse(value) {
	if (!value) {
		return;
	}

	if (typeof value !== 'string') {
		throw new Error('cannot parse "' + value + '"');
	}

	var self = this;
	value.split(/[,;\s]+/).forEach(function(entry) {
		if (!entry.length) {
			return;
		}

		var elements = entry.split(/[:=]/);
		try {
			if (elements.length !== 2) {
				throw new Error('wrong syntax; expected "a.b.c=level or a.b.c:level"');
			}

			self.setLevel(elements[0], elements[1]);
		}
		catch (e) {
			throw new Error('invalid entry "' + entry + '" (' + e.message + ').');
		}
	});
};


Filter.prototype.resolveLevel = function resolveLevel(groupId) {
	groupId = groupId || 'unknown';

	var list = this._levels;
	if (groupId in list) {
		return list[groupId];
	}

	var parentGroupId = groupId;
	for (var dotIndex = parentGroupId.lastIndexOf('.'); dotIndex >= 0; dotIndex = parentGroupId.lastIndexOf('.')) {
		parentGroupId = parentGroupId.substring(0, dotIndex);
		if (parentGroupId in list) {
			return list[parentGroupId];
		}
	}

	return list['*'];
};


Filter.prototype.setLevel = function setLevel(groupId, level) {
	if (groupId !== '*' && !Helper.isValidGroupId(groupId)) {
		throw new Error('invalid group id "' + groupId + '"');
	}

	if (level !== undefined) {
		this._levels[groupId] = Helper.levelNumber(level);
	}
	else {
		if (groupId === '*') {
			throw new Error('group id "*" must have a value');
		}

		delete this._levels[groupId];
	}
};
