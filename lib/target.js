'use strict';

var Helper = require('./helper');
var Levels = require('./levels');


var Target = module.exports = exports = function Target() {};


Target.prototype.eventEnabled = function eventEnabled(event) {
	Helper.resolveEventGroupId(event);

	var levelNumber = Helper.levelNumber(event.level);
	var maximumLevel = Helper.config.getFilter().resolveLevel(event.groupId);
	return (levelNumber <= maximumLevel);
};


Target.prototype.putEvent = function putEvent(event) {
	Helper.resolveEventGroupId(event);

	if (!this.eventEnabled(event)) {
		return;
	}

	var message = event.deriveFormattedMessage();
	var levelName = Helper.levelName(event.level);
	var date = event.deriveFormattedDate();

	var out = (event.level >= Levels.INFO ? process.stdout : process.stderr);
	out.write(date);
	out.write(' | ');
	out.write(paddedLevelName(levelName));
	out.write(' | ');
	out.write(message);
	out.write('\n');
};



function paddedLevelName(levelName) {
	if (levelName.length >= 5) {
		return levelName;
	}

	return ('      ' + levelName).slice(-5);
}
