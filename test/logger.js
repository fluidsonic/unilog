'use strict';

var capture = require('./helpers/capture');
var expect = require('expect.js');
var Logger = require('../lib/logger');
var Path = require('path');


describe('Logger', function() {

	describe('#eventEnabled()', function() {

		it('sends to console by default', function() {
			var originalConsole = global._unilog_console;

			var receivedEvent;
			global._unilog_console = {
				eventEnabled: function eventEnabled(event) {
					expect(receivedEvent).to.not.be.ok();
					receivedEvent = event;
					return false;
				}
			};

			var event = {};
			var result = new Logger().eventEnabled(event);

			global._unilog_console = originalConsole;

			expect(result).to.be.equal(false);
			expect(receivedEvent).to.be.equal(event);
		});

		it('sets callee if none given', function() {
			var event = {};
			var logger = new Logger();

			capture(function() {
				logger.eventEnabled(event);
			}, function(putEvents, enabledEvents) {
				expect(putEvents.length).to.be.equal(0);
				expect(enabledEvents.length).to.be.equal(1);

				expect(enabledEvents[0].callee).to.be.equal(logger.eventEnabled);
			});
		});

		it('keeps callee if given', function callee() {
			var event = { callee: callee };
			var logger = new Logger();

			capture(function() {
				logger.eventEnabled(event);
			}, function(putEvents, enabledEvents) {
				expect(putEvents.length).to.be.equal(0);
				expect(enabledEvents.length).to.be.equal(1);

				expect(enabledEvents[0].callee).to.be.equal(callee);
			});
		});
	});

	describe('#getConsole()', function() {

		it('returns a console back-end', function() {
			var backend = new Logger().getConsole();

			expect(backend.config).to.be.a('function');
			expect(backend.eventEnabled).to.be.a('function');
			expect(backend.putEvent).to.be.a('function');
		});
	});

	describe('#getFinalTarget()', function() {

		it('returns global.unilogTarget if set', function() {
			global.unilogTarget = {};
			expect(new Logger().getFinalTarget()).to.be.equal(global.unilogTarget);
			global.unilogTarget = null;
		});

		it('returns console if global.unilogTarget is self', function() {
			var logger = new Logger();
			global.unilogTarget = logger;
			expect(logger.getFinalTarget()).to.be.equal(global._unilog_console);
			global.unilogTarget = null;
		});

		it('returns console if global.unilogTarget is falsy', function() {
			global.unilogTarget = null;
			expect(new Logger().getFinalTarget()).to.be.equal(global._unilog_console);
		});
	});

	describe('#getGlobalTarget()', function() {

		it('returns global.unilogTarget', function() {
			global.unilogTarget = {};
			expect(new Logger().getGlobalTarget()).to.be.equal(global.unilogTarget);
			global.unilogTarget = null;
		});
	});

	describe('#putEvent()', function() {

		it('sends to console by default', function() {
			var originalConsole = global._unilog_console;

			var receivedEvent;
			global._unilog_console = {
				putEvent: function putEvent(event) {
					expect(receivedEvent).to.not.be.ok();
					receivedEvent = event;
				}
			};

			var event = {};
			new Logger().putEvent(event);

			global._unilog_console = originalConsole;

			expect(receivedEvent).to.be.equal(event);
		});

		it('sets callee if none given', function() {
			var event = {};
			var logger = new Logger();

			capture(function() {
				logger.putEvent(event);
			}, function(putEvents, enabledEvents) {
				expect(putEvents.length).to.be.equal(1);
				expect(enabledEvents.length).to.be.equal(0);

				expect(putEvents[0].callee).to.be.equal(logger.putEvent);
			});
		});

		it('keeps callee if given', function callee() {
			var event = { callee: callee };
			var logger = new Logger();

			capture(function() {
				logger.putEvent(event);
			}, function(putEvents, enabledEvents) {
				expect(putEvents.length).to.be.equal(1);
				expect(enabledEvents.length).to.be.equal(0);

				expect(putEvents[0].callee).to.be.equal(callee);
			});
		});
	});

	describe('#setGlobalTarget()', function() {

		it('sets global.unilogTarget', function() {
			var newTarget = {};
			new Logger().setGlobalTarget(newTarget);
			expect(global.unilogTarget).to.be.equal(newTarget);
			global.unilogTarget = null;
		});
	});

	describe('#withGroupId()', function() {

		it('returns a new logger', function() {
			var logger = new Logger();
			var boundLogger = logger.withGroupId('test');

			expect(boundLogger).to.not.be.equal(logger);
		});

		it('sets groupId for eventEnabled()', function() {
			var logger = new Logger().withGroupId('test');

			capture(function() {
				logger.eventEnabled({});
			}, function(putEvents, enabledEvents) {
				expect(enabledEvents.length).to.be.equal(1);

				expect(enabledEvents[0].groupId).to.be.equal('test');
			});
		});

		it('sets groupId for putEvent()', function() {
			var logger = new Logger().withGroupId('test');

			capture(function() {
				logger.putEvent({});
			}, function(putEvents) {
				expect(putEvents.length).to.be.equal(1);

				expect(putEvents[0].groupId).to.be.equal('test');
			});
		});

		it('sanitizes group ID', function() {
			var logger = new Logger().withGroupId('a..b#c,:d');

			capture(function() {
				logger.putEvent({});
			}, function(putEvents) {
				expect(putEvents.length).to.be.equal(1);

				expect(putEvents[0].groupId).to.be.equal('a.b_c_d');
			});
		});

		it('sanitizes quasi-empty group ID', function() {
			var logger = new Logger().withGroupId('...');

			capture(function() {
				logger.putEvent({});
			}, function(putEvents) {
				expect(putEvents.length).to.be.equal(1);

				expect(putEvents[0].groupId).to.be.equal('unknown');
			});
		});
	});

	describe('#withModule()', function() {

		it('returns a new logger', function() {
			var logger = new Logger();
			var boundLogger = logger.withModule(module);

			expect(boundLogger).to.not.be.equal(logger);
		});

		it('sets module for eventEnabled()', function() {
			var logger = new Logger().withModule(module);

			capture(function() {
				logger.eventEnabled({});
			}, function(putEvents, enabledEvents) {
				expect(enabledEvents.length).to.be.equal(1);

				expect(enabledEvents[0].module).to.be.equal(module);
			});
		});

		it('sets module for putEvent()', function() {
			var logger = new Logger().withModule(module);

			capture(function() {
				logger.putEvent({});
			}, function(putEvents) {
				expect(putEvents.length).to.be.equal(1);

				expect(putEvents[0].module).to.be.equal(module);
			});
		});
	});

	describe('#<level>()', function() {

		['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function(level) {
			it(level + '() calls back-end\'s putEvent() with level + message', function() {
				var logger = new Logger();

				capture(function() {
					logger[level]('just', { a: 'test' });
				}, function(putEvents) {
					expect(putEvents.length).to.be.equal(1);

					expect(putEvents[0].level).to.be.equal(level);
					expect(putEvents[0].message).to.be.eql(['just', { a: 'test' }]);
				});
			});
		});
	});

	describe('#<level>Enabled()', function() {

		['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function(level) {
			it(level + 'Enabled() calls back-end\'s eventEnabled() with level', function() {
				var logger = new Logger();

				capture(function() {
					logger[level + 'Enabled']();
				}, function(putEvents, enabledEvents) {
					expect(enabledEvents.length).to.be.equal(1);

					expect(enabledEvents[0].level).to.be.equal(level);
				});
			});
		});
	});

	describe('other tests', function() {
		
		it('re-uses other unilog\'s console', function() {
			var PreviousLogger = require('../lib/logger');
			unloadLoggerModule();

			var fakeConsole = {};
			global._unilog_console = fakeConsole;
			var NewLogger = require('../lib/logger');

			expect(NewLogger).to.not.be.equal(PreviousLogger);
			expect(new NewLogger().getConsole()).to.be.equal(fakeConsole);


			function unloadLoggerModule() {
				var moduleCache = require('module')._cache;
				var loggerFilePath = Path.normalize(Path.join(__dirname, '../lib/logger.js'));

				Object.keys(moduleCache).forEach(function(filePath) {
					if (Path.normalize(filePath) === loggerFilePath) {
						delete moduleCache[filePath];
					}
				});
			}
		});
	});
});
