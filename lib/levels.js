'use strict';

module.exports = {
	FATAL: 10,  // Very severe problems which most likely leads to application abort.
	ERROR: 20,  // Severe problems which cause the application to fail partially.
	WARN:  30,  // Problems which are potentially harmful but does not directly affect the application.
	INFO:  40,  // Coarse informational messages about the overall application progress.
	DEBUG: 50,  // Detailed messages about the application progress useful during development.
	TRACE: 60,  // Very detailed messages about the application progress useful during development.
};
