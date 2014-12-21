(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/Work/server/projects/hsl/index.js":[function(require,module,exports){
var Bacon = require('baconjs');

var body = $('body'),
    container = $('.container');

function xyFromEvent(e){ return [e.clientX, e.clientY]; }
function toHueSaturation(v){ return [Math.round(v[0] * (360 / body.width()) * 10) / 10, Math.round(v[1] * (100 / body.height()) * 10) / 10]; }

function getScrollPosition(){ return Math.round(container.scrollTop() / container.height() * 100); }
function lightnessFromScrollPosition(v){ return v < 0 ? 0 : v > 100 ? 100 : v; }

$(function(){
  container.scrollTop(container.height() / 2);

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
        if($('.container').css('transition') !== 'none') {
          setTimeout(function(){
            $('.container').css('transition', 'none');
            $('.color').html(v.join(' ') + '<br>' + container.css('background-color'));
          }, 250);
        }
      } else {
        $('.color').addClass('locked');
        $('.container').css('transition', 'background 250ms ease-out');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYWNvbmpzL2Rpc3QvQmFjb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQmFjb24gPSByZXF1aXJlKCdiYWNvbmpzJyk7XG5cbnZhciBib2R5ID0gJCgnYm9keScpLFxuICAgIGNvbnRhaW5lciA9ICQoJy5jb250YWluZXInKTtcblxuZnVuY3Rpb24geHlGcm9tRXZlbnQoZSl7IHJldHVybiBbZS5jbGllbnRYLCBlLmNsaWVudFldOyB9XG5mdW5jdGlvbiB0b0h1ZVNhdHVyYXRpb24odil7IHJldHVybiBbTWF0aC5yb3VuZCh2WzBdICogKDM2MCAvIGJvZHkud2lkdGgoKSkgKiAxMCkgLyAxMCwgTWF0aC5yb3VuZCh2WzFdICogKDEwMCAvIGJvZHkuaGVpZ2h0KCkpICogMTApIC8gMTBdOyB9XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFBvc2l0aW9uKCl7IHJldHVybiBNYXRoLnJvdW5kKGNvbnRhaW5lci5zY3JvbGxUb3AoKSAvIGNvbnRhaW5lci5oZWlnaHQoKSAqIDEwMCk7IH1cbmZ1bmN0aW9uIGxpZ2h0bmVzc0Zyb21TY3JvbGxQb3NpdGlvbih2KXsgcmV0dXJuIHYgPCAwID8gMCA6IHYgPiAxMDAgPyAxMDAgOiB2OyB9XG5cbiQoZnVuY3Rpb24oKXtcbiAgY29udGFpbmVyLnNjcm9sbFRvcChjb250YWluZXIuaGVpZ2h0KCkgLyAyKTtcblxuICB2YXIgbW91c2VQb3NpdGlvblN0cmVhbSA9IGJvZHlcbiAgICAuYXNFdmVudFN0cmVhbSgnbW91c2Vtb3ZlJylcbiAgICAubWFwKHh5RnJvbUV2ZW50KVxuICAgIC5tYXAodG9IdWVTYXR1cmF0aW9uKTtcblxuICB2YXIgdlNjcm9sbFN0cmVhbSA9ICQoJy5jb250YWluZXInKVxuICAgIC5hc0V2ZW50U3RyZWFtKCdzY3JvbGwnKVxuICAgIC5zdGFydFdpdGgoMClcbiAgICAubWFwKGdldFNjcm9sbFBvc2l0aW9uKVxuICAgIC5tYXAobGlnaHRuZXNzRnJvbVNjcm9sbFBvc2l0aW9uKTtcblxuICB2YXIgY2xpY2tTdHJlYW0gPSBib2R5XG4gICAgLmFzRXZlbnRTdHJlYW0oJ2NsaWNrJylcbiAgICAuZmlsdGVyKGZ1bmN0aW9uKGUpeyByZXR1cm4gISQoZS50YXJnZXQpLmhhc0NsYXNzKCdsb2NrZWQnKTsgIH0pIC8vIGZpbHRlciBvdXQgY2xpY2tzIG9uIHRoZSAubG9ja2VkIGVsZW1lbnRcbiAgICAuc2NhbigxLCBmdW5jdGlvbihhKXsgcmV0dXJuICFhOyB9KTtcblxuICBCYWNvbi5jb21iaW5lV2l0aChcbiAgICBmdW5jdGlvbihwb3MsIHNjcm9sbCwgdW5sb2NrZWQpeyByZXR1cm4gdW5sb2NrZWQgJiYgcG9zLmNvbmNhdChzY3JvbGwpOyB9LCBtb3VzZVBvc2l0aW9uU3RyZWFtLCB2U2Nyb2xsU3RyZWFtLCBjbGlja1N0cmVhbSlcbiAgICAub25WYWx1ZShmdW5jdGlvbih2KXtcbiAgICAgIGlmKHYpe1xuICAgICAgICAkKCcuY29udGFpbmVyJykuY3NzKCdiYWNrZ3JvdW5kJywgJ2hzbCgnK3ZbMF0rJywgJyt2WzFdKyclLCAnK3ZbMl0rJyUpJyk7XG4gICAgICAgICQoJy5jb2xvcicpLmh0bWwodi5qb2luKCcgJykgKyAnPGJyPicgKyBjb250YWluZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuICAgICAgICAkKCcuY29sb3InKS5yZW1vdmVDbGFzcygnbG9ja2VkJyk7XG4gICAgICAgIGlmKCQoJy5jb250YWluZXInKS5jc3MoJ3RyYW5zaXRpb24nKSAhPT0gJ25vbmUnKSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCgnLmNvbnRhaW5lcicpLmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XG4gICAgICAgICAgICAkKCcuY29sb3InKS5odG1sKHYuam9pbignICcpICsgJzxicj4nICsgY29udGFpbmVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicpKTtcbiAgICAgICAgICB9LCAyNTApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKCcuY29sb3InKS5hZGRDbGFzcygnbG9ja2VkJyk7XG4gICAgICAgICQoJy5jb250YWluZXInKS5jc3MoJ3RyYW5zaXRpb24nLCAnYmFja2dyb3VuZCAyNTBtcyBlYXNlLW91dCcpO1xuICAgICAgfVxuICB9KTtcblxufSk7XG5cblxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgQmFjb24sIEJ1ZmZlcmluZ1NvdXJjZSwgQnVzLCBDb21wb3NpdGVVbnN1YnNjcmliZSwgQ29uc3VtaW5nU291cmNlLCBEZXNjLCBEaXNwYXRjaGVyLCBFbmQsIEVycm9yLCBFdmVudCwgRXZlbnRTdHJlYW0sIEV4Y2VwdGlvbiwgSW5pdGlhbCwgTmV4dCwgTm9uZSwgT2JzZXJ2YWJsZSwgUHJvcGVydHksIFByb3BlcnR5RGlzcGF0Y2hlciwgU29tZSwgU291cmNlLCBVcGRhdGVCYXJyaWVyLCBhZGRQcm9wZXJ0eUluaXRWYWx1ZVRvU3RyZWFtLCBhc3NlcnQsIGFzc2VydEFycmF5LCBhc3NlcnRFdmVudFN0cmVhbSwgYXNzZXJ0RnVuY3Rpb24sIGFzc2VydE5vQXJndW1lbnRzLCBhc3NlcnRTdHJpbmcsIGNsb25lQXJyYXksIGNvbXBvc2l0ZVVuc3Vic2NyaWJlLCBjb250YWluc0R1cGxpY2F0ZURlcHMsIGNvbnZlcnRBcmdzVG9GdW5jdGlvbiwgZGVzY3JpYmUsIGVuZCwgZXZlbnRJZENvdW50ZXIsIGZpbmREZXBzLCBmbGF0TWFwXywgZm9ybWVyLCBpZENvdW50ZXIsIGluaXRpYWwsIGlzQXJyYXksIGlzRmllbGRLZXksIGlzRnVuY3Rpb24sIGlzT2JzZXJ2YWJsZSwgbGF0dGVyLCBsaWZ0Q2FsbGJhY2ssIG1ha2VGdW5jdGlvbiwgbWFrZUZ1bmN0aW9uQXJncywgbWFrZUZ1bmN0aW9uXywgbWFrZU9ic2VydmFibGUsIG1ha2VTcGF3bmVyLCBuZXh0LCBub3AsIHBhcnRpYWxseUFwcGxpZWQsIHJlY3Vyc2lvbkRlcHRoLCByZWdpc3Rlck9icywgc3B5cywgdG9Db21iaW5hdG9yLCB0b0V2ZW50LCB0b0ZpZWxkRXh0cmFjdG9yLCB0b0ZpZWxkS2V5LCB0b09wdGlvbiwgdG9TaW1wbGVFeHRyYWN0b3IsIHdpdGhEZXNjcmlwdGlvbiwgd2l0aE1ldGhvZENhbGxTdXBwb3J0LCBfLCBfcmVmLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZSxcbiAgICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBfX2JpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIEJhY29uID0ge1xuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBcIkJhY29uXCI7XG4gICAgfVxuICB9O1xuXG4gIEJhY29uLnZlcnNpb24gPSAnMC43LjM3JztcblxuICBFeGNlcHRpb24gPSAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBnbG9iYWwgIT09IG51bGwgPyBnbG9iYWwgOiB0aGlzKS5FcnJvcjtcblxuICBCYWNvbi5mcm9tQmluZGVyID0gZnVuY3Rpb24oYmluZGVyLCBldmVudFRyYW5zZm9ybWVyKSB7XG4gICAgaWYgKGV2ZW50VHJhbnNmb3JtZXIgPT0gbnVsbCkge1xuICAgICAgZXZlbnRUcmFuc2Zvcm1lciA9IF8uaWQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUoQmFjb24sIFwiZnJvbUJpbmRlclwiLCBiaW5kZXIsIGV2ZW50VHJhbnNmb3JtZXIpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICB2YXIgdW5iaW5kLCB1bmJpbmRlciwgdW5ib3VuZDtcbiAgICAgIHVuYm91bmQgPSBmYWxzZTtcbiAgICAgIHVuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodHlwZW9mIHVuYmluZGVyICE9PSBcInVuZGVmaW5lZFwiICYmIHVuYmluZGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKCF1bmJvdW5kKSB7XG4gICAgICAgICAgICB1bmJpbmRlcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdW5ib3VuZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB1bmJpbmRlciA9IGJpbmRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MsIGV2ZW50LCByZXBseSwgdmFsdWUsIF9pLCBfbGVuO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgdmFsdWUgPSBldmVudFRyYW5zZm9ybWVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAoIShpc0FycmF5KHZhbHVlKSAmJiBfLmxhc3QodmFsdWUpIGluc3RhbmNlb2YgRXZlbnQpKSB7XG4gICAgICAgICAgdmFsdWUgPSBbdmFsdWVdO1xuICAgICAgICB9XG4gICAgICAgIHJlcGx5ID0gQmFjb24ubW9yZTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB2YWx1ZS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGV2ZW50ID0gdmFsdWVbX2ldO1xuICAgICAgICAgIHJlcGx5ID0gc2luayhldmVudCA9IHRvRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSB8fCBldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICBpZiAodW5iaW5kZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB1bmJpbmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIEJhY29uLnNjaGVkdWxlci5zZXRUaW1lb3V0KHVuYmluZCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVwbHk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXBseTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHVuYmluZDtcbiAgICB9KTtcbiAgfTtcblxuICBCYWNvbi4kID0ge307XG5cbiAgQmFjb24uJC5hc0V2ZW50U3RyZWFtID0gZnVuY3Rpb24oZXZlbnROYW1lLCBzZWxlY3RvciwgZXZlbnRUcmFuc2Zvcm1lcikge1xuICAgIHZhciBfcmVmO1xuICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xuICAgICAgX3JlZiA9IFtzZWxlY3Rvciwgdm9pZCAwXSwgZXZlbnRUcmFuc2Zvcm1lciA9IF9yZWZbMF0sIHNlbGVjdG9yID0gX3JlZlsxXTtcbiAgICB9XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLnNlbGVjdG9yIHx8IHRoaXMsIFwiYXNFdmVudFN0cmVhbVwiLCBldmVudE5hbWUsIEJhY29uLmZyb21CaW5kZXIoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgICBfdGhpcy5vbihldmVudE5hbWUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5vZmYoZXZlbnROYW1lLCBzZWxlY3RvciwgaGFuZGxlcik7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pKHRoaXMpLCBldmVudFRyYW5zZm9ybWVyKSk7XG4gIH07XG5cbiAgaWYgKChfcmVmID0gdHlwZW9mIGpRdWVyeSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBqUXVlcnkgIT09IG51bGwgPyBqUXVlcnkgOiB0eXBlb2YgWmVwdG8gIT09IFwidW5kZWZpbmVkXCIgJiYgWmVwdG8gIT09IG51bGwgPyBaZXB0byA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgIF9yZWYuZm4uYXNFdmVudFN0cmVhbSA9IEJhY29uLiQuYXNFdmVudFN0cmVhbTtcbiAgfVxuXG4gIEJhY29uLmZyb21FdmVudFRhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCwgZXZlbnROYW1lLCBldmVudFRyYW5zZm9ybWVyKSB7XG4gICAgdmFyIHN1YiwgdW5zdWIsIF9yZWYxLCBfcmVmMiwgX3JlZjMsIF9yZWY0LCBfcmVmNSwgX3JlZjY7XG4gICAgc3ViID0gKF9yZWYxID0gKF9yZWYyID0gKF9yZWYzID0gdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIpICE9IG51bGwgPyBfcmVmMyA6IHRhcmdldC5hZGRMaXN0ZW5lcikgIT0gbnVsbCA/IF9yZWYyIDogdGFyZ2V0LmJpbmQpICE9IG51bGwgPyBfcmVmMSA6IHRhcmdldC5vbjtcbiAgICB1bnN1YiA9IChfcmVmNCA9IChfcmVmNSA9IChfcmVmNiA9IHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKSAhPSBudWxsID8gX3JlZjYgOiB0YXJnZXQucmVtb3ZlTGlzdGVuZXIpICE9IG51bGwgPyBfcmVmNSA6IHRhcmdldC51bmJpbmQpICE9IG51bGwgPyBfcmVmNCA6IHRhcmdldC5vZmY7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihCYWNvbiwgXCJmcm9tRXZlbnRUYXJnZXRcIiwgdGFyZ2V0LCBldmVudE5hbWUsIEJhY29uLmZyb21CaW5kZXIoZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgc3ViLmNhbGwodGFyZ2V0LCBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdW5zdWIuY2FsbCh0YXJnZXQsIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICB9O1xuICAgIH0sIGV2ZW50VHJhbnNmb3JtZXIpKTtcbiAgfTtcblxuICBCYWNvbi5mcm9tUHJvbWlzZSA9IGZ1bmN0aW9uKHByb21pc2UsIGFib3J0KSB7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihCYWNvbiwgXCJmcm9tUHJvbWlzZVwiLCBwcm9taXNlLCBCYWNvbi5mcm9tQmluZGVyKGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgIHByb21pc2UudGhlbihoYW5kbGVyLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVyKG5ldyBFcnJvcihlKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGFib3J0KSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9taXNlLmFib3J0ID09PSBcImZ1bmN0aW9uXCIgPyBwcm9taXNlLmFib3J0KCkgOiB2b2lkIDA7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSwgKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gW3ZhbHVlLCBlbmQoKV07XG4gICAgfSkpKTtcbiAgfTtcblxuICBCYWNvbi5ub01vcmUgPSBbXCI8bm8tbW9yZT5cIl07XG5cbiAgQmFjb24ubW9yZSA9IFtcIjxtb3JlPlwiXTtcblxuICBCYWNvbi5sYXRlciA9IGZ1bmN0aW9uKGRlbGF5LCB2YWx1ZSkge1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwibGF0ZXJcIiwgZGVsYXksIHZhbHVlLCBCYWNvbi5mcm9tUG9sbChkZWxheSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gW3ZhbHVlLCBlbmQoKV07XG4gICAgfSkpO1xuICB9O1xuXG4gIEJhY29uLnNlcXVlbnRpYWxseSA9IGZ1bmN0aW9uKGRlbGF5LCB2YWx1ZXMpIHtcbiAgICB2YXIgaW5kZXg7XG4gICAgaW5kZXggPSAwO1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwic2VxdWVudGlhbGx5XCIsIGRlbGF5LCB2YWx1ZXMsIEJhY29uLmZyb21Qb2xsKGRlbGF5LCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhbHVlID0gdmFsdWVzW2luZGV4KytdO1xuICAgICAgaWYgKGluZGV4IDwgdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBbdmFsdWUsIGVuZCgpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbmQoKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gIH07XG5cbiAgQmFjb24ucmVwZWF0ZWRseSA9IGZ1bmN0aW9uKGRlbGF5LCB2YWx1ZXMpIHtcbiAgICB2YXIgaW5kZXg7XG4gICAgaW5kZXggPSAwO1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwicmVwZWF0ZWRseVwiLCBkZWxheSwgdmFsdWVzLCBCYWNvbi5mcm9tUG9sbChkZWxheSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdmFsdWVzW2luZGV4KysgJSB2YWx1ZXMubGVuZ3RoXTtcbiAgICB9KSk7XG4gIH07XG5cbiAgQmFjb24uc3B5ID0gZnVuY3Rpb24oc3B5KSB7XG4gICAgcmV0dXJuIHNweXMucHVzaChzcHkpO1xuICB9O1xuXG4gIHNweXMgPSBbXTtcblxuICByZWdpc3Rlck9icyA9IGZ1bmN0aW9uKG9icykge1xuICAgIHZhciBzcHksIF9pLCBfbGVuO1xuICAgIGlmIChzcHlzLmxlbmd0aCkge1xuICAgICAgaWYgKCFyZWdpc3Rlck9icy5ydW5uaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVnaXN0ZXJPYnMucnVubmluZyA9IHRydWU7XG4gICAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzcHlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgICBzcHkgPSBzcHlzW19pXTtcbiAgICAgICAgICAgIHNweShvYnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkZWxldGUgcmVnaXN0ZXJPYnMucnVubmluZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9O1xuXG4gIHdpdGhNZXRob2RDYWxsU3VwcG9ydCA9IGZ1bmN0aW9uKHdyYXBwZWQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgY29udGV4dCwgZiwgbWV0aG9kTmFtZTtcbiAgICAgIGYgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgaWYgKHR5cGVvZiBmID09PSBcIm9iamVjdFwiICYmIGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRleHQgPSBmO1xuICAgICAgICBtZXRob2ROYW1lID0gYXJnc1swXTtcbiAgICAgICAgZiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0W21ldGhvZE5hbWVdLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHdyYXBwZWQuYXBwbHkobnVsbCwgW2ZdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJncykpKTtcbiAgICB9O1xuICB9O1xuXG4gIGxpZnRDYWxsYmFjayA9IGZ1bmN0aW9uKGRlc2MsIHdyYXBwZWQpIHtcbiAgICByZXR1cm4gd2l0aE1ldGhvZENhbGxTdXBwb3J0KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MsIGYsIHN0cmVhbTtcbiAgICAgIGYgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgc3RyZWFtID0gcGFydGlhbGx5QXBwbGllZCh3cmFwcGVkLCBbXG4gICAgICAgIGZ1bmN0aW9uKHZhbHVlcywgY2FsbGJhY2spIHtcbiAgICAgICAgICByZXR1cm4gZi5hcHBseShudWxsLCBfX3NsaWNlLmNhbGwodmFsdWVzKS5jb25jYXQoW2NhbGxiYWNrXSkpO1xuICAgICAgICB9XG4gICAgICBdKTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW0JhY29uLCBkZXNjLCBmXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3MpLCBbQmFjb24uY29tYmluZUFzQXJyYXkoYXJncykuZmxhdE1hcChzdHJlYW0pXSkpO1xuICAgIH0pO1xuICB9O1xuXG4gIEJhY29uLmZyb21DYWxsYmFjayA9IGxpZnRDYWxsYmFjayhcImZyb21DYWxsYmFja1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywgZjtcbiAgICBmID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICByZXR1cm4gQmFjb24uZnJvbUJpbmRlcihmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICBtYWtlRnVuY3Rpb24oZiwgYXJncykoaGFuZGxlcik7XG4gICAgICByZXR1cm4gbm9wO1xuICAgIH0sIChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIFt2YWx1ZSwgZW5kKCldO1xuICAgIH0pKTtcbiAgfSk7XG5cbiAgQmFjb24uZnJvbU5vZGVDYWxsYmFjayA9IGxpZnRDYWxsYmFjayhcImZyb21Ob2RlQ2FsbGJhY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGY7XG4gICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgcmV0dXJuIEJhY29uLmZyb21CaW5kZXIoZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgbWFrZUZ1bmN0aW9uKGYsIGFyZ3MpKGhhbmRsZXIpO1xuICAgICAgcmV0dXJuIG5vcDtcbiAgICB9LCBmdW5jdGlvbihlcnJvciwgdmFsdWUpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICByZXR1cm4gW25ldyBFcnJvcihlcnJvciksIGVuZCgpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbdmFsdWUsIGVuZCgpXTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgQmFjb24uZnJvbVBvbGwgPSBmdW5jdGlvbihkZWxheSwgcG9sbCkge1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24oQmFjb24sIFwiZnJvbVBvbGxcIiwgZGVsYXksIHBvbGwsIEJhY29uLmZyb21CaW5kZXIoKGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgIHZhciBpZDtcbiAgICAgIGlkID0gQmFjb24uc2NoZWR1bGVyLnNldEludGVydmFsKGhhbmRsZXIsIGRlbGF5KTtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLnNjaGVkdWxlci5jbGVhckludGVydmFsKGlkKTtcbiAgICAgIH07XG4gICAgfSksIHBvbGwpKTtcbiAgfTtcblxuICBCYWNvbi5pbnRlcnZhbCA9IGZ1bmN0aW9uKGRlbGF5LCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICB2YWx1ZSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKEJhY29uLCBcImludGVydmFsXCIsIGRlbGF5LCB2YWx1ZSwgQmFjb24uZnJvbVBvbGwoZGVsYXksIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5leHQodmFsdWUpO1xuICAgIH0pKTtcbiAgfTtcblxuICBCYWNvbi5jb25zdGFudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9wZXJ0eShkZXNjcmliZShCYWNvbiwgXCJjb25zdGFudFwiLCB2YWx1ZSksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHNpbmsoaW5pdGlhbCh2YWx1ZSkpO1xuICAgICAgc2luayhlbmQoKSk7XG4gICAgICByZXR1cm4gbm9wO1xuICAgIH0pO1xuICB9O1xuXG4gIEJhY29uLm5ldmVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFdmVudFN0cmVhbShkZXNjcmliZShCYWNvbiwgXCJuZXZlclwiKSwgZnVuY3Rpb24oc2luaykge1xuICAgICAgc2luayhlbmQoKSk7XG4gICAgICByZXR1cm4gbm9wO1xuICAgIH0pO1xuICB9O1xuXG4gIEJhY29uLm9uY2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUoQmFjb24sIFwib25jZVwiLCB2YWx1ZSksIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHNpbmsodG9FdmVudCh2YWx1ZSkpO1xuICAgICAgc2luayhlbmQoKSk7XG4gICAgICByZXR1cm4gbm9wO1xuICAgIH0pO1xuICB9O1xuXG4gIEJhY29uLmZyb21BcnJheSA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBpO1xuICAgIGFzc2VydEFycmF5KHZhbHVlcyk7XG4gICAgaSA9IDA7XG4gICAgcmV0dXJuIG5ldyBFdmVudFN0cmVhbShkZXNjcmliZShCYWNvbiwgXCJmcm9tQXJyYXlcIiwgdmFsdWVzKSwgZnVuY3Rpb24oc2luaykge1xuICAgICAgdmFyIHJlcGx5LCB1bnN1YmQsIHZhbHVlO1xuICAgICAgdW5zdWJkID0gZmFsc2U7XG4gICAgICByZXBseSA9IEJhY29uLm1vcmU7XG4gICAgICB3aGlsZSAoKHJlcGx5ICE9PSBCYWNvbi5ub01vcmUpICYmICF1bnN1YmQpIHtcbiAgICAgICAgaWYgKGkgPj0gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgIHNpbmsoZW5kKCkpO1xuICAgICAgICAgIHJlcGx5ID0gQmFjb24ubm9Nb3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gdmFsdWVzW2krK107XG4gICAgICAgICAgcmVwbHkgPSBzaW5rKHRvRXZlbnQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdW5zdWJkID0gdHJ1ZTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgQmFjb24ubWVyZ2VBbGwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyZWFtcztcbiAgICBzdHJlYW1zID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICBpZiAoaXNBcnJheShzdHJlYW1zWzBdKSkge1xuICAgICAgc3RyZWFtcyA9IHN0cmVhbXNbMF07XG4gICAgfVxuICAgIGlmIChzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG5ldyBFdmVudFN0cmVhbShkZXNjcmliZS5hcHBseShudWxsLCBbQmFjb24sIFwibWVyZ2VBbGxcIl0uY29uY2F0KF9fc2xpY2UuY2FsbChzdHJlYW1zKSkpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICAgIHZhciBlbmRzLCBzaW5rcywgc21hcnRTaW5rO1xuICAgICAgICBlbmRzID0gMDtcbiAgICAgICAgc21hcnRTaW5rID0gZnVuY3Rpb24ob2JzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHVuc3ViQm90aCkge1xuICAgICAgICAgICAgcmV0dXJuIG9icy5kaXNwYXRjaGVyLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICB2YXIgcmVwbHk7XG4gICAgICAgICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICAgICAgZW5kcysrO1xuICAgICAgICAgICAgICAgIGlmIChlbmRzID09PSBzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNpbmsoZW5kKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVwbHkgPSBzaW5rKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICAgICAgdW5zdWJCb3RoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXBseTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgc2lua3MgPSBfLm1hcChzbWFydFNpbmssIHN0cmVhbXMpO1xuICAgICAgICByZXR1cm4gY29tcG9zaXRlVW5zdWJzY3JpYmUuYXBwbHkobnVsbCwgc2lua3MpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCYWNvbi5uZXZlcigpO1xuICAgIH1cbiAgfTtcblxuICBCYWNvbi56aXBBc0FycmF5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0cmVhbXM7XG4gICAgc3RyZWFtcyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgaWYgKGlzQXJyYXkoc3RyZWFtc1swXSkpIHtcbiAgICAgIHN0cmVhbXMgPSBzdHJlYW1zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFtCYWNvbiwgXCJ6aXBBc0FycmF5XCJdLmNvbmNhdChfX3NsaWNlLmNhbGwoc3RyZWFtcyksIFtCYWNvbi56aXBXaXRoKHN0cmVhbXMsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHhzO1xuICAgICAgeHMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgcmV0dXJuIHhzO1xuICAgIH0pXSkpO1xuICB9O1xuXG4gIEJhY29uLnppcFdpdGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZiwgc3RyZWFtcywgX3JlZjE7XG4gICAgZiA9IGFyZ3VtZW50c1swXSwgc3RyZWFtcyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgaWYgKCFpc0Z1bmN0aW9uKGYpKSB7XG4gICAgICBfcmVmMSA9IFtmLCBzdHJlYW1zWzBdXSwgc3RyZWFtcyA9IF9yZWYxWzBdLCBmID0gX3JlZjFbMV07XG4gICAgfVxuICAgIHN0cmVhbXMgPSBfLm1hcCgoZnVuY3Rpb24ocykge1xuICAgICAgcmV0dXJuIHMudG9FdmVudFN0cmVhbSgpO1xuICAgIH0pLCBzdHJlYW1zKTtcbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFtCYWNvbiwgXCJ6aXBXaXRoXCIsIGZdLmNvbmNhdChfX3NsaWNlLmNhbGwoc3RyZWFtcyksIFtCYWNvbi53aGVuKHN0cmVhbXMsIGYpXSkpO1xuICB9O1xuXG4gIEJhY29uLmdyb3VwU2ltdWx0YW5lb3VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHMsIHNvdXJjZXMsIHN0cmVhbXM7XG4gICAgc3RyZWFtcyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgaWYgKHN0cmVhbXMubGVuZ3RoID09PSAxICYmIGlzQXJyYXkoc3RyZWFtc1swXSkpIHtcbiAgICAgIHN0cmVhbXMgPSBzdHJlYW1zWzBdO1xuICAgIH1cbiAgICBzb3VyY2VzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHN0cmVhbXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgcyA9IHN0cmVhbXNbX2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKG5ldyBCdWZmZXJpbmdTb3VyY2UocykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH0pKCk7XG4gICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbi5hcHBseShudWxsLCBbQmFjb24sIFwiZ3JvdXBTaW11bHRhbmVvdXNcIl0uY29uY2F0KF9fc2xpY2UuY2FsbChzdHJlYW1zKSwgW0JhY29uLndoZW4oc291cmNlcywgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHhzO1xuICAgICAgeHMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgcmV0dXJuIHhzO1xuICAgIH0pKV0pKTtcbiAgfTtcblxuICBCYWNvbi5jb21iaW5lQXNBcnJheSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbmRleCwgcywgc291cmNlcywgc3RyZWFtLCBzdHJlYW1zLCBfaSwgX2xlbjtcbiAgICBzdHJlYW1zID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICBpZiAoc3RyZWFtcy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShzdHJlYW1zWzBdKSkge1xuICAgICAgc3RyZWFtcyA9IHN0cmVhbXNbMF07XG4gICAgfVxuICAgIGZvciAoaW5kZXggPSBfaSA9IDAsIF9sZW4gPSBzdHJlYW1zLmxlbmd0aDsgX2kgPCBfbGVuOyBpbmRleCA9ICsrX2kpIHtcbiAgICAgIHN0cmVhbSA9IHN0cmVhbXNbaW5kZXhdO1xuICAgICAgaWYgKCEoaXNPYnNlcnZhYmxlKHN0cmVhbSkpKSB7XG4gICAgICAgIHN0cmVhbXNbaW5kZXhdID0gQmFjb24uY29uc3RhbnQoc3RyZWFtKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICBzb3VyY2VzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2osIF9sZW4xLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gc3RyZWFtcy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBzID0gc3RyZWFtc1tfal07XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChuZXcgU291cmNlKHMsIHRydWUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbi5hcHBseShudWxsLCBbQmFjb24sIFwiY29tYmluZUFzQXJyYXlcIl0uY29uY2F0KF9fc2xpY2UuY2FsbChzdHJlYW1zKSwgW0JhY29uLndoZW4oc291cmNlcywgKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgeHM7XG4gICAgICAgIHhzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHhzO1xuICAgICAgfSkpLnRvUHJvcGVydHkoKV0pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJhY29uLmNvbnN0YW50KFtdKTtcbiAgICB9XG4gIH07XG5cbiAgQmFjb24ub25WYWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZiwgc3RyZWFtcywgX2k7XG4gICAgc3RyZWFtcyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIF9pID0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIDogKF9pID0gMCwgW10pLCBmID0gYXJndW1lbnRzW19pKytdO1xuICAgIHJldHVybiBCYWNvbi5jb21iaW5lQXNBcnJheShzdHJlYW1zKS5vblZhbHVlcyhmKTtcbiAgfTtcblxuICBCYWNvbi5jb21iaW5lV2l0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmLCBzdHJlYW1zO1xuICAgIGYgPSBhcmd1bWVudHNbMF0sIHN0cmVhbXMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW0JhY29uLCBcImNvbWJpbmVXaXRoXCIsIGZdLmNvbmNhdChfX3NsaWNlLmNhbGwoc3RyZWFtcyksIFtCYWNvbi5jb21iaW5lQXNBcnJheShzdHJlYW1zKS5tYXAoZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICByZXR1cm4gZi5hcHBseShudWxsLCB2YWx1ZXMpO1xuICAgIH0pXSkpO1xuICB9O1xuXG4gIEJhY29uLmNvbWJpbmVUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgdmFyIGFwcGx5U3RyZWFtVmFsdWUsIGNvbWJpbmF0b3IsIGNvbXBpbGUsIGNvbXBpbGVUZW1wbGF0ZSwgY29uc3RhbnRWYWx1ZSwgY3VycmVudCwgZnVuY3MsIG1rQ29udGV4dCwgc2V0VmFsdWUsIHN0cmVhbXM7XG4gICAgZnVuY3MgPSBbXTtcbiAgICBzdHJlYW1zID0gW107XG4gICAgY3VycmVudCA9IGZ1bmN0aW9uKGN0eFN0YWNrKSB7XG4gICAgICByZXR1cm4gY3R4U3RhY2tbY3R4U3RhY2subGVuZ3RoIC0gMV07XG4gICAgfTtcbiAgICBzZXRWYWx1ZSA9IGZ1bmN0aW9uKGN0eFN0YWNrLCBrZXksIHZhbHVlKSB7XG4gICAgICByZXR1cm4gY3VycmVudChjdHhTdGFjaylba2V5XSA9IHZhbHVlO1xuICAgIH07XG4gICAgYXBwbHlTdHJlYW1WYWx1ZSA9IGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihjdHhTdGFjaywgdmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBzZXRWYWx1ZShjdHhTdGFjaywga2V5LCB2YWx1ZXNbaW5kZXhdKTtcbiAgICAgIH07XG4gICAgfTtcbiAgICBjb25zdGFudFZhbHVlID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGN0eFN0YWNrKSB7XG4gICAgICAgIHJldHVybiBzZXRWYWx1ZShjdHhTdGFjaywga2V5LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH07XG4gICAgbWtDb250ZXh0ID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgIGlmIChpc0FycmF5KHRlbXBsYXRlKSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgfTtcbiAgICBjb21waWxlID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgdmFyIHBvcENvbnRleHQsIHB1c2hDb250ZXh0O1xuICAgICAgaWYgKGlzT2JzZXJ2YWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgc3RyZWFtcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGZ1bmNzLnB1c2goYXBwbHlTdHJlYW1WYWx1ZShrZXksIHN0cmVhbXMubGVuZ3RoIC0gMSkpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKSAmJiB0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIiAmJiAhKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSAmJiAhKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgcHVzaENvbnRleHQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY3R4U3RhY2spIHtcbiAgICAgICAgICAgIHZhciBuZXdDb250ZXh0O1xuICAgICAgICAgICAgbmV3Q29udGV4dCA9IG1rQ29udGV4dCh2YWx1ZSk7XG4gICAgICAgICAgICBzZXRWYWx1ZShjdHhTdGFjaywga2V5LCBuZXdDb250ZXh0KTtcbiAgICAgICAgICAgIHJldHVybiBjdHhTdGFjay5wdXNoKG5ld0NvbnRleHQpO1xuICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHBvcENvbnRleHQgPSBmdW5jdGlvbihjdHhTdGFjaykge1xuICAgICAgICAgIHJldHVybiBjdHhTdGFjay5wb3AoKTtcbiAgICAgICAgfTtcbiAgICAgICAgZnVuY3MucHVzaChwdXNoQ29udGV4dChrZXkpKTtcbiAgICAgICAgY29tcGlsZVRlbXBsYXRlKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGZ1bmNzLnB1c2gocG9wQ29udGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVuY3MucHVzaChjb25zdGFudFZhbHVlKGtleSwgdmFsdWUpKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbXBpbGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICByZXR1cm4gXy5lYWNoKHRlbXBsYXRlLCBjb21waWxlKTtcbiAgICB9O1xuICAgIGNvbXBpbGVUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgY29tYmluYXRvciA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgICAgdmFyIGN0eFN0YWNrLCBmLCByb290Q29udGV4dCwgX2ksIF9sZW47XG4gICAgICByb290Q29udGV4dCA9IG1rQ29udGV4dCh0ZW1wbGF0ZSk7XG4gICAgICBjdHhTdGFjayA9IFtyb290Q29udGV4dF07XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGZ1bmNzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGYgPSBmdW5jc1tfaV07XG4gICAgICAgIGYoY3R4U3RhY2ssIHZhbHVlcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcm9vdENvbnRleHQ7XG4gICAgfTtcbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKEJhY29uLCBcImNvbWJpbmVUZW1wbGF0ZVwiLCB0ZW1wbGF0ZSwgQmFjb24uY29tYmluZUFzQXJyYXkoc3RyZWFtcykubWFwKGNvbWJpbmF0b3IpKTtcbiAgfTtcblxuICBCYWNvbi5yZXRyeSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgZGVsYXksIGlzUmV0cnlhYmxlLCBtYXhSZXRyaWVzLCByZXRyaWVzLCByZXRyeSwgc291cmNlO1xuICAgIGlmICghaXNGdW5jdGlvbihvcHRpb25zLnNvdXJjZSkpIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCInc291cmNlJyBvcHRpb24gaGFzIHRvIGJlIGEgZnVuY3Rpb25cIik7XG4gICAgfVxuICAgIHNvdXJjZSA9IG9wdGlvbnMuc291cmNlO1xuICAgIHJldHJpZXMgPSBvcHRpb25zLnJldHJpZXMgfHwgMDtcbiAgICBtYXhSZXRyaWVzID0gb3B0aW9ucy5tYXhSZXRyaWVzIHx8IHJldHJpZXM7XG4gICAgZGVsYXkgPSBvcHRpb25zLmRlbGF5IHx8IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfTtcbiAgICBpc1JldHJ5YWJsZSA9IG9wdGlvbnMuaXNSZXRyeWFibGUgfHwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHJldHJ5ID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGRlbGF5ZWRSZXRyeSwgbmV4dEF0dGVtcHRPcHRpb25zO1xuICAgICAgbmV4dEF0dGVtcHRPcHRpb25zID0ge1xuICAgICAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgcmV0cmllczogcmV0cmllcyAtIDEsXG4gICAgICAgIG1heFJldHJpZXM6IG1heFJldHJpZXMsXG4gICAgICAgIGRlbGF5OiBkZWxheSxcbiAgICAgICAgaXNSZXRyeWFibGU6IGlzUmV0cnlhYmxlXG4gICAgICB9O1xuICAgICAgZGVsYXllZFJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBCYWNvbi5yZXRyeShuZXh0QXR0ZW1wdE9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBCYWNvbi5sYXRlcihkZWxheShjb250ZXh0KSkuZmlsdGVyKGZhbHNlKS5jb25jYXQoQmFjb24ub25jZSgpLmZsYXRNYXAoZGVsYXllZFJldHJ5KSk7XG4gICAgfTtcbiAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKEJhY29uLCBcInJldHJ5XCIsIG9wdGlvbnMsIHNvdXJjZSgpLmZsYXRNYXBFcnJvcihmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaXNSZXRyeWFibGUoZSkgJiYgcmV0cmllcyA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJldHJ5KHtcbiAgICAgICAgICBlcnJvcjogZSxcbiAgICAgICAgICByZXRyaWVzRG9uZTogbWF4UmV0cmllcyAtIHJldHJpZXNcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmFjb24ub25jZShuZXcgRXJyb3IoZSkpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfTtcblxuICBldmVudElkQ291bnRlciA9IDA7XG5cbiAgRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRXZlbnQoKSB7XG4gICAgICB0aGlzLmlkID0gKytldmVudElkQ291bnRlcjtcbiAgICB9XG5cbiAgICBFdmVudC5wcm90b3R5cGUuaXNFdmVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIEV2ZW50LnByb3RvdHlwZS5pc0VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBFdmVudC5wcm90b3R5cGUuaXNJbml0aWFsID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIEV2ZW50LnByb3RvdHlwZS5pc05leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgRXZlbnQucHJvdG90eXBlLmlzRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgRXZlbnQucHJvdG90eXBlLmhhc1ZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIEV2ZW50LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBFdmVudC5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgRXZlbnQucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEV2ZW50O1xuXG4gIH0pKCk7XG5cbiAgTmV4dCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTmV4dCwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIE5leHQodmFsdWVGLCBlYWdlcikge1xuICAgICAgTmV4dC5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzKTtcbiAgICAgIGlmICghZWFnZXIgJiYgaXNGdW5jdGlvbih2YWx1ZUYpIHx8IHZhbHVlRiBpbnN0YW5jZW9mIE5leHQpIHtcbiAgICAgICAgdGhpcy52YWx1ZUYgPSB2YWx1ZUY7XG4gICAgICAgIHRoaXMudmFsdWVJbnRlcm5hbCA9IHZvaWQgMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudmFsdWVGID0gdm9pZCAwO1xuICAgICAgICB0aGlzLnZhbHVlSW50ZXJuYWwgPSB2YWx1ZUY7XG4gICAgICB9XG4gICAgfVxuXG4gICAgTmV4dC5wcm90b3R5cGUuaXNOZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgTmV4dC5wcm90b3R5cGUuaGFzVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBOZXh0LnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMudmFsdWVGIGluc3RhbmNlb2YgTmV4dCkge1xuICAgICAgICB0aGlzLnZhbHVlSW50ZXJuYWwgPSB0aGlzLnZhbHVlRi52YWx1ZSgpO1xuICAgICAgICB0aGlzLnZhbHVlRiA9IHZvaWQgMDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy52YWx1ZUYpIHtcbiAgICAgICAgdGhpcy52YWx1ZUludGVybmFsID0gdGhpcy52YWx1ZUYoKTtcbiAgICAgICAgdGhpcy52YWx1ZUYgPSB2b2lkIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZUludGVybmFsO1xuICAgIH07XG5cbiAgICBOZXh0LnByb3RvdHlwZS5mbWFwID0gZnVuY3Rpb24oZikge1xuICAgICAgdmFyIGV2ZW50LCB2YWx1ZTtcbiAgICAgIGlmICh0aGlzLnZhbHVlSW50ZXJuYWwpIHtcbiAgICAgICAgdmFsdWUgPSB0aGlzLnZhbHVlSW50ZXJuYWw7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBldmVudCA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmKGV2ZW50LnZhbHVlKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgTmV4dC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIG5ldyBOZXh0KHZhbHVlKTtcbiAgICB9O1xuXG4gICAgTmV4dC5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIGYodGhpcy52YWx1ZSgpKTtcbiAgICB9O1xuXG4gICAgTmV4dC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBfLnRvU3RyaW5nKHRoaXMudmFsdWUoKSk7XG4gICAgfTtcblxuICAgIE5leHQucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIE5leHQ7XG5cbiAgfSkoRXZlbnQpO1xuXG4gIEluaXRpYWwgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEluaXRpYWwsIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBJbml0aWFsKCkge1xuICAgICAgcmV0dXJuIEluaXRpYWwuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgSW5pdGlhbC5wcm90b3R5cGUuaXNJbml0aWFsID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgSW5pdGlhbC5wcm90b3R5cGUuaXNOZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIEluaXRpYWwucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiBuZXcgSW5pdGlhbCh2YWx1ZSk7XG4gICAgfTtcblxuICAgIEluaXRpYWwucHJvdG90eXBlLnRvTmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBOZXh0KHRoaXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gSW5pdGlhbDtcblxuICB9KShOZXh0KTtcblxuICBFbmQgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEVuZCwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIEVuZCgpIHtcbiAgICAgIHJldHVybiBFbmQuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgRW5kLnByb3RvdHlwZS5pc0VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIEVuZC5wcm90b3R5cGUuZm1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIEVuZC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBFbmQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXCI8ZW5kPlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gRW5kO1xuXG4gIH0pKEV2ZW50KTtcblxuICBFcnJvciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRXJyb3IsIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBFcnJvcihlcnJvcikge1xuICAgICAgdGhpcy5lcnJvciA9IGVycm9yO1xuICAgIH1cblxuICAgIEVycm9yLnByb3RvdHlwZS5pc0Vycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgRXJyb3IucHJvdG90eXBlLmZtYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBFcnJvci5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBcIjxlcnJvcj4gXCIgKyBfLnRvU3RyaW5nKHRoaXMuZXJyb3IpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRXJyb3I7XG5cbiAgfSkoRXZlbnQpO1xuXG4gIGlkQ291bnRlciA9IDA7XG5cbiAgT2JzZXJ2YWJsZSA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBPYnNlcnZhYmxlKGRlc2MpIHtcbiAgICAgIHRoaXMuaWQgPSArK2lkQ291bnRlcjtcbiAgICAgIHdpdGhEZXNjcmlwdGlvbihkZXNjLCB0aGlzKTtcbiAgICAgIHRoaXMuaW5pdGlhbERlc2MgPSB0aGlzLmRlc2M7XG4gICAgfVxuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oc2luaykge1xuICAgICAgcmV0dXJuIFVwZGF0ZUJhcnJpZXIud3JhcHBlZFN1YnNjcmliZSh0aGlzLCBzaW5rKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuc3Vic2NyaWJlSW50ZXJuYWwgPSBmdW5jdGlvbihzaW5rKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNwYXRjaGVyLnN1YnNjcmliZShzaW5rKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUub25WYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGY7XG4gICAgICBmID0gbWFrZUZ1bmN0aW9uQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5oYXNWYWx1ZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIGYoZXZlbnQudmFsdWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5vblZhbHVlcyA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHJldHVybiB0aGlzLm9uVmFsdWUoZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZjtcbiAgICAgIGYgPSBtYWtlRnVuY3Rpb25BcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmlzRXJyb3IoKSkge1xuICAgICAgICAgIHJldHVybiBmKGV2ZW50LmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm9uRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZjtcbiAgICAgIGYgPSBtYWtlRnVuY3Rpb25BcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICByZXR1cm4gZigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZXJyb3JzXCIsIHRoaXMuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MsIGY7XG4gICAgICBmID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICAgIHJldHVybiBjb252ZXJ0QXJnc1RvRnVuY3Rpb24odGhpcywgZiwgYXJncywgZnVuY3Rpb24oZikge1xuICAgICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZmlsdGVyXCIsIGYsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBpZiAoZXZlbnQuZmlsdGVyKGYpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUudGFrZVdoaWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZjtcbiAgICAgIGYgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRBcmdzVG9GdW5jdGlvbih0aGlzLCBmLCBhcmdzLCBmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJ0YWtlV2hpbGVcIiwgZiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmIChldmVudC5maWx0ZXIoZikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1c2goZW5kKCkpO1xuICAgICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5lbmRPbkVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZjtcbiAgICAgIGYgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgaWYgKGYgPT0gbnVsbCkge1xuICAgICAgICBmID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb252ZXJ0QXJnc1RvRnVuY3Rpb24odGhpcywgZiwgYXJncywgZnVuY3Rpb24oZikge1xuICAgICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZW5kT25FcnJvclwiLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGV2ZW50LmlzRXJyb3IoKSAmJiBmKGV2ZW50LmVycm9yKSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZW5kKCkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS50YWtlID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgIGlmIChjb3VudCA8PSAwKSB7XG4gICAgICAgIHJldHVybiBCYWNvbi5uZXZlcigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInRha2VcIiwgY291bnQsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCFldmVudC5oYXNWYWx1ZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY291bnQtLTtcbiAgICAgICAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnB1c2goZW5kKCkpO1xuICAgICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgcDtcbiAgICAgIHAgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgaWYgKHAgaW5zdGFuY2VvZiBQcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm4gcC5zYW1wbGVkQnkodGhpcywgZm9ybWVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0QXJnc1RvRnVuY3Rpb24odGhpcywgcCwgYXJncywgZnVuY3Rpb24oZikge1xuICAgICAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJtYXBcIiwgZiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudC5mbWFwKGYpKTtcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5tYXBFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGY7XG4gICAgICBmID0gbWFrZUZ1bmN0aW9uQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcIm1hcEVycm9yXCIsIGYsIHRoaXMud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmlzRXJyb3IoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnB1c2gobmV4dChmKGV2ZW50LmVycm9yKSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm1hcEVuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGY7XG4gICAgICBmID0gbWFrZUZ1bmN0aW9uQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcIm1hcEVuZFwiLCBmLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgdGhpcy5wdXNoKG5leHQoZihldmVudCkpKTtcbiAgICAgICAgICB0aGlzLnB1c2goZW5kKCkpO1xuICAgICAgICAgIHJldHVybiBCYWNvbi5ub01vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZG9BY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmO1xuICAgICAgZiA9IG1ha2VGdW5jdGlvbkFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJkb0FjdGlvblwiLCBmLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5oYXNWYWx1ZSgpKSB7XG4gICAgICAgICAgZihldmVudC52YWx1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuc2tpcCA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2tpcFwiLCBjb3VudCwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIWV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfSBlbHNlIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICBjb3VudC0tO1xuICAgICAgICAgIHJldHVybiBCYWNvbi5tb3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLnNraXBEdXBsaWNhdGVzID0gZnVuY3Rpb24oaXNFcXVhbCkge1xuICAgICAgaWYgKGlzRXF1YWwgPT0gbnVsbCkge1xuICAgICAgICBpc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInNraXBEdXBsaWNhdGVzXCIsIHRoaXMud2l0aFN0YXRlTWFjaGluZShOb25lLCBmdW5jdGlvbihwcmV2LCBldmVudCkge1xuICAgICAgICBpZiAoIWV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICByZXR1cm4gW3ByZXYsIFtldmVudF1dO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmlzSW5pdGlhbCgpIHx8IHByZXYgPT09IE5vbmUgfHwgIWlzRXF1YWwocHJldi5nZXQoKSwgZXZlbnQudmFsdWUoKSkpIHtcbiAgICAgICAgICByZXR1cm4gW25ldyBTb21lKGV2ZW50LnZhbHVlKCkpLCBbZXZlbnRdXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gW3ByZXYsIFtdXTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5za2lwRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2tpcEVycm9yc1wiLCB0aGlzLndpdGhIYW5kbGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5pc0Vycm9yKCkpIHtcbiAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS53aXRoU3RhdGVNYWNoaW5lID0gZnVuY3Rpb24oaW5pdFN0YXRlLCBmKSB7XG4gICAgICB2YXIgc3RhdGU7XG4gICAgICBzdGF0ZSA9IGluaXRTdGF0ZTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJ3aXRoU3RhdGVNYWNoaW5lXCIsIGluaXRTdGF0ZSwgZiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZnJvbUYsIG5ld1N0YXRlLCBvdXRwdXQsIG91dHB1dHMsIHJlcGx5LCBfaSwgX2xlbjtcbiAgICAgICAgZnJvbUYgPSBmKHN0YXRlLCBldmVudCk7XG4gICAgICAgIG5ld1N0YXRlID0gZnJvbUZbMF0sIG91dHB1dHMgPSBmcm9tRlsxXTtcbiAgICAgICAgc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICAgICAgcmVwbHkgPSBCYWNvbi5tb3JlO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG91dHB1dHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBvdXRwdXQgPSBvdXRwdXRzW19pXTtcbiAgICAgICAgICByZXBseSA9IHRoaXMucHVzaChvdXRwdXQpO1xuICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwbHk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXBseTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuc2NhbiA9IGZ1bmN0aW9uKHNlZWQsIGYpIHtcbiAgICAgIHZhciBhY2MsIHJlc3VsdFByb3BlcnR5LCBzdWJzY3JpYmU7XG4gICAgICBmID0gdG9Db21iaW5hdG9yKGYpO1xuICAgICAgYWNjID0gdG9PcHRpb24oc2VlZCk7XG4gICAgICBzdWJzY3JpYmUgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgICAgICB2YXIgaW5pdFNlbnQsIHJlcGx5LCBzZW5kSW5pdCwgdW5zdWI7XG4gICAgICAgICAgaW5pdFNlbnQgPSBmYWxzZTtcbiAgICAgICAgICB1bnN1YiA9IG5vcDtcbiAgICAgICAgICByZXBseSA9IEJhY29uLm1vcmU7XG4gICAgICAgICAgc2VuZEluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghaW5pdFNlbnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGFjYy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaW5pdFNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlcGx5ID0gc2luayhuZXcgSW5pdGlhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGx5ID09PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgICAgIHVuc3ViKCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdW5zdWIgPSBub3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHVuc3ViID0gX3RoaXMuZGlzcGF0Y2hlci5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBuZXh0LCBwcmV2O1xuICAgICAgICAgICAgaWYgKGV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICAgICAgaWYgKGluaXRTZW50ICYmIGV2ZW50LmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFldmVudC5pc0luaXRpYWwoKSkge1xuICAgICAgICAgICAgICAgICAgc2VuZEluaXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5pdFNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByZXYgPSBhY2MuZ2V0T3JFbHNlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgbmV4dCA9IGYocHJldiwgZXZlbnQudmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgYWNjID0gbmV3IFNvbWUobmV4dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbmsoZXZlbnQuYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICAgICAgcmVwbHkgPSBzZW5kSW5pdCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChyZXBseSAhPT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbmsoZXZlbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgVXBkYXRlQmFycmllci53aGVuRG9uZVdpdGgocmVzdWx0UHJvcGVydHksIHNlbmRJbml0KTtcbiAgICAgICAgICByZXR1cm4gdW5zdWI7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICAgIHJldHVybiByZXN1bHRQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eShkZXNjcmliZSh0aGlzLCBcInNjYW5cIiwgc2VlZCwgZiksIHN1YnNjcmliZSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmZvbGQgPSBmdW5jdGlvbihzZWVkLCBmKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZm9sZFwiLCBzZWVkLCBmLCB0aGlzLnNjYW4oc2VlZCwgZikuc2FtcGxlZEJ5KHRoaXMuZmlsdGVyKGZhbHNlKS5tYXBFbmQoKS50b1Byb3BlcnR5KCkpKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuemlwID0gZnVuY3Rpb24ob3RoZXIsIGYpIHtcbiAgICAgIGlmIChmID09IG51bGwpIHtcbiAgICAgICAgZiA9IEFycmF5O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInppcFwiLCBvdGhlciwgQmFjb24uemlwV2l0aChbdGhpcywgb3RoZXJdLCBmKSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmRpZmYgPSBmdW5jdGlvbihzdGFydCwgZikge1xuICAgICAgZiA9IHRvQ29tYmluYXRvcihmKTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJkaWZmXCIsIHN0YXJ0LCBmLCB0aGlzLnNjYW4oW3N0YXJ0XSwgZnVuY3Rpb24ocHJldlR1cGxlLCBuZXh0KSB7XG4gICAgICAgIHJldHVybiBbbmV4dCwgZihwcmV2VHVwbGVbMF0sIG5leHQpXTtcbiAgICAgIH0pLmZpbHRlcihmdW5jdGlvbih0dXBsZSkge1xuICAgICAgICByZXR1cm4gdHVwbGUubGVuZ3RoID09PSAyO1xuICAgICAgfSkubWFwKGZ1bmN0aW9uKHR1cGxlKSB7XG4gICAgICAgIHJldHVybiB0dXBsZVsxXTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZmxhdE1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZsYXRNYXBfKHRoaXMsIG1ha2VTcGF3bmVyKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5mbGF0TWFwRmlyc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmbGF0TWFwXyh0aGlzLCBtYWtlU3Bhd25lcihhcmd1bWVudHMpLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZmxhdE1hcFdpdGhDb25jdXJyZW5jeUxpbWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgbGltaXQ7XG4gICAgICBsaW1pdCA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFt0aGlzLCBcImZsYXRNYXBXaXRoQ29uY3VycmVuY3lMaW1pdFwiLCBsaW1pdF0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmdzKSwgW2ZsYXRNYXBfKHRoaXMsIG1ha2VTcGF3bmVyKGFyZ3MpLCBmYWxzZSwgbGltaXQpXSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5mbGF0TWFwTGF0ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZiwgc3RyZWFtO1xuICAgICAgZiA9IG1ha2VTcGF3bmVyKGFyZ3VtZW50cyk7XG4gICAgICBzdHJlYW0gPSB0aGlzLnRvRXZlbnRTdHJlYW0oKTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJmbGF0TWFwTGF0ZXN0XCIsIGYsIHN0cmVhbS5mbGF0TWFwKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBtYWtlT2JzZXJ2YWJsZShmKHZhbHVlKSkudGFrZVVudGlsKHN0cmVhbSk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmZsYXRNYXBFcnJvciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZmxhdE1hcEVycm9yXCIsIGZuLCB0aGlzLm1hcEVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGVycik7XG4gICAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgIHJldHVybiBmbih4LmVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQmFjb24ub25jZSh4KTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5mbGF0TWFwQ29uY2F0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uLmFwcGx5KG51bGwsIFt0aGlzLCBcImZsYXRNYXBDb25jYXRcIl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpLCBbdGhpcy5mbGF0TWFwV2l0aENvbmN1cnJlbmN5TGltaXQuYXBwbHkodGhpcywgWzFdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJndW1lbnRzKSkpXSkpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS5idWZmZXJpbmdUaHJvdHRsZSA9IGZ1bmN0aW9uKG1pbmltdW1JbnRlcnZhbCkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImJ1ZmZlcmluZ1Rocm90dGxlXCIsIG1pbmltdW1JbnRlcnZhbCwgdGhpcy5mbGF0TWFwQ29uY2F0KGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLm9uY2UoeCkuY29uY2F0KEJhY29uLmxhdGVyKG1pbmltdW1JbnRlcnZhbCkuZmlsdGVyKGZhbHNlKSk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm5vdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcIm5vdFwiLCB0aGlzLm1hcChmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAheDtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncztcbiAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgdGhpcy5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwgPyB0eXBlb2YgY29uc29sZS5sb2cgPT09IFwiZnVuY3Rpb25cIiA/IGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIF9fc2xpY2UuY2FsbChhcmdzKS5jb25jYXQoW2V2ZW50LmxvZygpXSkpIDogdm9pZCAwIDogdm9pZCAwO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuc2xpZGluZ1dpbmRvdyA9IGZ1bmN0aW9uKG4sIG1pblZhbHVlcykge1xuICAgICAgaWYgKG1pblZhbHVlcyA9PSBudWxsKSB7XG4gICAgICAgIG1pblZhbHVlcyA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2xpZGluZ1dpbmRvd1wiLCBuLCBtaW5WYWx1ZXMsIHRoaXMuc2NhbihbXSwgKGZ1bmN0aW9uKHdpbmRvdywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5jb25jYXQoW3ZhbHVlXSkuc2xpY2UoLW4pO1xuICAgICAgfSkpLmZpbHRlcigoZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID49IG1pblZhbHVlcztcbiAgICAgIH0pKSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmNvbWJpbmUgPSBmdW5jdGlvbihvdGhlciwgZikge1xuICAgICAgdmFyIGNvbWJpbmF0b3I7XG4gICAgICBjb21iaW5hdG9yID0gdG9Db21iaW5hdG9yKGYpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImNvbWJpbmVcIiwgb3RoZXIsIGYsIEJhY29uLmNvbWJpbmVBc0FycmF5KHRoaXMsIG90aGVyKS5tYXAoZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBjb21iaW5hdG9yKHZhbHVlc1swXSwgdmFsdWVzWzFdKTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuZGVjb2RlID0gZnVuY3Rpb24oY2FzZXMpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJkZWNvZGVcIiwgY2FzZXMsIHRoaXMuY29tYmluZShCYWNvbi5jb21iaW5lVGVtcGxhdGUoY2FzZXMpLCBmdW5jdGlvbihrZXksIHZhbHVlcykge1xuICAgICAgICByZXR1cm4gdmFsdWVzW2tleV07XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmF3YWl0aW5nID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJhd2FpdGluZ1wiLCBvdGhlciwgQmFjb24uZ3JvdXBTaW11bHRhbmVvdXModGhpcywgb3RoZXIpLm1hcChmdW5jdGlvbihfYXJnKSB7XG4gICAgICAgIHZhciBteVZhbHVlcywgb3RoZXJWYWx1ZXM7XG4gICAgICAgIG15VmFsdWVzID0gX2FyZ1swXSwgb3RoZXJWYWx1ZXMgPSBfYXJnWzFdO1xuICAgICAgICByZXR1cm4gb3RoZXJWYWx1ZXMubGVuZ3RoID09PSAwO1xuICAgICAgfSkudG9Qcm9wZXJ0eShmYWxzZSkuc2tpcER1cGxpY2F0ZXMoKSk7XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLm5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS53aXRoRGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZXNjcmliZS5hcHBseShudWxsLCBhcmd1bWVudHMpLmFwcGx5KHRoaXMpO1xuICAgIH07XG5cbiAgICBPYnNlcnZhYmxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX25hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNjLnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9ic2VydmFibGUucHJvdG90eXBlLmludGVybmFsRGVwcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbERlc2MuZGVwcygpO1xuICAgIH07XG5cbiAgICByZXR1cm4gT2JzZXJ2YWJsZTtcblxuICB9KSgpO1xuXG4gIE9ic2VydmFibGUucHJvdG90eXBlLnJlZHVjZSA9IE9ic2VydmFibGUucHJvdG90eXBlLmZvbGQ7XG5cbiAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuYXNzaWduID0gT2JzZXJ2YWJsZS5wcm90b3R5cGUub25WYWx1ZTtcblxuICBPYnNlcnZhYmxlLnByb3RvdHlwZS5pbnNwZWN0ID0gT2JzZXJ2YWJsZS5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgZmxhdE1hcF8gPSBmdW5jdGlvbihyb290LCBmLCBmaXJzdE9ubHksIGxpbWl0KSB7XG4gICAgdmFyIGNoaWxkRGVwcywgcmVzdWx0LCByb290RGVwO1xuICAgIHJvb3REZXAgPSBbcm9vdF07XG4gICAgY2hpbGREZXBzID0gW107XG4gICAgcmVzdWx0ID0gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKHJvb3QsIFwiZmxhdE1hcFwiICsgKGZpcnN0T25seSA/IFwiRmlyc3RcIiA6IFwiXCIpLCBmKSwgZnVuY3Rpb24oc2luaykge1xuICAgICAgdmFyIGNoZWNrRW5kLCBjaGVja1F1ZXVlLCBjb21wb3NpdGUsIHF1ZXVlLCBzcGF3bjtcbiAgICAgIGNvbXBvc2l0ZSA9IG5ldyBDb21wb3NpdGVVbnN1YnNjcmliZSgpO1xuICAgICAgcXVldWUgPSBbXTtcbiAgICAgIHNwYXduID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGNoaWxkO1xuICAgICAgICBjaGlsZCA9IG1ha2VPYnNlcnZhYmxlKGYoZXZlbnQudmFsdWUoKSkpO1xuICAgICAgICBjaGlsZERlcHMucHVzaChjaGlsZCk7XG4gICAgICAgIHJldHVybiBjb21wb3NpdGUuYWRkKGZ1bmN0aW9uKHVuc3ViQWxsLCB1bnN1Yk1lKSB7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkLmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgcmVwbHk7XG4gICAgICAgICAgICBpZiAoZXZlbnQuaXNFbmQoKSkge1xuICAgICAgICAgICAgICBfLnJlbW92ZShjaGlsZCwgY2hpbGREZXBzKTtcbiAgICAgICAgICAgICAgY2hlY2tRdWV1ZSgpO1xuICAgICAgICAgICAgICBjaGVja0VuZCh1bnN1Yk1lKTtcbiAgICAgICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChldmVudCBpbnN0YW5jZW9mIEluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICBldmVudCA9IGV2ZW50LnRvTmV4dCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlcGx5ID0gc2luayhldmVudCk7XG4gICAgICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgICAgdW5zdWJBbGwoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVwbHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIGNoZWNrUXVldWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV2ZW50O1xuICAgICAgICBldmVudCA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgIHJldHVybiBzcGF3bihldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjaGVja0VuZCA9IGZ1bmN0aW9uKHVuc3ViKSB7XG4gICAgICAgIHVuc3ViKCk7XG4gICAgICAgIGlmIChjb21wb3NpdGUuZW1wdHkoKSkge1xuICAgICAgICAgIHJldHVybiBzaW5rKGVuZCgpKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbXBvc2l0ZS5hZGQoZnVuY3Rpb24oX18sIHVuc3ViUm9vdCkge1xuICAgICAgICByZXR1cm4gcm9vdC5kaXNwYXRjaGVyLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hlY2tFbmQodW5zdWJSb290KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmlzRXJyb3IoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNpbmsoZXZlbnQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RPbmx5ICYmIGNvbXBvc2l0ZS5jb3VudCgpID4gMSkge1xuICAgICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjb21wb3NpdGUudW5zdWJzY3JpYmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBCYWNvbi5ub01vcmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGltaXQgJiYgY29tcG9zaXRlLmNvdW50KCkgPiBsaW1pdCkge1xuICAgICAgICAgICAgICByZXR1cm4gcXVldWUucHVzaChldmVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gc3Bhd24oZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb21wb3NpdGUudW5zdWJzY3JpYmU7XG4gICAgfSk7XG4gICAgcmVzdWx0LmludGVybmFsRGVwcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGNoaWxkRGVwcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHJvb3REZXAuY29uY2F0KGNoaWxkRGVwcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcm9vdERlcDtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgRXZlbnRTdHJlYW0gPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEV2ZW50U3RyZWFtLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gRXZlbnRTdHJlYW0oZGVzYywgc3Vic2NyaWJlLCBoYW5kbGVyKSB7XG4gICAgICBpZiAoaXNGdW5jdGlvbihkZXNjKSkge1xuICAgICAgICBoYW5kbGVyID0gc3Vic2NyaWJlO1xuICAgICAgICBzdWJzY3JpYmUgPSBkZXNjO1xuICAgICAgICBkZXNjID0gW107XG4gICAgICB9XG4gICAgICBFdmVudFN0cmVhbS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCBkZXNjKTtcbiAgICAgIGFzc2VydEZ1bmN0aW9uKHN1YnNjcmliZSk7XG4gICAgICB0aGlzLmRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcihzdWJzY3JpYmUsIGhhbmRsZXIpO1xuICAgICAgcmVnaXN0ZXJPYnModGhpcyk7XG4gICAgfVxuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJkZWxheVwiLCBkZWxheSwgdGhpcy5mbGF0TWFwKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBCYWNvbi5sYXRlcihkZWxheSwgdmFsdWUpO1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuZGVib3VuY2UgPSBmdW5jdGlvbihkZWxheSkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImRlYm91bmNlXCIsIGRlbGF5LCB0aGlzLmZsYXRNYXBMYXRlc3QoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIEJhY29uLmxhdGVyKGRlbGF5LCB2YWx1ZSk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5kZWJvdW5jZUltbWVkaWF0ZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiZGVib3VuY2VJbW1lZGlhdGVcIiwgZGVsYXksIHRoaXMuZmxhdE1hcEZpcnN0KGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBCYWNvbi5vbmNlKHZhbHVlKS5jb25jYXQoQmFjb24ubGF0ZXIoZGVsYXkpLmZpbHRlcihmYWxzZSkpO1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUudGhyb3R0bGUgPSBmdW5jdGlvbihkZWxheSkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInRocm90dGxlXCIsIGRlbGF5LCB0aGlzLmJ1ZmZlcldpdGhUaW1lKGRlbGF5KS5tYXAoZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXNbdmFsdWVzLmxlbmd0aCAtIDFdO1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuYnVmZmVyV2l0aFRpbWUgPSBmdW5jdGlvbihkZWxheSkge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcImJ1ZmZlcldpdGhUaW1lXCIsIGRlbGF5LCB0aGlzLmJ1ZmZlcldpdGhUaW1lT3JDb3VudChkZWxheSwgTnVtYmVyLk1BWF9WQUxVRSkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuYnVmZmVyV2l0aENvdW50ID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJidWZmZXJXaXRoQ291bnRcIiwgY291bnQsIHRoaXMuYnVmZmVyV2l0aFRpbWVPckNvdW50KHZvaWQgMCwgY291bnQpKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmJ1ZmZlcldpdGhUaW1lT3JDb3VudCA9IGZ1bmN0aW9uKGRlbGF5LCBjb3VudCkge1xuICAgICAgdmFyIGZsdXNoT3JTY2hlZHVsZTtcbiAgICAgIGZsdXNoT3JTY2hlZHVsZSA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICBpZiAoYnVmZmVyLnZhbHVlcy5sZW5ndGggPT09IGNvdW50KSB7XG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlci5mbHVzaCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGRlbGF5ICE9PSB2b2lkIDApIHtcbiAgICAgICAgICByZXR1cm4gYnVmZmVyLnNjaGVkdWxlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwiYnVmZmVyV2l0aFRpbWVPckNvdW50XCIsIGRlbGF5LCBjb3VudCwgdGhpcy5idWZmZXIoZGVsYXksIGZsdXNoT3JTY2hlZHVsZSwgZmx1c2hPclNjaGVkdWxlKSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5idWZmZXIgPSBmdW5jdGlvbihkZWxheSwgb25JbnB1dCwgb25GbHVzaCkge1xuICAgICAgdmFyIGJ1ZmZlciwgZGVsYXlNcywgcmVwbHk7XG4gICAgICBpZiAob25JbnB1dCA9PSBudWxsKSB7XG4gICAgICAgIG9uSW5wdXQgPSBub3A7XG4gICAgICB9XG4gICAgICBpZiAob25GbHVzaCA9PSBudWxsKSB7XG4gICAgICAgIG9uRmx1c2ggPSBub3A7XG4gICAgICB9XG4gICAgICBidWZmZXIgPSB7XG4gICAgICAgIHNjaGVkdWxlZDogZmFsc2UsXG4gICAgICAgIGVuZDogdm9pZCAwLFxuICAgICAgICB2YWx1ZXM6IFtdLFxuICAgICAgICBmbHVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlcGx5O1xuICAgICAgICAgIHRoaXMuc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHRoaXMudmFsdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlcGx5ID0gdGhpcy5wdXNoKG5leHQodGhpcy52YWx1ZXMpKTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5lbmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKHRoaXMuZW5kKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVwbHkgIT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICByZXR1cm4gb25GbHVzaCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW5kICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaCh0aGlzLmVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzY2hlZHVsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLnNjaGVkdWxlZCkge1xuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIGRlbGF5KChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmZsdXNoKCk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSh0aGlzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmVwbHkgPSBCYWNvbi5tb3JlO1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uKGRlbGF5KSkge1xuICAgICAgICBkZWxheU1zID0gZGVsYXk7XG4gICAgICAgIGRlbGF5ID0gZnVuY3Rpb24oZikge1xuICAgICAgICAgIHJldHVybiBCYWNvbi5zY2hlZHVsZXIuc2V0VGltZW91dChmLCBkZWxheU1zKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJidWZmZXJcIiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICBidWZmZXIucHVzaCA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpO1xuICAgICAgICBpZiAoZXZlbnQuaXNFcnJvcigpKSB7XG4gICAgICAgICAgcmVwbHkgPSB0aGlzLnB1c2goZXZlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgICBidWZmZXIuZW5kID0gZXZlbnQ7XG4gICAgICAgICAgaWYgKCFidWZmZXIuc2NoZWR1bGVkKSB7XG4gICAgICAgICAgICBidWZmZXIuZmx1c2goKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmZmVyLnZhbHVlcy5wdXNoKGV2ZW50LnZhbHVlKCkpO1xuICAgICAgICAgIG9uSW5wdXQoYnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVwbHk7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKHJpZ2h0KSB7XG4gICAgICB2YXIgbGVmdDtcbiAgICAgIGFzc2VydEV2ZW50U3RyZWFtKHJpZ2h0KTtcbiAgICAgIGxlZnQgPSB0aGlzO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbihsZWZ0LCBcIm1lcmdlXCIsIHJpZ2h0LCBCYWNvbi5tZXJnZUFsbCh0aGlzLCByaWdodCkpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUudG9Qcm9wZXJ0eSA9IGZ1bmN0aW9uKGluaXRWYWx1ZV8pIHtcbiAgICAgIHZhciBkaXNwLCBpbml0VmFsdWU7XG4gICAgICBpbml0VmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID09PSAwID8gTm9uZSA6IHRvT3B0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaW5pdFZhbHVlXztcbiAgICAgIH0pO1xuICAgICAgZGlzcCA9IHRoaXMuZGlzcGF0Y2hlcjtcbiAgICAgIHJldHVybiBuZXcgUHJvcGVydHkoZGVzY3JpYmUodGhpcywgXCJ0b1Byb3BlcnR5XCIsIGluaXRWYWx1ZV8pLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICAgIHZhciBpbml0U2VudCwgcmVwbHksIHNlbmRJbml0LCB1bnN1YjtcbiAgICAgICAgaW5pdFNlbnQgPSBmYWxzZTtcbiAgICAgICAgdW5zdWIgPSBub3A7XG4gICAgICAgIHJlcGx5ID0gQmFjb24ubW9yZTtcbiAgICAgICAgc2VuZEluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoIWluaXRTZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gaW5pdFZhbHVlLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgaW5pdFNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXBseSA9IHNpbmsobmV3IEluaXRpYWwodmFsdWUpKTtcbiAgICAgICAgICAgICAgaWYgKHJlcGx5ID09PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgICB1bnN1YigpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1bnN1YiA9IG5vcDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB1bnN1YiA9IGRpc3Auc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICAgIGlmIChpbml0U2VudCAmJiBldmVudC5pc0luaXRpYWwoKSkge1xuICAgICAgICAgICAgICByZXR1cm4gQmFjb24ubW9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmICghZXZlbnQuaXNJbml0aWFsKCkpIHtcbiAgICAgICAgICAgICAgICBzZW5kSW5pdCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGluaXRTZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgaW5pdFZhbHVlID0gbmV3IFNvbWUoZXZlbnQpO1xuICAgICAgICAgICAgICByZXR1cm4gc2luayhldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICAgIHJlcGx5ID0gc2VuZEluaXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXBseSAhPT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzaW5rKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZW5kSW5pdCgpO1xuICAgICAgICByZXR1cm4gdW5zdWI7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLnRvRXZlbnRTdHJlYW0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuc2FtcGxlZEJ5ID0gZnVuY3Rpb24oc2FtcGxlciwgY29tYmluYXRvcikge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInNhbXBsZWRCeVwiLCBzYW1wbGVyLCBjb21iaW5hdG9yLCB0aGlzLnRvUHJvcGVydHkoKS5zYW1wbGVkQnkoc2FtcGxlciwgY29tYmluYXRvcikpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24ocmlnaHQpIHtcbiAgICAgIHZhciBsZWZ0O1xuICAgICAgbGVmdCA9IHRoaXM7XG4gICAgICByZXR1cm4gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKGxlZnQsIFwiY29uY2F0XCIsIHJpZ2h0KSwgZnVuY3Rpb24oc2luaykge1xuICAgICAgICB2YXIgdW5zdWJMZWZ0LCB1bnN1YlJpZ2h0O1xuICAgICAgICB1bnN1YlJpZ2h0ID0gbm9wO1xuICAgICAgICB1bnN1YkxlZnQgPSBsZWZ0LmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoZS5pc0VuZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5zdWJSaWdodCA9IHJpZ2h0LmRpc3BhdGNoZXIuc3Vic2NyaWJlKHNpbmspO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc2luayhlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdW5zdWJMZWZ0KCk7XG4gICAgICAgICAgcmV0dXJuIHVuc3ViUmlnaHQoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUudGFrZVVudGlsID0gZnVuY3Rpb24oc3RvcHBlcikge1xuICAgICAgdmFyIGVuZE1hcmtlcjtcbiAgICAgIGVuZE1hcmtlciA9IHt9O1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInRha2VVbnRpbFwiLCBzdG9wcGVyLCBCYWNvbi5ncm91cFNpbXVsdGFuZW91cyh0aGlzLm1hcEVuZChlbmRNYXJrZXIpLCBzdG9wcGVyLnNraXBFcnJvcnMoKSkud2l0aEhhbmRsZXIoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGRhdGEsIHJlcGx5LCB2YWx1ZSwgX2ksIF9sZW4sIF9yZWYxO1xuICAgICAgICBpZiAoIWV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfcmVmMSA9IGV2ZW50LnZhbHVlKCksIGRhdGEgPSBfcmVmMVswXSwgc3RvcHBlciA9IF9yZWYxWzFdO1xuICAgICAgICAgIGlmIChzdG9wcGVyLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChlbmQoKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcGx5ID0gQmFjb24ubW9yZTtcbiAgICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gZGF0YS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgICAgICB2YWx1ZSA9IGRhdGFbX2ldO1xuICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGVuZE1hcmtlcikge1xuICAgICAgICAgICAgICAgIHJlcGx5ID0gdGhpcy5wdXNoKGVuZCgpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXBseSA9IHRoaXMucHVzaChuZXh0KHZhbHVlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXBseTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLnNraXBVbnRpbCA9IGZ1bmN0aW9uKHN0YXJ0ZXIpIHtcbiAgICAgIHZhciBzdGFydGVkO1xuICAgICAgc3RhcnRlZCA9IHN0YXJ0ZXIudGFrZSgxKS5tYXAodHJ1ZSkudG9Qcm9wZXJ0eShmYWxzZSk7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2tpcFVudGlsXCIsIHN0YXJ0ZXIsIHRoaXMuZmlsdGVyKHN0YXJ0ZWQpKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLnNraXBXaGlsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MsIGYsIG9rO1xuICAgICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBvayA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGNvbnZlcnRBcmdzVG9GdW5jdGlvbih0aGlzLCBmLCBhcmdzLCBmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJza2lwV2hpbGVcIiwgZiwgdGhpcy53aXRoSGFuZGxlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmIChvayB8fCAhZXZlbnQuaGFzVmFsdWUoKSB8fCAhZihldmVudC52YWx1ZSgpKSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgICAgICAgb2sgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBCYWNvbi5tb3JlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5ob2xkV2hlbiA9IGZ1bmN0aW9uKHZhbHZlKSB7XG4gICAgICB2YXIgcHV0VG9Ib2xkLCByZWxlYXNlSG9sZCwgdmFsdmVfO1xuICAgICAgdmFsdmVfID0gdmFsdmUuc3RhcnRXaXRoKGZhbHNlKTtcbiAgICAgIHJlbGVhc2VIb2xkID0gdmFsdmVfLmZpbHRlcihmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAheDtcbiAgICAgIH0pO1xuICAgICAgcHV0VG9Ib2xkID0gdmFsdmVfLmZpbHRlcihfLmlkKTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJob2xkV2hlblwiLCB2YWx2ZSwgdGhpcy5maWx0ZXIoZmFsc2UpLm1lcmdlKHZhbHZlXy5mbGF0TWFwQ29uY2F0KChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2hvdWxkSG9sZCkge1xuICAgICAgICAgIGlmICghc2hvdWxkSG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnRha2VVbnRpbChwdXRUb0hvbGQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuc2NhbihbXSwgKGZ1bmN0aW9uKHhzLCB4KSB7XG4gICAgICAgICAgICAgIHJldHVybiB4cy5jb25jYXQoeCk7XG4gICAgICAgICAgICB9KSkuc2FtcGxlZEJ5KHJlbGVhc2VIb2xkKS50YWtlKDEpLmZsYXRNYXAoQmFjb24uZnJvbUFycmF5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSkpKTtcbiAgICB9O1xuXG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLnN0YXJ0V2l0aCA9IGZ1bmN0aW9uKHNlZWQpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJzdGFydFdpdGhcIiwgc2VlZCwgQmFjb24ub25jZShzZWVkKS5jb25jYXQodGhpcykpO1xuICAgIH07XG5cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUud2l0aEhhbmRsZXIgPSBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKHRoaXMsIFwid2l0aEhhbmRsZXJcIiwgaGFuZGxlciksIHRoaXMuZGlzcGF0Y2hlci5zdWJzY3JpYmUsIGhhbmRsZXIpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRXZlbnRTdHJlYW07XG5cbiAgfSkoT2JzZXJ2YWJsZSk7XG5cbiAgUHJvcGVydHkgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFByb3BlcnR5LCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gUHJvcGVydHkoZGVzYywgc3Vic2NyaWJlLCBoYW5kbGVyKSB7XG4gICAgICBpZiAoaXNGdW5jdGlvbihkZXNjKSkge1xuICAgICAgICBoYW5kbGVyID0gc3Vic2NyaWJlO1xuICAgICAgICBzdWJzY3JpYmUgPSBkZXNjO1xuICAgICAgICBkZXNjID0gW107XG4gICAgICB9XG4gICAgICBQcm9wZXJ0eS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCBkZXNjKTtcbiAgICAgIGFzc2VydEZ1bmN0aW9uKHN1YnNjcmliZSk7XG4gICAgICB0aGlzLmRpc3BhdGNoZXIgPSBuZXcgUHJvcGVydHlEaXNwYXRjaGVyKHRoaXMsIHN1YnNjcmliZSwgaGFuZGxlcik7XG4gICAgICByZWdpc3Rlck9icyh0aGlzKTtcbiAgICB9XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuc2FtcGxlZEJ5ID0gZnVuY3Rpb24oc2FtcGxlciwgY29tYmluYXRvcikge1xuICAgICAgdmFyIGxhenksIHJlc3VsdCwgc2FtcGxlclNvdXJjZSwgc3RyZWFtLCB0aGlzU291cmNlO1xuICAgICAgaWYgKGNvbWJpbmF0b3IgIT0gbnVsbCkge1xuICAgICAgICBjb21iaW5hdG9yID0gdG9Db21iaW5hdG9yKGNvbWJpbmF0b3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGF6eSA9IHRydWU7XG4gICAgICAgIGNvbWJpbmF0b3IgPSBmdW5jdGlvbihmKSB7XG4gICAgICAgICAgcmV0dXJuIGYudmFsdWUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHRoaXNTb3VyY2UgPSBuZXcgU291cmNlKHRoaXMsIGZhbHNlLCBsYXp5KTtcbiAgICAgIHNhbXBsZXJTb3VyY2UgPSBuZXcgU291cmNlKHNhbXBsZXIsIHRydWUsIGxhenkpO1xuICAgICAgc3RyZWFtID0gQmFjb24ud2hlbihbdGhpc1NvdXJjZSwgc2FtcGxlclNvdXJjZV0sIGNvbWJpbmF0b3IpO1xuICAgICAgcmVzdWx0ID0gc2FtcGxlciBpbnN0YW5jZW9mIFByb3BlcnR5ID8gc3RyZWFtLnRvUHJvcGVydHkoKSA6IHN0cmVhbTtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJzYW1wbGVkQnlcIiwgc2FtcGxlciwgY29tYmluYXRvciwgcmVzdWx0KTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLnNhbXBsZSA9IGZ1bmN0aW9uKGludGVydmFsKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic2FtcGxlXCIsIGludGVydmFsLCB0aGlzLnNhbXBsZWRCeShCYWNvbi5pbnRlcnZhbChpbnRlcnZhbCwge30pKSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS5jaGFuZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEV2ZW50U3RyZWFtKGRlc2NyaWJlKHRoaXMsIFwiY2hhbmdlc1wiKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihzaW5rKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoIWV2ZW50LmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzaW5rKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLndpdGhIYW5kbGVyID0gZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgcmV0dXJuIG5ldyBQcm9wZXJ0eShkZXNjcmliZSh0aGlzLCBcIndpdGhIYW5kbGVyXCIsIGhhbmRsZXIpLCB0aGlzLmRpc3BhdGNoZXIuc3Vic2NyaWJlLCBoYW5kbGVyKTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLnRvUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIGFzc2VydE5vQXJndW1lbnRzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLnRvRXZlbnRTdHJlYW0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRXZlbnRTdHJlYW0oZGVzY3JpYmUodGhpcywgXCJ0b0V2ZW50U3RyZWFtXCIpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuZGlzcGF0Y2hlci5zdWJzY3JpYmUoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5pc0luaXRpYWwoKSkge1xuICAgICAgICAgICAgICBldmVudCA9IGV2ZW50LnRvTmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNpbmsoZXZlbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuYW5kID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24odGhpcywgXCJhbmRcIiwgb3RoZXIsIHRoaXMuY29tYmluZShvdGhlciwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geCAmJiB5O1xuICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUub3IgPSBmdW5jdGlvbihvdGhlcikge1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcIm9yXCIsIG90aGVyLCB0aGlzLmNvbWJpbmUob3RoZXIsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggfHwgeTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGF5Q2hhbmdlcyhcImRlbGF5XCIsIGRlbGF5LCBmdW5jdGlvbihjaGFuZ2VzKSB7XG4gICAgICAgIHJldHVybiBjaGFuZ2VzLmRlbGF5KGRlbGF5KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUuZGVib3VuY2UgPSBmdW5jdGlvbihkZWxheSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsYXlDaGFuZ2VzKFwiZGVib3VuY2VcIiwgZGVsYXksIGZ1bmN0aW9uKGNoYW5nZXMpIHtcbiAgICAgICAgcmV0dXJuIGNoYW5nZXMuZGVib3VuY2UoZGVsYXkpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS50aHJvdHRsZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxheUNoYW5nZXMoXCJ0aHJvdHRsZVwiLCBkZWxheSwgZnVuY3Rpb24oY2hhbmdlcykge1xuICAgICAgICByZXR1cm4gY2hhbmdlcy50aHJvdHRsZShkZWxheSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLmRlbGF5Q2hhbmdlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRlc2MsIGYsIF9pO1xuICAgICAgZGVzYyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIF9pID0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIDogKF9pID0gMCwgW10pLCBmID0gYXJndW1lbnRzW19pKytdO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbi5hcHBseShudWxsLCBbdGhpc10uY29uY2F0KF9fc2xpY2UuY2FsbChkZXNjKSwgW2FkZFByb3BlcnR5SW5pdFZhbHVlVG9TdHJlYW0odGhpcywgZih0aGlzLmNoYW5nZXMoKSkpXSkpO1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eS5wcm90b3R5cGUudGFrZVVudGlsID0gZnVuY3Rpb24oc3RvcHBlcikge1xuICAgICAgdmFyIGNoYW5nZXM7XG4gICAgICBjaGFuZ2VzID0gdGhpcy5jaGFuZ2VzKCkudGFrZVVudGlsKHN0b3BwZXIpO1xuICAgICAgcmV0dXJuIHdpdGhEZXNjcmlwdGlvbih0aGlzLCBcInRha2VVbnRpbFwiLCBzdG9wcGVyLCBhZGRQcm9wZXJ0eUluaXRWYWx1ZVRvU3RyZWFtKHRoaXMsIGNoYW5nZXMpKTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHkucHJvdG90eXBlLnN0YXJ0V2l0aCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gd2l0aERlc2NyaXB0aW9uKHRoaXMsIFwic3RhcnRXaXRoXCIsIHZhbHVlLCB0aGlzLnNjYW4odmFsdWUsIGZ1bmN0aW9uKHByZXYsIG5leHQpIHtcbiAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICB9KSk7XG4gICAgfTtcblxuICAgIFByb3BlcnR5LnByb3RvdHlwZS5idWZmZXJpbmdUaHJvdHRsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF9yZWYxO1xuICAgICAgcmV0dXJuIChfcmVmMSA9IFByb3BlcnR5Ll9fc3VwZXJfXy5idWZmZXJpbmdUaHJvdHRsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKS5idWZmZXJpbmdUaHJvdHRsZS5hcHBseShfcmVmMSwgYXJndW1lbnRzKS50b1Byb3BlcnR5KCk7XG4gICAgfTtcblxuICAgIHJldHVybiBQcm9wZXJ0eTtcblxuICB9KShPYnNlcnZhYmxlKTtcblxuICBjb252ZXJ0QXJnc1RvRnVuY3Rpb24gPSBmdW5jdGlvbihvYnMsIGYsIGFyZ3MsIG1ldGhvZCkge1xuICAgIHZhciBzYW1wbGVkO1xuICAgIGlmIChmIGluc3RhbmNlb2YgUHJvcGVydHkpIHtcbiAgICAgIHNhbXBsZWQgPSBmLnNhbXBsZWRCeShvYnMsIGZ1bmN0aW9uKHAsIHMpIHtcbiAgICAgICAgcmV0dXJuIFtwLCBzXTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKHNhbXBsZWQsIGZ1bmN0aW9uKF9hcmcpIHtcbiAgICAgICAgdmFyIHAsIHM7XG4gICAgICAgIHAgPSBfYXJnWzBdLCBzID0gX2FyZ1sxXTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9KS5tYXAoZnVuY3Rpb24oX2FyZykge1xuICAgICAgICB2YXIgcCwgcztcbiAgICAgICAgcCA9IF9hcmdbMF0sIHMgPSBfYXJnWzFdO1xuICAgICAgICByZXR1cm4gcztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmID0gbWFrZUZ1bmN0aW9uKGYsIGFyZ3MpO1xuICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKG9icywgZik7XG4gICAgfVxuICB9O1xuXG4gIGFkZFByb3BlcnR5SW5pdFZhbHVlVG9TdHJlYW0gPSBmdW5jdGlvbihwcm9wZXJ0eSwgc3RyZWFtKSB7XG4gICAgdmFyIGp1c3RJbml0VmFsdWU7XG4gICAganVzdEluaXRWYWx1ZSA9IG5ldyBFdmVudFN0cmVhbShkZXNjcmliZShwcm9wZXJ0eSwgXCJqdXN0SW5pdFZhbHVlXCIpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICB2YXIgdW5zdWIsIHZhbHVlO1xuICAgICAgdmFsdWUgPSB2b2lkIDA7XG4gICAgICB1bnN1YiA9IHByb3BlcnR5LmRpc3BhdGNoZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghZXZlbnQuaXNFbmQoKSkge1xuICAgICAgICAgIHZhbHVlID0gZXZlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgIH0pO1xuICAgICAgVXBkYXRlQmFycmllci53aGVuRG9uZVdpdGgoanVzdEluaXRWYWx1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgc2luayh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpbmsoZW5kKCkpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdW5zdWI7XG4gICAgfSk7XG4gICAgcmV0dXJuIGp1c3RJbml0VmFsdWUuY29uY2F0KHN0cmVhbSkudG9Qcm9wZXJ0eSgpO1xuICB9O1xuXG4gIERpc3BhdGNoZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRGlzcGF0Y2hlcihfc3Vic2NyaWJlLCBfaGFuZGxlRXZlbnQpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmliZSA9IF9zdWJzY3JpYmU7XG4gICAgICB0aGlzLl9oYW5kbGVFdmVudCA9IF9oYW5kbGVFdmVudDtcbiAgICAgIHRoaXMuc3Vic2NyaWJlID0gX19iaW5kKHRoaXMuc3Vic2NyaWJlLCB0aGlzKTtcbiAgICAgIHRoaXMuaGFuZGxlRXZlbnQgPSBfX2JpbmQodGhpcy5oYW5kbGVFdmVudCwgdGhpcyk7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgIHRoaXMucHVzaGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5lbmRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5wcmV2RXJyb3IgPSB2b2lkIDA7XG4gICAgICB0aGlzLnVuc3ViU3JjID0gdm9pZCAwO1xuICAgIH1cblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmhhc1N1YnNjcmliZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpcHRpb25zLmxlbmd0aCA+IDA7XG4gICAgfTtcblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZVN1YiA9IGZ1bmN0aW9uKHN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaXB0aW9ucyA9IF8ud2l0aG91dChzdWJzY3JpcHRpb24sIHRoaXMuc3Vic2NyaXB0aW9ucyk7XG4gICAgfTtcblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGV2ZW50LmlzRW5kKCkpIHtcbiAgICAgICAgdGhpcy5lbmRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gVXBkYXRlQmFycmllci5pblRyYW5zYWN0aW9uKGV2ZW50LCB0aGlzLCB0aGlzLnB1c2hJdCwgW2V2ZW50XSk7XG4gICAgfTtcblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnB1c2hUb1N1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIHJlcGx5LCBzdWIsIHRtcCwgX2ksIF9sZW47XG4gICAgICB0cnkge1xuICAgICAgICB0bXAgPSB0aGlzLnN1YnNjcmlwdGlvbnM7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gdG1wLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgc3ViID0gdG1wW19pXTtcbiAgICAgICAgICByZXBseSA9IHN1Yi5zaW5rKGV2ZW50KTtcbiAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSB8fCBldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZVN1YihzdWIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUucHVzaEl0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICghdGhpcy5wdXNoaW5nKSB7XG4gICAgICAgIGlmIChldmVudCA9PT0gdGhpcy5wcmV2RXJyb3IpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50LmlzRXJyb3IoKSkge1xuICAgICAgICAgIHRoaXMucHJldkVycm9yID0gZXZlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wdXNoVG9TdWJzY3JpcHRpb25zKGV2ZW50KTtcbiAgICAgICAgdGhpcy5wdXNoaW5nID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICh0aGlzLnF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgIGV2ZW50ID0gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgIHRoaXMucHVzaChldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaGFzU3Vic2NyaWJlcnMoKSkge1xuICAgICAgICAgIHJldHVybiBCYWNvbi5tb3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tU291cmNlKCk7XG4gICAgICAgICAgcmV0dXJuIEJhY29uLm5vTW9yZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICh0aGlzLl9oYW5kbGVFdmVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaChldmVudCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlRnJvbVNvdXJjZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMudW5zdWJTcmMpIHtcbiAgICAgICAgdGhpcy51bnN1YlNyYygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudW5zdWJTcmMgPSB2b2lkIDA7XG4gICAgfTtcblxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHZhciBzdWJzY3JpcHRpb247XG4gICAgICBpZiAodGhpcy5lbmRlZCkge1xuICAgICAgICBzaW5rKGVuZCgpKTtcbiAgICAgICAgcmV0dXJuIG5vcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzc2VydEZ1bmN0aW9uKHNpbmspO1xuICAgICAgICBzdWJzY3JpcHRpb24gPSB7XG4gICAgICAgICAgc2luazogc2lua1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuICAgICAgICBpZiAodGhpcy5zdWJzY3JpcHRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMudW5zdWJTcmMgPSB0aGlzLl9zdWJzY3JpYmUodGhpcy5oYW5kbGVFdmVudCk7XG4gICAgICAgICAgYXNzZXJ0RnVuY3Rpb24odGhpcy51bnN1YlNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLnJlbW92ZVN1YihzdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgaWYgKCFfdGhpcy5oYXNTdWJzY3JpYmVycygpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBfdGhpcy51bnN1YnNjcmliZUZyb21Tb3VyY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIERpc3BhdGNoZXI7XG5cbiAgfSkoKTtcblxuICBQcm9wZXJ0eURpc3BhdGNoZXIgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFByb3BlcnR5RGlzcGF0Y2hlciwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIFByb3BlcnR5RGlzcGF0Y2hlcihwcm9wZXJ0eSwgc3Vic2NyaWJlLCBoYW5kbGVFdmVudCkge1xuICAgICAgdGhpcy5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgICAgdGhpcy5zdWJzY3JpYmUgPSBfX2JpbmQodGhpcy5zdWJzY3JpYmUsIHRoaXMpO1xuICAgICAgUHJvcGVydHlEaXNwYXRjaGVyLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHN1YnNjcmliZSwgaGFuZGxlRXZlbnQpO1xuICAgICAgdGhpcy5jdXJyZW50ID0gTm9uZTtcbiAgICAgIHRoaXMuY3VycmVudFZhbHVlUm9vdElkID0gdm9pZCAwO1xuICAgICAgdGhpcy5wcm9wZXJ0eUVuZGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgUHJvcGVydHlEaXNwYXRjaGVyLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHlFbmRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoZXZlbnQuaGFzVmFsdWUoKSkge1xuICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXcgU29tZShldmVudCk7XG4gICAgICAgIHRoaXMuY3VycmVudFZhbHVlUm9vdElkID0gVXBkYXRlQmFycmllci5jdXJyZW50RXZlbnRJZCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFByb3BlcnR5RGlzcGF0Y2hlci5fX3N1cGVyX18ucHVzaC5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xuXG4gICAgUHJvcGVydHlEaXNwYXRjaGVyLnByb3RvdHlwZS5tYXliZVN1YlNvdXJjZSA9IGZ1bmN0aW9uKHNpbmssIHJlcGx5KSB7XG4gICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICByZXR1cm4gbm9wO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BlcnR5RW5kZWQpIHtcbiAgICAgICAgc2luayhlbmQoKSk7XG4gICAgICAgIHJldHVybiBub3A7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gRGlzcGF0Y2hlci5wcm90b3R5cGUuc3Vic2NyaWJlLmNhbGwodGhpcywgc2luayk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFByb3BlcnR5RGlzcGF0Y2hlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oc2luaykge1xuICAgICAgdmFyIGRpc3BhdGNoaW5nSWQsIGluaXRTZW50LCByZXBseSwgdmFsSWQ7XG4gICAgICBpbml0U2VudCA9IGZhbHNlO1xuICAgICAgcmVwbHkgPSBCYWNvbi5tb3JlO1xuICAgICAgaWYgKHRoaXMuY3VycmVudC5pc0RlZmluZWQgJiYgKHRoaXMuaGFzU3Vic2NyaWJlcnMoKSB8fCB0aGlzLnByb3BlcnR5RW5kZWQpKSB7XG4gICAgICAgIGRpc3BhdGNoaW5nSWQgPSBVcGRhdGVCYXJyaWVyLmN1cnJlbnRFdmVudElkKCk7XG4gICAgICAgIHZhbElkID0gdGhpcy5jdXJyZW50VmFsdWVSb290SWQ7XG4gICAgICAgIGlmICghdGhpcy5wcm9wZXJ0eUVuZGVkICYmIHZhbElkICYmIGRpc3BhdGNoaW5nSWQgJiYgZGlzcGF0Y2hpbmdJZCAhPT0gdmFsSWQpIHtcbiAgICAgICAgICBVcGRhdGVCYXJyaWVyLndoZW5Eb25lV2l0aCh0aGlzLnByb3BlcnR5LCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKF90aGlzLmN1cnJlbnRWYWx1ZVJvb3RJZCA9PT0gdmFsSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2luayhpbml0aWFsKF90aGlzLmN1cnJlbnQuZ2V0KCkudmFsdWUoKSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pKHRoaXMpKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXliZVN1YlNvdXJjZShzaW5rLCByZXBseSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgVXBkYXRlQmFycmllci5pblRyYW5zYWN0aW9uKHZvaWQgMCwgdGhpcywgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcGx5ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW5rKGluaXRpYWwodGhpcy5jdXJyZW50LmdldCgpLnZhbHVlKCkpKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhbGwodGhpcyk7XG4gICAgICAgICAgfSksIFtdKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXliZVN1YlNvdXJjZShzaW5rLCByZXBseSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1heWJlU3ViU291cmNlKHNpbmssIHJlcGx5KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFByb3BlcnR5RGlzcGF0Y2hlcjtcblxuICB9KShEaXNwYXRjaGVyKTtcblxuICBCdXMgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEJ1cywgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIEJ1cygpIHtcbiAgICAgIHRoaXMuZ3VhcmRlZFNpbmsgPSBfX2JpbmQodGhpcy5ndWFyZGVkU2luaywgdGhpcyk7XG4gICAgICB0aGlzLnN1YnNjcmliZUFsbCA9IF9fYmluZCh0aGlzLnN1YnNjcmliZUFsbCwgdGhpcyk7XG4gICAgICB0aGlzLnVuc3ViQWxsID0gX19iaW5kKHRoaXMudW5zdWJBbGwsIHRoaXMpO1xuICAgICAgdGhpcy5zaW5rID0gdm9pZCAwO1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zID0gW107XG4gICAgICB0aGlzLmVuZGVkID0gZmFsc2U7XG4gICAgICBCdXMuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgZGVzY3JpYmUoQmFjb24sIFwiQnVzXCIpLCB0aGlzLnN1YnNjcmliZUFsbCk7XG4gICAgfVxuXG4gICAgQnVzLnByb3RvdHlwZS51bnN1YkFsbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHN1YiwgX2ksIF9sZW4sIF9yZWYxO1xuICAgICAgX3JlZjEgPSB0aGlzLnN1YnNjcmlwdGlvbnM7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHN1YiA9IF9yZWYxW19pXTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdWIudW5zdWIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHN1Yi51bnN1YigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH07XG5cbiAgICBCdXMucHJvdG90eXBlLnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKG5ld1NpbmspIHtcbiAgICAgIHZhciBzdWJzY3JpcHRpb24sIF9pLCBfbGVuLCBfcmVmMTtcbiAgICAgIHRoaXMuc2luayA9IG5ld1Npbms7XG4gICAgICBfcmVmMSA9IGNsb25lQXJyYXkodGhpcy5zdWJzY3JpcHRpb25zKTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgc3Vic2NyaXB0aW9uID0gX3JlZjFbX2ldO1xuICAgICAgICB0aGlzLnN1YnNjcmliZUlucHV0KHN1YnNjcmlwdGlvbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy51bnN1YkFsbDtcbiAgICB9O1xuXG4gICAgQnVzLnByb3RvdHlwZS5ndWFyZGVkU2luayA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmIChldmVudC5pc0VuZCgpKSB7XG4gICAgICAgICAgICBfdGhpcy51bnN1YnNjcmliZUlucHV0KGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBCYWNvbi5ub01vcmU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5zaW5rKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICB9O1xuXG4gICAgQnVzLnByb3RvdHlwZS5zdWJzY3JpYmVJbnB1dCA9IGZ1bmN0aW9uKHN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbi51bnN1YiA9IHN1YnNjcmlwdGlvbi5pbnB1dC5kaXNwYXRjaGVyLnN1YnNjcmliZSh0aGlzLmd1YXJkZWRTaW5rKHN1YnNjcmlwdGlvbi5pbnB1dCkpO1xuICAgIH07XG5cbiAgICBCdXMucHJvdG90eXBlLnVuc3Vic2NyaWJlSW5wdXQgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgdmFyIGksIHN1YiwgX2ksIF9sZW4sIF9yZWYxO1xuICAgICAgX3JlZjEgPSB0aGlzLnN1YnNjcmlwdGlvbnM7XG4gICAgICBmb3IgKGkgPSBfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgaSA9ICsrX2kpIHtcbiAgICAgICAgc3ViID0gX3JlZjFbaV07XG4gICAgICAgIGlmIChzdWIuaW5wdXQgPT09IGlucHV0KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzdWIudW5zdWIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgc3ViLnVuc3ViKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIEJ1cy5wcm90b3R5cGUucGx1ZyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICB2YXIgc3ViO1xuICAgICAgaWYgKHRoaXMuZW5kZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc3ViID0ge1xuICAgICAgICBpbnB1dDogaW5wdXRcbiAgICAgIH07XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWIpO1xuICAgICAgaWYgKCh0aGlzLnNpbmsgIT0gbnVsbCkpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmVJbnB1dChzdWIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnVuc3Vic2NyaWJlSW5wdXQoaW5wdXQpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgfTtcblxuICAgIEJ1cy5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMudW5zdWJBbGwoKTtcbiAgICAgIHJldHVybiB0eXBlb2YgdGhpcy5zaW5rID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLnNpbmsoZW5kKCkpIDogdm9pZCAwO1xuICAgIH07XG5cbiAgICBCdXMucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLnNpbmsgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMuc2luayhuZXh0KHZhbHVlKSkgOiB2b2lkIDA7XG4gICAgfTtcblxuICAgIEJ1cy5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLnNpbmsgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMuc2luayhuZXcgRXJyb3IoZXJyb3IpKSA6IHZvaWQgMDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEJ1cztcblxuICB9KShFdmVudFN0cmVhbSk7XG5cbiAgU291cmNlID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFNvdXJjZShvYnMsIHN5bmMsIGxhenkpIHtcbiAgICAgIHRoaXMub2JzID0gb2JzO1xuICAgICAgdGhpcy5zeW5jID0gc3luYztcbiAgICAgIHRoaXMubGF6eSA9IGxhenkgIT0gbnVsbCA/IGxhenkgOiBmYWxzZTtcbiAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICB9XG5cbiAgICBTb3VyY2UucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKHNpbmspIHtcbiAgICAgIHJldHVybiB0aGlzLm9icy5kaXNwYXRjaGVyLnN1YnNjcmliZShzaW5rKTtcbiAgICB9O1xuXG4gICAgU291cmNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMub2JzLnRvU3RyaW5nKCk7XG4gICAgfTtcblxuICAgIFNvdXJjZS5wcm90b3R5cGUubWFya0VuZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5lbmRlZCA9IHRydWU7XG4gICAgfTtcblxuICAgIFNvdXJjZS5wcm90b3R5cGUuY29uc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMubGF6eSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiBfLmFsd2F5cyh0aGlzLnF1ZXVlWzBdKVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVldWVbMF07XG4gICAgICB9XG4gICAgfTtcblxuICAgIFNvdXJjZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0aGlzLnF1ZXVlID0gW3hdO1xuICAgIH07XG5cbiAgICBTb3VyY2UucHJvdG90eXBlLm1heUhhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBTb3VyY2UucHJvdG90eXBlLmhhc0F0TGVhc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnF1ZXVlLmxlbmd0aDtcbiAgICB9O1xuXG4gICAgU291cmNlLnByb3RvdHlwZS5mbGF0dGVuID0gdHJ1ZTtcblxuICAgIHJldHVybiBTb3VyY2U7XG5cbiAgfSkoKTtcblxuICBDb25zdW1pbmdTb3VyY2UgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKENvbnN1bWluZ1NvdXJjZSwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIENvbnN1bWluZ1NvdXJjZSgpIHtcbiAgICAgIHJldHVybiBDb25zdW1pbmdTb3VyY2UuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgQ29uc3VtaW5nU291cmNlLnByb3RvdHlwZS5jb25zdW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgIH07XG5cbiAgICBDb25zdW1pbmdTb3VyY2UucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdGhpcy5xdWV1ZS5wdXNoKHgpO1xuICAgIH07XG5cbiAgICBDb25zdW1pbmdTb3VyY2UucHJvdG90eXBlLm1heUhhdmUgPSBmdW5jdGlvbihjKSB7XG4gICAgICByZXR1cm4gIXRoaXMuZW5kZWQgfHwgdGhpcy5xdWV1ZS5sZW5ndGggPj0gYztcbiAgICB9O1xuXG4gICAgQ29uc3VtaW5nU291cmNlLnByb3RvdHlwZS5oYXNBdExlYXN0ID0gZnVuY3Rpb24oYykge1xuICAgICAgcmV0dXJuIHRoaXMucXVldWUubGVuZ3RoID49IGM7XG4gICAgfTtcblxuICAgIENvbnN1bWluZ1NvdXJjZS5wcm90b3R5cGUuZmxhdHRlbiA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIENvbnN1bWluZ1NvdXJjZTtcblxuICB9KShTb3VyY2UpO1xuXG4gIEJ1ZmZlcmluZ1NvdXJjZSA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQnVmZmVyaW5nU291cmNlLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gQnVmZmVyaW5nU291cmNlKG9icykge1xuICAgICAgQnVmZmVyaW5nU291cmNlLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIG9icywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgQnVmZmVyaW5nU291cmNlLnByb3RvdHlwZS5jb25zdW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmFsdWVzO1xuICAgICAgdmFsdWVzID0gdGhpcy5xdWV1ZTtcbiAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBCdWZmZXJpbmdTb3VyY2UucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdGhpcy5xdWV1ZS5wdXNoKHgudmFsdWUoKSk7XG4gICAgfTtcblxuICAgIEJ1ZmZlcmluZ1NvdXJjZS5wcm90b3R5cGUuaGFzQXRMZWFzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHJldHVybiBCdWZmZXJpbmdTb3VyY2U7XG5cbiAgfSkoU291cmNlKTtcblxuICBTb3VyY2UuaXNUcmlnZ2VyID0gZnVuY3Rpb24ocykge1xuICAgIGlmIChzIGluc3RhbmNlb2YgU291cmNlKSB7XG4gICAgICByZXR1cm4gcy5zeW5jO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcyBpbnN0YW5jZW9mIEV2ZW50U3RyZWFtO1xuICAgIH1cbiAgfTtcblxuICBTb3VyY2UuZnJvbU9ic2VydmFibGUgPSBmdW5jdGlvbihzKSB7XG4gICAgaWYgKHMgaW5zdGFuY2VvZiBTb3VyY2UpIHtcbiAgICAgIHJldHVybiBzO1xuICAgIH0gZWxzZSBpZiAocyBpbnN0YW5jZW9mIFByb3BlcnR5KSB7XG4gICAgICByZXR1cm4gbmV3IFNvdXJjZShzLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgQ29uc3VtaW5nU291cmNlKHMsIHRydWUpO1xuICAgIH1cbiAgfTtcblxuICBkZXNjcmliZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBjb250ZXh0LCBtZXRob2Q7XG4gICAgY29udGV4dCA9IGFyZ3VtZW50c1swXSwgbWV0aG9kID0gYXJndW1lbnRzWzFdLCBhcmdzID0gMyA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMikgOiBbXTtcbiAgICBpZiAoKGNvbnRleHQgfHwgbWV0aG9kKSBpbnN0YW5jZW9mIERlc2MpIHtcbiAgICAgIHJldHVybiBjb250ZXh0IHx8IG1ldGhvZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBEZXNjKGNvbnRleHQsIG1ldGhvZCwgYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIGZpbmREZXBzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmIChpc0FycmF5KHgpKSB7XG4gICAgICByZXR1cm4gXy5mbGF0TWFwKGZpbmREZXBzLCB4KTtcbiAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZSh4KSkge1xuICAgICAgcmV0dXJuIFt4XTtcbiAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBTb3VyY2UpIHtcbiAgICAgIHJldHVybiBbeC5vYnNdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9O1xuXG4gIERlc2MgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRGVzYyhjb250ZXh0LCBtZXRob2QsIGFyZ3MpIHtcbiAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICB0aGlzLm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XG4gICAgICB0aGlzLmNhY2hlZCA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBEZXNjLnByb3RvdHlwZS5kZXBzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYWNoZWQgfHwgKHRoaXMuY2FjaGVkID0gZmluZERlcHMoW3RoaXMuY29udGV4dF0uY29uY2F0KHRoaXMuYXJncykpKTtcbiAgICB9O1xuXG4gICAgRGVzYy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihvYnMpIHtcbiAgICAgIG9icy5kZXNjID0gdGhpcztcbiAgICAgIHJldHVybiBvYnM7XG4gICAgfTtcblxuICAgIERlc2MucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXy50b1N0cmluZyh0aGlzLmNvbnRleHQpICsgXCIuXCIgKyBfLnRvU3RyaW5nKHRoaXMubWV0aG9kKSArIFwiKFwiICsgXy5tYXAoXy50b1N0cmluZywgdGhpcy5hcmdzKSArIFwiKVwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGVzYztcblxuICB9KSgpO1xuXG4gIHdpdGhEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZXNjLCBvYnMsIF9pO1xuICAgIGRlc2MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBfaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxKSA6IChfaSA9IDAsIFtdKSwgb2JzID0gYXJndW1lbnRzW19pKytdO1xuICAgIHJldHVybiBkZXNjcmliZS5hcHBseShudWxsLCBkZXNjKS5hcHBseShvYnMpO1xuICB9O1xuXG4gIEJhY29uLndoZW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZiwgaSwgaW5kZXgsIGl4LCBsZW4sIG5lZWRzQmFycmllciwgcGF0LCBwYXRTb3VyY2VzLCBwYXRzLCBwYXR0ZXJucywgcmVzdWx0U3RyZWFtLCBzLCBzb3VyY2VzLCB0cmlnZ2VyRm91bmQsIHVzYWdlLCBfaSwgX2osIF9sZW4sIF9sZW4xLCBfcmVmMTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJhY29uLm5ldmVyKCk7XG4gICAgfVxuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgdXNhZ2UgPSBcIndoZW46IGV4cGVjdGluZyBhcmd1bWVudHMgaW4gdGhlIGZvcm0gKE9ic2VydmFibGUrLGZ1bmN0aW9uKStcIjtcbiAgICBhc3NlcnQodXNhZ2UsIGxlbiAlIDIgPT09IDApO1xuICAgIHNvdXJjZXMgPSBbXTtcbiAgICBwYXRzID0gW107XG4gICAgaSA9IDA7XG4gICAgcGF0dGVybnMgPSBbXTtcbiAgICB3aGlsZSAoaSA8IGxlbikge1xuICAgICAgcGF0dGVybnNbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgICBwYXR0ZXJuc1tpICsgMV0gPSBhcmd1bWVudHNbaSArIDFdO1xuICAgICAgcGF0U291cmNlcyA9IF8udG9BcnJheShhcmd1bWVudHNbaV0pO1xuICAgICAgZiA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgICBwYXQgPSB7XG4gICAgICAgIGY6IChpc0Z1bmN0aW9uKGYpID8gZiA6IChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfSkpLFxuICAgICAgICBpeHM6IFtdXG4gICAgICB9O1xuICAgICAgdHJpZ2dlckZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHBhdFNvdXJjZXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgcyA9IHBhdFNvdXJjZXNbX2ldO1xuICAgICAgICBpbmRleCA9IF8uaW5kZXhPZihzb3VyY2VzLCBzKTtcbiAgICAgICAgaWYgKCF0cmlnZ2VyRm91bmQpIHtcbiAgICAgICAgICB0cmlnZ2VyRm91bmQgPSBTb3VyY2UuaXNUcmlnZ2VyKHMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICBzb3VyY2VzLnB1c2gocyk7XG4gICAgICAgICAgaW5kZXggPSBzb3VyY2VzLmxlbmd0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgX3JlZjEgPSBwYXQuaXhzO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMS5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBpeCA9IF9yZWYxW19qXTtcbiAgICAgICAgICBpZiAoaXguaW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICBpeC5jb3VudCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYXQuaXhzLnB1c2goe1xuICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICBjb3VudDogMVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGFzc2VydChcIkF0IGxlYXN0IG9uZSBFdmVudFN0cmVhbSByZXF1aXJlZFwiLCB0cmlnZ2VyRm91bmQgfHwgKCFwYXRTb3VyY2VzLmxlbmd0aCkpO1xuICAgICAgaWYgKHBhdFNvdXJjZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBwYXRzLnB1c2gocGF0KTtcbiAgICAgIH1cbiAgICAgIGkgPSBpICsgMjtcbiAgICB9XG4gICAgaWYgKCFzb3VyY2VzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIEJhY29uLm5ldmVyKCk7XG4gICAgfVxuICAgIHNvdXJjZXMgPSBfLm1hcChTb3VyY2UuZnJvbU9ic2VydmFibGUsIHNvdXJjZXMpO1xuICAgIG5lZWRzQmFycmllciA9IChfLmFueShzb3VyY2VzLCBmdW5jdGlvbihzKSB7XG4gICAgICByZXR1cm4gcy5mbGF0dGVuO1xuICAgIH0pKSAmJiAoY29udGFpbnNEdXBsaWNhdGVEZXBzKF8ubWFwKChmdW5jdGlvbihzKSB7XG4gICAgICByZXR1cm4gcy5vYnM7XG4gICAgfSksIHNvdXJjZXMpKSk7XG4gICAgcmV0dXJuIHJlc3VsdFN0cmVhbSA9IG5ldyBFdmVudFN0cmVhbShkZXNjcmliZS5hcHBseShudWxsLCBbQmFjb24sIFwid2hlblwiXS5jb25jYXQoX19zbGljZS5jYWxsKHBhdHRlcm5zKSkpLCBmdW5jdGlvbihzaW5rKSB7XG4gICAgICB2YXIgY2Fubm90TWF0Y2gsIGNhbm5vdFN5bmMsIGVuZHMsIG1hdGNoLCBub25GbGF0dGVuZWQsIHBhcnQsIHRyaWdnZXJzO1xuICAgICAgdHJpZ2dlcnMgPSBbXTtcbiAgICAgIGVuZHMgPSBmYWxzZTtcbiAgICAgIG1hdGNoID0gZnVuY3Rpb24ocCkge1xuICAgICAgICB2YXIgX2ssIF9sZW4yLCBfcmVmMjtcbiAgICAgICAgX3JlZjIgPSBwLml4cztcbiAgICAgICAgZm9yIChfayA9IDAsIF9sZW4yID0gX3JlZjIubGVuZ3RoOyBfayA8IF9sZW4yOyBfaysrKSB7XG4gICAgICAgICAgaSA9IF9yZWYyW19rXTtcbiAgICAgICAgICBpZiAoIXNvdXJjZXNbaS5pbmRleF0uaGFzQXRMZWFzdChpLmNvdW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgICBjYW5ub3RTeW5jID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgIHJldHVybiAhc291cmNlLnN5bmMgfHwgc291cmNlLmVuZGVkO1xuICAgICAgfTtcbiAgICAgIGNhbm5vdE1hdGNoID0gZnVuY3Rpb24ocCkge1xuICAgICAgICB2YXIgX2ssIF9sZW4yLCBfcmVmMjtcbiAgICAgICAgX3JlZjIgPSBwLml4cztcbiAgICAgICAgZm9yIChfayA9IDAsIF9sZW4yID0gX3JlZjIubGVuZ3RoOyBfayA8IF9sZW4yOyBfaysrKSB7XG4gICAgICAgICAgaSA9IF9yZWYyW19rXTtcbiAgICAgICAgICBpZiAoIXNvdXJjZXNbaS5pbmRleF0ubWF5SGF2ZShpLmNvdW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgbm9uRmxhdHRlbmVkID0gZnVuY3Rpb24odHJpZ2dlcikge1xuICAgICAgICByZXR1cm4gIXRyaWdnZXIuc291cmNlLmZsYXR0ZW47XG4gICAgICB9O1xuICAgICAgcGFydCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odW5zdWJBbGwpIHtcbiAgICAgICAgICB2YXIgZmx1c2gsIGZsdXNoTGF0ZXIsIGZsdXNoV2hpbGVUcmlnZ2VycztcbiAgICAgICAgICBmbHVzaExhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gVXBkYXRlQmFycmllci53aGVuRG9uZVdpdGgocmVzdWx0U3RyZWFtLCBmbHVzaCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBmbHVzaFdoaWxlVHJpZ2dlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBldmVudHMsIHAsIHJlcGx5LCB0cmlnZ2VyLCBfaywgX2xlbjI7XG4gICAgICAgICAgICBpZiAodHJpZ2dlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICByZXBseSA9IEJhY29uLm1vcmU7XG4gICAgICAgICAgICAgIHRyaWdnZXIgPSB0cmlnZ2Vycy5wb3AoKTtcbiAgICAgICAgICAgICAgZm9yIChfayA9IDAsIF9sZW4yID0gcGF0cy5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICAgICAgICBwID0gcGF0c1tfa107XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKHApKSB7XG4gICAgICAgICAgICAgICAgICBldmVudHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfbCwgX2xlbjMsIF9yZWYyLCBfcmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgX3JlZjIgPSBwLml4cztcbiAgICAgICAgICAgICAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChfbCA9IDAsIF9sZW4zID0gX3JlZjIubGVuZ3RoOyBfbCA8IF9sZW4zOyBfbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaSA9IF9yZWYyW19sXTtcbiAgICAgICAgICAgICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHNvdXJjZXNbaS5pbmRleF0uY29uc3VtZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgICAgcmVwbHkgPSBzaW5rKHRyaWdnZXIuZS5hcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50LCB2YWx1ZXM7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgX2wsIF9sZW4zLCBfcmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgIGZvciAoX2wgPSAwLCBfbGVuMyA9IGV2ZW50cy5sZW5ndGg7IF9sIDwgX2xlbjM7IF9sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gZXZlbnRzW19sXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goZXZlbnQudmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHAuZi5hcHBseShwLCB2YWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgaWYgKHRyaWdnZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VycyA9IF8uZmlsdGVyKG5vbkZsYXR0ZW5lZCwgdHJpZ2dlcnMpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHJlcGx5ID09PSBCYWNvbi5ub01vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcGx5O1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZsdXNoV2hpbGVUcmlnZ2VycygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJhY29uLm1vcmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICBmbHVzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHJlcGx5O1xuICAgICAgICAgICAgcmVwbHkgPSBmbHVzaFdoaWxlVHJpZ2dlcnMoKTtcbiAgICAgICAgICAgIGlmIChlbmRzKSB7XG4gICAgICAgICAgICAgIGVuZHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgaWYgKF8uYWxsKHNvdXJjZXMsIGNhbm5vdFN5bmMpIHx8IF8uYWxsKHBhdHMsIGNhbm5vdE1hdGNoKSkge1xuICAgICAgICAgICAgICAgIHJlcGx5ID0gQmFjb24ubm9Nb3JlO1xuICAgICAgICAgICAgICAgIHNpbmsoZW5kKCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICB1bnN1YkFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcGx5O1xuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHNvdXJjZS5zdWJzY3JpYmUoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHJlcGx5O1xuICAgICAgICAgICAgaWYgKGUuaXNFbmQoKSkge1xuICAgICAgICAgICAgICBlbmRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc291cmNlLm1hcmtFbmRlZCgpO1xuICAgICAgICAgICAgICBmbHVzaExhdGVyKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUuaXNFcnJvcigpKSB7XG4gICAgICAgICAgICAgIHJlcGx5ID0gc2luayhlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNvdXJjZS5wdXNoKGUpO1xuICAgICAgICAgICAgICBpZiAoc291cmNlLnN5bmMpIHtcbiAgICAgICAgICAgICAgICB0cmlnZ2Vycy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICAgICAgICAgICAgZTogZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChuZWVkc0JhcnJpZXIgfHwgVXBkYXRlQmFycmllci5oYXNXYWl0ZXJzKCkpIHtcbiAgICAgICAgICAgICAgICAgIGZsdXNoTGF0ZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXBseSA9PT0gQmFjb24ubm9Nb3JlKSB7XG4gICAgICAgICAgICAgIHVuc3ViQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVwbHkgfHwgQmFjb24ubW9yZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gY29tcG9zaXRlVW5zdWJzY3JpYmUuYXBwbHkobnVsbCwgKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ssIF9sZW4yLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfayA9IDAsIF9sZW4yID0gc291cmNlcy5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICBzID0gc291cmNlc1tfa107XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChwYXJ0KHMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb250YWluc0R1cGxpY2F0ZURlcHMgPSBmdW5jdGlvbihvYnNlcnZhYmxlcywgc3RhdGUpIHtcbiAgICB2YXIgY2hlY2tPYnNlcnZhYmxlO1xuICAgIGlmIChzdGF0ZSA9PSBudWxsKSB7XG4gICAgICBzdGF0ZSA9IFtdO1xuICAgIH1cbiAgICBjaGVja09ic2VydmFibGUgPSBmdW5jdGlvbihvYnMpIHtcbiAgICAgIHZhciBkZXBzO1xuICAgICAgaWYgKF8uY29udGFpbnMoc3RhdGUsIG9icykpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXBzID0gb2JzLmludGVybmFsRGVwcygpO1xuICAgICAgICBpZiAoZGVwcy5sZW5ndGgpIHtcbiAgICAgICAgICBzdGF0ZS5wdXNoKG9icyk7XG4gICAgICAgICAgcmV0dXJuIF8uYW55KGRlcHMsIGNoZWNrT2JzZXJ2YWJsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGUucHVzaChvYnMpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIF8uYW55KG9ic2VydmFibGVzLCBjaGVja09ic2VydmFibGUpO1xuICB9O1xuXG4gIEJhY29uLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpLCBpbml0aWFsLCBsYXRlQmluZEZpcnN0LCBwYXR0ZXJucztcbiAgICBpbml0aWFsID0gYXJndW1lbnRzWzBdLCBwYXR0ZXJucyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgbGF0ZUJpbmRGaXJzdCA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oaSkge1xuICAgICAgICAgIHJldHVybiBmLmFwcGx5KG51bGwsIFtpXS5jb25jYXQoYXJncykpO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9O1xuICAgIGkgPSBwYXR0ZXJucy5sZW5ndGggLSAxO1xuICAgIHdoaWxlIChpID4gMCkge1xuICAgICAgaWYgKCEocGF0dGVybnNbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgcGF0dGVybnNbaV0gPSAoZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHBhdHRlcm5zW2ldKTtcbiAgICAgIH1cbiAgICAgIHBhdHRlcm5zW2ldID0gbGF0ZUJpbmRGaXJzdChwYXR0ZXJuc1tpXSk7XG4gICAgICBpID0gaSAtIDI7XG4gICAgfVxuICAgIHJldHVybiB3aXRoRGVzY3JpcHRpb24uYXBwbHkobnVsbCwgW0JhY29uLCBcInVwZGF0ZVwiLCBpbml0aWFsXS5jb25jYXQoX19zbGljZS5jYWxsKHBhdHRlcm5zKSwgW0JhY29uLndoZW4uYXBwbHkoQmFjb24sIHBhdHRlcm5zKS5zY2FuKGluaXRpYWwsIChmdW5jdGlvbih4LCBmKSB7XG4gICAgICByZXR1cm4gZih4KTtcbiAgICB9KSldKSk7XG4gIH07XG5cbiAgY29tcG9zaXRlVW5zdWJzY3JpYmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3M7XG4gICAgc3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIHJldHVybiBuZXcgQ29tcG9zaXRlVW5zdWJzY3JpYmUoc3MpLnVuc3Vic2NyaWJlO1xuICB9O1xuXG4gIENvbXBvc2l0ZVVuc3Vic2NyaWJlID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIENvbXBvc2l0ZVVuc3Vic2NyaWJlKHNzKSB7XG4gICAgICB2YXIgcywgX2ksIF9sZW47XG4gICAgICBpZiAoc3MgPT0gbnVsbCkge1xuICAgICAgICBzcyA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy51bnN1YnNjcmliZSA9IF9fYmluZCh0aGlzLnVuc3Vic2NyaWJlLCB0aGlzKTtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVkID0gZmFsc2U7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgIHRoaXMuc3RhcnRpbmcgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gc3MubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgcyA9IHNzW19pXTtcbiAgICAgICAgdGhpcy5hZGQocyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgQ29tcG9zaXRlVW5zdWJzY3JpYmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHN1YnNjcmlwdGlvbikge1xuICAgICAgdmFyIGVuZGVkLCB1bnN1YiwgdW5zdWJNZTtcbiAgICAgIGlmICh0aGlzLnVuc3Vic2NyaWJlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlbmRlZCA9IGZhbHNlO1xuICAgICAgdW5zdWIgPSBub3A7XG4gICAgICB0aGlzLnN0YXJ0aW5nLnB1c2goc3Vic2NyaXB0aW9uKTtcbiAgICAgIHVuc3ViTWUgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy51bnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZW5kZWQgPSB0cnVlO1xuICAgICAgICAgIF90aGlzLnJlbW92ZSh1bnN1Yik7XG4gICAgICAgICAgcmV0dXJuIF8ucmVtb3ZlKHN1YnNjcmlwdGlvbiwgX3RoaXMuc3RhcnRpbmcpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgICB1bnN1YiA9IHN1YnNjcmlwdGlvbih0aGlzLnVuc3Vic2NyaWJlLCB1bnN1Yk1lKTtcbiAgICAgIGlmICghKHRoaXMudW5zdWJzY3JpYmVkIHx8IGVuZGVkKSkge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucHVzaCh1bnN1Yik7XG4gICAgICB9XG4gICAgICBfLnJlbW92ZShzdWJzY3JpcHRpb24sIHRoaXMuc3RhcnRpbmcpO1xuICAgICAgcmV0dXJuIHVuc3ViO1xuICAgIH07XG5cbiAgICBDb21wb3NpdGVVbnN1YnNjcmliZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24odW5zdWIpIHtcbiAgICAgIGlmICh0aGlzLnVuc3Vic2NyaWJlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoKF8ucmVtb3ZlKHVuc3ViLCB0aGlzLnN1YnNjcmlwdGlvbnMpKSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIHJldHVybiB1bnN1YigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBDb21wb3NpdGVVbnN1YnNjcmliZS5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICBpZiAodGhpcy51bnN1YnNjcmliZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy51bnN1YnNjcmliZWQgPSB0cnVlO1xuICAgICAgX3JlZjEgPSB0aGlzLnN1YnNjcmlwdGlvbnM7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHMgPSBfcmVmMVtfaV07XG4gICAgICAgIHMoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgcmV0dXJuIHRoaXMuc3RhcnRpbmcgPSBbXTtcbiAgICB9O1xuXG4gICAgQ29tcG9zaXRlVW5zdWJzY3JpYmUucHJvdG90eXBlLmNvdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy51bnN1YnNjcmliZWQpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpcHRpb25zLmxlbmd0aCArIHRoaXMuc3RhcnRpbmcubGVuZ3RoO1xuICAgIH07XG5cbiAgICBDb21wb3NpdGVVbnN1YnNjcmliZS5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvdW50KCkgPT09IDA7XG4gICAgfTtcblxuICAgIHJldHVybiBDb21wb3NpdGVVbnN1YnNjcmliZTtcblxuICB9KSgpO1xuXG4gIEJhY29uLkNvbXBvc2l0ZVVuc3Vic2NyaWJlID0gQ29tcG9zaXRlVW5zdWJzY3JpYmU7XG5cbiAgU29tZSA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBTb21lKHZhbHVlKSB7XG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgU29tZS5wcm90b3R5cGUuZ2V0T3JFbHNlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9O1xuXG4gICAgU29tZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9O1xuXG4gICAgU29tZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oZikge1xuICAgICAgaWYgKGYodGhpcy52YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTb21lKHRoaXMudmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE5vbmU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFNvbWUucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHJldHVybiBuZXcgU29tZShmKHRoaXMudmFsdWUpKTtcbiAgICB9O1xuXG4gICAgU29tZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHJldHVybiBmKHRoaXMudmFsdWUpO1xuICAgIH07XG5cbiAgICBTb21lLnByb3RvdHlwZS5pc0RlZmluZWQgPSB0cnVlO1xuXG4gICAgU29tZS5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlXTtcbiAgICB9O1xuXG4gICAgU29tZS5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiU29tZShcIiArIHRoaXMudmFsdWUgKyBcIilcIjtcbiAgICB9O1xuXG4gICAgU29tZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFNvbWU7XG5cbiAgfSkoKTtcblxuICBOb25lID0ge1xuICAgIGdldE9yRWxzZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuICAgIGZpbHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gTm9uZTtcbiAgICB9LFxuICAgIG1hcDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gTm9uZTtcbiAgICB9LFxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKCkge30sXG4gICAgaXNEZWZpbmVkOiBmYWxzZSxcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuICAgIGluc3BlY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiTm9uZVwiO1xuICAgIH0sXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpO1xuICAgIH1cbiAgfTtcblxuICBVcGRhdGVCYXJyaWVyID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBhZnRlclRyYW5zYWN0aW9uLCBhZnRlcnMsIGFmdGVyc0luZGV4LCBjdXJyZW50RXZlbnRJZCwgZmx1c2gsIGZsdXNoRGVwc09mLCBmbHVzaFdhaXRlcnMsIGhhc1dhaXRlcnMsIGluVHJhbnNhY3Rpb24sIHJvb3RFdmVudCwgd2FpdGVyT2JzLCB3YWl0ZXJzLCB3aGVuRG9uZVdpdGgsIHdyYXBwZWRTdWJzY3JpYmU7XG4gICAgcm9vdEV2ZW50ID0gdm9pZCAwO1xuICAgIHdhaXRlck9icyA9IFtdO1xuICAgIHdhaXRlcnMgPSB7fTtcbiAgICBhZnRlcnMgPSBbXTtcbiAgICBhZnRlcnNJbmRleCA9IDA7XG4gICAgYWZ0ZXJUcmFuc2FjdGlvbiA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgIGlmIChyb290RXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIGFmdGVycy5wdXNoKGYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGYoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdoZW5Eb25lV2l0aCA9IGZ1bmN0aW9uKG9icywgZikge1xuICAgICAgdmFyIG9ic1dhaXRlcnM7XG4gICAgICBpZiAocm9vdEV2ZW50KSB7XG4gICAgICAgIG9ic1dhaXRlcnMgPSB3YWl0ZXJzW29icy5pZF07XG4gICAgICAgIGlmIChvYnNXYWl0ZXJzID09IG51bGwpIHtcbiAgICAgICAgICBvYnNXYWl0ZXJzID0gd2FpdGVyc1tvYnMuaWRdID0gW2ZdO1xuICAgICAgICAgIHJldHVybiB3YWl0ZXJPYnMucHVzaChvYnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBvYnNXYWl0ZXJzLnB1c2goZik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBmbHVzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgd2hpbGUgKHdhaXRlck9icy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZsdXNoV2FpdGVycygwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfTtcbiAgICBmbHVzaFdhaXRlcnMgPSBmdW5jdGlvbihpbmRleCkge1xuICAgICAgdmFyIGYsIG9icywgb2JzSWQsIG9ic1dhaXRlcnMsIF9pLCBfbGVuO1xuICAgICAgb2JzID0gd2FpdGVyT2JzW2luZGV4XTtcbiAgICAgIG9ic0lkID0gb2JzLmlkO1xuICAgICAgb2JzV2FpdGVycyA9IHdhaXRlcnNbb2JzSWRdO1xuICAgICAgd2FpdGVyT2JzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBkZWxldGUgd2FpdGVyc1tvYnNJZF07XG4gICAgICBmbHVzaERlcHNPZihvYnMpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYnNXYWl0ZXJzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGYgPSBvYnNXYWl0ZXJzW19pXTtcbiAgICAgICAgZigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9O1xuICAgIGZsdXNoRGVwc09mID0gZnVuY3Rpb24ob2JzKSB7XG4gICAgICB2YXIgZGVwLCBkZXBzLCBpbmRleCwgX2ksIF9sZW47XG4gICAgICBkZXBzID0gb2JzLmludGVybmFsRGVwcygpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBkZXBzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGRlcCA9IGRlcHNbX2ldO1xuICAgICAgICBmbHVzaERlcHNPZihkZXApO1xuICAgICAgICBpZiAod2FpdGVyc1tkZXAuaWRdKSB7XG4gICAgICAgICAgaW5kZXggPSBfLmluZGV4T2Yod2FpdGVyT2JzLCBkZXApO1xuICAgICAgICAgIGZsdXNoV2FpdGVycyhpbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfTtcbiAgICBpblRyYW5zYWN0aW9uID0gZnVuY3Rpb24oZXZlbnQsIGNvbnRleHQsIGYsIGFyZ3MpIHtcbiAgICAgIHZhciBhZnRlciwgcmVzdWx0O1xuICAgICAgaWYgKHJvb3RFdmVudCkge1xuICAgICAgICByZXR1cm4gZi5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3RFdmVudCA9IGV2ZW50O1xuICAgICAgICByZXN1bHQgPSBmLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBmbHVzaCgpO1xuICAgICAgICByb290RXZlbnQgPSB2b2lkIDA7XG4gICAgICAgIHdoaWxlIChhZnRlcnNJbmRleCA8IGFmdGVycy5sZW5ndGgpIHtcbiAgICAgICAgICBhZnRlciA9IGFmdGVyc1thZnRlcnNJbmRleF07XG4gICAgICAgICAgYWZ0ZXJzSW5kZXgrKztcbiAgICAgICAgICBhZnRlcigpO1xuICAgICAgICB9XG4gICAgICAgIGFmdGVyc0luZGV4ID0gMDtcbiAgICAgICAgYWZ0ZXJzID0gW107XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfTtcbiAgICBjdXJyZW50RXZlbnRJZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJvb3RFdmVudCkge1xuICAgICAgICByZXR1cm4gcm9vdEV2ZW50LmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdyYXBwZWRTdWJzY3JpYmUgPSBmdW5jdGlvbihvYnMsIHNpbmspIHtcbiAgICAgIHZhciBkb1Vuc3ViLCB1bnN1YiwgdW5zdWJkO1xuICAgICAgdW5zdWJkID0gZmFsc2U7XG4gICAgICBkb1Vuc3ViID0gZnVuY3Rpb24oKSB7fTtcbiAgICAgIHVuc3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHVuc3ViZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBkb1Vuc3ViKCk7XG4gICAgICB9O1xuICAgICAgZG9VbnN1YiA9IG9icy5kaXNwYXRjaGVyLnN1YnNjcmliZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gYWZ0ZXJUcmFuc2FjdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcmVwbHk7XG4gICAgICAgICAgaWYgKCF1bnN1YmQpIHtcbiAgICAgICAgICAgIHJlcGx5ID0gc2luayhldmVudCk7XG4gICAgICAgICAgICBpZiAocmVwbHkgPT09IEJhY29uLm5vTW9yZSkge1xuICAgICAgICAgICAgICByZXR1cm4gdW5zdWIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdW5zdWI7XG4gICAgfTtcbiAgICBoYXNXYWl0ZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2FpdGVyT2JzLmxlbmd0aCA+IDA7XG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgd2hlbkRvbmVXaXRoOiB3aGVuRG9uZVdpdGgsXG4gICAgICBoYXNXYWl0ZXJzOiBoYXNXYWl0ZXJzLFxuICAgICAgaW5UcmFuc2FjdGlvbjogaW5UcmFuc2FjdGlvbixcbiAgICAgIGN1cnJlbnRFdmVudElkOiBjdXJyZW50RXZlbnRJZCxcbiAgICAgIHdyYXBwZWRTdWJzY3JpYmU6IHdyYXBwZWRTdWJzY3JpYmVcbiAgICB9O1xuICB9KSgpO1xuXG4gIEJhY29uLkV2ZW50U3RyZWFtID0gRXZlbnRTdHJlYW07XG5cbiAgQmFjb24uUHJvcGVydHkgPSBQcm9wZXJ0eTtcblxuICBCYWNvbi5PYnNlcnZhYmxlID0gT2JzZXJ2YWJsZTtcblxuICBCYWNvbi5CdXMgPSBCdXM7XG5cbiAgQmFjb24uSW5pdGlhbCA9IEluaXRpYWw7XG5cbiAgQmFjb24uTmV4dCA9IE5leHQ7XG5cbiAgQmFjb24uRW5kID0gRW5kO1xuXG4gIEJhY29uLkVycm9yID0gRXJyb3I7XG5cbiAgbm9wID0gZnVuY3Rpb24oKSB7fTtcblxuICBsYXR0ZXIgPSBmdW5jdGlvbihfLCB4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG5cbiAgZm9ybWVyID0gZnVuY3Rpb24oeCwgXykge1xuICAgIHJldHVybiB4O1xuICB9O1xuXG4gIGluaXRpYWwgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBuZXcgSW5pdGlhbCh2YWx1ZSwgdHJ1ZSk7XG4gIH07XG5cbiAgbmV4dCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBOZXh0KHZhbHVlLCB0cnVlKTtcbiAgfTtcblxuICBlbmQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEVuZCgpO1xuICB9O1xuXG4gIHRvRXZlbnQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFdmVudCkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXh0KHgpO1xuICAgIH1cbiAgfTtcblxuICBjbG9uZUFycmF5ID0gZnVuY3Rpb24oeHMpIHtcbiAgICByZXR1cm4geHMuc2xpY2UoMCk7XG4gIH07XG5cbiAgYXNzZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSwgY29uZGl0aW9uKSB7XG4gICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24obWVzc2FnZSk7XG4gICAgfVxuICB9O1xuXG4gIGFzc2VydEV2ZW50U3RyZWFtID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoIShldmVudCBpbnN0YW5jZW9mIEV2ZW50U3RyZWFtKSkge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIm5vdCBhbiBFdmVudFN0cmVhbSA6IFwiICsgZXZlbnQpO1xuICAgIH1cbiAgfTtcblxuICBhc3NlcnRGdW5jdGlvbiA9IGZ1bmN0aW9uKGYpIHtcbiAgICByZXR1cm4gYXNzZXJ0KFwibm90IGEgZnVuY3Rpb24gOiBcIiArIGYsIGlzRnVuY3Rpb24oZikpO1xuICB9O1xuXG4gIGlzRnVuY3Rpb24gPSBmdW5jdGlvbihmKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBmID09PSBcImZ1bmN0aW9uXCI7XG4gIH07XG5cbiAgaXNBcnJheSA9IGZ1bmN0aW9uKHhzKSB7XG4gICAgcmV0dXJuIHhzIGluc3RhbmNlb2YgQXJyYXk7XG4gIH07XG5cbiAgaXNPYnNlcnZhYmxlID0gZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiB4IGluc3RhbmNlb2YgT2JzZXJ2YWJsZTtcbiAgfTtcblxuICBhc3NlcnRBcnJheSA9IGZ1bmN0aW9uKHhzKSB7XG4gICAgaWYgKCFpc0FycmF5KHhzKSkge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIm5vdCBhbiBhcnJheSA6IFwiICsgeHMpO1xuICAgIH1cbiAgfTtcblxuICBhc3NlcnROb0FyZ3VtZW50cyA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICByZXR1cm4gYXNzZXJ0KFwibm8gYXJndW1lbnRzIHN1cHBvcnRlZFwiLCBhcmdzLmxlbmd0aCA9PT0gMCk7XG4gIH07XG5cbiAgYXNzZXJ0U3RyaW5nID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIm5vdCBhIHN0cmluZyA6IFwiICsgeCk7XG4gICAgfVxuICB9O1xuXG4gIHBhcnRpYWxseUFwcGxpZWQgPSBmdW5jdGlvbihmLCBhcHBsaWVkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3M7XG4gICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgIHJldHVybiBmLmFwcGx5KG51bGwsIGFwcGxpZWQuY29uY2F0KGFyZ3MpKTtcbiAgICB9O1xuICB9O1xuXG4gIG1ha2VTcGF3bmVyID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBpc09ic2VydmFibGUoYXJnc1swXSkpIHtcbiAgICAgIHJldHVybiBfLmFsd2F5cyhhcmdzWzBdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1ha2VGdW5jdGlvbkFyZ3MoYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIG1ha2VGdW5jdGlvbkFyZ3MgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpO1xuICAgIHJldHVybiBtYWtlRnVuY3Rpb25fLmFwcGx5KG51bGwsIGFyZ3MpO1xuICB9O1xuXG4gIG1ha2VGdW5jdGlvbl8gPSB3aXRoTWV0aG9kQ2FsbFN1cHBvcnQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGY7XG4gICAgZiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgaWYgKGlzRnVuY3Rpb24oZikpIHtcbiAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gcGFydGlhbGx5QXBwbGllZChmLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNGaWVsZEtleShmKSkge1xuICAgICAgcmV0dXJuIHRvRmllbGRFeHRyYWN0b3IoZiwgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBfLmFsd2F5cyhmKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1ha2VGdW5jdGlvbiA9IGZ1bmN0aW9uKGYsIGFyZ3MpIHtcbiAgICByZXR1cm4gbWFrZUZ1bmN0aW9uXy5hcHBseShudWxsLCBbZl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmdzKSkpO1xuICB9O1xuXG4gIG1ha2VPYnNlcnZhYmxlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmIChpc09ic2VydmFibGUoeCkpIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmFjb24ub25jZSh4KTtcbiAgICB9XG4gIH07XG5cbiAgaXNGaWVsZEtleSA9IGZ1bmN0aW9uKGYpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBmID09PSBcInN0cmluZ1wiKSAmJiBmLmxlbmd0aCA+IDEgJiYgZi5jaGFyQXQoMCkgPT09IFwiLlwiO1xuICB9O1xuXG4gIEJhY29uLmlzRmllbGRLZXkgPSBpc0ZpZWxkS2V5O1xuXG4gIHRvRmllbGRFeHRyYWN0b3IgPSBmdW5jdGlvbihmLCBhcmdzKSB7XG4gICAgdmFyIHBhcnRGdW5jcywgcGFydHM7XG4gICAgcGFydHMgPSBmLnNsaWNlKDEpLnNwbGl0KFwiLlwiKTtcbiAgICBwYXJ0RnVuY3MgPSBfLm1hcCh0b1NpbXBsZUV4dHJhY3RvcihhcmdzKSwgcGFydHMpO1xuICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFyIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwYXJ0RnVuY3MubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZiA9IHBhcnRGdW5jc1tfaV07XG4gICAgICAgIHZhbHVlID0gZih2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgfTtcblxuICB0b1NpbXBsZUV4dHJhY3RvciA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIGZpZWxkVmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaWVsZFZhbHVlID0gdmFsdWVba2V5XTtcbiAgICAgICAgICBpZiAoaXNGdW5jdGlvbihmaWVsZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkVmFsdWUuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcbiAgfTtcblxuICB0b0ZpZWxkS2V5ID0gZnVuY3Rpb24oZikge1xuICAgIHJldHVybiBmLnNsaWNlKDEpO1xuICB9O1xuXG4gIHRvQ29tYmluYXRvciA9IGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIga2V5O1xuICAgIGlmIChpc0Z1bmN0aW9uKGYpKSB7XG4gICAgICByZXR1cm4gZjtcbiAgICB9IGVsc2UgaWYgKGlzRmllbGRLZXkoZikpIHtcbiAgICAgIGtleSA9IHRvRmllbGRLZXkoZik7XG4gICAgICByZXR1cm4gZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgICAgcmV0dXJuIGxlZnRba2V5XShyaWdodCk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXNzZXJ0KFwibm90IGEgZnVuY3Rpb24gb3IgYSBmaWVsZCBrZXk6IFwiICsgZiwgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICB0b09wdGlvbiA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFNvbWUgfHwgdiA9PT0gTm9uZSkge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU29tZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgXyA9IHtcbiAgICBpbmRleE9mOiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA/IGZ1bmN0aW9uKHhzLCB4KSB7XG4gICAgICByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICB9IDogZnVuY3Rpb24oeHMsIHgpIHtcbiAgICAgIHZhciBpLCB5LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IHhzLmxlbmd0aDsgX2kgPCBfbGVuOyBpID0gKytfaSkge1xuICAgICAgICB5ID0geHNbaV07XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9LFxuICAgIGluZGV4V2hlcmU6IGZ1bmN0aW9uKHhzLCBmKSB7XG4gICAgICB2YXIgaSwgeSwgX2ksIF9sZW47XG4gICAgICBmb3IgKGkgPSBfaSA9IDAsIF9sZW4gPSB4cy5sZW5ndGg7IF9pIDwgX2xlbjsgaSA9ICsrX2kpIHtcbiAgICAgICAgeSA9IHhzW2ldO1xuICAgICAgICBpZiAoZih5KSkge1xuICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfSxcbiAgICBoZWFkOiBmdW5jdGlvbih4cykge1xuICAgICAgcmV0dXJuIHhzWzBdO1xuICAgIH0sXG4gICAgYWx3YXlzOiBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgICAgfTtcbiAgICB9LFxuICAgIG5lZ2F0ZTogZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICFmKHgpO1xuICAgICAgfTtcbiAgICB9LFxuICAgIGVtcHR5OiBmdW5jdGlvbih4cykge1xuICAgICAgcmV0dXJuIHhzLmxlbmd0aCA9PT0gMDtcbiAgICB9LFxuICAgIHRhaWw6IGZ1bmN0aW9uKHhzKSB7XG4gICAgICByZXR1cm4geHMuc2xpY2UoMSwgeHMubGVuZ3RoKTtcbiAgICB9LFxuICAgIGZpbHRlcjogZnVuY3Rpb24oZiwgeHMpIHtcbiAgICAgIHZhciBmaWx0ZXJlZCwgeCwgX2ksIF9sZW47XG4gICAgICBmaWx0ZXJlZCA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB4cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB4ID0geHNbX2ldO1xuICAgICAgICBpZiAoZih4KSkge1xuICAgICAgICAgIGZpbHRlcmVkLnB1c2goeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuICAgIG1hcDogZnVuY3Rpb24oZiwgeHMpIHtcbiAgICAgIHZhciB4LCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB4cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB4ID0geHNbX2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKGYoeCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH0sXG4gICAgZWFjaDogZnVuY3Rpb24oeHMsIGYpIHtcbiAgICAgIHZhciBrZXksIHZhbHVlO1xuICAgICAgZm9yIChrZXkgaW4geHMpIHtcbiAgICAgICAgdmFsdWUgPSB4c1trZXldO1xuICAgICAgICBmKGtleSwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9LFxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKHhzKSB7XG4gICAgICBpZiAoaXNBcnJheSh4cykpIHtcbiAgICAgICAgcmV0dXJuIHhzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFt4c107XG4gICAgICB9XG4gICAgfSxcbiAgICBjb250YWluczogZnVuY3Rpb24oeHMsIHgpIHtcbiAgICAgIHJldHVybiBfLmluZGV4T2YoeHMsIHgpICE9PSAtMTtcbiAgICB9LFxuICAgIGlkOiBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9LFxuICAgIGxhc3Q6IGZ1bmN0aW9uKHhzKSB7XG4gICAgICByZXR1cm4geHNbeHMubGVuZ3RoIC0gMV07XG4gICAgfSxcbiAgICBhbGw6IGZ1bmN0aW9uKHhzLCBmKSB7XG4gICAgICB2YXIgeCwgX2ksIF9sZW47XG4gICAgICBpZiAoZiA9PSBudWxsKSB7XG4gICAgICAgIGYgPSBfLmlkO1xuICAgICAgfVxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB4cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB4ID0geHNbX2ldO1xuICAgICAgICBpZiAoIWYoeCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gICAgYW55OiBmdW5jdGlvbih4cywgZikge1xuICAgICAgdmFyIHgsIF9pLCBfbGVuO1xuICAgICAgaWYgKGYgPT0gbnVsbCkge1xuICAgICAgICBmID0gXy5pZDtcbiAgICAgIH1cbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0geHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgeCA9IHhzW19pXTtcbiAgICAgICAgaWYgKGYoeCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgd2l0aG91dDogZnVuY3Rpb24oeCwgeHMpIHtcbiAgICAgIHJldHVybiBfLmZpbHRlcigoZnVuY3Rpb24oeSkge1xuICAgICAgICByZXR1cm4geSAhPT0geDtcbiAgICAgIH0pLCB4cyk7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uKHgsIHhzKSB7XG4gICAgICB2YXIgaTtcbiAgICAgIGkgPSBfLmluZGV4T2YoeHMsIHgpO1xuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICByZXR1cm4geHMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZm9sZDogZnVuY3Rpb24oeHMsIHNlZWQsIGYpIHtcbiAgICAgIHZhciB4LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0geHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgeCA9IHhzW19pXTtcbiAgICAgICAgc2VlZCA9IGYoc2VlZCwgeCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2VlZDtcbiAgICB9LFxuICAgIGZsYXRNYXA6IGZ1bmN0aW9uKGYsIHhzKSB7XG4gICAgICByZXR1cm4gXy5mb2xkKHhzLCBbXSwgKGZ1bmN0aW9uKHlzLCB4KSB7XG4gICAgICAgIHJldHVybiB5cy5jb25jYXQoZih4KSk7XG4gICAgICB9KSk7XG4gICAgfSxcbiAgICBjYWNoZWQ6IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhbHVlID0gTm9uZTtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBOb25lKSB7XG4gICAgICAgICAgdmFsdWUgPSBmKCk7XG4gICAgICAgICAgZiA9IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9O1xuICAgIH0sXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIGV4LCBpbnRlcm5hbHMsIGtleSwgdmFsdWU7XG4gICAgICB0cnkge1xuICAgICAgICByZWN1cnNpb25EZXB0aCsrO1xuICAgICAgICBpZiAob2JqID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gXCJ1bmRlZmluZWRcIjtcbiAgICAgICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKG9iaikpIHtcbiAgICAgICAgICByZXR1cm4gXCJmdW5jdGlvblwiO1xuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICAgIGlmIChyZWN1cnNpb25EZXB0aCA+IDUpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlsuLl1cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFwiW1wiICsgXy5tYXAoXy50b1N0cmluZywgb2JqKS50b1N0cmluZygpICsgXCJdXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoKChvYmogIT0gbnVsbCA/IG9iai50b1N0cmluZyA6IHZvaWQgMCkgIT0gbnVsbCkgJiYgb2JqLnRvU3RyaW5nICE9PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKSB7XG4gICAgICAgICAgcmV0dXJuIG9iai50b1N0cmluZygpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBpZiAocmVjdXJzaW9uRGVwdGggPiA1KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ7Li59XCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGludGVybmFscyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBfcmVzdWx0cztcbiAgICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgaWYgKCFfX2hhc1Byb3AuY2FsbChvYmosIGtleSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB2YWx1ZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgICAgICAgZXggPSBfZXJyb3I7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICBfcmVzdWx0cy5wdXNoKF8udG9TdHJpbmcoa2V5KSArIFwiOlwiICsgXy50b1N0cmluZyh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgcmV0dXJuIFwie1wiICsgaW50ZXJuYWxzICsgXCJ9XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVjdXJzaW9uRGVwdGgtLTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmVjdXJzaW9uRGVwdGggPSAwO1xuXG4gIEJhY29uLl8gPSBfO1xuXG4gIEJhY29uLnNjaGVkdWxlciA9IHtcbiAgICBzZXRUaW1lb3V0OiBmdW5jdGlvbihmLCBkKSB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmLCBkKTtcbiAgICB9LFxuICAgIHNldEludGVydmFsOiBmdW5jdGlvbihmLCBpKSB7XG4gICAgICByZXR1cm4gc2V0SW50ZXJ2YWwoZiwgaSk7XG4gICAgfSxcbiAgICBjbGVhckludGVydmFsOiBmdW5jdGlvbihpZCkge1xuICAgICAgcmV0dXJuIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgIH0sXG4gICAgbm93OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKCh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZSAhPT0gbnVsbCkgJiYgKGRlZmluZS5hbWQgIT0gbnVsbCkpIHtcbiAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEJhY29uO1xuICAgIH0pO1xuICAgIHRoaXMuQmFjb24gPSBCYWNvbjtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwpICYmIChtb2R1bGUuZXhwb3J0cyAhPSBudWxsKSkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gQmFjb247XG4gICAgQmFjb24uQmFjb24gPSBCYWNvbjtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLkJhY29uID0gQmFjb247XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
