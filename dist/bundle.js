(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/Work/server/projects/hsl/index.js":[function(require,module,exports){
var Bacon = require('baconjs');

var body = $('body'),
    container = $('.container');

function xyFromEvent(e){ return [e.clientX, e.clientY]; }
function toHueSaturation(v){ return [v[0] * (360 / body.width()).toFixed(2), (v[1] * (100 / body.height())).toFixed(2)]; }

function getScrollPosition(){ return Math.round(container.scrollTop() / container.height() * 100); }
function lightnessFromScrollPosition(v){ return val < 0 ? 0 : val > 100 ? 100 : val; }

$(function(){
  var mousePositionStream = body
    .asEventStream('mousemove')
    .map(xyFromEvent)
    .map(toHueSaturation);

  var vScrollStream = $('.container')
    .asEventStream('scroll')
    .startWith(0)
    .map(getScrollPosition)
    .map(lightnessFromScrollPosition);

  var clickStream = body
    .asEventStream('click')
    .filter(function(e){ return !$(e.target).hasClass('locked');  }) // filter out clicks on the .locked element
    .scan(1, function(a){ return !a; });

  Bacon.combineWith(
    function(pos, scroll, unlocked){ return unlocked && pos.concat(scroll); }, mousePositionStream, vScrollStream, clickStream)
    .onValue(function(v){
      if(v){
        $('.container').css('background', 'hsl('+v[0]+', '+v[1]+'%, '+v[2]+'%)');
        $('.color').html(v.join(' ') + '<br>' + container.css('background-color'));
        $('.color').removeClass('locked');
      } else {
        $('.color').addClass('locked');
      }
  });


});



},{"baconjs":"/Volumes/Work/server/projects/hsl/node_modules/baconjs/dist/Bacon.js"}],"/Volumes/Work/server/projects/hsl/node_modules/baconjs/dist/Bacon.js":[function(require,module,exports){
(function (global){
(function() {
  var Bacon, BufferingSource, Bus, CompositeUnsubscribe, ConsumingSource, Desc, Dispatcher, End, Error, Event, EventStream, Exception, Initial, Next, None, Observable, Property, PropertyDispatcher, Some, Source, UpdateBarrier, addPropertyInitValueToStream, assert, assertArray, assertEventStream, assertFunction, assertNoArguments, assertString, cloneArray, compositeUnsubscribe, containsDuplicateDeps, convertArgsToFunction, describe, end, eventIdCounter, findDeps, flatMap_, former, idCounter, initial, isArray, isFieldKey, isFunction, isObservable, latter, liftCallback, makeFunction, makeFunctionArgs, makeFunction_, makeObservable, makeSpawner, next, nop, partiallyApplied, recursionDepth, registerObs, spys, toCombinator, toEvent, toFieldExtractor, toFieldKey, toOption, toSimpleExtractor, withDescription, withMethodCallSupport, _, _ref,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Bacon = {
    toString: function() {
      return "Bacon";
    }
  };

  Bacon.version = '0.7.37';

  Exception = (typeof global !== "undefined" && global !== null ? global : this).Error;

  Bacon.fromBinder = function(binder, eventTransformer) {
    if (eventTransformer == null) {
      eventTransformer = _.id;
    }
    return new EventStream(describe(Bacon, "fromBinder", binder, eventTransformer), function(sink) {
      var unbind, unbinder, unbound;
      unbound = false;
      unbind = function() {
        if (typeof unbinder !== "undefined" && unbinder !== null) {
          if (!unbound) {
            unbinder();
          }
          return unbound = true;
        }
      };
      unbinder = binder(function() {
        var args, event, reply, value, _i, _len;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        value = eventTransformer.apply(this, args);
        if (!(isArray(value) && _.last(value) instanceof Event)) {
          value = [value];
        }
        reply = Bacon.more;
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          event = value[_i];
          reply = sink(event = toEvent(event));
          if (reply === Bacon.noMore || event.isEnd()) {
            if (unbinder != null) {
              unbind();
            } else {
              Bacon.scheduler.setTimeout(unbind, 0);
            }
            return reply;
          }
        }
        return reply;
      });
      return unbind;
    });
  };

  Bacon.$ = {};

  Bacon.$.asEventStream = function(eventName, selector, eventTransformer) {
    var _ref;
    if (isFunction(selector)) {
      _ref = [selector, void 0], eventTransformer = _ref[0], selector = _ref[1];
    }
    return withDescription(this.selector || this, "asEventStream", eventName, Bacon.fromBinder((function(_this) {
      return function(handler) {
        _this.on(eventName, selector, handler);
        return function() {
          return _this.off(eventName, selector, handler);
        };
      };
    })(this), eventTransformer));
  };

  if ((_ref = typeof jQuery !== "undefined" && jQuery !== null ? jQuery : typeof Zepto !== "undefined" && Zepto !== null ? Zepto : void 0) != null) {
    _ref.fn.asEventStream = Bacon.$.asEventStream;
  }

  Bacon.fromEventTarget = function(target, eventName, eventTransformer) {
    var sub, unsub, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    sub = (_ref1 = (_ref2 = (_ref3 = target.addEventListener) != null ? _ref3 : target.addListener) != null ? _ref2 : target.bind) != null ? _ref1 : target.on;
    unsub = (_ref4 = (_ref5 = (_ref6 = target.removeEventListener) != null ? _ref6 : target.removeListener) != null ? _ref5 : target.unbind) != null ? _ref4 : target.off;
    return withDescription(Bacon, "fromEventTarget", target, eventName, Bacon.fromBinder(function(handler) {
      sub.call(target, eventName, handler);
      return function() {
        return unsub.call(target, eventName, handler);
      };
    }, eventTransformer));
  };

  Bacon.fromPromise = function(promise, abort) {
    return withDescription(Bacon, "fromPromise", promise, Bacon.fromBinder(function(handler) {
      promise.then(handler, function(e) {
        return handler(new Error(e));
      });
      return function() {
        if (abort) {
          return typeof promise.abort === "function" ? promise.abort() : void 0;
        }
      };
    }, (function(value) {
      return [value, end()];
    })));
  };

  Bacon.noMore = ["<no-more>"];

  Bacon.more = ["<more>"];

  Bacon.later = function(delay, value) {
    return withDescription(Bacon, "later", delay, value, Bacon.fromPoll(delay, function() {
      return [value, end()];
    }));
  };

  Bacon.sequentially = function(delay, values) {
    var index;
    index = 0;
    return withDescription(Bacon, "sequentially", delay, values, Bacon.fromPoll(delay, function() {
      var value;
      value = values[index++];
      if (index < values.length) {
        return value;
      } else if (index === values.length) {
        return [value, end()];
      } else {
        return end();
      }
    }));
  };

  Bacon.repeatedly = function(delay, values) {
    var index;
    index = 0;
    return withDescription(Bacon, "repeatedly", delay, values, Bacon.fromPoll(delay, function() {
      return values[index++ % values.length];
    }));
  };

  Bacon.spy = function(spy) {
    return spys.push(spy);
  };

  spys = [];

  registerObs = function(obs) {
    var spy, _i, _len;
    if (spys.length) {
      if (!registerObs.running) {
        try {
          registerObs.running = true;
          for (_i = 0, _len = spys.length; _i < _len; _i++) {
            spy = spys[_i];
            spy(obs);
          }
        } finally {
          delete registerObs.running;
        }
      }
    }
    return void 0;
  };

  withMethodCallSupport = function(wrapped) {
    return function() {
      var args, context, f, methodName;
      f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (typeof f === "object" && args.length) {
        context = f;
        methodName = args[0];
        f = function() {
          return context[methodName].apply(context, arguments);
        };
        args = args.slice(1);
      }
      return wrapped.apply(null, [f].concat(__slice.call(args)));
    };
  };

  liftCallback = function(desc, wrapped) {
    return withMethodCallSupport(function() {
      var args, f, stream;
      f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      stream = partiallyApplied(wrapped, [
        function(values, callback) {
          return f.apply(null, __slice.call(values).concat([callback]));
        }
      ]);
      return withDescription.apply(null, [Bacon, desc, f].concat(__slice.call(args), [Bacon.combineAsArray(args).flatMap(stream)]));
    });
  };

  Bacon.fromCallback = liftCallback("fromCallback", function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return Bacon.fromBinder(function(handler) {
      makeFunction(f, args)(handler);
      return nop;
    }, (function(value) {
      return [value, end()];
    }));
  });

  Bacon.fromNodeCallback = liftCallback("fromNodeCallback", function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return Bacon.fromBinder(function(handler) {
      makeFunction(f, args)(handler);
      return nop;
    }, function(error, value) {
      if (error) {
        return [new Error(error), end()];
      }
      return [value, end()];
    });
  });

  Bacon.fromPoll = function(delay, poll) {
    return withDescription(Bacon, "fromPoll", delay, poll, Bacon.fromBinder((function(handler) {
      var id;
      id = Bacon.scheduler.setInterval(handler, delay);
      return function() {
        return Bacon.scheduler.clearInterval(id);
      };
    }), poll));
  };

  Bacon.interval = function(delay, value) {
    if (value == null) {
      value = {};
    }
    return withDescription(Bacon, "interval", delay, value, Bacon.fromPoll(delay, function() {
      return next(value);
    }));
  };

  Bacon.constant = function(value) {
    return new Property(describe(Bacon, "constant", value), function(sink) {
      sink(initial(value));
      sink(end());
      return nop;
    });
  };

  Bacon.never = function() {
    return new EventStream(describe(Bacon, "never"), function(sink) {
      sink(end());
      return nop;
    });
  };

  Bacon.once = function(value) {
    return new EventStream(describe(Bacon, "once", value), function(sink) {
      sink(toEvent(value));
      sink(end());
      return nop;
    });
  };

  Bacon.fromArray = function(values) {
    var i;
    assertArray(values);
    i = 0;
    return new EventStream(describe(Bacon, "fromArray", values), function(sink) {
      var reply, unsubd, value;
      unsubd = false;
      reply = Bacon.more;
      while ((reply !== Bacon.noMore) && !unsubd) {
        if (i >= values.length) {
          sink(end());
          reply = Bacon.noMore;
        } else {
          value = values[i++];
          reply = sink(toEvent(value));
        }
      }
      return function() {
        return unsubd = true;
      };
    });
  };

  Bacon.mergeAll = function() {
    var streams;
    streams = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (isArray(streams[0])) {
      streams = streams[0];
    }
    if (streams.length) {
      return new EventStream(describe.apply(null, [Bacon, "mergeAll"].concat(__slice.call(streams))), function(sink) {
        var ends, sinks, smartSink;
        ends = 0;
        smartSink = function(obs) {
          return function(unsubBoth) {
            return obs.dispatcher.subscribe(function(event) {
              var reply;
              if (event.isEnd()) {
                ends++;
                if (ends === streams.length) {
                  return sink(end());
                } else {
                  return Bacon.more;
                }
              } else {
                reply = sink(event);
                if (reply === Bacon.noMore) {
                  unsubBoth();
                }
                return reply;
              }
            });
          };
        };
        sinks = _.map(smartSink, streams);
        return compositeUnsubscribe.apply(null, sinks);
      });
    } else {
      return Bacon.never();
    }
  };

  Bacon.zipAsArray = function() {
    var streams;
    streams = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (isArray(streams[0])) {
      streams = streams[0];
    }
    return withDescription.apply(null, [Bacon, "zipAsArray"].concat(__slice.call(streams), [Bacon.zipWith(streams, function() {
      var xs;
      xs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return xs;
    })]));
  };

  Bacon.zipWith = function() {
    var f, streams, _ref1;
    f = arguments[0], streams = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (!isFunction(f)) {
      _ref1 = [f, streams[0]], streams = _ref1[0], f = _ref1[1];
    }
    streams = _.map((function(s) {
      return s.toEventStream();
    }), streams);
    return withDescription.apply(null, [Bacon, "zipWith", f].concat(__slice.call(streams), [Bacon.when(streams, f)]));
  };

  Bacon.groupSimultaneous = function() {
    var s, sources, streams;
    streams = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (streams.length === 1 && isArray(streams[0])) {
      streams = streams[0];
    }
    sources = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = streams.length; _i < _len; _i++) {
        s = streams[_i];
        _results.push(new BufferingSource(s));
      }
      return _results;
    })();
    return withDescription.apply(null, [Bacon, "groupSimultaneous"].concat(__slice.call(streams), [Bacon.when(sources, (function() {
      var xs;
      xs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return xs;
    }))]));
  };

  Bacon.combineAsArray = function() {
    var index, s, sources, stream, streams, _i, _len;
    streams = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (streams.length === 1 && isArray(streams[0])) {
      streams = streams[0];
    }
    for (index = _i = 0, _len = streams.length; _i < _len; index = ++_i) {
      stream = streams[index];
      if (!(isObservable(stream))) {
        streams[index] = Bacon.constant(stream);
      }
    }
    if (streams.length) {
      sources = (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = streams.length; _j < _len1; _j++) {
          s = streams[_j];
          _results.push(new Source(s, true));
        }
        return _results;
      })();
      return withDescription.apply(null, [Bacon, "combineAsArray"].concat(__slice.call(streams), [Bacon.when(sources, (function() {
        var xs;
        xs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return xs;
      })).toProperty()]));
    } else {
      return Bacon.constant([]);
    }
  };

  Bacon.onValues = function() {
    var f, streams, _i;
    streams = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), f = arguments[_i++];
    return Bacon.combineAsArray(streams).onValues(f);
  };

  Bacon.combineWith = function() {
    var f, streams;
    f = arguments[0], streams = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return withDescription.apply(null, [Bacon, "combineWith", f].concat(__slice.call(streams), [Bacon.combineAsArray(streams).map(function(values) {
      return f.apply(null, values);
    })]));
  };

  Bacon.combineTemplate = function(template) {
    var applyStreamValue, combinator, compile, compileTemplate, constantValue, current, funcs, mkContext, setValue, streams;
    funcs = [];
    streams = [];
    current = function(ctxStack) {
      return ctxStack[ctxStack.length - 1];
    };
    setValue = function(ctxStack, key, value) {
      return current(ctxStack)[key] = value;
    };
    applyStreamValue = function(key, index) {
      return function(ctxStack, values) {
        return setValue(ctxStack, key, values[index]);
      };
    };
    constantValue = function(key, value) {
      return function(ctxStack) {
        return setValue(ctxStack, key, value);
      };
    };
    mkContext = function(template) {
      if (isArray(template)) {
        return [];
      } else {
        return {};
      }
    };
    compile = function(key, value) {
      var popContext, pushContext;
      if (isObservable(value)) {
        streams.push(value);
        return funcs.push(applyStreamValue(key, streams.length - 1));
      } else if (value === Object(value) && typeof value !== "function" && !(value instanceof RegExp) && !(value instanceof Date)) {
        pushContext = function(key) {
          return function(ctxStack) {
            var newContext;
            newContext = mkContext(value);
            setValue(ctxStack, key, newContext);
            return ctxStack.push(newContext);
          };
        };
        popContext = function(ctxStack) {
          return ctxStack.pop();
        };
        funcs.push(pushContext(key));
        compileTemplate(value);
        return funcs.push(popContext);
      } else {
        return funcs.push(constantValue(key, value));
      }
    };
    compileTemplate = function(template) {
      return _.each(template, compile);
    };
    compileTemplate(template);
    combinator = function(values) {
      var ctxStack, f, rootContext, _i, _len;
      rootContext = mkContext(template);
      ctxStack = [rootContext];
      for (_i = 0, _len = funcs.length; _i < _len; _i++) {
        f = funcs[_i];
        f(ctxStack, values);
      }
      return rootContext;
    };
    return withDescription(Bacon, "combineTemplate", template, Bacon.combineAsArray(streams).map(combinator));
  };

  Bacon.retry = function(options) {
    var delay, isRetryable, maxRetries, retries, retry, source;
    if (!isFunction(options.source)) {
      throw new Exception("'source' option has to be a function");
    }
    source = options.source;
    retries = options.retries || 0;
    maxRetries = options.maxRetries || retries;
    delay = options.delay || function() {
      return 0;
    };
    isRetryable = options.isRetryable || function() {
      return true;
    };
    retry = function(context) {
      var delayedRetry, nextAttemptOptions;
      nextAttemptOptions = {
        source: source,
        retries: retries - 1,
        maxRetries: maxRetries,
        delay: delay,
        isRetryable: isRetryable
      };
      delayedRetry = function() {
        return Bacon.retry(nextAttemptOptions);
      };
      return Bacon.later(delay(context)).filter(false).concat(Bacon.once().flatMap(delayedRetry));
    };
    return withDescription(Bacon, "retry", options, source().flatMapError(function(e) {
      if (isRetryable(e) && retries > 0) {
        return retry({
          error: e,
          retriesDone: maxRetries - retries
        });
      } else {
        return Bacon.once(new Error(e));
      }
    }));
  };

  eventIdCounter = 0;

  Event = (function() {
    function Event() {
      this.id = ++eventIdCounter;
    }

    Event.prototype.isEvent = function() {
      return true;
    };

    Event.prototype.isEnd = function() {
      return false;
    };

    Event.prototype.isInitial = function() {
      return false;
    };

    Event.prototype.isNext = function() {
      return false;
    };

    Event.prototype.isError = function() {
      return false;
    };

    Event.prototype.hasValue = function() {
      return false;
    };

    Event.prototype.filter = function() {
      return true;
    };

    Event.prototype.inspect = function() {
      return this.toString();
    };

    Event.prototype.log = function() {
      return this.toString();
    };

    return Event;

  })();

  Next = (function(_super) {
    __extends(Next, _super);

    function Next(valueF, eager) {
      Next.__super__.constructor.call(this);
      if (!eager && isFunction(valueF) || valueF instanceof Next) {
        this.valueF = valueF;
        this.valueInternal = void 0;
      } else {
        this.valueF = void 0;
        this.valueInternal = valueF;
      }
    }

    Next.prototype.isNext = function() {
      return true;
    };

    Next.prototype.hasValue = function() {
      return true;
    };

    Next.prototype.value = function() {
      if (this.valueF instanceof Next) {
        this.valueInternal = this.valueF.value();
        this.valueF = void 0;
      } else if (this.valueF) {
        this.valueInternal = this.valueF();
        this.valueF = void 0;
      }
      return this.valueInternal;
    };

    Next.prototype.fmap = function(f) {
      var event, value;
      if (this.valueInternal) {
        value = this.valueInternal;
        return this.apply(function() {
          return f(value);
        });
      } else {
        event = this;
        return this.apply(function() {
          return f(event.value());
        });
      }
    };

    Next.prototype.apply = function(value) {
      return new Next(value);
    };

    Next.prototype.filter = function(f) {
      return f(this.value());
    };

    Next.prototype.toString = function() {
      return _.toString(this.value());
    };

    Next.prototype.log = function() {
      return this.value();
    };

    return Next;

  })(Event);

  Initial = (function(_super) {
    __extends(Initial, _super);

    function Initial() {
      return Initial.__super__.constructor.apply(this, arguments);
    }

    Initial.prototype.isInitial = function() {
      return true;
    };

    Initial.prototype.isNext = function() {
      return false;
    };

    Initial.prototype.apply = function(value) {
      return new Initial(value);
    };

    Initial.prototype.toNext = function() {
      return new Next(this);
    };

    return Initial;

  })(Next);

  End = (function(_super) {
    __extends(End, _super);

    function End() {
      return End.__super__.constructor.apply(this, arguments);
    }

    End.prototype.isEnd = function() {
      return true;
    };

    End.prototype.fmap = function() {
      return this;
    };

    End.prototype.apply = function() {
      return this;
    };

    End.prototype.toString = function() {
      return "<end>";
    };

    return End;

  })(Event);

  Error = (function(_super) {
    __extends(Error, _super);

    function Error(error) {
      this.error = error;
    }

    Error.prototype.isError = function() {
      return true;
    };

    Error.prototype.fmap = function() {
      return this;
    };

    Error.prototype.apply = function() {
      return this;
    };

    Error.prototype.toString = function() {
      return "<error> " + _.toString(this.error);
    };

    return Error;

  })(Event);

  idCounter = 0;

  Observable = (function() {
    function Observable(desc) {
      this.id = ++idCounter;
      withDescription(desc, this);
      this.initialDesc = this.desc;
    }

    Observable.prototype.subscribe = function(sink) {
      return UpdateBarrier.wrappedSubscribe(this, sink);
    };

    Observable.prototype.subscribeInternal = function(sink) {
      return this.dispatcher.subscribe(sink);
    };

    Observable.prototype.onValue = function() {
      var f;
      f = makeFunctionArgs(arguments);
      return this.subscribe(function(event) {
        if (event.hasValue()) {
          return f(event.value());
        }
      });
    };

    Observable.prototype.onValues = function(f) {
      return this.onValue(function(args) {
        return f.apply(null, args);
      });
    };

    Observable.prototype.onError = function() {
      var f;
      f = makeFunctionArgs(arguments);
      return this.subscribe(function(event) {
        if (event.isError()) {
          return f(event.error);
        }
      });
    };

    Observable.prototype.onEnd = function() {
      var f;
      f = makeFunctionArgs(arguments);
      return this.subscribe(function(event) {
        if (event.isEnd()) {
          return f();
        }
      });
    };

    Observable.prototype.errors = function() {
      return withDescription(this, "errors", this.filter(function() {
        return false;
      }));
    };

    Observable.prototype.filter = function() {
      var args, f;
      f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return convertArgsToFunction(this, f, args, function(f) {
        return withDescription(this, "filter", f, this.withHandler(function(event) {
          if (event.filter(f)) {
            return this.push(event);
          } else {
            return Bacon.more;
          }
        }));
      });
    };

    Observable.prototype.takeWhile = function() {
      var args, f;
      f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return convertArgsToFunction(this, f, args, function(f) {
        return withDescription(this, "takeWhile", f, this.withHandler(function(event) {
          if (event.filter(f)) {
            return this.push(event);
          } else {
            this.push(end());
            return Bacon.noMore;
          }
        }));
      });
    };

    Observable.prototype.endOnError = function() {
      var args, f;
      f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (f == null) {
        f = true;
      }
      return convertArgsToFunction(this, f, args, function(f) {
        return withDescription(this, "endOnError", this.withHandler(function(event) {
          if (event.isError() && f(event.error)) {
            this.push(event);
            return this.push(end());
          } else {
            return this.push(event);
          }
        }));
      });
    };

    Observable.prototype.take = function(count) {
      if (count <= 0) {
        return Bacon.never();
      }
      return withDescription(this, "take", count, this.withHandler(function(event) {
        if (!event.hasValue()) {
          return this.push(event);
        } else {
          count--;
          if (count > 0) {
            return this.push(event);
          } else {
            if (count === 0) {
              this.push(event);
            }
            this.push(end());
            return Bacon.noMore;
          }
        }
      }));
    };

    Observable.prototype.map = function() {
      var args, p;
      p = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (p instanceof Property) {
        return p.sampledBy(this, former);
      } else {
        return convertArgsToFunction(this, p, args, function(f) {
          return withDescription(this, "map", f, this.withHandler(function(event) {
            return this.push(event.fmap(f));
          }));
        });
      }
    };

    Observable.prototype.mapError = function() {
      var f;
      f = makeFunctionArgs(arguments);
      return withDescription(this, "mapError", f, this.withHandler(function(event) {
        if (event.isError()) {
          return this.push(next(f(event.error)));
        } else {
          return this.push(event);
        }
      }));
    };

    Observable.prototype.mapEnd = function() {
      var f;
      f = makeFunctionArgs(arguments);
      return withDescription(this, "mapEnd", f, this.withHandler(function(event) {
        if (event.isEnd()) {
          this.push(next(f(event)));
          this.push(end());
          return Bacon.noMore;
        } else {
          return this.push(event);
        }
      }));
    };

    Observable.prototype.doAction = function() {
      var f;
      f = makeFunctionArgs(arguments);
      return withDescription(this, "doAction", f, this.withHandler(function(event) {
        if (event.hasValue()) {
          f(event.value());
        }
        return this.push(event);
      }));
    };

    Observable.prototype.skip = function(count) {
      return withDescription(this, "skip", count, this.withHandler(function(event) {
        if (!event.hasValue()) {
          return this.push(event);
        } else if (count > 0) {
          count--;
          return Bacon.more;
        } else {
          return this.push(event);
        }
      }));
    };

    Observable.prototype.skipDuplicates = function(isEqual) {
      if (isEqual == null) {
        isEqual = function(a, b) {
          return a === b;
        };
      }
      return withDescription(this, "skipDuplicates", this.withStateMachine(None, function(prev, event) {
        if (!event.hasValue()) {
          return [prev, [event]];
        } else if (event.isInitial() || prev === None || !isEqual(prev.get(), event.value())) {
          return [new Some(event.value()), [event]];
        } else {
          return [prev, []];
        }
      }));
    };

    Observable.prototype.skipErrors = function() {
      return withDescription(this, "skipErrors", this.withHandler(function(event) {
        if (event.isError()) {
          return Bacon.more;
        } else {
          return this.push(event);
        }
      }));
    };

    Observable.prototype.withStateMachine = function(initState, f) {
      var state;
      state = initState;
      return withDescription(this, "withStateMachine", initState, f, this.withHandler(function(event) {
        var fromF, newState, output, outputs, reply, _i, _len;
        fromF = f(state, event);
        newState = fromF[0], outputs = fromF[1];
        state = newState;
        reply = Bacon.more;
        for (_i = 0, _len = outputs.length; _i < _len; _i++) {
          output = outputs[_i];
          reply = this.push(output);
          if (reply === Bacon.noMore) {
            return reply;
          }
        }
        return reply;
      }));
    };

    Observable.prototype.scan = function(seed, f) {
      var acc, resultProperty, subscribe;
      f = toCombinator(f);
      acc = toOption(seed);
      subscribe = (function(_this) {
        return function(sink) {
          var initSent, reply, sendInit, unsub;
          initSent = false;
          unsub = nop;
          reply = Bacon.more;
          sendInit = function() {
            if (!initSent) {
              return acc.forEach(function(value) {
                initSent = true;
                reply = sink(new Initial(function() {
                  return value;
                }));
                if (reply === Bacon.noMore) {
                  unsub();
                  return unsub = nop;
                }
              });
            }
          };
          unsub = _this.dispatcher.subscribe(function(event) {
            var next, prev;
            if (event.hasValue()) {
              if (initSent && event.isInitial()) {
                return Bacon.more;
              } else {
                if (!event.isInitial()) {
                  sendInit();
                }
                initSent = true;
                prev = acc.getOrElse(void 0);
                next = f(prev, event.value());
                acc = new Some(next);
                return sink(event.apply(function() {
                  return next;
                }));
              }
            } else {
              if (event.isEnd()) {
                reply = sendInit();
              }
              if (reply !== Bacon.noMore) {
                return sink(event);
              }
            }
          });
          UpdateBarrier.whenDoneWith(resultProperty, sendInit);
          return unsub;
        };
      })(this);
      return resultProperty = new Property(describe(this, "scan", seed, f), subscribe);
    };

    Observable.prototype.fold = function(seed, f) {
      return withDescription(this, "fold", seed, f, this.scan(seed, f).sampledBy(this.filter(false).mapEnd().toProperty()));
    };

    Observable.prototype.zip = function(other, f) {
      if (f == null) {
        f = Array;
      }
      return withDescription(this, "zip", other, Bacon.zipWith([this, other], f));
    };

    Observable.prototype.diff = function(start, f) {
      f = toCombinator(f);
      return withDescription(this, "diff", start, f, this.scan([start], function(prevTuple, next) {
        return [next, f(prevTuple[0], next)];
      }).filter(function(tuple) {
        return tuple.length === 2;
      }).map(function(tuple) {
        return tuple[1];
      }));
    };

    Observable.prototype.flatMap = function() {
      return flatMap_(this, makeSpawner(arguments));
    };

    Observable.prototype.flatMapFirst = function() {
      return flatMap_(this, makeSpawner(arguments), true);
    };

    Observable.prototype.flatMapWithConcurrencyLimit = function() {
      var args, limit;
      limit = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return withDescription.apply(null, [this, "flatMapWithConcurrencyLimit", limit].concat(__slice.call(args), [flatMap_(this, makeSpawner(args), false, limit)]));
    };

    Observable.prototype.flatMapLatest = function() {
      var f, stream;
      f = makeSpawner(arguments);
      stream = this.toEventStream();
      return withDescription(this, "flatMapLatest", f, stream.flatMap(function(value) {
        return makeObservable(f(value)).takeUntil(stream);
      }));
    };

    Observable.prototype.flatMapError = function(fn) {
      return withDescription(this, "flatMapError", fn, this.mapError(function(err) {
        return new Error(err);
      }).flatMap(function(x) {
        if (x instanceof Error) {
          return fn(x.error);
        } else {
          return Bacon.once(x);
        }
      }));
    };

    Observable.prototype.flatMapConcat = function() {
      return withDescription.apply(null, [this, "flatMapConcat"].concat(__slice.call(arguments), [this.flatMapWithConcurrencyLimit.apply(this, [1].concat(__slice.call(arguments)))]));
    };

    Observable.prototype.bufferingThrottle = function(minimumInterval) {
      return withDescription(this, "bufferingThrottle", minimumInterval, this.flatMapConcat(function(x) {
        return Bacon.once(x).concat(Bacon.later(minimumInterval).filter(false));
      }));
    };

    Observable.prototype.not = function() {
      return withDescription(this, "not", this.map(function(x) {
        return !x;
      }));
    };

    Observable.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.subscribe(function(event) {
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log.apply(console, __slice.call(args).concat([event.log()])) : void 0 : void 0;
      });
      return this;
    };

    Observable.prototype.slidingWindow = function(n, minValues) {
      if (minValues == null) {
        minValues = 0;
      }
      return withDescription(this, "slidingWindow", n, minValues, this.scan([], (function(window, value) {
        return window.concat([value]).slice(-n);
      })).filter((function(values) {
        return values.length >= minValues;
      })));
    };

    Observable.prototype.combine = function(other, f) {
      var combinator;
      combinator = toCombinator(f);
      return withDescription(this, "combine", other, f, Bacon.combineAsArray(this, other).map(function(values) {
        return combinator(values[0], values[1]);
      }));
    };

    Observable.prototype.decode = function(cases) {
      return withDescription(this, "decode", cases, this.combine(Bacon.combineTemplate(cases), function(key, values) {
        return values[key];
      }));
    };

    Observable.prototype.awaiting = function(other) {
      return withDescription(this, "awaiting", other, Bacon.groupSimultaneous(this, other).map(function(_arg) {
        var myValues, otherValues;
        myValues = _arg[0], otherValues = _arg[1];
        return otherValues.length === 0;
      }).toProperty(false).skipDuplicates());
    };

    Observable.prototype.name = function(name) {
      this._name = name;
      return this;
    };

    Observable.prototype.withDescription = function() {
      return describe.apply(null, arguments).apply(this);
    };

    Observable.prototype.toString = function() {
      if (this._name) {
        return this._name;
      } else {
        return this.desc.toString();
      }
    };

    Observable.prototype.internalDeps = function() {
      return this.initialDesc.deps();
    };

    return Observable;

  })();

  Observable.prototype.reduce = Observable.prototype.fold;

  Observable.prototype.assign = Observable.prototype.onValue;

  Observable.prototype.inspect = Observable.prototype.toString;

  flatMap_ = function(root, f, firstOnly, limit) {
    var childDeps, result, rootDep;
    rootDep = [root];
    childDeps = [];
    result = new EventStream(describe(root, "flatMap" + (firstOnly ? "First" : ""), f), function(sink) {
      var checkEnd, checkQueue, composite, queue, spawn;
      composite = new CompositeUnsubscribe();
      queue = [];
      spawn = function(event) {
        var child;
        child = makeObservable(f(event.value()));
        childDeps.push(child);
        return composite.add(function(unsubAll, unsubMe) {
          return child.dispatcher.subscribe(function(event) {
            var reply;
            if (event.isEnd()) {
              _.remove(child, childDeps);
              checkQueue();
              checkEnd(unsubMe);
              return Bacon.noMore;
            } else {
              if (event instanceof Initial) {
                event = event.toNext();
              }
              reply = sink(event);
              if (reply === Bacon.noMore) {
                unsubAll();
              }
              return reply;
            }
          });
        });
      };
      checkQueue = function() {
        var event;
        event = queue.shift();
        if (event) {
          return spawn(event);
        }
      };
      checkEnd = function(unsub) {
        unsub();
        if (composite.empty()) {
          return sink(end());
        }
      };
      composite.add(function(__, unsubRoot) {
        return root.dispatcher.subscribe(function(event) {
          if (event.isEnd()) {
            return checkEnd(unsubRoot);
          } else if (event.isError()) {
            return sink(event);
          } else if (firstOnly && composite.count() > 1) {
            return Bacon.more;
          } else {
            if (composite.unsubscribed) {
              return Bacon.noMore;
            }
            if (limit && composite.count() > limit) {
              return queue.push(event);
            } else {
              return spawn(event);
            }
          }
        });
      });
      return composite.unsubscribe;
    });
    result.internalDeps = function() {
      if (childDeps.length) {
        return rootDep.concat(childDeps);
      } else {
        return rootDep;
      }
    };
    return result;
  };

  EventStream = (function(_super) {
    __extends(EventStream, _super);

    function EventStream(desc, subscribe, handler) {
      if (isFunction(desc)) {
        handler = subscribe;
        subscribe = desc;
        desc = [];
      }
      EventStream.__super__.constructor.call(this, desc);
      assertFunction(subscribe);
      this.dispatcher = new Dispatcher(subscribe, handler);
      registerObs(this);
    }

    EventStream.prototype.delay = function(delay) {
      return withDescription(this, "delay", delay, this.flatMap(function(value) {
        return Bacon.later(delay, value);
      }));
    };

    EventStream.prototype.debounce = function(delay) {
      return withDescription(this, "debounce", delay, this.flatMapLatest(function(value) {
        return Bacon.later(delay, value);
      }));
    };

    EventStream.prototype.debounceImmediate = function(delay) {
      return withDescription(this, "debounceImmediate", delay, this.flatMapFirst(function(value) {
        return Bacon.once(value).concat(Bacon.later(delay).filter(false));
      }));
    };

    EventStream.prototype.throttle = function(delay) {
      return withDescription(this, "throttle", delay, this.bufferWithTime(delay).map(function(values) {
        return values[values.length - 1];
      }));
    };

    EventStream.prototype.bufferWithTime = function(delay) {
      return withDescription(this, "bufferWithTime", delay, this.bufferWithTimeOrCount(delay, Number.MAX_VALUE));
    };

    EventStream.prototype.bufferWithCount = function(count) {
      return withDescription(this, "bufferWithCount", count, this.bufferWithTimeOrCount(void 0, count));
    };

    EventStream.prototype.bufferWithTimeOrCount = function(delay, count) {
      var flushOrSchedule;
      flushOrSchedule = function(buffer) {
        if (buffer.values.length === count) {
          return buffer.flush();
        } else if (delay !== void 0) {
          return buffer.schedule();
        }
      };
      return withDescription(this, "bufferWithTimeOrCount", delay, count, this.buffer(delay, flushOrSchedule, flushOrSchedule));
    };

    EventStream.prototype.buffer = function(delay, onInput, onFlush) {
      var buffer, delayMs, reply;
      if (onInput == null) {
        onInput = nop;
      }
      if (onFlush == null) {
        onFlush = nop;
      }
      buffer = {
        scheduled: false,
        end: void 0,
        values: [],
        flush: function() {
          var reply;
          this.scheduled = false;
          if (this.values.length > 0) {
            reply = this.push(next(this.values));
            this.values = [];
            if (this.end != null) {
              return this.push(this.end);
            } else if (reply !== Bacon.noMore) {
              return onFlush(this);
            }
          } else {
            if (this.end != null) {
              return this.push(this.end);
            }
          }
        },
        schedule: function() {
          if (!this.scheduled) {
            this.scheduled = true;
            return delay((function(_this) {
              return function() {
                return _this.flush();
              };
            })(this));
          }
        }
      };
      reply = Bacon.more;
      if (!isFunction(delay)) {
        delayMs = delay;
        delay = function(f) {
          return Bacon.scheduler.setTimeout(f, delayMs);
        };
      }
      return withDescription(this, "buffer", this.withHandler(function(event) {
        buffer.push = (function(_this) {
          return function(event) {
            return _this.push(event);
          };
        })(this);
        if (event.isError()) {
          reply = this.push(event);
        } else if (event.isEnd()) {
          buffer.end = event;
          if (!buffer.scheduled) {
            buffer.flush();
          }
        } else {
          buffer.values.push(event.value());
          onInput(buffer);
        }
        return reply;
      }));
    };

    EventStream.prototype.merge = function(right) {
      var left;
      assertEventStream(right);
      left = this;
      return withDescription(left, "merge", right, Bacon.mergeAll(this, right));
    };

    EventStream.prototype.toProperty = function(initValue_) {
      var disp, initValue;
      initValue = arguments.length === 0 ? None : toOption(function() {
        return initValue_;
      });
      disp = this.dispatcher;
      return new Property(describe(this, "toProperty", initValue_), function(sink) {
        var initSent, reply, sendInit, unsub;
        initSent = false;
        unsub = nop;
        reply = Bacon.more;
        sendInit = function() {
          if (!initSent) {
            return initValue.forEach(function(value) {
              initSent = true;
              reply = sink(new Initial(value));
              if (reply === Bacon.noMore) {
                unsub();
                return unsub = nop;
              }
            });
          }
        };
        unsub = disp.subscribe(function(event) {
          if (event.hasValue()) {
            if (initSent && event.isInitial()) {
              return Bacon.more;
            } else {
              if (!event.isInitial()) {
                sendInit();
              }
              initSent = true;
              initValue = new Some(event);
              return sink(event);
            }
          } else {
            if (event.isEnd()) {
              reply = sendInit();
            }
            if (reply !== Bacon.noMore) {
              return sink(event);
            }
          }
        });
        sendInit();
        return unsub;
      });
    };

    EventStream.prototype.toEventStream = function() {
      return this;
    };

    EventStream.prototype.sampledBy = function(sampler, combinator) {
      return withDescription(this, "sampledBy", sampler, combinator, this.toProperty().sampledBy(sampler, combinator));
    };

    EventStream.prototype.concat = function(right) {
      var left;
      left = this;
      return new EventStream(describe(left, "concat", right), function(sink) {
        var unsubLeft, unsubRight;
        unsubRight = nop;
        unsubLeft = left.dispatcher.subscribe(function(e) {
          if (e.isEnd()) {
            return unsubRight = right.dispatcher.subscribe(sink);
          } else {
            return sink(e);
          }
        });
        return function() {
          unsubLeft();
          return unsubRight();
        };
      });
    };

    EventStream.prototype.takeUntil = function(stopper) {
      var endMarker;
      endMarker = {};
      return withDescription(this, "takeUntil", stopper, Bacon.groupSimultaneous(this.mapEnd(endMarker), stopper.skipErrors()).withHandler(function(event) {
        var data, reply, value, _i, _len, _ref1;
        if (!event.hasValue()) {
          return this.push(event);
        } else {
          _ref1 = event.value(), data = _ref1[0], stopper = _ref1[1];
          if (stopper.length) {
            return this.push(end());
          } else {
            reply = Bacon.more;
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              value = data[_i];
              if (value === endMarker) {
                reply = this.push(end());
              } else {
                reply = this.push(next(value));
              }
            }
            return reply;
          }
        }
      }));
    };

    EventStream.prototype.skipUntil = function(starter) {
      var started;
      started = starter.take(1).map(true).toProperty(false);
      return withDescription(this, "skipUntil", starter, this.filter(started));
    };

    EventStream.prototype.skipWhile = function() {
      var args, f, ok;
      f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      ok = false;
      return convertArgsToFunction(this, f, args, function(f) {
        return withDescription(this, "skipWhile", f, this.withHandler(function(event) {
          if (ok || !event.hasValue() || !f(event.value())) {
            if (event.hasValue()) {
              ok = true;
            }
            return this.push(event);
          } else {
            return Bacon.more;
          }
        }));
      });
    };

    EventStream.prototype.holdWhen = function(valve) {
      var putToHold, releaseHold, valve_;
      valve_ = valve.startWith(false);
      releaseHold = valve_.filter(function(x) {
        return !x;
      });
      putToHold = valve_.filter(_.id);
      return withDescription(this, "holdWhen", valve, this.filter(false).merge(valve_.flatMapConcat((function(_this) {
        return function(shouldHold) {
          if (!shouldHold) {
            return _this.takeUntil(putToHold);
          } else {
            return _this.scan([], (function(xs, x) {
              return xs.concat(x);
            })).sampledBy(releaseHold).take(1).flatMap(Bacon.fromArray);
          }
        };
      })(this))));
    };

    EventStream.prototype.startWith = function(seed) {
      return withDescription(this, "startWith", seed, Bacon.once(seed).concat(this));
    };

    EventStream.prototype.withHandler = function(handler) {
      return new EventStream(describe(this, "withHandler", handler), this.dispatcher.subscribe, handler);
    };

    return EventStream;

  })(Observable);

  Property = (function(_super) {
    __extends(Property, _super);

    function Property(desc, subscribe, handler) {
      if (isFunction(desc)) {
        handler = subscribe;
        subscribe = desc;
        desc = [];
      }
      Property.__super__.constructor.call(this, desc);
      assertFunction(subscribe);
      this.dispatcher = new PropertyDispatcher(this, subscribe, handler);
      registerObs(this);
    }

    Property.prototype.sampledBy = function(sampler, combinator) {
      var lazy, result, samplerSource, stream, thisSource;
      if (combinator != null) {
        combinator = toCombinator(combinator);
      } else {
        lazy = true;
        combinator = function(f) {
          return f.value();
        };
      }
      thisSource = new Source(this, false, lazy);
      samplerSource = new Source(sampler, true, lazy);
      stream = Bacon.when([thisSource, samplerSource], combinator);
      result = sampler instanceof Property ? stream.toProperty() : stream;
      return withDescription(this, "sampledBy", sampler, combinator, result);
    };

    Property.prototype.sample = function(interval) {
      return withDescription(this, "sample", interval, this.sampledBy(Bacon.interval(interval, {})));
    };

    Property.prototype.changes = function() {
      return new EventStream(describe(this, "changes"), (function(_this) {
        return function(sink) {
          return _this.dispatcher.subscribe(function(event) {
            if (!event.isInitial()) {
              return sink(event);
            }
          });
        };
      })(this));
    };

    Property.prototype.withHandler = function(handler) {
      return new Property(describe(this, "withHandler", handler), this.dispatcher.subscribe, handler);
    };

    Property.prototype.toProperty = function() {
      assertNoArguments(arguments);
      return this;
    };

    Property.prototype.toEventStream = function() {
      return new EventStream(describe(this, "toEventStream"), (function(_this) {
        return function(sink) {
          return _this.dispatcher.subscribe(function(event) {
            if (event.isInitial()) {
              event = event.toNext();
            }
            return sink(event);
          });
        };
      })(this));
    };

    Property.prototype.and = function(other) {
      return withDescription(this, "and", other, this.combine(other, function(x, y) {
        return x && y;
      }));
    };

    Property.prototype.or = function(other) {
      return withDescription(this, "or", other, this.combine(other, function(x, y) {
        return x || y;
      }));
    };

    Property.prototype.delay = function(delay) {
      return this.delayChanges("delay", delay, function(changes) {
        return changes.delay(delay);
      });
    };

    Property.prototype.debounce = function(delay) {
      return this.delayChanges("debounce", delay, function(changes) {
        return changes.debounce(delay);
      });
    };

    Property.prototype.throttle = function(delay) {
      return this.delayChanges("throttle", delay, function(changes) {
        return changes.throttle(delay);
      });
    };

    Property.prototype.delayChanges = function() {
      var desc, f, _i;
      desc = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), f = arguments[_i++];
      return withDescription.apply(null, [this].concat(__slice.call(desc), [addPropertyInitValueToStream(this, f(this.changes()))]));
    };

    Property.prototype.takeUntil = function(stopper) {
      var changes;
      changes = this.changes().takeUntil(stopper);
      return withDescription(this, "takeUntil", stopper, addPropertyInitValueToStream(this, changes));
    };

    Property.prototype.startWith = function(value) {
      return withDescription(this, "startWith", value, this.scan(value, function(prev, next) {
        return next;
      }));
    };

    Property.prototype.bufferingThrottle = function() {
      var _ref1;
      return (_ref1 = Property.__super__.bufferingThrottle.apply(this, arguments)).bufferingThrottle.apply(_ref1, arguments).toProperty();
    };

    return Property;

  })(Observable);

  convertArgsToFunction = function(obs, f, args, method) {
    var sampled;
    if (f instanceof Property) {
      sampled = f.sampledBy(obs, function(p, s) {
        return [p, s];
      });
      return method.call(sampled, function(_arg) {
        var p, s;
        p = _arg[0], s = _arg[1];
        return p;
      }).map(function(_arg) {
        var p, s;
        p = _arg[0], s = _arg[1];
        return s;
      });
    } else {
      f = makeFunction(f, args);
      return method.call(obs, f);
    }
  };

  addPropertyInitValueToStream = function(property, stream) {
    var justInitValue;
    justInitValue = new EventStream(describe(property, "justInitValue"), function(sink) {
      var unsub, value;
      value = void 0;
      unsub = property.dispatcher.subscribe(function(event) {
        if (!event.isEnd()) {
          value = event;
        }
        return Bacon.noMore;
      });
      UpdateBarrier.whenDoneWith(justInitValue, function() {
        if (value != null) {
          sink(value);
        }
        return sink(end());
      });
      return unsub;
    });
    return justInitValue.concat(stream).toProperty();
  };

  Dispatcher = (function() {
    function Dispatcher(_subscribe, _handleEvent) {
      this._subscribe = _subscribe;
      this._handleEvent = _handleEvent;
      this.subscribe = __bind(this.subscribe, this);
      this.handleEvent = __bind(this.handleEvent, this);
      this.subscriptions = [];
      this.queue = [];
      this.pushing = false;
      this.ended = false;
      this.prevError = void 0;
      this.unsubSrc = void 0;
    }

    Dispatcher.prototype.hasSubscribers = function() {
      return this.subscriptions.length > 0;
    };

    Dispatcher.prototype.removeSub = function(subscription) {
      return this.subscriptions = _.without(subscription, this.subscriptions);
    };

    Dispatcher.prototype.push = function(event) {
      if (event.isEnd()) {
        this.ended = true;
      }
      return UpdateBarrier.inTransaction(event, this, this.pushIt, [event]);
    };

    Dispatcher.prototype.pushToSubscriptions = function(event) {
      var reply, sub, tmp, _i, _len;
      try {
        tmp = this.subscriptions;
        for (_i = 0, _len = tmp.length; _i < _len; _i++) {
          sub = tmp[_i];
          reply = sub.sink(event);
          if (reply === Bacon.noMore || event.isEnd()) {
            this.removeSub(sub);
          }
        }
        return true;
      } catch (_error) {
        this.queue = [];
        return false;
      }
    };

    Dispatcher.prototype.pushIt = function(event) {
      if (!this.pushing) {
        if (event === this.prevError) {
          return;
        }
        if (event.isError()) {
          this.prevError = event;
        }
        this.pushing = true;
        this.pushToSubscriptions(event);
        this.pushing = false;
        while (this.queue.length) {
          event = this.queue.shift();
          this.push(event);
        }
        if (this.hasSubscribers()) {
          return Bacon.more;
        } else {
          this.unsubscribeFromSource();
          return Bacon.noMore;
        }
      } else {
        this.queue.push(event);
        return Bacon.more;
      }
    };

    Dispatcher.prototype.handleEvent = function(event) {
      if (this._handleEvent) {
        return this._handleEvent(event);
      } else {
        return this.push(event);
      }
    };

    Dispatcher.prototype.unsubscribeFromSource = function() {
      if (this.unsubSrc) {
        this.unsubSrc();
      }
      return this.unsubSrc = void 0;
    };

    Dispatcher.prototype.subscribe = function(sink) {
      var subscription;
      if (this.ended) {
        sink(end());
        return nop;
      } else {
        assertFunction(sink);
        subscription = {
          sink: sink
        };
        this.subscriptions.push(subscription);
        if (this.subscriptions.length === 1) {
          this.unsubSrc = this._subscribe(this.handleEvent);
          assertFunction(this.unsubSrc);
        }
        return (function(_this) {
          return function() {
            _this.removeSub(subscription);
            if (!_this.hasSubscribers()) {
              return _this.unsubscribeFromSource();
            }
          };
        })(this);
      }
    };

    return Dispatcher;

  })();

  PropertyDispatcher = (function(_super) {
    __extends(PropertyDispatcher, _super);

    function PropertyDispatcher(property, subscribe, handleEvent) {
      this.property = property;
      this.subscribe = __bind(this.subscribe, this);
      PropertyDispatcher.__super__.constructor.call(this, subscribe, handleEvent);
      this.current = None;
      this.currentValueRootId = void 0;
      this.propertyEnded = false;
    }

    PropertyDispatcher.prototype.push = function(event) {
      if (event.isEnd()) {
        this.propertyEnded = true;
      }
      if (event.hasValue()) {
        this.current = new Some(event);
        this.currentValueRootId = UpdateBarrier.currentEventId();
      }
      return PropertyDispatcher.__super__.push.call(this, event);
    };

    PropertyDispatcher.prototype.maybeSubSource = function(sink, reply) {
      if (reply === Bacon.noMore) {
        return nop;
      } else if (this.propertyEnded) {
        sink(end());
        return nop;
      } else {
        return Dispatcher.prototype.subscribe.call(this, sink);
      }
    };

    PropertyDispatcher.prototype.subscribe = function(sink) {
      var dispatchingId, initSent, reply, valId;
      initSent = false;
      reply = Bacon.more;
      if (this.current.isDefined && (this.hasSubscribers() || this.propertyEnded)) {
        dispatchingId = UpdateBarrier.currentEventId();
        valId = this.currentValueRootId;
        if (!this.propertyEnded && valId && dispatchingId && dispatchingId !== valId) {
          UpdateBarrier.whenDoneWith(this.property, (function(_this) {
            return function() {
              if (_this.currentValueRootId === valId) {
                return sink(initial(_this.current.get().value()));
              }
            };
          })(this));
          return this.maybeSubSource(sink, reply);
        } else {
          UpdateBarrier.inTransaction(void 0, this, (function() {
            return reply = (function() {
              try {
                return sink(initial(this.current.get().value()));
              } catch (_error) {
                return Bacon.more;
              }
            }).call(this);
          }), []);
          return this.maybeSubSource(sink, reply);
        }
      } else {
        return this.maybeSubSource(sink, reply);
      }
    };

    return PropertyDispatcher;

  })(Dispatcher);

  Bus = (function(_super) {
    __extends(Bus, _super);

    function Bus() {
      this.guardedSink = __bind(this.guardedSink, this);
      this.subscribeAll = __bind(this.subscribeAll, this);
      this.unsubAll = __bind(this.unsubAll, this);
      this.sink = void 0;
      this.subscriptions = [];
      this.ended = false;
      Bus.__super__.constructor.call(this, describe(Bacon, "Bus"), this.subscribeAll);
    }

    Bus.prototype.unsubAll = function() {
      var sub, _i, _len, _ref1;
      _ref1 = this.subscriptions;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        sub = _ref1[_i];
        if (typeof sub.unsub === "function") {
          sub.unsub();
        }
      }
      return void 0;
    };

    Bus.prototype.subscribeAll = function(newSink) {
      var subscription, _i, _len, _ref1;
      this.sink = newSink;
      _ref1 = cloneArray(this.subscriptions);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        subscription = _ref1[_i];
        this.subscribeInput(subscription);
      }
      return this.unsubAll;
    };

    Bus.prototype.guardedSink = function(input) {
      return (function(_this) {
        return function(event) {
          if (event.isEnd()) {
            _this.unsubscribeInput(input);
            return Bacon.noMore;
          } else {
            return _this.sink(event);
          }
        };
      })(this);
    };

    Bus.prototype.subscribeInput = function(subscription) {
      return subscription.unsub = subscription.input.dispatcher.subscribe(this.guardedSink(subscription.input));
    };

    Bus.prototype.unsubscribeInput = function(input) {
      var i, sub, _i, _len, _ref1;
      _ref1 = this.subscriptions;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        sub = _ref1[i];
        if (sub.input === input) {
          if (typeof sub.unsub === "function") {
            sub.unsub();
          }
          this.subscriptions.splice(i, 1);
          return;
        }
      }
    };

    Bus.prototype.plug = function(input) {
      var sub;
      if (this.ended) {
        return;
      }
      sub = {
        input: input
      };
      this.subscriptions.push(sub);
      if ((this.sink != null)) {
        this.subscribeInput(sub);
      }
      return (function(_this) {
        return function() {
          return _this.unsubscribeInput(input);
        };
      })(this);
    };

    Bus.prototype.end = function() {
      this.ended = true;
      this.unsubAll();
      return typeof this.sink === "function" ? this.sink(end()) : void 0;
    };

    Bus.prototype.push = function(value) {
      return typeof this.sink === "function" ? this.sink(next(value)) : void 0;
    };

    Bus.prototype.error = function(error) {
      return typeof this.sink === "function" ? this.sink(new Error(error)) : void 0;
    };

    return Bus;

  })(EventStream);

  Source = (function() {
    function Source(obs, sync, lazy) {
      this.obs = obs;
      this.sync = sync;
      this.lazy = lazy != null ? lazy : false;
      this.queue = [];
    }

    Source.prototype.subscribe = function(sink) {
      return this.obs.dispatcher.subscribe(sink);
    };

    Source.prototype.toString = function() {
      return this.obs.toString();
    };

    Source.prototype.markEnded = function() {
      return this.ended = true;
    };

    Source.prototype.consume = function() {
      if (this.lazy) {
        return {
          value: _.always(this.queue[0])
        };
      } else {
        return this.queue[0];
      }
    };

    Source.prototype.push = function(x) {
      return this.queue = [x];
    };

    Source.prototype.mayHave = function() {
      return true;
    };

    Source.prototype.hasAtLeast = function() {
      return this.queue.length;
    };

    Source.prototype.flatten = true;

    return Source;

  })();

  ConsumingSource = (function(_super) {
    __extends(ConsumingSource, _super);

    function ConsumingSource() {
      return ConsumingSource.__super__.constructor.apply(this, arguments);
    }

    ConsumingSource.prototype.consume = function() {
      return this.queue.shift();
    };

    ConsumingSource.prototype.push = function(x) {
      return this.queue.push(x);
    };

    ConsumingSource.prototype.mayHave = function(c) {
      return !this.ended || this.queue.length >= c;
    };

    ConsumingSource.prototype.hasAtLeast = function(c) {
      return this.queue.length >= c;
    };

    ConsumingSource.prototype.flatten = false;

    return ConsumingSource;

  })(Source);

  BufferingSource = (function(_super) {
    __extends(BufferingSource, _super);

    function BufferingSource(obs) {
      BufferingSource.__super__.constructor.call(this, obs, true);
    }

    BufferingSource.prototype.consume = function() {
      var values;
      values = this.queue;
      this.queue = [];
      return {
        value: function() {
          return values;
        }
      };
    };

    BufferingSource.prototype.push = function(x) {
      return this.queue.push(x.value());
    };

    BufferingSource.prototype.hasAtLeast = function() {
      return true;
    };

    return BufferingSource;

  })(Source);

  Source.isTrigger = function(s) {
    if (s instanceof Source) {
      return s.sync;
    } else {
      return s instanceof EventStream;
    }
  };

  Source.fromObservable = function(s) {
    if (s instanceof Source) {
      return s;
    } else if (s instanceof Property) {
      return new Source(s, false);
    } else {
      return new ConsumingSource(s, true);
    }
  };

  describe = function() {
    var args, context, method;
    context = arguments[0], method = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if ((context || method) instanceof Desc) {
      return context || method;
    } else {
      return new Desc(context, method, args);
    }
  };

  findDeps = function(x) {
    if (isArray(x)) {
      return _.flatMap(findDeps, x);
    } else if (isObservable(x)) {
      return [x];
    } else if (x instanceof Source) {
      return [x.obs];
    } else {
      return [];
    }
  };

  Desc = (function() {
    function Desc(context, method, args) {
      this.context = context;
      this.method = method;
      this.args = args;
      this.cached = void 0;
    }

    Desc.prototype.deps = function() {
      return this.cached || (this.cached = findDeps([this.context].concat(this.args)));
    };

    Desc.prototype.apply = function(obs) {
      obs.desc = this;
      return obs;
    };

    Desc.prototype.toString = function() {
      return _.toString(this.context) + "." + _.toString(this.method) + "(" + _.map(_.toString, this.args) + ")";
    };

    return Desc;

  })();

  withDescription = function() {
    var desc, obs, _i;
    desc = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), obs = arguments[_i++];
    return describe.apply(null, desc).apply(obs);
  };

  Bacon.when = function() {
    var f, i, index, ix, len, needsBarrier, pat, patSources, pats, patterns, resultStream, s, sources, triggerFound, usage, _i, _j, _len, _len1, _ref1;
    if (arguments.length === 0) {
      return Bacon.never();
    }
    len = arguments.length;
    usage = "when: expecting arguments in the form (Observable+,function)+";
    assert(usage, len % 2 === 0);
    sources = [];
    pats = [];
    i = 0;
    patterns = [];
    while (i < len) {
      patterns[i] = arguments[i];
      patterns[i + 1] = arguments[i + 1];
      patSources = _.toArray(arguments[i]);
      f = arguments[i + 1];
      pat = {
        f: (isFunction(f) ? f : (function() {
          return f;
        })),
        ixs: []
      };
      triggerFound = false;
      for (_i = 0, _len = patSources.length; _i < _len; _i++) {
        s = patSources[_i];
        index = _.indexOf(sources, s);
        if (!triggerFound) {
          triggerFound = Source.isTrigger(s);
        }
        if (index < 0) {
          sources.push(s);
          index = sources.length - 1;
        }
        _ref1 = pat.ixs;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          ix = _ref1[_j];
          if (ix.index === index) {
            ix.count++;
          }
        }
        pat.ixs.push({
          index: index,
          count: 1
        });
      }
      assert("At least one EventStream required", triggerFound || (!patSources.length));
      if (patSources.length > 0) {
        pats.push(pat);
      }
      i = i + 2;
    }
    if (!sources.length) {
      return Bacon.never();
    }
    sources = _.map(Source.fromObservable, sources);
    needsBarrier = (_.any(sources, function(s) {
      return s.flatten;
    })) && (containsDuplicateDeps(_.map((function(s) {
      return s.obs;
    }), sources)));
    return resultStream = new EventStream(describe.apply(null, [Bacon, "when"].concat(__slice.call(patterns))), function(sink) {
      var cannotMatch, cannotSync, ends, match, nonFlattened, part, triggers;
      triggers = [];
      ends = false;
      match = function(p) {
        var _k, _len2, _ref2;
        _ref2 = p.ixs;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          i = _ref2[_k];
          if (!sources[i.index].hasAtLeast(i.count)) {
            return false;
          }
        }
        return true;
      };
      cannotSync = function(source) {
        return !source.sync || source.ended;
      };
      cannotMatch = function(p) {
        var _k, _len2, _ref2;
        _ref2 = p.ixs;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          i = _ref2[_k];
          if (!sources[i.index].mayHave(i.count)) {
            return true;
          }
        }
      };
      nonFlattened = function(trigger) {
        return !trigger.source.flatten;
      };
      part = function(source) {
        return function(unsubAll) {
          var flush, flushLater, flushWhileTriggers;
          flushLater = function() {
            return UpdateBarrier.whenDoneWith(resultStream, flush);
          };
          flushWhileTriggers = function() {
            var events, p, reply, trigger, _k, _len2;
            if (triggers.length > 0) {
              reply = Bacon.more;
              trigger = triggers.pop();
              for (_k = 0, _len2 = pats.length; _k < _len2; _k++) {
                p = pats[_k];
                if (match(p)) {
                  events = (function() {
                    var _l, _len3, _ref2, _results;
                    _ref2 = p.ixs;
                    _results = [];
                    for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
                      i = _ref2[_l];
                      _results.push(sources[i.index].consume());
                    }
                    return _results;
                  })();
                  reply = sink(trigger.e.apply(function() {
                    var event, values;
                    values = (function() {
                      var _l, _len3, _results;
                      _results = [];
                      for (_l = 0, _len3 = events.length; _l < _len3; _l++) {
                        event = events[_l];
                        _results.push(event.value());
                      }
                      return _results;
                    })();
                    return p.f.apply(p, values);
                  }));
                  if (triggers.length) {
                    triggers = _.filter(nonFlattened, triggers);
                  }
                  if (reply === Bacon.noMore) {
                    return reply;
                  } else {
                    return flushWhileTriggers();
                  }
                }
              }
            } else {
              return Bacon.more;
            }
          };
          flush = function() {
            var reply;
            reply = flushWhileTriggers();
            if (ends) {
              ends = false;
              if (_.all(sources, cannotSync) || _.all(pats, cannotMatch)) {
                reply = Bacon.noMore;
                sink(end());
              }
            }
            if (reply === Bacon.noMore) {
              unsubAll();
            }
            return reply;
          };
          return source.subscribe(function(e) {
            var reply;
            if (e.isEnd()) {
              ends = true;
              source.markEnded();
              flushLater();
            } else if (e.isError()) {
              reply = sink(e);
            } else {
              source.push(e);
              if (source.sync) {
                triggers.push({
                  source: source,
                  e: e
                });
                if (needsBarrier || UpdateBarrier.hasWaiters()) {
                  flushLater();
                } else {
                  flush();
                }
              }
            }
            if (reply === Bacon.noMore) {
              unsubAll();
            }
            return reply || Bacon.more;
          });
        };
      };
      return compositeUnsubscribe.apply(null, (function() {
        var _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = sources.length; _k < _len2; _k++) {
          s = sources[_k];
          _results.push(part(s));
        }
        return _results;
      })());
    });
  };

  containsDuplicateDeps = function(observables, state) {
    var checkObservable;
    if (state == null) {
      state = [];
    }
    checkObservable = function(obs) {
      var deps;
      if (_.contains(state, obs)) {
        return true;
      } else {
        deps = obs.internalDeps();
        if (deps.length) {
          state.push(obs);
          return _.any(deps, checkObservable);
        } else {
          state.push(obs);
          return false;
        }
      }
    };
    return _.any(observables, checkObservable);
  };

  Bacon.update = function() {
    var i, initial, lateBindFirst, patterns;
    initial = arguments[0], patterns = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    lateBindFirst = function(f) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return function(i) {
          return f.apply(null, [i].concat(args));
        };
      };
    };
    i = patterns.length - 1;
    while (i > 0) {
      if (!(patterns[i] instanceof Function)) {
        patterns[i] = (function(x) {
          return function() {
            return x;
          };
        })(patterns[i]);
      }
      patterns[i] = lateBindFirst(patterns[i]);
      i = i - 2;
    }
    return withDescription.apply(null, [Bacon, "update", initial].concat(__slice.call(patterns), [Bacon.when.apply(Bacon, patterns).scan(initial, (function(x, f) {
      return f(x);
    }))]));
  };

  compositeUnsubscribe = function() {
    var ss;
    ss = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return new CompositeUnsubscribe(ss).unsubscribe;
  };

  CompositeUnsubscribe = (function() {
    function CompositeUnsubscribe(ss) {
      var s, _i, _len;
      if (ss == null) {
        ss = [];
      }
      this.unsubscribe = __bind(this.unsubscribe, this);
      this.unsubscribed = false;
      this.subscriptions = [];
      this.starting = [];
      for (_i = 0, _len = ss.length; _i < _len; _i++) {
        s = ss[_i];
        this.add(s);
      }
    }

    CompositeUnsubscribe.prototype.add = function(subscription) {
      var ended, unsub, unsubMe;
      if (this.unsubscribed) {
        return;
      }
      ended = false;
      unsub = nop;
      this.starting.push(subscription);
      unsubMe = (function(_this) {
        return function() {
          if (_this.unsubscribed) {
            return;
          }
          ended = true;
          _this.remove(unsub);
          return _.remove(subscription, _this.starting);
        };
      })(this);
      unsub = subscription(this.unsubscribe, unsubMe);
      if (!(this.unsubscribed || ended)) {
        this.subscriptions.push(unsub);
      }
      _.remove(subscription, this.starting);
      return unsub;
    };

    CompositeUnsubscribe.prototype.remove = function(unsub) {
      if (this.unsubscribed) {
        return;
      }
      if ((_.remove(unsub, this.subscriptions)) !== void 0) {
        return unsub();
      }
    };

    CompositeUnsubscribe.prototype.unsubscribe = function() {
      var s, _i, _len, _ref1;
      if (this.unsubscribed) {
        return;
      }
      this.unsubscribed = true;
      _ref1 = this.subscriptions;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        s = _ref1[_i];
        s();
      }
      this.subscriptions = [];
      return this.starting = [];
    };

    CompositeUnsubscribe.prototype.count = function() {
      if (this.unsubscribed) {
        return 0;
      }
      return this.subscriptions.length + this.starting.length;
    };

    CompositeUnsubscribe.prototype.empty = function() {
      return this.count() === 0;
    };

    return CompositeUnsubscribe;

  })();

  Bacon.CompositeUnsubscribe = CompositeUnsubscribe;

  Some = (function() {
    function Some(value) {
      this.value = value;
    }

    Some.prototype.getOrElse = function() {
      return this.value;
    };

    Some.prototype.get = function() {
      return this.value;
    };

    Some.prototype.filter = function(f) {
      if (f(this.value)) {
        return new Some(this.value);
      } else {
        return None;
      }
    };

    Some.prototype.map = function(f) {
      return new Some(f(this.value));
    };

    Some.prototype.forEach = function(f) {
      return f(this.value);
    };

    Some.prototype.isDefined = true;

    Some.prototype.toArray = function() {
      return [this.value];
    };

    Some.prototype.inspect = function() {
      return "Some(" + this.value + ")";
    };

    Some.prototype.toString = function() {
      return this.inspect();
    };

    return Some;

  })();

  None = {
    getOrElse: function(value) {
      return value;
    },
    filter: function() {
      return None;
    },
    map: function() {
      return None;
    },
    forEach: function() {},
    isDefined: false,
    toArray: function() {
      return [];
    },
    inspect: function() {
      return "None";
    },
    toString: function() {
      return this.inspect();
    }
  };

  UpdateBarrier = (function() {
    var afterTransaction, afters, aftersIndex, currentEventId, flush, flushDepsOf, flushWaiters, hasWaiters, inTransaction, rootEvent, waiterObs, waiters, whenDoneWith, wrappedSubscribe;
    rootEvent = void 0;
    waiterObs = [];
    waiters = {};
    afters = [];
    aftersIndex = 0;
    afterTransaction = function(f) {
      if (rootEvent) {
        return afters.push(f);
      } else {
        return f();
      }
    };
    whenDoneWith = function(obs, f) {
      var obsWaiters;
      if (rootEvent) {
        obsWaiters = waiters[obs.id];
        if (obsWaiters == null) {
          obsWaiters = waiters[obs.id] = [f];
          return waiterObs.push(obs);
        } else {
          return obsWaiters.push(f);
        }
      } else {
        return f();
      }
    };
    flush = function() {
      while (waiterObs.length > 0) {
        flushWaiters(0);
      }
      return void 0;
    };
    flushWaiters = function(index) {
      var f, obs, obsId, obsWaiters, _i, _len;
      obs = waiterObs[index];
      obsId = obs.id;
      obsWaiters = waiters[obsId];
      waiterObs.splice(index, 1);
      delete waiters[obsId];
      flushDepsOf(obs);
      for (_i = 0, _len = obsWaiters.length; _i < _len; _i++) {
        f = obsWaiters[_i];
        f();
      }
      return void 0;
    };
    flushDepsOf = function(obs) {
      var dep, deps, index, _i, _len;
      deps = obs.internalDeps();
      for (_i = 0, _len = deps.length; _i < _len; _i++) {
        dep = deps[_i];
        flushDepsOf(dep);
        if (waiters[dep.id]) {
          index = _.indexOf(waiterObs, dep);
          flushWaiters(index);
        }
      }
      return void 0;
    };
    inTransaction = function(event, context, f, args) {
      var after, result;
      if (rootEvent) {
        return f.apply(context, args);
      } else {
        rootEvent = event;
        result = f.apply(context, args);
        flush();
        rootEvent = void 0;
        while (aftersIndex < afters.length) {
          after = afters[aftersIndex];
          aftersIndex++;
          after();
        }
        aftersIndex = 0;
        afters = [];
        return result;
      }
    };
    currentEventId = function() {
      if (rootEvent) {
        return rootEvent.id;
      } else {
        return void 0;
      }
    };
    wrappedSubscribe = function(obs, sink) {
      var doUnsub, unsub, unsubd;
      unsubd = false;
      doUnsub = function() {};
      unsub = function() {
        unsubd = true;
        return doUnsub();
      };
      doUnsub = obs.dispatcher.subscribe(function(event) {
        return afterTransaction(function() {
          var reply;
          if (!unsubd) {
            reply = sink(event);
            if (reply === Bacon.noMore) {
              return unsub();
            }
          }
        });
      });
      return unsub;
    };
    hasWaiters = function() {
      return waiterObs.length > 0;
    };
    return {
      whenDoneWith: whenDoneWith,
      hasWaiters: hasWaiters,
      inTransaction: inTransaction,
      currentEventId: currentEventId,
      wrappedSubscribe: wrappedSubscribe
    };
  })();

  Bacon.EventStream = EventStream;

  Bacon.Property = Property;

  Bacon.Observable = Observable;

  Bacon.Bus = Bus;

  Bacon.Initial = Initial;

  Bacon.Next = Next;

  Bacon.End = End;

  Bacon.Error = Error;

  nop = function() {};

  latter = function(_, x) {
    return x;
  };

  former = function(x, _) {
    return x;
  };

  initial = function(value) {
    return new Initial(value, true);
  };

  next = function(value) {
    return new Next(value, true);
  };

  end = function() {
    return new End();
  };

  toEvent = function(x) {
    if (x instanceof Event) {
      return x;
    } else {
      return next(x);
    }
  };

  cloneArray = function(xs) {
    return xs.slice(0);
  };

  assert = function(message, condition) {
    if (!condition) {
      throw new Exception(message);
    }
  };

  assertEventStream = function(event) {
    if (!(event instanceof EventStream)) {
      throw new Exception("not an EventStream : " + event);
    }
  };

  assertFunction = function(f) {
    return assert("not a function : " + f, isFunction(f));
  };

  isFunction = function(f) {
    return typeof f === "function";
  };

  isArray = function(xs) {
    return xs instanceof Array;
  };

  isObservable = function(x) {
    return x instanceof Observable;
  };

  assertArray = function(xs) {
    if (!isArray(xs)) {
      throw new Exception("not an array : " + xs);
    }
  };

  assertNoArguments = function(args) {
    return assert("no arguments supported", args.length === 0);
  };

  assertString = function(x) {
    if (typeof x !== "string") {
      throw new Exception("not a string : " + x);
    }
  };

  partiallyApplied = function(f, applied) {
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return f.apply(null, applied.concat(args));
    };
  };

  makeSpawner = function(args) {
    if (args.length === 1 && isObservable(args[0])) {
      return _.always(args[0]);
    } else {
      return makeFunctionArgs(args);
    }
  };

  makeFunctionArgs = function(args) {
    args = Array.prototype.slice.call(args);
    return makeFunction_.apply(null, args);
  };

  makeFunction_ = withMethodCallSupport(function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (isFunction(f)) {
      if (args.length) {
        return partiallyApplied(f, args);
      } else {
        return f;
      }
    } else if (isFieldKey(f)) {
      return toFieldExtractor(f, args);
    } else {
      return _.always(f);
    }
  });

  makeFunction = function(f, args) {
    return makeFunction_.apply(null, [f].concat(__slice.call(args)));
  };

  makeObservable = function(x) {
    if (isObservable(x)) {
      return x;
    } else {
      return Bacon.once(x);
    }
  };

  isFieldKey = function(f) {
    return (typeof f === "string") && f.length > 1 && f.charAt(0) === ".";
  };

  Bacon.isFieldKey = isFieldKey;

  toFieldExtractor = function(f, args) {
    var partFuncs, parts;
    parts = f.slice(1).split(".");
    partFuncs = _.map(toSimpleExtractor(args), parts);
    return function(value) {
      var _i, _len;
      for (_i = 0, _len = partFuncs.length; _i < _len; _i++) {
        f = partFuncs[_i];
        value = f(value);
      }
      return value;
    };
  };

  toSimpleExtractor = function(args) {
    return function(key) {
      return function(value) {
        var fieldValue;
        if (value == null) {
          return void 0;
        } else {
          fieldValue = value[key];
          if (isFunction(fieldValue)) {
            return fieldValue.apply(value, args);
          } else {
            return fieldValue;
          }
        }
      };
    };
  };

  toFieldKey = function(f) {
    return f.slice(1);
  };

  toCombinator = function(f) {
    var key;
    if (isFunction(f)) {
      return f;
    } else if (isFieldKey(f)) {
      key = toFieldKey(f);
      return function(left, right) {
        return left[key](right);
      };
    } else {
      return assert("not a function or a field key: " + f, false);
    }
  };

  toOption = function(v) {
    if (v instanceof Some || v === None) {
      return v;
    } else {
      return new Some(v);
    }
  };

  _ = {
    indexOf: Array.prototype.indexOf ? function(xs, x) {
      return xs.indexOf(x);
    } : function(xs, x) {
      var i, y, _i, _len;
      for (i = _i = 0, _len = xs.length; _i < _len; i = ++_i) {
        y = xs[i];
        if (x === y) {
          return i;
        }
      }
      return -1;
    },
    indexWhere: function(xs, f) {
      var i, y, _i, _len;
      for (i = _i = 0, _len = xs.length; _i < _len; i = ++_i) {
        y = xs[i];
        if (f(y)) {
          return i;
        }
      }
      return -1;
    },
    head: function(xs) {
      return xs[0];
    },
    always: function(x) {
      return function() {
        return x;
      };
    },
    negate: function(f) {
      return function(x) {
        return !f(x);
      };
    },
    empty: function(xs) {
      return xs.length === 0;
    },
    tail: function(xs) {
      return xs.slice(1, xs.length);
    },
    filter: function(f, xs) {
      var filtered, x, _i, _len;
      filtered = [];
      for (_i = 0, _len = xs.length; _i < _len; _i++) {
        x = xs[_i];
        if (f(x)) {
          filtered.push(x);
        }
      }
      return filtered;
    },
    map: function(f, xs) {
      var x, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = xs.length; _i < _len; _i++) {
        x = xs[_i];
        _results.push(f(x));
      }
      return _results;
    },
    each: function(xs, f) {
      var key, value;
      for (key in xs) {
        value = xs[key];
        f(key, value);
      }
      return void 0;
    },
    toArray: function(xs) {
      if (isArray(xs)) {
        return xs;
      } else {
        return [xs];
      }
    },
    contains: function(xs, x) {
      return _.indexOf(xs, x) !== -1;
    },
    id: function(x) {
      return x;
    },
    last: function(xs) {
      return xs[xs.length - 1];
    },
    all: function(xs, f) {
      var x, _i, _len;
      if (f == null) {
        f = _.id;
      }
      for (_i = 0, _len = xs.length; _i < _len; _i++) {
        x = xs[_i];
        if (!f(x)) {
          return false;
        }
      }
      return true;
    },
    any: function(xs, f) {
      var x, _i, _len;
      if (f == null) {
        f = _.id;
      }
      for (_i = 0, _len = xs.length; _i < _len; _i++) {
        x = xs[_i];
        if (f(x)) {
          return true;
        }
      }
      return false;
    },
    without: function(x, xs) {
      return _.filter((function(y) {
        return y !== x;
      }), xs);
    },
    remove: function(x, xs) {
      var i;
      i = _.indexOf(xs, x);
      if (i >= 0) {
        return xs.splice(i, 1);
      }
    },
    fold: function(xs, seed, f) {
      var x, _i, _len;
      for (_i = 0, _len = xs.length; _i < _len; _i++) {
        x = xs[_i];
        seed = f(seed, x);
      }
      return seed;
    },
    flatMap: function(f, xs) {
      return _.fold(xs, [], (function(ys, x) {
        return ys.concat(f(x));
      }));
    },
    cached: function(f) {
      var value;
      value = None;
      return function() {
        if (value === None) {
          value = f();
          f = void 0;
        }
        return value;
      };
    },
    toString: function(obj) {
      var ex, internals, key, value;
      try {
        recursionDepth++;
        if (obj == null) {
          return "undefined";
        } else if (isFunction(obj)) {
          return "function";
        } else if (isArray(obj)) {
          if (recursionDepth > 5) {
            return "[..]";
          }
          return "[" + _.map(_.toString, obj).toString() + "]";
        } else if (((obj != null ? obj.toString : void 0) != null) && obj.toString !== Object.prototype.toString) {
          return obj.toString();
        } else if (typeof obj === "object") {
          if (recursionDepth > 5) {
            return "{..}";
          }
          internals = (function() {
            var _results;
            _results = [];
            for (key in obj) {
              if (!__hasProp.call(obj, key)) continue;
              value = (function() {
                try {
                  return obj[key];
                } catch (_error) {
                  ex = _error;
                  return ex;
                }
              })();
              _results.push(_.toString(key) + ":" + _.toString(value));
            }
            return _results;
          })();
          return "{" + internals + "}";
        } else {
          return obj;
        }
      } finally {
        recursionDepth--;
      }
    }
  };

  recursionDepth = 0;

  Bacon._ = _;

  Bacon.scheduler = {
    setTimeout: function(f, d) {
      return setTimeout(f, d);
    },
    setInterval: function(f, i) {
      return setInterval(f, i);
    },
    clearInterval: function(id) {
      return clearInterval(id);
    },
    now: function() {
      return new Date().getTime();
    }
  };

  if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
    define([], function() {
      return Bacon;
    });
    this.Bacon = Bacon;
  } else if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
    module.exports = Bacon;
    Bacon.Bacon = Bacon;
  } else {
    this.Bacon = Bacon;
  }

}).call(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},["/Volumes/Work/server/projects/hsl/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYWNvbmpzL2Rpc3QvQmFjb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBCYWNvbiA9IHJlcXVpcmUoJ2JhY29uanMnKTtcblxudmFyIGJvZHkgPSAkKCdib2R5JyksXG4gICAgY29udGFpbmVyID0gJCgnLmNvbnRhaW5lcicpO1xuXG5mdW5jdGlvbiB4eUZyb21FdmVudChlKXsgcmV0dXJuIFtlLmNsaWVudFgsIGUuY2xpZW50WV07IH1cbmZ1bmN0aW9uIHRvSHVlU2F0dXJhdGlvbih2KXsgcmV0dXJuIFt2WzBdICogKDM2MCAvIGJvZHkud2lkdGgoKSkudG9GaXhlZCgyKSwgKHZbMV0gKiAoMTAwIC8gYm9keS5oZWlnaHQoKSkpLnRvRml4ZWQoMildOyB9XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFBvc2l0aW9uKCl7IHJldHVybiBNYXRoLnJvdW5kKGNvbnRhaW5lci5zY3JvbGxUb3AoKSAvIGNvbnRhaW5lci5oZWlnaHQoKSAqIDEwMCk7IH1cbmZ1bmN0aW9uIGxpZ2h0bmVzc0Zyb21TY3JvbGxQb3NpdGlvbih2KXsgcmV0dXJuIHZhbCA8IDAgPyAwIDogdmFsID4gMTAwID8gMTAwIDogdmFsOyB9XG5cbiQoZnVuY3Rpb24oKXtcbiAgdmFyIG1vdXNlUG9zaXRpb25TdHJlYW0gPSBib2R5XG4gICAgLmFzRXZlbnRTdHJlYW0oJ21vdXNlbW92ZScpXG4gICAgLm1hcCh4eUZyb21FdmVudClcbiAgICAubWFwKHRvSHVlU2F0dXJhdGlvbik7XG5cbiAgdmFyIHZTY3JvbGxTdHJlYW0gPSAkKCcuY29udGFpbmVyJylcbiAgICAuYXNFdmVudFN0cmVhbSgnc2Nyb2xsJylcbiAgICAuc3RhcnRXaXRoKDApXG4gICAgLm1hcChnZXRTY3JvbGxQb3NpdGlvbilcbiAgICAubWFwKGxpZ2h0bmVzc0Zyb21TY3JvbGxQb3NpdGlvbik7XG5cbiAgdmFyIGNsaWNrU3RyZWFtID0gYm9keVxuICAgIC5hc0V2ZW50U3RyZWFtKCdjbGljaycpXG4gICAgLmZpbHRlcihmdW5jdGlvbihlKXsgcmV0dXJuICEkKGUudGFyZ2V0KS5oYXNDbGFzcygnbG9ja2VkJyk7ICB9KSAvLyBmaWx0ZXIgb3V0IGNsaWNrcyBvbiB0aGUgLmxvY2tlZCBlbGVtZW50XG4gICAgLnNjYW4oMSwgZnVuY3Rpb24oYSl7IHJldHVybiAhYTsgfSk7XG5cbiAgQmFjb24uY29tYmluZVdpdGgoXG4gICAgZnVuY3Rpb24ocG9zLCBzY3JvbGwsIHVubG9ja2VkKXsgcmV0dXJuIHVubG9ja2VkICYmIHBvcy5jb25jYXQoc2Nyb2xsKTsgfSwgbW91c2VQb3NpdGlvblN0cmVhbSwgdlNjcm9sbFN0cmVhbSwgY2xpY2tTdHJlYW0pXG4gICAgLm9uVmFsdWUoZnVuY3Rpb24odil7XG4gICAgICBpZih2KXtcbiAgICAgICAgJCgnLmNvbnRhaW5lcicpLmNzcygnYmFja2dyb3VuZCcsICdoc2woJyt2WzBdKycsICcrdlsxXSsnJSwgJyt2WzJdKyclKScpO1xuICAgICAgICAkKCcuY29sb3InKS5odG1sKHYuam9pbignICcpICsgJzxicj4nICsgY29udGFpbmVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicpKTtcbiAgICAgICAgJCgnLmNvbG9yJykucmVtb3ZlQ2xhc3MoJ2xvY2tlZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJCgnLmNvbG9yJykuYWRkQ2xhc3MoJ2xvY2tlZCcpO1xuICAgICAgfVxuICB9KTtcblxuXG59KTtcblxuXG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4oZnVuY3Rpb24oKSB7XG4gIHZhciBCYWNvbiwgQnVmZmVyaW5nU291cmNlLCBCdXMsIENvbXBvc2l0ZVVuc3Vic2NyaWJlLCBDb25zdW1pbmdTb3VyY2UsIERlc2MsIERpc3BhdGNoZXIsIEVuZCwgRXJyb3IsIEV2ZW50LCBFdmVudFN0cmVhbSwgRXhjZXB0aW9uLCBJbml0aWFsLCBOZXh0LCBOb25lLCBPYnNlcnZhYmxlLCBQcm9wZXJ0eSwgUHJvcGVydHlEaXNwYXRjaGVyLCBTb21lLCBTb3VyY2UsIFVwZGF0ZUJhcnJpZXIsIGFkZFByb3BlcnR5SW5pdFZhbHVlVG9TdHJlYW0sIGFzc2VydCwgYXNzZXJ0QXJyYXksIGFzc2VydEV2ZW50U3RyZWFtLCBhc3NlcnRGdW5jdGlvbiwgYXNzZXJ0Tm9Bcmd1bWVudHMsIGFzc2VydFN0cmluZywgY2xvbmVBcnJheSwgY29tcG9zaXRlVW5zdWJzY3JpYmUsIGNvbnRhaW5zRHVwbGljYXRlRGVwcywgY29udmVydEFyZ3NUb0Z1bmN0aW9uLCBkZXNjcmliZSwgZW5kLCBldmVudElkQ291bnRlciwgZmluZERlcHMsIGZsYXRNYXBfLCBmb3JtZXIsIGlkQ291bnRlciwgaW5pdGlhbCwgaXNBcnJheSwgaXNGaWVsZEtleSwgaXNGdW5jdGlvbiwgaXNPYnNlcnZhYmxlLCBsYXR0ZXIsIGxpZnRDYWxsYmFjaywgbWFrZUZ1bmN0aW9uLCBtYWtlRnVuY3Rpb25BcmdzLCBtYWtlRnVuY3Rpb25fLCBtYWtlT2JzZXJ2YWJsZSwgbWFrZVNwYXduZXIsIG5leHQsIG5vcCwgcGFydGlhbGx5QXBwbGllZCwgcmVjdXJzaW9uRGVwdGgsIHJlZ2lzdGVyT2JzLCBzcHlzLCB0b0NvbWJpbmF0b3IsIHRvRXZlbnQsIHRvRmllbGRFeHRyYWN0b3IsIHRvRmllbGRLZXksIHRvT3B0aW9uLCB0b1NpbXBsZUV4dHJhY3Rvciwgd2l0aERlc2NyaXB0aW9uLCB3aXRoTWV0aG9kQ2FsbFN1cHBvcnQsIF8sIF9yZWYsXG4gICAgX19zbGljZSA9IFtdLnNsaWNlLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICAgIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIF9fYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgQmFjb24gPSB7XG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiQmFjb25cIjtcbiAgICB9XG4gIH07XG5cbiAgQmFjb24udmVyc2lvbiA9ICcwLjcuMzcnO1xuXG4gIEV4Y2VwdGlvbiA9ICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIGdsb2JhbCAhPT0gbnVsbCA/IGdsb2JhbCA6IHRoaXMpLkVycm9yO1xuXG4gIEJhY29uLmZyb21CaW5kZXIgPSBmdW5jdGlvbihiaW5kZXIsIGV2ZW50VHJhbnNmb3JtZXIpIHtcbiAgICBpZiAoZXZlbnRUcmFuc2Zvcm1lciA9PSBudWxsKSB7XG4gICAgICBldmVudFRyYW5zZm9ybWVyID0gXy5pZDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFdmVudFN0cmVhbShkZXNjcmliZShCYWNvbiwgXCJmcm9tQmluZGVyXCIsIGJpbmRlciwgZXZlbnRUcmFuc2Zvcm1lciksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHZhciB1bmJpbmQsIHVuYmluZGVyLCB1bmJvdW5kO1xuICAgICAgdW5ib3VuZCA9IGZhbHNlO1xuICAgICAgdW5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdW5iaW5kZXIgIT09IFwidW5kZWZpbmVkXCIgJiYgdW5iaW5kZXIgIT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoIXVuYm91bmQpIHtcbiAgICAgICAgICAgIHVuYmluZGVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB1bmJvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHVuYmluZGVyID0gYmluZGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncywgZXZlbnQsIHJlcGx5LCB2YWx1ZSwgX2ksIF9sZW47XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICB2YWx1ZSA9IGV2ZW50VHJhbnNmb3JtZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGlmICghKGlzQXJyYXkodmFsdWUpICYmIF8ubGFzdCh2YWx1ZSkgaW5zdGFuY2VvZiBFdmVudCkpIHtcbiAgICAgICAgICB2YWx1ZSA9IFt2YWx1ZV07XG4gICAgICAgIH1cbiAgICAgICAgcmVwbHkgPSBCYWNvbi5tb3JlO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHZhbHVlLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgZXZlbnQgPSB2YWx1ZVtfaV07XG4gICAgICAgICAgcmVwbHkgPSBzaW5rKGV2ZW50ID0gdG9FdmVudChldmVudCkpO1xuICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlIHx8IGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgIGlmICh1bmJpbmRlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHVuYmluZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgQmFjb24uc2NoZWR1bGVyLnNldFRpbWVvdXQodW5iaW5kLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXBseTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcGx5O1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdW5iaW5kO1xuICAgIH0pO1xuICB9O1xuXG4gIEJhY29uLiQgPSB7fTtcblxuICBCYWNvbi4kLmFzRXZlbnRTdHJlYW0gPSBmdW5jdGlvbihldmVudE5hbWUsIHNlbGVjdG9yLCBldmVudFRyYW5zZm9ybWVyKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XG4gICAgICBfcmVmID0gW3NlbGVjdG9yLCB2b2lkIDBdLCBldmVudFRyYW5zZm9ybWVyID0gX3JlZlswXSwgc2VsZWN0b3IgPSBfcmVmWzFdO1xuICAgIH1cbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMuc2VsZWN0b3IgfHwgdGhpcywgXCJhc0V2ZW50U3RyZWFtXCIsIGV2ZW50TmFtZSwgQmFjb24uZnJvbUJpbmRlcigoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICAgIF90aGlzLm9uKGV2ZW50TmFtZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLm9mZihldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSkodGhpcyksIGV2ZW50VHJhbnNmb3JtZXIpKTtcbiAgfTtcblxuICBpZiAoKF9yZWYgPSB0eXBlb2YgalF1ZXJ5ICE9PSBcInVuZGVmaW5lZFwiICYmIGpRdWVyeSAhPT0gbnVsbCA/IGpRdWVyeSA6IHR5cGVvZiBaZXB0byAhPT0gXCJ1bmRlZmluZWRcIiAmJiBaZXB0byAhPT0gbnVsbCA/IFplcHRvIDogdm9pZCAwKSAhPSBudWxsKSB7XG4gICAgX3JlZi5mbi5hc0V2ZW50U3RyZWFtID0gQmFjb24uJC5hc0V2ZW50U3RyZWFtO1xuICB9XG5cbiAgQmFjb24uZnJvbUV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24odGFyZ2V0LCBldmVudE5hbWUsIGV2ZW50VHJhbnNmb3JtZXIpIHtcbiAgICB2YXIgc3ViLCB1bnN1YiwgX3JlZjEsIF9yZWYyLCBfcmVmMywgX3JlZjQsIF9yZWY1LCBfcmVmNjtcbiAgICBzdWIgPSAoX3JlZjEgPSAoX3JlZjIgPSAoX3JlZjMgPSB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcikgIT0gbnVsbCA/IF9yZWYzIDogdGFyZ2V0LmFkZExpc3RlbmVyKSAhPSBudWxsID8gX3JlZjIgOiB0YXJnZXQuYmluZCkgIT0gbnVsbCA/IF9yZWYxIDogdGFyZ2V0Lm9uO1xuICAgIHVuc3ViID0gKF9yZWY0ID0gKF9yZWY1ID0gKF9yZWY2ID0gdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIpICE9IG51bGwgPyBfcmVmNiA6IHRhcmdldC5yZW1vdmVMaXN0ZW5lcikgIT0gbnVsbCA/IF9yZWY1IDogdGFyZ2V0LnVuYmluZCkgIT0gbnVsbCA/IF9yZWY0IDogdGFyZ2V0Lm9mZjtcbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKEJhY29uLCBcImZyb21FdmVudFRhcmdldFwiLCB0YXJnZXQsIGV2ZW50TmFtZSwgQmFjb24uZnJvbUJpbmRlcihmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICBzdWIuY2FsbCh0YXJnZXQsIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1bnN1Yi5jYWxsKHRhcmdldCwgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgIH07XG4gICAgfSwgZXZlbnRUcmFuc2Zvcm1lcikpO1xuICB9O1xuXG4gIEJhY29uLmZyb21Qcm9taXNlID0gZnVuY3Rpb24ocHJvbWlzZSwgYWJvcnQpIHtcbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKEJhY29uLCBcImZyb21Qcm9taXNlXCIsIHByb21pc2UsIEJhY29uLmZyb21CaW5kZXIoZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgcHJvbWlzZS50aGVuKGhhbmRsZXIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZXIobmV3IEVycm9yKGUpKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoYWJvcnQpIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIHByb21pc2UuYWJvcnQgPT09IFwiZnVuY3Rpb25cIiA/IHByb21pc2UuYWJvcnQoKSA6IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LCAoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiBbdmFsdWUsIGVuZCgpXTtcbiAgICB9KSkpO1xuICB9O1xuXG4gIEJhY29uLm5vTW9yZSA9IFtcIjxuby1tb3JlPlwiXTtcblxuICBCYWNvbi5tb3JlID0gW1wiPG1vcmU+XCJdO1xuXG4gIEJhY29uLmxhdGVyID0gZnVuY3Rpb24oZGVsYXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihCYWNvbiwgXCJsYXRlclwiLCBkZWxheSwgdmFsdWUsIEJhY29uLmZyb21Qb2xsKGRlbGF5LCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbdmFsdWUsIGVuZCgpXTtcbiAgICB9KSk7XG4gIH07XG5cbiAgQmFjb24uc2VxdWVudGlhbGx5ID0gZnVuY3Rpb24oZGVsYXksIHZhbHVlcykge1xuICAgIHZhciBpbmRleDtcbiAgICBpbmRleCA9IDA7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihCYWNvbiwgXCJzZXF1ZW50aWFsbHlcIiwgZGVsYXksIHZhbHVlcywgQmFjb24uZnJvbVBvbGwoZGVsYXksIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFsdWUgPSB2YWx1ZXNbaW5kZXgrK107XG4gICAgICBpZiAoaW5kZXggPCB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFt2YWx1ZSwgZW5kKCldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVuZCgpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfTtcblxuICBCYWNvbi5yZXBlYXRlZGx5ID0gZnVuY3Rpb24oZGVsYXksIHZhbHVlcykge1xuICAgIHZhciBpbmRleDtcbiAgICBpbmRleCA9IDA7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihCYWNvbiwgXCJyZXBlYXRlZGx5XCIsIGRlbGF5LCB2YWx1ZXMsIEJhY29uLmZyb21Qb2xsKGRlbGF5LCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB2YWx1ZXNbaW5kZXgrKyAlIHZhbHVlcy5sZW5ndGhdO1xuICAgIH0pKTtcbiAgfTtcblxuICBCYWNvbi5zcHkgPSBmdW5jdGlvbihzcHkpIHtcbiAgICByZXR1cm4gc3B5cy5wdXNoKHNweSk7XG4gIH07XG5cbiAgc3B5cyA9IFtdO1xuXG4gIHJlZ2lzdGVyT2JzID0gZnVuY3Rpb24ob2JzKSB7XG4gICAgdmFyIHNweSwgX2ksIF9sZW47XG4gICAgaWYgKHNweXMubGVuZ3RoKSB7XG4gICAgICBpZiAoIXJlZ2lzdGVyT2JzLnJ1bm5pbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZWdpc3Rlck9icy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNweXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgIHNweSA9IHNweXNbX2ldO1xuICAgICAgICAgICAgc3B5KG9icyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGRlbGV0ZSByZWdpc3Rlck9icy5ydW5uaW5nO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2b2lkIDA7XG4gIH07XG5cbiAgd2l0aE1ldGhvZENhbGxTdXBwb3J0ID0gZnVuY3Rpb24od3JhcHBlZCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBjb250ZXh0LCBmLCBtZXRob2ROYW1lO1xuICAgICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBpZiAodHlwZW9mIGYgPT09IFwib2JqZWN0XCIgJiYgYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29udGV4dCA9IGY7XG4gICAgICAgIG1ldGhvZE5hbWUgPSBhcmdzWzBdO1xuICAgICAgICBmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHRbbWV0aG9kTmFtZV0uYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd3JhcHBlZC5hcHBseShudWxsLCBbZl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmdzKSkpO1xuICAgIH07XG4gIH07XG5cbiAgbGlmdENhbGxiYWNrID0gZnVuY3Rpb24oZGVzYywgd3JhcHBlZCkge1xuICAgIHJldHVybiB3aXRoTWV0aG9kQ2FsbFN1cHBvcnQoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZiwgc3RyZWFtO1xuICAgICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBzdHJlYW0gPSBwYXJ0aWFsbHlBcHBsaWVkKHdyYXBwZWQsIFtcbiAgICAgICAgZnVuY3Rpb24odmFsdWVzLCBjYWxsYmFjaykge1xuICAgICAgICAgIHJldHVybiBmLmFwcGx5KG51bGwsIF9fc2xpY2UuY2FsbCh2YWx1ZXMpLmNvbmNhdChbY2FsbGJhY2tdKSk7XG4gICAgICAgIH1cbiAgICAgIF0pO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbi5hcHBseShudWxsLCBbQmFjb24sIGRlc2MsIGZdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJncyksIFtCYWNvbi5jb21iaW5lQXNBcnJheShhcmdzKS5mbGF0TWFwKHN0cmVhbSldKSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQmFjb24uZnJvbUNhbGxiYWNrID0gbGlmdENhbGxiYWNrKFwiZnJvbUNhbGxiYWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBmO1xuICAgIGYgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIHJldHVybiBCYWNvbi5mcm9tQmluZGVyKGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgIG1ha2VGdW5jdGlvbihmLCBhcmdzKShoYW5kbGVyKTtcbiAgICAgIHJldHVybiBub3A7XG4gICAgfSwgKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gW3ZhbHVlLCBlbmQoKV07XG4gICAgfSkpO1xuICB9KTtcblxuICBCYWNvbi5mcm9tTm9kZUNhbGxiYWNrID0gbGlmdENhbGxiYWNrKFwiZnJvbU5vZGVDYWxsYmFja1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywgZjtcbiAgICBmID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICByZXR1cm4gQmFjb24uZnJvbUJpbmRlcihmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICBtYWtlRnVuY3Rpb24oZiwgYXJncykoaGFuZGxlcik7XG4gICAgICByZXR1cm4gbm9wO1xuICAgIH0sIGZ1bmN0aW9uKGVycm9yLCB2YWx1ZSkge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBbbmV3IEVycm9yKGVycm9yKSwgZW5kKCldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFt2YWx1ZSwgZW5kKCldO1xuICAgIH0pO1xuICB9KTtcblxuICBCYWNvbi5mcm9tUG9sbCA9IGZ1bmN0aW9uKGRlbGF5LCBwb2xsKSB7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihCYWNvbiwgXCJmcm9tUG9sbFwiLCBkZWxheSwgcG9sbCwgQmFjb24uZnJvbUJpbmRlcigoZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgdmFyIGlkO1xuICAgICAgaWQgPSBCYWNvbi5zY2hlZHVsZXIuc2V0SW50ZXJ2YWwoaGFuZGxlciwgZGVsYXkpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQmFjb24uc2NoZWR1bGVyLmNsZWFySW50ZXJ2YWwoaWQpO1xuICAgICAgfTtcbiAgICB9KSwgcG9sbCkpO1xuICB9O1xuXG4gIEJhY29uLmludGVydmFsID0gZnVuY3Rpb24oZGVsYXksIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIHZhbHVlID0ge307XG4gICAgfVxuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwiaW50ZXJ2YWxcIiwgZGVsYXksIHZhbHVlLCBCYWNvbi5mcm9tUG9sbChkZWxheSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV4dCh2YWx1ZSk7XG4gICAgfSkpO1xuICB9O1xuXG4gIEJhY29uLmNvbnN0YW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IFByb3BlcnR5KGRlc2NyaWJlKEJhY29uLCBcImNvbnN0YW50XCIsIHZhbHVlKSwgZnVuY3Rpb24oc2luaykge1xuICAgICAgc2luayhpbml0aWFsKHZhbHVlKSk7XG4gICAgICBzaW5rKGVuZCgpKTtcbiAgICAgIHJldHVybiBub3A7XG4gICAgfSk7XG4gIH07XG5cbiAgQmFjb24ubmV2ZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKEJhY29uLCBcIm5ldmVyXCIpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICBzaW5rKGVuZCgpKTtcbiAgICAgIHJldHVybiBub3A7XG4gICAgfSk7XG4gIH07XG5cbiAgQmFjb24ub25jZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBFdmVudFN0cmVhbShkZXNjcmliZShCYWNvbiwgXCJvbmNlXCIsIHZhbHVlKSwgZnVuY3Rpb24oc2luaykge1xuICAgICAgc2luayh0b0V2ZW50KHZhbHVlKSk7XG4gICAgICBzaW5rKGVuZCgpKTtcbiAgICAgIHJldHVybiBub3A7XG4gICAgfSk7XG4gIH07XG5cbiAgQmFjb24uZnJvbUFycmF5ID0gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIGk7XG4gICAgYXNzZXJ0QXJyYXkodmFsdWVzKTtcbiAgICBpID0gMDtcbiAgICByZXR1cm4gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKEJhY29uLCBcImZyb21BcnJheVwiLCB2YWx1ZXMpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICB2YXIgcmVwbHksIHVuc3ViZCwgdmFsdWU7XG4gICAgICB1bnN1YmQgPSBmYWxzZTtcbiAgICAgIHJlcGx5ID0gQmFjb24ubW9yZTtcbiAgICAgIHdoaWxlICgocmVwbHkgIT09IEJhY29uLm5vTW9yZSkgJiYgIXVuc3ViZCkge1xuICAgICAgICBpZiAoaSA+PSB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgc2luayhlbmQoKSk7XG4gICAgICAgICAgcmVwbHkgPSBCYWNvbi5ub01vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbaSsrXTtcbiAgICAgICAgICByZXBseSA9IHNpbmsodG9FdmVudCh2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1bnN1YmQgPSB0cnVlO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICBCYWNvbi5tZXJnZUFsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHJlYW1zO1xuICAgIHN0cmVhbXMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGlmIChpc0FycmF5KHN0cmVhbXNbMF0pKSB7XG4gICAgICBzdHJlYW1zID0gc3RyZWFtc1swXTtcbiAgICB9XG4gICAgaWYgKHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlLmFwcGx5KG51bGwsIFtCYWNvbiwgXCJtZXJnZUFsbFwiXS5jb25jYXQoX19zbGljZS5jYWxsKHN0cmVhbXMpKSksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgICAgdmFyIGVuZHMsIHNpbmtzLCBzbWFydFNpbms7XG4gICAgICAgIGVuZHMgPSAwO1xuICAgICAgICBzbWFydFNpbmsgPSBmdW5jdGlvbihvYnMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odW5zdWJCb3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JzLmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgIHZhciByZXBseTtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgICAgICBlbmRzKys7XG4gICAgICAgICAgICAgICAgaWYgKGVuZHMgPT09IHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2luayhlbmQoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBCYWNvbi5tb3JlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXBseSA9IHNpbmsoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgICAgICB1bnN1YkJvdGgoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGx5O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBzaW5rcyA9IF8ubWFwKHNtYXJ0U2luaywgc3RyZWFtcyk7XG4gICAgICAgIHJldHVybiBjb21wb3NpdGVVbnN1YnNjcmliZS5hcHBseShudWxsLCBzaW5rcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJhY29uLm5ldmVyKCk7XG4gICAgfVxuICB9O1xuXG4gIEJhY29uLnppcEFzQXJyYXkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyZWFtcztcbiAgICBzdHJlYW1zID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICBpZiAoaXNBcnJheShzdHJlYW1zWzBdKSkge1xuICAgICAgc3RyZWFtcyA9IHN0cmVhbXNbMF07XG4gICAgfVxuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW0JhY29uLCBcInppcEFzQXJyYXlcIl0uY29uY2F0KF9fc2xpY2UuY2FsbChzdHJlYW1zKSwgW0JhY29uLnppcFdpdGgoc3RyZWFtcywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgeHM7XG4gICAgICB4cyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICByZXR1cm4geHM7XG4gICAgfSldKSk7XG4gIH07XG5cbiAgQmFjb24uemlwV2l0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmLCBzdHJlYW1zLCBfcmVmMTtcbiAgICBmID0gYXJndW1lbnRzWzBdLCBzdHJlYW1zID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBpZiAoIWlzRnVuY3Rpb24oZikpIHtcbiAgICAgIF9yZWYxID0gW2YsIHN0cmVhbXNbMF1dLCBzdHJlYW1zID0gX3JlZjFbMF0sIGYgPSBfcmVmMVsxXTtcbiAgICB9XG4gICAgc3RyZWFtcyA9IF8ubWFwKChmdW5jdGlvbihzKSB7XG4gICAgICByZXR1cm4gcy50b0V2ZW50U3RyZWFtKCk7XG4gICAgfSksIHN0cmVhbXMpO1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW0JhY29uLCBcInppcFdpdGhcIiwgZl0uY29uY2F0KF9fc2xpY2UuY2FsbChzdHJlYW1zKSwgW0JhY29uLndoZW4oc3RyZWFtcywgZildKSk7XG4gIH07XG5cbiAgQmFjb24uZ3JvdXBTaW11bHRhbmVvdXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcywgc291cmNlcywgc3RyZWFtcztcbiAgICBzdHJlYW1zID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICBpZiAoc3RyZWFtcy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShzdHJlYW1zWzBdKSkge1xuICAgICAgc3RyZWFtcyA9IHN0cmVhbXNbMF07XG4gICAgfVxuICAgIHNvdXJjZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gc3RyZWFtcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBzID0gc3RyZWFtc1tfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2gobmV3IEJ1ZmZlcmluZ1NvdXJjZShzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfSkoKTtcbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFtCYWNvbiwgXCJncm91cFNpbXVsdGFuZW91c1wiXS5jb25jYXQoX19zbGljZS5jYWxsKHN0cmVhbXMpLCBbQmFjb24ud2hlbihzb3VyY2VzLCAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgeHM7XG4gICAgICB4cyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICByZXR1cm4geHM7XG4gICAgfSkpXSkpO1xuICB9O1xuXG4gIEJhY29uLmNvbWJpbmVBc0FycmF5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGV4LCBzLCBzb3VyY2VzLCBzdHJlYW0sIHN0cmVhbXMsIF9pLCBfbGVuO1xuICAgIHN0cmVhbXMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGlmIChzdHJlYW1zLmxlbmd0aCA9PT0gMSAmJiBpc0FycmF5KHN0cmVhbXNbMF0pKSB7XG4gICAgICBzdHJlYW1zID0gc3RyZWFtc1swXTtcbiAgICB9XG4gICAgZm9yIChpbmRleCA9IF9pID0gMCwgX2xlbiA9IHN0cmVhbXMubGVuZ3RoOyBfaSA8IF9sZW47IGluZGV4ID0gKytfaSkge1xuICAgICAgc3RyZWFtID0gc3RyZWFtc1tpbmRleF07XG4gICAgICBpZiAoIShpc09ic2VydmFibGUoc3RyZWFtKSkpIHtcbiAgICAgICAgc3RyZWFtc1tpbmRleF0gPSBCYWNvbi5jb25zdGFudChzdHJlYW0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgIHNvdXJjZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaiwgX2xlbjEsIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBzdHJlYW1zLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIHMgPSBzdHJlYW1zW19qXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKG5ldyBTb3VyY2UocywgdHJ1ZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCk7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFtCYWNvbiwgXCJjb21iaW5lQXNBcnJheVwiXS5jb25jYXQoX19zbGljZS5jYWxsKHN0cmVhbXMpLCBbQmFjb24ud2hlbihzb3VyY2VzLCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB4cztcbiAgICAgICAgeHMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4geHM7XG4gICAgICB9KSkudG9Qcm9wZXJ0eSgpXSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmFjb24uY29uc3RhbnQoW10pO1xuICAgIH1cbiAgfTtcblxuICBCYWNvbi5vblZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmLCBzdHJlYW1zLCBfaTtcbiAgICBzdHJlYW1zID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgX2kgPSBhcmd1bWVudHMubGVuZ3RoIC0gMSkgOiAoX2kgPSAwLCBbXSksIGYgPSBhcmd1bWVudHNbX2krK107XG4gICAgcmV0dXJuIEJhY29uLmNvbWJpbmVBc0FycmF5KHN0cmVhbXMpLm9uVmFsdWVzKGYpO1xuICB9O1xuXG4gIEJhY29uLmNvbWJpbmVXaXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGYsIHN0cmVhbXM7XG4gICAgZiA9IGFyZ3VtZW50c1swXSwgc3RyZWFtcyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbi5hcHBseShudWxsLCBbQmFjb24sIFwiY29tYmluZVdpdGhcIiwgZl0uY29uY2F0KF9fc2xpY2UuY2FsbChzdHJlYW1zKSwgW0JhY29uLmNvbWJpbmVBc0FycmF5KHN0cmVhbXMpLm1hcChmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgIHJldHVybiBmLmFwcGx5KG51bGwsIHZhbHVlcyk7XG4gICAgfSldKSk7XG4gIH07XG5cbiAgQmFjb24uY29tYmluZVRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICB2YXIgYXBwbHlTdHJlYW1WYWx1ZSwgY29tYmluYXRvciwgY29tcGlsZSwgY29tcGlsZVRlbXBsYXRlLCBjb25zdGFudFZhbHVlLCBjdXJyZW50LCBmdW5jcywgbWtDb250ZXh0LCBzZXRWYWx1ZSwgc3RyZWFtcztcbiAgICBmdW5jcyA9IFtdO1xuICAgIHN0cmVhbXMgPSBbXTtcbiAgICBjdXJyZW50ID0gZnVuY3Rpb24oY3R4U3RhY2spIHtcbiAgICAgIHJldHVybiBjdHhTdGFja1tjdHhTdGFjay5sZW5ndGggLSAxXTtcbiAgICB9O1xuICAgIHNldFZhbHVlID0gZnVuY3Rpb24oY3R4U3RhY2ssIGtleSwgdmFsdWUpIHtcbiAgICAgIHJldHVybiBjdXJyZW50KGN0eFN0YWNrKVtrZXldID0gdmFsdWU7XG4gICAgfTtcbiAgICBhcHBseVN0cmVhbVZhbHVlID0gZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGN0eFN0YWNrLCB2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIHNldFZhbHVlKGN0eFN0YWNrLCBrZXksIHZhbHVlc1tpbmRleF0pO1xuICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0YW50VmFsdWUgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oY3R4U3RhY2spIHtcbiAgICAgICAgcmV0dXJuIHNldFZhbHVlKGN0eFN0YWNrLCBrZXksIHZhbHVlKTtcbiAgICAgIH07XG4gICAgfTtcbiAgICBta0NvbnRleHQgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgaWYgKGlzQXJyYXkodGVtcGxhdGUpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbXBpbGUgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICB2YXIgcG9wQ29udGV4dCwgcHVzaENvbnRleHQ7XG4gICAgICBpZiAoaXNPYnNlcnZhYmxlKHZhbHVlKSkge1xuICAgICAgICBzdHJlYW1zLnB1c2godmFsdWUpO1xuICAgICAgICByZXR1cm4gZnVuY3MucHVzaChhcHBseVN0cmVhbVZhbHVlKGtleSwgc3RyZWFtcy5sZW5ndGggLSAxKSk7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBPYmplY3QodmFsdWUpICYmIHR5cGVvZiB2YWx1ZSAhPT0gXCJmdW5jdGlvblwiICYmICEodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApICYmICEodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICBwdXNoQ29udGV4dCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjdHhTdGFjaykge1xuICAgICAgICAgICAgdmFyIG5ld0NvbnRleHQ7XG4gICAgICAgICAgICBuZXdDb250ZXh0ID0gbWtDb250ZXh0KHZhbHVlKTtcbiAgICAgICAgICAgIHNldFZhbHVlKGN0eFN0YWNrLCBrZXksIG5ld0NvbnRleHQpO1xuICAgICAgICAgICAgcmV0dXJuIGN0eFN0YWNrLnB1c2gobmV3Q29udGV4dCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgcG9wQ29udGV4dCA9IGZ1bmN0aW9uKGN0eFN0YWNrKSB7XG4gICAgICAgICAgcmV0dXJuIGN0eFN0YWNrLnBvcCgpO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jcy5wdXNoKHB1c2hDb250ZXh0KGtleSkpO1xuICAgICAgICBjb21waWxlVGVtcGxhdGUodmFsdWUpO1xuICAgICAgICByZXR1cm4gZnVuY3MucHVzaChwb3BDb250ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jcy5wdXNoKGNvbnN0YW50VmFsdWUoa2V5LCB2YWx1ZSkpO1xuICAgICAgfVxuICAgIH07XG4gICAgY29tcGlsZVRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgIHJldHVybiBfLmVhY2godGVtcGxhdGUsIGNvbXBpbGUpO1xuICAgIH07XG4gICAgY29tcGlsZVRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICBjb21iaW5hdG9yID0gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICB2YXIgY3R4U3RhY2ssIGYsIHJvb3RDb250ZXh0LCBfaSwgX2xlbjtcbiAgICAgIHJvb3RDb250ZXh0ID0gbWtDb250ZXh0KHRlbXBsYXRlKTtcbiAgICAgIGN0eFN0YWNrID0gW3Jvb3RDb250ZXh0XTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gZnVuY3MubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZiA9IGZ1bmNzW19pXTtcbiAgICAgICAgZihjdHhTdGFjaywgdmFsdWVzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByb290Q29udGV4dDtcbiAgICB9O1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwiY29tYmluZVRlbXBsYXRlXCIsIHRlbXBsYXRlLCBCYWNvbi5jb21iaW5lQXNBcnJheShzdHJlYW1zKS5tYXAoY29tYmluYXRvcikpO1xuICB9O1xuXG4gIEJhY29uLnJldHJ5ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBkZWxheSwgaXNSZXRyeWFibGUsIG1heFJldHJpZXMsIHJldHJpZXMsIHJldHJ5LCBzb3VyY2U7XG4gICAgaWYgKCFpc0Z1bmN0aW9uKG9wdGlvbnMuc291cmNlKSkge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIidzb3VyY2UnIG9wdGlvbiBoYXMgdG8gYmUgYSBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgc291cmNlID0gb3B0aW9ucy5zb3VyY2U7XG4gICAgcmV0cmllcyA9IG9wdGlvbnMucmV0cmllcyB8fCAwO1xuICAgIG1heFJldHJpZXMgPSBvcHRpb25zLm1heFJldHJpZXMgfHwgcmV0cmllcztcbiAgICBkZWxheSA9IG9wdGlvbnMuZGVsYXkgfHwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9O1xuICAgIGlzUmV0cnlhYmxlID0gb3B0aW9ucy5pc1JldHJ5YWJsZSB8fCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcmV0cnkgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgZGVsYXllZFJldHJ5LCBuZXh0QXR0ZW1wdE9wdGlvbnM7XG4gICAgICBuZXh0QXR0ZW1wdE9wdGlvbnMgPSB7XG4gICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICByZXRyaWVzOiByZXRyaWVzIC0gMSxcbiAgICAgICAgbWF4UmV0cmllczogbWF4UmV0cmllcyxcbiAgICAgICAgZGVsYXk6IGRlbGF5LFxuICAgICAgICBpc1JldHJ5YWJsZTogaXNSZXRyeWFibGVcbiAgICAgIH07XG4gICAgICBkZWxheWVkUmV0cnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLnJldHJ5KG5leHRBdHRlbXB0T3B0aW9ucyk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIEJhY29uLmxhdGVyKGRlbGF5KGNvbnRleHQpKS5maWx0ZXIoZmFsc2UpLmNvbmNhdChCYWNvbi5vbmNlKCkuZmxhdE1hcChkZWxheWVkUmV0cnkpKTtcbiAgICB9O1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwicmV0cnlcIiwgb3B0aW9ucywgc291cmNlKCkuZmxhdE1hcEVycm9yKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChpc1JldHJ5YWJsZShlKSAmJiByZXRyaWVzID4gMCkge1xuICAgICAgICByZXR1cm4gcmV0cnkoe1xuICAgICAgICAgIGVycm9yOiBlLFxuICAgICAgICAgIHJldHJpZXNEb25lOiBtYXhSZXRyaWVzIC0gcmV0cmllc1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCYWNvbi5vbmNlKG5ldyBFcnJvcihlKSk7XG4gICAgICB9XG4gICAgfSkpO1xuICB9O1xuXG4gIGV2ZW50SWRDb3VudGVyID0gMDtcblxuICBFdmVudCA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFdmVudCgpIHtcbiAgICAgIHRoaXMuaWQgPSArK2V2ZW50SWRDb3VudGVyO1xuICAgIH1cblxuICAgIEV2ZW50LnByb3RvdHlwZS5pc0V2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgRXZlbnQucHJvdG90eXBlLmlzRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIEV2ZW50LnByb3RvdHlwZS5pc0luaXRpYWwgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgRXZlbnQucHJvdG90eXBlLmlzTmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBFdmVudC5wcm90b3R5cGUuaXNFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBFdmVudC5wcm90b3R5cGUuaGFzVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgRXZlbnQucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIEV2ZW50LnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH07XG5cbiAgICBFdmVudC5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRXZlbnQ7XG5cbiAgfSkoKTtcblxuICBOZXh0ID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhOZXh0LCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gTmV4dCh2YWx1ZUYsIGVhZ2VyKSB7XG4gICAgICBOZXh0Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMpO1xuICAgICAgaWYgKCFlYWdlciAmJiBpc0Z1bmN0aW9uKHZhbHVlRikgfHwgdmFsdWVGIGluc3RhbmNlb2YgTmV4dCkge1xuICAgICAgICB0aGlzLnZhbHVlRiA9IHZhbHVlRjtcbiAgICAgICAgdGhpcy52YWx1ZUludGVybmFsID0gdm9pZCAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52YWx1ZUYgPSB2b2lkIDA7XG4gICAgICAgIHRoaXMudmFsdWVJbnRlcm5hbCA9IHZhbHVlRjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBOZXh0LnByb3RvdHlwZS5pc05leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBOZXh0LnByb3RvdHlwZS5oYXNWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIE5leHQucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy52YWx1ZUYgaW5zdGFuY2VvZiBOZXh0KSB7XG4gICAgICAgIHRoaXMudmFsdWVJbnRlcm5hbCA9IHRoaXMudmFsdWVGLnZhbHVlKCk7XG4gICAgICAgIHRoaXMudmFsdWVGID0gdm9pZCAwO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnZhbHVlRikge1xuICAgICAgICB0aGlzLnZhbHVlSW50ZXJuYWwgPSB0aGlzLnZhbHVlRigpO1xuICAgICAgICB0aGlzLnZhbHVlRiA9IHZvaWQgMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnZhbHVlSW50ZXJuYWw7XG4gICAgfTtcblxuICAgIE5leHQucHJvdG90eXBlLmZtYXAgPSBmdW5jdGlvbihmKSB7XG4gICAgICB2YXIgZXZlbnQsIHZhbHVlO1xuICAgICAgaWYgKHRoaXMudmFsdWVJbnRlcm5hbCkge1xuICAgICAgICB2YWx1ZSA9IHRoaXMudmFsdWVJbnRlcm5hbDtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGYoZXZlbnQudmFsdWUoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBOZXh0LnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gbmV3IE5leHQodmFsdWUpO1xuICAgIH07XG5cbiAgICBOZXh0LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbihmKSB7XG4gICAgICByZXR1cm4gZih0aGlzLnZhbHVlKCkpO1xuICAgIH07XG5cbiAgICBOZXh0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF8udG9TdHJpbmcodGhpcy52YWx1ZSgpKTtcbiAgICB9O1xuXG4gICAgTmV4dC5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZSgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTmV4dDtcblxuICB9KShFdmVudCk7XG5cbiAgSW5pdGlhbCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSW5pdGlhbCwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIEluaXRpYWwoKSB7XG4gICAgICByZXR1cm4gSW5pdGlhbC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBJbml0aWFsLnByb3RvdHlwZS5pc0luaXRpYWwgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBJbml0aWFsLnByb3RvdHlwZS5pc05leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgSW5pdGlhbC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIG5ldyBJbml0aWFsKHZhbHVlKTtcbiAgICB9O1xuXG4gICAgSW5pdGlhbC5wcm90b3R5cGUudG9OZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IE5leHQodGhpcyk7XG4gICAgfTtcblxuICAgIHJldHVybiBJbml0aWFsO1xuXG4gIH0pKE5leHQpO1xuXG4gIEVuZCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRW5kLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gRW5kKCkge1xuICAgICAgcmV0dXJuIEVuZC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBFbmQucHJvdG90eXBlLmlzRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgRW5kLnByb3RvdHlwZS5mbWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgRW5kLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIEVuZC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBcIjxlbmQ+XCI7XG4gICAgfTtcblxuICAgIHJldHVybiBFbmQ7XG5cbiAgfSkoRXZlbnQpO1xuXG4gIEVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhFcnJvciwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIEVycm9yKGVycm9yKSB7XG4gICAgICB0aGlzLmVycm9yID0gZXJyb3I7XG4gICAgfVxuXG4gICAgRXJyb3IucHJvdG90eXBlLmlzRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBFcnJvci5wcm90b3R5cGUuZm1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIEVycm9yLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIEVycm9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiPGVycm9yPiBcIiArIF8udG9TdHJpbmcodGhpcy5lcnJvcik7XG4gICAgfTtcblxuICAgIHJldHVybiBFcnJvcjtcblxuICB9KShFdmVudCk7XG5cbiAgaWRDb3VudGVyID0gMDtcblxuICBPYnNlcnZhYmxlID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIE9ic2VydmFibGUoZGVzYykge1xuICAgICAgdGhpcy5pZCA9ICsraWRDb3VudGVyO1xuICAgICAgd2l0aERlc2NyaXB0aW9uKGRlc2MsIHRoaXMpO1xuICAgICAgdGhpcy5pbml0aWFsRGVzYyA9IHRoaXMuZGVzYztcbiAgICB9XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbihzaW5rKSB7XG4gICAgICByZXR1cm4gVXBkYXRlQmFycmllci53cmFwcGVkU3Vic2NyaWJlKHRoaXMsIHNpbmspO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5zdWJzY3JpYmVJbnRlcm5hbCA9IGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHJldHVybiB0aGlzLmRpc3BhdGNoZXIuc3Vic2NyaWJlKHNpbmspO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5vblZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZjtcbiAgICAgIGYgPSBtYWtlRnVuY3Rpb25BcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICByZXR1cm4gZihldmVudC52YWx1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm9uVmFsdWVzID0gZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIHRoaXMub25WYWx1ZShmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmO1xuICAgICAgZiA9IG1ha2VGdW5jdGlvbkFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuaXNFcnJvcigpKSB7XG4gICAgICAgICAgcmV0dXJuIGYoZXZlbnQuZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUub25FbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmO1xuICAgICAgZiA9IG1ha2VGdW5jdGlvbkFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuaXNFbmQoKSkge1xuICAgICAgICAgIHJldHVybiBmKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5lcnJvcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJlcnJvcnNcIiwgdGhpcy5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZjtcbiAgICAgIGYgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRBcmdzVG9GdW5jdGlvbih0aGlzLCBmLCBhcmdzLCBmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJmaWx0ZXJcIiwgZiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmIChldmVudC5maWx0ZXIoZikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS50YWtlV2hpbGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBmO1xuICAgICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICByZXR1cm4gY29udmVydEFyZ3NUb0Z1bmN0aW9uKHRoaXMsIGYsIGFyZ3MsIGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInRha2VXaGlsZVwiLCBmLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGV2ZW50LmZpbHRlcihmKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHVzaChlbmQoKSk7XG4gICAgICAgICAgICByZXR1cm4gQmFjb24ubm9Nb3JlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmVuZE9uRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBmO1xuICAgICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBpZiAoZiA9PSBudWxsKSB7XG4gICAgICAgIGYgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnZlcnRBcmdzVG9GdW5jdGlvbih0aGlzLCBmLCBhcmdzLCBmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJlbmRPbkVycm9yXCIsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBpZiAoZXZlbnQuaXNFcnJvcigpICYmIGYoZXZlbnQuZXJyb3IpKSB7XG4gICAgICAgICAgICB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChlbmQoKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLnRha2UgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgaWYgKGNvdW50IDw9IDApIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLm5ldmVyKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwidGFrZVwiLCBjb3VudCwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIWV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudC0tO1xuICAgICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucHVzaChlbmQoKSk7XG4gICAgICAgICAgICByZXR1cm4gQmFjb24ubm9Nb3JlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBwO1xuICAgICAgcCA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBpZiAocCBpbnN0YW5jZW9mIFByb3BlcnR5KSB7XG4gICAgICAgIHJldHVybiBwLnNhbXBsZWRCeSh0aGlzLCBmb3JtZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnRBcmdzVG9GdW5jdGlvbih0aGlzLCBwLCBhcmdzLCBmdW5jdGlvbihmKSB7XG4gICAgICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcIm1hcFwiLCBmLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50LmZtYXAoZikpO1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm1hcEVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZjtcbiAgICAgIGYgPSBtYWtlRnVuY3Rpb25BcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwibWFwRXJyb3JcIiwgZiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuaXNFcnJvcigpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChuZXh0KGYoZXZlbnQuZXJyb3IpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUubWFwRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZjtcbiAgICAgIGYgPSBtYWtlRnVuY3Rpb25BcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwibWFwRW5kXCIsIGYsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICB0aGlzLnB1c2gobmV4dChmKGV2ZW50KSkpO1xuICAgICAgICAgIHRoaXMucHVzaChlbmQoKSk7XG4gICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5kb0FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGY7XG4gICAgICBmID0gbWFrZUZ1bmN0aW9uQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImRvQWN0aW9uXCIsIGYsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICBmKGV2ZW50LnZhbHVlKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5za2lwID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJza2lwXCIsIGNvdW50LCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICAgIGNvdW50LS07XG4gICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuc2tpcER1cGxpY2F0ZXMgPSBmdW5jdGlvbihpc0VxdWFsKSB7XG4gICAgICBpZiAoaXNFcXVhbCA9PSBudWxsKSB7XG4gICAgICAgIGlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgcmV0dXJuIGEgPT09IGI7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2tpcER1cGxpY2F0ZXNcIiwgdGhpcy53aXRoU3RhdGVNYWNoaW5lKE5vbmUsIGZ1bmN0aW9uKHByZXYsIGV2ZW50KSB7XG4gICAgICAgIGlmICghZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICAgIHJldHVybiBbcHJldiwgW2V2ZW50XV07XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuaXNJbml0aWFsKCkgfHwgcHJldiA9PT0gTm9uZSB8fCAhaXNFcXVhbChwcmV2LmdldCgpLCBldmVudC52YWx1ZSgpKSkge1xuICAgICAgICAgIHJldHVybiBbbmV3IFNvbWUoZXZlbnQudmFsdWUoKSksIFtldmVudF1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBbcHJldiwgW11dO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLnNraXBFcnJvcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJza2lwRXJyb3JzXCIsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmlzRXJyb3IoKSkge1xuICAgICAgICAgIHJldHVybiBCYWNvbi5tb3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLndpdGhTdGF0ZU1hY2hpbmUgPSBmdW5jdGlvbihpbml0U3RhdGUsIGYpIHtcbiAgICAgIHZhciBzdGF0ZTtcbiAgICAgIHN0YXRlID0gaW5pdFN0YXRlO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcIndpdGhTdGF0ZU1hY2hpbmVcIiwgaW5pdFN0YXRlLCBmLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBmcm9tRiwgbmV3U3RhdGUsIG91dHB1dCwgb3V0cHV0cywgcmVwbHksIF9pLCBfbGVuO1xuICAgICAgICBmcm9tRiA9IGYoc3RhdGUsIGV2ZW50KTtcbiAgICAgICAgbmV3U3RhdGUgPSBmcm9tRlswXSwgb3V0cHV0cyA9IGZyb21GWzFdO1xuICAgICAgICBzdGF0ZSA9IG5ld1N0YXRlO1xuICAgICAgICByZXBseSA9IEJhY29uLm1vcmU7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb3V0cHV0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIG91dHB1dCA9IG91dHB1dHNbX2ldO1xuICAgICAgICAgIHJlcGx5ID0gdGhpcy5wdXNoKG91dHB1dCk7XG4gICAgICAgICAgaWYgKHJlcGx5ID09PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBseTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcGx5O1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24oc2VlZCwgZikge1xuICAgICAgdmFyIGFjYywgcmVzdWx0UHJvcGVydHksIHN1YnNjcmliZTtcbiAgICAgIGYgPSB0b0NvbWJpbmF0b3IoZik7XG4gICAgICBhY2MgPSB0b09wdGlvbihzZWVkKTtcbiAgICAgIHN1YnNjcmliZSA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2luaykge1xuICAgICAgICAgIHZhciBpbml0U2VudCwgcmVwbHksIHNlbmRJbml0LCB1bnN1YjtcbiAgICAgICAgICBpbml0U2VudCA9IGZhbHNlO1xuICAgICAgICAgIHVuc3ViID0gbm9wO1xuICAgICAgICAgIHJlcGx5ID0gQmFjb24ubW9yZTtcbiAgICAgICAgICBzZW5kSW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCFpbml0U2VudCkge1xuICAgICAgICAgICAgICByZXR1cm4gYWNjLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpbml0U2VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVwbHkgPSBzaW5rKG5ldyBJbml0aWFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICAgICAgdW5zdWIoKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB1bnN1YiA9IG5vcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgdW5zdWIgPSBfdGhpcy5kaXNwYXRjaGVyLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIG5leHQsIHByZXY7XG4gICAgICAgICAgICBpZiAoZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICAgICAgICBpZiAoaW5pdFNlbnQgJiYgZXZlbnQuaXNJbml0aWFsKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWV2ZW50LmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgICAgICBzZW5kSW5pdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbml0U2VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJldiA9IGFjYy5nZXRPckVsc2Uodm9pZCAwKTtcbiAgICAgICAgICAgICAgICBuZXh0ID0gZihwcmV2LCBldmVudC52YWx1ZSgpKTtcbiAgICAgICAgICAgICAgICBhY2MgPSBuZXcgU29tZShuZXh0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2luayhldmVudC5hcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgICAgICByZXBseSA9IHNlbmRJbml0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHJlcGx5ICE9PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2luayhldmVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBVcGRhdGVCYXJyaWVyLndoZW5Eb25lV2l0aChyZXN1bHRQcm9wZXJ0eSwgc2VuZEluaXQpO1xuICAgICAgICAgIHJldHVybiB1bnN1YjtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgICAgcmV0dXJuIHJlc3VsdFByb3BlcnR5ID0gbmV3IFByb3BlcnR5KGRlc2NyaWJlKHRoaXMsIFwic2NhblwiLCBzZWVkLCBmKSwgc3Vic2NyaWJlKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZm9sZCA9IGZ1bmN0aW9uKHNlZWQsIGYpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJmb2xkXCIsIHNlZWQsIGYsIHRoaXMuc2NhbihzZWVkLCBmKS5zYW1wbGVkQnkodGhpcy5maWx0ZXIoZmFsc2UpLm1hcEVuZCgpLnRvUHJvcGVydHkoKSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS56aXAgPSBmdW5jdGlvbihvdGhlciwgZikge1xuICAgICAgaWYgKGYgPT0gbnVsbCkge1xuICAgICAgICBmID0gQXJyYXk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiemlwXCIsIG90aGVyLCBCYWNvbi56aXBXaXRoKFt0aGlzLCBvdGhlcl0sIGYpKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZGlmZiA9IGZ1bmN0aW9uKHN0YXJ0LCBmKSB7XG4gICAgICBmID0gdG9Db21iaW5hdG9yKGYpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImRpZmZcIiwgc3RhcnQsIGYsIHRoaXMuc2Nhbihbc3RhcnRdLCBmdW5jdGlvbihwcmV2VHVwbGUsIG5leHQpIHtcbiAgICAgICAgcmV0dXJuIFtuZXh0LCBmKHByZXZUdXBsZVswXSwgbmV4dCldO1xuICAgICAgfSkuZmlsdGVyKGZ1bmN0aW9uKHR1cGxlKSB7XG4gICAgICAgIHJldHVybiB0dXBsZS5sZW5ndGggPT09IDI7XG4gICAgICB9KS5tYXAoZnVuY3Rpb24odHVwbGUpIHtcbiAgICAgICAgcmV0dXJuIHR1cGxlWzFdO1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5mbGF0TWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZmxhdE1hcF8odGhpcywgbWFrZVNwYXduZXIoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmZsYXRNYXBGaXJzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZsYXRNYXBfKHRoaXMsIG1ha2VTcGF3bmVyKGFyZ3VtZW50cyksIHRydWUpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5mbGF0TWFwV2l0aENvbmN1cnJlbmN5TGltaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBsaW1pdDtcbiAgICAgIGxpbWl0ID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW3RoaXMsIFwiZmxhdE1hcFdpdGhDb25jdXJyZW5jeUxpbWl0XCIsIGxpbWl0XS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3MpLCBbZmxhdE1hcF8odGhpcywgbWFrZVNwYXduZXIoYXJncyksIGZhbHNlLCBsaW1pdCldKSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmZsYXRNYXBMYXRlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmLCBzdHJlYW07XG4gICAgICBmID0gbWFrZVNwYXduZXIoYXJndW1lbnRzKTtcbiAgICAgIHN0cmVhbSA9IHRoaXMudG9FdmVudFN0cmVhbSgpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImZsYXRNYXBMYXRlc3RcIiwgZiwgc3RyZWFtLmZsYXRNYXAoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG1ha2VPYnNlcnZhYmxlKGYodmFsdWUpKS50YWtlVW50aWwoc3RyZWFtKTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZmxhdE1hcEVycm9yID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJmbGF0TWFwRXJyb3JcIiwgZm4sIHRoaXMubWFwRXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyKTtcbiAgICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24oeCkge1xuICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKHguZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBCYWNvbi5vbmNlKHgpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmZsYXRNYXBDb25jYXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW3RoaXMsIFwiZmxhdE1hcENvbmNhdFwiXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3VtZW50cyksIFt0aGlzLmZsYXRNYXBXaXRoQ29uY3VycmVuY3lMaW1pdC5hcHBseSh0aGlzLCBbMV0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpKSldKSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmJ1ZmZlcmluZ1Rocm90dGxlID0gZnVuY3Rpb24obWluaW11bUludGVydmFsKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiYnVmZmVyaW5nVGhyb3R0bGVcIiwgbWluaW11bUludGVydmFsLCB0aGlzLmZsYXRNYXBDb25jYXQoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gQmFjb24ub25jZSh4KS5jb25jYXQoQmFjb24ubGF0ZXIobWluaW11bUludGVydmFsKS5maWx0ZXIoZmFsc2UpKTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUubm90ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwibm90XCIsIHRoaXMubWFwKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4O1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzO1xuICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICB0aGlzLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCA/IHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gXCJmdW5jdGlvblwiID8gY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgX19zbGljZS5jYWxsKGFyZ3MpLmNvbmNhdChbZXZlbnQubG9nKCldKSkgOiB2b2lkIDAgOiB2b2lkIDA7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5zbGlkaW5nV2luZG93ID0gZnVuY3Rpb24obiwgbWluVmFsdWVzKSB7XG4gICAgICBpZiAobWluVmFsdWVzID09IG51bGwpIHtcbiAgICAgICAgbWluVmFsdWVzID0gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJzbGlkaW5nV2luZG93XCIsIG4sIG1pblZhbHVlcywgdGhpcy5zY2FuKFtdLCAoZnVuY3Rpb24od2luZG93LCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gd2luZG93LmNvbmNhdChbdmFsdWVdKS5zbGljZSgtbik7XG4gICAgICB9KSkuZmlsdGVyKChmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPj0gbWluVmFsdWVzO1xuICAgICAgfSkpKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuY29tYmluZSA9IGZ1bmN0aW9uKG90aGVyLCBmKSB7XG4gICAgICB2YXIgY29tYmluYXRvcjtcbiAgICAgIGNvbWJpbmF0b3IgPSB0b0NvbWJpbmF0b3IoZik7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiY29tYmluZVwiLCBvdGhlciwgZiwgQmFjb24uY29tYmluZUFzQXJyYXkodGhpcywgb3RoZXIpLm1hcChmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIGNvbWJpbmF0b3IodmFsdWVzWzBdLCB2YWx1ZXNbMV0pO1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5kZWNvZGUgPSBmdW5jdGlvbihjYXNlcykge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImRlY29kZVwiLCBjYXNlcywgdGhpcy5jb21iaW5lKEJhY29uLmNvbWJpbmVUZW1wbGF0ZShjYXNlcyksIGZ1bmN0aW9uKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXNba2V5XTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuYXdhaXRpbmcgPSBmdW5jdGlvbihvdGhlcikge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImF3YWl0aW5nXCIsIG90aGVyLCBCYWNvbi5ncm91cFNpbXVsdGFuZW91cyh0aGlzLCBvdGhlcikubWFwKGZ1bmN0aW9uKF9hcmcpIHtcbiAgICAgICAgdmFyIG15VmFsdWVzLCBvdGhlclZhbHVlcztcbiAgICAgICAgbXlWYWx1ZXMgPSBfYXJnWzBdLCBvdGhlclZhbHVlcyA9IF9hcmdbMV07XG4gICAgICAgIHJldHVybiBvdGhlclZhbHVlcy5sZW5ndGggPT09IDA7XG4gICAgICB9KS50b1Byb3BlcnR5KGZhbHNlKS5za2lwRHVwbGljYXRlcygpKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLndpdGhEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlc2NyaWJlLmFwcGx5KG51bGwsIGFyZ3VtZW50cykuYXBwbHkodGhpcyk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5fbmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2MudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuaW50ZXJuYWxEZXBzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsRGVzYy5kZXBzKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlO1xuXG4gIH0pKCk7XG5cbiAgT2JzZXJ2YWJsZS5wcm90b3R5cGUucmVkdWNlID0gT2JzZXJ2YWJsZS5wcm90b3R5cGUuZm9sZDtcblxuICBPYnNlcnZhYmxlLnByb3RvdHlwZS5hc3NpZ24gPSBPYnNlcnZhYmxlLnByb3RvdHlwZS5vblZhbHVlO1xuXG4gIE9ic2VydmFibGUucHJvdG90eXBlLmluc3BlY3QgPSBPYnNlcnZhYmxlLnByb3RvdHlwZS50b1N0cmluZztcblxuICBmbGF0TWFwXyA9IGZ1bmN0aW9uKHJvb3QsIGYsIGZpcnN0T25seSwgbGltaXQpIHtcbiAgICB2YXIgY2hpbGREZXBzLCByZXN1bHQsIHJvb3REZXA7XG4gICAgcm9vdERlcCA9IFtyb290XTtcbiAgICBjaGlsZERlcHMgPSBbXTtcbiAgICByZXN1bHQgPSBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUocm9vdCwgXCJmbGF0TWFwXCIgKyAoZmlyc3RPbmx5ID8gXCJGaXJzdFwiIDogXCJcIiksIGYpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICB2YXIgY2hlY2tFbmQsIGNoZWNrUXVldWUsIGNvbXBvc2l0ZSwgcXVldWUsIHNwYXduO1xuICAgICAgY29tcG9zaXRlID0gbmV3IENvbXBvc2l0ZVVuc3Vic2NyaWJlKCk7XG4gICAgICBxdWV1ZSA9IFtdO1xuICAgICAgc3Bhd24gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgY2hpbGQ7XG4gICAgICAgIGNoaWxkID0gbWFrZU9ic2VydmFibGUoZihldmVudC52YWx1ZSgpKSk7XG4gICAgICAgIGNoaWxkRGVwcy5wdXNoKGNoaWxkKTtcbiAgICAgICAgcmV0dXJuIGNvbXBvc2l0ZS5hZGQoZnVuY3Rpb24odW5zdWJBbGwsIHVuc3ViTWUpIHtcbiAgICAgICAgICByZXR1cm4gY2hpbGQuZGlzcGF0Y2hlci5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciByZXBseTtcbiAgICAgICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICAgIF8ucmVtb3ZlKGNoaWxkLCBjaGlsZERlcHMpO1xuICAgICAgICAgICAgICBjaGVja1F1ZXVlKCk7XG4gICAgICAgICAgICAgIGNoZWNrRW5kKHVuc3ViTWUpO1xuICAgICAgICAgICAgICByZXR1cm4gQmFjb24ubm9Nb3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgSW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIGV2ZW50ID0gZXZlbnQudG9OZXh0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVwbHkgPSBzaW5rKGV2ZW50KTtcbiAgICAgICAgICAgICAgaWYgKHJlcGx5ID09PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgICB1bnN1YkFsbCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXBseTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgY2hlY2tRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQ7XG4gICAgICAgIGV2ZW50ID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHNwYXduKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNoZWNrRW5kID0gZnVuY3Rpb24odW5zdWIpIHtcbiAgICAgICAgdW5zdWIoKTtcbiAgICAgICAgaWYgKGNvbXBvc2l0ZS5lbXB0eSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHNpbmsoZW5kKCkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29tcG9zaXRlLmFkZChmdW5jdGlvbihfXywgdW5zdWJSb290KSB7XG4gICAgICAgIHJldHVybiByb290LmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGVja0VuZCh1bnN1YlJvb3QpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuaXNFcnJvcigpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2luayhldmVudCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmaXJzdE9ubHkgJiYgY29tcG9zaXRlLmNvdW50KCkgPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGNvbXBvc2l0ZS51bnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsaW1pdCAmJiBjb21wb3NpdGUuY291bnQoKSA+IGxpbWl0KSB7XG4gICAgICAgICAgICAgIHJldHVybiBxdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBzcGF3bihldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbXBvc2l0ZS51bnN1YnNjcmliZTtcbiAgICB9KTtcbiAgICByZXN1bHQuaW50ZXJuYWxEZXBzID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoY2hpbGREZXBzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gcm9vdERlcC5jb25jYXQoY2hpbGREZXBzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByb290RGVwO1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBFdmVudFN0cmVhbSA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRXZlbnRTdHJlYW0sIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBFdmVudFN0cmVhbShkZXNjLCBzdWJzY3JpYmUsIGhhbmRsZXIpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKGRlc2MpKSB7XG4gICAgICAgIGhhbmRsZXIgPSBzdWJzY3JpYmU7XG4gICAgICAgIHN1YnNjcmliZSA9IGRlc2M7XG4gICAgICAgIGRlc2MgPSBbXTtcbiAgICAgIH1cbiAgICAgIEV2ZW50U3RyZWFtLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGRlc2MpO1xuICAgICAgYXNzZXJ0RnVuY3Rpb24oc3Vic2NyaWJlKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKHN1YnNjcmliZSwgaGFuZGxlcik7XG4gICAgICByZWdpc3Rlck9icyh0aGlzKTtcbiAgICB9XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbihkZWxheSkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImRlbGF5XCIsIGRlbGF5LCB0aGlzLmZsYXRNYXAoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLmxhdGVyKGRlbGF5LCB2YWx1ZSk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5kZWJvdW5jZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZGVib3VuY2VcIiwgZGVsYXksIHRoaXMuZmxhdE1hcExhdGVzdChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gQmFjb24ubGF0ZXIoZGVsYXksIHZhbHVlKTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmRlYm91bmNlSW1tZWRpYXRlID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJkZWJvdW5jZUltbWVkaWF0ZVwiLCBkZWxheSwgdGhpcy5mbGF0TWFwRmlyc3QoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLm9uY2UodmFsdWUpLmNvbmNhdChCYWNvbi5sYXRlcihkZWxheSkuZmlsdGVyKGZhbHNlKSk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS50aHJvdHRsZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwidGhyb3R0bGVcIiwgZGVsYXksIHRoaXMuYnVmZmVyV2l0aFRpbWUoZGVsYXkpLm1hcChmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gMV07XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5idWZmZXJXaXRoVGltZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiYnVmZmVyV2l0aFRpbWVcIiwgZGVsYXksIHRoaXMuYnVmZmVyV2l0aFRpbWVPckNvdW50KGRlbGF5LCBOdW1iZXIuTUFYX1ZBTFVFKSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5idWZmZXJXaXRoQ291bnQgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImJ1ZmZlcldpdGhDb3VudFwiLCBjb3VudCwgdGhpcy5idWZmZXJXaXRoVGltZU9yQ291bnQodm9pZCAwLCBjb3VudCkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuYnVmZmVyV2l0aFRpbWVPckNvdW50ID0gZnVuY3Rpb24oZGVsYXksIGNvdW50KSB7XG4gICAgICB2YXIgZmx1c2hPclNjaGVkdWxlO1xuICAgICAgZmx1c2hPclNjaGVkdWxlID0gZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgIGlmIChidWZmZXIudmFsdWVzLmxlbmd0aCA9PT0gY291bnQpIHtcbiAgICAgICAgICByZXR1cm4gYnVmZmVyLmZsdXNoKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGVsYXkgIT09IHZvaWQgMCkge1xuICAgICAgICAgIHJldHVybiBidWZmZXIuc2NoZWR1bGUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJidWZmZXJXaXRoVGltZU9yQ291bnRcIiwgZGVsYXksIGNvdW50LCB0aGlzLmJ1ZmZlcihkZWxheSwgZmx1c2hPclNjaGVkdWxlLCBmbHVzaE9yU2NoZWR1bGUpKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmJ1ZmZlciA9IGZ1bmN0aW9uKGRlbGF5LCBvbklucHV0LCBvbkZsdXNoKSB7XG4gICAgICB2YXIgYnVmZmVyLCBkZWxheU1zLCByZXBseTtcbiAgICAgIGlmIChvbklucHV0ID09IG51bGwpIHtcbiAgICAgICAgb25JbnB1dCA9IG5vcDtcbiAgICAgIH1cbiAgICAgIGlmIChvbkZsdXNoID09IG51bGwpIHtcbiAgICAgICAgb25GbHVzaCA9IG5vcDtcbiAgICAgIH1cbiAgICAgIGJ1ZmZlciA9IHtcbiAgICAgICAgc2NoZWR1bGVkOiBmYWxzZSxcbiAgICAgICAgZW5kOiB2b2lkIDAsXG4gICAgICAgIHZhbHVlczogW10sXG4gICAgICAgIGZsdXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcmVwbHk7XG4gICAgICAgICAgdGhpcy5zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAodGhpcy52YWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVwbHkgPSB0aGlzLnB1c2gobmV4dCh0aGlzLnZhbHVlcykpO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVuZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2godGhpcy5lbmQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBseSAhPT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvbkZsdXNoKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKHRoaXMuZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNjaGVkdWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuc2NoZWR1bGVkKSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gZGVsYXkoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuZmx1c2goKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKHRoaXMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXBseSA9IEJhY29uLm1vcmU7XG4gICAgICBpZiAoIWlzRnVuY3Rpb24oZGVsYXkpKSB7XG4gICAgICAgIGRlbGF5TXMgPSBkZWxheTtcbiAgICAgICAgZGVsYXkgPSBmdW5jdGlvbihmKSB7XG4gICAgICAgICAgcmV0dXJuIEJhY29uLnNjaGVkdWxlci5zZXRUaW1lb3V0KGYsIGRlbGF5TXMpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImJ1ZmZlclwiLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGJ1ZmZlci5wdXNoID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHVzaChldmVudCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyk7XG4gICAgICAgIGlmIChldmVudC5pc0Vycm9yKCkpIHtcbiAgICAgICAgICByZXBseSA9IHRoaXMucHVzaChldmVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuaXNFbmQoKSkge1xuICAgICAgICAgIGJ1ZmZlci5lbmQgPSBldmVudDtcbiAgICAgICAgICBpZiAoIWJ1ZmZlci5zY2hlZHVsZWQpIHtcbiAgICAgICAgICAgIGJ1ZmZlci5mbHVzaCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWZmZXIudmFsdWVzLnB1c2goZXZlbnQudmFsdWUoKSk7XG4gICAgICAgICAgb25JbnB1dChidWZmZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXBseTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24ocmlnaHQpIHtcbiAgICAgIHZhciBsZWZ0O1xuICAgICAgYXNzZXJ0RXZlbnRTdHJlYW0ocmlnaHQpO1xuICAgICAgbGVmdCA9IHRoaXM7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKGxlZnQsIFwibWVyZ2VcIiwgcmlnaHQsIEJhY29uLm1lcmdlQWxsKHRoaXMsIHJpZ2h0KSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS50b1Byb3BlcnR5ID0gZnVuY3Rpb24oaW5pdFZhbHVlXykge1xuICAgICAgdmFyIGRpc3AsIGluaXRWYWx1ZTtcbiAgICAgIGluaXRWYWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyBOb25lIDogdG9PcHRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpbml0VmFsdWVfO1xuICAgICAgfSk7XG4gICAgICBkaXNwID0gdGhpcy5kaXNwYXRjaGVyO1xuICAgICAgcmV0dXJuIG5ldyBQcm9wZXJ0eShkZXNjcmliZSh0aGlzLCBcInRvUHJvcGVydHlcIiwgaW5pdFZhbHVlXyksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgICAgdmFyIGluaXRTZW50LCByZXBseSwgc2VuZEluaXQsIHVuc3ViO1xuICAgICAgICBpbml0U2VudCA9IGZhbHNlO1xuICAgICAgICB1bnN1YiA9IG5vcDtcbiAgICAgICAgcmVwbHkgPSBCYWNvbi5tb3JlO1xuICAgICAgICBzZW5kSW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICghaW5pdFNlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbml0VmFsdWUuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICBpbml0U2VudCA9IHRydWU7XG4gICAgICAgICAgICAgIHJlcGx5ID0gc2luayhuZXcgSW5pdGlhbCh2YWx1ZSkpO1xuICAgICAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICAgIHVuc3ViKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuc3ViID0gbm9wO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHVuc3ViID0gZGlzcC5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBpZiAoZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICAgICAgaWYgKGluaXRTZW50ICYmIGV2ZW50LmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBCYWNvbi5tb3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKCFldmVudC5pc0luaXRpYWwoKSkge1xuICAgICAgICAgICAgICAgIHNlbmRJbml0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaW5pdFNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICBpbml0VmFsdWUgPSBuZXcgU29tZShldmVudCk7XG4gICAgICAgICAgICAgIHJldHVybiBzaW5rKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgICAgcmVwbHkgPSBzZW5kSW5pdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcGx5ICE9PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNpbmsoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHNlbmRJbml0KCk7XG4gICAgICAgIHJldHVybiB1bnN1YjtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUudG9FdmVudFN0cmVhbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5zYW1wbGVkQnkgPSBmdW5jdGlvbihzYW1wbGVyLCBjb21iaW5hdG9yKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2FtcGxlZEJ5XCIsIHNhbXBsZXIsIGNvbWJpbmF0b3IsIHRoaXMudG9Qcm9wZXJ0eSgpLnNhbXBsZWRCeShzYW1wbGVyLCBjb21iaW5hdG9yKSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5jb25jYXQgPSBmdW5jdGlvbihyaWdodCkge1xuICAgICAgdmFyIGxlZnQ7XG4gICAgICBsZWZ0ID0gdGhpcztcbiAgICAgIHJldHVybiBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUobGVmdCwgXCJjb25jYXRcIiwgcmlnaHQpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICAgIHZhciB1bnN1YkxlZnQsIHVuc3ViUmlnaHQ7XG4gICAgICAgIHVuc3ViUmlnaHQgPSBub3A7XG4gICAgICAgIHVuc3ViTGVmdCA9IGxlZnQuZGlzcGF0Y2hlci5zdWJzY3JpYmUoZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGlmIChlLmlzRW5kKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bnN1YlJpZ2h0ID0gcmlnaHQuZGlzcGF0Y2hlci5zdWJzY3JpYmUoc2luayk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzaW5rKGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB1bnN1YkxlZnQoKTtcbiAgICAgICAgICByZXR1cm4gdW5zdWJSaWdodCgpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS50YWtlVW50aWwgPSBmdW5jdGlvbihzdG9wcGVyKSB7XG4gICAgICB2YXIgZW5kTWFya2VyO1xuICAgICAgZW5kTWFya2VyID0ge307XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwidGFrZVVudGlsXCIsIHN0b3BwZXIsIEJhY29uLmdyb3VwU2ltdWx0YW5lb3VzKHRoaXMubWFwRW5kKGVuZE1hcmtlciksIHN0b3BwZXIuc2tpcEVycm9ycygpKS53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZGF0YSwgcmVwbHksIHZhbHVlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICAgIGlmICghZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9yZWYxID0gZXZlbnQudmFsdWUoKSwgZGF0YSA9IF9yZWYxWzBdLCBzdG9wcGVyID0gX3JlZjFbMV07XG4gICAgICAgICAgaWYgKHN0b3BwZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGVuZCgpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVwbHkgPSBCYWNvbi5tb3JlO1xuICAgICAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBkYXRhLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gZGF0YVtfaV07XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZW5kTWFya2VyKSB7XG4gICAgICAgICAgICAgICAgcmVwbHkgPSB0aGlzLnB1c2goZW5kKCkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcGx5ID0gdGhpcy5wdXNoKG5leHQodmFsdWUpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcGx5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuc2tpcFVudGlsID0gZnVuY3Rpb24oc3RhcnRlcikge1xuICAgICAgdmFyIHN0YXJ0ZWQ7XG4gICAgICBzdGFydGVkID0gc3RhcnRlci50YWtlKDEpLm1hcCh0cnVlKS50b1Byb3BlcnR5KGZhbHNlKTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJza2lwVW50aWxcIiwgc3RhcnRlciwgdGhpcy5maWx0ZXIoc3RhcnRlZCkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuc2tpcFdoaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZiwgb2s7XG4gICAgICBmID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICAgIG9rID0gZmFsc2U7XG4gICAgICByZXR1cm4gY29udmVydEFyZ3NUb0Z1bmN0aW9uKHRoaXMsIGYsIGFyZ3MsIGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInNraXBXaGlsZVwiLCBmLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKG9rIHx8ICFldmVudC5oYXNWYWx1ZSgpIHx8ICFmKGV2ZW50LnZhbHVlKCkpKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICAgICAgICBvayA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmhvbGRXaGVuID0gZnVuY3Rpb24odmFsdmUpIHtcbiAgICAgIHZhciBwdXRUb0hvbGQsIHJlbGVhc2VIb2xkLCB2YWx2ZV87XG4gICAgICB2YWx2ZV8gPSB2YWx2ZS5zdGFydFdpdGgoZmFsc2UpO1xuICAgICAgcmVsZWFzZUhvbGQgPSB2YWx2ZV8uZmlsdGVyKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4O1xuICAgICAgfSk7XG4gICAgICBwdXRUb0hvbGQgPSB2YWx2ZV8uZmlsdGVyKF8uaWQpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImhvbGRXaGVuXCIsIHZhbHZlLCB0aGlzLmZpbHRlcihmYWxzZSkubWVyZ2UodmFsdmVfLmZsYXRNYXBDb25jYXQoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihzaG91bGRIb2xkKSB7XG4gICAgICAgICAgaWYgKCFzaG91bGRIb2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMudGFrZVVudGlsKHB1dFRvSG9sZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5zY2FuKFtdLCAoZnVuY3Rpb24oeHMsIHgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHhzLmNvbmNhdCh4KTtcbiAgICAgICAgICAgIH0pKS5zYW1wbGVkQnkocmVsZWFzZUhvbGQpLnRha2UoMSkuZmxhdE1hcChCYWNvbi5mcm9tQXJyYXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKSkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuc3RhcnRXaXRoID0gZnVuY3Rpb24oc2VlZCkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInN0YXJ0V2l0aFwiLCBzZWVkLCBCYWNvbi5vbmNlKHNlZWQpLmNvbmNhdCh0aGlzKSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS53aXRoSGFuZGxlciA9IGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUodGhpcywgXCJ3aXRoSGFuZGxlclwiLCBoYW5kbGVyKSwgdGhpcy5kaXNwYXRjaGVyLnN1YnNjcmliZSwgaGFuZGxlcik7XG4gICAgfTtcblxuICAgIHJldHVybiBFdmVudFN0cmVhbTtcblxuICB9KShPYnNlcnZhYmxlKTtcblxuICBQcm9wZXJ0eSA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUHJvcGVydHksIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBQcm9wZXJ0eShkZXNjLCBzdWJzY3JpYmUsIGhhbmRsZXIpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKGRlc2MpKSB7XG4gICAgICAgIGhhbmRsZXIgPSBzdWJzY3JpYmU7XG4gICAgICAgIHN1YnNjcmliZSA9IGRlc2M7XG4gICAgICAgIGRlc2MgPSBbXTtcbiAgICAgIH1cbiAgICAgIFByb3BlcnR5Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGRlc2MpO1xuICAgICAgYXNzZXJ0RnVuY3Rpb24oc3Vic2NyaWJlKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hlciA9IG5ldyBQcm9wZXJ0eURpc3BhdGNoZXIodGhpcywgc3Vic2NyaWJlLCBoYW5kbGVyKTtcbiAgICAgIHJlZ2lzdGVyT2JzKHRoaXMpO1xuICAgIH1cblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS5zYW1wbGVkQnkgPSBmdW5jdGlvbihzYW1wbGVyLCBjb21iaW5hdG9yKSB7XG4gICAgICB2YXIgbGF6eSwgcmVzdWx0LCBzYW1wbGVyU291cmNlLCBzdHJlYW0sIHRoaXNTb3VyY2U7XG4gICAgICBpZiAoY29tYmluYXRvciAhPSBudWxsKSB7XG4gICAgICAgIGNvbWJpbmF0b3IgPSB0b0NvbWJpbmF0b3IoY29tYmluYXRvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsYXp5ID0gdHJ1ZTtcbiAgICAgICAgY29tYmluYXRvciA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICByZXR1cm4gZi52YWx1ZSgpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdGhpc1NvdXJjZSA9IG5ldyBTb3VyY2UodGhpcywgZmFsc2UsIGxhenkpO1xuICAgICAgc2FtcGxlclNvdXJjZSA9IG5ldyBTb3VyY2Uoc2FtcGxlciwgdHJ1ZSwgbGF6eSk7XG4gICAgICBzdHJlYW0gPSBCYWNvbi53aGVuKFt0aGlzU291cmNlLCBzYW1wbGVyU291cmNlXSwgY29tYmluYXRvcik7XG4gICAgICByZXN1bHQgPSBzYW1wbGVyIGluc3RhbmNlb2YgUHJvcGVydHkgPyBzdHJlYW0udG9Qcm9wZXJ0eSgpIDogc3RyZWFtO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInNhbXBsZWRCeVwiLCBzYW1wbGVyLCBjb21iaW5hdG9yLCByZXN1bHQpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuc2FtcGxlID0gZnVuY3Rpb24oaW50ZXJ2YWwpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJzYW1wbGVcIiwgaW50ZXJ2YWwsIHRoaXMuc2FtcGxlZEJ5KEJhY29uLmludGVydmFsKGludGVydmFsLCB7fSkpKTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLmNoYW5nZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUodGhpcywgXCJjaGFuZ2VzXCIpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuZGlzcGF0Y2hlci5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghZXZlbnQuaXNJbml0aWFsKCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNpbmsoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUud2l0aEhhbmRsZXIgPSBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gbmV3IFByb3BlcnR5KGRlc2NyaWJlKHRoaXMsIFwid2l0aEhhbmRsZXJcIiwgaGFuZGxlciksIHRoaXMuZGlzcGF0Y2hlci5zdWJzY3JpYmUsIGhhbmRsZXIpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUudG9Qcm9wZXJ0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgYXNzZXJ0Tm9Bcmd1bWVudHMoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUudG9FdmVudFN0cmVhbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBFdmVudFN0cmVhbShkZXNjcmliZSh0aGlzLCBcInRvRXZlbnRTdHJlYW1cIiksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2luaykge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5kaXNwYXRjaGVyLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgIGV2ZW50ID0gZXZlbnQudG9OZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2luayhldmVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS5hbmQgPSBmdW5jdGlvbihvdGhlcikge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImFuZFwiLCBvdGhlciwgdGhpcy5jb21iaW5lKG90aGVyLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiB4ICYmIHk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS5vciA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwib3JcIiwgb3RoZXIsIHRoaXMuY29tYmluZShvdGhlciwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geCB8fCB5O1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbihkZWxheSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsYXlDaGFuZ2VzKFwiZGVsYXlcIiwgZGVsYXksIGZ1bmN0aW9uKGNoYW5nZXMpIHtcbiAgICAgICAgcmV0dXJuIGNoYW5nZXMuZGVsYXkoZGVsYXkpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS5kZWJvdW5jZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxheUNoYW5nZXMoXCJkZWJvdW5jZVwiLCBkZWxheSwgZnVuY3Rpb24oY2hhbmdlcykge1xuICAgICAgICByZXR1cm4gY2hhbmdlcy5kZWJvdW5jZShkZWxheSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLnRocm90dGxlID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGF5Q2hhbmdlcyhcInRocm90dGxlXCIsIGRlbGF5LCBmdW5jdGlvbihjaGFuZ2VzKSB7XG4gICAgICAgIHJldHVybiBjaGFuZ2VzLnRocm90dGxlKGRlbGF5KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuZGVsYXlDaGFuZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGVzYywgZiwgX2k7XG4gICAgICBkZXNjID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgX2kgPSBhcmd1bWVudHMubGVuZ3RoIC0gMSkgOiAoX2kgPSAwLCBbXSksIGYgPSBhcmd1bWVudHNbX2krK107XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFt0aGlzXS5jb25jYXQoX19zbGljZS5jYWxsKGRlc2MpLCBbYWRkUHJvcGVydHlJbml0VmFsdWVUb1N0cmVhbSh0aGlzLCBmKHRoaXMuY2hhbmdlcygpKSldKSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS50YWtlVW50aWwgPSBmdW5jdGlvbihzdG9wcGVyKSB7XG4gICAgICB2YXIgY2hhbmdlcztcbiAgICAgIGNoYW5nZXMgPSB0aGlzLmNoYW5nZXMoKS50YWtlVW50aWwoc3RvcHBlcik7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwidGFrZVVudGlsXCIsIHN0b3BwZXIsIGFkZFByb3BlcnR5SW5pdFZhbHVlVG9TdHJlYW0odGhpcywgY2hhbmdlcykpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuc3RhcnRXaXRoID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJzdGFydFdpdGhcIiwgdmFsdWUsIHRoaXMuc2Nhbih2YWx1ZSwgZnVuY3Rpb24ocHJldiwgbmV4dCkge1xuICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLmJ1ZmZlcmluZ1Rocm90dGxlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3JlZjE7XG4gICAgICByZXR1cm4gKF9yZWYxID0gUHJvcGVydHkuX19zdXBlcl9fLmJ1ZmZlcmluZ1Rocm90dGxlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpLmJ1ZmZlcmluZ1Rocm90dGxlLmFwcGx5KF9yZWYxLCBhcmd1bWVudHMpLnRvUHJvcGVydHkoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFByb3BlcnR5O1xuXG4gIH0pKE9ic2VydmFibGUpO1xuXG4gIGNvbnZlcnRBcmdzVG9GdW5jdGlvbiA9IGZ1bmN0aW9uKG9icywgZiwgYXJncywgbWV0aG9kKSB7XG4gICAgdmFyIHNhbXBsZWQ7XG4gICAgaWYgKGYgaW5zdGFuY2VvZiBQcm9wZXJ0eSkge1xuICAgICAgc2FtcGxlZCA9IGYuc2FtcGxlZEJ5KG9icywgZnVuY3Rpb24ocCwgcykge1xuICAgICAgICByZXR1cm4gW3AsIHNdO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWV0aG9kLmNhbGwoc2FtcGxlZCwgZnVuY3Rpb24oX2FyZykge1xuICAgICAgICB2YXIgcCwgcztcbiAgICAgICAgcCA9IF9hcmdbMF0sIHMgPSBfYXJnWzFdO1xuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH0pLm1hcChmdW5jdGlvbihfYXJnKSB7XG4gICAgICAgIHZhciBwLCBzO1xuICAgICAgICBwID0gX2FyZ1swXSwgcyA9IF9hcmdbMV07XG4gICAgICAgIHJldHVybiBzO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGYgPSBtYWtlRnVuY3Rpb24oZiwgYXJncyk7XG4gICAgICByZXR1cm4gbWV0aG9kLmNhbGwob2JzLCBmKTtcbiAgICB9XG4gIH07XG5cbiAgYWRkUHJvcGVydHlJbml0VmFsdWVUb1N0cmVhbSA9IGZ1bmN0aW9uKHByb3BlcnR5LCBzdHJlYW0pIHtcbiAgICB2YXIganVzdEluaXRWYWx1ZTtcbiAgICBqdXN0SW5pdFZhbHVlID0gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKHByb3BlcnR5LCBcImp1c3RJbml0VmFsdWVcIiksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHZhciB1bnN1YiwgdmFsdWU7XG4gICAgICB2YWx1ZSA9IHZvaWQgMDtcbiAgICAgIHVuc3ViID0gcHJvcGVydHkuZGlzcGF0Y2hlci5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCFldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgdmFsdWUgPSBldmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQmFjb24ubm9Nb3JlO1xuICAgICAgfSk7XG4gICAgICBVcGRhdGVCYXJyaWVyLndoZW5Eb25lV2l0aChqdXN0SW5pdFZhbHVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICBzaW5rKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2luayhlbmQoKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB1bnN1YjtcbiAgICB9KTtcbiAgICByZXR1cm4ganVzdEluaXRWYWx1ZS5jb25jYXQoc3RyZWFtKS50b1Byb3BlcnR5KCk7XG4gIH07XG5cbiAgRGlzcGF0Y2hlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBEaXNwYXRjaGVyKF9zdWJzY3JpYmUsIF9oYW5kbGVFdmVudCkge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlID0gX3N1YnNjcmliZTtcbiAgICAgIHRoaXMuX2hhbmRsZUV2ZW50ID0gX2hhbmRsZUV2ZW50O1xuICAgICAgdGhpcy5zdWJzY3JpYmUgPSBfX2JpbmQodGhpcy5zdWJzY3JpYmUsIHRoaXMpO1xuICAgICAgdGhpcy5oYW5kbGVFdmVudCA9IF9fYmluZCh0aGlzLmhhbmRsZUV2ZW50LCB0aGlzKTtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgICAgdGhpcy5wdXNoaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmVuZGVkID0gZmFsc2U7XG4gICAgICB0aGlzLnByZXZFcnJvciA9IHZvaWQgMDtcbiAgICAgIHRoaXMudW5zdWJTcmMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuaGFzU3Vic2NyaWJlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoID4gMDtcbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlU3ViID0gZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpcHRpb25zID0gXy53aXRob3V0KHN1YnNjcmlwdGlvbiwgdGhpcy5zdWJzY3JpcHRpb25zKTtcbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQuaXNFbmQoKSkge1xuICAgICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBVcGRhdGVCYXJyaWVyLmluVHJhbnNhY3Rpb24oZXZlbnQsIHRoaXMsIHRoaXMucHVzaEl0LCBbZXZlbnRdKTtcbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUucHVzaFRvU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgcmVwbHksIHN1YiwgdG1wLCBfaSwgX2xlbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRtcCA9IHRoaXMuc3Vic2NyaXB0aW9ucztcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB0bXAubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBzdWIgPSB0bXBbX2ldO1xuICAgICAgICAgIHJlcGx5ID0gc3ViLnNpbmsoZXZlbnQpO1xuICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlIHx8IGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlU3ViKHN1Yik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5wdXNoSXQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKCF0aGlzLnB1c2hpbmcpIHtcbiAgICAgICAgaWYgKGV2ZW50ID09PSB0aGlzLnByZXZFcnJvcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuaXNFcnJvcigpKSB7XG4gICAgICAgICAgdGhpcy5wcmV2RXJyb3IgPSBldmVudDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnB1c2hpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLnB1c2hUb1N1YnNjcmlwdGlvbnMoZXZlbnQpO1xuICAgICAgICB0aGlzLnB1c2hpbmcgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKHRoaXMucXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgZXZlbnQgPSB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5oYXNTdWJzY3JpYmVycygpKSB7XG4gICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21Tb3VyY2UoKTtcbiAgICAgICAgICByZXR1cm4gQmFjb24ubm9Nb3JlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnF1ZXVlLnB1c2goZXZlbnQpO1xuICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKHRoaXMuX2hhbmRsZUV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVFdmVudChldmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUudW5zdWJzY3JpYmVGcm9tU291cmNlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy51bnN1YlNyYykge1xuICAgICAgICB0aGlzLnVuc3ViU3JjKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy51bnN1YlNyYyA9IHZvaWQgMDtcbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oc2luaykge1xuICAgICAgdmFyIHN1YnNjcmlwdGlvbjtcbiAgICAgIGlmICh0aGlzLmVuZGVkKSB7XG4gICAgICAgIHNpbmsoZW5kKCkpO1xuICAgICAgICByZXR1cm4gbm9wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXJ0RnVuY3Rpb24oc2luayk7XG4gICAgICAgIHN1YnNjcmlwdGlvbiA9IHtcbiAgICAgICAgICBzaW5rOiBzaW5rXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnNjcmlwdGlvbik7XG4gICAgICAgIGlmICh0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgdGhpcy51bnN1YlNyYyA9IHRoaXMuX3N1YnNjcmliZSh0aGlzLmhhbmRsZUV2ZW50KTtcbiAgICAgICAgICBhc3NlcnRGdW5jdGlvbih0aGlzLnVuc3ViU3JjKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMucmVtb3ZlU3ViKHN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICBpZiAoIV90aGlzLmhhc1N1YnNjcmliZXJzKCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnVuc3Vic2NyaWJlRnJvbVNvdXJjZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gRGlzcGF0Y2hlcjtcblxuICB9KSgpO1xuXG4gIFByb3BlcnR5RGlzcGF0Y2hlciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUHJvcGVydHlEaXNwYXRjaGVyLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gUHJvcGVydHlEaXNwYXRjaGVyKHByb3BlcnR5LCBzdWJzY3JpYmUsIGhhbmRsZUV2ZW50KSB7XG4gICAgICB0aGlzLnByb3BlcnR5ID0gcHJvcGVydHk7XG4gICAgICB0aGlzLnN1YnNjcmliZSA9IF9fYmluZCh0aGlzLnN1YnNjcmliZSwgdGhpcyk7XG4gICAgICBQcm9wZXJ0eURpc3BhdGNoZXIuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgc3Vic2NyaWJlLCBoYW5kbGVFdmVudCk7XG4gICAgICB0aGlzLmN1cnJlbnQgPSBOb25lO1xuICAgICAgdGhpcy5jdXJyZW50VmFsdWVSb290SWQgPSB2b2lkIDA7XG4gICAgICB0aGlzLnByb3BlcnR5RW5kZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBQcm9wZXJ0eURpc3BhdGNoZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eUVuZGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudC5oYXNWYWx1ZSgpKSB7XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ldyBTb21lKGV2ZW50KTtcbiAgICAgICAgdGhpcy5jdXJyZW50VmFsdWVSb290SWQgPSBVcGRhdGVCYXJyaWVyLmN1cnJlbnRFdmVudElkKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvcGVydHlEaXNwYXRjaGVyLl9fc3VwZXJfXy5wdXNoLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eURpc3BhdGNoZXIucHJvdG90eXBlLm1heWJlU3ViU291cmNlID0gZnVuY3Rpb24oc2luaywgcmVwbHkpIHtcbiAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgIHJldHVybiBub3A7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcGVydHlFbmRlZCkge1xuICAgICAgICBzaW5rKGVuZCgpKTtcbiAgICAgICAgcmV0dXJuIG5vcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBEaXNwYXRjaGVyLnByb3RvdHlwZS5zdWJzY3JpYmUuY2FsbCh0aGlzLCBzaW5rKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgUHJvcGVydHlEaXNwYXRjaGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbihzaW5rKSB7XG4gICAgICB2YXIgZGlzcGF0Y2hpbmdJZCwgaW5pdFNlbnQsIHJlcGx5LCB2YWxJZDtcbiAgICAgIGluaXRTZW50ID0gZmFsc2U7XG4gICAgICByZXBseSA9IEJhY29uLm1vcmU7XG4gICAgICBpZiAodGhpcy5jdXJyZW50LmlzRGVmaW5lZCAmJiAodGhpcy5oYXNTdWJzY3JpYmVycygpIHx8IHRoaXMucHJvcGVydHlFbmRlZCkpIHtcbiAgICAgICAgZGlzcGF0Y2hpbmdJZCA9IFVwZGF0ZUJhcnJpZXIuY3VycmVudEV2ZW50SWQoKTtcbiAgICAgICAgdmFsSWQgPSB0aGlzLmN1cnJlbnRWYWx1ZVJvb3RJZDtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BlcnR5RW5kZWQgJiYgdmFsSWQgJiYgZGlzcGF0Y2hpbmdJZCAmJiBkaXNwYXRjaGluZ0lkICE9PSB2YWxJZCkge1xuICAgICAgICAgIFVwZGF0ZUJhcnJpZXIud2hlbkRvbmVXaXRoKHRoaXMucHJvcGVydHksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoX3RoaXMuY3VycmVudFZhbHVlUm9vdElkID09PSB2YWxJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW5rKGluaXRpYWwoX3RoaXMuY3VycmVudC5nZXQoKS52YWx1ZSgpKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSkodGhpcykpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1heWJlU3ViU291cmNlKHNpbmssIHJlcGx5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBVcGRhdGVCYXJyaWVyLmluVHJhbnNhY3Rpb24odm9pZCAwLCB0aGlzLCAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwbHkgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbmsoaW5pdGlhbCh0aGlzLmN1cnJlbnQuZ2V0KCkudmFsdWUoKSkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgICAgICB9KSwgW10pO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1heWJlU3ViU291cmNlKHNpbmssIHJlcGx5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWF5YmVTdWJTb3VyY2Uoc2luaywgcmVwbHkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gUHJvcGVydHlEaXNwYXRjaGVyO1xuXG4gIH0pKERpc3BhdGNoZXIpO1xuXG4gIEJ1cyA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQnVzLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gQnVzKCkge1xuICAgICAgdGhpcy5ndWFyZGVkU2luayA9IF9fYmluZCh0aGlzLmd1YXJkZWRTaW5rLCB0aGlzKTtcbiAgICAgIHRoaXMuc3Vic2NyaWJlQWxsID0gX19iaW5kKHRoaXMuc3Vic2NyaWJlQWxsLCB0aGlzKTtcbiAgICAgIHRoaXMudW5zdWJBbGwgPSBfX2JpbmQodGhpcy51bnN1YkFsbCwgdGhpcyk7XG4gICAgICB0aGlzLnNpbmsgPSB2b2lkIDA7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgIHRoaXMuZW5kZWQgPSBmYWxzZTtcbiAgICAgIEJ1cy5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCBkZXNjcmliZShCYWNvbiwgXCJCdXNcIiksIHRoaXMuc3Vic2NyaWJlQWxsKTtcbiAgICB9XG5cbiAgICBCdXMucHJvdG90eXBlLnVuc3ViQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc3ViLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICBfcmVmMSA9IHRoaXMuc3Vic2NyaXB0aW9ucztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgc3ViID0gX3JlZjFbX2ldO1xuICAgICAgICBpZiAodHlwZW9mIHN1Yi51bnN1YiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgc3ViLnVuc3ViKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfTtcblxuICAgIEJ1cy5wcm90b3R5cGUuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24obmV3U2luaykge1xuICAgICAgdmFyIHN1YnNjcmlwdGlvbiwgX2ksIF9sZW4sIF9yZWYxO1xuICAgICAgdGhpcy5zaW5rID0gbmV3U2luaztcbiAgICAgIF9yZWYxID0gY2xvbmVBcnJheSh0aGlzLnN1YnNjcmlwdGlvbnMpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBzdWJzY3JpcHRpb24gPSBfcmVmMVtfaV07XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlSW5wdXQoc3Vic2NyaXB0aW9uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnVuc3ViQWxsO1xuICAgIH07XG5cbiAgICBCdXMucHJvdG90eXBlLmd1YXJkZWRTaW5rID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICAgIF90aGlzLnVuc3Vic2NyaWJlSW5wdXQoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnNpbmsoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgIH07XG5cbiAgICBCdXMucHJvdG90eXBlLnN1YnNjcmliZUlucHV0ID0gZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm4gc3Vic2NyaXB0aW9uLnVuc3ViID0gc3Vic2NyaXB0aW9uLmlucHV0LmRpc3BhdGNoZXIuc3Vic2NyaWJlKHRoaXMuZ3VhcmRlZFNpbmsoc3Vic2NyaXB0aW9uLmlucHV0KSk7XG4gICAgfTtcblxuICAgIEJ1cy5wcm90b3R5cGUudW5zdWJzY3JpYmVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICB2YXIgaSwgc3ViLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICBfcmVmMSA9IHRoaXMuc3Vic2NyaXB0aW9ucztcbiAgICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBpID0gKytfaSkge1xuICAgICAgICBzdWIgPSBfcmVmMVtpXTtcbiAgICAgICAgaWYgKHN1Yi5pbnB1dCA9PT0gaW5wdXQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHN1Yi51bnN1YiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBzdWIudW5zdWIoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgQnVzLnByb3RvdHlwZS5wbHVnID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHZhciBzdWI7XG4gICAgICBpZiAodGhpcy5lbmRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzdWIgPSB7XG4gICAgICAgIGlucHV0OiBpbnB1dFxuICAgICAgfTtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1Yik7XG4gICAgICBpZiAoKHRoaXMuc2luayAhPSBudWxsKSkge1xuICAgICAgICB0aGlzLnN1YnNjcmliZUlucHV0KHN1Yik7XG4gICAgICB9XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMudW5zdWJzY3JpYmVJbnB1dChpbnB1dCk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICB9O1xuXG4gICAgQnVzLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuZW5kZWQgPSB0cnVlO1xuICAgICAgdGhpcy51bnN1YkFsbCgpO1xuICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLnNpbmsgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMuc2luayhlbmQoKSkgOiB2b2lkIDA7XG4gICAgfTtcblxuICAgIEJ1cy5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHRoaXMuc2luayA9PT0gXCJmdW5jdGlvblwiID8gdGhpcy5zaW5rKG5leHQodmFsdWUpKSA6IHZvaWQgMDtcbiAgICB9O1xuXG4gICAgQnVzLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHRoaXMuc2luayA9PT0gXCJmdW5jdGlvblwiID8gdGhpcy5zaW5rKG5ldyBFcnJvcihlcnJvcikpIDogdm9pZCAwO1xuICAgIH07XG5cbiAgICByZXR1cm4gQnVzO1xuXG4gIH0pKEV2ZW50U3RyZWFtKTtcblxuICBTb3VyY2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gU291cmNlKG9icywgc3luYywgbGF6eSkge1xuICAgICAgdGhpcy5vYnMgPSBvYnM7XG4gICAgICB0aGlzLnN5bmMgPSBzeW5jO1xuICAgICAgdGhpcy5sYXp5ID0gbGF6eSAhPSBudWxsID8gbGF6eSA6IGZhbHNlO1xuICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIH1cblxuICAgIFNvdXJjZS5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oc2luaykge1xuICAgICAgcmV0dXJuIHRoaXMub2JzLmRpc3BhdGNoZXIuc3Vic2NyaWJlKHNpbmspO1xuICAgIH07XG5cbiAgICBTb3VyY2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5vYnMudG9TdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgU291cmNlLnByb3RvdHlwZS5tYXJrRW5kZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgU291cmNlLnByb3RvdHlwZS5jb25zdW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5sYXp5KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdmFsdWU6IF8uYWx3YXlzKHRoaXMucXVldWVbMF0pXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZVswXTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgU291cmNlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHRoaXMucXVldWUgPSBbeF07XG4gICAgfTtcblxuICAgIFNvdXJjZS5wcm90b3R5cGUubWF5SGF2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIFNvdXJjZS5wcm90b3R5cGUuaGFzQXRMZWFzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucXVldWUubGVuZ3RoO1xuICAgIH07XG5cbiAgICBTb3VyY2UucHJvdG90eXBlLmZsYXR0ZW4gPSB0cnVlO1xuXG4gICAgcmV0dXJuIFNvdXJjZTtcblxuICB9KSgpO1xuXG4gIENvbnN1bWluZ1NvdXJjZSA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQ29uc3VtaW5nU291cmNlLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gQ29uc3VtaW5nU291cmNlKCkge1xuICAgICAgcmV0dXJuIENvbnN1bWluZ1NvdXJjZS5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBDb25zdW1pbmdTb3VyY2UucHJvdG90eXBlLmNvbnN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG4gICAgfTtcblxuICAgIENvbnN1bWluZ1NvdXJjZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnB1c2goeCk7XG4gICAgfTtcblxuICAgIENvbnN1bWluZ1NvdXJjZS5wcm90b3R5cGUubWF5SGF2ZSA9IGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAhdGhpcy5lbmRlZCB8fCB0aGlzLnF1ZXVlLmxlbmd0aCA+PSBjO1xuICAgIH07XG5cbiAgICBDb25zdW1pbmdTb3VyY2UucHJvdG90eXBlLmhhc0F0TGVhc3QgPSBmdW5jdGlvbihjKSB7XG4gICAgICByZXR1cm4gdGhpcy5xdWV1ZS5sZW5ndGggPj0gYztcbiAgICB9O1xuXG4gICAgQ29uc3VtaW5nU291cmNlLnByb3RvdHlwZS5mbGF0dGVuID0gZmFsc2U7XG5cbiAgICByZXR1cm4gQ29uc3VtaW5nU291cmNlO1xuXG4gIH0pKFNvdXJjZSk7XG5cbiAgQnVmZmVyaW5nU291cmNlID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhCdWZmZXJpbmdTb3VyY2UsIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBCdWZmZXJpbmdTb3VyY2Uob2JzKSB7XG4gICAgICBCdWZmZXJpbmdTb3VyY2UuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb2JzLCB0cnVlKTtcbiAgICB9XG5cbiAgICBCdWZmZXJpbmdTb3VyY2UucHJvdG90eXBlLmNvbnN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2YWx1ZXM7XG4gICAgICB2YWx1ZXMgPSB0aGlzLnF1ZXVlO1xuICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcblxuICAgIEJ1ZmZlcmluZ1NvdXJjZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnB1c2goeC52YWx1ZSgpKTtcbiAgICB9O1xuXG4gICAgQnVmZmVyaW5nU291cmNlLnByb3RvdHlwZS5oYXNBdExlYXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEJ1ZmZlcmluZ1NvdXJjZTtcblxuICB9KShTb3VyY2UpO1xuXG4gIFNvdXJjZS5pc1RyaWdnZXIgPSBmdW5jdGlvbihzKSB7XG4gICAgaWYgKHMgaW5zdGFuY2VvZiBTb3VyY2UpIHtcbiAgICAgIHJldHVybiBzLnN5bmM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzIGluc3RhbmNlb2YgRXZlbnRTdHJlYW07XG4gICAgfVxuICB9O1xuXG4gIFNvdXJjZS5mcm9tT2JzZXJ2YWJsZSA9IGZ1bmN0aW9uKHMpIHtcbiAgICBpZiAocyBpbnN0YW5jZW9mIFNvdXJjZSkge1xuICAgICAgcmV0dXJuIHM7XG4gICAgfSBlbHNlIGlmIChzIGluc3RhbmNlb2YgUHJvcGVydHkpIHtcbiAgICAgIHJldHVybiBuZXcgU291cmNlKHMsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBDb25zdW1pbmdTb3VyY2UocywgdHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIGRlc2NyaWJlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGNvbnRleHQsIG1ldGhvZDtcbiAgICBjb250ZXh0ID0gYXJndW1lbnRzWzBdLCBtZXRob2QgPSBhcmd1bWVudHNbMV0sIGFyZ3MgPSAzIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IFtdO1xuICAgIGlmICgoY29udGV4dCB8fCBtZXRob2QpIGluc3RhbmNlb2YgRGVzYykge1xuICAgICAgcmV0dXJuIGNvbnRleHQgfHwgbWV0aG9kO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IERlc2MoY29udGV4dCwgbWV0aG9kLCBhcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgZmluZERlcHMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKGlzQXJyYXkoeCkpIHtcbiAgICAgIHJldHVybiBfLmZsYXRNYXAoZmluZERlcHMsIHgpO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKHgpKSB7XG4gICAgICByZXR1cm4gW3hdO1xuICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIFNvdXJjZSkge1xuICAgICAgcmV0dXJuIFt4Lm9ic107XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH07XG5cbiAgRGVzYyA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBEZXNjKGNvbnRleHQsIG1ldGhvZCwgYXJncykge1xuICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgICAgdGhpcy5hcmdzID0gYXJncztcbiAgICAgIHRoaXMuY2FjaGVkID0gdm9pZCAwO1xuICAgIH1cblxuICAgIERlc2MucHJvdG90eXBlLmRlcHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhY2hlZCB8fCAodGhpcy5jYWNoZWQgPSBmaW5kRGVwcyhbdGhpcy5jb250ZXh0XS5jb25jYXQodGhpcy5hcmdzKSkpO1xuICAgIH07XG5cbiAgICBEZXNjLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKG9icykge1xuICAgICAgb2JzLmRlc2MgPSB0aGlzO1xuICAgICAgcmV0dXJuIG9icztcbiAgICB9O1xuXG4gICAgRGVzYy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBfLnRvU3RyaW5nKHRoaXMuY29udGV4dCkgKyBcIi5cIiArIF8udG9TdHJpbmcodGhpcy5tZXRob2QpICsgXCIoXCIgKyBfLm1hcChfLnRvU3RyaW5nLCB0aGlzLmFyZ3MpICsgXCIpXCI7XG4gICAgfTtcblxuICAgIHJldHVybiBEZXNjO1xuXG4gIH0pKCk7XG5cbiAgd2l0aERlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRlc2MsIG9icywgX2k7XG4gICAgZGVzYyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIF9pID0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIDogKF9pID0gMCwgW10pLCBvYnMgPSBhcmd1bWVudHNbX2krK107XG4gICAgcmV0dXJuIGRlc2NyaWJlLmFwcGx5KG51bGwsIGRlc2MpLmFwcGx5KG9icyk7XG4gIH07XG5cbiAgQmFjb24ud2hlbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmLCBpLCBpbmRleCwgaXgsIGxlbiwgbmVlZHNCYXJyaWVyLCBwYXQsIHBhdFNvdXJjZXMsIHBhdHMsIHBhdHRlcm5zLCByZXN1bHRTdHJlYW0sIHMsIHNvdXJjZXMsIHRyaWdnZXJGb3VuZCwgdXNhZ2UsIF9pLCBfaiwgX2xlbiwgX2xlbjEsIF9yZWYxO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gQmFjb24ubmV2ZXIoKTtcbiAgICB9XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICB1c2FnZSA9IFwid2hlbjogZXhwZWN0aW5nIGFyZ3VtZW50cyBpbiB0aGUgZm9ybSAoT2JzZXJ2YWJsZSssZnVuY3Rpb24pK1wiO1xuICAgIGFzc2VydCh1c2FnZSwgbGVuICUgMiA9PT0gMCk7XG4gICAgc291cmNlcyA9IFtdO1xuICAgIHBhdHMgPSBbXTtcbiAgICBpID0gMDtcbiAgICBwYXR0ZXJucyA9IFtdO1xuICAgIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgICBwYXR0ZXJuc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIHBhdHRlcm5zW2kgKyAxXSA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgICBwYXRTb3VyY2VzID0gXy50b0FycmF5KGFyZ3VtZW50c1tpXSk7XG4gICAgICBmID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICAgIHBhdCA9IHtcbiAgICAgICAgZjogKGlzRnVuY3Rpb24oZikgPyBmIDogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9KSksXG4gICAgICAgIGl4czogW11cbiAgICAgIH07XG4gICAgICB0cmlnZ2VyRm91bmQgPSBmYWxzZTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcGF0U291cmNlcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBzID0gcGF0U291cmNlc1tfaV07XG4gICAgICAgIGluZGV4ID0gXy5pbmRleE9mKHNvdXJjZXMsIHMpO1xuICAgICAgICBpZiAoIXRyaWdnZXJGb3VuZCkge1xuICAgICAgICAgIHRyaWdnZXJGb3VuZCA9IFNvdXJjZS5pc1RyaWdnZXIocyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgIHNvdXJjZXMucHVzaChzKTtcbiAgICAgICAgICBpbmRleCA9IHNvdXJjZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBfcmVmMSA9IHBhdC5peHM7XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYxLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIGl4ID0gX3JlZjFbX2pdO1xuICAgICAgICAgIGlmIChpeC5pbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgIGl4LmNvdW50Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhdC5peHMucHVzaCh7XG4gICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgIGNvdW50OiAxXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgYXNzZXJ0KFwiQXQgbGVhc3Qgb25lIEV2ZW50U3RyZWFtIHJlcXVpcmVkXCIsIHRyaWdnZXJGb3VuZCB8fCAoIXBhdFNvdXJjZXMubGVuZ3RoKSk7XG4gICAgICBpZiAocGF0U291cmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHBhdHMucHVzaChwYXQpO1xuICAgICAgfVxuICAgICAgaSA9IGkgKyAyO1xuICAgIH1cbiAgICBpZiAoIXNvdXJjZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gQmFjb24ubmV2ZXIoKTtcbiAgICB9XG4gICAgc291cmNlcyA9IF8ubWFwKFNvdXJjZS5mcm9tT2JzZXJ2YWJsZSwgc291cmNlcyk7XG4gICAgbmVlZHNCYXJyaWVyID0gKF8uYW55KHNvdXJjZXMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgIHJldHVybiBzLmZsYXR0ZW47XG4gICAgfSkpICYmIChjb250YWluc0R1cGxpY2F0ZURlcHMoXy5tYXAoKGZ1bmN0aW9uKHMpIHtcbiAgICAgIHJldHVybiBzLm9icztcbiAgICB9KSwgc291cmNlcykpKTtcbiAgICByZXR1cm4gcmVzdWx0U3RyZWFtID0gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlLmFwcGx5KG51bGwsIFtCYWNvbiwgXCJ3aGVuXCJdLmNvbmNhdChfX3NsaWNlLmNhbGwocGF0dGVybnMpKSksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHZhciBjYW5ub3RNYXRjaCwgY2Fubm90U3luYywgZW5kcywgbWF0Y2gsIG5vbkZsYXR0ZW5lZCwgcGFydCwgdHJpZ2dlcnM7XG4gICAgICB0cmlnZ2VycyA9IFtdO1xuICAgICAgZW5kcyA9IGZhbHNlO1xuICAgICAgbWF0Y2ggPSBmdW5jdGlvbihwKSB7XG4gICAgICAgIHZhciBfaywgX2xlbjIsIF9yZWYyO1xuICAgICAgICBfcmVmMiA9IHAuaXhzO1xuICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBfcmVmMi5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICBpID0gX3JlZjJbX2tdO1xuICAgICAgICAgIGlmICghc291cmNlc1tpLmluZGV4XS5oYXNBdExlYXN0KGkuY291bnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICAgIGNhbm5vdFN5bmMgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuICFzb3VyY2Uuc3luYyB8fCBzb3VyY2UuZW5kZWQ7XG4gICAgICB9O1xuICAgICAgY2Fubm90TWF0Y2ggPSBmdW5jdGlvbihwKSB7XG4gICAgICAgIHZhciBfaywgX2xlbjIsIF9yZWYyO1xuICAgICAgICBfcmVmMiA9IHAuaXhzO1xuICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBfcmVmMi5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICBpID0gX3JlZjJbX2tdO1xuICAgICAgICAgIGlmICghc291cmNlc1tpLmluZGV4XS5tYXlIYXZlKGkuY291bnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBub25GbGF0dGVuZWQgPSBmdW5jdGlvbih0cmlnZ2VyKSB7XG4gICAgICAgIHJldHVybiAhdHJpZ2dlci5zb3VyY2UuZmxhdHRlbjtcbiAgICAgIH07XG4gICAgICBwYXJ0ID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih1bnN1YkFsbCkge1xuICAgICAgICAgIHZhciBmbHVzaCwgZmx1c2hMYXRlciwgZmx1c2hXaGlsZVRyaWdnZXJzO1xuICAgICAgICAgIGZsdXNoTGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBVcGRhdGVCYXJyaWVyLndoZW5Eb25lV2l0aChyZXN1bHRTdHJlYW0sIGZsdXNoKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGZsdXNoV2hpbGVUcmlnZ2VycyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGV2ZW50cywgcCwgcmVwbHksIHRyaWdnZXIsIF9rLCBfbGVuMjtcbiAgICAgICAgICAgIGlmICh0cmlnZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHJlcGx5ID0gQmFjb24ubW9yZTtcbiAgICAgICAgICAgICAgdHJpZ2dlciA9IHRyaWdnZXJzLnBvcCgpO1xuICAgICAgICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBwYXRzLmxlbmd0aDsgX2sgPCBfbGVuMjsgX2srKykge1xuICAgICAgICAgICAgICAgIHAgPSBwYXRzW19rXTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gocCkpIHtcbiAgICAgICAgICAgICAgICAgIGV2ZW50cyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9sLCBfbGVuMywgX3JlZjIsIF9yZXN1bHRzO1xuICAgICAgICAgICAgICAgICAgICBfcmVmMiA9IHAuaXhzO1xuICAgICAgICAgICAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKF9sID0gMCwgX2xlbjMgPSBfcmVmMi5sZW5ndGg7IF9sIDwgX2xlbjM7IF9sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICBpID0gX3JlZjJbX2xdO1xuICAgICAgICAgICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goc291cmNlc1tpLmluZGV4XS5jb25zdW1lKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgICByZXBseSA9IHNpbmsodHJpZ2dlci5lLmFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnQsIHZhbHVlcztcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBfbCwgX2xlbjMsIF9yZXN1bHRzO1xuICAgICAgICAgICAgICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgZm9yIChfbCA9IDAsIF9sZW4zID0gZXZlbnRzLmxlbmd0aDsgX2wgPCBfbGVuMzsgX2wrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBldmVudHNbX2xdO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChldmVudC52YWx1ZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcC5mLmFwcGx5KHAsIHZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICBpZiAodHJpZ2dlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJzID0gXy5maWx0ZXIobm9uRmxhdHRlbmVkLCB0cmlnZ2Vycyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVwbHk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmx1c2hXaGlsZVRyaWdnZXJzKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIGZsdXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmVwbHk7XG4gICAgICAgICAgICByZXBseSA9IGZsdXNoV2hpbGVUcmlnZ2VycygpO1xuICAgICAgICAgICAgaWYgKGVuZHMpIHtcbiAgICAgICAgICAgICAgZW5kcyA9IGZhbHNlO1xuICAgICAgICAgICAgICBpZiAoXy5hbGwoc291cmNlcywgY2Fubm90U3luYykgfHwgXy5hbGwocGF0cywgY2Fubm90TWF0Y2gpKSB7XG4gICAgICAgICAgICAgICAgcmVwbHkgPSBCYWNvbi5ub01vcmU7XG4gICAgICAgICAgICAgICAgc2luayhlbmQoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgIHVuc3ViQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVwbHk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gc291cmNlLnN1YnNjcmliZShmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgcmVwbHk7XG4gICAgICAgICAgICBpZiAoZS5pc0VuZCgpKSB7XG4gICAgICAgICAgICAgIGVuZHMgPSB0cnVlO1xuICAgICAgICAgICAgICBzb3VyY2UubWFya0VuZGVkKCk7XG4gICAgICAgICAgICAgIGZsdXNoTGF0ZXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZS5pc0Vycm9yKCkpIHtcbiAgICAgICAgICAgICAgcmVwbHkgPSBzaW5rKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc291cmNlLnB1c2goZSk7XG4gICAgICAgICAgICAgIGlmIChzb3VyY2Uuc3luYykge1xuICAgICAgICAgICAgICAgIHRyaWdnZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgICAgICAgICBlOiBlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKG5lZWRzQmFycmllciB8fCBVcGRhdGVCYXJyaWVyLmhhc1dhaXRlcnMoKSkge1xuICAgICAgICAgICAgICAgICAgZmx1c2hMYXRlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcGx5ID09PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgdW5zdWJBbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXBseSB8fCBCYWNvbi5tb3JlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBjb21wb3NpdGVVbnN1YnNjcmliZS5hcHBseShudWxsLCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaywgX2xlbjIsIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBzb3VyY2VzLmxlbmd0aDsgX2sgPCBfbGVuMjsgX2srKykge1xuICAgICAgICAgIHMgPSBzb3VyY2VzW19rXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHBhcnQocykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCkpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbnRhaW5zRHVwbGljYXRlRGVwcyA9IGZ1bmN0aW9uKG9ic2VydmFibGVzLCBzdGF0ZSkge1xuICAgIHZhciBjaGVja09ic2VydmFibGU7XG4gICAgaWYgKHN0YXRlID09IG51bGwpIHtcbiAgICAgIHN0YXRlID0gW107XG4gICAgfVxuICAgIGNoZWNrT2JzZXJ2YWJsZSA9IGZ1bmN0aW9uKG9icykge1xuICAgICAgdmFyIGRlcHM7XG4gICAgICBpZiAoXy5jb250YWlucyhzdGF0ZSwgb2JzKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlcHMgPSBvYnMuaW50ZXJuYWxEZXBzKCk7XG4gICAgICAgIGlmIChkZXBzLmxlbmd0aCkge1xuICAgICAgICAgIHN0YXRlLnB1c2gob2JzKTtcbiAgICAgICAgICByZXR1cm4gXy5hbnkoZGVwcywgY2hlY2tPYnNlcnZhYmxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZS5wdXNoKG9icyk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gXy5hbnkob2JzZXJ2YWJsZXMsIGNoZWNrT2JzZXJ2YWJsZSk7XG4gIH07XG5cbiAgQmFjb24udXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGksIGluaXRpYWwsIGxhdGVCaW5kRmlyc3QsIHBhdHRlcm5zO1xuICAgIGluaXRpYWwgPSBhcmd1bWVudHNbMF0sIHBhdHRlcm5zID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBsYXRlQmluZEZpcnN0ID0gZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgcmV0dXJuIGYuYXBwbHkobnVsbCwgW2ldLmNvbmNhdChhcmdzKSk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH07XG4gICAgaSA9IHBhdHRlcm5zLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKGkgPiAwKSB7XG4gICAgICBpZiAoIShwYXR0ZXJuc1tpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICBwYXR0ZXJuc1tpXSA9IChmdW5jdGlvbih4KSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkocGF0dGVybnNbaV0pO1xuICAgICAgfVxuICAgICAgcGF0dGVybnNbaV0gPSBsYXRlQmluZEZpcnN0KHBhdHRlcm5zW2ldKTtcbiAgICAgIGkgPSBpIC0gMjtcbiAgICB9XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbi5hcHBseShudWxsLCBbQmFjb24sIFwidXBkYXRlXCIsIGluaXRpYWxdLmNvbmNhdChfX3NsaWNlLmNhbGwocGF0dGVybnMpLCBbQmFjb24ud2hlbi5hcHBseShCYWNvbiwgcGF0dGVybnMpLnNjYW4oaW5pdGlhbCwgKGZ1bmN0aW9uKHgsIGYpIHtcbiAgICAgIHJldHVybiBmKHgpO1xuICAgIH0pKV0pKTtcbiAgfTtcblxuICBjb21wb3NpdGVVbnN1YnNjcmliZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzcztcbiAgICBzcyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgcmV0dXJuIG5ldyBDb21wb3NpdGVVbnN1YnNjcmliZShzcykudW5zdWJzY3JpYmU7XG4gIH07XG5cbiAgQ29tcG9zaXRlVW5zdWJzY3JpYmUgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQ29tcG9zaXRlVW5zdWJzY3JpYmUoc3MpIHtcbiAgICAgIHZhciBzLCBfaSwgX2xlbjtcbiAgICAgIGlmIChzcyA9PSBudWxsKSB7XG4gICAgICAgIHNzID0gW107XG4gICAgICB9XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlID0gX19iaW5kKHRoaXMudW5zdWJzY3JpYmUsIHRoaXMpO1xuICAgICAgdGhpcy51bnN1YnNjcmliZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgdGhpcy5zdGFydGluZyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBzID0gc3NbX2ldO1xuICAgICAgICB0aGlzLmFkZChzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBDb21wb3NpdGVVbnN1YnNjcmliZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XG4gICAgICB2YXIgZW5kZWQsIHVuc3ViLCB1bnN1Yk1lO1xuICAgICAgaWYgKHRoaXMudW5zdWJzY3JpYmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGVuZGVkID0gZmFsc2U7XG4gICAgICB1bnN1YiA9IG5vcDtcbiAgICAgIHRoaXMuc3RhcnRpbmcucHVzaChzdWJzY3JpcHRpb24pO1xuICAgICAgdW5zdWJNZSA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLnVuc3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbmRlZCA9IHRydWU7XG4gICAgICAgICAgX3RoaXMucmVtb3ZlKHVuc3ViKTtcbiAgICAgICAgICByZXR1cm4gXy5yZW1vdmUoc3Vic2NyaXB0aW9uLCBfdGhpcy5zdGFydGluZyk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICAgIHVuc3ViID0gc3Vic2NyaXB0aW9uKHRoaXMudW5zdWJzY3JpYmUsIHVuc3ViTWUpO1xuICAgICAgaWYgKCEodGhpcy51bnN1YnNjcmliZWQgfHwgZW5kZWQpKSB7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHVuc3ViKTtcbiAgICAgIH1cbiAgICAgIF8ucmVtb3ZlKHN1YnNjcmlwdGlvbiwgdGhpcy5zdGFydGluZyk7XG4gICAgICByZXR1cm4gdW5zdWI7XG4gICAgfTtcblxuICAgIENvbXBvc2l0ZVVuc3Vic2NyaWJlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih1bnN1Yikge1xuICAgICAgaWYgKHRoaXMudW5zdWJzY3JpYmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICgoXy5yZW1vdmUodW5zdWIsIHRoaXMuc3Vic2NyaXB0aW9ucykpICE9PSB2b2lkIDApIHtcbiAgICAgICAgcmV0dXJuIHVuc3ViKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbXBvc2l0ZVVuc3Vic2NyaWJlLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHMsIF9pLCBfbGVuLCBfcmVmMTtcbiAgICAgIGlmICh0aGlzLnVuc3Vic2NyaWJlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlZCA9IHRydWU7XG4gICAgICBfcmVmMSA9IHRoaXMuc3Vic2NyaXB0aW9ucztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgcyA9IF9yZWYxW19pXTtcbiAgICAgICAgcygpO1xuICAgICAgfVxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zID0gW107XG4gICAgICByZXR1cm4gdGhpcy5zdGFydGluZyA9IFtdO1xuICAgIH07XG5cbiAgICBDb21wb3NpdGVVbnN1YnNjcmliZS5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnVuc3Vic2NyaWJlZCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoICsgdGhpcy5zdGFydGluZy5sZW5ndGg7XG4gICAgfTtcblxuICAgIENvbXBvc2l0ZVVuc3Vic2NyaWJlLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY291bnQoKSA9PT0gMDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIENvbXBvc2l0ZVVuc3Vic2NyaWJlO1xuXG4gIH0pKCk7XG5cbiAgQmFjb24uQ29tcG9zaXRlVW5zdWJzY3JpYmUgPSBDb21wb3NpdGVVbnN1YnNjcmliZTtcblxuICBTb21lID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFNvbWUodmFsdWUpIHtcbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBTb21lLnByb3RvdHlwZS5nZXRPckVsc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH07XG5cbiAgICBTb21lLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH07XG5cbiAgICBTb21lLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbihmKSB7XG4gICAgICBpZiAoZih0aGlzLnZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbmV3IFNvbWUodGhpcy52YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTm9uZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgU29tZS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIG5ldyBTb21lKGYodGhpcy52YWx1ZSkpO1xuICAgIH07XG5cbiAgICBTb21lLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIGYodGhpcy52YWx1ZSk7XG4gICAgfTtcblxuICAgIFNvbWUucHJvdG90eXBlLmlzRGVmaW5lZCA9IHRydWU7XG5cbiAgICBTb21lLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gW3RoaXMudmFsdWVdO1xuICAgIH07XG5cbiAgICBTb21lLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXCJTb21lKFwiICsgdGhpcy52YWx1ZSArIFwiKVwiO1xuICAgIH07XG5cbiAgICBTb21lLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gU29tZTtcblxuICB9KSgpO1xuXG4gIE5vbmUgPSB7XG4gICAgZ2V0T3JFbHNlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgZmlsdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBOb25lO1xuICAgIH0sXG4gICAgbWFwOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBOb25lO1xuICAgIH0sXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oKSB7fSxcbiAgICBpc0RlZmluZWQ6IGZhbHNlLFxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0sXG4gICAgaW5zcGVjdDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXCJOb25lXCI7XG4gICAgfSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCk7XG4gICAgfVxuICB9O1xuXG4gIFVwZGF0ZUJhcnJpZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFmdGVyVHJhbnNhY3Rpb24sIGFmdGVycywgYWZ0ZXJzSW5kZXgsIGN1cnJlbnRFdmVudElkLCBmbHVzaCwgZmx1c2hEZXBzT2YsIGZsdXNoV2FpdGVycywgaGFzV2FpdGVycywgaW5UcmFuc2FjdGlvbiwgcm9vdEV2ZW50LCB3YWl0ZXJPYnMsIHdhaXRlcnMsIHdoZW5Eb25lV2l0aCwgd3JhcHBlZFN1YnNjcmliZTtcbiAgICByb290RXZlbnQgPSB2b2lkIDA7XG4gICAgd2FpdGVyT2JzID0gW107XG4gICAgd2FpdGVycyA9IHt9O1xuICAgIGFmdGVycyA9IFtdO1xuICAgIGFmdGVyc0luZGV4ID0gMDtcbiAgICBhZnRlclRyYW5zYWN0aW9uID0gZnVuY3Rpb24oZikge1xuICAgICAgaWYgKHJvb3RFdmVudCkge1xuICAgICAgICByZXR1cm4gYWZ0ZXJzLnB1c2goZik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZigpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2hlbkRvbmVXaXRoID0gZnVuY3Rpb24ob2JzLCBmKSB7XG4gICAgICB2YXIgb2JzV2FpdGVycztcbiAgICAgIGlmIChyb290RXZlbnQpIHtcbiAgICAgICAgb2JzV2FpdGVycyA9IHdhaXRlcnNbb2JzLmlkXTtcbiAgICAgICAgaWYgKG9ic1dhaXRlcnMgPT0gbnVsbCkge1xuICAgICAgICAgIG9ic1dhaXRlcnMgPSB3YWl0ZXJzW29icy5pZF0gPSBbZl07XG4gICAgICAgICAgcmV0dXJuIHdhaXRlck9icy5wdXNoKG9icyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9ic1dhaXRlcnMucHVzaChmKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGYoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZsdXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICB3aGlsZSAod2FpdGVyT2JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZmx1c2hXYWl0ZXJzKDApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9O1xuICAgIGZsdXNoV2FpdGVycyA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICB2YXIgZiwgb2JzLCBvYnNJZCwgb2JzV2FpdGVycywgX2ksIF9sZW47XG4gICAgICBvYnMgPSB3YWl0ZXJPYnNbaW5kZXhdO1xuICAgICAgb2JzSWQgPSBvYnMuaWQ7XG4gICAgICBvYnNXYWl0ZXJzID0gd2FpdGVyc1tvYnNJZF07XG4gICAgICB3YWl0ZXJPYnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIGRlbGV0ZSB3YWl0ZXJzW29ic0lkXTtcbiAgICAgIGZsdXNoRGVwc09mKG9icyk7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9ic1dhaXRlcnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZiA9IG9ic1dhaXRlcnNbX2ldO1xuICAgICAgICBmKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH07XG4gICAgZmx1c2hEZXBzT2YgPSBmdW5jdGlvbihvYnMpIHtcbiAgICAgIHZhciBkZXAsIGRlcHMsIGluZGV4LCBfaSwgX2xlbjtcbiAgICAgIGRlcHMgPSBvYnMuaW50ZXJuYWxEZXBzKCk7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGRlcHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZGVwID0gZGVwc1tfaV07XG4gICAgICAgIGZsdXNoRGVwc09mKGRlcCk7XG4gICAgICAgIGlmICh3YWl0ZXJzW2RlcC5pZF0pIHtcbiAgICAgICAgICBpbmRleCA9IF8uaW5kZXhPZih3YWl0ZXJPYnMsIGRlcCk7XG4gICAgICAgICAgZmx1c2hXYWl0ZXJzKGluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9O1xuICAgIGluVHJhbnNhY3Rpb24gPSBmdW5jdGlvbihldmVudCwgY29udGV4dCwgZiwgYXJncykge1xuICAgICAgdmFyIGFmdGVyLCByZXN1bHQ7XG4gICAgICBpZiAocm9vdEV2ZW50KSB7XG4gICAgICAgIHJldHVybiBmLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIHJlc3VsdCA9IGYuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgICAgIHJvb3RFdmVudCA9IHZvaWQgMDtcbiAgICAgICAgd2hpbGUgKGFmdGVyc0luZGV4IDwgYWZ0ZXJzLmxlbmd0aCkge1xuICAgICAgICAgIGFmdGVyID0gYWZ0ZXJzW2FmdGVyc0luZGV4XTtcbiAgICAgICAgICBhZnRlcnNJbmRleCsrO1xuICAgICAgICAgIGFmdGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgYWZ0ZXJzSW5kZXggPSAwO1xuICAgICAgICBhZnRlcnMgPSBbXTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9O1xuICAgIGN1cnJlbnRFdmVudElkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocm9vdEV2ZW50KSB7XG4gICAgICAgIHJldHVybiByb290RXZlbnQuaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuICAgIH07XG4gICAgd3JhcHBlZFN1YnNjcmliZSA9IGZ1bmN0aW9uKG9icywgc2luaykge1xuICAgICAgdmFyIGRvVW5zdWIsIHVuc3ViLCB1bnN1YmQ7XG4gICAgICB1bnN1YmQgPSBmYWxzZTtcbiAgICAgIGRvVW5zdWIgPSBmdW5jdGlvbigpIHt9O1xuICAgICAgdW5zdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdW5zdWJkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGRvVW5zdWIoKTtcbiAgICAgIH07XG4gICAgICBkb1Vuc3ViID0gb2JzLmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiBhZnRlclRyYW5zYWN0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZXBseTtcbiAgICAgICAgICBpZiAoIXVuc3ViZCkge1xuICAgICAgICAgICAgcmVwbHkgPSBzaW5rKGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgIHJldHVybiB1bnN1YigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB1bnN1YjtcbiAgICB9O1xuICAgIGhhc1dhaXRlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3YWl0ZXJPYnMubGVuZ3RoID4gMDtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICB3aGVuRG9uZVdpdGg6IHdoZW5Eb25lV2l0aCxcbiAgICAgIGhhc1dhaXRlcnM6IGhhc1dhaXRlcnMsXG4gICAgICBpblRyYW5zYWN0aW9uOiBpblRyYW5zYWN0aW9uLFxuICAgICAgY3VycmVudEV2ZW50SWQ6IGN1cnJlbnRFdmVudElkLFxuICAgICAgd3JhcHBlZFN1YnNjcmliZTogd3JhcHBlZFN1YnNjcmliZVxuICAgIH07XG4gIH0pKCk7XG5cbiAgQmFjb24uRXZlbnRTdHJlYW0gPSBFdmVudFN0cmVhbTtcblxuICBCYWNvbi5Qcm9wZXJ0eSA9IFByb3BlcnR5O1xuXG4gIEJhY29uLk9ic2VydmFibGUgPSBPYnNlcnZhYmxlO1xuXG4gIEJhY29uLkJ1cyA9IEJ1cztcblxuICBCYWNvbi5Jbml0aWFsID0gSW5pdGlhbDtcblxuICBCYWNvbi5OZXh0ID0gTmV4dDtcblxuICBCYWNvbi5FbmQgPSBFbmQ7XG5cbiAgQmFjb24uRXJyb3IgPSBFcnJvcjtcblxuICBub3AgPSBmdW5jdGlvbigpIHt9O1xuXG4gIGxhdHRlciA9IGZ1bmN0aW9uKF8sIHgpIHtcbiAgICByZXR1cm4geDtcbiAgfTtcblxuICBmb3JtZXIgPSBmdW5jdGlvbih4LCBfKSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG5cbiAgaW5pdGlhbCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBJbml0aWFsKHZhbHVlLCB0cnVlKTtcbiAgfTtcblxuICBuZXh0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IE5leHQodmFsdWUsIHRydWUpO1xuICB9O1xuXG4gIGVuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRW5kKCk7XG4gIH07XG5cbiAgdG9FdmVudCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV2ZW50KSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5leHQoeCk7XG4gICAgfVxuICB9O1xuXG4gIGNsb25lQXJyYXkgPSBmdW5jdGlvbih4cykge1xuICAgIHJldHVybiB4cy5zbGljZSgwKTtcbiAgfTtcblxuICBhc3NlcnQgPSBmdW5jdGlvbihtZXNzYWdlLCBjb25kaXRpb24pIHtcbiAgICBpZiAoIWNvbmRpdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihtZXNzYWdlKTtcbiAgICB9XG4gIH07XG5cbiAgYXNzZXJ0RXZlbnRTdHJlYW0gPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmICghKGV2ZW50IGluc3RhbmNlb2YgRXZlbnRTdHJlYW0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwibm90IGFuIEV2ZW50U3RyZWFtIDogXCIgKyBldmVudCk7XG4gICAgfVxuICB9O1xuXG4gIGFzc2VydEZ1bmN0aW9uID0gZnVuY3Rpb24oZikge1xuICAgIHJldHVybiBhc3NlcnQoXCJub3QgYSBmdW5jdGlvbiA6IFwiICsgZiwgaXNGdW5jdGlvbihmKSk7XG4gIH07XG5cbiAgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKGYpIHtcbiAgICByZXR1cm4gdHlwZW9mIGYgPT09IFwiZnVuY3Rpb25cIjtcbiAgfTtcblxuICBpc0FycmF5ID0gZnVuY3Rpb24oeHMpIHtcbiAgICByZXR1cm4geHMgaW5zdGFuY2VvZiBBcnJheTtcbiAgfTtcblxuICBpc09ic2VydmFibGUgPSBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIHggaW5zdGFuY2VvZiBPYnNlcnZhYmxlO1xuICB9O1xuXG4gIGFzc2VydEFycmF5ID0gZnVuY3Rpb24oeHMpIHtcbiAgICBpZiAoIWlzQXJyYXkoeHMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwibm90IGFuIGFycmF5IDogXCIgKyB4cyk7XG4gICAgfVxuICB9O1xuXG4gIGFzc2VydE5vQXJndW1lbnRzID0gZnVuY3Rpb24oYXJncykge1xuICAgIHJldHVybiBhc3NlcnQoXCJubyBhcmd1bWVudHMgc3VwcG9ydGVkXCIsIGFyZ3MubGVuZ3RoID09PSAwKTtcbiAgfTtcblxuICBhc3NlcnRTdHJpbmcgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwibm90IGEgc3RyaW5nIDogXCIgKyB4KTtcbiAgICB9XG4gIH07XG5cbiAgcGFydGlhbGx5QXBwbGllZCA9IGZ1bmN0aW9uKGYsIGFwcGxpZWQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncztcbiAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgcmV0dXJuIGYuYXBwbHkobnVsbCwgYXBwbGllZC5jb25jYXQoYXJncykpO1xuICAgIH07XG4gIH07XG5cbiAgbWFrZVNwYXduZXIgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIGlzT2JzZXJ2YWJsZShhcmdzWzBdKSkge1xuICAgICAgcmV0dXJuIF8uYWx3YXlzKGFyZ3NbMF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWFrZUZ1bmN0aW9uQXJncyhhcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgbWFrZUZ1bmN0aW9uQXJncyA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncyk7XG4gICAgcmV0dXJuIG1ha2VGdW5jdGlvbl8uYXBwbHkobnVsbCwgYXJncyk7XG4gIH07XG5cbiAgbWFrZUZ1bmN0aW9uXyA9IHdpdGhNZXRob2RDYWxsU3VwcG9ydChmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywgZjtcbiAgICBmID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBpZiAoaXNGdW5jdGlvbihmKSkge1xuICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsbHlBcHBsaWVkKGYsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGY7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0ZpZWxkS2V5KGYpKSB7XG4gICAgICByZXR1cm4gdG9GaWVsZEV4dHJhY3RvcihmLCBhcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIF8uYWx3YXlzKGYpO1xuICAgIH1cbiAgfSk7XG5cbiAgbWFrZUZ1bmN0aW9uID0gZnVuY3Rpb24oZiwgYXJncykge1xuICAgIHJldHVybiBtYWtlRnVuY3Rpb25fLmFwcGx5KG51bGwsIFtmXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3MpKSk7XG4gIH07XG5cbiAgbWFrZU9ic2VydmFibGUgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKGlzT2JzZXJ2YWJsZSh4KSkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCYWNvbi5vbmNlKHgpO1xuICAgIH1cbiAgfTtcblxuICBpc0ZpZWxkS2V5ID0gZnVuY3Rpb24oZikge1xuICAgIHJldHVybiAodHlwZW9mIGYgPT09IFwic3RyaW5nXCIpICYmIGYubGVuZ3RoID4gMSAmJiBmLmNoYXJBdCgwKSA9PT0gXCIuXCI7XG4gIH07XG5cbiAgQmFjb24uaXNGaWVsZEtleSA9IGlzRmllbGRLZXk7XG5cbiAgdG9GaWVsZEV4dHJhY3RvciA9IGZ1bmN0aW9uKGYsIGFyZ3MpIHtcbiAgICB2YXIgcGFydEZ1bmNzLCBwYXJ0cztcbiAgICBwYXJ0cyA9IGYuc2xpY2UoMSkuc3BsaXQoXCIuXCIpO1xuICAgIHBhcnRGdW5jcyA9IF8ubWFwKHRvU2ltcGxlRXh0cmFjdG9yKGFyZ3MpLCBwYXJ0cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgX2ksIF9sZW47XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHBhcnRGdW5jcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBmID0gcGFydEZ1bmNzW19pXTtcbiAgICAgICAgdmFsdWUgPSBmKHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9O1xuXG4gIHRvU2ltcGxlRXh0cmFjdG9yID0gZnVuY3Rpb24oYXJncykge1xuICAgIHJldHVybiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgZmllbGRWYWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZpZWxkVmFsdWUgPSB2YWx1ZVtrZXldO1xuICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKGZpZWxkVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9O1xuICB9O1xuXG4gIHRvRmllbGRLZXkgPSBmdW5jdGlvbihmKSB7XG4gICAgcmV0dXJuIGYuc2xpY2UoMSk7XG4gIH07XG5cbiAgdG9Db21iaW5hdG9yID0gZnVuY3Rpb24oZikge1xuICAgIHZhciBrZXk7XG4gICAgaWYgKGlzRnVuY3Rpb24oZikpIHtcbiAgICAgIHJldHVybiBmO1xuICAgIH0gZWxzZSBpZiAoaXNGaWVsZEtleShmKSkge1xuICAgICAga2V5ID0gdG9GaWVsZEtleShmKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgICByZXR1cm4gbGVmdFtrZXldKHJpZ2h0KTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhc3NlcnQoXCJub3QgYSBmdW5jdGlvbiBvciBhIGZpZWxkIGtleTogXCIgKyBmLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIHRvT3B0aW9uID0gZnVuY3Rpb24odikge1xuICAgIGlmICh2IGluc3RhbmNlb2YgU29tZSB8fCB2ID09PSBOb25lKSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBTb21lKHYpO1xuICAgIH1cbiAgfTtcblxuICBfID0ge1xuICAgIGluZGV4T2Y6IEFycmF5LnByb3RvdHlwZS5pbmRleE9mID8gZnVuY3Rpb24oeHMsIHgpIHtcbiAgICAgIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIH0gOiBmdW5jdGlvbih4cywgeCkge1xuICAgICAgdmFyIGksIHksIF9pLCBfbGVuO1xuICAgICAgZm9yIChpID0gX2kgPSAwLCBfbGVuID0geHMubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICAgIHkgPSB4c1tpXTtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH0sXG4gICAgaW5kZXhXaGVyZTogZnVuY3Rpb24oeHMsIGYpIHtcbiAgICAgIHZhciBpLCB5LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IHhzLmxlbmd0aDsgX2kgPCBfbGVuOyBpID0gKytfaSkge1xuICAgICAgICB5ID0geHNbaV07XG4gICAgICAgIGlmIChmKHkpKSB7XG4gICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9LFxuICAgIGhlYWQ6IGZ1bmN0aW9uKHhzKSB7XG4gICAgICByZXR1cm4geHNbMF07XG4gICAgfSxcbiAgICBhbHdheXM6IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgICB9O1xuICAgIH0sXG4gICAgbmVnYXRlOiBmdW5jdGlvbihmKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gIWYoeCk7XG4gICAgICB9O1xuICAgIH0sXG4gICAgZW1wdHk6IGZ1bmN0aW9uKHhzKSB7XG4gICAgICByZXR1cm4geHMubGVuZ3RoID09PSAwO1xuICAgIH0sXG4gICAgdGFpbDogZnVuY3Rpb24oeHMpIHtcbiAgICAgIHJldHVybiB4cy5zbGljZSgxLCB4cy5sZW5ndGgpO1xuICAgIH0sXG4gICAgZmlsdGVyOiBmdW5jdGlvbihmLCB4cykge1xuICAgICAgdmFyIGZpbHRlcmVkLCB4LCBfaSwgX2xlbjtcbiAgICAgIGZpbHRlcmVkID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHhzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHggPSB4c1tfaV07XG4gICAgICAgIGlmIChmKHgpKSB7XG4gICAgICAgICAgZmlsdGVyZWQucHVzaCh4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbHRlcmVkO1xuICAgIH0sXG4gICAgbWFwOiBmdW5jdGlvbihmLCB4cykge1xuICAgICAgdmFyIHgsIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHhzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHggPSB4c1tfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2goZih4KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfSxcbiAgICBlYWNoOiBmdW5jdGlvbih4cywgZikge1xuICAgICAgdmFyIGtleSwgdmFsdWU7XG4gICAgICBmb3IgKGtleSBpbiB4cykge1xuICAgICAgICB2YWx1ZSA9IHhzW2tleV07XG4gICAgICAgIGYoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH0sXG4gICAgdG9BcnJheTogZnVuY3Rpb24oeHMpIHtcbiAgICAgIGlmIChpc0FycmF5KHhzKSkge1xuICAgICAgICByZXR1cm4geHM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW3hzXTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbih4cywgeCkge1xuICAgICAgcmV0dXJuIF8uaW5kZXhPZih4cywgeCkgIT09IC0xO1xuICAgIH0sXG4gICAgaWQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH0sXG4gICAgbGFzdDogZnVuY3Rpb24oeHMpIHtcbiAgICAgIHJldHVybiB4c1t4cy5sZW5ndGggLSAxXTtcbiAgICB9LFxuICAgIGFsbDogZnVuY3Rpb24oeHMsIGYpIHtcbiAgICAgIHZhciB4LCBfaSwgX2xlbjtcbiAgICAgIGlmIChmID09IG51bGwpIHtcbiAgICAgICAgZiA9IF8uaWQ7XG4gICAgICB9XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHhzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHggPSB4c1tfaV07XG4gICAgICAgIGlmICghZih4KSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBhbnk6IGZ1bmN0aW9uKHhzLCBmKSB7XG4gICAgICB2YXIgeCwgX2ksIF9sZW47XG4gICAgICBpZiAoZiA9PSBudWxsKSB7XG4gICAgICAgIGYgPSBfLmlkO1xuICAgICAgfVxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB4cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB4ID0geHNbX2ldO1xuICAgICAgICBpZiAoZih4KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICB3aXRob3V0OiBmdW5jdGlvbih4LCB4cykge1xuICAgICAgcmV0dXJuIF8uZmlsdGVyKChmdW5jdGlvbih5KSB7XG4gICAgICAgIHJldHVybiB5ICE9PSB4O1xuICAgICAgfSksIHhzKTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24oeCwgeHMpIHtcbiAgICAgIHZhciBpO1xuICAgICAgaSA9IF8uaW5kZXhPZih4cywgeCk7XG4gICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB4cy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBmb2xkOiBmdW5jdGlvbih4cywgc2VlZCwgZikge1xuICAgICAgdmFyIHgsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB4cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB4ID0geHNbX2ldO1xuICAgICAgICBzZWVkID0gZihzZWVkLCB4KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZWVkO1xuICAgIH0sXG4gICAgZmxhdE1hcDogZnVuY3Rpb24oZiwgeHMpIHtcbiAgICAgIHJldHVybiBfLmZvbGQoeHMsIFtdLCAoZnVuY3Rpb24oeXMsIHgpIHtcbiAgICAgICAgcmV0dXJuIHlzLmNvbmNhdChmKHgpKTtcbiAgICAgIH0pKTtcbiAgICB9LFxuICAgIGNhY2hlZDogZnVuY3Rpb24oZikge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFsdWUgPSBOb25lO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodmFsdWUgPT09IE5vbmUpIHtcbiAgICAgICAgICB2YWx1ZSA9IGYoKTtcbiAgICAgICAgICBmID0gdm9pZCAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH07XG4gICAgfSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgZXgsIGludGVybmFscywga2V5LCB2YWx1ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlY3Vyc2lvbkRlcHRoKys7XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBcInVuZGVmaW5lZFwiO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24ob2JqKSkge1xuICAgICAgICAgIHJldHVybiBcImZ1bmN0aW9uXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgICAgICAgaWYgKHJlY3Vyc2lvbkRlcHRoID4gNSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiWy4uXVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gXCJbXCIgKyBfLm1hcChfLnRvU3RyaW5nLCBvYmopLnRvU3RyaW5nKCkgKyBcIl1cIjtcbiAgICAgICAgfSBlbHNlIGlmICgoKG9iaiAhPSBudWxsID8gb2JqLnRvU3RyaW5nIDogdm9pZCAwKSAhPSBudWxsKSAmJiBvYmoudG9TdHJpbmcgIT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gb2JqLnRvU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgIGlmIChyZWN1cnNpb25EZXB0aCA+IDUpIHtcbiAgICAgICAgICAgIHJldHVybiBcInsuLn1cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW50ZXJuYWxzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIF9yZXN1bHRzO1xuICAgICAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgICAgICBpZiAoIV9faGFzUHJvcC5jYWxsKG9iaiwga2V5KSkgY29udGludWU7XG4gICAgICAgICAgICAgIHZhbHVlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICBleCA9IF9lcnJvcjtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goXy50b1N0cmluZyhrZXkpICsgXCI6XCIgKyBfLnRvU3RyaW5nKHZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgICByZXR1cm4gXCJ7XCIgKyBpbnRlcm5hbHMgKyBcIn1cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICByZWN1cnNpb25EZXB0aC0tO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZWN1cnNpb25EZXB0aCA9IDA7XG5cbiAgQmFjb24uXyA9IF87XG5cbiAgQmFjb24uc2NoZWR1bGVyID0ge1xuICAgIHNldFRpbWVvdXQ6IGZ1bmN0aW9uKGYsIGQpIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGYsIGQpO1xuICAgIH0sXG4gICAgc2V0SW50ZXJ2YWw6IGZ1bmN0aW9uKGYsIGkpIHtcbiAgICAgIHJldHVybiBzZXRJbnRlcnZhbChmLCBpKTtcbiAgICB9LFxuICAgIGNsZWFySW50ZXJ2YWw6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICByZXR1cm4gY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSxcbiAgICBub3c6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIH1cbiAgfTtcblxuICBpZiAoKHR5cGVvZiBkZWZpbmUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lICE9PSBudWxsKSAmJiAoZGVmaW5lLmFtZCAhPSBudWxsKSkge1xuICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gQmFjb247XG4gICAgfSk7XG4gICAgdGhpcy5CYWNvbiA9IEJhY29uO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCkgJiYgKG1vZHVsZS5leHBvcnRzICE9IG51bGwpKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBCYWNvbjtcbiAgICBCYWNvbi5CYWNvbiA9IEJhY29uO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuQmFjb24gPSBCYWNvbjtcbiAgfVxuXG59KS5jYWxsKHRoaXMpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiXX0=
