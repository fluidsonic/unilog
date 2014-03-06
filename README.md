unilog
======

A unified yet simple logging interface for node.js.

**WARNING** Version 0.0.1 is work-in-progress.


Quickstart
----------

```javascript
var log = require('unilog').withModule(module);

log.trace('foo called', { willBe: 'inspected' });
log.debug('will inspect everything ', 123, ' no matter ', { where: '!' });
log.info('info event');
log.warn(anyStuffCanBeLogged);
log.error('error event ', error);
log.fatal('fatal problem event: ', error);

// do complex stuff only if the event is actually consumed somewhere
if (log.traceEnabled()) {  // xyzEnabled() also available for debug, info, etc.
	log.trace(megaComplexFunctionForDebuggingPurposes());
}
```

You can also redirect other module's logging output caused by [debug](https://github.com/visionmedia/debug), [nlogger](https://github.com/igo/nlogger) and
[console](http://nodejs.org/api/stdio.html) to unilog:


```javascript
require('unilog-nexus')();  // as early as possible in your project
```

See the [unilog-nexus](https://github.com/fluidsonic/unilog-nexus) project for further details.


Goals
-----

This project has three goals to make logging in node.js projects a breeze:

1. Agree on a simple common logging API.
2. Allow log event redirection.
3. Be a basic logging module on its own.


### Simple Common API

There are a lot of different logging modules out there and you cannot just swap one with another since their API usually differs a lot.

If the community can agree on a common API then every logging module can rely on it. Developers will be able to easily swap one logging module with another.


### Log Event Redirection

node.js modules are loosely coupled and the same module (e.g. a logging module) can be loaded multiple times (even in different versions). The logging is also scattered across the module dependency tree.

Event redirection allows separating the logging front-end from the logging back-end.
- The front-end is the API used by a developer to log something and the developer usually doesn't care how the log event is handled, i.e. whether it's logged at all and where and how.
- The back-end is another simple API where all log events will be passed in a consistent and structured way. The project maintainer can decide which module the log events will be sent to. There could be one back-end module which logs events to a file on disk. Another one could send them over the network to a logging server.

Let's say for example you rely on various modules which log to unilog. By default all of them will log directly to the console. Using event redirection you can tell unilog to globally redirect all log events to another module! No need to hook anything or to replace unilog in every single module which uses it.

The same is true for any other logging modules which adapt the common API.

And since unilog is both a front-end and a back-end, you can use it as back-end for other logging modules too and redirect their output to unilog.


### Be a Basic Logging Module

In many cases you just want a quick and easy way to log something, e.g. if you write a library module or just test something.

unilog is both, a logging front-end and a logging back-end, as it implements both APIs. Unless you redirect unilog's events somewhere else, everything will be logged to the console. There's no need to install other modules unless you want to do more sophisticated stuff.



API
---

### Front-End

These are for you if you log something (or if you create your own logging front-end).


#### `.debug(…)`, `.error(…)`, `.fatal(…)`, `.info(…)`, `.trace(…)` and `.warn(…)`

Logs a new event with the respective log level.

Multiple arguments can be passed. It's up to the back-end to decide how the arguments will be presented to the developer, e.g. when outputting to the console or to a file. It's recommended to that all arguments will be converted to a string using introspection (e.g. `util.inspect`) and then concatenated without any separators. That allows simple yet flexible logging like in the following example:

```javascript
log.error('Failed to update ', failCount, ' element(s): ', error);
```

`Error` objects should also have the stack trace printed.


#### `.put(level, …)`

A generic way to log an event with the respective log `level`, e.g. `log.put(Levels.DEBUG, 'my debug message')`.

See [debug() & others](#debug-error-fatal-info-trace-and-warn) for further details.


#### `.debugEnabled()`, `.errorEnabled()`, `.fatalEnabled()`, `.infoEnabled()`, `.traceEnabled()` and `.warnEnabled()`

Returns whether a log event for the respective log level will be consumed somewhere. Returns only `true` or `false`.

If for example the back-end does not consume any `trace()` events a check to `traceEnabled()` returns `false` and allows developers to save work which is only necessary for the `trace()` call. See [quickstart example](#quickstart).


#### `.levelEnabled(level)`

A generic way to check if an event with the respective log `level` will be consumed somewhere, e.g. `log.levelEnabled(Levels.DEBUG)`.

See [debugEnabled() & others](#debugenabled-errorenabled-fatalenabled-infoenabled-traceenabled-and-warnenabled) for further details.


#### `.withGroupId(groupId)`

Returns a new logger bound to the specified `groupId`.
Overwrites a previous binding to a module.


#### `.withModule(module)`

Returns a new logger bound to the specified `module`.
Overwrites a previous binding to a group ID.

**For performance reasons it is recommended to always use this method.** The module will be used to derive the group ID without having to examine the call stack which is expensive. It also provides the back-end with more context about the origin of log API calls.


### Back-End

These are for you if you create your own logging front-end or back-end.


#### `.putEvent(event)`

Logs a new log `event` or ignores it if `eventEnabled(event)` would return `false`. See [Events](#events) for details.


#### `.eventEnabled(event)`

Returns `true` if the given log `event` would be consumed by `putEvent(event)` or `false` if it will be ignored.

All `event` properties except `message` can have an effect on the result. You don't need to pass `event.message` to this method since its main purpose is to check whether it's necessary to generate a message whose construction may be expensive.


### Group IDs

Group IDs are similar to [Log4j's Named Hierarchy](http://logging.apache.org/log4j/2.x/manual/architecture.html#Logger_Hierarchy). For every log event a group ID will either be provided by the front-end or be derived from other information by the back-end.

Group IDs have the form `module.submodule.submodule.submodule` etc. which is usually derived from file path the module is located at. Their primary purpose is to allow the back-end to filter log events depending on their origin as well as log their origin where necessary.

The project's main module (which is usually the project directory's `index.js`) has the group ID `main.index`. Other submodules of the main project have their group ID built using the same scheme. `components/feed/downloader.js` within the main project for example would have the group ID `main.components.feed.downloader`.

Modules located in any `node_modules` directory (i.e. added using `npm`) will have the directory's name as top level group ID component. That is the same as the name of the npm package. All logging events originating from the `connect` module for example would have `connect.` as prefix, e.g. `connect.lib.proto` for `node_modules/connect/lib/proto.js`. If the `connect` module is loaded multiple times in the module dependency tree (maybe even in different versions) they will all share the same group IDs and thus make filtering simple.

Group IDs should be sanitized by both the front-end and the back-end. Components should only match `[a-zA-Z0-9_-]+` and be separated by dots. Unsupported characters should be replaced with a single underscore (e.g. `test$=foo` to `test_foo`).

If the group ID cannot be determined then `unknown` will be used.


### Events

The front-end translates calls to its log API into event objects which it then passes to the back-end. This way it can provide the back-end with information about the context in which the log event occurred, e.g. which module or where in the call stack.

Each event object can have the following properties:
- `callee` (**recommended**)  
  The function which initiated the log event, i.e. the API function. The reference is important since the back-end may examine the call stack to detect from which file and line the log API was called.
- `date` (optional)  
  The date the log event occurred. If not set, the back-end will use the current time when the event arrives at the back-end.
- `filePath` (optional)  
  The path of the file which called the log API. Usually the back-end can derive this information from the `module` property or from the `stack` & `callee` properties.
- `groupId` (optional)  
  The group ID can be used by the back-end to filter events from a specific source. The back-end can also derive it from the `filePath` property.
- `lineNumber` (optional)  
  The number of the line from which the log API was called. The back-end can derive this information from the `stack` & `callee` properties.
- `message` (**required**)  
  The actual log message. It can be either a string or an array of mixed parameters which can be inspected by the back-end. See [.debug() & others](#debug-error-fatal-info-trace-and-warn) for more details on log message arguments.
- `module` (**recommended**)  
  The module from which the log API call orginiated. It allows the back-end to access the origin file path and derive a group ID without doing expensive call stack investigations.
- `level` (**required**)
  The actual log level.
- `stack` (not recommended)  
  The stack trace is used to determine the origin of the log API call. Usually it's captured by the back-end and only if necessary as it is an expensive operation. The stack trace object must be one passed to [`Error.prepareStackTrace`](https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi) by V8.



Installation
------------

	$ npm install unilog



To-Do
-----

- support config
- support & document redirection
- document env var config
- add config flag to output group IDs or filePath+lineNumber
- maybe remove level constants and use simple strings
- document default console output behavior (format, stdout/err)
- fix group ID detection for modules located in directories `.node_modules`, `.node_libraries` and `*/lib/node`
- `put(level, …)` and `levelEnabled()` really necessary? JavaScript allows `log['debug'](…)`. Would simplify API!
- make unilog compatible with other front-ends (currently relies on `Event` class)
- add tests



License
-------

MIT
