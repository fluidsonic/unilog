'use strict';

var unilog = require('../../lib');


module.exports = function capture(task, result) {
	var originalTarget = unilog.getGlobalTarget();
	var enabledEvents = [];
	var putEvents = [];

	unilog.setGlobalTarget({
		eventEnabled: function eventEnabled(event) {
			enabledEvents.push(event);
			return true;
		},

		putEvent: function putEvent(event) {
			putEvents.push(event);
		},
	});

	try {
		task();
	}
	finally {
		unilog.setGlobalTarget(originalTarget);
	}

	result(putEvents, enabledEvents);
};
