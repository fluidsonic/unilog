unilog
======

[![Dependency Status](https://gemnasium.com/fluidsonic/unilog.png)](https://gemnasium.com/fluidsonic/unilog)
[![Code Climate](https://codeclimate.com/github/fluidsonic/unilog.png)](https://codeclimate.com/github/fluidsonic/unilog)
[![dependencies](https://sourcegraph.com/api/repos/github.com/fluidsonic/unilog/badges/dependencies.png)](https://sourcegraph.com/github.com/fluidsonic/unilog)

A unified yet simple log interface for node.js.



Quickstart
----------

### Logging

```javascript
var log = require('unilog').withModule(module);

log.trace('foo called', { willBe: 'inspected' });
log.debug('will inspect everything ', 123, ' no matter ', { where: '!' });
log.info('info event');
log.warn(anyStuffCanBeLogged);
log.error('errors will have stack printed automatically ', error);
log.fatal('fatal problem: ', error);

// do complex stuff only if the event is actually consumed somewhere
if (log.traceEnabled()) {  // xyzEnabled() also available for debug, info, etc.
	log.trace(megaComplexFunctionForDebuggingPurposes());
}
```

### Filtering

Using environment variable:

    $ export UNILOG='*:info main:trace mongodb:debug'
    $ node .

Also works programmatically:

```javascript
require('unilog').getConsole().config({
  levels: '*:info main:trace mongodb:debug'
});
```

See [unilog-console's .config(options)](https://github.com/fluidsonic/unilog-console#configoptions) and [group IDs](#group-ids) for more information.


### Redirect other libraries to unilog

You can also collect other module's log output caused by [debug](https://github.com/visionmedia/debug), [nlogger](https://github.com/igo/nlogger) and
[console](http://nodejs.org/api/stdio.html) and send it to unilog:

```javascript
require('unilog-nexus')();  // as early as possible in your project

// now console.log() will be sent to unilog.info() for example
```

See the [unilog-nexus](https://github.com/fluidsonic/unilog-nexus) project for further details.


### Redirect to other libraries

By default all log events will be printed nicely formatted to the console using [unilog-console](https://github.com/fluidsonic/unilog-console).

You can easily redirect all unilog events to a different target:

```javascript
require('unilog').setGlobalTarget(myOtherTarget);  // myOtherTarget must implement .eventEnabled() and .putEvent()
```

This does not just redirect unilog's output across all modules but also of all other log libraries which conform to the [common front-end API](#frontend).



Goals
-----

This project has three goals to make logging in node.js projects a breeze:

1. Agree on a simple common log API.
2. Enable global log redirection.
3. Be a simple log module on its own.


### Simple Common API

There are a lot of different log modules out there and you cannot just swap one with another since their APIs usually differ a lot.

If the community can agree on a common API then every log module can rely on it. Developers will be able to easily swap one log module with another or connect them however they like to.


### Log Event Redirection

Modules loaded by node.js are loosely coupled and the same module (e.g. a log module) can be loaded multiple times - even in different versions. Sources of log output are also scattered across the module dependency tree.

Event redirection allows separating the log front-end from the log back-end.
- The front-end is the API used by a developer to log something and the developer usually doesn't care how the log event is handled, i.e. whether it's logged at all and where and how.
- The back-end is another simple API where all log events will be passed to in a consistent and structured way. The project's maintainer (i.e. the main module) can decide which module the log events will be sent to. There could be one back-end module which logs events to a file on disk. Another one could send them over the network to a log server. A third one could combine the two previous ones.

Let's say for example you rely on various modules which log to unilog. By default all of them will log directly to the console. Using event redirection you can tell unilog to globally redirect all log events to another module! No need to hook anything or to replace unilog in every single module which uses it.

The same is true for any other log modules which adapt the common log API.

And since unilog is both a front-end and a back-end, you can use it as back-end for other log modules too and redirect their output to unilog.


### Be a Simple Log Module on its own

In many cases you just want a quick and easy way to log something, e.g. if you write a library module or you just test something.

unilog is both, a log front-end and a log back-end since it implements both APIs. Unless you redirect unilog's events somewhere else, everything will be logged to the console. There's no need to install other modules unless you want to do more sophisticated stuff.



API
---

### Front-End

This API is for developers who actually a log module to log something. It's also important if you create your own log front-end module.


#### `.debug(…)`, `.error(…)`, `.fatal(…)`, `.info(…)`, `.trace(…)` and `.warn(…)`

Logs a new event with the respective log level.

Multiple arguments can be passed. It's up to the back-end to decide how the arguments will be presented to the developer, e.g. when outputting to the console or to a file. It's recommended that the back-end stringifies all arguments using introspection (e.g. `util.inspect`) and then concatenates them without any separators. That allows simple yet flexible log statements like this:

```javascript
log.error('Failed to update ', failCount, ' element(s): ', error);
```

`Error` objects should also have the stack trace printed.


#### `.debugEnabled()`, `.errorEnabled()`, `.fatalEnabled()`, `.infoEnabled()`, `.traceEnabled()` and `.warnEnabled()`

Returns whether a log event for the respective log level will be consumed somewhere. Returns only `true` or `false`.

If for example the back-end does not consume any `trace()` events a check to `traceEnabled()` returns `false` and allows developers to save resource-intensive work which is only necessary for the `trace()` call. See [quickstart example](#logging).


#### `.setGlobalTarget(target)`

Sets the global variable `global.unilogTarget` to the given `target`, which is the log back-end where all log events should be sent to globally by all log modules which conform to the unilog API.

If `target` is falsy then all log modules send their log events to their default target or drop them if they don't have one.


### `.getGlobalTarget()`

Returns the current log target, i.e. `global.unilogTarget`.


#### `.withGroupId(groupId)`

Returns a new logger bound to the specified `groupId`.
Also resets a previous binding to a module.


#### `.withModule(module)`

Returns a new logger bound to the specified `module`.
Also resets a previous binding to a group ID.

**For performance reasons it is recommended to always use this method.** The module will be used to derive the group ID without having to examine the call stack which is expensive. It also provides the back-end with more context about the origin of log API calls.


### Back-End

This API is for developers who create an own log front-end or back-end module.


#### `.putEvent(event)`

Logs a new log `event` or ignores it if `eventEnabled(event)` would return `false`. See [Events](#events) for details.


#### `.eventEnabled(event)`

Returns `true` if the given log `event` would be consumed by `putEvent(event)` or `false` if it will be ignored.

All `event` properties except `message` can have an effect on the result. You don't need to pass `event.message` to this method since its main purpose is to check whether it's necessary to generate a message whose construction may be expensive.

It is okay for the back-end to store private properties in the event itself for caching purposes for the case the the same event passed to `eventEnabled()` is also passed to `putEvent()`.


### Group IDs

Group IDs are similar to [Log4j's Named Hierarchy](http://logging.apache.org/log4j/2.x/manual/architecture.html#Logger_Hierarchy). For every log event a group ID will either be provided by the front-end or be derived from other information available to the back-end.

Group IDs have the form `module.submodule.submodule.submodule` etc. which is usually derived from file path the module's file is located at. Their primary purpose is to allow the back-end to filter log events depending on their origin as well as log their origin if necessary.

The project's main module (which is usually the project directory's `index.js`) has the group ID `main.index`. Other submodules of the main project have their group ID built using the same scheme. `components/feed/downloader.js` within the main project for example would have the group ID `main.components.feed.downloader`.

Modules located in any `node_modules` directory (i.e. added using `npm`) will have the module directory's name as top level group ID component. That is the same as the name of the npm package. All log events originating from the `connect` module for example would have `connect.` as prefix, e.g. `connect.lib.proto` for `node_modules/connect/lib/proto.js`. If the `connect` module is loaded multiple times in the module dependency tree (maybe even in different versions) they will all share the same group IDs and thus make filtering simple.

Group IDs should be sanitized by both the front-end and the back-end. Components should only match `[a-zA-Z0-9_-]+` and be separated by dots. Unsupported characters should be replaced with a single underscore (e.g. `test$=foo` to `test_foo`).

If a module is neither located in the main project's directory tree nor recognized as any dependency module (`node_modules` in path) then it will start the with prefix `other.`. If the group ID cannot be determined then `unknown` will be used.

If a back-end allows filtering based on group ID, it should take the hierarchy into consideration, i.e. filtering only `error` events for module `main.test` should also apply to `main.test.a`, `main.test.a.b`.


### Events

The front-end translates calls to its log API into event objects which it then passes to the back-end. This way it can provide the back-end with information about the context in which the log event occurred, e.g. which module or where in the call stack.

Each event object can have the following properties:
- `callee` (**recommended**)  
  The function which initiated the log event, i.e. the front-end API function. This reference is important since the back-end may examine the call stack to detect from which file and line the log API was called.
- `date` (optional)  
  The date the log event occurred. If not set, the back-end will use the current date when the event arrives at the back-end.
- `filePath` (optional)  
  The path of the file which called the log API. Usually the back-end can derive this information from the `module` property or from the `stack` & `callee` properties.
- `groupId` (optional)  
  The group ID can be used by the back-end to filter events from a specific source. The back-end can also derive it from the `filePath` property.
- `lineNumber` (optional)  
  The number of the line from which the log API was called. The back-end can derive this information from the `stack` & `callee` properties if necessary.
- `message` (**required**)  
  The actual log message. It can be either a string or an array of mixed parameters which can be inspected by the back-end. See [.debug() & others](#debug-error-fatal-info-trace-and-warn) for more details on log message arguments.
- `module` (**recommended**)  
  The module from which the log API call orginiated. It allows the back-end to access the origin file path and derive a group ID without doing expensive call stack investigations.
- `level` (**required**)
  The actual [log level](#levels).
- `stack` (not recommended)  
  The stack trace is used to determine the origin of the log API call. Usually it's captured by the back-end and that only if necessary as it is an expensive operation. The stack trace object must be one passed to [`Error.prepareStackTrace`](https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi) by V8.


### Levels

- `fatal`: Severe problems which most likely leads to application abort.
- `error`: Problems which cause the application to fail partially.
- `warn`: Problems which are potentially harmful but does not directly affect the application.
- `info`: Coarse informational messages about the overall application progress or status.
- `debug`: Detailed messages about the application progress useful during development.
- `trace`: Very detailed messages about the application exection useful during development.



Configuration
-------------

unilog outputs to [unilog-console](https://github.com/fluidsonic/unilog-console) by default. You can get the instance using `getConsole()` to configure it.

```javascript
require('unilog').getConsole().config({
  levels: '*:info main:trace mongodb:debug'
});
```

See [unilog-console's `.config(options)`](https://github.com/fluidsonic/unilog-console#configoptions).



Installation
------------

	$ npm install unilog



License
-------

MIT
