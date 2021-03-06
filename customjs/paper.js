/*!
 * Paper.js v0.9.16 - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2014, Juerg Lehni & Jonathan Puckey
 * http://scratchdisk.com/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 * Date: Thu Mar 13 17:48:12 2014 +0100
 *
 ***
 *
 * Straps.js - Class inheritance library with support for bean-style accessors
 *
 * Copyright (c) 2006 - 2013 Juerg Lehni
 * http://scratchdisk.com/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * Acorn.js
 * http://marijnhaverbeke.nl/acorn/
 *
 * Acorn is a tiny, fast JavaScript parser written in JavaScript,
 * created by Marijn Haverbeke and released under an MIT license.
 *
 */

var paper = new function(undefined) {

var Base = new function() {
	var hidden = /^(statics|preserve|enumerable|prototype|toString|valueOf)$/,

		forEach = [].forEach || function(iter, bind) {
			for (var i = 0, l = this.length; i < l; i++)
				iter.call(bind, this[i], i, this);
		},

		forIn = function(iter, bind) {
			for (var i in this)
				if (this.hasOwnProperty(i))
					iter.call(bind, this[i], i, this);
		},

		create = Object.create || function(proto) {
			return { __proto__: proto };
		},

		describe = Object.getOwnPropertyDescriptor || function(obj, name) {
			var get = obj.__lookupGetter__ && obj.__lookupGetter__(name);
			return get
					? { get: get, set: obj.__lookupSetter__(name),
						enumerable: true, configurable: true }
					: obj.hasOwnProperty(name)
						? { value: obj[name], enumerable: true,
							configurable: true, writable: true }
						: null;
		},

		_define = Object.defineProperty || function(obj, name, desc) {
			if ((desc.get || desc.set) && obj.__defineGetter__) {
				if (desc.get)
					obj.__defineGetter__(name, desc.get);
				if (desc.set)
					obj.__defineSetter__(name, desc.set);
			} else {
				obj[name] = desc.value;
			}
			return obj;
		},

		define = function(obj, name, desc) {
			delete obj[name];
			return _define(obj, name, desc);
		};

	function inject(dest, src, enumerable, base, preserve) {
		var beans;

		function field(name, val, dontCheck) {
			var val = val || (val = describe(src, name))
					&& (val.get ? val : val.value);
			if (typeof val === 'string' && val[0] === '#')
				val = dest[val.substring(1)] || val;
			var isFunc = typeof val === 'function',
				res = val,
				prev = preserve || isFunc
					? (val && val.get ? name in dest : dest[name]) : null,
				bean;
			if ((dontCheck || val !== undefined && src.hasOwnProperty(name))
					&& (!preserve || !prev)) {
				if (isFunc && prev)
					val.base = prev;
				if (isFunc && beans
						&& (bean = name.match(/^([gs]et|is)(([A-Z])(.*))$/)))
					beans[bean[3].toLowerCase() + bean[4]] = bean[2];
				if (!res || isFunc || !res.get || typeof res.get !== 'function'
						|| !Base.isPlainObject(res))
					res = { value: res, writable: true };
				if ((describe(dest, name)
						|| { configurable: true }).configurable) {
					res.configurable = true;
					res.enumerable = enumerable;
				}
				define(dest, name, res);
			}
		}
		if (src) {
			beans = {};
			for (var name in src)
				if (src.hasOwnProperty(name) && !hidden.test(name))
					field(name, null, true);
			field('toString');
			field('valueOf');
			for (var name in beans) {
				var part = beans[name],
					set = dest['set' + part],
					get = dest['get' + part] || set && dest['is' + part];
				if (get && (get.length === 0 || set))
					field(name, { get: get, set: set }, true);
			}
		}
		return dest;
	}

	function each(obj, iter, bind) {
		if (obj)
			('length' in obj && !obj.getLength
					&& typeof obj.length === 'number'
				? forEach
				: forIn).call(obj, iter, bind = bind || obj);
		return bind;
	}

	function copy(dest, source) {
		for (var i in source)
			if (source.hasOwnProperty(i))
				dest[i] = source[i];
		return dest;
	}

	return inject(function Base() {
		for (var i = 0, l = arguments.length; i < l; i++)
			copy(this, arguments[i]);
	}, {
		inject: function(src) {
			if (src) {
				var proto = this.prototype,
					base = Object.getPrototypeOf(proto).constructor,
					statics = src.statics === true ? src : src.statics;
				if (statics != src)
					inject(proto, src, src.enumerable, base && base.prototype,
							src.preserve);
				inject(this, statics, true, base, src.preserve);
			}
			for (var i = 1, l = arguments.length; i < l; i++)
				this.inject(arguments[i]);
			return this;
		},

		extend: function() {
			var base = this,
				ctor;
			for (var i = 0, l = arguments.length; i < l; i++)
				if (ctor = arguments[i].initialize)
					break;
			ctor = ctor || function() {
				base.apply(this, arguments);
			};
			ctor.prototype = create(this.prototype);
			ctor.base = base;
			define(ctor.prototype, 'constructor',
					{ value: ctor, writable: true, configurable: true });
			inject(ctor, this, true);
			return arguments.length ? this.inject.apply(ctor, arguments) : ctor;
		}
	}, true).inject({
		inject: function() {
			for (var i = 0, l = arguments.length; i < l; i++)
				inject(this, arguments[i], arguments[i].enumerable);
			return this;
		},

		extend: function() {
			var res = create(this);
			return res.inject.apply(res, arguments);
		},

		each: function(iter, bind) {
			return each(this, iter, bind);
		},

		clone: function() {
			return new this.constructor(this);
		},

		statics: {
			each: each,
			create: create,
			define: define,
			describe: describe,
			copy: copy,

			clone: function(obj) {
				return copy(new obj.constructor(), obj);
			},

			isPlainObject: function(obj) {
				var ctor = obj != null && obj.constructor;
				return ctor && (ctor === Object || ctor === Base
						|| ctor.name === 'Object');
			},

			pick: function() {
				for (var i = 0, l = arguments.length; i < l; i++)
					if (arguments[i] !== undefined)
						return arguments[i];
				return null;
			}
		}
	});
};

if (typeof module !== 'undefined')
	module.exports = Base;

Base.inject({
	toString: function() {
		return this._id != null
			?  (this._class || 'Object') + (this._name
				? " '" + this._name + "'"
				: ' @' + this._id)
			: '{ ' + Base.each(this, function(value, key) {
				if (!/^_/.test(key)) {
					var type = typeof value;
					this.push(key + ': ' + (type === 'number'
							? Formatter.instance.number(value)
							: type === 'string' ? "'" + value + "'" : value));
				}
			}, []).join(', ') + ' }';
	},

	exportJSON: function(options) {
		return Base.exportJSON(this, options);
	},

	toJSON: function() {
		return Base.serialize(this);
	},

	_set: function(props, exclude) {
		if (props && Base.isPlainObject(props)) {
			var orig = props._filtering || props;
			for (var key in orig) {
				if (key in this && orig.hasOwnProperty(key)
						&& (!exclude || !exclude[key])) {
					var value = props[key];
					if (value !== undefined)
						this[key] = value;
				}
			}
			return true;
		}
	},

	statics: {

		exports: {
			enumerable: true 
		},

		extend: function extend() {
			var res = extend.base.apply(this, arguments),
				name = res.prototype._class;
			if (name && !Base.exports[name])
				Base.exports[name] = res;
			return res;
		},

		equals: function(obj1, obj2) {
			function checkKeys(o1, o2) {
				for (var i in o1)
					if (o1.hasOwnProperty(i) && !o2.hasOwnProperty(i))
						return false;
				return true;
			}
			if (obj1 === obj2)
				return true;
			if (obj1 && obj1.equals)
				return obj1.equals(obj2);
			if (obj2 && obj2.equals)
				return obj2.equals(obj1);
			if (Array.isArray(obj1) && Array.isArray(obj2)) {
				if (obj1.length !== obj2.length)
					return false;
				for (var i = 0, l = obj1.length; i < l; i++) {
					if (!Base.equals(obj1[i], obj2[i]))
						return false;
				}
				return true;
			}
			if (obj1 && typeof obj1 === 'object'
					&& obj2 && typeof obj2 === 'object') {
				if (!checkKeys(obj1, obj2) || !checkKeys(obj2, obj1))
					return false;
				for (var i in obj1) {
					if (obj1.hasOwnProperty(i)
							&& !Base.equals(obj1[i], obj2[i]))
						return false;
				}
				return true;
			}
			return false;
		},

		read: function(list, start, options, length) {
			if (this === Base) {
				var value = this.peek(list, start);
				list.__index++;
				return value;
			}
			var proto = this.prototype,
				readIndex = proto._readIndex,
				index = start || readIndex && list.__index || 0;
			if (!length)
				length = list.length - index;
			var obj = list[index];
			if (obj instanceof this
				|| options && options.readNull && obj == null && length <= 1) { if (readindex) list.__index="index" + 1; return obj && options options.clone ? obj.clone() : obj; } obj.__read="true;" index> 0 || length < list.length
				? Array.prototype.slice.call(list, index, index + length)
				: list) || obj;
			if (readIndex) {
				list.__index = index + obj.__read;
				obj.__read = undefined;
			}
			return obj;
		},

		peek: function(list, start) {
			return list[list.__index = start || list.__index || 0];
		},

		remain: function(list) {
			return list.length - (list.__index || 0);
		},

		readAll: function(list, start, options) {
			var res = [],
				entry;
			for (var i = start || 0, l = list.length; i < l; i++) {
				res.push(Array.isArray(entry = list[i])
						? this.read(entry, 0, options)
						: this.read(list, i, options, 1));
			}
			return res;
		},

		readNamed: function(list, name, start, options, length) {
			var value = this.getNamed(list, name),
				hasObject = value !== undefined;
			if (hasObject) {
				var filtered = list._filtered;
				if (!filtered) {
					filtered = list._filtered = Base.create(list[0]);
					filtered._filtering = list[0];
				}
				filtered[name] = undefined;
			}
			return this.read(hasObject ? [value] : list, start, options, length);
		},

		getNamed: function(list, name) {
			var arg = list[0];
			if (list._hasObject === undefined)
				list._hasObject = list.length === 1 && Base.isPlainObject(arg);
			if (list._hasObject)
				return name ? arg[name] : list._filtered || arg;
		},

		hasNamed: function(list, name) {
			return !!this.getNamed(list, name);
		},

		isPlainValue: function(obj) {
			return this.isPlainObject(obj) || Array.isArray(obj);
		},

		serialize: function(obj, options, compact, dictionary) {
			options = options || {};

			var root = !dictionary,
				res;
			if (root) {
				options.formatter = new Formatter(options.precision);
				dictionary = {
					length: 0,
					definitions: {},
					references: {},
					add: function(item, create) {
						var id = '#' + item._id,
							ref = this.references[id];
						if (!ref) {
							this.length++;
							var res = create.call(item),
								name = item._class;
							if (name && res[0] !== name)
								res.unshift(name);
							this.definitions[id] = res;
							ref = this.references[id] = [id];
						}
						return ref;
					}
				};
			}
			if (obj && obj._serialize) {
				res = obj._serialize(options, dictionary);
				var name = obj._class;
				if (name && !compact && !res._compact && res[0] !== name)
					res.unshift(name);
			} else if (Array.isArray(obj)) {
				res = [];
				for (var i = 0, l = obj.length; i < l; i++)
					res[i] = Base.serialize(obj[i], options, compact,
							dictionary);
				if (compact)
					res._compact = true;
			} else if (Base.isPlainObject(obj)) {
				res = {};
				for (var i in obj)
					if (obj.hasOwnProperty(i))
						res[i] = Base.serialize(obj[i], options, compact,
								dictionary);
			} else if (typeof obj === 'number') {
				res = options.formatter.number(obj, options.precision);
			} else {
				res = obj;
			}
			return root && dictionary.length > 0
					? [['dictionary', dictionary.definitions], res]
					: res;
		},

		deserialize: function(json, create, _data) {
			var res = json,
				isRoot = !_data;
			_data = _data || {};
			if (Array.isArray(json)) {
				var type = json[0],
					isDictionary = type === 'dictionary';
				if (!isDictionary) {
					if (_data.dictionary && json.length == 1 && /^#/.test(type))
						return _data.dictionary[type];
					type = Base.exports[type];
				}
				res = [];
				for (var i = type ? 1 : 0, l = json.length; i < l; i++)
					res.push(Base.deserialize(json[i], create, _data));
				if (isDictionary) {
					_data.dictionary = res[0];
				} else if (type) {
					var args = res;
					if (create) {
						res = create(type, args, isRoot);
					} else {
						res = Base.create(type.prototype);
						type.apply(res, args);
					}
				}
			} else if (Base.isPlainObject(json)) {
				res = {};
				for (var key in json)
					res[key] = Base.deserialize(json[key], create, _data);
			}
			return res;
		},

		exportJSON: function(obj, options) {
			var json = Base.serialize(obj, options);
			return options && options.asString === false
					? json
					: JSON.stringify(json);
		},

		importJSON: function(json, target) {
			return Base.deserialize(
					typeof json === 'string' ? JSON.parse(json) : json,
					function(type, args, isRoot) {
						var obj = target && target.constructor === type
								? target
								: Base.create(type.prototype),
							isTarget = obj === target;
						if (!isRoot && args.length === 1 && obj instanceof Item
								&& (!(obj instanceof Layer) || isTarget)) {
							var arg = args[0];
							if (Base.isPlainObject(arg))
								arg.insert = false;
						}
						type.apply(obj, args);
						if (isTarget)
							target = null;
						return obj;
					});
		},

		splice: function(list, items, index, remove) {
			var amount = items && items.length,
				append = index === undefined;
			index = append ? list.length : index;
			if (index > list.length)
				index = list.length;
			for (var i = 0; i < amount; i++)
				items[i]._index = index + i;
			if (append) {
				list.push.apply(list, items);
				return [];
			} else {
				var args = [index, remove];
				if (items)
					args.push.apply(args, items);
				var removed = list.splice.apply(list, args);
				for (var i = 0, l = removed.length; i < l; i++)
					removed[i]._index = undefined;
				for (var i = index + amount, l = list.length; i < l; i++)
					list[i]._index = i;
				return removed;
			}
		},

		capitalize: function(str) {
			return str.replace(/\b[a-z]/g, function(match) {
				return match.toUpperCase();
			});
		},

		camelize: function(str) {
			return str.replace(/-(.)/g, function(all, chr) {
				return chr.toUpperCase();
			});
		},

		hyphenate: function(str) {
			return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		}
	}
});

var Callback = {
	attach: function(type, func) {
		if (typeof type !== 'string') {
			Base.each(type, function(value, key) {
				this.attach(key, value);
			}, this);
			return;
		}
		var entry = this._eventTypes[type];
		if (entry) {
			var handlers = this._handlers = this._handlers || {};
			handlers = handlers[type] = handlers[type] || [];
			if (handlers.indexOf(func) == -1) { 
				handlers.push(func);
				if (entry.install && handlers.length == 1)
					entry.install.call(this, type);
			}
		}
	},

	detach: function(type, func) {
		if (typeof type !== 'string') {
			Base.each(type, function(value, key) {
				this.detach(key, value);
			}, this);
			return;
		}
		var entry = this._eventTypes[type],
			handlers = this._handlers && this._handlers[type],
			index;
		if (entry && handlers) {
			if (!func || (index = handlers.indexOf(func)) != -1
					&& handlers.length == 1) {
				if (entry.uninstall)
					entry.uninstall.call(this, type);
				delete this._handlers[type];
			} else if (index != -1) {
				handlers.splice(index, 1);
			}
		}
	},

	once: function(type, func) {
		this.attach(type, function() {
			func.apply(this, arguments);
			this.detach(type, func);
		});
	},

	fire: function(type, event) {
		var handlers = this._handlers && this._handlers[type];
		if (!handlers)
			return false;
		var args = [].slice.call(arguments, 1),
			that = this;
		for (var i = 0, l = handlers.length; i < l; i++) {
			if (handlers[i].apply(that, args) === false
					&& event && event.stop) {
				event.stop();
				break;
			}
		}
		return true;
	},

	responds: function(type) {
		return !!(this._handlers && this._handlers[type]);
	},

	on: '#attach',
	off: '#detach',
	trigger: '#fire',

	_installEvents: function(install) {
		var handlers = this._handlers,
			key = install ? 'install' : 'uninstall';
		for (var type in handlers) {
			if (handlers[type].length > 0) {
				var entry = this._eventTypes[type],
					func = entry[key];
				if (func)
					func.call(this, type);
			}
		}
	},

	statics: {
		inject: function inject() {
			for (var i = 0, l = arguments.length; i < l; i++) {
				var src = arguments[i],
					events = src._events;
				if (events) {
					var types = {};
					Base.each(events, function(entry, key) {
						var isString = typeof entry === 'string',
							name = isString ? entry : key,
							part = Base.capitalize(name),
							type = name.substring(2).toLowerCase();
						types[type] = isString ? {} : entry;
						name = '_' + name;
						src['get' + part] = function() {
							return this[name];
						};
						src['set' + part] = function(func) {
							var prev = this[name];
							if (prev)
								this.detach(type, prev);
							if (func)
								this.attach(type, func);
							this[name] = func;
						};
					});
					src._eventTypes = types;
				}
				inject.base.call(this, src);
			}
			return this;
		}
	}
};

var PaperScope = Base.extend({
	_class: 'PaperScope',

	initialize: function PaperScope(script) {
		paper = this;
		this.settings = {
			applyMatrix: true,
			handleSize: 4,
			hitTolerance: 0
		};
		this.project = null;
		this.projects = [];
		this.tools = [];
		this.palettes = [];
		this._id = script && (script.getAttribute('id') || script.src)
				|| ('paperscope-' + (PaperScope._id++));
		if (script)
			script.setAttribute('id', this._id);
		PaperScope._scopes[this._id] = this;
		if (!this.support) {
			var ctx = CanvasProvider.getContext(1, 1);
			PaperScope.prototype.support = {
				nativeDash: 'setLineDash' in ctx || 'mozDash' in ctx,
				nativeBlendModes: BlendMode.nativeModes
			};
			CanvasProvider.release(ctx);
		}
	},

	version: '0.9.16',

	getView: function() {
		return this.project && this.project.view;
	},

	getPaper: function() {
		return this;
	},

	execute: function(code) {
		paper.PaperScript.execute(code, this);
		View.updateFocus();
	},

	install: function(scope) {
		var that = this;
		Base.each(['project', 'view', 'tool'], function(key) {
			Base.define(scope, key, {
				configurable: true,
				get: function() {
					return that[key];
				}
			});
		});
		for (var key in this)
			if (!/^_/.test(key) && this[key])
				scope[key] = this[key];
	},

	setup: function(canvas) {
		paper = this;
		this.project = new Project(canvas);
		return this;
	},

	activate: function() {
		paper = this;
	},

	clear: function() {
		for (var i = this.projects.length - 1; i >= 0; i--)
			this.projects[i].remove();
		for (var i = this.tools.length - 1; i >= 0; i--)
			this.tools[i].remove();
		for (var i = this.palettes.length - 1; i >= 0; i--)
			this.palettes[i].remove();
	},

	remove: function() {
		this.clear();
		delete PaperScope._scopes[this._id];
	},

	statics: new function() {
		function handleAttribute(name) {
			name += 'Attribute';
			return function(el, attr) {
				return el[name](attr) || el[name]('data-paper-' + attr);
			};
		}

		return {
			_scopes: {},
			_id: 0,

			get: function(id) {
				if (id && id.getAttribute)
					id = id.getAttribute('id');
				return this._scopes[id] || null;
			},

			getAttribute: handleAttribute('get'),
			hasAttribute: handleAttribute('has')
		};
	}
});

var PaperScopeItem = Base.extend(Callback, {

	initialize: function(activate) {
		this._scope = paper;
		this._index = this._scope[this._list].push(this) - 1;
		if (activate || !this._scope[this._reference])
			this.activate();
	},

	activate: function() {
		if (!this._scope)
			return false;
		var prev = this._scope[this._reference];
		if (prev && prev !== this)
			prev.fire('deactivate');
		this._scope[this._reference] = this;
		this.fire('activate', prev);
		return true;
	},

	isActive: function() {
		return this._scope[this._reference] === this;
	},

	remove: function() {
		if (this._index == null)
			return false;
		Base.splice(this._scope[this._list], null, this._index, 1);
		if (this._scope[this._reference] == this)
			this._scope[this._reference] = null;
		this._scope = null;
		return true;
	}
});

var Formatter = Base.extend({
	initialize: function(precision) {
		this.precision = precision || 5;
		this.multiplier = Math.pow(10, this.precision);
	},

	number: function(val) {
		return Math.round(val * this.multiplier) / this.multiplier;
	},

	point: function(val, separator) {
		return this.number(val.x) + (separator || ',') + this.number(val.y);
	},

	size: function(val, separator) {
		return this.number(val.width) + (separator || ',')
				+ this.number(val.height);
	},

	rectangle: function(val, separator) {
		return this.point(val, separator) + (separator || ',')
				+ this.size(val, separator);
	}
});

Formatter.instance = new Formatter();

var Numerical = new function() {

	var abscissas = [
		[  0.5773502691896257645091488],
		[0,0.7745966692414833770358531],
		[  0.3399810435848562648026658,0.8611363115940525752239465],
		[0,0.5384693101056830910363144,0.9061798459386639927976269],
		[  0.2386191860831969086305017,0.6612093864662645136613996,0.9324695142031520278123016],
		[0,0.4058451513773971669066064,0.7415311855993944398638648,0.9491079123427585245261897],
		[  0.1834346424956498049394761,0.5255324099163289858177390,0.7966664774136267395915539,0.9602898564975362316835609],
		[0,0.3242534234038089290385380,0.6133714327005903973087020,0.8360311073266357942994298,0.9681602395076260898355762],
		[  0.1488743389816312108848260,0.4333953941292471907992659,0.6794095682990244062343274,0.8650633666889845107320967,0.9739065285171717200779640],
		[0,0.2695431559523449723315320,0.5190961292068118159257257,0.7301520055740493240934163,0.8870625997680952990751578,0.9782286581460569928039380],
		[  0.1252334085114689154724414,0.3678314989981801937526915,0.5873179542866174472967024,0.7699026741943046870368938,0.9041172563704748566784659,0.9815606342467192506905491],
		[0,0.2304583159551347940655281,0.4484927510364468528779129,0.6423493394403402206439846,0.8015780907333099127942065,0.9175983992229779652065478,0.9841830547185881494728294],
		[  0.1080549487073436620662447,0.3191123689278897604356718,0.5152486363581540919652907,0.6872929048116854701480198,0.8272013150697649931897947,0.9284348836635735173363911,0.9862838086968123388415973],
		[0,0.2011940939974345223006283,0.3941513470775633698972074,0.5709721726085388475372267,0.7244177313601700474161861,0.8482065834104272162006483,0.9372733924007059043077589,0.9879925180204854284895657],
		[  0.0950125098376374401853193,0.2816035507792589132304605,0.4580167776572273863424194,0.6178762444026437484466718,0.7554044083550030338951012,0.8656312023878317438804679,0.9445750230732325760779884,0.9894009349916499325961542]
	];

	var weights = [
		[1],
		[0.8888888888888888888888889,0.5555555555555555555555556],
		[0.6521451548625461426269361,0.3478548451374538573730639],
		[0.5688888888888888888888889,0.4786286704993664680412915,0.2369268850561890875142640],
		[0.4679139345726910473898703,0.3607615730481386075698335,0.1713244923791703450402961],
		[0.4179591836734693877551020,0.3818300505051189449503698,0.2797053914892766679014678,0.1294849661688696932706114],
		[0.3626837833783619829651504,0.3137066458778872873379622,0.2223810344533744705443560,0.1012285362903762591525314],
		[0.3302393550012597631645251,0.3123470770400028400686304,0.2606106964029354623187429,0.1806481606948574040584720,0.0812743883615744119718922],
		[0.2955242247147528701738930,0.2692667193099963550912269,0.2190863625159820439955349,0.1494513491505805931457763,0.0666713443086881375935688],
		[0.2729250867779006307144835,0.2628045445102466621806889,0.2331937645919904799185237,0.1862902109277342514260976,0.1255803694649046246346943,0.0556685671161736664827537],
		[0.2491470458134027850005624,0.2334925365383548087608499,0.2031674267230659217490645,0.1600783285433462263346525,0.1069393259953184309602547,0.0471753363865118271946160],
		[0.2325515532308739101945895,0.2262831802628972384120902,0.2078160475368885023125232,0.1781459807619457382800467,0.1388735102197872384636018,0.0921214998377284479144218,0.0404840047653158795200216],
		[0.2152638534631577901958764,0.2051984637212956039659241,0.1855383974779378137417166,0.1572031671581935345696019,0.1215185706879031846894148,0.0801580871597602098056333,0.0351194603317518630318329],
		[0.2025782419255612728806202,0.1984314853271115764561183,0.1861610000155622110268006,0.1662692058169939335532009,0.1395706779261543144478048,0.1071592204671719350118695,0.0703660474881081247092674,0.0307532419961172683546284],
		[0.1894506104550684962853967,0.1826034150449235888667637,0.1691565193950025381893121,0.1495959888165767320815017,0.1246289712555338720524763,0.0951585116824927848099251,0.0622535239386478928628438,0.0271524594117540948517806]
	];

	var abs = Math.abs,
		sqrt = Math.sqrt,
		pow = Math.pow,
		cos = Math.cos,
		PI = Math.PI,
		TOLERANCE = 10e-6,
		EPSILON = 10e-12;

	function setupRoots(roots, min, max) {
		var unbound = min === undefined,
			minE = min - EPSILON,
			maxE = max + EPSILON,
			count = 0;
		return function(root) {
			if (unbound || root > minE && root < maxE)
				roots[count++] = root < min ? min : root > max ? max : root;
			return count;
		};
	}

	return {
		TOLERANCE: TOLERANCE,
		EPSILON: EPSILON,
		KAPPA: 4 * (sqrt(2) - 1) / 3,

		isZero: function(val) {
			return abs(val) <= epsilon; }, integrate: function(f, a, b, n) { var x="abscissas[n" - 2], w="weights[n" a="0.5" * (b a), b="A" + i="0," m="(n" 1)>> 1,
				sum = n & 1 ? w[i++] * f(B) : 0; 
			while (i < m) {
				var Ax = A * x[i];
				sum += w[i++] * (f(B + Ax) + f(B - Ax));
			}
			return A * sum;
		},

		findRoot: function(f, df, x, a, b, n, tolerance) {
			for (var i = 0; i < n; i++) {
				var fx = f(x),
					dx = fx / df(x),
					nx = x - dx;
				if (abs(dx) < tolerance)
					return nx;
				if (fx > 0) {
					b = x;
					x = nx <= a ? 0.5 * (a + b) : nx; } else { x="nx">= b ? 0.5 * (a + b) : nx;
				}
			}
			return x;
		},

		solveQuadratic: function(a, b, c, roots, min, max) {
			var add = setupRoots(roots, min, max);

			if (abs(a) < EPSILON) {
				if (abs(b) >= EPSILON)
					return add(-c / b);
				return abs(c) < EPSILON ? -1 : 0; 
			}
			var p = b / (2 * a);
			var q = c / a;
			var p2 = p * p;
			if (p2 < q - EPSILON)
				return 0;
			var s = p2 > q ? sqrt(p2 - q) : 0,
				count = add(s - p);
			if (s > 0)
				count = add(-s - p);
			return count;
		},

		solveCubic: function(a, b, c, d, roots, min, max) {
			if (abs(a) < EPSILON)
				return Numerical.solveQuadratic(b, c, d, roots, min, max);

			b /= a;
			c /= a;
			d /= a;
			var add = setupRoots(roots, min, max),
				bb = b * b,
				p = (bb - 3 * c) / 9,
				q = (2 * bb * b - 9 * b * c + 27 * d) / 54,
				ppp = p * p * p,
				D = q * q - ppp;
			b /= 3;
			if (abs(D) < EPSILON) {
				if (abs(q) < EPSILON) 
					return add(-b);
				var sqp = sqrt(p),
					snq = q > 0 ? 1 : -1;
				add(-snq * 2 * sqp - b);
				return add(snq * sqp - b);
			}
			if (D < 0) { 
				var sqp = sqrt(p),
					phi = Math.acos(q / (sqp * sqp * sqp)) / 3,
					t = -2 * sqp,
					o = 2 * PI / 3;
				add(t * cos(phi) - b);
				add(t * cos(phi + o) - b);
				return add(t * cos(phi - o) - b);
			}
			var A = (q > 0 ? -1 : 1) * pow(abs(q) + sqrt(D), 1 / 3);
			return add(A + p / A - b);
		}
	};
};

var Point = Base.extend({
	_class: 'Point',
	_readIndex: true,

	initialize: function Point(arg0, arg1) {
		var type = typeof arg0;
		if (type === 'number') {
			var hasY = typeof arg1 === 'number';
			this.x = arg0;
			this.y = hasY ? arg1 : arg0;
			if (this.__read)
				this.__read = hasY ? 2 : 1;
		} else if (type === 'undefined' || arg0 === null) {
			this.x = this.y = 0;
			if (this.__read)
				this.__read = arg0 === null ? 1 : 0;
		} else {
			if (Array.isArray(arg0)) {
				this.x = arg0[0];
				this.y = arg0.length > 1 ? arg0[1] : arg0[0];
			} else if (arg0.x != null) {
				this.x = arg0.x;
				this.y = arg0.y;
			} else if (arg0.width != null) {
				this.x = arg0.width;
				this.y = arg0.height;
			} else if (arg0.angle != null) {
				this.x = arg0.length;
				this.y = 0;
				this.setAngle(arg0.angle);
			} else {
				this.x = this.y = 0;
				if (this.__read)
					this.__read = 0;
			}
			if (this.__read)
				this.__read = 1;
		}
	},

	set: function(x, y) {
		this.x = x;
		this.y = y;
		return this;
	},

	equals: function(point) {
		return this === point || point
				&& (this.x === point.x && this.y === point.y
					|| Array.isArray(point)
						&& this.x === point[0] && this.y === point[1])
				|| false;
	},

	clone: function() {
		return new Point(this.x, this.y);
	},

	toString: function() {
		var f = Formatter.instance;
		return '{ x: ' + f.number(this.x) + ', y: ' + f.number(this.y) + ' }';
	},

	_serialize: function(options) {
		var f = options.formatter;
		return [f.number(this.x), f.number(this.y)];
	},

	add: function() {
		var point = Point.read(arguments);
		return new Point(this.x + point.x, this.y + point.y);
	},

	subtract: function() {
		var point = Point.read(arguments);
		return new Point(this.x - point.x, this.y - point.y);
	},

	multiply: function() {
		var point = Point.read(arguments);
		return new Point(this.x * point.x, this.y * point.y);
	},

	divide: function() {
		var point = Point.read(arguments);
		return new Point(this.x / point.x, this.y / point.y);
	},

	modulo: function() {
		var point = Point.read(arguments);
		return new Point(this.x % point.x, this.y % point.y);
	},

	negate: function() {
		return new Point(-this.x, -this.y);
	},

	transform: function(matrix) {
		return matrix ? matrix._transformPoint(this) : this;
	},

	getDistance: function(_point, squared) {
		var point = Point.read(arguments),
			x = point.x - this.x,
			y = point.y - this.y,
			d = x * x + y * y;
		squared = Base.read(arguments);
		return squared ? d : Math.sqrt(d);
	},

	getLength: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	setLength: function(length) {
		if (this.isZero()) {
			var angle = this._angle || 0;
			this.set(
				Math.cos(angle) * length,
				Math.sin(angle) * length
			);
		} else {
			var scale = length / this.getLength();
			if (Numerical.isZero(scale))
				this.getAngle();
			this.set(
				this.x * scale,
				this.y * scale
			);
		}
	},

	normalize: function(length) {
		if (length === undefined)
			length = 1;
		var current = this.getLength(),
			scale = current !== 0 ? length / current : 0,
			point = new Point(this.x * scale, this.y * scale);
		if (scale >= 0)
			point._angle = this._angle;
		return point;
	},

	getAngle: function() {
		return this.getAngleInRadians.apply(this, arguments) * 180 / Math.PI;
	},

	setAngle: function(angle) {
		this.setAngleInRadians.call(this, angle * Math.PI / 180);
	},

	getAngleInDegrees: '#getAngle',
	setAngleInDegrees: '#setAngle',

	getAngleInRadians: function() {
		if (!arguments.length) {
			return this.isZero()
					? this._angle || 0
					: this._angle = Math.atan2(this.y, this.x);
		} else {
			var point = Point.read(arguments),
				div = this.getLength() * point.getLength();
			if (Numerical.isZero(div)) {
				return NaN;
			} else {
				return Math.acos(this.dot(point) / div);
			}
		}
	},

	setAngleInRadians: function(angle) {
		this._angle = angle;
		if (!this.isZero()) {
			var length = this.getLength();
			this.set(
				Math.cos(angle) * length,
				Math.sin(angle) * length
			);
		}
	},

	getQuadrant: function() {
		return this.x >= 0 ? this.y >= 0 ? 1 : 4 : this.y >= 0 ? 2 : 3;
	},

	getDirectedAngle: function(_point) {
		var point = _point;
		point = Point.read(arguments);
		return Math.atan2(this.cross(point), this.dot(point)) * 180 / Math.PI;
	},

	rotate: function(angle, center) {
		if (angle === 0)
			return this.clone();
		angle = angle * Math.PI / 180;
		var point = center ? this.subtract(center) : this,
			s = Math.sin(angle),
			c = Math.cos(angle);
		point = new Point(
			point.x * c - point.y * s,
			point.x * s + point.y * c
		);
		return center ? point.add(center) : point;
	},

	isInside: function(rect) {
		return rect.contains(this);
	},

	isClose: function(point, tolerance) {
		return this.getDistance(point) < tolerance;
	},

	isColinear: function(point) {
		return Math.abs(this.cross(point)) < 0.00001;
	},

	isOrthogonal: function(point) {
		return Math.abs(this.dot(point)) < 0.00001;
	},

	isZero: function() {
		return Numerical.isZero(this.x) && Numerical.isZero(this.y);
	},

	isNaN: function() {
		return isNaN(this.x) || isNaN(this.y);
	},

	dot: function() {
		var point = Point.read(arguments);
		return this.x * point.x + this.y * point.y;
	},

	cross: function() {
		var point = Point.read(arguments);
		return this.x * point.y - this.y * point.x;
	},

	project: function() {
		var point = Point.read(arguments);
		if (point.isZero()) {
			return new Point(0, 0);
		} else {
			var scale = this.dot(point) / point.dot(point);
			return new Point(
				point.x * scale,
				point.y * scale
			);
		}
	},

	statics: {
		min: function() {
			var point1 = Point.read(arguments);
				point2 = Point.read(arguments);
			return new Point(
				Math.min(point1.x, point2.x),
				Math.min(point1.y, point2.y)
			);
		},

		max: function() {
			var point1 = Point.read(arguments);
				point2 = Point.read(arguments);
			return new Point(
				Math.max(point1.x, point2.x),
				Math.max(point1.y, point2.y)
			);
		},

		random: function() {
			return new Point(Math.random(), Math.random());
		}
	}
}, Base.each(['round', 'ceil', 'floor', 'abs'], function(name) {
	var op = Math[name];
	this[name] = function() {
		return new Point(op(this.x), op(this.y));
	};
}, {}));

var LinkedPoint = Point.extend({
	initialize: function Point(x, y, owner, setter) {
		this._x = x;
		this._y = y;
		this._owner = owner;
		this._setter = setter;
	},

	set: function(x, y, _dontNotify) {
		this._x = x;
		this._y = y;
		if (!_dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	getX: function() {
		return this._x;
	},

	setX: function(x) {
		this._x = x;
		this._owner[this._setter](this);
	},

	getY: function() {
		return this._y;
	},

	setY: function(y) {
		this._y = y;
		this._owner[this._setter](this);
	}
});

var Size = Base.extend({
	_class: 'Size',
	_readIndex: true,

	initialize: function Size(arg0, arg1) {
		var type = typeof arg0;
		if (type === 'number') {
			var hasHeight = typeof arg1 === 'number';
			this.width = arg0;
			this.height = hasHeight ? arg1 : arg0;
			if (this.__read)
				this.__read = hasHeight ? 2 : 1;
		} else if (type === 'undefined' || arg0 === null) {
			this.width = this.height = 0;
			if (this.__read)
				this.__read = arg0 === null ? 1 : 0;
		} else {
			if (Array.isArray(arg0)) {
				this.width = arg0[0];
				this.height = arg0.length > 1 ? arg0[1] : arg0[0];
			} else if (arg0.width != null) {
				this.width = arg0.width;
				this.height = arg0.height;
			} else if (arg0.x != null) {
				this.width = arg0.x;
				this.height = arg0.y;
			} else {
				this.width = this.height = 0;
				if (this.__read)
					this.__read = 0;
			}
			if (this.__read)
				this.__read = 1;
		}
	},

	set: function(width, height) {
		this.width = width;
		this.height = height;
		return this;
	},

	equals: function(size) {
		return size === this || size && (this.width === size.width
				&& this.height === size.height
				|| Array.isArray(size) && this.width === size[0]
					&& this.height === size[1]) || false;
	},

	clone: function() {
		return new Size(this.width, this.height);
	},

	toString: function() {
		var f = Formatter.instance;
		return '{ width: ' + f.number(this.width)
				+ ', height: ' + f.number(this.height) + ' }';
	},

	_serialize: function(options) {
		var f = options.formatter;
		return [f.number(this.width),
				f.number(this.height)];
	},

	add: function() {
		var size = Size.read(arguments);
		return new Size(this.width + size.width, this.height + size.height);
	},

	subtract: function() {
		var size = Size.read(arguments);
		return new Size(this.width - size.width, this.height - size.height);
	},

	multiply: function() {
		var size = Size.read(arguments);
		return new Size(this.width * size.width, this.height * size.height);
	},

	divide: function() {
		var size = Size.read(arguments);
		return new Size(this.width / size.width, this.height / size.height);
	},

	modulo: function() {
		var size = Size.read(arguments);
		return new Size(this.width % size.width, this.height % size.height);
	},

	negate: function() {
		return new Size(-this.width, -this.height);
	},

	isZero: function() {
		return Numerical.isZero(this.width) && Numerical.isZero(this.height);
	},

	isNaN: function() {
		return isNaN(this.width) || isNaN(this.height);
	},

	statics: {
		min: function(size1, size2) {
			return new Size(
				Math.min(size1.width, size2.width),
				Math.min(size1.height, size2.height));
		},

		max: function(size1, size2) {
			return new Size(
				Math.max(size1.width, size2.width),
				Math.max(size1.height, size2.height));
		},

		random: function() {
			return new Size(Math.random(), Math.random());
		}
	}
}, Base.each(['round', 'ceil', 'floor', 'abs'], function(name) {
	var op = Math[name];
	this[name] = function() {
		return new Size(op(this.width), op(this.height));
	};
}, {}));

var LinkedSize = Size.extend({
	initialize: function Size(width, height, owner, setter) {
		this._width = width;
		this._height = height;
		this._owner = owner;
		this._setter = setter;
	},

	set: function(width, height, _dontNotify) {
		this._width = width;
		this._height = height;
		if (!_dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	getWidth: function() {
		return this._width;
	},

	setWidth: function(width) {
		this._width = width;
		this._owner[this._setter](this);
	},

	getHeight: function() {
		return this._height;
	},

	setHeight: function(height) {
		this._height = height;
		this._owner[this._setter](this);
	}
});

var Rectangle = Base.extend({
	_class: 'Rectangle',
	_readIndex: true,

	initialize: function Rectangle(arg0, arg1, arg2, arg3) {
		var type = typeof arg0,
			read = 0;
		if (type === 'number') {
			this.x = arg0;
			this.y = arg1;
			this.width = arg2;
			this.height = arg3;
			read = 4;
		} else if (type === 'undefined' || arg0 === null) {
			this.x = this.y = this.width = this.height = 0;
			read = arg0 === null ? 1 : 0;
		} else if (arguments.length === 1) {
			if (Array.isArray(arg0)) {
				this.x = arg0[0];
				this.y = arg0[1];
				this.width = arg0[2];
				this.height = arg0[3];
				read = 1;
			} else if (arg0.x !== undefined || arg0.width !== undefined) {
				this.x = arg0.x || 0;
				this.y = arg0.y || 0;
				this.width = arg0.width || 0;
				this.height = arg0.height || 0;
				read = 1;
			} else if (arg0.from === undefined && arg0.to === undefined) {
				this.x = this.y = this.width = this.height = 0;
				this._set(arg0);
				read = 1;
			}
		}
		if (!read) {
			var point = Point.readNamed(arguments, 'from'),
				next = Base.peek(arguments);
			this.x = point.x;
			this.y = point.y;
			if (next && next.x !== undefined || Base.hasNamed(arguments, 'to')) {
				var to = Point.readNamed(arguments, 'to');
				this.width = to.x - point.x;
				this.height = to.y - point.y;
				if (this.width < 0) {
					this.x = to.x;
					this.width = -this.width;
				}
				if (this.height < 0) {
					this.y = to.y;
					this.height = -this.height;
				}
			} else {
				var size = Size.read(arguments);
				this.width = size.width;
				this.height = size.height;
			}
			read = arguments.__index;
		}
		if (this.__read)
			this.__read = read;
	},

	set: function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		return this;
	},

	clone: function() {
		return new Rectangle(this.x, this.y, this.width, this.height);
	},

	equals: function(rect) {
		var rt = Base.isPlainValue(rect)
				? Rectangle.read(arguments)
				: rect;
		return rt === this
				|| rt && this.x === rt.x && this.y === rt.y
					&& this.width === rt.width && this.height === rt.height
				|| false;
	},

	toString: function() {
		var f = Formatter.instance;
		return '{ x: ' + f.number(this.x)
				+ ', y: ' + f.number(this.y)
				+ ', width: ' + f.number(this.width)
				+ ', height: ' + f.number(this.height)
				+ ' }';
	},

	_serialize: function(options) {
		var f = options.formatter;
		return [f.number(this.x),
				f.number(this.y),
				f.number(this.width),
				f.number(this.height)];
	},

	getPoint: function(_dontLink) {
		var ctor = _dontLink ? Point : LinkedPoint;
		return new ctor(this.x, this.y, this, 'setPoint');
	},

	setPoint: function() {
		var point = Point.read(arguments);
		this.x = point.x;
		this.y = point.y;
	},

	getSize: function(_dontLink) {
		var ctor = _dontLink ? Size : LinkedSize;
		return new ctor(this.width, this.height, this, 'setSize');
	},

	setSize: function() {
		var size = Size.read(arguments);
		if (this._fixX)
			this.x += (this.width - size.width) * this._fixX;
		if (this._fixY)
			this.y += (this.height - size.height) * this._fixY;
		this.width = size.width;
		this.height = size.height;
		this._fixW = 1;
		this._fixH = 1;
	},

	getLeft: function() {
		return this.x;
	},

	setLeft: function(left) {
		if (!this._fixW)
			this.width -= left - this.x;
		this.x = left;
		this._fixX = 0;
	},

	getTop: function() {
		return this.y;
	},

	setTop: function(top) {
		if (!this._fixH)
			this.height -= top - this.y;
		this.y = top;
		this._fixY = 0;
	},

	getRight: function() {
		return this.x + this.width;
	},

	setRight: function(right) {
		if (this._fixX !== undefined && this._fixX !== 1)
			this._fixW = 0;
		if (this._fixW)
			this.x = right - this.width;
		else
			this.width = right - this.x;
		this._fixX = 1;
	},

	getBottom: function() {
		return this.y + this.height;
	},

	setBottom: function(bottom) {
		if (this._fixY !== undefined && this._fixY !== 1)
			this._fixH = 0;
		if (this._fixH)
			this.y = bottom - this.height;
		else
			this.height = bottom - this.y;
		this._fixY = 1;
	},

	getCenterX: function() {
		return this.x + this.width * 0.5;
	},

	setCenterX: function(x) {
		this.x = x - this.width * 0.5;
		this._fixX = 0.5;
	},

	getCenterY: function() {
		return this.y + this.height * 0.5;
	},

	setCenterY: function(y) {
		this.y = y - this.height * 0.5;
		this._fixY = 0.5;
	},

	getCenter: function(_dontLink) {
		var ctor = _dontLink ? Point : LinkedPoint;
		return new ctor(this.getCenterX(), this.getCenterY(), this, 'setCenter');
	},

	setCenter: function() {
		var point = Point.read(arguments);
		this.setCenterX(point.x);
		this.setCenterY(point.y);
		return this;
	},

	getArea: function() {
		return this.width * this.height;
	},

	isEmpty: function() {
		return this.width === 0 || this.height === 0;
	},

	contains: function(arg) {
		return arg && arg.width !== undefined
				|| (Array.isArray(arg) ? arg : arguments).length == 4
				? this._containsRectangle(Rectangle.read(arguments))
				: this._containsPoint(Point.read(arguments));
	},

	_containsPoint: function(point) {
		var x = point.x,
			y = point.y;
		return x >= this.x && y >= this.y
				&& x <= this.x + this.width && y <="this.y" this.height; }, _containsrectangle: function(rect) { var x="rect.x," return>= this.x && y >= this.y
				&& x + rect.width <= this.x + this.width && y rect.height <="this.y" this.height; }, intersects: function() { var rect="Rectangle.read(arguments);" return rect.x rect.width> this.x
				&& rect.y + rect.height > this.y
				&& rect.x < this.x + this.width
				&& rect.y < this.y + this.height;
	},

	touches: function() {
		var rect = Rectangle.read(arguments);
		return rect.x + rect.width >= this.x
				&& rect.y + rect.height >= this.y
				&& rect.x <= this.x + this.width && rect.y <="this.y" this.height; }, intersect: function() { var rect="Rectangle.read(arguments)," x1="Math.max(this.x," rect.x), y1="Math.max(this.y," rect.y), x2="Math.min(this.x" this.width, rect.x rect.width), y2="Math.min(this.y" this.height, rect.height); return new rectangle(x1, y1, - x1, y1); unite: include: point="Point.read(arguments);" point.x), point.y), point.y); expand: amount="Size.read(arguments)," hor="amount.width," ver="amount.height;" rectangle(this.x 2, this.y hor, this.height ver); scale: function(hor, ver) this.expand(this.width * (ver="==" undefined ? : this.height); } base.each([ ['top', 'left'], 'right'], ['bottom', ['left', 'center'], ['right', 'center'] ], function(parts, index) part="parts.join('');" xfirst="/^[RL]/.test(part);" if (index>= 4)
				parts[1] += xFirst ? 'Y' : 'X';
			var x = parts[xFirst ? 0 : 1],
				y = parts[xFirst ? 1 : 0],
				getX = 'get' + x,
				getY = 'get' + y,
				setX = 'set' + x,
				setY = 'set' + y,
				get = 'get' + part,
				set = 'set' + part;
			this[get] = function(_dontLink) {
				var ctor = _dontLink ? Point : LinkedPoint;
				return new ctor(this[getX](), this[getY](), this, set);
			};
			this[set] = function() {
				var point = Point.read(arguments);
				this[setX](point.x);
				this[setY](point.y);
			};
		}, {});
});

var LinkedRectangle = Rectangle.extend({
	initialize: function Rectangle(x, y, width, height, owner, setter) {
		this.set(x, y, width, height, true);
		this._owner = owner;
		this._setter = setter;
	},

	set: function(x, y, width, height, _dontNotify) {
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		if (!_dontNotify)
			this._owner[this._setter](this);
		return this;
	}
}, new function() {
	var proto = Rectangle.prototype;

	return Base.each(['x', 'y', 'width', 'height'], function(key) {
		var part = Base.capitalize(key);
		var internal = '_' + key;
		this['get' + part] = function() {
			return this[internal];
		};

		this['set' + part] = function(value) {
			this[internal] = value;
			if (!this._dontNotify)
				this._owner[this._setter](this);
		};
	}, Base.each(['Point', 'Size', 'Center',
			'Left', 'Top', 'Right', 'Bottom', 'CenterX', 'CenterY',
			'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight',
			'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'],
		function(key) {
			var name = 'set' + key;
			this[name] = function() {
				this._dontNotify = true;
				proto[name].apply(this, arguments);
				this._dontNotify = false;
				this._owner[this._setter](this);
			};
		}, {
			isSelected: function() {
				return this._owner._boundsSelected;
			},

			setSelected: function(selected) {
				var owner = this._owner;
				if (owner.setSelected) {
					owner._boundsSelected = selected;
					owner.setSelected(selected || owner._selectedSegmentState > 0);
				}
			}
		})
	);
});

var Matrix = Base.extend({
	_class: 'Matrix',

	initialize: function Matrix(arg) {
		var count = arguments.length,
			ok = true;
		if (count === 6) {
			this.set.apply(this, arguments);
		} else if (count === 1) {
			if (arg instanceof Matrix) {
				this.set(arg._a, arg._c, arg._b, arg._d, arg._tx, arg._ty);
			} else if (Array.isArray(arg)) {
				this.set.apply(this, arg);
			} else {
				ok = false;
			}
		} else if (count === 0) {
			this.reset();
		} else {
			ok = false;
		}
		if (!ok)
			throw new Error('Unsupported matrix parameters');
	},

	set: function(a, c, b, d, tx, ty, _dontNotify) {
		this._a = a;
		this._c = c;
		this._b = b;
		this._d = d;
		this._tx = tx;
		this._ty = ty;
		if (!_dontNotify)
			this._changed();
		return this;
	},

	_serialize: function(options) {
		return Base.serialize(this.getValues(), options);
	},

	_changed: function() {
		var owner = this._owner;
		if (owner) {
			if (owner._applyMatrix) {
				owner.transform(null, true);
			} else {
				owner._changed(5);
			}
		}
	},

	clone: function() {
		return new Matrix(this._a, this._c, this._b, this._d,
				this._tx, this._ty);
	},

	equals: function(mx) {
		return mx === this || mx && this._a === mx._a && this._b === mx._b
				&& this._c === mx._c && this._d === mx._d
				&& this._tx === mx._tx && this._ty === mx._ty
				|| false;
	},

	toString: function() {
		var f = Formatter.instance;
		return '[[' + [f.number(this._a), f.number(this._b),
					f.number(this._tx)].join(', ') + '], ['
				+ [f.number(this._c), f.number(this._d),
					f.number(this._ty)].join(', ') + ']]';
	},

	reset: function(_dontNotify) {
		this._a = this._d = 1;
		this._c = this._b = this._tx = this._ty = 0;
		if (!_dontNotify)
			this._changed();
		return this;
	},

	apply: function() {
		var owner = this._owner;
		if (owner) {
			owner.transform(null, true);
			return this.isIdentity();
		}
		return false;
	},

	translate: function() {
		var point = Point.read(arguments),
			x = point.x,
			y = point.y;
		this._tx += x * this._a + y * this._b;
		this._ty += x * this._c + y * this._d;
		this._changed();
		return this;
	},

	scale: function() {
		var scale = Point.read(arguments),
			center = Point.read(arguments, 0, { readNull: true });
		if (center)
			this.translate(center);
		this._a *= scale.x;
		this._c *= scale.x;
		this._b *= scale.y;
		this._d *= scale.y;
		if (center)
			this.translate(center.negate());
		this._changed();
		return this;
	},

	rotate: function(angle ) {
		angle *= Math.PI / 180;
		var center = Point.read(arguments, 1),
			x = center.x,
			y = center.y,
			cos = Math.cos(angle),
			sin = Math.sin(angle),
			tx = x - x * cos + y * sin,
			ty = y - x * sin - y * cos,
			a = this._a,
			b = this._b,
			c = this._c,
			d = this._d;
		this._a = cos * a + sin * b;
		this._b = -sin * a + cos * b;
		this._c = cos * c + sin * d;
		this._d = -sin * c + cos * d;
		this._tx += tx * a + ty * b;
		this._ty += tx * c + ty * d;
		this._changed();
		return this;
	},

	shear: function() {
		var shear = Point.read(arguments),
			center = Point.read(arguments, 0, { readNull: true });
		if (center)
			this.translate(center);
		var a = this._a,
			c = this._c;
		this._a += shear.y * this._b;
		this._c += shear.y * this._d;
		this._b += shear.x * a;
		this._d += shear.x * c;
		if (center)
			this.translate(center.negate());
		this._changed();
		return this;
	},

	skew: function() {
		var skew = Point.read(arguments),
			center = Point.read(arguments, 0, { readNull: true }),
			toRadians = Math.PI / 180,
			shear = new Point(Math.tan(skew.x * toRadians),
				Math.tan(skew.y * toRadians));
		return this.shear(shear, center);
	},

	concatenate: function(mx) {
		var a = this._a,
			b = this._b,
			c = this._c,
			d = this._d;
		this._a = mx._a * a + mx._c * b;
		this._b = mx._b * a + mx._d * b;
		this._c = mx._a * c + mx._c * d;
		this._d = mx._b * c + mx._d * d;
		this._tx += mx._tx * a + mx._ty * b;
		this._ty += mx._tx * c + mx._ty * d;
		this._changed();
		return this;
	},

	preConcatenate: function(mx) {
		var a = this._a,
			b = this._b,
			c = this._c,
			d = this._d,
			tx = this._tx,
			ty = this._ty;
		this._a = mx._a * a + mx._b * c;
		this._b = mx._a * b + mx._b * d;
		this._c = mx._c * a + mx._d * c;
		this._d = mx._c * b + mx._d * d;
		this._tx = mx._a * tx + mx._b * ty + mx._tx;
		this._ty = mx._c * tx + mx._d * ty + mx._ty;
		this._changed();
		return this;
	},

	isIdentity: function() {
		return this._a === 1 && this._c === 0 && this._b === 0 && this._d === 1
				&& this._tx === 0 && this._ty === 0;
	},

	orNullIfIdentity: function() {
		return this.isIdentity() ? null : this;
	},

	isInvertible: function() {
		return !!this._getDeterminant();
	},

	isSingular: function() {
		return !this._getDeterminant();
	},

	transform: function( src, srcOffset, dst, dstOffset, count) {
		return arguments.length < 5
			? this._transformPoint(Point.read(arguments))
			: this._transformCoordinates(src, srcOffset, dst, dstOffset, count);
	},

	_transformPoint: function(point, dest, _dontNotify) {
		var x = point.x,
			y = point.y;
		if (!dest)
			dest = new Point();
		return dest.set(
			x * this._a + y * this._b + this._tx,
			x * this._c + y * this._d + this._ty,
			_dontNotify
		);
	},

	_transformCoordinates: function(src, srcOffset, dst, dstOffset, count) {
		var i = srcOffset,
			j = dstOffset,
			max = i + 2 * count;
		while (i < max) {
			var x = src[i++],
				y = src[i++];
			dst[j++] = x * this._a + y * this._b + this._tx;
			dst[j++] = x * this._c + y * this._d + this._ty;
		}
		return dst;
	},

	_transformCorners: function(rect) {
		var x1 = rect.x,
			y1 = rect.y,
			x2 = x1 + rect.width,
			y2 = y1 + rect.height,
			coords = [ x1, y1, x2, y1, x2, y2, x1, y2 ];
		return this._transformCoordinates(coords, 0, coords, 0, 4);
	},

	_transformBounds: function(bounds, dest, _dontNotify) {
		var coords = this._transformCorners(bounds),
			min = coords.slice(0, 2),
			max = coords.slice();
		for (var i = 2; i < 8; i++) {
			var val = coords[i],
				j = i & 1;
			if (val < min[j])
				min[j] = val;
			else if (val > max[j])
				max[j] = val;
		}
		if (!dest)
			dest = new Rectangle();
		return dest.set(min[0], min[1], max[0] - min[0], max[1] - min[1],
				_dontNotify);
	},

	inverseTransform: function() {
		return this._inverseTransform(Point.read(arguments));
	},

	_getDeterminant: function() {
		var det = this._a * this._d - this._b * this._c;
		return isFinite(det) && !Numerical.isZero(det)
				&& isFinite(this._tx) && isFinite(this._ty)
				? det : null;
	},

	_inverseTransform: function(point, dest, _dontNotify) {
		var det = this._getDeterminant();
		if (!det)
			return null;
		var x = point.x - this._tx,
			y = point.y - this._ty;
		if (!dest)
			dest = new Point();
		return dest.set(
			(x * this._d - y * this._b) / det,
			(y * this._a - x * this._c) / det,
			_dontNotify
		);
	},

	decompose: function() {
		var a = this._a, b = this._b, c = this._c, d = this._d;
		if (Numerical.isZero(a * d - b * c))
			return null;

		var scaleX = Math.sqrt(a * a + b * b);
		a /= scaleX;
		b /= scaleX;

		var shear = a * c + b * d;
		c -= a * shear;
		d -= b * shear;

		var scaleY = Math.sqrt(c * c + d * d);
		c /= scaleY;
		d /= scaleY;
		shear /= scaleY;

		if (a * d < b * c) {
			a = -a;
			b = -b;
			shear = -shear;
			scaleX = -scaleX;
		}

		return {
			scaling: new Point(scaleX, scaleY),
			rotation: -Math.atan2(b, a) * 180 / Math.PI,
			shearing: shear
		};
	},

	getValues: function() {
		return [ this._a, this._c, this._b, this._d, this._tx, this._ty ];
	},

	getTranslation: function() {
		return new Point(this._tx, this._ty);
	},

	getScaling: function() {
		return (this.decompose() || {}).scaling;
	},

	getRotation: function() {
		return (this.decompose() || {}).rotation;
	},

	inverted: function() {
		var det = this._getDeterminant();
		return det && new Matrix(
				this._d / det,
				-this._c / det,
				-this._b / det,
				this._a / det,
				(this._b * this._ty - this._d * this._tx) / det,
				(this._c * this._tx - this._a * this._ty) / det);
	},

	shiftless: function() {
		return new Matrix(this._a, this._c, this._b, this._d, 0, 0);
	},

	applyToContext: function(ctx) {
		ctx.transform(this._a, this._c, this._b, this._d, this._tx, this._ty);
	}
}, new function() {
	return Base.each(['a', 'c', 'b', 'd', 'tx', 'ty'], function(name) {
		var part = Base.capitalize(name),
			prop = '_' + name;
		this['get' + part] = function() {
			return this[prop];
		};
		this['set' + part] = function(value) {
			this[prop] = value;
			this._changed();
		};
	}, {});
});

var Line = Base.extend({
	_class: 'Line',

	initialize: function Line(arg0, arg1, arg2, arg3, arg4) {
		var asVector = false;
		if (arguments.length >= 4) {
			this._px = arg0;
			this._py = arg1;
			this._vx = arg2;
			this._vy = arg3;
			asVector = arg4;
		} else {
			this._px = arg0.x;
			this._py = arg0.y;
			this._vx = arg1.x;
			this._vy = arg1.y;
			asVector = arg2;
		}
		if (!asVector) {
			this._vx -= this._px;
			this._vy -= this._py;
		}
	},

	getPoint: function() {
		return new Point(this._px, this._py);
	},

	getVector: function() {
		return new Point(this._vx, this._vy);
	},

	getLength: function() {
		return this.getVector().getLength();
	},

	intersect: function(line, isInfinite) {
		return Line.intersect(
				this._px, this._py, this._vx, this._vy,
				line._px, line._py, line._vx, line._vy,
				true, isInfinite);
	},

	getSide: function(point) {
		return Line.getSide(
				this._px, this._py, this._vx, this._vy,
				point.x, point.y, true);
	},

	getDistance: function(point) {
		return Math.abs(Line.getSignedDistance(
				this._px, this._py, this._vx, this._vy,
				point.x, point.y, true));
	},

	statics: {
		intersect: function(apx, apy, avx, avy, bpx, bpy, bvx, bvy, asVector,
				isInfinite) {
			if (!asVector) {
				avx -= apx;
				avy -= apy;
				bvx -= bpx;
				bvy -= bpy;
			}
			var cross = bvy * avx - bvx * avy;
			if (!Numerical.isZero(cross)) {
				var dx = apx - bpx,
					dy = apy - bpy,
					ta = (bvx * dy - bvy * dx) / cross,
					tb = (avx * dy - avy * dx) / cross;
				if ((isInfinite || 0 <= 0 ta && <="1)" (isinfinite || tb return new point( apx + * avx, apy avy); } }, getside: function(px, py, vx, vy, x, y, asvector) { if (!asvector) vx -="px;" vy var v2x="x" px, v2y="y" ccw="v2x" vx; (ccw="==" 0) vy;> 0) {
					v2x -= vx;
					v2y -= vy;
					ccw = v2x * vx + v2y * vy;
					if (ccw < 0)
						ccw = 0;
				}
			}
			return ccw < 0 ? -1 : ccw > 0 ? 1 : 0;
		},

		getSignedDistance: function(px, py, vx, vy, x, y, asVector) {
			if (!asVector) {
				vx -= px;
				vy -= py;
			}
			var m = vy / vx, 
				b = py - m * px; 
			return (y - (m * x) - b) / Math.sqrt(m * m + 1);
		}
	}
});

var Project = PaperScopeItem.extend({
	_class: 'Project',
	_list: 'projects',
	_reference: 'project',

	initialize: function Project(view) {
		PaperScopeItem.call(this, true);
		this.layers = [];
		this.symbols = [];
		this._currentStyle = new Style();
		this.activeLayer = new Layer();
		if (view)
			this.view = view instanceof View ? view : View.create(view);
		this._selectedItems = {};
		this._selectedItemCount = 0;
		this._updateVersion = 0;
	},

	_serialize: function(options, dictionary) {
		return Base.serialize(this.layers, options, true, dictionary);
	},

	clear: function() {
		for (var i = this.layers.length - 1; i >= 0; i--)
			this.layers[i].remove();
		this.symbols = [];
	},

	isEmpty: function() {
		return this.layers.length <= 1 && (!this.activelayer || this.activelayer.isempty()); }, remove: function remove() { if (!remove.base.call(this)) return false; (this.view) this.view.remove(); true; getcurrentstyle: function() this._currentstyle; setcurrentstyle: function(style) this._currentstyle.initialize(style); getindex: this._index; addchild: function(child) (child instanceof layer) base.splice(this.layers, [child]); (!this.activelayer) this.activelayer="child;" } else item) (this.activelayer this.addchild(new layer(item.no_insert))).addchild(child); child="null;" child; getselecteditems: var items="[];" for (var id in this._selecteditems) item="this._selectedItems[id];" (item.isinserted()) items.push(item); items; getoptions: this._scope.settings; _updateselection: function(item) selecteditems="this._selectedItems;" (item._selected) (selecteditems[id] !="=" this._selecteditemcount++; selecteditems[id]="item;" this._selecteditemcount--; delete selecteditems[id]; selectall: layers="this.layers;" i="0," l="layers.length;" < l; i++) layers[i].setfullyselected(true); deselectall: selecteditems) selecteditems[i].setfullyselected(false); hittest: point="Point.read(arguments)," options="HitResult.getOptions(Base.read(arguments));" - 1;>= 0; i--) {
			var res = this.layers[i].hitTest(point, options);
			if (res) return res;
		}
		return null;
	}
}, new function() {
	function getItems(project, match, list) {
		var layers = project.layers,
			items = list && [];
		for (var i = 0, l = layers.length; i < l; i++) {
			var res = layers[i][list ? 'getItems' : 'getItem'](match);
			if (list) {
				items.push.apply(items, res);
			} else if (res)
				return res;
		}
		return list ? items : null;
	}

	return {
		getItems: function(match) {
			return getItems(this, match, true);
		},

		getItem: function(match) {
			return getItems(this, match, false);
		}
	};
}, {

	importJSON: function(json) {
		this.activate();
		var layer = this.activeLayer;
		return Base.importJSON(json, layer && layer.isEmpty() && layer);
	},

	draw: function(ctx, matrix, pixelRatio) {
		this._updateVersion++;
		ctx.save();
		matrix.applyToContext(ctx);
		var param = new Base({
			offset: new Point(0, 0),
			pixelRatio: pixelRatio,
			trackTransforms: true
		});
		for (var i = 0, l = this.layers.length; i < l; i++)
			this.layers[i].draw(ctx, param);
		ctx.restore();

		if (this._selectedItemCount > 0) {
			ctx.save();
			ctx.strokeWidth = 1;
			for (var id in this._selectedItems) {
				var item = this._selectedItems[id],
					size = this._scope.settings.handleSize;
					half = size / 2;
				if (item._updateVersion === this._updateVersion
						&& (item._drawSelected || item._boundsSelected)) {
					var color = item.getSelectedColor()
							|| item.getLayer().getSelectedColor();
					ctx.strokeStyle = ctx.fillStyle = color
							? color.toCanvasStyle(ctx) : '#009dec';
					var mx = matrix.clone().concatenate(item._globalMatrix);
					if (item._drawSelected)
						item._drawSelected(ctx, mx);
					if (item._boundsSelected) {
						var coords = mx._transformCorners(
								item.getInternalBounds());
						ctx.beginPath();
						for (var i = 0; i < 8; i++)
							ctx[i === 0 ? 'moveTo' : 'lineTo'](
									coords[i], coords[++i]);
						ctx.closePath();
						ctx.stroke();
						for (var i = 0; i < 8; i++)
							ctx.fillRect(coords[i] - half, coords[++i] - half,
									size, size);
					}
				}
			}
			ctx.restore();
		}
	}
});

var Symbol = Base.extend({
	_class: 'Symbol',

	initialize: function Symbol(item, dontCenter) {
		this._id = Symbol._id = (Symbol._id || 0) + 1;
		this.project = paper.project;
		this.project.symbols.push(this);
		if (item)
			this.setDefinition(item, dontCenter);
	},

	_serialize: function(options, dictionary) {
		return dictionary.add(this, function() {
			return Base.serialize([this._class, this._definition],
					options, false, dictionary);
		});
	},

	_changed: function(flags) {
		if (flags & 4) {
			Item._clearBoundsCache(this);
		}
		if (flags & 1) {
			this.project._needsUpdate = true;
		}
	},

	getDefinition: function() {
		return this._definition;
	},

	setDefinition: function(item, _dontCenter) {
		if (item._parentSymbol)
			item = item.clone();
		if (this._definition)
			this._definition._parentSymbol = null;
		this._definition = item;
		item.remove();
		item.setSelected(false);
		if (!_dontCenter)
			item.setPosition(new Point());
		item._parentSymbol = this;
		this._changed(5);
	},

	place: function(position) {
		return new PlacedSymbol(this, position);
	},

	clone: function() {
		return new Symbol(this._definition.clone(false));
	}
});

var Item = Base.extend(Callback, {
	statics: {
		extend: function extend(src) {
			if (src._serializeFields)
				src._serializeFields = new Base(
						this.prototype._serializeFields, src._serializeFields);
			var res = extend.base.apply(this, arguments),
				proto = res.prototype,
				name = proto._class;
			if (name)
				proto._type = Base.hyphenate(name);
			return res;
		},

		NO_INSERT: { insert: false }
	},

	_class: 'Item',
	_applyMatrix: true,
	_canApplyMatrix: true,
	_boundsSelected: false,
	_selectChildren: false,
	_serializeFields: {
		name: null,
		matrix: new Matrix(),
		pivot: null,
		locked: false,
		visible: true,
		blendMode: 'normal',
		opacity: 1,
		guide: false,
		selected: false,
		clipMask: false,
		applyMatrix: null,
		data: {}
	},

	initialize: function Item() {
	},

	_initialize: function(props, point) {
		var internal = props && props.internal === true,
			matrix = this._matrix = new Matrix();
			project = paper.project;
		if (!internal)
			this._id = Item._id = (Item._id || 0) + 1;
		this._applyMatrix = this._canApplyMatrix && paper.settings.applyMatrix;
		if (point)
			matrix.translate(point);
		matrix._owner = this;
		this._style = new Style(project._currentStyle, this);
		if (!this._project) {
			if (internal || props && props.insert === false) {
				this._setProject(project);
			} else {
				(project.activeLayer || new Layer()).addChild(this);
			}
		}
		return props && props !== Item.NO_INSERT
				? this._set(props, { insert: true }) 
				: true;
	},

	_events: new function() {

		var mouseFlags = {
			mousedown: {
				mousedown: 1,
				mousedrag: 1,
				click: 1,
				doubleclick: 1
			},
			mouseup: {
				mouseup: 1,
				mousedrag: 1,
				click: 1,
				doubleclick: 1
			},
			mousemove: {
				mousedrag: 1,
				mousemove: 1,
				mouseenter: 1,
				mouseleave: 1
			}
		};

		var mouseEvent = {
			install: function(type) {
				var counters = this._project.view._eventCounters;
				if (counters) {
					for (var key in mouseFlags) {
						counters[key] = (counters[key] || 0)
								+ (mouseFlags[key][type] || 0);
					}
				}
			},
			uninstall: function(type) {
				var counters = this._project.view._eventCounters;
				if (counters) {
					for (var key in mouseFlags)
						counters[key] -= mouseFlags[key][type] || 0;
				}
			}
		};

		return Base.each(['onMouseDown', 'onMouseUp', 'onMouseDrag', 'onClick',
			'onDoubleClick', 'onMouseMove', 'onMouseEnter', 'onMouseLeave'],
			function(name) {
				this[name] = mouseEvent;
			}, {
				onFrame: {
					install: function() {
						this._animateItem(true);
					},
					uninstall: function() {
						this._animateItem(false);
					}
				},

				onLoad: {}
			}
		);
	},

	_animateItem: function(animate) {
		this._project.view._animateItem(this, animate);
	},

	_serialize: function(options, dictionary) {
		var props = {},
			that = this;

		function serialize(fields) {
			for (var key in fields) {
				var value = that[key];
				if (!Base.equals(value, key === 'leading'
						? fields.fontSize * 1.2 : fields[key])) {
					props[key] = Base.serialize(value, options,
							key !== 'data', dictionary);
				}
			}
		}

		serialize(this._serializeFields);
		if (!(this instanceof Group))
			serialize(this._style._defaults);
		return [ this._class, props ];
	},

	_changed: function(flags) {
		var symbol = this._parentSymbol,
			cacheParent = this._parent || symbol,
			project = this._project;
		if (flags & 4) {
			this._bounds = this._position = this._decomposed =
					this._globalMatrix = undefined;
		}
		if (cacheParent && (flags
				& (4 | 8))) {
			Item._clearBoundsCache(cacheParent);
		}
		if (flags & 2) {
			Item._clearBoundsCache(this);
		}
		if (project) {
			if (flags & 1) {
				project._needsUpdate = true;
			}
			if (project._changes) {
				var entry = project._changesById[this._id];
				if (entry) {
					entry.flags |= flags;
				} else {
					entry = { item: this, flags: flags };
					project._changesById[this._id] = entry;
					project._changes.push(entry);
				}
			}
		}
		if (symbol)
			symbol._changed(flags);
	},

	set: function(props) {
		if (props)
			this._set(props, { insert: true });
		return this;
	},

	getId: function() {
		return this._id;
	},

	getType: function() {
		return this._type;
	},

	getName: function() {
		return this._name;
	},

	setName: function(name, unique) {

		if (this._name)
			this._removeNamed();
		if (name === (+name) + '')
			throw new Error(
					'Names consisting only of numbers are not supported.');
		if (name && this._parent) {
			var children = this._parent._children,
				namedChildren = this._parent._namedChildren,
				orig = name,
				i = 1;
			while (unique && children[name])
				name = orig + ' ' + (i++);
			(namedChildren[name] = namedChildren[name] || []).push(this);
			children[name] = this;
		}
		this._name = name || undefined;
		this._changed(32);
	},

	getStyle: function() {
		return this._style;
	},

	setStyle: function(style) {
		this.getStyle().set(style);
	},

	hasFill: function() {
		return this.getStyle().hasFill();
	},

	hasStroke: function() {
		return this.getStyle().hasStroke();
	},

	hasShadow: function() {
		return this.getStyle().hasShadow();
	}
}, Base.each(['locked', 'visible', 'blendMode', 'opacity', 'guide'],
	function(name) {
		var part = Base.capitalize(name),
			name = '_' + name;
		this['get' + part] = function() {
			return this[name];
		};
		this['set' + part] = function(value) {
			if (value != this[name]) {
				this[name] = value;
				this._changed(name === '_locked'
						? 32 : 33);
			}
		};
}, {}), {

	_locked: false,

	_visible: true,

	_blendMode: 'normal',

	_opacity: 1,

	_guide: false,

	isSelected: function() {
		if (this._selectChildren) {
			for (var i = 0, l = this._children.length; i < l; i++)
				if (this._children[i].isSelected())
					return true;
		}
		return this._selected;
	},

	setSelected: function(selected, noChildren) {
		if (!noChildren && this._selectChildren) {
			for (var i = 0, l = this._children.length; i < l; i++)
				this._children[i].setSelected(selected);
		}
		if ((selected = !!selected) ^ this._selected) {
			this._selected = selected;
			this._project._updateSelection(this);
			this._changed(33);
		}
	},

	_selected: false,

	isFullySelected: function() {
		if (this._children && this._selected) {
			for (var i = 0, l = this._children.length; i < l; i++)
				if (!this._children[i].isFullySelected())
					return false;
			return true;
		}
		return this._selected;
	},

	setFullySelected: function(selected) {
		if (this._children) {
			for (var i = 0, l = this._children.length; i < l; i++)
				this._children[i].setFullySelected(selected);
		}
		this.setSelected(selected, true);
	},

	isClipMask: function() {
		return this._clipMask;
	},

	setClipMask: function(clipMask) {
		if (this._clipMask != (clipMask = !!clipMask)) {
			this._clipMask = clipMask;
			if (clipMask) {
				this.setFillColor(null);
				this.setStrokeColor(null);
			}
			this._changed(33);
			if (this._parent)
				this._parent._changed(256);
		}
	},

	_clipMask: false,

	getData: function() {
		if (!this._data)
			this._data = {};
		return this._data;
	},

	setData: function(data) {
		this._data = data;		
	},

	getPosition: function(_dontLink) {
		var position = this._position,
			ctor = _dontLink ? Point : LinkedPoint;
		if (!position) {
			var pivot = this._pivot;
			position = this._position = pivot
					? this._matrix._transformPoint(pivot)
					: this.getBounds().getCenter(true);
		}
		return new ctor(position.x, position.y, this, 'setPosition');
	},

	setPosition: function() {
		this.translate(Point.read(arguments).subtract(this.getPosition(true)));
	},

	getPivot: function(_dontLink) {
		var pivot = this._pivot;
		if (pivot) {
			var ctor = _dontLink ? Point : LinkedPoint;
			pivot = new ctor(pivot.x, pivot.y, this, 'setAnchor');
		}
		return pivot;
	},

	setPivot: function() {
		this._pivot = Point.read(arguments);
		this._position = undefined;
	},

	_pivot: null,

	getRegistration: '#getPivot',
	setRegistration: '#setPivot'
}, Base.each(['bounds', 'strokeBounds', 'handleBounds', 'roughBounds',
		'internalBounds', 'internalRoughBounds'],
	function(key) {
		var getter = 'get' + Base.capitalize(key),
			match = key.match(/^internal(.*)$/),
			internalGetter = match ? 'get' + match[1] : null;
		this[getter] = function(_matrix) {
			var boundsGetter = this._boundsGetter,
				name = !internalGetter && (typeof boundsGetter === 'string'
						? boundsGetter : boundsGetter && boundsGetter[getter])
						|| getter,
				bounds = this._getCachedBounds(name, _matrix, null,
						internalGetter);
			return key === 'bounds'
					? new LinkedRectangle(bounds.x, bounds.y, bounds.width,
							bounds.height, this, 'setBounds') 
					: bounds;
		};
		this[key] = {
			get: this[getter]
		};
	},
{
	_getBounds: function(getter, matrix, cacheItem) {
		var children = this._children;
		if (!children || children.length == 0)
			return new Rectangle();
		var x1 = Infinity,
			x2 = -x1,
			y1 = x1,
			y2 = x2;
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i];
			if (child._visible && !child.isEmpty()) {
				var rect = child._getCachedBounds(getter, matrix, cacheItem);
				x1 = Math.min(rect.x, x1);
				y1 = Math.min(rect.y, y1);
				x2 = Math.max(rect.x + rect.width, x2);
				y2 = Math.max(rect.y + rect.height, y2);
			}
		}
		return isFinite(x1)
				? new Rectangle(x1, y1, x2 - x1, y2 - y1)
				: new Rectangle();
	},

	setBounds: function() {
		var rect = Rectangle.read(arguments),
			bounds = this.getBounds(),
			matrix = new Matrix(),
			center = rect.getCenter();
		matrix.translate(center);
		if (rect.width != bounds.width || rect.height != bounds.height) {
			matrix.scale(
					bounds.width != 0 ? rect.width / bounds.width : 1,
					bounds.height != 0 ? rect.height / bounds.height : 1);
		}
		center = bounds.getCenter();
		matrix.translate(-center.x, -center.y);
		this.transform(matrix);
	},

	_getCachedBounds: function(getter, matrix, cacheItem, internalGetter) {
		matrix = matrix && matrix.orNullIfIdentity();
		var _matrix = internalGetter ? null : this._matrix.orNullIfIdentity(),
			cache = (!matrix || matrix.equals(_matrix)) && getter;
		var cacheParent = this._parent || this._parentSymbol;
		if (cacheItem && cacheParent) {
			var id = cacheItem._id,
				ref = cacheParent._boundsCache = cacheParent._boundsCache || {
					ids: {},
					list: []
				};
			if (!ref.ids[id]) {
				ref.list.push(cacheItem);
				ref.ids[id] = cacheItem;
			}
		}
		if (cache && this._bounds && this._bounds[cache])
			return this._bounds[cache].clone();
		matrix = !matrix
				? _matrix
				: _matrix
					? matrix.clone().concatenate(_matrix)
					: matrix;
		var bounds = this._getBounds(internalGetter || getter, matrix,
				cache ? this : cacheItem);
		if (cache) {
			if (!this._bounds)
				this._bounds = {};
			var cached = this._bounds[cache] = bounds.clone();
			cached._internal = !!internalGetter;
		}
		return bounds;
	},

	statics: {
		_clearBoundsCache: function(item) {
			if (item._boundsCache) {
				for (var i = 0, list = item._boundsCache.list, l = list.length;
						i < l; i++) {
					var child = list[i];
					child._bounds = child._position = undefined;
					if (child !== item && child._boundsCache)
						child._clearBoundsCache();
				}
				item._boundsCache = undefined;
			}
		}
	}

}), {
	_decompose: function() {
		return this._decomposed = this._matrix.decompose();
	},

	getRotation: function() {
		var decomposed = this._decomposed || this._decompose();
		return decomposed && decomposed.rotation;
	},

	setRotation: function(rotation) {
		var current = this.getRotation();
		if (current != null && rotation != null) {
			var decomposed = this._decomposed;
			this.rotate(rotation - current);
			decomposed.rotation = rotation;
			this._decomposed = decomposed;
		}
	},

	getScaling: function() {
		var decomposed = this._decomposed || this._decompose();
		return decomposed && decomposed.scaling;
	},

	setScaling: function() {
		var current = this.getScaling();
		if (current != null) {
			var scaling = Point.read(arguments, 0, { clone: true }),
				decomposed = this._decomposed;
			this.scale(scaling.x / current.x, scaling.y / current.y);
			decomposed.scaling = scaling;
			this._decomposed = decomposed;
		}
	},

	getMatrix: function() {
		return this._matrix;
	},

	setMatrix: function(matrix) {
		this._matrix.initialize(matrix);
		if (this._applyMatrix) {
			this.transform(null, true);
		} else {
			this._changed(5);
		}
	},

	getGlobalMatrix: function() {
		var matrix = this._globalMatrix,
			updateVersion = this._project._updateVersion;
		if (matrix && matrix._updateVersion !== updateVersion)
			matrix = null;
		if (!matrix) {
			matrix = this._globalMatrix = this._matrix.clone();
			if (this._parent)
				matrix.preConcatenate(this._parent.getGlobalMatrix());
			matrix._updateVersion = updateVersion;
		}
		return matrix;
	},

	getApplyMatrix: function() {
		return this._applyMatrix;
	},

	setApplyMatrix: function(transform) {
		if (this._applyMatrix = this._canApplyMatrix && !!transform)
			this.transform(null, true);
	},

	getTransformContent: '#getApplyMatrix',
	setTransformContent: '#setApplyMatrix',

	getProject: function() {
		return this._project;
	},

	_setProject: function(project, installEvents) {
		if (this._project !== project) {
			if (this._project)
				this._installEvents(false);
			this._project = project;
			var children = this._children;
			for (var i = 0, l = children && children.length; i < l; i++)
				children[i]._setProject(project);
			installEvents = true;
		}
		if (installEvents)
			this._installEvents(true);
	},

	_installEvents: function _installEvents(install) {
		_installEvents.base.call(this, install);
		var children = this._children;
		for (var i = 0, l = children && children.length; i < l; i++)
			children[i]._installEvents(install);
	},

	getLayer: function() {
		var parent = this;
		while (parent = parent._parent) {
			if (parent instanceof Layer)
				return parent;
		}
		return null;
	},

	getParent: function() {
		return this._parent;
	},

	setParent: function(item) {
		return item.addChild(this);
	},

	getChildren: function() {
		return this._children;
	},

	setChildren: function(items) {
		this.removeChildren();
		this.addChildren(items);
	},

	getFirstChild: function() {
		return this._children && this._children[0] || null;
	},

	getLastChild: function() {
		return this._children && this._children[this._children.length - 1]
				|| null;
	},

	getNextSibling: function() {
		return this._parent && this._parent._children[this._index + 1] || null;
	},

	getPreviousSibling: function() {
		return this._parent && this._parent._children[this._index - 1] || null;
	},

	getIndex: function() {
		return this._index;
	},

	isInserted: function() {
		return this._parent ? this._parent.isInserted() : false;
	},

	equals: function(item) {
		return item === this || item && this._class === item._class
				&& this._style.equals(item._style) 
				&& this._matrix.equals(item._matrix)
				&& this._locked === item._locked
				&& this._visible === item._visible
				&& this._blendMode === item._blendMode
				&& this._opacity === item._opacity
				&& this._clipMask === item._clipMask
				&& this._guide === item._guide
				&& this._equals(item)
				|| false;
	},

	_equals: function(item) {
		return Base.equals(this._children, item._children);
	},

	clone: function(insert) {
		return this._clone(new this.constructor(Item.NO_INSERT), insert);
	},

	_clone: function(copy, insert) {
		copy.setStyle(this._style);
		if (this._children) {
			for (var i = 0, l = this._children.length; i < l; i++)
				copy.addChild(this._children[i].clone(false), true);
		}
		if (insert || insert === undefined)
			copy.insertAbove(this);
		var keys = ['_locked', '_visible', '_blendMode', '_opacity',
				'_clipMask', '_guide', '_applyMatrix'];
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i];
			if (this.hasOwnProperty(key))
				copy[key] = this[key];
		}
		copy._matrix.initialize(this._matrix);
		copy._data = this._data ? Base.clone(this._data) : null;
		copy.setSelected(this._selected);
		if (this._name)
			copy.setName(this._name, true);
		return copy;
	},

	copyTo: function(itemOrProject) {
		return itemOrProject.addChild(this.clone(false));
	},

	rasterize: function(resolution) {
		var bounds = this.getStrokeBounds(),
			view = this._project.view,
			scale = (resolution || view && view.getResolution() || 72) / 72,
			topLeft = bounds.getTopLeft().floor(),
			bottomRight = bounds.getBottomRight().ceil()
			size = new Size(bottomRight.subtract(topLeft)),
			canvas = CanvasProvider.getCanvas(size.multiply(scale)),
			ctx = canvas.getContext('2d'),
			matrix = new Matrix().scale(scale).translate(topLeft.negate());
		ctx.save();
		matrix.applyToContext(ctx);
		this.draw(ctx, new Base({ transforms: [matrix] }));
		ctx.restore();
		var raster = new Raster(Item.NO_INSERT);
		raster.setCanvas(canvas);
		raster.transform(new Matrix().translate(topLeft.add(size.divide(2)))
				.scale(1 / scale));
		raster.insertAbove(this);
		return raster;
	},

	contains: function() {
		return !!this._contains(
				this._matrix._inverseTransform(Point.read(arguments)));
	},

	_contains: function(point) {
		if (this._children) {
			for (var i = this._children.length - 1; i >= 0; i--) {
				if (this._children[i].contains(point))
					return true;
			}
			return false;
		}
		return point.isInside(this.getInternalBounds());
	},

	hitTest: function(point, options) {
		point = Point.read(arguments);
		options = HitResult.getOptions(Base.read(arguments));
		if (this._locked || !this._visible || this._guide && !options.guides)
			return null;

		var matrix = this._matrix,
			parentTotalMatrix = options._totalMatrix,
			view = this._project.view,
			totalMatrix = options._totalMatrix = parentTotalMatrix
					? parentTotalMatrix.clone().concatenate(matrix)
					: this.getGlobalMatrix().clone().preConcatenate(
						view ? view._matrix : new Matrix()),
			tolerancePadding = options._tolerancePadding = new Size(
						Path._getPenPadding(1, totalMatrix.inverted())
					).multiply(
						Math.max(options.tolerance, 0.00001)
					);
		point = matrix._inverseTransform(point);

		if (!this._children && !this.getInternalRoughBounds()
				.expand(tolerancePadding.multiply(2))._containsPoint(point))
			return null;
		var checkSelf = !(options.guides && !this._guide
				|| options.selected && !this._selected
				|| options.type && this._type !== options.type),
			that = this,
			res;

		function checkBounds(type, part) {
			var pt = bounds['get' + part]();
			if (point.subtract(pt).divide(tolerancePadding).length <= 8 1) return new hitresult(type, that, { name: base.hyphenate(part), point: pt }); } if (checkself && (options.center || options.bounds) this._parent) var bounds="this.getInternalBounds();" (options.center) res="checkBounds('center'," 'center'); (!res points="[" 'topleft', 'topright', 'bottomleft', 'bottomright', 'leftcenter', 'topcenter', 'rightcenter', 'bottomcenter' ]; for (var i="0;" < !res; i++) points[i]); children="!res" this._children; (children) opts="this._getChildHitTestOptions(options);" - 1;>= 0 && !res; i--)
				res = children[i].hitTest(point, opts);
		}
		if (!res && checkSelf)
			res = this._hitTest(point, options);
		if (res && res.point)
			res.point = matrix.transform(res.point);
		options._totalMatrix = parentTotalMatrix;
		return res;
	},

	_getChildHitTestOptions: function(options) {
		return options;
	},

	_hitTest: function(point, options) {
		if (options.fill && this.hasFill() && this._contains(point))
			return new HitResult('fill', this);
	},

	matches: function(match) {
		function matchObject(obj1, obj2) {
			for (var i in obj1) {
				if (obj1.hasOwnProperty(i)) {
					var val1 = obj1[i],
						val2 = obj2[i];
					if (Base.isPlainObject(val1) && Base.isPlainObject(val2)) {
						if (!matchObject(val1, val2))
							return false;
					} else if (!Base.equals(val1, val2)) {
						return false;
					}
				}
			}
			return true;
		}
		for (var key in match) {
			if (match.hasOwnProperty(key)) {
				var value = this[key],
					compare = match[key];
				if (compare instanceof RegExp) {
					if (!compare.test(value))
						return false;
				} else if (typeof compare === 'function') {
					if (!compare(value))
						return false;
				} else if (Base.isPlainObject(compare)) {
					if (!matchObject(compare, value))
						return false;
				} else if (!Base.equals(value, compare)) {
					return false;
				}
			}
		}
		return true;
	}
}, new function() {
	function getItems(item, match, list) {
		var children = item._children,
			items = list && [];
		for (var i = 0, l = children && children.length; i < l; i++) {
			var child = children[i];
			if (child.matches(match)) {
				if (list) {
					items.push(child);
				} else {
					return child;
				}
			}
			var res = getItems(child, match, list);
			if (list) {
				items.push.apply(items, res);
			} else if (res) {
				return res;
			}
		}
		return list ? items : null;
	}

	return {
		getItems: function(match) {
			return getItems(this, match, true);
		},

		getItem: function(match) {
			return getItems(this, match, false);
		}
	};
}, {

	importJSON: function(json) {
		var res = Base.importJSON(json, this);
		return res !== this
				? this.addChild(res)
				: res;
	},

	addChild: function(item, _preserve) {
		return this.insertChild(undefined, item, _preserve);
	},

	insertChild: function(index, item, _preserve) {
		var res = this.insertChildren(index, [item], _preserve);
		return res && res[0];
	},

	addChildren: function(items, _preserve) {
		return this.insertChildren(this._children.length, items, _preserve);
	},

	insertChildren: function(index, items, _preserve, _type) {
		var children = this._children;
		if (children && items && items.length > 0) {
			items = Array.prototype.slice.apply(items);
			for (var i = items.length - 1; i >= 0; i--) {
				var item = items[i];
				if (_type && item._type !== _type) {
					items.splice(i, 1);
				} else {
					item._remove(true);
				}
			}
			Base.splice(children, items, index, 0);
			for (var i = 0, l = items.length; i < l; i++) {
				var item = items[i];
				item._parent = this;
				item._setProject(this._project, true);
				if (item._name)
					item.setName(item._name);
			}
			this._changed(7);
		} else {
			items = null;
		}
		return items;
	},

	_insert: function(above, item, _preserve) {
		if (!item._parent)
			return null;
		var index = item._index + (above ? 1 : 0);
		if (item._parent === this._parent && index > this._index)
			 index--;
		return item._parent.insertChild(index, this, _preserve);
	},

	insertAbove: function(item, _preserve) {
		return this._insert(true, item, _preserve);
	},

	insertBelow: function(item, _preserve) {
	 	return this._insert(false, item, _preserve);
	 },

	sendToBack: function() {
		return this._parent.insertChild(0, this);
	},

	bringToFront: function() {
		return this._parent.addChild(this);
	},

	appendTop: '#addChild',

	appendBottom: function(item) {
		return this.insertChild(0, item);
	},

	moveAbove: '#insertAbove',

	moveBelow: '#insertBelow',

	reduce: function() {
		if (this._children && this._children.length === 1) {
			var child = this._children[0].reduce();
			child.insertAbove(this);
			child.setStyle(this._style);
			this.remove();
			return child;
		}
		return this;
	},

	_removeNamed: function() {
		var children = this._parent._children,
			namedChildren = this._parent._namedChildren,
			name = this._name,
			namedArray = namedChildren[name],
			index = namedArray ? namedArray.indexOf(this) : -1;
		if (index == -1)
			return;
		if (children[name] == this)
			delete children[name];
		namedArray.splice(index, 1);
		if (namedArray.length) {
			children[name] = namedArray[namedArray.length - 1];
		} else {
			delete namedChildren[name];
		}
	},

	_remove: function(notify) {
		if (this._parent) {
			if (this._name)
				this._removeNamed();
			if (this._index != null)
				Base.splice(this._parent._children, null, this._index, 1);
			this._installEvents(false);
			if (notify)
				this._parent._changed(7);
			this._parent = null;
			return true;
		}
		return false;
	},

	remove: function() {
		return this._remove(true);
	},

	removeChildren: function(from, to) {
		if (!this._children)
			return null;
		from = from || 0;
		to = Base.pick(to, this._children.length);
		var removed = Base.splice(this._children, null, from, to - from);
		for (var i = removed.length - 1; i >= 0; i--)
			removed[i]._remove(false);
		if (removed.length > 0)
			this._changed(7);
		return removed;
	},

	clear: '#removeChildren',

	reverseChildren: function() {
		if (this._children) {
			this._children.reverse();
			for (var i = 0, l = this._children.length; i < l; i++)
				this._children[i]._index = i;
			this._changed(7);
		}
	},

	isEmpty: function() {
		return !this._children || this._children.length == 0;
	},

	isEditable: function() {
		var item = this;
		while (item) {
			if (!item._visible || item._locked)
				return false;
			item = item._parent;
		}
		return true;
	},

	_getOrder: function(item) {
		function getList(item) {
			var list = [];
			do {
				list.unshift(item);
			} while (item = item._parent);
			return list;
		}
		var list1 = getList(this),
			list2 = getList(item);
		for (var i = 0, l = Math.min(list1.length, list2.length); i < l; i++) {
			if (list1[i] != list2[i]) {
				return list1[i]._index < list2[i]._index ? 1 : -1;
			}
		}
		return 0;
	},

	hasChildren: function() {
		return this._children && this._children.length > 0;
	},

	isAbove: function(item) {
		return this._getOrder(item) === -1;
	},

	isBelow: function(item) {
		return this._getOrder(item) === 1;
	},

	isParent: function(item) {
		return this._parent === item;
	},

	isChild: function(item) {
		return item && item._parent === this;
	},

	isDescendant: function(item) {
		var parent = this;
		while (parent = parent._parent) {
			if (parent == item)
				return true;
		}
		return false;
	},

	isAncestor: function(item) {
		return item ? item.isDescendant(this) : false;
	},

	isGroupedWith: function(item) {
		var parent = this._parent;
		while (parent) {
			if (parent._parent
				&& /^(group|layer|compound-path)$/.test(parent._type)
				&& item.isDescendant(parent))
					return true;
			parent = parent._parent;
		}
		return false;
	},

	translate: function() {
		var mx = new Matrix();
		return this.transform(mx.translate.apply(mx, arguments));
	},

	rotate: function(angle ) {
		return this.transform(new Matrix().rotate(angle,
				Point.read(arguments, 1, { readNull: true })
					|| this.getPosition(true)));
	}
}, Base.each(['scale', 'shear', 'skew'], function(name) {
	this[name] = function() {
		var point = Point.read(arguments),
			center = Point.read(arguments, 0, { readNull: true });
		return this.transform(new Matrix()[name](point,
				center || this.getPosition(true)));
	};
}, {

}), {
	transform: function(matrix, _applyMatrix) {
		if (matrix && matrix.isIdentity())
			matrix = null;
		var _matrix = this._matrix,
			applyMatrix = (_applyMatrix || this._applyMatrix)
				&& (!_matrix.isIdentity() || matrix);
		if (!matrix && !applyMatrix)
			return this;
		if (matrix)
			_matrix.preConcatenate(matrix);
		if (applyMatrix = applyMatrix && this._transformContent(_matrix)) {
			var pivot = this._pivot,
				style = this._style,
				fillColor = style.getFillColor(true),
				strokeColor = style.getStrokeColor(true);
			if (pivot)
				pivot.transform(_matrix);
			if (fillColor)
				fillColor.transform(_matrix);
			if (strokeColor)
				strokeColor.transform(_matrix);
			_matrix.reset(true);
		}
		var bounds = this._bounds,
			position = this._position;
		this._changed(5);
		var decomp = bounds && matrix && matrix.decompose();
		if (decomp && !decomp.shearing && decomp.rotation % 90 === 0) {
			for (var key in bounds) {
				var rect = bounds[key];
				if (applyMatrix || !rect._internal)
					matrix._transformBounds(rect, rect);
			}
			var getter = this._boundsGetter,
				rect = bounds[getter && getter.getBounds || getter || 'getBounds'];
			if (rect)
				this._position = rect.getCenter(true);
			this._bounds = bounds;
		} else if (matrix && position) {
			this._position = matrix._transformPoint(position, position);
		}
		return this;
	},

	_transformContent: function(matrix) {
		var children = this._children;
		if (children) {
			for (var i = 0, l = children.length; i < l; i++)
				children[i].transform(matrix, true);
			return true;
		}
	},

	globalToLocal: function() {
		var matrix = this.getGlobalMatrix();
		return matrix && matrix._inverseTransform(Point.read(arguments));
	},

	localToGlobal: function() {
		var matrix = this.getGlobalMatrix();
		return matrix && matrix._transformPoint(Point.read(arguments));
	},

	fitBounds: function(rectangle, fill) {
		rectangle = Rectangle.read(arguments);
		var bounds = this.getBounds(),
			itemRatio = bounds.height / bounds.width,
			rectRatio = rectangle.height / rectangle.width,
			scale = (fill ? itemRatio > rectRatio : itemRatio < rectRatio)
					? rectangle.width / bounds.width
					: rectangle.height / bounds.height,
			newBounds = new Rectangle(new Point(),
					new Size(bounds.width * scale, bounds.height * scale));
		newBounds.setCenter(rectangle.getCenter());
		this.setBounds(newBounds);
	},

	_setStyles: function(ctx) {
		var style = this._style,
			fillColor = style.getFillColor(),
			strokeColor = style.getStrokeColor(),
			shadowColor = style.getShadowColor();
		if (fillColor)
			ctx.fillStyle = fillColor.toCanvasStyle(ctx);
		if (strokeColor) {
			var strokeWidth = style.getStrokeWidth();
			if (strokeWidth > 0) {
				ctx.strokeStyle = strokeColor.toCanvasStyle(ctx);
				ctx.lineWidth = strokeWidth;
				var strokeJoin = style.getStrokeJoin(),
					strokeCap = style.getStrokeCap(),
					miterLimit = style.getMiterLimit();
				if (strokeJoin)
					ctx.lineJoin = strokeJoin;
				if (strokeCap)
					ctx.lineCap = strokeCap;
				if (miterLimit)
					ctx.miterLimit = miterLimit;
				if (paper.support.nativeDash) {
					var dashArray = style.getDashArray(),
						dashOffset = style.getDashOffset();
					if (dashArray && dashArray.length) {
						if ('setLineDash' in ctx) {
							ctx.setLineDash(dashArray);
							ctx.lineDashOffset = dashOffset;
						} else {
							ctx.mozDash = dashArray;
							ctx.mozDashOffset = dashOffset;
						}
					}
				}
			}
		}
		if (shadowColor) {
			var shadowBlur = style.getShadowBlur();
			if (shadowBlur > 0) {
				ctx.shadowColor = shadowColor.toCanvasStyle(ctx);
				ctx.shadowBlur = shadowBlur;
				var offset = this.getShadowOffset();
				ctx.shadowOffsetX = offset.x;
				ctx.shadowOffsetY = offset.y;
			}
		}
	},

	draw: function(ctx, param) {
		if (!this._visible || this._opacity === 0)
			return;
		var updateVersion = this._updateVersion = this._project._updateVersion;
		var trackTransforms = param.trackTransforms,
			transforms = param.transforms = param.transforms || [new Matrix()],
			matrix = this._matrix,
			parentMatrix = transforms[transforms.length - 1],
			globalMatrix = parentMatrix.clone().concatenate(matrix);
		if (!globalMatrix.isInvertible())
			return;
		if (trackTransforms) {
			if (!transforms)
				transforms = param.transforms = [];
			transforms.push(this._globalMatrix = globalMatrix);
			globalMatrix._updateVersion = updateVersion;
		}

		var blendMode = this._blendMode,
			opacity = this._opacity,
			normalBlend = blendMode === 'normal',
			nativeBlend = BlendMode.nativeModes[blendMode],
			direct = normalBlend && opacity === 1
					|| (nativeBlend || normalBlend && opacity < 1)
						&& this._canComposite(),
			mainCtx, itemOffset, prevOffset;
		if (!direct) {
			var bounds = this.getStrokeBounds(parentMatrix);
			if (!bounds.width || !bounds.height)
				return;
			prevOffset = param.offset;
			itemOffset = param.offset = bounds.getTopLeft().floor();
			mainCtx = ctx;
			ctx = CanvasProvider.getContext(
					bounds.getSize().ceil().add(new Size(1, 1)),
					param.pixelRatio);
		}
		ctx.save();
		if (direct) {
			ctx.globalAlpha = opacity;
			if (nativeBlend)
				ctx.globalCompositeOperation = blendMode;
		} else {
			ctx.translate(-itemOffset.x, -itemOffset.y);
		}
		(direct ? matrix : globalMatrix).applyToContext(ctx);
		if (!direct && param.clipItem)
			param.clipItem.draw(ctx, param.extend({ clip: true }));
		this._draw(ctx, param);
		ctx.restore();
		if (trackTransforms)
			transforms.pop();
		if (param.clip)
			ctx.clip();
		if (!direct) {
			BlendMode.process(blendMode, ctx, mainCtx, opacity,
					itemOffset.subtract(prevOffset).multiply(param.pixelRatio));
			CanvasProvider.release(ctx);
			param.offset = prevOffset;
		}
	},

	_canComposite: function() {
		return false;
	}
}, Base.each(['down', 'drag', 'up', 'move'], function(name) {
	this['removeOn' + Base.capitalize(name)] = function() {
		var hash = {};
		hash[name] = true;
		return this.removeOn(hash);
	};
}, {

	removeOn: function(obj) {
		for (var name in obj) {
			if (obj[name]) {
				var key = 'mouse' + name,
					project = this._project,
					sets = project._removeSets = project._removeSets || {};
				sets[key] = sets[key] || {};
				sets[key][this._id] = this;
			}
		}
		return this;
	}
}));

var Group = Item.extend({
	_class: 'Group',
	_selectChildren: true,
	_serializeFields: {
		children: []
	},

	initialize: function Group(arg) {
		this._children = [];
		this._namedChildren = {};
		if (!this._initialize(arg))
			this.addChildren(Array.isArray(arg) ? arg : arguments);
	},

	_changed: function _changed(flags) {
		_changed.base.call(this, flags);
		if (flags & (2 | 256)) {
			this._clipItem = undefined;
		}
	},

	_getClipItem: function() {
		if (this._clipItem !== undefined)
			return this._clipItem;
		for (var i = 0, l = this._children.length; i < l; i++) {
			var child = this._children[i];
			if (child._clipMask)
				return this._clipItem = child;
		}
		return this._clipItem = null;
	},

	isClipped: function() {
		return !!this._getClipItem();
	},

	setClipped: function(clipped) {
		var child = this.getFirstChild();
		if (child)
			child.setClipMask(clipped);
	},

	_draw: function(ctx, param) {
		var clipItem = param.clipItem = this._getClipItem();
		if (clipItem)
			clipItem.draw(ctx, param.extend({ clip: true }));
		for (var i = 0, l = this._children.length; i < l; i++) {
			var item = this._children[i];
			if (item !== clipItem)
				item.draw(ctx, param);
		}
		param.clipItem = null;
	}
});

var Layer = Group.extend({
	_class: 'Layer',

	initialize: function Layer(arg) {
		var props = Base.isPlainObject(arg)
				? new Base(arg) 
				: { children: Array.isArray(arg) ? arg : arguments },
			insert = props.insert;
		props.insert = false;
		Group.call(this, props);
		if (insert || insert === undefined) {
			this._project.addChild(this);
			this.activate();
		}
	},

	_remove: function _remove(notify) {
		if (this._parent)
			return _remove.base.call(this, notify);
		if (this._index != null) {
			if (this._project.activeLayer === this)
				this._project.activeLayer = this.getNextSibling()
						|| this.getPreviousSibling();
			Base.splice(this._project.layers, null, this._index, 1);
			this._installEvents(false);
			this._project._needsUpdate = true;
			return true;
		}
		return false;
	},

	getNextSibling: function getNextSibling() {		
		return this._parent ? getNextSibling.base.call(this)
				: this._project.layers[this._index + 1] || null;
	},

	getPreviousSibling: function getPreviousSibling() {
		return this._parent ? getPreviousSibling.base.call(this)
				: this._project.layers[this._index - 1] || null;
	},

	isInserted: function isInserted() {
		return this._parent ? isInserted.base.call(this) : this._index != null;
	},

	activate: function() {
		this._project.activeLayer = this;
	},

	_insert: function _insert(above, item, _preserve) {
		if (item instanceof Layer && !item._parent) {
			this._remove(true);
			Base.splice(item._project.layers, [this],
					item._index + (above ? 1 : 0), 0);
			this._setProject(item._project, true);
			return this;
		}
		return _insert.base.call(this, above, item, _preserve);
	}
});

var Shape = Item.extend({
	_class: 'Shape',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_boundsSelected: true,
	_serializeFields: {
		shape: null,
		size: null,
		radius: null
	},

	initialize: function Shape(props) {
		this._initialize(props);
	},

	_equals: function(item) {
		return this._shape === item._shape
			&& this._size.equals(item._size)
			&& Base.equals(this._radius, item._radius);
	},

	clone: function(insert) {
		var copy = new Shape(Item.NO_INSERT);
		copy.setShape(this._shape);
		copy.setSize(this._size);
		copy.setRadius(this._radius);
		return this._clone(copy, insert);
	},

	getShape: function() {
		return this._shape;
	},

	setShape: function(shape) {
		this._shape = shape;
	},

	getSize: function() {
		var size = this._size;
		return new LinkedSize(size.width, size.height, this, 'setSize');
	},

	setSize: function() {
		var size = Size.read(arguments);
		if (!this._size) {
			this._size = size.clone();
		} else if (!this._size.equals(size)) {
			var shape = this._shape,
				width = size.width,
				height = size.height;
			if (shape === 'rectangle') {
				var radius = Size.min(this._radius, size.divide(2));
				this._radius.set(radius.width, radius.height);
			} else if (shape === 'circle') {
				width = height = (width + height) / 2;
				this._radius = width / 2;
			} else if (shape === 'ellipse') {
				this._radius.set(width / 2, height / 2);
			}
			this._size.set(width, height);
			this._changed(5);
		}
	},

	getRadius: function() {
		var rad = this._radius;
		return this._shape === 'circle'
				? rad
				: new LinkedSize(rad.width, rad.height, this, 'setRadius');
	},

	setRadius: function(radius) {
		var shape = this._shape;
		if (shape === 'circle') {
			if (radius === this._radius)
				return;
			var size = radius * 2;
			this._radius = radius;
			this._size.set(size, size);
		} else {
			radius = Size.read(arguments);
			if (!this._radius) {
				this._radius = radius.clone();
			} else {
				if (this._radius.equals(radius))
					return;
				this._radius.set(radius.width, radius.height);
				if (shape === 'rectangle') {
					var size = Size.max(this._size, radius.multiply(2));
					this._size.set(size.width, size.height);
				} else if (shape === 'ellipse') {
					this._size.set(radius.width * 2, radius.height * 2);
				}
			}
		}
		this._changed(5);
	},

	isEmpty: function() {
		return false;
	},

	toPath: function(insert) {
		var path = new Path[Base.capitalize(this._shape)]({
			center: new Point(),
			size: this._size,
			radius: this._radius,
			insert: false
		});
		path.setStyle(this._style);
		path.transform(this._matrix);
		if (insert || insert === undefined)
			path.insertAbove(this);
		return path;
	},

	_draw: function(ctx, param) {
		var style = this._style,
			hasFill = style.hasFill(),
			hasStroke = style.hasStroke(),
			clip = param.clip;
		if (hasFill || hasStroke || clip) {
			var radius = this._radius,
				shape = this._shape;
			ctx.beginPath();
			if (shape === 'circle') {
				ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
			} else {
				var rx = radius.width,
					ry = radius.height,
					kappa = 0.5522847498307936;
				if (shape === 'ellipse') {
					var	cx = rx * kappa,
						cy = ry * kappa;
					ctx.moveTo(-rx, 0);
					ctx.bezierCurveTo(-rx, -cy, -cx, -ry, 0, -ry);
					ctx.bezierCurveTo(cx, -ry, rx, -cy, rx, 0);
					ctx.bezierCurveTo(rx, cy, cx, ry, 0, ry);
					ctx.bezierCurveTo(-cx, ry, -rx, cy, -rx, 0);
				} else { 
					var size = this._size,
						width = size.width,
						height = size.height;
					if (rx === 0 && ry === 0) {
						ctx.rect(-width / 2, -height / 2, width, height);
					} else {
						kappa = 1 - kappa;
						var x = width / 2,
							y = height / 2,
							cx = rx * kappa,
							cy = ry * kappa;
						ctx.moveTo(-x, -y + ry);
						ctx.bezierCurveTo(-x, -y + cy, -x + cx, -y, -x + rx, -y);
						ctx.lineTo(x - rx, -y);
						ctx.bezierCurveTo(x - cx, -y, x, -y + cy, x, -y + ry);
						ctx.lineTo(x, y - ry);
						ctx.bezierCurveTo(x, y - cy, x - cx, y, x - rx, y);
						ctx.lineTo(-x + rx, y);
						ctx.bezierCurveTo(-x + cx, y, -x, y - cy, -x, y - ry);
					}
				}
			}
			ctx.closePath();
		}
		if (!clip && (hasFill || hasStroke)) {
			this._setStyles(ctx);
			if (hasFill) {
				ctx.fill(style.getWindingRule());
				ctx.shadowColor = 'rgba(0,0,0,0)';
			}
			if (hasStroke)
				ctx.stroke();
		}
	},

	_canComposite: function() {
		return !(this.hasFill() && this.hasStroke());
	},

	_getBounds: function(getter, matrix) {
		var rect = new Rectangle(this._size).setCenter(0, 0);
		if (getter !== 'getBounds' && this.hasStroke())
			rect = rect.expand(this.getStrokeWidth());
		return matrix ? matrix._transformBounds(rect) : rect;
	}
},
new function() { 

	function getCornerCenter(that, point, expand) {
		var radius = that._radius;
		if (!radius.isZero()) {
			var halfSize = that._size.divide(2);
			for (var i = 0; i < 4; i++) {
				var dir = new Point(i & 1 ? 1 : -1, i > 1 ? 1 : -1),
					corner = dir.multiply(halfSize),
					center = corner.subtract(dir.multiply(radius)),
					rect = new Rectangle(corner, center);
				if ((expand ? rect.expand(expand) : rect).contains(point))
					return center;
			}
		}
	}

	function getEllipseRadius(point, radius) {
		var angle = point.getAngleInRadians(),
			width = radius.width * 2,
			height = radius.height * 2,
			x = width * Math.sin(angle),
			y = height * Math.cos(angle);
		return width * height / (2 * Math.sqrt(x * x + y * y));
	}

	return {
		_contains: function _contains(point) {
			if (this._shape === 'rectangle') {
				var center = getCornerCenter(this, point);
				return center
						? point.subtract(center).divide(this._radius)
							.getLength() <= 0 1 2 4 7 72 255 : _contains.base.call(this, point); } else { return point.divide(this.size).getlength() <="0.5;" }, _hittest: function _hittest(point, options) var hit="false;" if (this.hasstroke()) shape="this._shape," radius="this._radius," strokewidth="this.getStrokeWidth()" + * options.tolerance; (shape="==" 'rectangle') center="getCornerCenter(this," point, strokewidth); (center) pt="point.subtract(center);" math.abs(pt.getlength() - getellipseradius(pt, radius)) rect="new" rectangle(this._size).setcenter(0, 0), outer="rect.expand(strokeWidth)," inner="rect.expand(-strokeWidth);" && !inner._containspoint(point); 'ellipse') radius); math.abs(point.getlength() radius) ? new hitresult('stroke', this) _hittest.base.apply(this, arguments); }; statics: function() createshape(shape, size, radius, args) item="new" shape(base.getnamed(args)); item._shape="shape;" item._size="size;" item._radius="radius;" item.translate(point); circle: 'center'), 'radius'); createshape('circle', center, size(radius 2), rectangle: 'rectangle'), 'radius'), rect.getsize(true).divide(2)); createshape('rectangle', rect.getcenter(true), rect.getsize(true), ellipse: ellipse="Shape._readEllipse(arguments);" createshape('ellipse', ellipse.center, radius.multiply(2), _readellipse: function(args) radius; (base.hasnamed(args, 'radius')) 'center'); 'rectangle'); center: radius: }}); raster="Item.extend({" _class: 'raster', _applymatrix: false, _canapplymatrix: _boundsgetter: 'getbounds', _boundsselected: true, _serializefields: source: null initialize: raster(object, position) (!this._initialize(object, position !="=" undefined point.read(arguments, 1))) (typeof object="==" 'string') this.setsource(object); this.setimage(object); (!this._size) this._size="new" size(); _equals: function(item) this.getsource()="==" item.getsource(); clone: function(insert) copy="new" raster(item.no_insert), image="this._image," canvas="this._canvas;" (image) copy.setimage(image); (canvas) copycanvas="CanvasProvider.getCanvas(this._size);" copycanvas.getcontext('2d').drawimage(canvas, 0, 0); copy.setcanvas(copycanvas); this._clone(copy, insert); getsize: size="this._size;" linkedsize(size.width, size.height, this, 'setsize'); setsize: (!this._size.equals(size)) element="this.getElement();" this.setcanvas(canvasprovider.getcanvas(size)); (element) this.getcontext(true).drawimage(element, size.width, size.height); getwidth: this._size.width; getheight: this._size.height; isempty: this._size.width="=" this._size.height="=" 0; getppi: matrix="this._matrix," orig="new" point(0, 0).transform(matrix), u="new" point(1, 0).transform(matrix).subtract(orig), v="new" 1).transform(matrix).subtract(orig); size( u.getlength(), v.getlength() ); getimage: this._image; setimage: function(image) (this._canvas) canvasprovider.release(this._canvas); (image.getcontext) this._image="null;" this._canvas="image;" image.naturalwidth || image.width, image.naturalheight image.height); this._context="null;" this._changed(5 | 129); getcanvas: (!this._canvas) ctx="CanvasProvider.getContext(this._size);" try (this._image) ctx.drawimage(this._image, catch (e) canvasprovider.release(ctx); this._canvas; setcanvas: '#setimage', getcontext: function(modify) (!this._context) (modify) this._changed(129); this._context; setcontext: function(context) getsource: this._image.src this.todataurl(); setsource: function(src) that="this," image; loaded() view="that._project.view;" (view) paper="view._scope;" that.setimage(image); that.fire('load'); view.update(); image(); (image.naturalwidth image.naturalheight) settimeout(loaded, domevent.add(image, load: loaded }); (!image.src) image.src="src;" this.setimage(image); getelement: getsubcanvas: function(rect) ctx.drawimage(this.getcanvas(), rect.x, rect.y, rect.width, rect.height, rect.height); ctx.canvas; getsubraster: raster(item.no_insert); raster.setcanvas(this.getsubcanvas(rect)); raster.translate(rect.getcenter().subtract(this.getsize().divide(2))); raster._matrix.preconcatenate(this._matrix); raster.insertabove(this); raster; todataurl: src="this._image" this._image.src; ( ^data: .test(src)) src; canvas.todataurl() null; drawimage: function(image ) point="Point.read(arguments," 1); this.getcontext(true).drawimage(image, point.x, point.y); getaveragecolor: function(object) bounds, path; (!object) bounds="this.getBounds();" (object instanceof pathitem) path="object;" (object.width) rectangle(object); (object.x) rectangle(object.x 0.5, object.y 1, samplesize="32," width="Math.min(bounds.width," samplesize), height="Math.min(bounds.height," samplesize); (!ctx) = canvasprovider.getcontext( size(samplesize)); ctx.clearrect(0, ctx.save(); matrix() .scale(width bounds.width, bounds.height) .translate(-bounds.x, -bounds.y); matrix.applytocontext(ctx); (path) path.draw(ctx, base({ clip: transforms: [matrix] })); this._matrix.applytocontext(ctx); ctx.drawimage(this.getelement(), -this._size.width 2, -this._size.height 2); ctx.restore(); pixels="ctx.getImageData(0.5," math.ceil(width), math.ceil(height)).data, channels="[0," 0], total="0;" for (var i="0," l="pixels.length;" l; alpha="pixels[i" 3]; 255; channels[0] alpha; channels[1] 1] channels[2] 2] 3; i++) channels[i] total; color.read(channels) getpixel: function(point) data="this.getContext().getImageData(point.x," point.y, 1).data; color('rgb', [data[0] 255, data[1] data[2] 255], data[3] 255); setpixel: color="Color.read(arguments)," components="color._convert('rgb')," imagedata="ctx.createImageData(1," 1), data[0]="components[0]" ctx.putimagedata(imagedata, createimagedata: this.getcontext().createimagedata(size.width, getimagedata: (rect.isempty()) rectangle(this._size); this.getcontext().getimagedata(rect.x, setimagedata: function(data this.getcontext(true).putimagedata(data, _getbounds: function(getter, matrix) matrix._transformbounds(rect) rect; (this._contains(point)) hitresult('pixel', that, offset: point.add(that._size.divide(2)).round(), color: get: that.getpixel(this.offset); _draw: function(ctx) ctx.globalalpha="this._opacity;" ctx.drawimage(element, _cancomposite: true; placedsymbol="Item.extend({" 'placedsymbol', getbounds: 'getstrokebounds' symbol: placedsymbol(arg0, arg1) (!this._initialize(arg0, arg1 this.setsymbol(arg0 symbol arg0 symbol(arg0)); this._symbol="==" item._symbol; getsymbol: this._symbol; setsymbol: function(symbol) this._changed(5); placedsymbol(item.no_insert); copy.setsymbol(this._symbol); this._symbol._definition.isempty(); matrix, cacheitem) this.symbol._definition._getcachedbounds(getter, cacheitem); function(point, options, res="this._symbol._definition._hitTest(point," matrix); (res) res.item="this;" res; function(ctx, param) this.symbol._definition.draw(ctx, param); hitresult="Base.extend({" 'hitresult', hitresult(type, item, values) this.type="type;" this.item="item;" (values) values.enumerable="true;" this.inject(values); getoptions: function(options) options options._merged type: null, tolerance: paper.settings.hittolerance, fill: !options, stroke: segments: handles: ends: bounds: guides: selected: _merged: true options); segment="Base.extend({" 'segment', segment(arg0, arg1, arg2, arg3, arg4, arg5) count="arguments.length," handlein, handleout; (count="==" 0) 1) (arg0.point) handlein="arg0.handleIn;" handleout="arg0.handleOut;" typeof 'number') [ arg0, ] arg3 arg5 segmentpoint(point, '_point'); segmentpoint(handlein, '_handlein'); segmentpoint(handleout, '_handleout'); _serialize: base.serialize(this.islinear() this._point [this._point, this._handlein, this._handleout], true); _changed: (!path) return; curves="path._curves," index="this._index," curvein, curveout; (curves) ((!point this._handlein) (curvein="curves[index" path._closed curves[curves.length 1])) curvein._changed(); this._handleout) (curveout="curves[index]))" curveout._changed(); path._changed(5); getpoint: this._point; setpoint: this._point.set(point.x, gethandlein: this._handlein; sethandlein: this._handlein.set(point.x, gethandleout: this._handleout; sethandleout: this._handleout.set(point.x, islinear: this._handlein.iszero() this._handleout.iszero(); setlinear: this._handlein.set(0, this._handleout.set(0, iscolinear: function(segment) next1="this.getNext()," next2="segment.getNext();" this._handleout.iszero() next1._handlein.iszero() segment._handleout.iszero() next2._handlein.iszero() next1._point.subtract(this._point).iscolinear( next2._point.subtract(segment._point)); isorthogonal: prev="this.getPrevious()," next="this.getNext();" prev._handleout.iszero() next._handlein.iszero() this._point.subtract(prev._point).isorthogonal( next._point.subtract(this._point)); isarc: handle1="this._handleOut," handle2="next._handleIn," kappa="0.5522847498307936;" (handle1.isorthogonal(handle2)) from="this._point," to="next._point," corner="new" line(from, handle1, true).intersect( line(to, handle2, true), numerical.iszero(handle1.getlength() corner.subtract(from).getlength() kappa) numerical.iszero(handle2.getlength() corner.subtract(to).getlength() kappa); false; _selectionstate: isselected: function(_point) state="this._selectionState;" !_point !!(state & 7) _point="==" 4) this._handlein this._handleout 2) setselected: function(selected, _point) selected="!!selected," oldstate="state," flag="!_point" (selected) this._selectionstate="state;" (path oldstate) path._updateselection(this, oldstate, state); path._changed(33); getindex: this._index getpath: this._path getcurve: (!path._closed path._segments.length index--; path.getcurves()[index] getlocation: curve="this.getCurve();" curvelocation(curve, curve.getnext() getnext: segments="this._path" this._path._segments; (segments[this._index this._path._closed segments[0]) getprevious: segments[segments.length 1]) reverse: segment(this._point, this._handleout, this._handlein); remove: !!this._path.removesegment(this._index) this._handleout); equals: this this._class="==" segment._class this._point.equals(segment._point) this._handlein.equals(segment._handlein) this._handleout.equals(segment._handleout) tostring: parts="[" 'point: ' ]; (!this._handlein.iszero()) parts.push('handlein: (!this._handleout.iszero()) parts.push('handleout: '{ parts.join(', ') }'; transform: function(matrix) this._transformcoordinates(matrix, array(6), this._changed(); _transformcoordinates: function(matrix, coords, change) !this._handlein.iszero() !this._handleout.iszero() x="point._x," y="point._y," coords[0]="x;" coords[1]="y;" (handlein) coords[i++]="handleIn._x" x; y; (handleout) (matrix) matrix._transformcoordinates(coords, (change) point._x="x;" point._y="y;" handlein._x="coords[i++]" handlein._y="coords[i++]" handleout._x="coords[i++]" handleout._y="coords[i++]" (!handlein) (!handleout) coords; segmentpoint="Point.extend({" owner, key) x, y, selected; (!point) ((x="point[0])" undefined) this._x="x;" this._y="y;" this._owner="owner;" owner[key]="this;" this.setselected(true); set: function(x, y) this._owner._changed(this); this; f="options.formatter," this.isselected() x: y: [x, y]; getx: this._x; setx: function(x) gety: this._y; sety: function(y) iszero: numerical.iszero(this._x) numerical.iszero(this._y); function(selected) this._owner.setselected(selected, this); this._owner.isselected(this); 'curve', curve(arg0, arg5, arg6, arg7) 3) this._segment1="arg1;" this._segment2="arg2;" segment(); segment(arg0.segment1); segment(arg0.segment2); segment(arg0); segment(arg1); point1, point2; point1="arg0;" point2="arg3;" 8) arg1]; arg7]; segment(point1, handle1); segment(point2, null); this._length="this._bounds" undefined; getpoint1: this._segment1._point; setpoint1: this._segment1._point.set(point.x, getpoint2: this._segment2._point; setpoint2: this._segment2._point.set(point.x, gethandle1: this._segment1._handleout; sethandle1: this._segment1._handleout.set(point.x, gethandle2: this._segment2._handlein; sethandle2: this._segment2._handlein.set(point.x, getsegment1: this._segment1; getsegment2: this._segment2; this._path; this._segment1._index; this._path._curves; (curves[this._segment1._index curves[0]) this.getpoint1().isselected() this.gethandle2().isselected() this.getpoint2().isselected(); this.getpoint1().setselected(selected); this.gethandle1().setselected(selected); this.gethandle2().setselected(selected); this.getpoint2().setselected(selected); getvalues: curve.getvalues(this._segment1, this._segment2, getpoints: coords="this.getValues()," points="[];" 8; points.push(new point(coords[i], coords[i 1])); points; getlength: (this._length="=" null) this._segment2._point.getdistance(this._segment1._point) curve.getlength(this.getvalues(), this._length; getarea: curve.getarea(this.getvalues()); getpart: function(from, to) curve(curve.getpart(this.getvalues(), from, to)); getpartlength: to); this._segment1._handleout.iszero() this._segment2._handlein.iszero(); ishorizontal: this.islinear() numerical.iszero( this._segment1._point._y this._segment2._point._y); getintersections: function(curve) curve.getintersections(this.getvalues(), curve.getvalues(), curve, []); _getparameter: function(offset, isparameter) isparameter offset offset.curve="==" offset.parameter 0.5 this.getparameterat(offset, divide: isparameter, ignorelinear) parameter="this._getParameter(offset," isparameter), tolerance="0.00001," (parameter> tolerance && parameter < 1 - tolerance) {
			var parts = Curve.subdivide(this.getValues(), parameter),
				isLinear = ignoreLinear ? false : this.isLinear(),
				left = parts[0],
				right = parts[1];

			if (!isLinear) {
				this._segment1._handleOut.set(left[2] - left[0],
						left[3] - left[1]);
				this._segment2._handleIn.set(right[4] - right[6],
						right[5] - right[7]);
			}

			var x = left[6], y = left[7],
				segment = new Segment(new Point(x, y),
						!isLinear && new Point(left[4] - x, left[5] - y),
						!isLinear && new Point(right[2] - x, right[3] - y));

			if (this._path) {
				if (this._segment1._index > 0 && this._segment2._index === 0) {
					this._path.add(segment);
				} else {
					this._path.insert(this._segment2._index, segment);
				}
				res = this; 
			} else {
				var end = this._segment2;
				this._segment2 = segment;
				res = new Curve(segment, end);
			}
		}
		return res;
	},

	split: function(offset, isParameter) {
		return this._path
			? this._path.split(this._segment1._index,
					this._getParameter(offset, isParameter))
			: null;
	},

	reverse: function() {
		return new Curve(this._segment2.reverse(), this._segment1.reverse());
	},

	remove: function() {
		var removed = false;
		if (this._path) {
			var segment2 = this._segment2,
				handleOut = segment2._handleOut;
			removed = segment2.remove();
			if (removed)
				this._segment1._handleOut.set(handleOut.x, handleOut.y);
		}
		return removed;
	},

	clone: function() {
		return new Curve(this._segment1, this._segment2);
	},

	toString: function() {
		var parts = [ 'point1: ' + this._segment1._point ];
		if (!this._segment1._handleOut.isZero())
			parts.push('handle1: ' + this._segment1._handleOut);
		if (!this._segment2._handleIn.isZero())
			parts.push('handle2: ' + this._segment2._handleIn);
		parts.push('point2: ' + this._segment2._point);
		return '{ ' + parts.join(', ') + ' }';
	},

statics: {
	getValues: function(segment1, segment2, matrix) {
		var p1 = segment1._point,
			h1 = segment1._handleOut,
			h2 = segment2._handleIn,
			p2 = segment2._point,
			values = [
				p1._x, p1._y,
				p1._x + h1._x, p1._y + h1._y,
				p2._x + h2._x, p2._y + h2._y,
				p2._x, p2._y
			];
		if (matrix)
			matrix._transformCoordinates(values, 0, values, 0, 6);
		return values;
	},

	evaluate: function(v, t, type) {
		var p1x = v[0], p1y = v[1],
			c1x = v[2], c1y = v[3],
			c2x = v[4], c2y = v[5],
			p2x = v[6], p2y = v[7],
			tolerance = 0.00001,
			x, y;

		if (type === 0 && (t < tolerance || t > 1 - tolerance)) {
			var isZero = t < tolerance;
			x = isZero ? p1x : p2x;
			y = isZero ? p1y : p2y;
		} else {
			var cx = 3 * (c1x - p1x),
				bx = 3 * (c2x - c1x) - cx,
				ax = p2x - p1x - cx - bx,

				cy = 3 * (c1y - p1y),
				by = 3 * (c2y - c1y) - cy,
				ay = p2y - p1y - cy - by;
			if (type === 0) {
				x = ((ax * t + bx) * t + cx) * t + p1x;
				y = ((ay * t + by) * t + cy) * t + p1y;
			} else {
				if (t < tolerance && c1x === p1x && c1y === p1y
						|| t > 1 - tolerance && c2x === p2x && c2y === p2y) {
					x = p2x - p1x;
					y = p2y - p1y;
				} else if (t < tolerance) {
					x = cx;
					y = cy;
				} else if (t > 1 - tolerance) {
					x = 3 * (p2x - c2x);
					y = 3 * (p2y - c2y);
				} else {
					x = (3 * ax * t + 2 * bx) * t + cx;
					y = (3 * ay * t + 2 * by) * t + cy;
				}
				if (type === 3) {
					var x2 = 6 * ax * t + 2 * bx,
						y2 = 6 * ay * t + 2 * by;
					return (x * y2 - y * x2) / Math.pow(x * x + y * y, 3 / 2);
				}
			}
		}
		return type === 2 ? new Point(y, -x) : new Point(x, y);
	},

	subdivide: function(v, t) {
		var p1x = v[0], p1y = v[1],
			c1x = v[2], c1y = v[3],
			c2x = v[4], c2y = v[5],
			p2x = v[6], p2y = v[7];
		if (t === undefined)
			t = 0.5;
		var u = 1 - t,
			p3x = u * p1x + t * c1x, p3y = u * p1y + t * c1y,
			p4x = u * c1x + t * c2x, p4y = u * c1y + t * c2y,
			p5x = u * c2x + t * p2x, p5y = u * c2y + t * p2y,
			p6x = u * p3x + t * p4x, p6y = u * p3y + t * p4y,
			p7x = u * p4x + t * p5x, p7y = u * p4y + t * p5y,
			p8x = u * p6x + t * p7x, p8y = u * p6y + t * p7y;
		return [
			[p1x, p1y, p3x, p3y, p6x, p6y, p8x, p8y], 
			[p8x, p8y, p7x, p7y, p5x, p5y, p2x, p2y] 
		];
	},

	solveCubic: function (v, coord, val, roots, min, max) {
		var p1 = v[coord],
			c1 = v[coord + 2],
			c2 = v[coord + 4],
			p2 = v[coord + 6],
			c = 3 * (c1 - p1),
			b = 3 * (c2 - c1) - c,
			a = p2 - p1 - c - b;
		return Numerical.solveCubic(a, b, c, p1 - val, roots, min, max);
	},

	getParameterOf: function(v, x, y) {
		var tolerance = 0.00001;
		if (Math.abs(v[0] - x) < tolerance && Math.abs(v[1] - y) < tolerance)
			return 0;
		if (Math.abs(v[6] - x) < tolerance && Math.abs(v[7] - y) < tolerance)
			return 1;
		var txs = [],
			tys = [],
			sx = Curve.solveCubic(v, 0, x, txs),
			sy = Curve.solveCubic(v, 1, y, tys),
			tx, ty;
		for (var cx = 0;  sx == -1 || cx < sx;) {
			if (sx == -1 || (tx = txs[cx++]) >= 0 && tx <= 1) { for (var cy="0;" sy="=" -1 || < sy;) if (sy="=" (ty="tys[cy++])">= 0 && ty <= 1) { if (sx="=" -1) tx="ty;" else (sy="=" ty="tx;" (math.abs(tx - ty) < tolerance) return (tx + * 0.5; } break; null; }, getpart: function(v, from, to) (from> 0)
			v = Curve.subdivide(v, from)[1]; 
		if (to < 1)
			v = Curve.subdivide(v, (to - from) / (1 - from))[0]; 
		return v;
	},

	isLinear: function(v) {
		var isZero = Numerical.isZero;
		return isZero(v[0] - v[2]) && isZero(v[1] - v[3])
				&& isZero(v[4] - v[6]) && isZero(v[5] - v[7]);
	},

	isFlatEnough: function(v, tolerance) {
		var p1x = v[0], p1y = v[1],
			c1x = v[2], c1y = v[3],
			c2x = v[4], c2y = v[5],
			p2x = v[6], p2y = v[7],
			ux = 3 * c1x - 2 * p1x - p2x,
			uy = 3 * c1y - 2 * p1y - p2y,
			vx = 3 * c2x - 2 * p2x - p1x,
			vy = 3 * c2y - 2 * p2y - p1y;
		return Math.max(ux * ux, vx * vx) + Math.max(uy * uy, vy * vy)
				< 10 * tolerance * tolerance;
	},

	getArea: function(v) {
		var p1x = v[0], p1y = v[1],
			c1x = v[2], c1y = v[3],
			c2x = v[4], c2y = v[5],
			p2x = v[6], p2y = v[7];
		return (  3.0 * c1y * p1x - 1.5 * c1y * c2x
				- 1.5 * c1y * p2x - 3.0 * p1y * c1x
				- 1.5 * p1y * c2x - 0.5 * p1y * p2x
				+ 1.5 * c2y * p1x + 1.5 * c2y * c1x
				- 3.0 * c2y * p2x + 0.5 * p2y * p1x
				+ 1.5 * p2y * c1x + 3.0 * p2y * c2x) / 10;
	},

	getBounds: function(v) {
		var min = v.slice(0, 2), 
			max = min.slice(), 
			roots = [0, 0];
		for (var i = 0; i < 2; i++)
			Curve._addBounds(v[i], v[i + 2], v[i + 4], v[i + 6],
					i, 0, min, max, roots);
		return new Rectangle(min[0], min[1], max[0] - min[0], max[1] - min[1]);
	},

	_addBounds: function(v0, v1, v2, v3, coord, padding, min, max, roots) {
		function add(value, padding) {
			var left = value - padding,
				right = value + padding;
			if (left < min[coord])
				min[coord] = left;
			if (right > max[coord])
				max[coord] = right;
		}
		var a = 3 * (v1 - v2) - v0 + v3,
			b = 2 * (v0 + v2) - 4 * v1,
			c = v1 - v0,
			count = Numerical.solveQuadratic(a, b, c, roots),
			tMin = 0.00001,
			tMax = 1 - tMin;
		add(v3, 0);
		for (var i = 0; i < count; i++) {
			var t = roots[i],
				u = 1 - t;
			if (tMin < t && t < tMax)
				add(u * u * u * v0
					+ 3 * u * u * t * v1
					+ 3 * u * t * t * v2
					+ t * t * t * v3,
					padding);
		}
	}
}}, Base.each(['getBounds', 'getStrokeBounds', 'getHandleBounds', 'getRoughBounds'],
	function(name) {
		this[name] = function() {
			if (!this._bounds)
				this._bounds = {};
			var bounds = this._bounds[name];
			if (!bounds) {
				bounds = this._bounds[name] = Path[name]([this._segment1,
						this._segment2], false, this._path.getStyle());
			}
			return bounds.clone();
		};
	},
{

}), Base.each(['getPoint', 'getTangent', 'getNormal', 'getCurvature'],
	function(name, index) {
		this[name + 'At'] = function(offset, isParameter) {
			var values = this.getValues();
			return Curve.evaluate(values, isParameter
					? offset : Curve.getParameterAt(values, offset, 0), index);
		};
		this[name] = function(parameter) {
			return Curve.evaluate(this.getValues(), parameter, index);
		};
	},
{
	getParameterAt: function(offset, start) {
		return Curve.getParameterAt(this.getValues(), offset,
				start !== undefined ? start : offset < 0 ? 1 : 0);
	},

	getParameterOf: function(point) { 
		var point = Point.read(arguments);
		return Curve.getParameterOf(this.getValues(), point.x, point.y);
	},

	getLocationAt: function(offset, isParameter) {
		if (!isParameter)
			offset = this.getParameterAt(offset);
		return new CurveLocation(this, offset);
	},

	getLocationOf: function(point) { 
		var point = Point.read(arguments),
			t = this.getParameterOf(point);
		return t != null ? new CurveLocation(this, t) : null;
	},

	getNearestLocation: function(point) { 
		var point = Point.read(arguments),
			values = this.getValues(),
			count = 100,
			minDist = Infinity,
			minT = 0;

		function refine(t) {
			if (t >= 0 && t <= 1) { var dist="point.getDistance(" curve.evaluate(values, t, 0), true); if (dist < mindist) mindist="dist;" mint="t;" return true; } for (var i="0;" i++) refine(i count); step="1" (count * 2); while (step> 0.00001) {
			if (!refine(minT - step) && !refine(minT + step))
				step /= 2;
		}
		var pt = Curve.evaluate(values, minT, 0);
		return new CurveLocation(this, minT, pt, null, null, null,
				point.getDistance(pt));
	},

	getNearestPoint: function(point) {
		var point = Point.read(arguments);
		return this.getNearestLocation(point).getPoint();
	}

}),
new function() { 

	function getLengthIntegrand(v) {
		var p1x = v[0], p1y = v[1],
			c1x = v[2], c1y = v[3],
			c2x = v[4], c2y = v[5],
			p2x = v[6], p2y = v[7],

			ax = 9 * (c1x - c2x) + 3 * (p2x - p1x),
			bx = 6 * (p1x + c2x) - 12 * c1x,
			cx = 3 * (c1x - p1x),

			ay = 9 * (c1y - c2y) + 3 * (p2y - p1y),
			by = 6 * (p1y + c2y) - 12 * c1y,
			cy = 3 * (c1y - p1y);

		return function(t) {
			var dx = (ax * t + bx) * t + cx,
				dy = (ay * t + by) * t + cy;
			return Math.sqrt(dx * dx + dy * dy);
		};
	}

	function getIterations(a, b) {
		return Math.max(2, Math.min(16, Math.ceil(Math.abs(b - a) * 32)));
	}

	return {
		statics: true,

		getLength: function(v, a, b) {
			if (a === undefined)
				a = 0;
			if (b === undefined)
				b = 1;
			var isZero = Numerical.isZero;
			if (a === 0 && b === 1
					&& isZero(v[0] - v[2]) && isZero(v[1] - v[3])
					&& isZero(v[6] - v[4]) && isZero(v[7] - v[5])) {
				var dx = v[6] - v[0], 
					dy = v[7] - v[1]; 
				return Math.sqrt(dx * dx + dy * dy);
			}
			var ds = getLengthIntegrand(v);
			return Numerical.integrate(ds, a, b, getIterations(a, b));
		},

		getParameterAt: function(v, offset, start) {
			if (offset === 0)
				return start;
			var forward = offset > 0,
				a = forward ? start : 0,
				b = forward ? 1 : start,
				offset = Math.abs(offset),
				ds = getLengthIntegrand(v),
				rangeLength = Numerical.integrate(ds, a, b,
						getIterations(a, b));
			if (offset >= rangeLength)
				return forward ? b : a;
			var guess = offset / rangeLength,
				length = 0;
			function f(t) {
				var count = getIterations(start, t);
				length += start < t
						? Numerical.integrate(ds, start, t, count)
						: -Numerical.integrate(ds, t, start, count);
				start = t;
				return length - offset;
			}
			return Numerical.findRoot(f, ds,
					forward ? a + guess : b - guess, 
					a, b, 16, 0.00001);
		}
	};
}, new function() { 
	function addLocation(locations, include, curve1, t1, point1, curve2, t2,
			point2) {
		var loc = new CurveLocation(curve1, t1, point1, curve2, t2, point2);
		if (!include || include(loc))
			locations.push(loc);
	}

	function addCurveIntersections(v1, v2, curve1, curve2, locations, include,
			tMin, tMax, uMin, uMax, oldTDiff, reverse, recursion) {
		if (recursion > 20)
			return;
		var q0x = v2[0], q0y = v2[1], q3x = v2[6], q3y = v2[7],
			tolerance = 0.00001,
			hullEpsilon = 1e-9,
			getSignedDistance = Line.getSignedDistance,
			d1 = getSignedDistance(q0x, q0y, q3x, q3y, v2[2], v2[3]) || 0,
			d2 = getSignedDistance(q0x, q0y, q3x, q3y, v2[4], v2[5]) || 0,
			factor = d1 * d2 > 0 ? 3 / 4 : 4 / 9,
			dMin = factor * Math.min(0, d1, d2),
			dMax = factor * Math.max(0, d1, d2),
			dp0 = getSignedDistance(q0x, q0y, q3x, q3y, v1[0], v1[1]),
			dp1 = getSignedDistance(q0x, q0y, q3x, q3y, v1[2], v1[3]),
			dp2 = getSignedDistance(q0x, q0y, q3x, q3y, v1[4], v1[5]),
			dp3 = getSignedDistance(q0x, q0y, q3x, q3y, v1[6], v1[7]),
			tMinNew, tMaxNew, tDiff;
		if (q0x === q3x && uMax - uMin <= hullepsilon && recursion> 3) {
			tMinNew = (tMax + tMin) / 2;
			tMaxNew = tMinNew;
			tDiff = 0;
		} else {
			var hull = getConvexHull(dp0, dp1, dp2, dp3),
				top = hull[0],
				bottom = hull[1],
				tMinClip, tMaxClip;
			tMinClip = clipConvexHull(top, bottom, dMin, dMax);
			top.reverse();
			bottom.reverse();
			tMaxClip = clipConvexHull(top, bottom, dMin, dMax);
			if (tMinClip == null || tMaxClip == null)
				return false;
			v1 = Curve.getPart(v1, tMinClip, tMaxClip);
			tDiff = tMaxClip - tMinClip;
			tMinNew = tMax * tMinClip + tMin * (1 - tMinClip);
			tMaxNew = tMax * tMaxClip + tMin * (1 - tMaxClip);
		}
		if (oldTDiff > 0.8 && tDiff > 0.8) {
			if (tMaxNew - tMinNew > uMax - uMin) {
				var parts = Curve.subdivide(v1, 0.5),
					t = tMinNew + (tMaxNew - tMinNew) / 2;
				addCurveIntersections(
					v2, parts[0], curve2, curve1, locations, include,
					uMin, uMax, tMinNew, t, tDiff, !reverse, ++recursion);
				addCurveIntersections(
					v2, parts[1], curve2, curve1, locations, include,
					uMin, uMax, t, tMaxNew, tDiff, !reverse, recursion);
			} else {
				var parts = Curve.subdivide(v2, 0.5),
					t = uMin + (uMax - uMin) / 2;
				addCurveIntersections(
					parts[0], v1, curve2, curve1, locations, include,
					uMin, t, tMinNew, tMaxNew, tDiff, !reverse, ++recursion);
				addCurveIntersections(
					parts[1], v1, curve2, curve1, locations, include,
					t, uMax, tMinNew, tMaxNew, tDiff, !reverse, recursion);
			}
		} else if (Math.max(uMax - uMin, tMaxNew - tMinNew) < tolerance) {
			var t1 = tMinNew + (tMaxNew - tMinNew) / 2,
				t2 = uMin + (uMax - uMin) / 2;
			if (reverse) {
				addLocation(locations, include,
						curve2, t2, Curve.evaluate(v2, t2, 0),
						curve1, t1, Curve.evaluate(v1, t1, 0));
			} else {
				addLocation(locations, include,
						curve1, t1, Curve.evaluate(v1, t1, 0),
						curve2, t2, Curve.evaluate(v2, t2, 0));
			}
		} else { 
			addCurveIntersections(v2, v1, curve2, curve1, locations, include,
					uMin, uMax, tMinNew, tMaxNew, tDiff, !reverse, ++recursion);
		}
	}

	function getConvexHull(dq0, dq1, dq2, dq3) {
		var p0 = [ 0, dq0 ],
			p1 = [ 1 / 3, dq1 ],
			p2 = [ 2 / 3, dq2 ],
			p3 = [ 1, dq3 ],
			getSignedDistance = Line.getSignedDistance,
			dist1 = getSignedDistance(0, dq0, 1, dq3, 1 / 3, dq1),
			dist2 = getSignedDistance(0, dq0, 1, dq3, 2 / 3, dq2),
			flip = false,
			hull;
		if (dist1 * dist2 < 0) {
			hull = [[p0, p1, p3], [p0, p2, p3]];
			flip = dist1 < 0;
		} else {
			var pmax, cross = 0,
				distZero = dist1 === 0 || dist2 === 0;
			if (Math.abs(dist1) > Math.abs(dist2)) {
				pmax = p1;
				cross = (dq3 - dq2 - (dq3 - dq0) / 3)
						* (2 * (dq3 - dq2) - dq3 + dq1) / 3;
			} else {
				pmax = p2;
				cross = (dq1 - dq0 + (dq0 - dq3) / 3)
						* (-2 * (dq0 - dq1) + dq0 - dq2) / 3;
			}
			hull = cross < 0 || distZero
					? [[p0, pmax, p3], [p0, p3]]
					: [[p0, p1, p2, p3], [p0, p3]];
			flip = dist1 ? dist1 < 0 : dist2 < 0;
		}
		return flip ? hull.reverse() : hull;
	}

	function clipConvexHull(hullTop, hullBottom, dMin, dMax) {
		var tProxy,
			tVal = null,
			px, py,
			qx, qy;
		for (var i = 0, l = hullBottom.length - 1; i < l; i++) {
			py = hullBottom[i][1];
			qy = hullBottom[i + 1][1];
			if (py < qy) {
				tProxy = null;
			} else if (qy <= dmax) { px="hullBottom[i][0];" qx="hullBottom[i" + 1][0]; tproxy="px" (dmax - py) * (qx px) (qy py); } else continue; break; if (hulltop[0][1] <="dMax)" for (var i="0," l="hullTop.length" 1; l; i++) py="hullTop[i][1];" qy="hullTop[i" 1][1]; (py>= dMin) {
				tVal = tProxy;
			} else if (py > qy) {
				tVal = null;
			} else if (qy >= dMin) {
				px = hullTop[i][0];
				qx = hullTop[i + 1][0];
				tVal = px + (dMin  - py) * (qx - px) / (qy - py);
			} else {
				continue;
			}
			break;
		}
		return tVal;
	}

	function addCurveLineIntersections(v1, v2, curve1, curve2, locations,
			include) {
		var flip = Curve.isLinear(v1),
			vc = flip ? v2 : v1,
			vl = flip ? v1 : v2,
			lx1 = vl[0], ly1 = vl[1],
			lx2 = vl[6], ly2 = vl[7],
			ldx = lx2 - lx1,
			ldy = ly2 - ly1,
			angle = Math.atan2(-ldy, ldx),
			sin = Math.sin(angle),
			cos = Math.cos(angle),
			rlx2 = ldx * cos - ldy * sin,
			rvl = [0, 0, 0, 0, rlx2, 0, rlx2, 0],
			rvc = [];
		for(var i = 0; i < 8; i += 2) {
			var x = vc[i] - lx1,
				y = vc[i + 1] - ly1;
			rvc.push(
				x * cos - y * sin,
				y * cos + x * sin);
		}
		var roots = [],
			count = Curve.solveCubic(rvc, 1, 0, roots, 0, 1);
		for (var i = 0; i < count; i++) {
			var tc = roots[i],
				x = Curve.evaluate(rvc, tc, 0).x;
			if (x >= 0 && x <= 0 1 rlx2) { var tl="Curve.getParameterOf(rvl," x, 0), t1="flip" ? : tc, t2="flip" tc tl; addlocation(locations, include, curve1, t1, curve.evaluate(v1, curve2, t2, curve.evaluate(v2, 0)); } function addlineintersection(v1, v2, locations, include) point="Line.intersect(" v1[0], v1[1], v1[6], v1[7], v2[0], v2[1], v2[6], v2[7]); if (point) x="point.x," y="point.y;" curve.getparameterof(v1, y), point, curve.getparameterof(v2, point); return statics: getintersections: function(v1, linear1="Curve.isLinear(v1)," linear2="Curve.isLinear(v2);" (linear1 && addlineintersection || addcurvelineintersections addcurveintersections)( v1, 0, 1, false, 0); locations; }}; }); curvelocation="Base.extend({" _class: 'curvelocation', initialize: curvelocation(curve, parameter, _curve2, _parameter2, _point2, _distance) this._id="CurveLocation._id" = (curvelocation._id 0) + 1; this._curve="curve;" this._segment1="curve._segment1;" this._segment2="curve._segment2;" this._parameter="parameter;" this._point="point;" this._curve2="_curve2;" this._parameter2="_parameter2;" this._point2="_point2;" this._distance="_distance;" }, getsegment: function(_preferfirst) (!this._segment) curve="this.getCurve()," parameter="this.getParameter();" (parameter="==" 1) this._segment="curve._segment2;" else _preferfirst) null) null; parameter) < curve.getlength(parameter, curve._segment1 curve._segment2; this._segment; setsegment: function(segment) getcurve: function(_uncached) (!this._curve _uncached) (this._curve.getparameterof(this._point)="=" this._curve; setcurve: function(curve) getintersection: function() intersection="this._intersection;" (!intersection this._curve2) param="this._parameter2;" this._intersection="intersection" new curvelocation( this._curve2, param, this._point, this); intersection._intersection="this;" intersection; getpath: curve._path; getindex: curve.getindex(); getoffset: path="this.getPath();" path._getoffset(this); getcurveoffset: !="null" curve.getlength(0, parameter); getparameter: ((this._parameter="=" null this._point) this._point); curve.getparameterof(this._point); this._parameter; setparameter: function(parameter) getpoint: ((!this._point curve.getpointat(this._parameter, true); this._point; setpoint: function(point) gettangent: curve.gettangentat(parameter, getnormal: curve.getnormalat(parameter, getdistance: this._distance; divide: curve.divide(this.getparameter(true), split: curve.split(this.getparameter(true), equals: function(loc) iszero="Numerical.isZero;" this="==" loc loc._curve loc._curve2 iszero(this._parameter - loc._parameter) iszero(this._parameter2 loc._parameter2) false; tostring: parts="[]," f="Formatter.instance;" parts.push('point: ' index="this.getIndex();" (index parts.push('index: index); parts.push('parameter: f.number(parameter)); (this._distance parts.push('distance: f.number(this._distance)); '{ parts.join(', ') }'; pathitem="Item.extend({" 'pathitem', pathitem() function(path, _expand) (this="==" path) (path !this.getbounds().touches(path.getbounds())) []; locations="[]," curves1="this.getCurves()," curves2="path" path.getcurves() curves1, matrix1="this._matrix.orNullIfIdentity()," matrix2="path" path._matrix.ornullifidentity() matrix1, length1="curves1.length," length2="path" curves2.length length1, values2="[]," min="1e-11," max="1" 1e-11; for (var i="0;" length2; i++) values2[i]="curves2[i].getValues(matrix2);" length1; curve1="curves1[i]," values1="path" curve1.getvalues(matrix1) values2[i]; (!path) seg1="curve1.getSegment1()," seg2="curve1.getSegment2()," h1="seg1._handleOut," h2="seg2._handleIn;" (new line(seg1._point.subtract(h1), h1.multiply(2), true) .intersect(new line(seg2._point.subtract(h2), h2.multiply(2), true), false)) curve.getintersections( parts[0], parts[1], (loc._parameter loc._parameter 2; loc._parameter2="0.5" true; ); j="path" j++) values1, values2[j], curves2[j], !path (j="==" t="loc._parameter;">= MIN && t <= max; } ); var last="locations.length" - 1; for (var i="last;">= 0; i--) {
			var loc = locations[i],
				next = loc._curve.getNext(),
				next2 = loc._curve2.getNext();
			if (next && loc._parameter >= MAX) {
				loc._parameter = 0;
				loc._curve = next;
			}
			if (next2 && loc._parameter2 >= MAX) {
				loc._parameter2 = 0;
				loc._curve2 = next2;
			}
		}

		function compare(loc1, loc2) {
			var path1 = loc1.getPath(),
				path2 = loc2.getPath();
			return path1 === path2
					? (loc1.getIndex() + loc1.getParameter())
							- (loc2.getIndex() + loc2.getParameter())
					: path1._id - path2._id;
		}

		if (last > 0) {
			locations.sort(compare);
			for (var i = last; i >= 0; i--) {
				if (locations[i].equals(locations[i === 0 ? last : i - 1])) {
					locations.splice(i, 1);
					last--;
				}
			}
		}
		if (_expand) {
			for (var i = last; i >= 0; i--)
				locations.push(locations[i].getIntersection());
			locations.sort(compare);
		}
		return locations;
	},

	setPathData: function(data) {

		var parts = data.match(/[mlhvcsqtaz][^mlhvcsqtaz]*/ig),
			coords,
			relative = false,
			previous,
			control,
			current = new Point(),
			start = new Point();

		function getCoord(index, coord) {
			var val = +coords[index];
			if (relative)
				val += current[coord];
			return val;
		}

		function getPoint(index) {
			return new Point(
				getCoord(index, 'x'),
				getCoord(index + 1, 'y')
			);
		}

		this.clear();

		for (var i = 0, l = parts.length; i < l; i++) {
			var part = parts[i],
				command = part[0],
				lower = command.toLowerCase();
			coords = part.match(/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g);
			var length = coords && coords.length;
			relative = command === lower;
			if (previous === 'z' && lower !== 'z')
				this.moveTo(current = start);
			switch (lower) {
			case 'm':
			case 'l':
				var move = lower === 'm';
				if (move && previous && previous !== 'z')
					this.closePath();
				for (var j = 0; j < length; j += 2)
					this[j === 0 && move ? 'moveTo' : 'lineTo'](
							current = getPoint(j));
				control = current;
				if (move)
					start = current;
				break;
			case 'h':
			case 'v':
				var coord = lower === 'h' ? 'x' : 'y';
				for (var j = 0; j < length; j++) {
					current[coord] = getCoord(j, coord);
					this.lineTo(current);
				}
				control = current;
				break;
			case 'c':
				for (var j = 0; j < length; j += 6) {
					this.cubicCurveTo(
							getPoint(j),
							control = getPoint(j + 2),
							current = getPoint(j + 4));
				}
				break;
			case 's':
				for (var j = 0; j < length; j += 4) {
					this.cubicCurveTo(
							/[cs]/.test(previous)
									? current.multiply(2).subtract(control)
									: current,
							control = getPoint(j),
							current = getPoint(j + 2));
					previous = lower;
				}
				break;
			case 'q':
				for (var j = 0; j < length; j += 4) {
					this.quadraticCurveTo(
							control = getPoint(j),
							current = getPoint(j + 2));
				}
				break;
			case 't':
				for (var j = 0; j < length; j += 2) {
					this.quadraticCurveTo(
							control = (/[qt]/.test(previous)
									? current.multiply(2).subtract(control)
									: current),
							current = getPoint(j));
					previous = lower;
				}
				break;
			case 'a':
				for (var j = 0; j < length; j += 7) {
					this.arcTo(current = getPoint(j + 5),
							new Size(+coords[0], +coords[1]),
							+coords[2], +coords[4], +coords[3]);
				}
				break;
			case 'z':
				this.closePath();
				break;
			}
			previous = lower;
		}
	},

	_canComposite: function() {
		return !(this.hasFill() && this.hasStroke());
	},

	_contains: function(point) {
		var winding = this._getWinding(point, false, true);
		return !!(this.getWindingRule() === 'evenodd' ? winding & 1 : winding);
	},

});

var Path = PathItem.extend({
	_class: 'Path',
	_serializeFields: {
		segments: [],
		closed: false
	},

	initialize: function Path(arg) {
		this._closed = false;
		this._segments = [];
		var segments = Array.isArray(arg)
			? typeof arg[0] === 'object'
				? arg
				: arguments
			: arg && (arg.size === undefined && (arg.x !== undefined
					|| arg.point !== undefined))
				? arguments
				: null;
		if (segments && segments.length > 0) {
			this.setSegments(segments);
		} else {
			this._curves = undefined; 
			this._selectedSegmentState = 0;
			if (!segments && typeof arg === 'string') {
				this.setPathData(arg);
				arg = null;
			}
		}
		this._initialize(!segments && arg);
	},

	_equals: function(item) {
		return Base.equals(this._segments, item._segments);
	},

	clone: function(insert) {
		var copy = new Path(Item.NO_INSERT);
		copy.setSegments(this._segments);
		copy._closed = this._closed;
		if (this._clockwise !== undefined)
			copy._clockwise = this._clockwise;
		return this._clone(copy, insert);
	},

	_changed: function _changed(flags) {
		_changed.base.call(this, flags);
		if (flags & 4) {
			(this._compound ? this._parent : this)._currentPath = undefined;
			this._length = this._clockwise = undefined;
			if (this._curves) {
				for (var i = 0, l = this._curves.length; i < l; i++)
					this._curves[i]._changed(5);
			}
			this._monoCurves = undefined;
		} else if (flags & 8) {
			this._bounds = undefined;
		}
	},

	getStyle: function() {
		var parent = this._parent;
		return (parent instanceof CompoundPath ? parent : this)._style;
	},

	getSegments: function() {
		return this._segments;
	},

	setSegments: function(segments) {
		var fullySelected = this.isFullySelected();
		this._segments.length = 0;
		this._selectedSegmentState = 0;
		this._curves = undefined;
		if (segments && segments.length > 0)
			this._add(Segment.readAll(segments));
		if (fullySelected)
			this.setFullySelected(true);
	},

	getFirstSegment: function() {
		return this._segments[0];
	},

	getLastSegment: function() {
		return this._segments[this._segments.length - 1];
	},

	getCurves: function() {
		var curves = this._curves,
			segments = this._segments;
		if (!curves) {
			var length = this._countCurves();
			curves = this._curves = new Array(length);
			for (var i = 0; i < length; i++)
				curves[i] = new Curve(this, segments[i],
					segments[i + 1] || segments[0]);
		}
		return curves;
	},

	getFirstCurve: function() {
		return this.getCurves()[0];
	},

	getLastCurve: function() {
		var curves = this.getCurves();
		return curves[curves.length - 1];
	},

	getPathData: function(precision) {
		var segments = this._segments,
			f = Formatter.instance,
			parts = [];

		function addCurve(seg1, seg2, skipLine) {
			var point1 = seg1._point,
				point2 = seg2._point,
				handle1 = seg1._handleOut,
				handle2 = seg2._handleIn;
			if (handle1.isZero() && handle2.isZero()) {
				if (!skipLine) {
					parts.push('L' + f.point(point2, precision));
				}
			} else {
				var end = point2.subtract(point1);
				parts.push('c' + f.point(handle1, precision)
						+ ' ' + f.point(end.add(handle2), precision)
						+ ' ' + f.point(end, precision));
			}
		}

		if (segments.length === 0)
			return '';
		parts.push('M' + f.point(segments[0]._point));
		for (var i = 0, l = segments.length  - 1; i < l; i++)
			addCurve(segments[i], segments[i + 1], false);
		if (this._closed) {
			addCurve(segments[segments.length - 1], segments[0], true);
			parts.push('z');
		}
		return parts.join('');
	},

	isClosed: function() {
		return this._closed;
	},

	setClosed: function(closed) {
		if (this._closed != (closed = !!closed)) {
			this._closed = closed;
			if (this._curves) {
				var length = this._curves.length = this._countCurves();
				if (closed)
					this._curves[length - 1] = new Curve(this,
						this._segments[length - 1], this._segments[0]);
			}
			this._changed(5);
		}
	},

	isEmpty: function() {
		return this._segments.length === 0;
	},

	isPolygon: function() {
		for (var i = 0, l = this._segments.length; i < l; i++) {
			if (!this._segments[i].isLinear())
				return false;
		}
		return true;
	},

	_transformContent: function(matrix) {
		var coords = new Array(6);
		for (var i = 0, l = this._segments.length; i < l; i++)
			this._segments[i]._transformCoordinates(matrix, coords, true);
		return true;
	},

	_add: function(segs, index) {
		var segments = this._segments,
			curves = this._curves,
			amount = segs.length,
			append = index == null,
			index = append ? segments.length : index;
		for (var i = 0; i < amount; i++) {
			var segment = segs[i];
			if (segment._path)
				segment = segs[i] = segment.clone();
			segment._path = this;
			segment._index = index + i;
			if (segment._selectionState)
				this._updateSelection(segment, 0, segment._selectionState);
		}
		if (append) {
			segments.push.apply(segments, segs);
		} else {
			segments.splice.apply(segments, [index, 0].concat(segs));
			for (var i = index + amount, l = segments.length; i < l; i++)
				segments[i]._index = i;
		}
		if (curves || segs._curves) {
			if (!curves)
				curves = this._curves = [];
			var from = index > 0 ? index - 1 : index,
				start = from,
				to = Math.min(from + amount, this._countCurves());
			if (segs._curves) {
				curves.splice.apply(curves, [from, 0].concat(segs._curves));
				start += segs._curves.length;
			}
			for (var i = start; i < to; i++)
				curves.splice(i, 0, new Curve(this, null, null));
			this._adjustCurves(from, to);
		}
		this._changed(5);
		return segs;
	},

	_adjustCurves: function(from, to) {
		var segments = this._segments,
			curves = this._curves,
			curve;
		for (var i = from; i < to; i++) {
			curve = curves[i];
			curve._path = this;
			curve._segment1 = segments[i];
			curve._segment2 = segments[i + 1] || segments[0];
		}
		if (curve = curves[this._closed && from === 0 ? segments.length - 1
				: from - 1])
			curve._segment2 = segments[from] || segments[0];
		if (curve = curves[to])
			curve._segment1 = segments[to];
	},

	_countCurves: function() {
		var length = this._segments.length;
		return !this._closed && length > 0 ? length - 1 : length;
	},

	add: function(segment1 ) {
		return arguments.length > 1 && typeof segment1 !== 'number'
			? this._add(Segment.readAll(arguments))
			: this._add([ Segment.read(arguments) ])[0];
	},

	insert: function(index, segment1 ) {
		return arguments.length > 2 && typeof segment1 !== 'number'
			? this._add(Segment.readAll(arguments, 1), index)
			: this._add([ Segment.read(arguments, 1) ], index)[0];
	},

	addSegment: function() {
		return this._add([ Segment.read(arguments) ])[0];
	},

	insertSegment: function(index ) {
		return this._add([ Segment.read(arguments, 1) ], index)[0];
	},

	addSegments: function(segments) {
		return this._add(Segment.readAll(segments));
	},

	insertSegments: function(index, segments) {
		return this._add(Segment.readAll(segments), index);
	},

	removeSegment: function(index) {
		return this.removeSegments(index, index + 1)[0] || null;
	},

	removeSegments: function(from, to, _includeCurves) {
		from = from || 0;
		to = Base.pick(to, this._segments.length);
		var segments = this._segments,
			curves = this._curves,
			count = segments.length, 
			removed = segments.splice(from, to - from),
			amount = removed.length;
		if (!amount)
			return removed;
		for (var i = 0; i < amount; i++) {
			var segment = removed[i];
			if (segment._selectionState)
				this._updateSelection(segment, segment._selectionState, 0);
			segment._index = segment._path = null;
		}
		for (var i = from, l = segments.length; i < l; i++)
			segments[i]._index = i;
		if (curves) {
			var index = from > 0 && to === count + (this._closed ? 1 : 0)
					? from - 1
					: from,
				curves = curves.splice(index, amount);
			if (_includeCurves)
				removed._curves = curves.slice(1);
			this._adjustCurves(index, index);
		}
		this._changed(5);
		return removed;
	},

	clear: '#removeSegments',

	isFullySelected: function() {
		var length = this._segments.length;
		return this._selected && length > 0 && this._selectedSegmentState
				=== length * 7;
	},

	setFullySelected: function(selected) {
		if (selected)
			this._selectSegments(true);
		this.setSelected(selected);
	},

	setSelected: function setSelected(selected) {
		if (!selected)
			this._selectSegments(false);
		setSelected.base.call(this, selected);
	},

	_selectSegments: function(selected) {
		var length = this._segments.length;
		this._selectedSegmentState = selected
				? length * 7 : 0;
		for (var i = 0; i < length; i++)
			this._segments[i]._selectionState = selected
					? 7 : 0;
	},

	_updateSelection: function(segment, oldState, newState) {
		segment._selectionState = newState;
		var total = this._selectedSegmentState += newState - oldState;
		if (total > 0)
			this.setSelected(true);
	},

	flatten: function(maxDistance) {
		var flattener = new PathFlattener(this),
			pos = 0,
			step = flattener.length / Math.ceil(flattener.length / maxDistance),
			end = flattener.length + (this._closed ? -step : step) / 2;
		var segments = [];
		while (pos <= end) { segments.push(new segment(flattener.evaluate(pos, 0))); pos +="step;" } this.setsegments(segments); }, reduce: function() var curves="this.getCurves();" for (var i="curves.length" - 1;>= 0; i--) {
			var curve = curves[i];
			if (curve.isLinear() && curve.getLength() === 0)
				curve.remove();
		}
		return this;
	},

	simplify: function(tolerance) {
		if (this._segments.length > 2) {
			var fitter = new PathFitter(this, tolerance || 2.5);
			this.setSegments(fitter.fit());
		}
	},

	split: function(index, parameter) {
		if (parameter === null)
			return;
		if (arguments.length === 1) {
			var arg = index;
			if (typeof arg === 'number')
				arg = this.getLocationAt(arg);
			index = arg.index;
			parameter = arg.parameter;
		}
		var tolerance = 0.00001;
		if (parameter >= 1 - tolerance) {
			index++;
			parameter--;
		}
		var curves = this.getCurves();
		if (index >= 0 && index < curves.length) {
			if (parameter > tolerance) {
				curves[index++].divide(parameter, true);
			}
			var segs = this.removeSegments(index, this._segments.length, true),
				path;
			if (this._closed) {
				this.setClosed(false);
				path = this;
			} else if (index > 0) {
				path = this._clone(new Path().insertAbove(this, true));
			}
			path._add(segs, 0);
			this.addSegment(segs[0]);
			return path;
		}
		return null;
	},

	isClockwise: function() {
		if (this._clockwise !== undefined)
			return this._clockwise;
		return Path.isClockwise(this._segments);
	},

	setClockwise: function(clockwise) {
		if (this.isClockwise() != (clockwise = !!clockwise))
			this.reverse();
		this._clockwise = clockwise;
	},

	reverse: function() {
		this._segments.reverse();
		for (var i = 0, l = this._segments.length; i < l; i++) {
			var segment = this._segments[i];
			var handleIn = segment._handleIn;
			segment._handleIn = segment._handleOut;
			segment._handleOut = handleIn;
			segment._index = i;
		}
		this._curves = null;
		if (this._clockwise !== undefined)
			this._clockwise = !this._clockwise;
	},

	join: function(path) {
		if (path) {
			var segments = path._segments,
				last1 = this.getLastSegment(),
				last2 = path.getLastSegment();
			if (last1._point.equals(last2._point))
				path.reverse();
			var first1,
				first2 = path.getFirstSegment();
			if (last1._point.equals(first2._point)) {
				last1.setHandleOut(first2._handleOut);
				this._add(segments.slice(1));
			} else {
				first1 = this.getFirstSegment();
				if (first1._point.equals(first2._point))
					path.reverse();
				last2 = path.getLastSegment();
				if (first1._point.equals(last2._point)) {
					first1.setHandleIn(last2._handleIn);
					this._add(segments.slice(0, segments.length - 1), 0);
				} else {
					this._add(segments.slice());
				}
			}
			if (path.closed)
				this._add([segments[0]]);
			path.remove();
			first1 = this.getFirstSegment();
			last1 = this.getLastSegment();
			if (last1._point.equals(first1._point)) {
				first1.setHandleIn(last1._handleIn);
				last1.remove();
				this.setClosed(true);
			}
			this._changed(5);
			return true;
		}
		return false;
	},

	getLength: function() {
		if (this._length == null) {
			var curves = this.getCurves();
			this._length = 0;
			for (var i = 0, l = curves.length; i < l; i++)
				this._length += curves[i].getLength();
		}
		return this._length;
	},

	getArea: function() {
		var curves = this.getCurves();
		var area = 0;
		for (var i = 0, l = curves.length; i < l; i++)
			area += curves[i].getArea();
		return area;
	},

	_getOffset: function(location) {
		var index = location && location.getIndex();
		if (index != null) {
			var curves = this.getCurves(),
				offset = 0;
			for (var i = 0; i < index; i++)
				offset += curves[i].getLength();
			var curve = curves[index];
			return offset + curve.getLength(0, location.getParameter());
		}
		return null;
	},

	getLocationOf: function(point) { 
		var point = Point.read(arguments),
			curves = this.getCurves();
		for (var i = 0, l = curves.length; i < l; i++) {
			var loc = curves[i].getLocationOf(point);
			if (loc)
				return loc;
		}
		return null;
	},

	getLocationAt: function(offset, isParameter) {
		var curves = this.getCurves(),
			length = 0;
		if (isParameter) {
			var index = ~~offset; 
			return curves[index].getLocationAt(offset - index, true);
		}
		for (var i = 0, l = curves.length; i < l; i++) {
			var start = length,
				curve = curves[i];
			length += curve.getLength();
			if (length > offset) {
				return curve.getLocationAt(offset - start);
			}
		}
		if (offset <= 0 2 4 8 this.getlength()) return new curvelocation(curves[curves.length - 1], 1); null; }, getpointat: function(offset, isparameter) { var loc="this.getLocationAt(offset," isparameter); && loc.getpoint(); gettangentat: loc.gettangent(); getnormalat: loc.getnormal(); getnearestlocation: function(point) point="Point.read(arguments)," curves="this.getCurves()," mindist="Infinity," minloc="null;" for (var i="0," l="curves.length;" < l; i++) if (loc._distance mindist) } minloc; getnearestpoint: this.getnearestlocation(point).getpoint(); toshape: function(insert) (!this._closed) segments="this._segments," type, size, radius, topcenter; function iscolinear(i, j) segments[i].iscolinear(segments[j]); isorthogonal(i) segments[i].isorthogonal(); isarc(i) segments[i].isarc(); getdistance(i, segments[i]._point.getdistance(segments[j]._point); (this.ispolygon() segments.length="==" iscolinear(0, 2) iscolinear(1, 3) isorthogonal(1)) type="Shape.Rectangle;" size="new" size(getdistance(0, 3), getdistance(0, 1)); topcenter="segments[1]._point.add(segments[2]._point).divide(2);" else (segments.length="==" isarc(0) isarc(2) isarc(4) isarc(6) 5) iscolinear(3, 7)) size(getdistance(1, 6), 3)); radius="size.subtract(new" 7), getdistance(1, 2))).divide(2); isarc(1) isarc(3)) (numerical.iszero(getdistance(0, 3))) 2; size(getdistance(2, 0) 2, getdistance(3, 1) 2); (type) center="this.getPosition(true)," shape="new" type({ center: center, size: radius: insert: false }); shape.rotate(topcenter.subtract(center).getangle() + 90); shape.setstyle(this._style); (insert || insert="==" undefined) shape.insertabove(this); shape; _hittest: function(point, options) that="this," style="this.getStyle()," closed="this._closed," tolerancepadding="options._tolerancePadding," strokepadding="tolerancePadding," join, cap, miterlimit, area, loc, res, hasstroke="options.stroke" style.hasstroke(), hasfill="options.fill" style.hasfill(), ? style.getstrokewidth() : (radius !="null)"> 0) {
				join = style.getStrokeJoin();
				cap = style.getStrokeCap();
				miterLimit = radius * style.getMiterLimit();
				strokePadding = tolerancePadding.add(new Point(radius, radius));
			} else {
				join = cap = 'round';
			}
		}

		function isCloseEnough(pt, padding) {
			return point.subtract(pt).divide(padding).length <= 1; } function checksegmentpoint(seg, pt, name) { if (!options.selected || pt.isselected()) var anchor="seg._point;" (pt !="=" anchor) pt="pt.add(anchor);" (iscloseenough(pt, strokepadding)) return new hitresult(name, that, segment: seg, point: }); checksegmentpoints(seg, ends) (ends options.segments) && seg._point, 'segment') (!ends options.handles) ( seg._handlein, 'handle-in') seg._handleout, 'handle-out')); addtoarea(point) area.add(point); checksegmentstroke(segment) (join 'round' cap 'round') area="new" path({ internal: true, closed: true (closed segment._index> 0
						&& segment._index < segments.length - 1) {
					if (join !== 'round' && (segment._handleIn.isZero() 
							|| segment._handleOut.isZero()))
						Path._addBevelJoin(segment, join, radius, miterLimit,
								addToArea, true);
				} else if (cap !== 'round') {
					Path._addSquareCap(segment, cap, radius, addToArea, true);
				}
				if (!area.isEmpty()) {
					var loc;
					return area.contains(point)
						|| (loc = area.getNearestLocation(point))
							&& isCloseEnough(loc.getPoint(), tolerancePadding);
				}
			}
			return isCloseEnough(segment._point, strokePadding);
		}

		if (options.ends && !options.segments && !closed) {
			if (res = checkSegmentPoints(segments[0], true)
					|| checkSegmentPoints(segments[segments.length - 1], true))
				return res;
		} else if (options.segments || options.handles) {
			for (var i = 0, l = segments.length; i < l; i++)
				if (res = checkSegmentPoints(segments[i]))
					return res;
		}
		if (radius != null) {
			loc = this.getNearestLocation(point);
			if (loc) {
				var parameter = loc.getParameter();
				if (parameter === 0 || parameter === 1) {
					if (!checkSegmentStroke(loc.getSegment()))
						loc = null;
				} else  if (!isCloseEnough(loc.getPoint(), strokePadding)) {
					loc = null;
				}
			}
			if (!loc && join === 'miter') {
				for (var i = 0, l = segments.length; i < l; i++) {
					var segment = segments[i];
					if (point.getDistance(segment._point) <= miterlimit && checksegmentstroke(segment)) { loc="segment.getLocation();" break; } return !loc hasfill this._contains(point) || !hasstroke ? new hitresult('fill', this) : hitresult('stroke', this, location: loc, point: loc.getpoint() }) null; }, function() function drawhandles(ctx, segments, matrix, size) var half="size" 2; drawhandle(index) hx="coords[index]," hy="coords[index" + 1]; if (px !="hX" py ctx.beginpath(); ctx.moveto(px, py); ctx.lineto(hx, hy); ctx.stroke(); ctx.arc(hx, hy, half, 0, math.pi * 2, true); ctx.fill(); coords="new" array(6); for (var i="0," l="segments.length;" < l; i++) segment="segments[i];" segment._transformcoordinates(matrix, coords, false); state="segment._selectionState," px="coords[0]," (state & 1) drawhandle(2); 2) drawhandle(4); ctx.fillrect(px - size, size); (!(state 4)) fillstyle="ctx.fillStyle;" ctx.fillstyle="#ffffff" ; 1, size 2); drawsegments(ctx, path, matrix) segments="path._segments," length="segments.length," array(6), first="true," curx, cury, prevx, prevy, inx, iny, outx, outy; drawsegment(i) (matrix) curx="coords[0];" cury="coords[1];" else point="segment._point;" (first) ctx.moveto(curx, cury); inx="coords[2];" iny="coords[3];" handle="segment._handleIn;" handle._x; handle._y; (inx="=" outx="=" prevx outy="=" prevy) ctx.lineto(curx, ctx.beziercurveto(outx, outy, prevy="curY;" length; drawsegment(i); (path._closed> 0)
			drawSegment(0);
	}

	return {
		_draw: function(ctx, param) {
			var clip = param.clip,
				compound = this._compound = param.compound;
			if (!compound)
				ctx.beginPath();

			var style = this.getStyle(),
				hasFill = style.hasFill(),
				hasStroke = style.hasStroke(),
				dashArray = style.getDashArray(),
				dashLength = !paper.support.nativeDash && hasStroke
						&& dashArray && dashArray.length;

			function getOffset(i) {
				return dashArray[((i % dashLength) + dashLength) % dashLength];
			}

			if (this._currentPath) {
				ctx.currentPath = this._currentPath;
			} else if (hasFill || hasStroke && !dashLength || compound || clip){
				drawSegments(ctx, this);
				if (this._closed)
					ctx.closePath();
				if (!compound)
					this._currentPath = ctx.currentPath;
			}

			if (!clip && !compound && (hasFill || hasStroke)) {
				this._setStyles(ctx);
				if (hasFill) {
					ctx.fill(style.getWindingRule());
					ctx.shadowColor = 'rgba(0,0,0,0)';
				}
				if (hasStroke) {
					if (dashLength) {
						ctx.beginPath();
						var flattener = new PathFlattener(this),
							length = flattener.length,
							from = -style.getDashOffset(), to,
							i = 0;
						from = from % length;
						while (from > 0) {
							from -= getOffset(i--) + getOffset(i--);
						}
						while (from < length) {
							to = from + getOffset(i++);
							if (from > 0 || to > 0)
								flattener.drawPart(ctx,
										Math.max(from, 0), Math.max(to, 0));
							from = to + getOffset(i++);
						}
					}
					ctx.stroke();
				}
			}
		},

		_drawSelected: function(ctx, matrix) {
			ctx.beginPath();
			drawSegments(ctx, this, matrix);
			ctx.stroke();
			drawHandles(ctx, this._segments, matrix, paper.settings.handleSize);
		}
	};
}, new function() { 

	function getFirstControlPoints(rhs) {
		var n = rhs.length,
			x = [], 
			tmp = [], 
			b = 2;
		x[0] = rhs[0] / b;
		for (var i = 1; i < n; i++) {
			tmp[i] = 1 / b;
			b = (i < n - 1 ? 4 : 2) - tmp[i];
			x[i] = (rhs[i] - x[i - 1]) / b;
		}
		for (var i = 1; i < n; i++) {
			x[n - i - 1] -= tmp[n - i] * x[n - i];
		}
		return x;
	}

	return {
		smooth: function() {
			var segments = this._segments,
				size = segments.length,
				closed = this._closed,
				n = size,
				overlap = 0;
			if (size <= 1 2 2) return; if (closed) { overlap="Math.min(size," 4); n +="Math.min(size," overlap) * 2; } var knots="[];" for (var i="0;" < size; i++) knots[i overlap]="segments[i]._point;" overlap; knots[i]="segments[i" size - overlap]._point; else n--; rhs="[];" 1; rhs[i]="4" knots[i]._x 1]._x; rhs[0]="knots[0]._x" knots[1]._x; rhs[n 1]="3" knots[n x="getFirstControlPoints(rhs);" knots[i]._y 1]._y; knots[1]._y; y="getFirstControlPoints(rhs);" j="size;" i++, j++) f1="i" overlap, f2="1" f1, ie="i" je="j" x[j]="x[i]" f2; y[j]="y[i]" x[je]="x[ie]" f1; y[je]="y[ie]" handlein="null;" segment="segments[i" overlap]; (handlein) segment.sethandlein(handlein.subtract(segment._point)); (i n) segment.sethandleout( new point(x[i], y[i]).subtract(segment._point)); ? point( 1]._x x[i 1], 1]._y y[i 1]) : (knots[n]._x x[n 2, (knots[n]._y y[n 2); (closed && handlein) }; }, function() function getcurrentsegment(that) segments="that._segments;" (segments.length="==" 0) throw error('use a moveto() command first'); return segments[segments.length 1]; moveto: 1) this.removesegment(0); (!segments.length) this._add([ segment(point.read(arguments)) ]); moveby: error('moveby() is unsupported on path items.'); lineto: cubiccurveto: handle1="Point.read(arguments)," handle2="Point.read(arguments)," to="Point.read(arguments)," current="getCurrentSegment(this);" current.sethandleout(handle1.subtract(current._point)); segment(to, handle2.subtract(to)) quadraticcurveto: handle="Point.read(arguments)," this.cubiccurveto( handle.add(current.subtract(handle).multiply(1 3)), handle.add(to.subtract(handle).multiply(1 ); curveto: through="Point.read(arguments)," t="Base.pick(Base.read(arguments)," 0.5), t1="1" t, t1)) .subtract(to.multiply(t t)).divide(2 t1); (handle.isnan()) error( 'cannot put curve points with parameter=" + t);
			this.quadraticCurveTo(handle, to);
		},

		arcTo: function() {
			var current = getCurrentSegment(this),
				from = current._point,
				to = Point.read(arguments),
				through,
				peek = Base.peek(arguments),
				clockwise = Base.pick(peek, true),
				center, extent, vector, matrix;
			if (typeof clockwise === " boolean') middle="from.add(to).divide(2)," clockwise -90 90)); (base.remain(arguments) radius="Size.read(arguments);" (radius.iszero()) this.lineto(to); rotation="Base.read(arguments)," large="!!Base.read(arguments)," pt="from.subtract(middle).rotate(-rotation)," abs="Math.abs," epsilon="1e-11," rx="abs(radius.width)," ry="abs(radius.height)," rxsq="rx" rx, rysq="ry" ry, xsq="x" x, ysq="y" y; factor="Math.sqrt(xSq" rysq); (factor> 1) {
					rx *= factor;
					ry *= factor;
					rxSq = rx * rx;
					rySq = ry * ry;
				}
				factor = (rxSq * rySq - rxSq * ySq - rySq * xSq) /
						(rxSq * ySq + rySq * xSq);
				if (abs(factor) < EPSILON)
					factor = 0;
				if (factor < 0)
					throw new Error(
							'Cannot create an arc with the given arguments');
				center = new Point(rx * y / ry, -ry * x / rx)
						.multiply((large === clockwise ? -1 : 1)
							* Math.sqrt(factor))
						.rotate(rotation).add(middle);
				matrix = new Matrix().translate(center).rotate(rotation)
						.scale(rx, ry);
				vector = matrix._inverseTransform(from);
				extent = vector.getDirectedAngle(matrix._inverseTransform(to));
				if (!clockwise && extent > 0)
					extent -= 360;
				else if (clockwise && extent < 0)
					extent += 360;
			}
			if (through) {
				var l1 = new Line(from.add(through).divide(2),
							through.subtract(from).rotate(90), true),
					l2 = new Line(through.add(to).divide(2),
							to.subtract(through).rotate(90), true),
					line = new Line(from, to),
					throughSide = line.getSide(through);
				center = l1.intersect(l2, true);
				if (!center) {
					if (!throughSide)
						return this.lineTo(to);
					throw new Error(
							'Cannot create an arc with the given arguments');
				}
				vector = from.subtract(center);
				extent = vector.getDirectedAngle(to.subtract(center));
				var centerSide = line.getSide(center);
				if (centerSide === 0) {
					extent = throughSide * Math.abs(extent);
				} else if (throughSide === centerSide) {
					extent += extent < 0 ? 360 : -360;
				}
			}
			var ext = Math.abs(extent),
				count =  ext >= 360 ? 4 : Math.ceil(ext / 90),
				inc = extent / count,
				half = inc * Math.PI / 360,
				z = 4 / 3 * Math.sin(half) / (1 + Math.cos(half)),
				segments = [];
			for (var i = 0; i <= 1 count; i++) { var pt="to," out="null;" if (i < count) (matrix) .subtract(pt); } else 0) current.sethandleout(out); _in="vector.rotate(-90).multiply(z);" segments.push(new segment(pt, _in, out)); vector="vector.rotate(inc);" this._add(segments); }, lineby: function() to="Point.read(arguments)," current="getCurrentSegment(this)._point;" this.lineto(current.add(to)); curveby: through="Point.read(arguments)," parameter="Base.read(arguments)," this.curveto(current.add(through), current.add(to), parameter); cubiccurveby: handle1="Point.read(arguments)," handle2="Point.read(arguments)," this.cubiccurveto(current.add(handle1), current.add(handle2), current.add(to)); quadraticcurveby: handle="Point.read(arguments)," this.quadraticcurveto(current.add(handle), arcby: point="current.add(Point.read(arguments))," clockwise="Base.pick(Base.peek(arguments)," true); (typeof 'boolean') this.arcto(point, clockwise); current.add(point.read(arguments))); closepath: first="this.getFirstSegment()," last="this.getLastSegment();" (first !="=" && first._point.equals(last._point)) first.sethandlein(last._handlein); last.remove(); this.setclosed(true); }; _getbounds: function(getter, matrix) return path[getter](this._segments, this._closed, this.getstyle(), matrix); statics: isclockwise: function(segments) sum="0;" for (var i="0," l="segments.length;" l; v="Curve.getValues(" segments[i], segments[i + ? : 0]); j="2;" 8; - 2] v[j]) * (v[j 1] v[j 1]);> 0;
	},

	getBounds: function(segments, closed, style, matrix, strokePadding) {
		var first = segments[0];
		if (!first)
			return new Rectangle();
		var coords = new Array(6),
			prevCoords = first._transformCoordinates(matrix, new Array(6), false),
			min = prevCoords.slice(0, 2), 
			max = min.slice(), 
			roots = new Array(2);

		function processSegment(segment) {
			segment._transformCoordinates(matrix, coords, false);
			for (var i = 0; i < 2; i++) {
				Curve._addBounds(
					prevCoords[i], 
					prevCoords[i + 4], 
					coords[i + 2], 
					coords[i], 
					i, strokePadding ? strokePadding[i] : 0, min, max, roots);
			}
			var tmp = prevCoords;
			prevCoords = coords;
			coords = tmp;
		}

		for (var i = 1, l = segments.length; i < l; i++)
			processSegment(segments[i]);
		if (closed)
			processSegment(first);
		return new Rectangle(min[0], min[1], max[0] - min[0], max[1] - min[1]);
	},

	getStrokeBounds: function(segments, closed, style, matrix) {
		if (!style.hasStroke())
			return Path.getBounds(segments, closed, style, matrix);
		var length = segments.length - (closed ? 0 : 1),
			radius = style.getStrokeWidth() / 2,
			padding = Path._getPenPadding(radius, matrix),
			bounds = Path.getBounds(segments, closed, style, matrix, padding),
			join = style.getStrokeJoin(),
			cap = style.getStrokeCap(),
			miterLimit = radius * style.getMiterLimit();
		var joinBounds = new Rectangle(new Size(padding).multiply(2));

		function add(point) {
			bounds = bounds.include(matrix
				? matrix._transformPoint(point, point) : point);
		}

		function addRound(segment) {
			bounds = bounds.unite(joinBounds.setCenter(matrix
				? matrix._transformPoint(segment._point) : segment._point));
		}

		function addJoin(segment, join) {
			var handleIn = segment._handleIn,
				handleOut = segment._handleOut
			if (join === 'round' || !handleIn.isZero() && !handleOut.isZero()
					&& handleIn.isColinear(handleOut)) {
				addRound(segment);
			} else {
				Path._addBevelJoin(segment, join, radius, miterLimit, add);
			}
		}

		function addCap(segment, cap) {
			if (cap === 'round') {
				addRound(segment);
			} else {
				Path._addSquareCap(segment, cap, radius, add); 
			}
		}

		for (var i = 1; i < length; i++)
			addJoin(segments[i], join);
		if (closed) {
			addJoin(segments[0], join);
		} else if (length > 0) {
			addCap(segments[0], cap);
			addCap(segments[segments.length - 1], cap);
		}
		return bounds;
	},

	_getPenPadding: function(radius, matrix) {
		if (!matrix)
			return [radius, radius];
		var mx = matrix.shiftless(),
			hor = mx.transform(new Point(radius, 0)),
			ver = mx.transform(new Point(0, radius)),
			phi = hor.getAngleInRadians(),
			a = hor.getLength(),
			b = ver.getLength();
		var sin = Math.sin(phi),
			cos = Math.cos(phi),
			tan = Math.tan(phi),
			tx = -Math.atan(b * tan / a),
			ty = Math.atan(b / (tan * a));
		return [Math.abs(a * Math.cos(tx) * cos - b * Math.sin(tx) * sin),
				Math.abs(b * Math.sin(ty) * cos + a * Math.cos(ty) * sin)];
	},

	_addBevelJoin: function(segment, join, radius, miterLimit, addPoint, area) {
		var curve2 = segment.getCurve(),
			curve1 = curve2.getPrevious(),
			point = curve2.getPointAt(0, true),
			normal1 = curve1.getNormalAt(1, true),
			normal2 = curve2.getNormalAt(0, true),
			step = normal1.getDirectedAngle(normal2) < 0 ? -radius : radius;
		normal1.setLength(step);
		normal2.setLength(step);
		if (area) {
			addPoint(point);
			addPoint(point.add(normal1));
		}
		if (join === 'miter') {
			var corner = new Line(
					point.add(normal1),
					new Point(-normal1.y, normal1.x), true
				).intersect(new Line(
					point.add(normal2),
					new Point(-normal2.y, normal2.x), true
				), true);
			if (corner && point.getDistance(corner) <= miterlimit) { addpoint(corner); if (!area) return; } addpoint(point.add(normal1)); addpoint(point.add(normal2)); }, _addsquarecap: function(segment, cap, radius, addpoint, area) var point="segment._point," loc="segment.getLocation()," normal="loc.getNormal().normalize(radius);" (area) addpoint(point.subtract(normal)); addpoint(point.add(normal)); (cap="==" 'square') =="0" ? -90 : 90)); gethandlebounds: function(segments, closed, style, matrix, strokepadding, joinpadding) coords="new" array(6), x1="Infinity," x2="-x1," y1="x1," y2="x2;" for (var i="0," l="segments.length;" < l; i++) segment="segments[i];" segment._transformcoordinates(matrix, coords, false); j="0;" 6; +="2)" padding="j" joinpadding paddingx="padding" padding[0] 0, paddingy="padding" padding[1] x="coords[j]," y="coords[j" 1], xn="x" - paddingx, xx="x" yn="y" paddingy, yx="y" paddingy; (xn x1) (xx> x2) x2 = xx;
				if (yn < y1) y1 = yn;
				if (yx > y2) y2 = yx;
			}
		}
		return new Rectangle(x1, y1, x2 - x1, y2 - y1);
	},

	getRoughBounds: function(segments, closed, style, matrix) {
		var strokeRadius = style.hasStroke() ? style.getStrokeWidth() / 2 : 0,
			joinRadius = strokeRadius;
		if (strokeRadius > 0) {
			if (style.getStrokeJoin() === 'miter')
				joinRadius = strokeRadius * style.getMiterLimit();
			if (style.getStrokeCap() === 'square')
				joinRadius = Math.max(joinRadius, strokeRadius * Math.sqrt(2));
		}
		return Path.getHandleBounds(segments, closed, style, matrix,
				Path._getPenPadding(strokeRadius, matrix),
				Path._getPenPadding(joinRadius, matrix));
	}
}});

Path.inject({ statics: new function() {

	var kappa = 0.5522847498307936,
		ellipseSegments = [
			new Segment([-1, 0], [0, kappa ], [0, -kappa]),
			new Segment([0, -1], [-kappa, 0], [kappa, 0 ]),
			new Segment([1, 0], [0, -kappa], [0, kappa ]),
			new Segment([0, 1], [kappa, 0 ], [-kappa, 0])
		];

	function createPath(segments, closed, args) {
		var props = Base.getNamed(args),
			path = new Path(props && props.insert === false && Item.NO_INSERT);
		path._add(segments);
		path._closed = closed;
		return path.set(props);
	}

	function createEllipse(center, radius, args) {
		var segments = new Array(4);
		for (var i = 0; i < 4; i++) {
			var segment = ellipseSegments[i];
			segments[i] = new Segment(
				segment._point.multiply(radius).add(center),
				segment._handleIn.multiply(radius),
				segment._handleOut.multiply(radius)
			);
		}
		return createPath(segments, true, args);
	}

	return {
		Line: function() {
			return createPath([
				new Segment(Point.readNamed(arguments, 'from')),
				new Segment(Point.readNamed(arguments, 'to'))
			], false, arguments);
		},

		Circle: function() {
			var center = Point.readNamed(arguments, 'center'),
				radius = Base.readNamed(arguments, 'radius');
			return createEllipse(center, new Size(radius), arguments);
		},

		Rectangle: function() {
			var rect = Rectangle.readNamed(arguments, 'rectangle'),
				radius = Size.readNamed(arguments, 'radius', 0,
						{ readNull: true }),
				bl = rect.getBottomLeft(true),
				tl = rect.getTopLeft(true),
				tr = rect.getTopRight(true),
				br = rect.getBottomRight(true),
				segments;
			if (!radius || radius.isZero()) {
				segments = [
					new Segment(bl),
					new Segment(tl),
					new Segment(tr),
					new Segment(br)
				];
			} else {
				radius = Size.min(radius, rect.getSize(true).divide(2));
				var rx = radius.width,
					ry = radius.height,
					hx = rx * kappa,
					hy = ry * kappa;
				segments = [
					new Segment(bl.add(rx, 0), null, [-hx, 0]),
					new Segment(bl.subtract(0, ry), [0, hy]),
					new Segment(tl.add(0, ry), null, [0, -hy]),
					new Segment(tl.add(rx, 0), [-hx, 0], null),
					new Segment(tr.subtract(rx, 0), null, [hx, 0]),
					new Segment(tr.add(0, ry), [0, -hy], null),
					new Segment(br.subtract(0, ry), null, [0, hy]),
					new Segment(br.subtract(rx, 0), [hx, 0])
				];
			}
			return createPath(segments, true, arguments);
		},

		RoundRectangle: '#Rectangle',

		Ellipse: function() {
			var ellipse = Shape._readEllipse(arguments);
			return createEllipse(ellipse.center, ellipse.radius, arguments);
		},

		Oval: '#Ellipse',

		Arc: function() {
			var from = Point.readNamed(arguments, 'from'),
				through = Point.readNamed(arguments, 'through'),
				to = Point.readNamed(arguments, 'to'),
				props = Base.getNamed(arguments),
				path = new Path(props && props.insert === false
						&& Item.NO_INSERT);
			path.moveTo(from);
			path.arcTo(through, to);
			return path.set(props);
		},

		RegularPolygon: function() {
			var center = Point.readNamed(arguments, 'center'),
				sides = Base.readNamed(arguments, 'sides'),
				radius = Base.readNamed(arguments, 'radius'),
				step = 360 / sides,
				three = !(sides % 3),
				vector = new Point(0, three ? -radius : radius),
				offset = three ? -1 : 0.5,
				segments = new Array(sides);
			for (var i = 0; i < sides; i++)
				segments[i] = new Segment(center.add(
					vector.rotate((i + offset) * step)));
			return createPath(segments, true, arguments);
		},

		Star: function() {
			var center = Point.readNamed(arguments, 'center'),
				points = Base.readNamed(arguments, 'points') * 2,
				radius1 = Base.readNamed(arguments, 'radius1'),
				radius2 = Base.readNamed(arguments, 'radius2'),
				step = 360 / points,
				vector = new Point(0, -1),
				segments = new Array(points);
			for (var i = 0; i < points; i++)
				segments[i] = new Segment(center.add(vector.rotate(step * i)
						.multiply(i % 2 ? radius2 : radius1)));
			return createPath(segments, true, arguments);
		}
	};
}});

var CompoundPath = PathItem.extend({
	_class: 'CompoundPath',
	_serializeFields: {
		children: []
	},

	initialize: function CompoundPath(arg) {
		this._children = [];
		this._namedChildren = {};
		if (!this._initialize(arg)) {
			if (typeof arg === 'string') {
				this.setPathData(arg);
			} else {
				this.addChildren(Array.isArray(arg) ? arg : arguments);
			}
		}
	},

	_changed: function _changed(flags) {
		_changed.base.call(this, flags);
		if (flags & (2 | 4))
			this._currentPath = undefined;
	},

	insertChildren: function insertChildren(index, items, _preserve) {
		items = insertChildren.base.call(this, index, items, _preserve, 'path');
		for (var i = 0, l = !_preserve && items && items.length; i < l; i++) {
			var item = items[i];
			if (item._clockwise === undefined)
				item.setClockwise(item._index === 0);
		}
		return items;
	},

	reverse: function() {
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++)
			children[i].reverse();
	},

	smooth: function() {
		for (var i = 0, l = this._children.length; i < l; i++)
			this._children[i].smooth();
	},

	isClockwise: function() {
		var child = this.getFirstChild();
		return child && child.isClockwise();
	},

	setClockwise: function(clockwise) {
		if (this.isClockwise() != !!clockwise)
			this.reverse();
	},

	getFirstSegment: function() {
		var first = this.getFirstChild();
		return first && first.getFirstSegment();
	},

	getLastSegment: function() {
		var last = this.getLastChild();
		return last && last.getLastSegment();
	},

	getCurves: function() {
		var children = this._children,
			curves = [];
		for (var i = 0, l = children.length; i < l; i++)
			curves.push.apply(curves, children[i].getCurves());
		return curves;
	},

	getFirstCurve: function() {
		var first = this.getFirstChild();
		return first && first.getFirstCurve();
	},

	getLastCurve: function() {
		var last = this.getLastChild();
		return last && last.getFirstCurve();
	},

	getArea: function() {
		var children = this._children,
			area = 0;
		for (var i = 0, l = children.length; i < l; i++)
			area += children[i].getArea();
		return area;
	},

	getPathData: function(precision) {
		var children = this._children,
			paths = [];
		for (var i = 0, l = children.length; i < l; i++)
			paths.push(children[i].getPathData(precision));
		return paths.join(' ');
	},

	_getChildHitTestOptions: function(options) {
		return options.type === 'path'
				? options
				: new Base(options, { fill: false });
	},

	_draw: function(ctx, param) {
		var children = this._children;
		if (children.length === 0)
			return;

		if (this._currentPath) {
			ctx.currentPath = this._currentPath;
		} else {
			ctx.beginPath();
			param = param.extend({ compound: true });
			for (var i = 0, l = children.length; i < l; i++)
				children[i].draw(ctx, param);
			this._currentPath = ctx.currentPath;
		}

		if (!param.clip) {
			this._setStyles(ctx);
			var style = this._style;
			if (style.hasFill()) {
				ctx.fill(style.getWindingRule());
				ctx.shadowColor = 'rgba(0,0,0,0)';
			}
			if (style.hasStroke())
				ctx.stroke();
		}
	}
}, new function() { 
	function getCurrentPath(that, check) {
		var children = that._children;
		if (check && children.length === 0)
			throw new Error('Use a moveTo() command first');
		return children[children.length - 1];
	}

	var fields = {
		moveTo: function() {
			var current = getCurrentPath(this),
				path = current && current.isEmpty() ? current : new Path();
			if (path !== current)
				this.addChild(path);
			path.moveTo.apply(path, arguments);
		},

		moveBy: function() {
			var current = getCurrentPath(this, true),
				last = current && current.getLastSegment(),
				point = Point.read(arguments);
			this.moveTo(last ? point.add(last._point) : point);
		},

		closePath: function() {
			getCurrentPath(this, true).closePath();
		}
	};

	Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo', 'arcTo',
			'lineBy', 'cubicCurveBy', 'quadraticCurveBy', 'curveBy', 'arcBy'],
			function(key) {
				fields[key] = function() {
					var path = getCurrentPath(this, true);
					path[key].apply(path, arguments);
				};
			}
	);

	return fields;
});

PathItem.inject(new function() {
	function reorientPath(path) {
		path = path.clone(false).reduce().transform(null, true);
		if (path instanceof CompoundPath) {
			var children = path.removeChildren(),
				length = children.length,
				bounds = new Array(length),
				counters = new Array(length),
				clockwise;
			children.sort(function(a, b) {
				return b.getBounds().getArea() - a.getBounds().getArea();
			});
			path.addChildren(children);
			clockwise = children[0].isClockwise();
			for (var i = 0; i < length; i++) {
				bounds[i] = children[i].getBounds();
				counters[i] = 0;
			}
			for (var i = 0; i < length; i++) {
				for (var j = 1; j < length; j++) {
					if (i !== j && bounds[i].intersects(bounds[j]))
						counters[j]++;
				}
				if (i > 0 && counters[i] % 2 === 0)
					children[i].setClockwise(clockwise);
			}
		}
		return path;
	}

	function computeBoolean(path1, path2, operator, subtract) {
		var _path1 = reorientPath(path1);
			_path2 = path2 && path1 !== path2 && reorientPath(path2);
		if (!_path1.isClockwise())
			_path1.reverse();
		if (_path2 && !(subtract ^ _path2.isClockwise()))
			_path2.reverse();
		splitPath(_path1.getIntersections(_path2, true));

		var chain = [],
			windings = [],
			lengths = [],
			segments = [],
			monoCurves = [];

		function collect(paths) {
			for (var i = 0, l = paths.length; i < l; i++) {
				var path = paths[i];
				segments.push.apply(segments, path._segments);
				monoCurves.push.apply(monoCurves, path._getMonoCurves());
			}
		}

		collect(_path1._children || [_path1]);
		if (_path2)
			collect(_path2._children || [_path2]);
		segments.sort(function(a, b) {
			var _a = a._intersection,
				_b = b._intersection;
			return !_a && !_b || _a && _b ? 0 : _a ? -1 : 1;
		});
		for (var i = 0, l = segments.length; i < l; i++) {
			var segment = segments[i];
			if (segment._winding != null)
				continue;
			chain.length = windings.length = lengths.length = 0;
			var totalLength = 0,
				startSeg = segment;
			do {
				chain.push(segment);
				lengths.push(totalLength += segment.getCurve().getLength());
				segment = segment.getNext();
			} while (segment && !segment._intersection && segment !== startSeg);
			for (var j = 0; j < 3; j++) {
				var length = totalLength * Math.random(),
					amount = lengths.length;
					k = 0;
				do {
					if (lengths[k] >= length) {
						if (k > 0) 
							length -= lengths[k - 1];
						break;
					}
				} while (++k < amount);
				var curve = chain[k].getCurve(),
					point = curve.getPointAt(length),
					hor = curve.isHorizontal(),
					path = curve._path;
				if (path._parent instanceof CompoundPath)
					path = path._parent;
				windings[j] = subtract && _path2
						&& (path === _path1 && _path2._getWinding(point, hor)
						|| path === _path2 && !_path1._getWinding(point, hor))
						? 0
						: getWinding(point, monoCurves, hor);
			}
			windings.sort();
			var winding = windings[1];
			for (var j = chain.length - 1; j >= 0; j--)
				chain[j]._winding = winding;
		}
		var result = new CompoundPath();
		result.addChildren(tracePaths(segments, operator), true);
		_path1.remove();
		if (_path2)
			_path2.remove();
		return result.reduce();
	}

	function splitPath(intersections) {
		var TOLERANCE = 0.00001,
			linearSegments;

		function resetLinear() {
			for (var i = 0, l = linearSegments.length; i < l; i++) {
				var segment = linearSegments[i];
				segment._handleOut.set(0, 0);
				segment._handleIn.set(0, 0);
			}
		}

		for (var i = intersections.length - 1, curve, prevLoc; i >= 0; i--) {
			var loc = intersections[i],
				t = loc._parameter;
			if (prevLoc && prevLoc._curve === loc._curve
					&& prevLoc._parameter > 0) {
				t /= prevLoc._parameter;
			} else {
				if (linearSegments)
					resetLinear();
				curve = loc._curve;
				linearSegments = curve.isLinear() && [];
			}
			var newCurve,
				segment;
			if (newCurve = curve.divide(t, true, true)) {
				segment = newCurve._segment1;
				curve = newCurve.getPrevious();
			} else {
				segment = t < TOLERANCE
					? curve._segment1
					: t > 1 - TOLERANCE
						? curve._segment2
						: curve.getPartLength(0, t) < curve.getPartLength(t, 1)
							? curve._segment1
							: curve._segment2;
			}
			segment._intersection = loc.getIntersection();
			loc._segment = segment;
			if (linearSegments)
				linearSegments.push(segment);
			prevLoc = loc;
		}
		if (linearSegments)
			resetLinear();
	}

	function getWinding(point, curves, horizontal, testContains) {
		var TOLERANCE = 0.00001,
			x = point.x,
			y = point.y,
			windLeft = 0,
			windRight = 0,
			roots = [],
			abs = Math.abs,
			MAX = 1 - TOLERANCE;
		if (horizontal) {
			var yTop = -Infinity,
				yBottom = Infinity,
				yBefore = y - TOLERANCE,
				yAfter = y + TOLERANCE;
			for (var i = 0, l = curves.length; i < l; i++) {
				var values = curves[i].values;
				if (Curve.solveCubic(values, 0, x, roots, 0, 1) > 0) {
					for (var j = roots.length - 1; j >= 0; j--) {
						var y0 = Curve.evaluate(values, roots[j], 0).y;
						if (y0 < yBefore && y0 > yTop) {
							yTop = y0;
						} else if (y0 > yAfter && y0 < yBottom) {
							yBottom = y0;
						}
					}
				}
			}
			yTop = (yTop + y) / 2;
			yBottom = (yBottom + y) / 2;
			if (yTop > -Infinity)
				windLeft = getWinding(new Point(x, yTop), curves);
			if (yBottom < Infinity)
				windRight = getWinding(new Point(x, yBottom), curves);
		} else {
			var xBefore = x - TOLERANCE,
				xAfter = x + TOLERANCE;
			for (var i = 0, l = curves.length; i < l; i++) {
				var curve = curves[i],
					values = curve.values,
					winding = curve.winding,
					next = curve.next;
				if (winding && (winding === 1 
						&& y >= values[1] && y <= values[7] || y>= values[7] && y <= 1 values[1]) && curve.solvecubic(values, 1, y, roots, 0, !next.winding next.values[1]="==" y ? : max)="==" 1){ var t="roots[0]," x0="Curve.evaluate(values," t, 0).x, slope="Curve.evaluate(values," 1).y; if (abs(slope) < tolerance !curve.islinear(values) || * curve.evaluate( curve.previous.values, 1).y 0) { (testcontains>= xBefore && x0 <= xafter) { ++windleft; ++windright; } else if (x0 <="xBefore)" windleft +="winding;">= xAfter) {
						windRight += winding;
					}
				}
			}
		}
		return Math.max(abs(windLeft), abs(windRight));
	}

	function tracePaths(segments, operator, selfOp) {
		operator = operator || function() {
			return true;
		};
		var paths = [],
			ZERO = 1e-3,
			ONE = 1 - 1e-3;
		for (var i = 0, seg, startSeg, l = segments.length; i < l; i++) {
			seg = startSeg = segments[i];
			if (seg._visited || !operator(seg._winding))
				continue;
			var path = new Path(Item.NO_INSERT),
				inter = seg._intersection,
				startInterSeg = inter && inter._segment,
				added = false, 
				dir = 1;
			do {
				var handleIn = dir > 0 ? seg._handleIn : seg._handleOut,
					handleOut = dir > 0 ? seg._handleOut : seg._handleIn,
					interSeg;
				if (added && (!operator(seg._winding) || selfOp)
						&& (inter = seg._intersection)
						&& (interSeg = inter._segment)
						&& interSeg !== startSeg) {
					var c1 = seg.getCurve();
					if (dir > 0)
						c1 = c1.getPrevious();
					var t1 = c1.getTangentAt(dir < 1 ? ZERO : ONE, true),
						c4 = interSeg.getCurve(),
						c3 = c4.getPrevious(),
						t3 = c3.getTangentAt(ONE, true),
						t4 = c4.getTangentAt(ZERO, true),
						w3 = t1.cross(t3),
						w4 = t1.cross(t4);
					if (selfOp) {
						seg._visited = interSeg._visited;
						seg = interSeg;
						dir = 1;
					} else if (w3 * w4 !== 0) {
						var curve = w3 < w4 ? c3 : c4,
							nextCurve = operator(curve._segment1._winding)
								? curve
								: w3 < w4 ? c4 : c3,
							nextSeg = nextCurve._segment1;
						dir = nextCurve === c3 ? -1 : 1;
						if (nextSeg._visited && seg._path !== nextSeg._path
									|| !operator(nextSeg._winding)) {
							dir = 1;
						} else {
							seg._visited = interSeg._visited;
							seg = interSeg;
							if (nextSeg._visited) 
								dir = 1;
						}
					} else {
						dir = 1;
					}
					handleOut = dir > 0 ? seg._handleOut : seg._handleIn;
				}
				path.add(new Segment(seg._point, added && handleIn, handleOut));
				added = true;
				seg._visited = true;
				seg = dir > 0 ? seg.getNext() : seg. getPrevious();
			} while (seg && !seg._visited
					&& seg !== startSeg && seg !== startInterSeg
					&& (seg._intersection || operator(seg._winding)));
			if (seg && (seg === startSeg || seg === startInterSeg)) {
				path.firstSegment.setHandleIn((seg === startInterSeg
						? startInterSeg : seg)._handleIn);
				path.setClosed(true);
			} else {
				path.lastSegment._handleOut.set(0, 0);
			}
			if (path._segments.length >
					(path._closed ? path.isPolygon() ? 2 : 0 : 1))
				paths.push(path);
		}
		return paths;
	}

	return {
		_getWinding: function(point, horizontal, testContains) {
			return getWinding(point, this._getMonoCurves(),
					horizontal, testContains);
		},

		unite: function(path) {
			return computeBoolean(this, path, function(w) {
				return w === 1 || w === 0;
			}, false);
		},

		intersect: function(path) {
			return computeBoolean(this, path, function(w) {
				return w === 2;
			}, false);
		},

		subtract: function(path) {
			return computeBoolean(this, path, function(w) {
				return w === 1;
			}, true);
		},

		exclude: function(path) {
			return new Group([this.subtract(path), path.subtract(this)]);
		},
		divide: function(path) {
			return new Group([this.subtract(path), this.intersect(path)]);
		}
	};
});

Path.inject({
	_getMonoCurves: function() {
		var monoCurves = this._monoCurves,
			prevCurve;

		function insertCurve(v) {
			var y0 = v[1],
				y1 = v[7],
				curve = {
					values: v,
					winding: y0 === y1
						? 0 
						: y0 > y1
							? -1 
							: 1, 
					previous: prevCurve,
					next: null 
				};
			if (prevCurve)
				prevCurve.next = curve;
			monoCurves.push(curve);
			prevCurve = curve;
		}

		function handleCurve(v) {
			if (Curve.getLength(v) === 0)
				return;
			var y0 = v[1],
				y1 = v[3],
				y2 = v[5],
				y3 = v[7];
			if (Curve.isLinear(v)) {
				insertCurve(v);
			} else {
				var a = 3 * (y1 - y2) - y0 + y3,
					b = 2 * (y0 + y2) - 4 * y1,
					c = y1 - y0,
					TOLERANCE = 0.00001,
					roots = [];
				var count = Numerical.solveQuadratic(a, b, c, roots, TOLERANCE,
						1 - TOLERANCE);
				if (count === 0) {
					insertCurve(v);
				} else {
					roots.sort();
					var t = roots[0],
						parts = Curve.subdivide(v, t);
					insertCurve(parts[0]);
					if (count > 1) {
						t = (roots[1] - t) / (1 - t);
						parts = Curve.subdivide(parts[1], t);
						insertCurve(parts[0]);
					}
					insertCurve(parts[1]);
				}
			}
		}

		if (!monoCurves) {
			monoCurves = this._monoCurves = [];
			var curves = this.getCurves(),
				segments = this._segments;
			for (var i = 0, l = curves.length; i < l; i++)
				handleCurve(curves[i].getValues());
			if (!this._closed && segments.length > 1) {
				var p1 = segments[segments.length - 1]._point,
					p2 = segments[0]._point,
					p1x = p1._x, p1y = p1._y,
					p2x = p2._x, p2y = p2._y;
				handleCurve([p1x, p1y, p1x, p1y, p2x, p2y, p2x, p2y]);
			}
			var first = monoCurves[0],
				last = monoCurves[monoCurves.length - 1];
			first.previous = last;
			last.next = first;
		}
		return monoCurves;
	}
});

CompoundPath.inject({
	_getMonoCurves: function() {
		var children =  this._children,
			monoCurves = [];
		for (var i = 0, l = children.length; i < l; i++)
			monoCurves.push.apply(monoCurves, children[i]._getMonoCurves());
		return monoCurves;
	}
});

var PathFlattener = Base.extend({
	initialize: function(path) {
		this.curves = []; 
		this.parts = []; 
		this.length = 0; 
		this.index = 0;

		var segments = path._segments,
			segment1 = segments[0],
			segment2,
			that = this;

		function addCurve(segment1, segment2) {
			var curve = Curve.getValues(segment1, segment2);
			that.curves.push(curve);
			that._computeParts(curve, segment1._index, 0, 1);
		}

		for (var i = 1, l = segments.length; i < l; i++) {
			segment2 = segments[i];
			addCurve(segment1, segment2);
			segment1 = segment2;
		}
		if (path._closed)
			addCurve(segment2, segments[0]);
	},

	_computeParts: function(curve, index, minT, maxT) {
		if ((maxT - minT) > 1 / 32 && !Curve.isFlatEnough(curve, 0.25)) {
			var curves = Curve.subdivide(curve);
			var halfT = (minT + maxT) / 2;
			this._computeParts(curves[0], index, minT, halfT);
			this._computeParts(curves[1], index, halfT, maxT);
		} else {
			var x = curve[6] - curve[0],
				y = curve[7] - curve[1],
				dist = Math.sqrt(x * x + y * y);
			if (dist > 0.00001) {
				this.length += dist;
				this.parts.push({
					offset: this.length,
					value: maxT,
					index: index
				});
			}
		}
	},

	getParameterAt: function(offset) {
		var i, j = this.index;
		for (;;) {
			i = j;
			if (j == 0 || this.parts[--j].offset < offset)
				break;
		}
		for (var l = this.parts.length; i < l; i++) {
			var part = this.parts[i];
			if (part.offset >= offset) {
				this.index = i;
				var prev = this.parts[i - 1];
				var prevVal = prev && prev.index == part.index ? prev.value : 0,
					prevLen = prev ? prev.offset : 0;
				return {
					value: prevVal + (part.value - prevVal)
						* (offset - prevLen) /  (part.offset - prevLen),
					index: part.index
				};
			}
		}
		var part = this.parts[this.parts.length - 1];
		return {
			value: 1,
			index: part.index
		};
	},

	evaluate: function(offset, type) {
		var param = this.getParameterAt(offset);
		return Curve.evaluate(this.curves[param.index], param.value, type);
	},

	drawPart: function(ctx, from, to) {
		from = this.getParameterAt(from);
		to = this.getParameterAt(to);
		for (var i = from.index; i <= to.index; i++) { var curve="Curve.getPart(this.curves[i]," i="=" from.index ? from.value : 0, to.index to.value 1); if (i="=" from.index) ctx.moveto(curve[0], curve[1]); ctx.beziercurveto.apply(ctx, curve.slice(2)); } }); pathfitter="Base.extend({" initialize: function(path, error) this.points="[];" segments="path._segments," prev; for (var l="segments.length;" < l; point="segments[i].point.clone();" (!prev || !prev.equals(point)) this.points.push(point); prev="point;" this.error="error;" }, fit: function() points="this.points," length="points.length;" this.segments="length"> 0 ? [new Segment(points[0])] : [];
		if (length > 1)
			this.fitCubic(0, length - 1,
				points[1].subtract(points[0]).normalize(),
				points[length - 2].subtract(points[length - 1]).normalize());
		return this.segments;
	},

	fitCubic: function(first, last, tan1, tan2) {
		if (last - first == 1) {
			var pt1 = this.points[first],
				pt2 = this.points[last],
				dist = pt1.getDistance(pt2) / 3;
			this.addCurve([pt1, pt1.add(tan1.normalize(dist)),
					pt2.add(tan2.normalize(dist)), pt2]);
			return;
		}
		var uPrime = this.chordLengthParameterize(first, last),
			maxError = Math.max(this.error, this.error * this.error),
			split;
		for (var i = 0; i <= 4; i++) { var curve="this.generateBezier(first," last, uprime, tan1, tan2); max="this.findMaxError(first," curve, uprime); if (max.error < this.error) this.addcurve(curve); return; } split="max.index;">= maxError)
				break;
			this.reparameterize(first, last, uPrime, curve);
			maxError = max.error;
		}
		var V1 = this.points[split - 1].subtract(this.points[split]),
			V2 = this.points[split].subtract(this.points[split + 1]),
			tanCenter = V1.add(V2).divide(2).normalize();
		this.fitCubic(first, split, tan1, tanCenter);
		this.fitCubic(split, last, tanCenter.negate(), tan2);
	},

	addCurve: function(curve) {
		var prev = this.segments[this.segments.length - 1];
		prev.setHandleOut(curve[1].subtract(curve[0]));
		this.segments.push(
				new Segment(curve[3], curve[2].subtract(curve[3])));
	},

	generateBezier: function(first, last, uPrime, tan1, tan2) {
		var epsilon = 1e-11,
			pt1 = this.points[first],
			pt2 = this.points[last],
			C = [[0, 0], [0, 0]],
			X = [0, 0];

		for (var i = 0, l = last - first + 1; i < l; i++) {
			var u = uPrime[i],
				t = 1 - u,
				b = 3 * u * t,
				b0 = t * t * t,
				b1 = b * t,
				b2 = b * u,
				b3 = u * u * u,
				a1 = tan1.normalize(b1),
				a2 = tan2.normalize(b2),
				tmp = this.points[first + i]
					.subtract(pt1.multiply(b0 + b1))
					.subtract(pt2.multiply(b2 + b3));
			C[0][0] += a1.dot(a1);
			C[0][1] += a1.dot(a2);
			C[1][0] = C[0][1];
			C[1][1] += a2.dot(a2);
			X[0] += a1.dot(tmp);
			X[1] += a2.dot(tmp);
		}

		var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1],
			alpha1, alpha2;
		if (Math.abs(detC0C1) > epsilon) {
			var detC0X  = C[0][0] * X[1]    - C[1][0] * X[0],
				detXC1  = X[0]    * C[1][1] - X[1]    * C[0][1];
			alpha1 = detXC1 / detC0C1;
			alpha2 = detC0X / detC0C1;
		} else {
			var c0 = C[0][0] + C[0][1],
				c1 = C[1][0] + C[1][1];
			if (Math.abs(c0) > epsilon) {
				alpha1 = alpha2 = X[0] / c0;
			} else if (Math.abs(c1) > epsilon) {
				alpha1 = alpha2 = X[1] / c1;
			} else {
				alpha1 = alpha2 = 0;
			}
		}

		var segLength = pt2.getDistance(pt1);
		epsilon *= segLength;
		if (alpha1 < epsilon || alpha2 < epsilon) {
			alpha1 = alpha2 = segLength / 3;
		}

		return [pt1, pt1.add(tan1.normalize(alpha1)),
				pt2.add(tan2.normalize(alpha2)), pt2];
	},

	reparameterize: function(first, last, u, curve) {
		for (var i = first; i <= last; i++) { u[i - first]="this.findRoot(curve," this.points[i], first]); } }, findroot: function(curve, point, u) var curve1="[]," curve2="[];" for (var i="0;" <="2;" curve1[i]="curve[i" + 1].subtract(curve[i]).multiply(3); curve2[i]="curve1[i" 1].subtract(curve1[i]).multiply(2); pt="this.evaluate(3," curve, u), pt1="this.evaluate(2," curve1, pt2="this.evaluate(1," curve2, diff="pt.subtract(point)," df="pt1.dot(pt1)" diff.dot(pt2); if (math.abs(df) 0.00001) return u; u diff.dot(pt1) df; evaluate: function(degree, t) tmp="curve.slice();" j="0;" i; j++) tmp[j]="tmp[j].multiply(1" t).add(tmp[j 1].multiply(t)); tmp[0]; chordlengthparameterize: function(first, last) 1; first 1] this.points[i].getdistance(this.points[i 1]); m="last" first; u[i] = u[m]; findmaxerror: last, index="Math.floor((last" 1) 2), maxdist="0;" p="this.evaluate(3," v="P.subtract(this.points[i]);" dist="v.x" * v.x v.y v.y; (dist>= maxDist) {
				maxDist = dist;
				index = i;
			}
		}
		return {
			error: maxDist,
			index: index
		};
	}
});

var TextItem = Item.extend({
	_class: 'TextItem',
	_boundsSelected: true,
	_applyMatrix: false,
	_canApplyMatrix: false,
	_serializeFields: {
		content: null
	},
	_boundsGetter: 'getBounds',

	initialize: function TextItem(arg) {
		this._content = '';
		this._lines = [];
		var hasProps = arg && Base.isPlainObject(arg)
				&& arg.x === undefined && arg.y === undefined;
		this._initialize(hasProps && arg, !hasProps && Point.read(arguments));
	},

	_equals: function(item) {
		return this._content === item._content;
	},

	_clone: function _clone(copy) {
		copy.setContent(this._content);
		return _clone.base.call(this, copy);
	},

	getContent: function() {
		return this._content;
	},

	setContent: function(content) {
		this._content = '' + content;
		this._lines = this._content.split(/\r\n|\n|\r/mg);
		this._changed(69);
	},

	isEmpty: function() {
		return !this._content;
	},

	getCharacterStyle: '#getStyle',
	setCharacterStyle: '#setStyle',

	getParagraphStyle: '#getStyle',
	setParagraphStyle: '#setStyle'
});

var PointText = TextItem.extend({
	_class: 'PointText',

	initialize: function PointText() {
		TextItem.apply(this, arguments);
	},

	clone: function(insert) {
		return this._clone(new PointText(Item.NO_INSERT), insert);
	},

	getPoint: function() {
		var point = this._matrix.getTranslation();
		return new LinkedPoint(point.x, point.y, this, 'setPoint');
	},

	setPoint: function() {
		var point = Point.read(arguments);
		this.translate(point.subtract(this._matrix.getTranslation()));
	},

	_draw: function(ctx) {
		if (!this._content)
			return;
		this._setStyles(ctx);
		var style = this._style,
			lines = this._lines,
			leading = style.getLeading(),
			shadowColor = ctx.shadowColor;

		ctx.font = style.getFontStyle();
		ctx.textAlign = style.getJustification();
		for (var i = 0, l = lines.length; i < l; i++) {
			ctx.shadowColor = shadowColor;
			var line = lines[i];
			if (style.hasFill()) {
				ctx.fillText(line, 0, 0);
				ctx.shadowColor = 'rgba(0,0,0,0)';
			}
			if (style.hasStroke())
				ctx.strokeText(line, 0, 0);
			ctx.translate(0, leading);
		}
	}
}, new function() {
	var measureCtx = null;

	return {
		_getBounds: function(getter, matrix) {
			if (!measureCtx)
				measureCtx = CanvasProvider.getContext(1, 1);
			var style = this._style,
				lines = this._lines,
				count = lines.length,
				justification = style.getJustification(),
				leading = style.getLeading(),
				x = 0;
			measureCtx.font = style.getFontStyle();
			var width = 0;
			for (var i = 0; i < count; i++)
				width = Math.max(width, measureCtx.measureText(lines[i]).width);
			if (justification !== 'left')
				x -= width / (justification === 'center' ? 2: 1);
			var bounds = new Rectangle(x,
						count ? - 0.75 * leading : 0,
						width, count * leading);
			return matrix ? matrix._transformBounds(bounds, bounds) : bounds;
		}
	};
});

var Color = Base.extend(new function() {

	var types = {
		gray: ['gray'],
		rgb: ['red', 'green', 'blue'],
		hsb: ['hue', 'saturation', 'brightness'],
		hsl: ['hue', 'saturation', 'lightness'],
		gradient: ['gradient', 'origin', 'destination', 'highlight']
	};

	var componentParsers = {},
		colorCache = {},
		colorCtx;

	function fromCSS(string) {
		var match = string.match(/^#(\w{1,2})(\w{1,2})(\w{1,2})$/),
			components;
		if (match) {
			components = [0, 0, 0];
			for (var i = 0; i < 3; i++) {
				var value = match[i + 1];
				components[i] = parseInt(value.length == 1
						? value + value : value, 16) / 255;
			}
		} else if (match = string.match(/^rgba?\((.*)\)$/)) {
			components = match[1].split(',');
			for (var i = 0, l = components.length; i < l; i++) {
				var value = +components[i];
				components[i] = i < 3 ? value / 255 : value;
			}
		} else {
			var cached = colorCache[string];
			if (!cached) {
				if (!colorCtx) {
					colorCtx = CanvasProvider.getContext(1, 1);
					colorCtx.globalCompositeOperation = 'copy';
				}
				colorCtx.fillStyle = 'rgba(0,0,0,0)';
				colorCtx.fillStyle = string;
				colorCtx.fillRect(0, 0, 1, 1);
				var data = colorCtx.getImageData(0, 0, 1, 1).data;
				cached = colorCache[string] = [
					data[0] / 255,
					data[1] / 255,
					data[2] / 255				
				];
			}
			components = cached.slice();
		}
		return components;
	}

	var hsbIndices = [
		[0, 3, 1], 
		[2, 0, 1], 
		[1, 0, 3], 
		[1, 2, 0], 
		[3, 1, 0], 
		[0, 1, 2]  
	];

	var converters = {
		'rgb-hsb': function(r, g, b) {
			var max = Math.max(r, g, b),
				min = Math.min(r, g, b),
				delta = max - min,
				h = delta === 0 ? 0
					:   ( max == r ? (g - b) / delta + (g < b ? 6 : 0)
						: max == g ? (b - r) / delta + 2
						:            (r - g) / delta + 4) * 60; 
			return [h, max === 0 ? 0 : delta / max, max];
		},

		'hsb-rgb': function(h, s, b) {
			h = (((h / 60) % 6) + 6) % 6;
			var i = Math.floor(h), 
				f = h - i,
				i = hsbIndices[i],
				v = [
					b,						
					b * (1 - s),			
					b * (1 - s * f),		
					b * (1 - s * (1 - f))	
				];
			return [v[i[0]], v[i[1]], v[i[2]]];
		},

		'rgb-hsl': function(r, g, b) {
			var max = Math.max(r, g, b),
				min = Math.min(r, g, b),
				delta = max - min,
				achromatic = delta === 0,
				h = achromatic ? 0
					:   ( max == r ? (g - b) / delta + (g < b ? 6 : 0)
						: max == g ? (b - r) / delta + 2
						:            (r - g) / delta + 4) * 60, 
				l = (max + min) / 2,
				s = achromatic ? 0 : l < 0.5
						? delta / (max + min)
						: delta / (2 - max - min);
			return [h, s, l];
		},

		'hsl-rgb': function(h, s, l) {
			h = (((h / 360) % 1) + 1) % 1;
			if (s === 0)
				return [l, l, l];
			var t3s = [ h + 1 / 3, h, h - 1 / 3 ],
				t2 = l < 0.5 ? l * (1 + s) : l + s - l * s,
				t1 = 2 * l - t2,
				c = [];
			for (var i = 0; i < 3; i++) {
				var t3 = t3s[i];
				if (t3 < 0) t3 += 1;
				if (t3 > 1) t3 -= 1;
				c[i] = 6 * t3 < 1
					? t1 + (t2 - t1) * 6 * t3
					: 2 * t3 < 1
						? t2
						: 3 * t3 < 2
							? t1 + (t2 - t1) * ((2 / 3) - t3) * 6
							: t1;
			}
			return c;
		},

		'rgb-gray': function(r, g, b) {
			return [r * 0.2989 + g * 0.587 + b * 0.114];
		},

		'gray-rgb': function(g) {
			return [g, g, g];
		},

		'gray-hsb': function(g) {
			return [0, 0, g];
		},

		'gray-hsl': function(g) {
			return [0, 0, g];
		},

		'gradient-rgb': function() {
			return [];
		},

		'rgb-gradient': function() {
			return [];
		}

	};

	return Base.each(types, function(properties, type) {
		componentParsers[type] = [];
		Base.each(properties, function(name, index) {
			var part = Base.capitalize(name),
				hasOverlap = /^(hue|saturation)$/.test(name),
				parser = componentParsers[type][index] = name === 'gradient'
					? function(value) {
						var current = this._components[0];
						value = Gradient.read(Array.isArray(value) ? value
								: arguments, 0, { readNull: true });
						if (current !== value) {
							if (current)
								current._removeOwner(this);
							if (value)
								value._addOwner(this);
						}
						return value;
					}
					: type === 'gradient'
						? function() {
							return Point.read(arguments, 0, {
									readNull: name === 'highlight',
									clone: true
							});
						}
						: function(value) {
							return value == null || isNaN(value) ? 0 : value;
						};

			this['get' + part] = function() {
				return this._type === type
					|| hasOverlap && /^hs[bl]$/.test(this._type)
						? this._components[index]
						: this._convert(type)[index];
			};

			this['set' + part] = function(value) {
				if (this._type !== type
						&& !(hasOverlap && /^hs[bl]$/.test(this._type))) {
					this._components = this._convert(type);
					this._properties = types[type];
					this._type = type;
				}
				value = parser.call(this, value);
				if (value != null) {
					this._components[index] = value;
					this._changed();
				}
			};
		}, this);
	}, {
		_class: 'Color',
		_readIndex: true,

		initialize: function Color(arg) {
			var slice = Array.prototype.slice,
				args = arguments,
				read = 0,
				type,
				components,
				alpha,
				values;
			if (Array.isArray(arg)) {
				args = arg;
				arg = args[0];
			}
			var argType = arg != null && typeof arg;
			if (argType === 'string' && arg in types) {
				type = arg;
				arg = args[1];
				if (Array.isArray(arg)) {
					components = arg;
					alpha = args[2];
				} else {
					if (this.__read)
						read = 1; 
					args = slice.call(args, 1);
					argType = typeof arg;
				}
			}
			if (!components) {
				values = argType === 'number'
						? args
						: argType === 'object' && arg.length != null
							? arg
							: null;
				if (values) {
					if (!type)
						type = values.length >= 3
								? 'rgb'
								: 'gray';
					var length = types[type].length;
					alpha = values[length];
					if (this.__read)
						read += values === arguments
							? length + (alpha != null ? 1 : 0)
							: 1;
					if (values.length > length)
						values = slice.call(values, 0, length);
				} else if (argType === 'string') {
					type = 'rgb';
					components = fromCSS(arg);
					if (components.length === 4) {
						alpha = components[3];
						components.length--;
					}
				} else if (argType === 'object') {
					if (arg.constructor === Color) {
						type = arg._type;
						components = arg._components.slice();
						alpha = arg._alpha;
						if (type === 'gradient') {
							for (var i = 1, l = components.length; i < l; i++) {
								var point = components[i];
								if (point)
									components[i] = point.clone();
							}
						}
					} else if (arg.constructor === Gradient) {
						type = 'gradient';
						values = args;
					} else {
						type = 'hue' in arg
							? 'lightness' in arg
								? 'hsl'
								: 'hsb'
							: 'gradient' in arg || 'stops' in arg
									|| 'radial' in arg
								? 'gradient'
								: 'gray' in arg
									? 'gray'
									: 'rgb';
						var properties = types[type];
							parsers = componentParsers[type];
						this._components = components = [];
						for (var i = 0, l = properties.length; i < l; i++) {
							var value = arg[properties[i]];
							if (value == null && i === 0 && type === 'gradient'
									&& 'stops' in arg) {
								value = {
									stops: arg.stops,
									radial: arg.radial
								};
							}
							value = parsers[i].call(this, value);
							if (value != null)
								components[i] = value;
						}
						alpha = arg.alpha;
					}
				}
				if (this.__read && type)
					read = 1;
			}
			this._type = type || 'rgb';
			if (type === 'gradient')
				this._id = Color._id = (Color._id || 0) + 1;
			if (!components) {
				this._components = components = [];
				var parsers = componentParsers[this._type];
				for (var i = 0, l = parsers.length; i < l; i++) {
					var value = parsers[i].call(this, values && values[i]);
					if (value != null)
						components[i] = value;
				}
			}
			this._components = components;
			this._properties = types[this._type];
			this._alpha = alpha;
			if (this.__read)
				this.__read = read;
		},

		_serialize: function(options, dictionary) {
			var components = this.getComponents();
			return Base.serialize(
					/^(gray|rgb)$/.test(this._type)
						? components
						: [this._type].concat(components),
					options, true, dictionary);
		},

		_changed: function() {
			this._canvasStyle = null;
			if (this._owner)
				this._owner._changed(17);
		},

		_convert: function(type) {
			var converter;
			return this._type === type
					? this._components.slice()
					: (converter = converters[this._type + '-' + type])
						? converter.apply(this, this._components)
						: converters['rgb-' + type].apply(this,
							converters[this._type + '-rgb'].apply(this,
								this._components));
		},

		convert: function(type) {
			return new Color(type, this._convert(type), this._alpha);
		},

		getType: function() {
			return this._type;
		},

		setType: function(type) {
			this._components = this._convert(type);
			this._properties = types[type];
			this._type = type;
		},

		getComponents: function() {
			var components = this._components.slice();
			if (this._alpha != null)
				components.push(this._alpha);
			return components;
		},

		getAlpha: function() {
			return this._alpha != null ? this._alpha : 1;
		},

		setAlpha: function(alpha) {
			this._alpha = alpha == null ? null : Math.min(Math.max(alpha, 0), 1);
			this._changed();
		},

		hasAlpha: function() {
			return this._alpha != null;
		},

		equals: function(color) {
			var col = Base.isPlainValue(color)
					? Color.read(arguments)
					: color;
			return col === this || col && this._class === col._class
					&& this._type === col._type
					&& this._alpha === col._alpha
					&& Base.equals(this._components, col._components)
					|| false;
		},

		toString: function() {
			var properties = this._properties,
				parts = [],
				isGradient = this._type === 'gradient',
				f = Formatter.instance;
			for (var i = 0, l = properties.length; i < l; i++) {
				var value = this._components[i];
				if (value != null)
					parts.push(properties[i] + ': '
							+ (isGradient ? value : f.number(value)));
			}
			if (this._alpha != null)
				parts.push('alpha: ' + f.number(this._alpha));
			return '{ ' + parts.join(', ') + ' }';
		},

		toCSS: function(hex) {
			var components = this._convert('rgb'),
				alpha = hex || this._alpha == null ? 1 : this._alpha;
			function convert(val) {
				return Math.round((val < 0 ? 0 : val > 1 ? 1 : val) * 255);
			}
			components = [
				convert(components[0]),
				convert(components[1]),
				convert(components[2])
			];
			if (alpha < 1)
				components.push(alpha < 0 ? 0 : alpha);
			return hex
					? '#' + ((1 << 24) + (components[0] << 16)
						+ (components[1] << 8)
						+ components[2]).toString(16).slice(1)
					: (components.length == 4 ? 'rgba(' : 'rgb(')
						+ components.join(',') + ')';
		},

		toCanvasStyle: function(ctx) {
			if (this._canvasStyle)
				return this._canvasStyle;
			if (this._type !== 'gradient')
				return this._canvasStyle = this.toCSS();
			var components = this._components,
				gradient = components[0],
				stops = gradient._stops,
				origin = components[1],
				destination = components[2],
				canvasGradient;
			if (gradient._radial) {
				var radius = destination.getDistance(origin),
					highlight = components[3];
				if (highlight) {
					var vector = highlight.subtract(origin);
					if (vector.getLength() > radius)
						highlight = origin.add(vector.normalize(radius - 0.1));
				}
				var start = highlight || origin;
				canvasGradient = ctx.createRadialGradient(start.x, start.y,
						0, origin.x, origin.y, radius);
			} else {
				canvasGradient = ctx.createLinearGradient(origin.x, origin.y,
						destination.x, destination.y);
			}
			for (var i = 0, l = stops.length; i < l; i++) {
				var stop = stops[i];
				canvasGradient.addColorStop(stop._rampPoint,
						stop._color.toCanvasStyle());
			}
			return this._canvasStyle = canvasGradient;
		},

		transform: function(matrix) {
			if (this._type === 'gradient') {
				var components = this._components;
				for (var i = 1, l = components.length; i < l; i++) {
					var point = components[i];
					matrix._transformPoint(point, point, true);
				}
				this._changed();
			}
		},

		statics: {
			_types: types,

			random: function() {
				var random = Math.random;
				return new Color(random(), random(), random());
			}
		}
	});
}, new function() {
	var operators = {
		add: function(a, b) {
			return a + b;
		},

		subtract: function(a, b) {
			return a - b;
		},

		multiply: function(a, b) {
			return a * b;
		},

		divide: function(a, b) {
			return a / b;
		}
	};

	return Base.each(operators, function(operator, name) {
		this[name] = function(color) {
			color = Color.read(arguments);
			var type = this._type,
				components1 = this._components,
				components2 = color._convert(type);
			for (var i = 0, l = components1.length; i < l; i++)
				components2[i] = operator(components1[i], components2[i]);
			return new Color(type, components2,
					this._alpha != null
							? operator(this._alpha, color.getAlpha())
							: null);
		};
	}, {
	});
});

Base.each(Color._types, function(properties, type) {
	var ctor = this[Base.capitalize(type) + 'Color'] = function(arg) {
			var argType = arg != null && typeof arg,
				components = argType === 'object' && arg.length != null
					? arg
					: argType === 'string'
						? null
						: arguments;
			return components
					? new Color(type, components)
					: new Color(arg);
		};
	if (type.length == 3) {
		var acronym = type.toUpperCase();
		Color[acronym] = this[acronym + 'Color'] = ctor;
	}
}, Base.exports);

var Gradient = Base.extend({
	_class: 'Gradient',

	initialize: function Gradient(stops, radial) {
		this._id = Gradient._id = (Gradient._id || 0) + 1;
		if (stops && this._set(stops))
			stops = radial = null;
		if (!this._stops)
			this.setStops(stops || ['white', 'black']);
		if (this._radial == null)
			this.setRadial(typeof radial === 'string' && radial === 'radial'
					|| radial || false);
	},

	_serialize: function(options, dictionary) {
		return dictionary.add(this, function() {
			return Base.serialize([this._stops, this._radial],
					options, true, dictionary);
		});
	},

	_changed: function() {
		for (var i = 0, l = this._owners && this._owners.length; i < l; i++)
			this._owners[i]._changed();
	},

	_addOwner: function(color) {
		if (!this._owners)
			this._owners = [];
		this._owners.push(color);
	},

	_removeOwner: function(color) {
		var index = this._owners ? this._owners.indexOf(color) : -1;
		if (index != -1) {
			this._owners.splice(index, 1);
			if (this._owners.length === 0)
				this._owners = undefined;
		}
	},

	clone: function() {
		var stops = [];
		for (var i = 0, l = this._stops.length; i < l; i++)
			stops[i] = this._stops[i].clone();
		return new Gradient(stops);
	},

	getStops: function() {
		return this._stops;
	},

	setStops: function(stops) {
		if (this.stops) {
			for (var i = 0, l = this._stops.length; i < l; i++)
				this._stops[i]._owner = undefined;
		}
		if (stops.length < 2)
			throw new Error(
					'Gradient stop list needs to contain at least two stops.');
		this._stops = GradientStop.readAll(stops, 0, false, true); 
		for (var i = 0, l = this._stops.length; i < l; i++) {
			var stop = this._stops[i];
			stop._owner = this;
			if (stop._defaultRamp)
				stop.setRampPoint(i / (l - 1));
		}
		this._changed();
	},

	getRadial: function() {
		return this._radial;
	},

	setRadial: function(radial) {
		this._radial = radial;
		this._changed();
	},

	equals: function(gradient) {
		if (gradient === this)
			return true;
		if (gradient &&  this._class === gradient._class
				&& this._stops.length === gradient._stops.length) {
			for (var i = 0, l = this._stops.length; i < l; i++) {
				if (!this._stops[i].equals(gradient._stops[i]))
					return false;
			}
			return true;
		}
		return false;
	}
});

var GradientStop = Base.extend({
	_class: 'GradientStop',

	initialize: function GradientStop(arg0, arg1) {
		if (arg0) {
			var color, rampPoint;
			if (arg1 === undefined && Array.isArray(arg0)) {
				color = arg0[0];
				rampPoint = arg0[1];
			} else if (arg0.color) {
				color = arg0.color;
				rampPoint = arg0.rampPoint;
			} else {
				color = arg0;
				rampPoint = arg1;
			}
			this.setColor(color);
			this.setRampPoint(rampPoint);
		}
	},

	clone: function() {
		return new GradientStop(this._color.clone(), this._rampPoint);
	},

	_serialize: function(options, dictionary) {
		return Base.serialize([this._color, this._rampPoint], options, true, 
				dictionary);
	},

	_changed: function() {
		if (this._owner)
			this._owner._changed(17);
	},

	getRampPoint: function() {
		return this._rampPoint;
	},

	setRampPoint: function(rampPoint) {
		this._defaultRamp = rampPoint == null;
		this._rampPoint = rampPoint || 0;
		this._changed();
	},

	getColor: function() {
		return this._color;
	},

	setColor: function(color) {
		this._color = Color.read(arguments);
		if (this._color === color)
			this._color = color.clone();
		this._color._owner = this;
		this._changed();
	},

	equals: function(stop) {
		return stop === this || stop && this._class === stop._class
				&& this._color.equals(stop._color)
				&& this._rampPoint == stop._rampPoint
				|| false;
	}
});

var Style = Base.extend(new function() {
	var defaults = {
		fillColor: undefined,
		strokeColor: undefined,
		strokeWidth: 1,
		strokeCap: 'butt',
		strokeJoin: 'miter',
		miterLimit: 10,
		dashOffset: 0,
		dashArray: [],
		windingRule: 'nonzero',
		shadowColor: undefined,
		shadowBlur: 0,
		shadowOffset: new Point(),
		selectedColor: undefined,
		fontFamily: 'sans-serif',
		fontWeight: 'normal',
		fontSize: 12,
		font: 'sans-serif', 
		leading: null,
		justification: 'left'
	};

	var flags = {
		strokeWidth: 25,
		strokeCap: 25,
		strokeJoin: 25,
		miterLimit: 25,
		fontFamily: 5,
		fontWeight: 5,
		fontSize: 5,
		font: 5, 
		leading: 5,
		justification: 5
	};

	var item = {},
		fields = {
			_defaults: defaults,
			_textDefaults: new Base(defaults, {
				fillColor: new Color() 
			})
		};

	Base.each(defaults, function(value, key) {
		var isColor = /Color$/.test(key),
			part = Base.capitalize(key),
			flag = flags[key],
			set = 'set' + part,
			get = 'get' + part;

		fields[set] = function(value) {
			var children = this._item && this._item._children;
			if (children && children.length > 0
					&& this._item._type !== 'compound-path') {
				for (var i = 0, l = children.length; i < l; i++)
					children[i]._style[set](value);
			} else {
				var old = this._values[key];
				if (old != value) {
					if (isColor) {
						if (old)
							old._owner = undefined;
						if (value && value.constructor === Color) {
							if (value._owner)
								value = value.clone();
							value._owner = this._item;
						}
					}
					this._values[key] = value;
					if (this._item)
						this._item._changed(flag || 17);
				}
			}
		};

		fields[get] = function(_dontMerge) {
			var value,
				children = this._item && this._item._children;
			if (!children || children.length === 0 || _dontMerge
					|| this._item instanceof CompoundPath) {
				var value = this._values[key];
				if (value === undefined) {
					value = this._defaults[key];
					if (value && value.clone)
						value = value.clone();
					this._values[key] = value;
				} else if (isColor && !(value && value.constructor === Color)) {
					this._values[key] = value = Color.read([value], 0,
							{ readNull: true, clone: true });
					if (value)
						value._owner = this._item;
				}
				return value;
			}
			for (var i = 0, l = children.length; i < l; i++) {
				var childValue = children[i]._style[get]();
				if (i === 0) {
					value = childValue;
				} else if (!Base.equals(value, childValue)) {
					return undefined;
				}
			}
			return value;
		};

		item[get] = function() {
			return this._style[get]();
		};

		item[set] = function(value) {
			this._style[set](value);
		};
	});

	Item.inject(item);
	return fields;
}, {
	_class: 'Style',

	initialize: function Style(style, _item) {
		this._values = {};
		this._item = _item;
		if (_item instanceof TextItem)
			this._defaults = this._textDefaults;
		if (style)
			this.set(style);
	},

	set: function(style) {
		var isStyle = style instanceof Style,
			values = isStyle ? style._values : style;
		if (values) {
			for (var key in values) {
				if (key in this._defaults) {
					var value = values[key];
					this[key] = value && isStyle && value.clone
							? value.clone() : value;
				}
			}
		}
	},

	equals: function(style) {
		return style === this || style && this._class === style._class
				&& Base.equals(this._values, style._values)
				|| false;
	},

	hasFill: function() {
		return !!this.getFillColor();
	},

	hasStroke: function() {
		return !!this.getStrokeColor() && this.getStrokeWidth() > 0;
	},

	hasShadow: function() {
		return !!this.getShadowColor() && this.getShadowBlur() > 0;
	},

	getFontStyle: function() {
		var size = this.getFontSize();
		return this.getFontWeight()
				+ ' ' + size + (/[a-z]/i.test(size + '') ? ' ' : 'px ')
				+ this.getFontFamily();
	},

	getFont: '#getFontFamily',

	setFont: '#setFontFamily',

	getLeading: function getLeading() {
		var leading = getLeading.base.call(this);
		return leading != null ? leading : this.getFontSize() * 1.2;
	}

});

var DomElement = new function() {

	var special = /^(checked|value|selected|disabled)$/i,
		translated = { text: 'textContent', html: 'innerHTML' },
		unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 };

	function create(nodes, parent) {
		var res = [];
		for (var i =  0, l = nodes && nodes.length; i < l;) {
			var el = nodes[i++];
			if (typeof el === 'string') {
				el = document.createElement(el);
			} else if (!el || !el.nodeType) {
				continue;
			}
			if (Base.isPlainObject(nodes[i]))
				DomElement.set(el, nodes[i++]);
			if (Array.isArray(nodes[i]))
				create(nodes[i++], el);
			if (parent)
				parent.appendChild(el);
			res.push(el);
		}
		return res;
	}

	function handlePrefix(el, name, set, value) {
		var prefixes = ['webkit', 'moz', 'Moz', 'ms', 'o', ''],
			suffix = name[0].toUpperCase() + name.substring(1);
		for (var i = 0; i < 6; i++) {
			var prefix = prefixes[i],
				key = prefix ? prefix + suffix : name;
			if (key in el) {
				if (set) {
					el[key] = value;
				} else {
					return el[key];
				}
				break;
			}
		}
	}

	return {
		create: function(nodes, parent) {
			var isArray = Array.isArray(nodes),
				res = create(isArray ? nodes : arguments, isArray ? parent : null);
			return res.length == 1 ? res[0] : res;
		},

		find: function(selector, root) {
			return (root || document).querySelector(selector);
		},

		findAll: function(selector, root) {
			return (root || document).querySelectorAll(selector);
		},

		get: function(el, key) {
			return el
				? special.test(key)
					? key === 'value' || typeof el[key] !== 'string'
						? el[key]
						: true
					: key in translated
						? el[translated[key]]
						: el.getAttribute(key)
				: null;
		},

		set: function(el, key, value) {
			if (typeof key !== 'string') {
				for (var name in key)
					if (key.hasOwnProperty(name))
						this.set(el, name, key[name]);
			} else if (!el || value === undefined) {
				return el;
			} else if (special.test(key)) {
				el[key] = value;
			} else if (key in translated) {
				el[translated[key]] = value;
			} else if (key === 'style') {
				this.setStyle(el, value);
			} else if (key === 'events') {
				DomEvent.add(el, value);
			} else {
				el.setAttribute(key, value);
			}
			return el;
		},

		getStyles: function(el) {
			var doc = el && el.nodeType !== 9 ? el.ownerDocument : el,
				view = doc && doc.defaultView;
			return view && view.getComputedStyle(el, '');
		},

		getStyle: function(el, key) {
			return el && el.style[key] || this.getStyles(el)[key] || null;
		},

		setStyle: function(el, key, value) {
			if (typeof key !== 'string') {
				for (var name in key)
					if (key.hasOwnProperty(name))
						this.setStyle(el, name, key[name]);
			} else {
				if (/^-?[\d\.]+$/.test(value) && !(key in unitless))
					value += 'px';
				el.style[key] = value;
			}
			return el;
		},

		hasClass: function(el, cls) {
			return new RegExp('\\s*' + cls + '\\s*').test(el.className);
		},

		addClass: function(el, cls) {
			el.className = (el.className + ' ' + cls).trim();
		},

		removeClass: function(el, cls) {
			el.className = el.className.replace(
				new RegExp('\\s*' + cls + '\\s*'), ' ').trim();
		},

		remove: function(el) {
			if (el.parentNode)
				el.parentNode.removeChild(el);
		},

		removeChildren: function(el) {
			while (el.firstChild)
				el.removeChild(el.firstChild);
		},

		getBounds: function(el, viewport) {
			var doc = el.ownerDocument,
				body = doc.body,
				html = doc.documentElement,
				rect;
			try {
				rect = el.getBoundingClientRect();
			} catch (e) {
				rect = { left: 0, top: 0, width: 0, height: 0 };
			}
			var x = rect.left - (html.clientLeft || body.clientLeft || 0),
				y = rect.top - (html.clientTop  || body.clientTop  || 0);
			if (!viewport) {
				var view = doc.defaultView;
				x += view.pageXOffset || html.scrollLeft || body.scrollLeft;
				y += view.pageYOffset || html.scrollTop || body.scrollTop;
			}
			return new Rectangle(x, y, rect.width, rect.height);
		},

		getViewportBounds: function(el) {
			var doc = el.ownerDocument,
				view = doc.defaultView,
				html = doc.documentElement;
			return new Rectangle(0, 0, 
				view.innerWidth || html.clientWidth,
				view.innerHeight || html.clientHeight
			);
		},

		getOffset: function(el, viewport) {
			return this.getBounds(el, viewport).getPoint();
		},

		getSize: function(el) {
			return this.getBounds(el, true).getSize();
		},

		isInvisible: function(el) {
			return this.getSize(el).equals(new Size(0, 0));
		},

		isInView: function(el) {
			return !this.isInvisible(el) && this.getViewportBounds(el).intersects(
					this.getBounds(el, true));
		},

		getPrefixed: function(el, name) {
			return handlePrefix(el, name);
		},

		setPrefixed: function(el, name, value) {
			if (typeof name === 'object') {
				for (var key in name)
					handlePrefix(el, key, true, name[key]);
			} else {
				handlePrefix(el, name, true, value);
			}
		}
	};
};

var DomEvent = {
	add: function(el, events) {
		for (var type in events) {
			var func = events[type],
				parts = type.split(/[\s,]+/g);
			for (var i = 0, l = parts.length; i < l; i++)
				el.addEventListener(parts[i], func, false);
		}
	},

	remove: function(el, events) {
		for (var type in events) {
			var func = events[type],
				parts = type.split(/[\s,]+/g);
			for (var i = 0, l = parts.length; i < l; i++)
				el.removeEventListener(parts[i], func, false);
		}
	},

	getPoint: function(event) {
		var pos = event.targetTouches
				? event.targetTouches.length
					? event.targetTouches[0]
					: event.changedTouches[0]
				: event;
		return new Point(
			pos.pageX || pos.clientX + document.documentElement.scrollLeft,
			pos.pageY || pos.clientY + document.documentElement.scrollTop
		);
	},

	getTarget: function(event) {
		return event.target || event.srcElement;
	},

	getRelatedTarget: function(event) {
		return event.relatedTarget || event.toElement;
	},

	getOffset: function(event, target) {
		return DomEvent.getPoint(event).subtract(DomElement.getOffset(
				target || DomEvent.getTarget(event)));
	},

	stop: function(event) {
		event.stopPropagation();
		event.preventDefault();
	}
};

DomEvent.requestAnimationFrame = new function() {
	var nativeRequest = DomElement.getPrefixed(window, 'requestAnimationFrame'),
		requested = false,
		callbacks = [],
		focused = true,
		timer;

	DomEvent.add(window, {
		focus: function() {
			focused = true;
		},
		blur: function() {
			focused = false;
		}
	});

	function handleCallbacks() {
		for (var i = callbacks.length - 1; i >= 0; i--) {
			var entry = callbacks[i],
				func = entry[0],
				el = entry[1];
			if (!el || (PaperScope.getAttribute(el, 'keepalive') == 'true'
					|| focused) && DomElement.isInView(el)) {
				callbacks.splice(i, 1);
				func();
			}
		}
		if (nativeRequest) {
			if (callbacks.length) {
				nativeRequest(handleCallbacks);
			} else {
				requested = false;
			}
		}
	}

	return function(callback, element) {
		callbacks.push([callback, element]);
		if (nativeRequest) {
			if (!requested) {
				nativeRequest(handleCallbacks);
				requested = true;
			}
		} else if (!timer) {
			timer = setInterval(handleCallbacks, 1000 / 60);
		}
	};
};

var View = Base.extend(Callback, {
	_class: 'View',

	initialize: function View(element) {
		this._scope = paper;
		this._project = paper.project;
		this._element = element;
		var size;
		if (!this._pixelRatio)
			this._pixelRatio = window.devicePixelRatio || 1;
		this._id = element.getAttribute('id');
		if (this._id == null)
			element.setAttribute('id', this._id = 'view-' + View._id++);
		DomEvent.add(element, this._viewEvents);
		var none = 'none';
		DomElement.setPrefixed(element.style, {
			userSelect: none,
			touchAction: none,
			touchCallout: none,
			contentZooming: none,
			userDrag: none,
			tapHighlightColor: 'rgba(0,0,0,0)'
		});
		if (PaperScope.hasAttribute(element, 'resize')) {
			var offset = DomElement.getOffset(element, true),
				that = this;
			size = DomElement.getViewportBounds(element)
					.getSize().subtract(offset);
			this._windowEvents = {
				resize: function() {
					if (!DomElement.isInvisible(element))
						offset = DomElement.getOffset(element, true);
					that.setViewSize(DomElement.getViewportBounds(element)
							.getSize().subtract(offset));
				}
			};
			DomEvent.add(window, this._windowEvents);
		} else {
			size = DomElement.getSize(element);
			if (size.isNaN() || size.isZero())
				size = new Size(parseInt(element.getAttribute('width'), 10),
							parseInt(element.getAttribute('height'), 10));
		}
		this._setViewSize(size);
		if (PaperScope.hasAttribute(element, 'stats')
				&& typeof Stats !== 'undefined') {
			this._stats = new Stats();
			var stats = this._stats.domElement,
				style = stats.style,
				offset = DomElement.getOffset(element);
			style.position = 'absolute';
			style.left = offset.x + 'px';
			style.top = offset.y + 'px';
			document.body.appendChild(stats);
		}
		View._views.push(this);
		View._viewsById[this._id] = this;
		this._viewSize = size;
		(this._matrix = new Matrix())._owner = this;
		this._zoom = 1;
		if (!View._focused)
			View._focused = this;
		this._frameItems = {};
		this._frameItemCount = 0;
	},

	remove: function() {
		if (!this._project)
			return false;
		if (View._focused === this)
			View._focused = null;
		View._views.splice(View._views.indexOf(this), 1);
		delete View._viewsById[this._id];
		if (this._project.view == this)
			this._project.view = null;
		DomEvent.remove(this._element, this._viewEvents);
		DomEvent.remove(window, this._windowEvents);
		this._element = this._project = null;
		this.detach('frame');
		this._animate = false;
		this._frameItems = {};
		return true;
	},

	_events: {
		onFrame: {
			install: function() {
				this.play();
			},

			uninstall: function() {
				this.pause();
			}
		},

		onResize: {}
	},

	_animate: false,
	_time: 0,
	_count: 0,

	_requestFrame: function() {
		var that = this;
		DomEvent.requestAnimationFrame(function() {
			that._requested = false;
			if (!that._animate)
				return;
			that._requestFrame();
			that._handleFrame();
		}, this._element);
		this._requested = true;
	},

	_handleFrame: function() {
		paper = this._scope;
		var now = Date.now() / 1000,
			delta = this._before ? now - this._before : 0;
		this._before = now;
		this._handlingFrame = true;
		this.fire('frame', new Base({
			delta: delta,
			time: this._time += delta,
			count: this._count++
		}));
		if (this._stats)
			this._stats.update();
		this._handlingFrame = false;
		this.update();
	},

	_animateItem: function(item, animate) {
		var items = this._frameItems;
		if (animate) {
			items[item._id] = {
				item: item,
				time: 0,
				count: 0
			};
			if (++this._frameItemCount === 1)
				this.attach('frame', this._handleFrameItems);
		} else {
			delete items[item._id];
			if (--this._frameItemCount === 0) {
				this.detach('frame', this._handleFrameItems);
			}
		}
	},

	_handleFrameItems: function(event) {
		for (var i in this._frameItems) {
			var entry = this._frameItems[i];
			entry.item.fire('frame', new Base(event, {
				time: entry.time += event.delta,
				count: entry.count++
			}));
		}
	},

	_update: function() {
		this._project._needsUpdate = true;
		if (this._handlingFrame)
			return;
		if (this._animate) {
			this._handleFrame();
		} else {
			this.update();
		}
	},

	_changed: function(flags) {
		if (flags & 1)
			this._project._needsUpdate = true;
	},

	_transform: function(matrix) {
		this._matrix.concatenate(matrix);
		this._bounds = null;
		this._update();
	},

	getElement: function() {
		return this._element;
	},

	getPixelRatio: function() {
		return this._pixelRatio;
	},

	getResolution: function() {
		return this._pixelRatio * 72;
	},

	getViewSize: function() {
		var size = this._viewSize;
		return new LinkedSize(size.width, size.height, this, 'setViewSize');
	},

	setViewSize: function() {
		var size = Size.read(arguments),
			delta = size.subtract(this._viewSize);
		if (delta.isZero())
			return;
		this._viewSize.set(size.width, size.height);
		this._setViewSize(size);
		this._bounds = null; 
		this.fire('resize', {
			size: size,
			delta: delta
		});
		this._update();
	},

	_setViewSize: function(size) {
		var element = this._element;
		element.width = size.width;
		element.height = size.height;
	},

	getBounds: function() {
		if (!this._bounds)
			this._bounds = this._matrix.inverted()._transformBounds(
					new Rectangle(new Point(), this._viewSize));
		return this._bounds;
	},

	getSize: function() {
		return this.getBounds().getSize();
	},

	getCenter: function() {
		return this.getBounds().getCenter();
	},

	setCenter: function(center) {
		center = Point.read(arguments);
		this.scrollBy(center.subtract(this.getCenter()));
	},

	getZoom: function() {
		return this._zoom;
	},

	setZoom: function(zoom) {
		this._transform(new Matrix().scale(zoom / this._zoom,
			this.getCenter()));
		this._zoom = zoom;
	},

	isVisible: function() {
		return DomElement.isInView(this._element);
	},

	scrollBy: function() {
		this._transform(new Matrix().translate(Point.read(arguments).negate()));
	},

	play: function() {
		this._animate = true;
		if (!this._requested)
			this._requestFrame();
	},

	pause: function() {
		this._animate = false;
	},

	draw: function() {
		this.update();
	},

	projectToView: function() {
		return this._matrix._transformPoint(Point.read(arguments));
	},

	viewToProject: function() {
		return this._matrix._inverseTransform(Point.read(arguments));
	}

}, {
	statics: {
		_views: [],
		_viewsById: {},
		_id: 0,

		create: function(element) {
			if (typeof element === 'string')
				element = document.getElementById(element);
			return new CanvasView(element);
		}
	}
}, new function() {
	var tool,
		prevFocus,
		tempFocus,
		dragging = false;

	function getView(event) {
		var target = DomEvent.getTarget(event);
		return target.getAttribute && View._viewsById[target.getAttribute('id')];
	}

	function viewToProject(view, event) {
		return view.viewToProject(DomEvent.getOffset(event, view._element));
	}

	function updateFocus() {
		if (!View._focused || !View._focused.isVisible()) {
			for (var i = 0, l = View._views.length; i < l; i++) {
				var view = View._views[i];
				if (view && view.isVisible()) {
					View._focused = tempFocus = view;
					break;
				}
			}
		}
	}

	function handleMouseMove(view, point, event) {
		view._handleEvent('mousemove', point, event);
		var tool = view._scope.tool;
		if (tool) {
			tool._handleEvent(dragging && tool.responds('mousedrag')
					? 'mousedrag' : 'mousemove', point, event);
		}
		view.update();
		return tool;
	}

	var navigator = window.navigator,
		mousedown, mousemove, mouseup;
	if (navigator.pointerEnabled || navigator.msPointerEnabled) {
		mousedown = 'pointerdown MSPointerDown';
		mousemove = 'pointermove MSPointerMove';
		mouseup = 'pointerup pointercancel MSPointerUp MSPointerCancel';
	} else {
		mousedown = 'touchstart';
		mousemove = 'touchmove';
		mouseup = 'touchend touchcancel';
		if (!('ontouchstart' in window && navigator.userAgent.match(
				/mobile|tablet|ip(ad|hone|od)|android|silk/i))) {
			mousedown += ' mousedown';
			mousemove += ' mousemove';
			mouseup += ' mouseup';
		}
	}

	var viewEvents = {
		'selectstart dragstart': function(event) {
			if (dragging)
				event.preventDefault();
		}
	};

	var docEvents = {
		mouseout: function(event) {
			var view = View._focused,
				target = DomEvent.getRelatedTarget(event);
			if (view && (!target || target.nodeName === 'HTML'))
				handleMouseMove(view, viewToProject(view, event), event);
		},

		scroll: updateFocus
	};

	viewEvents[mousedown] = function(event) {
		var view = View._focused = getView(event),
			point = viewToProject(view, event);
		dragging = true;
		view._handleEvent('mousedown', point, event);
		if (tool = view._scope.tool)
			tool._handleEvent('mousedown', point, event);
		view.update();
	};

	docEvents[mousemove] = function(event) {
		var view = View._focused;
		if (!dragging) {
			var target = getView(event);
			if (target) {
				if (view !== target)
					handleMouseMove(view, viewToProject(view, event), event);
				prevFocus = view;
				view = View._focused = tempFocus = target;
			} else if (tempFocus && tempFocus === view) {
				view = View._focused = prevFocus;
				updateFocus();
			}
		}
		if (view) {
			var point = viewToProject(view, event);
			if (dragging || view.getBounds().contains(point))
				tool = handleMouseMove(view, point, event);
		}
	};

	docEvents[mouseup] = function(event) {
		var view = View._focused;
		if (!view || !dragging)
			return;
		var point = viewToProject(view, event);
		curPoint = null;
		dragging = false;
		view._handleEvent('mouseup', point, event);
		if (tool)
			tool._handleEvent('mouseup', point, event);
		view.update();
	};

	DomEvent.add(document, docEvents);

	DomEvent.add(window, {
		load: updateFocus
	});

	return {
		_viewEvents: viewEvents,

		_handleEvent: function() {},

		statics: {
			updateFocus: updateFocus
		}
	};
});

var CanvasView = View.extend({
	_class: 'CanvasView',

	initialize: function CanvasView(canvas) {
		if (!(canvas instanceof HTMLCanvasElement)) {
			var size = Size.read(arguments);
			if (size.isZero())
				throw new Error(
						'Cannot create CanvasView with the provided argument: '
						+ canvas);
			canvas = CanvasProvider.getCanvas(size);
		}
		this._context = canvas.getContext('2d');
		this._eventCounters = {};
		this._pixelRatio = 1;
		if (PaperScope.getAttribute(canvas, 'hidpi') !== 'off') {
			var deviceRatio = window.devicePixelRatio || 1,
				backingStoreRatio = DomElement.getPrefixed(this._context,
						'backingStorePixelRatio') || 1;
			this._pixelRatio = deviceRatio / backingStoreRatio;
		}
		View.call(this, canvas);
	},

	_setViewSize: function(size) {
		var width = size.width,
			height = size.height,
			pixelRatio = this._pixelRatio,
			element = this._element,
			style = element.style;
		element.width = width * pixelRatio;
		element.height = height * pixelRatio;
		if (pixelRatio !== 1) {
			style.width = width + 'px';
			style.height = height + 'px';
			this._context.scale(pixelRatio, pixelRatio);
		}
	},

	update: function() {
		if (!this._project._needsUpdate)
			return false;
		var ctx = this._context,
			size = this._viewSize;
		ctx.clearRect(0, 0, size.width + 1, size.height + 1);
		this._project.draw(ctx, this._matrix, this._pixelRatio);
		this._project._needsUpdate = false;
		return true;
	}
}, new function() { 

	var downPoint,
		lastPoint,
		overPoint,
		downItem,
		lastItem,
		overItem,
		dragItem,
		dblClick,
		clickTime;

	function callEvent(view, type, event, point, target, lastPoint) {
		var item = target,
			mouseEvent;

		function call(obj) {
			if (obj.responds(type)) {
				if (!mouseEvent) {
					mouseEvent = new MouseEvent(type, event, point, target,
							lastPoint ? point.subtract(lastPoint) : null);
				}
				if (obj.fire(type, mouseEvent) && mouseEvent.isStopped) {
					event.preventDefault();
					return true;
				}
			}
		}

		while (item) {
			if (call(item))
				return true;
			item = item.getParent();
		}
		if (call(view))
			return true;
		return false;
	}

	return {
		_handleEvent: function(type, point, event) {
			if (!this._eventCounters[type])
				return;
			var project = this._project,
				hit = project.hitTest(point, {
					tolerance: this._scope.settings.hitTolerance,
					fill: true,
					stroke: true
				}),
				item = hit && hit.item,
				stopped = false;
			switch (type) {
			case 'mousedown':
				stopped = callEvent(this, type, event, point, item);
				dblClick = lastItem == item && (Date.now() - clickTime < 300);
				downItem = lastItem = item;
				downPoint = lastPoint = overPoint = point;
				dragItem = !stopped && item;
				while (dragItem && !dragItem.responds('mousedrag'))
					dragItem = dragItem._parent;
				break;
			case 'mouseup':
				stopped = callEvent(this, type, event, point, item, downPoint);
				if (dragItem) {
					if (lastPoint && !lastPoint.equals(point))
						callEvent(this, 'mousedrag', event, point, dragItem,
								lastPoint);
					if (item !== dragItem) {
						overPoint = point;
						callEvent(this, 'mousemove', event, point, item,
								overPoint);
					}
				}
				if (!stopped && item && item === downItem) {
					clickTime = Date.now();
					callEvent(this, dblClick && downItem.responds('doubleclick')
							? 'doubleclick' : 'click', event, downPoint, item);
					dblClick = false;
				}
				downItem = dragItem = null;
				break;
			case 'mousemove':
				if (dragItem)
					stopped = callEvent(this, 'mousedrag', event, point,
							dragItem, lastPoint);
				if (!stopped) {
					if (item !== overItem)
						overPoint = point;
					stopped = callEvent(this, type, event, point, item,
							overPoint);
				}
				lastPoint = overPoint = point;
				if (item !== overItem) {
					callEvent(this, 'mouseleave', event, point, overItem);
					overItem = item;
					callEvent(this, 'mouseenter', event, point, item);
				}
				break;
			}
			return stopped;
		}
	};
});

var Event = Base.extend({
	_class: 'Event',

	initialize: function Event(event) {
		this.event = event;
	},

	isPrevented: false,
	isStopped: false,

	preventDefault: function() {
		this.isPrevented = true;
		this.event.preventDefault();
	},

	stopPropagation: function() {
		this.isStopped = true;
		this.event.stopPropagation();
	},

	stop: function() {
		this.stopPropagation();
		this.preventDefault();
	},

	getModifiers: function() {
		return Key.modifiers;
	}
});

var KeyEvent = Event.extend({
	_class: 'KeyEvent',

	initialize: function KeyEvent(down, key, character, event) {
		Event.call(this, event);
		this.type = down ? 'keydown' : 'keyup';
		this.key = key;
		this.character = character;
	},

	toString: function() {
		return "{ type: '" + this.type
				+ "', key: '" + this.key
				+ "', character: '" + this.character
				+ "', modifiers: " + this.getModifiers()
				+ " }";
	}
});

var Key = new function() {

	var specialKeys = {
		8: 'backspace',
		9: 'tab',
		13: 'enter',
		16: 'shift',
		17: 'control',
		18: 'option',
		19: 'pause',
		20: 'caps-lock',
		27: 'escape',
		32: 'space',
		35: 'end',
		36: 'home',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		46: 'delete',
		91: 'command',
		93: 'command', 
		224: 'command'  
	},

	specialChars = {
		9: true, 
		13: true, 
		32: true 
	},

	modifiers = new Base({
		shift: false,
		control: false,
		option: false,
		command: false,
		capsLock: false,
		space: false
	}),

	charCodeMap = {}, 
	keyMap = {}, 
	downCode; 

	function handleKey(down, keyCode, charCode, event) {
		var character = charCode ? String.fromCharCode(charCode) : '',
			specialKey = specialKeys[keyCode],
			key = specialKey || character.toLowerCase(),
			type = down ? 'keydown' : 'keyup',
			view = View._focused,
			scope = view && view.isVisible() && view._scope,
			tool = scope && scope.tool,
			name;
		keyMap[key] = down;
		if (specialKey && (name = Base.camelize(specialKey)) in modifiers)
			modifiers[name] = down;
		if (down) {
			charCodeMap[keyCode] = charCode;
		} else {
			delete charCodeMap[keyCode];
		}
		if (tool && tool.responds(type)) {
			paper = scope;
			tool.fire(type, new KeyEvent(down, key, character, event));
			if (view)
				view.update();
		}
	}

	DomEvent.add(document, {
		keydown: function(event) {
			var code = event.which || event.keyCode;
			if (code in specialKeys) {
				handleKey(true, code, code in specialChars ? code : 0, event);
			} else {
				downCode = code;
			}
		},

		keypress: function(event) {
			if (downCode != null) {
				handleKey(true, downCode, event.which || event.keyCode, event);
				downCode = null;
			}
		},

		keyup: function(event) {
			var code = event.which || event.keyCode;
			if (code in charCodeMap)
				handleKey(false, code, charCodeMap[code], event);
		}
	});

	DomEvent.add(window, {
		blur: function(event) {
			for (var code in charCodeMap)
				handleKey(false, code, charCodeMap[code], event);
		}
	});

	return {
		modifiers: modifiers,

		isDown: function(key) {
			return !!keyMap[key];
		}
	};
};

var MouseEvent = Event.extend({
	_class: 'MouseEvent',

	initialize: function MouseEvent(type, event, point, target, delta) {
		Event.call(this, event);
		this.type = type;
		this.point = point;
		this.target = target;
		this.delta = delta;
	},

	toString: function() {
		return "{ type: '" + this.type
				+ "', point: " + this.point
				+ ', target: ' + this.target
				+ (this.delta ? ', delta: ' + this.delta : '')
				+ ', modifiers: ' + this.getModifiers()
				+ ' }';
	}
});

 Base.extend(Callback, {
	_class: 'Palette',
	_events: [ 'onChange' ],

	initialize: function Palette(title, components, values) {
		var parent = DomElement.find('.palettejs-panel')
			|| DomElement.find('body').appendChild(
				DomElement.create('div', { 'class': 'palettejs-panel' }));
		this._element = parent.appendChild(
			DomElement.create('table', { 'class': 'palettejs-pane' }));
		this._title = title;
		if (!values)
			values = {};
		for (var name in (this.components = components)) {
			var component = components[name];
			if (!(component instanceof Component)) {
				if (component.value == null)
					component.value = values[name];
				component.name = name;
				component = components[name] = new Component(component);
			}
			this._element.appendChild(component._element);
			component._palette = this;
			if (values[name] === undefined)
				values[name] = component.value;
		}
		this.values = Base.each(values, function(value, name) {
			var component = components[name];
			if (component) {
				Base.define(values, name, {
					enumerable: true,
					configurable: true,
					get: function() {
						return component._value;
					},
					set: function(val) {
						component.setValue(val);
					}
				});
			}
		});
		if (window.paper)
			paper.palettes.push(this);
	},

	reset: function() {
		for (var i in this.components)
			this.components[i].reset();
	},

	remove: function() {
		DomElement.remove(this._element);
	}
});

var Component = Base.extend(Callback, {
	_class: 'Component',
	_events: [ 'onChange', 'onClick' ],

	_types: {
		'boolean': {
			type: 'checkbox',
			value: 'checked'
		},

		string: {
			type: 'text'
		},

		number: {
			type: 'number',
			number: true
		},

		button: {
			type: 'button'
		},

		text: {
			tag: 'div',
			value: 'text'
		},

		slider: {
			type: 'range',
			number: true
		},

		list: {
			tag: 'select',

			setOptions: function() {
				DomElement.removeChildren(this._input);
				DomElement.create(Base.each(this._options, function(option) {
					this.push('option', { value: option, text: option });
				}, []), this._input);
			}
		},

		color: {
			type: 'color',

			getValue: function(value) {
				return new Color(value);
			},

			setValue: function(value) {
				return new Color(value).toCSS(
						DomElement.get(this._input, 'type') === 'color');
			}
		}
	},

	initialize: function Component(obj) {
		this._id = Component._id = (Component._id || 0) + 1;
		this._type = obj.type in this._types
			? obj.type
			: 'options' in obj
				? 'list'
				: 'onClick' in obj
					? 'button'
					: typeof obj.value;
		this._meta = this._types[this._type] || { type: this._type };
		var that = this,
			id = 'component-' + this._id;
		this._dontFire = true;
		this._input = DomElement.create(this._meta.tag || 'input', {
			id: id,
			type: this._meta.type,
			events: {
				change: function() {
					that.setValue(
						DomElement.get(this, that._meta.value || 'value'));
				},
				click: function() {
					that.fire('click');
				}
			}
		});
		this.attach('change', function(value) {
			if (!this._dontFire)
				this._palette.fire('change', this, this.name, value);
		});
		this._element = DomElement.create('tr', [
			'td', [this._label = DomElement.create('label', { 'for': id })],
			'td', [this._input]
		]);
		Base.each(obj, function(value, key) {
			this[key] = value;
		}, this);
		this._defaultValue = this._value;
		this._dontFire = false;
	},

	getType: function() {
		return this._type;
	},

	getLabel: function() {
		return this.__label;
	},

	setLabel: function(label) {
		this.__label = label;
		DomElement.set(this._label, 'text', label + ':');
	},

	getOptions: function() {
		return this._options;
	},

	setOptions: function(options) {
		this._options = options;
		var setOptions = this._meta.setOptions;
		if (setOptions)
			setOptions.call(this);
	},

	getValue: function() {
		var value = this._value,
			getValue = this._meta.getValue;
		return getValue ? getValue.call(this, value) : value;
	},

	setValue: function(value) {
		var key = this._meta.value || 'value',
			setValue = this._meta.setValue;
		if (setValue)
			value = setValue.call(this, value);
		DomElement.set(this._input, key, value);
		value = DomElement.get(this._input, key);
		if (this._meta.number)
			value = parseFloat(value, 10);
		if (this._value !== value) {
			this._value = value;
			if (!this._dontFire)
				this.fire('change', this.getValue());
		}
	},

	getRange: function() {
		return [parseFloat(DomElement.get(this._input, 'min')),
				parseFloat(DomElement.get(this._input, 'max'))];
	},

	setRange: function(min, max) {
		var range = Array.isArray(min) ? min : [min, max];
		DomElement.set(this._input, { min: range[0], max: range[1] });
	},

	getMin: function() {
		return this.getRange()[0];
	},

	setMin: function(min) {
		this.setRange(min, this.getMax());
	},

	getMax: function() {
		return this.getRange()[1];
	},

	setMax: function(max) {
		this.setRange(this.getMin(), max);
	},

	getStep: function() {
		return parseFloat(DomElement.get(this._input, 'step'));
	},

	setStep: function(step) {
		DomElement.set(this._input, 'step', step);
	},

	reset: function() {
		this.setValue(this._defaultValue);
	}
});

var ToolEvent = Event.extend({
	_class: 'ToolEvent',
	_item: null,

	initialize: function ToolEvent(tool, type, event) {
		this.tool = tool;
		this.type = type;
		this.event = event;
	},

	_choosePoint: function(point, toolPoint) {
		return point ? point : toolPoint ? toolPoint.clone() : null;
	},

	getPoint: function() {
		return this._choosePoint(this._point, this.tool._point);
	},

	setPoint: function(point) {
		this._point = point;
	},

	getLastPoint: function() {
		return this._choosePoint(this._lastPoint, this.tool._lastPoint);
	},

	setLastPoint: function(lastPoint) {
		this._lastPoint = lastPoint;
	},

	getDownPoint: function() {
		return this._choosePoint(this._downPoint, this.tool._downPoint);
	},

	setDownPoint: function(downPoint) {
		this._downPoint = downPoint;
	},

	getMiddlePoint: function() {
		if (!this._middlePoint && this.tool._lastPoint) {
			return this.tool._point.add(this.tool._lastPoint).divide(2);
		}
		return this._middlePoint;
	},

	setMiddlePoint: function(middlePoint) {
		this._middlePoint = middlePoint;
	},

	getDelta: function() {
		return !this._delta && this.tool._lastPoint
		 		? this.tool._point.subtract(this.tool._lastPoint)
				: this._delta;
	},

	setDelta: function(delta) {
		this._delta = delta;
	},

	getCount: function() {
		return /^mouse(down|up)$/.test(this.type)
				? this.tool._downCount
				: this.tool._count;
	},

	setCount: function(count) {
		this.tool[/^mouse(down|up)$/.test(this.type) ? 'downCount' : 'count']
			= count;
	},

	getItem: function() {
		if (!this._item) {
			var result = this.tool._scope.project.hitTest(this.getPoint());
			if (result) {
				var item = result.item,
					parent = item._parent;
				while (/^(group|compound-path)$/.test(parent._type)) {
					item = parent;
					parent = parent._parent;
				}
				this._item = item;
			}
		}
		return this._item;
	},
	setItem: function(item) {
		this._item = item;
	},

	toString: function() {
		return '{ type: ' + this.type
				+ ', point: ' + this.getPoint()
				+ ', count: ' + this.getCount()
				+ ', modifiers: ' + this.getModifiers()
				+ ' }';
	}
});

var Tool = PaperScopeItem.extend({
	_class: 'Tool',
	_list: 'tools',
	_reference: 'tool',
	_events: [ 'onActivate', 'onDeactivate', 'onEditOptions',
			'onMouseDown', 'onMouseUp', 'onMouseDrag', 'onMouseMove',
			'onKeyDown', 'onKeyUp' ],

	initialize: function Tool(props) {
		PaperScopeItem.call(this);
		this._firstMove = true;
		this._count = 0;
		this._downCount = 0;
		this._set(props);
	},

	getMinDistance: function() {
		return this._minDistance;
	},

	setMinDistance: function(minDistance) {
		this._minDistance = minDistance;
		if (this._minDistance != null && this._maxDistance != null
				&& this._minDistance > this._maxDistance) {
			this._maxDistance = this._minDistance;
		}
	},

	getMaxDistance: function() {
		return this._maxDistance;
	},

	setMaxDistance: function(maxDistance) {
		this._maxDistance = maxDistance;
		if (this._minDistance != null && this._maxDistance != null
				&& this._maxDistance < this._minDistance) {
			this._minDistance = maxDistance;
		}
	},

	getFixedDistance: function() {
		return this._minDistance == this._maxDistance
			? this._minDistance : null;
	},

	setFixedDistance: function(distance) {
		this._minDistance = distance;
		this._maxDistance = distance;
	},

	_updateEvent: function(type, point, minDistance, maxDistance, start,
			needsChange, matchMaxDistance) {
		if (!start) {
			if (minDistance != null || maxDistance != null) {
				var minDist = minDistance != null ? minDistance : 0,
					vector = point.subtract(this._point),
					distance = vector.getLength();
				if (distance < minDist)
					return false;
				var maxDist = maxDistance != null ? maxDistance : 0;
				if (maxDist != 0) {
					if (distance > maxDist) {
						point = this._point.add(vector.normalize(maxDist));
					} else if (matchMaxDistance) {
						return false;
					}
				}
			}
			if (needsChange && point.equals(this._point))
				return false;
		}
		this._lastPoint = start && type == 'mousemove' ? point : this._point;
		this._point = point;
		switch (type) {
		case 'mousedown':
			this._lastPoint = this._downPoint;
			this._downPoint = this._point;
			this._downCount++;
			break;
		case 'mouseup':
			this._lastPoint = this._downPoint;
			break;
		}
		this._count = start ? 0 : this._count + 1;
		return true;
	},

	_fireEvent: function(type, event) {
		var sets = paper.project._removeSets;
		if (sets) {
			if (type === 'mouseup')
				sets.mousedrag = null;
			var set = sets[type];
			if (set) {
				for (var id in set) {
					var item = set[id];
					for (var key in sets) {
						var other = sets[key];
						if (other && other != set)
							delete other[item._id];
					}
					item.remove();
				}
				sets[type] = null;
			}
		}
		return this.responds(type)
				&& this.fire(type, new ToolEvent(this, type, event));
	},

	_handleEvent: function(type, point, event) {
		paper = this._scope;
		var called = false;
		switch (type) {
		case 'mousedown':
			this._updateEvent(type, point, null, null, true, false, false);
			called = this._fireEvent(type, event);
			break;
		case 'mousedrag':
			var needsChange = false,
				matchMaxDistance = false;
			while (this._updateEvent(type, point, this.minDistance,
					this.maxDistance, false, needsChange, matchMaxDistance)) {
				called = this._fireEvent(type, event) || called;
				needsChange = true;
				matchMaxDistance = true;
			}
			break;
		case 'mouseup':
			if (!point.equals(this._point)
					&& this._updateEvent('mousedrag', point, this.minDistance,
							this.maxDistance, false, false, false)) {
				called = this._fireEvent('mousedrag', event);
			}
			this._updateEvent(type, point, null, this.maxDistance, false,
					false, false);
			called = this._fireEvent(type, event) || called;
			this._updateEvent(type, point, null, null, true, false, false);
			this._firstMove = true;
			break;
		case 'mousemove':
			while (this._updateEvent(type, point, this.minDistance,
					this.maxDistance, this._firstMove, true, false)) {
				called = this._fireEvent(type, event) || called;
				this._firstMove = false;
			}
			break;
		}
		if (called)
			event.preventDefault();
		return called;
	}

});

var Http = {
	request: function(method, url, callback) {
		var xhr = new (window.ActiveXObject || XMLHttpRequest)(
					'Microsoft.XMLHTTP');
		xhr.open(method.toUpperCase(), url, true);
		if ('overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain');
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var status = xhr.status;
				if (status === 0 || status === 200) {
					callback.call(xhr, xhr.responseText);
				} else {
					throw new Error('Could not load ' + url + ' (Error '
							+ status + ')');
				}
			}
		};
		return xhr.send(null);
	}
};

var CanvasProvider = {
	canvases: [],

	getCanvas: function(width, height, pixelRatio) {
		var canvas,
			init = true;
		if (typeof width === 'object') {
			pixelRatio = height;
			height = width.height;
			width = width.width;
		}
		if (!pixelRatio) {
			pixelRatio = 1;
		} else if (pixelRatio !== 1) {
			width *= pixelRatio;
			height *= pixelRatio;
		}
		if (this.canvases.length) {
			canvas = this.canvases.pop();
		} else {
			canvas = document.createElement('canvas');
		}
		var ctx = canvas.getContext('2d');
		if (canvas.width === width && canvas.height === height) {
			if (init)
				ctx.clearRect(0, 0, width + 1, height + 1);
		} else {
			canvas.width = width;
			canvas.height = height;
		}
		ctx.save();
		if (pixelRatio !== 1)
			ctx.scale(pixelRatio, pixelRatio);
		return canvas;
	},

	getContext: function(width, height) {
		return this.getCanvas(width, height).getContext('2d');
	},

	release: function(obj) {
		var canvas = obj.canvas ? obj.canvas : obj;
		canvas.getContext('2d').restore();
		this.canvases.push(canvas);
	}
};

var BlendMode = new function() {
	var min = Math.min,
		max = Math.max,
		abs = Math.abs,
		sr, sg, sb, sa, 
		br, bg, bb, ba, 
		dr, dg, db;     

	function getLum(r, g, b) {
		return 0.2989 * r + 0.587 * g + 0.114 * b;
	}

	function setLum(r, g, b, l) {
		var d = l - getLum(r, g, b);
		dr = r + d;
		dg = g + d;
		db = b + d;
		var l = getLum(dr, dg, db),
			mn = min(dr, dg, db),
			mx = max(dr, dg, db);
		if (mn < 0) {
			var lmn = l - mn;
			dr = l + (dr - l) * l / lmn;
			dg = l + (dg - l) * l / lmn;
			db = l + (db - l) * l / lmn;
		}
		if (mx > 255) {
			var ln = 255 - l,
				mxl = mx - l;
			dr = l + (dr - l) * ln / mxl;
			dg = l + (dg - l) * ln / mxl;
			db = l + (db - l) * ln / mxl;
		}
	}

	function getSat(r, g, b) {
		return max(r, g, b) - min(r, g, b);
	}

	function setSat(r, g, b, s) {
		var col = [r, g, b],
			mx = max(r, g, b), 
			mn = min(r, g, b), 
			md; 
		mn = mn === r ? 0 : mn === g ? 1 : 2;
		mx = mx === r ? 0 : mx === g ? 1 : 2;
		md = min(mn, mx) === 0 ? max(mn, mx) === 1 ? 2 : 1 : 0;
		if (col[mx] > col[mn]) {
			col[md] = (col[md] - col[mn]) * s / (col[mx] - col[mn]);
			col[mx] = s;
		} else {
			col[md] = col[mx] = 0;
		}
		col[mn] = 0;
		dr = col[0];
		dg = col[1];
		db = col[2];
	}

	var modes = {
		multiply: function() {
			dr = br * sr / 255;
			dg = bg * sg / 255;
			db = bb * sb / 255;
		},

		screen: function() {
			dr = br + sr - (br * sr / 255);
			dg = bg + sg - (bg * sg / 255);
			db = bb + sb - (bb * sb / 255);
		},

		overlay: function() {
			dr = br < 128 ? 2 * br * sr / 255 : 255 - 2 * (255 - br) * (255 - sr) / 255;
			dg = bg < 128 ? 2 * bg * sg / 255 : 255 - 2 * (255 - bg) * (255 - sg) / 255;
			db = bb < 128 ? 2 * bb * sb / 255 : 255 - 2 * (255 - bb) * (255 - sb) / 255;
		},

		'soft-light': function() {
			var t = sr * br / 255;
			dr = t + br * (255 - (255 - br) * (255 - sr) / 255 - t) / 255;
			t = sg * bg / 255;
			dg = t + bg * (255 - (255 - bg) * (255 - sg) / 255 - t) / 255;
			t = sb * bb / 255;
			db = t + bb * (255 - (255 - bb) * (255 - sb) / 255 - t) / 255;
		},

		'hard-light': function() {
			dr = sr < 128 ? 2 * sr * br / 255 : 255 - 2 * (255 - sr) * (255 - br) / 255;
			dg = sg < 128 ? 2 * sg * bg / 255 : 255 - 2 * (255 - sg) * (255 - bg) / 255;
			db = sb < 128 ? 2 * sb * bb / 255 : 255 - 2 * (255 - sb) * (255 - bb) / 255;
		},

		'color-dodge': function() {
			dr = br === 0 ? 0 : sr === 255 ? 255 : min(255, 255 * br / (255 - sr));
			dg = bg === 0 ? 0 : sg === 255 ? 255 : min(255, 255 * bg / (255 - sg));
			db = bb === 0 ? 0 : sb === 255 ? 255 : min(255, 255 * bb / (255 - sb));
		},

		'color-burn': function() {
			dr = br === 255 ? 255 : sr === 0 ? 0 : max(0, 255 - (255 - br) * 255 / sr);
			dg = bg === 255 ? 255 : sg === 0 ? 0 : max(0, 255 - (255 - bg) * 255 / sg);
			db = bb === 255 ? 255 : sb === 0 ? 0 : max(0, 255 - (255 - bb) * 255 / sb);
		},

		darken: function() {
			dr = br < sr ? br : sr;
			dg = bg < sg ? bg : sg;
			db = bb < sb ? bb : sb;
		},

		lighten: function() {
			dr = br > sr ? br : sr;
			dg = bg > sg ? bg : sg;
			db = bb > sb ? bb : sb;
		},

		difference: function() {
			dr = br - sr;
			if (dr < 0)
				dr = -dr;
			dg = bg - sg;
			if (dg < 0)
				dg = -dg;
			db = bb - sb;
			if (db < 0)
				db = -db;
		},

		exclusion: function() {
			dr = br + sr * (255 - br - br) / 255;
			dg = bg + sg * (255 - bg - bg) / 255;
			db = bb + sb * (255 - bb - bb) / 255;
		},

		hue: function() {
			setSat(sr, sg, sb, getSat(br, bg, bb));
			setLum(dr, dg, db, getLum(br, bg, bb));
		},

		saturation: function() {
			setSat(br, bg, bb, getSat(sr, sg, sb));
			setLum(dr, dg, db, getLum(br, bg, bb));
		},

		luminosity: function() {
			setLum(br, bg, bb, getLum(sr, sg, sb));
		},

		color: function() {
			setLum(sr, sg, sb, getLum(br, bg, bb));
		},

		add: function() {
			dr = min(br + sr, 255);
			dg = min(bg + sg, 255);
			db = min(bb + sb, 255);
		},

		subtract: function() {
			dr = max(br - sr, 0);
			dg = max(bg - sg, 0);
			db = max(bb - sb, 0);
		},

		average: function() {
			dr = (br + sr) / 2;
			dg = (bg + sg) / 2;
			db = (bb + sb) / 2;
		},

		negation: function() {
			dr = 255 - abs(255 - sr - br);
			dg = 255 - abs(255 - sg - bg);
			db = 255 - abs(255 - sb - bb);
		}
	};

	var nativeModes = this.nativeModes = Base.each([
		'source-over', 'source-in', 'source-out', 'source-atop',
		'destination-over', 'destination-in', 'destination-out',
		'destination-atop', 'lighter', 'darker', 'copy', 'xor'
	], function(mode) {
		this[mode] = true;
	}, {});

	var ctx = CanvasProvider.getContext(1, 1);
	Base.each(modes, function(func, mode) {
		ctx.save();
		var darken = mode === 'darken',
			ok = false;
		ctx.fillStyle = darken ? '#300' : '#a00';
		ctx.fillRect(0, 0, 1, 1);
		ctx.globalCompositeOperation = mode;
		if (ctx.globalCompositeOperation === mode) {
			ctx.fillStyle = darken ? '#a00' : '#300';
			ctx.fillRect(0, 0, 1, 1);
			ok = ctx.getImageData(0, 0, 1, 1).data[0] !== (darken ? 170 : 51);
		}
		nativeModes[mode] = ok; 
		ctx.restore();
	});
	CanvasProvider.release(ctx);

	this.process = function(mode, srcContext, dstContext, alpha, offset) {
		var srcCanvas = srcContext.canvas,
			normal = mode === 'normal';
		if (normal || nativeModes[mode]) {
			dstContext.save();
			dstContext.setTransform(1, 0, 0, 1, 0, 0);
			dstContext.globalAlpha = alpha;
			if (!normal)
				dstContext.globalCompositeOperation = mode;
			dstContext.drawImage(srcCanvas, offset.x, offset.y);
			dstContext.restore();	
		} else {
			var process = modes[mode];
			if (!process)
				return;
			var dstData = dstContext.getImageData(offset.x, offset.y,
					srcCanvas.width, srcCanvas.height),
				dst  = dstData.data,
				src  = srcContext.getImageData(0, 0,
					srcCanvas.width, srcCanvas.height).data;
			for (var i = 0, l = dst.length; i < l; i += 4) {
				sr = src[i];
				br = dst[i];
				sg = src[i + 1];
				bg = dst[i + 1];
				sb = src[i + 2];
				bb = dst[i + 2];
				sa = src[i + 3];
				ba = dst[i + 3];
				process();
				var a1 = sa * alpha / 255,
					a2 = 1 - a1;
				dst[i] = a1 * dr + a2 * br;
				dst[i + 1] = a1 * dg + a2 * bg;
				dst[i + 2] = a1 * db + a2 * bb;
				dst[i + 3] = sa * alpha + a2 * ba;
			}
			dstContext.putImageData(dstData, offset.x, offset.y);
		}
	};
};

var SVGStyles = Base.each({
	fillColor: ['fill', 'color'],
	strokeColor: ['stroke', 'color'],
	strokeWidth: ['stroke-width', 'number'],
	strokeCap: ['stroke-linecap', 'string'],
	strokeJoin: ['stroke-linejoin', 'string'],
	miterLimit: ['stroke-miterlimit', 'number'],
	dashArray: ['stroke-dasharray', 'array'],
	dashOffset: ['stroke-dashoffset', 'number'],
	fontFamily: ['font-family', 'string'],
	fontWeight: ['font-weight', 'string'],
	fontSize: ['font-size', 'number'],
	justification: ['text-anchor', 'lookup', {
		left: 'start',
		center: 'middle',
		right: 'end'
	}],
	opacity: ['opacity', 'number'],
	blendMode: ['mix-blend-mode', 'string']
}, function(entry, key) {
	var part = Base.capitalize(key),
		lookup = entry[2];
	this[key] = {
		type: entry[1],
		property: key,
		attribute: entry[0],
		toSVG: lookup,
		fromSVG: lookup && Base.each(lookup, function(value, name) {
			this[value] = name;
		}, {}),
		get: 'get' + part,
		set: 'set' + part
	};
}, {});

var SVGNamespaces = {
	href: 'http://www.w3.org/1999/xlink',
	xlink: 'http://www.w3.org/2000/xmlns'
};

new function() {
	var formatter;

	function setAttributes(node, attrs) {
		for (var key in attrs) {
			var val = attrs[key],
				namespace = SVGNamespaces[key];
			if (typeof val === 'number')
				val = formatter.number(val);
			if (namespace) {
				node.setAttributeNS(namespace, key, val);
			} else {
				node.setAttribute(key, val);
			}
		}
		return node;
	}

	function createElement(tag, attrs) {
		return setAttributes(
			document.createElementNS('http://www.w3.org/2000/svg', tag), attrs);
	}

	function getTransform(item, coordinates, center) {
		var matrix = item._matrix,
			trans = matrix.getTranslation(),
			attrs = {};
		if (coordinates) {
			matrix = matrix.shiftless();
			var point = matrix._inverseTransform(trans);
			attrs[center ? 'cx' : 'x'] = point.x;
			attrs[center ? 'cy' : 'y'] = point.y;
			trans = null;
		}
		if (!matrix.isIdentity()) {
			var decomposed = matrix.decompose();
			if (decomposed && !decomposed.shearing) {
				var parts = [],
					angle = decomposed.rotation,
					scale = decomposed.scaling;
				if (trans && !trans.isZero())
					parts.push('translate(' + formatter.point(trans) + ')');
				if (angle)
					parts.push('rotate(' + formatter.number(angle) + ')');
				if (!Numerical.isZero(scale.x - 1)
						|| !Numerical.isZero(scale.y - 1))
					parts.push('scale(' + formatter.point(scale) +')');
				attrs.transform = parts.join(' ');
			} else {
				attrs.transform = 'matrix(' + matrix.getValues().join(',') + ')';
			}
		}
		return attrs;
	}

	function exportGroup(item, options) {
		var attrs = getTransform(item),
			children = item._children;
		var node = createElement('g', attrs);
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i];
			var childNode = exportSVG(child, options);
			if (childNode) {
				if (child.isClipMask()) {
					var clip = createElement('clipPath');
					clip.appendChild(childNode);
					setDefinition(child, clip, 'clip');
					setAttributes(node, {
						'clip-path': 'url(#' + clip.id + ')'
					});
				} else {
					node.appendChild(childNode);
				}
			}
		}
		return node;
	}

	function exportRaster(item) {
		var attrs = getTransform(item, true),
			size = item.getSize();
		attrs.x -= size.width / 2;
		attrs.y -= size.height / 2;
		attrs.width = size.width;
		attrs.height = size.height;
		attrs.href = item.toDataURL();
		return createElement('image', attrs);
	}

	function exportPath(item, options) {
		if (options.matchShapes) {
			var shape = item.toShape(false);
			if (shape)
				return exportShape(shape, options);
		}
		var segments = item._segments,
			type,
			attrs;
		if (segments.length === 0)
			return null;
		if (item.isPolygon()) {
			if (segments.length >= 3) {
				type = item._closed ? 'polygon' : 'polyline';
				var parts = [];
				for(i = 0, l = segments.length; i < l; i++)
					parts.push(formatter.point(segments[i]._point));
				attrs = {
					points: parts.join(' ')
				};
			} else {
				type = 'line';
				var first = segments[0]._point,
					last = segments[segments.length - 1]._point;
				attrs = {
					x1: first.x,
					y1: first.y,
					x2: last.x,
					y2: last.y
				};
			}
		} else {
			type = 'path';
			var data = item.getPathData();
			attrs = data && { d: data };
		}
		return createElement(type, attrs);
	}

	function exportShape(item) {
		var shape = item._shape,
			radius = item._radius,
			attrs = getTransform(item, true, shape !== 'rectangle');
		if (shape === 'rectangle') {
			shape = 'rect'; 
			var size = item._size,
				width = size.width,
				height = size.height;
			attrs.x -= width / 2;
			attrs.y -= height / 2;
			attrs.width = width;
			attrs.height = height;
			if (radius.isZero())
				radius = null;
		}
		if (radius) {
			if (shape === 'circle') {
				attrs.r = radius;
			} else {
				attrs.rx = radius.width;
				attrs.ry = radius.height;
			}
		}
		return createElement(shape, attrs);
	}

	function exportCompoundPath(item) {
		var attrs = getTransform(item, true);
		var data = item.getPathData();
		if (data)
			attrs.d = data;
		return createElement('path', attrs);
	}

	function exportPlacedSymbol(item, options) {
		var attrs = getTransform(item, true),
			symbol = item.getSymbol(),
			symbolNode = getDefinition(symbol, 'symbol'),
			definition = symbol.getDefinition(),
			bounds = definition.getBounds();
		if (!symbolNode) {
			symbolNode = createElement('symbol', {
				viewBox: formatter.rectangle(bounds)
			});
			symbolNode.appendChild(exportSVG(definition, options));
			setDefinition(symbol, symbolNode, 'symbol');
		}
		attrs.href = '#' + symbolNode.id;
		attrs.x += bounds.x;
		attrs.y += bounds.y;
		attrs.width = formatter.number(bounds.width);
		attrs.height = formatter.number(bounds.height);
		return createElement('use', attrs);
	}

	function exportGradient(color) {
		var gradientNode = getDefinition(color, 'color');
		if (!gradientNode) {
			var gradient = color.getGradient(),
				radial = gradient._radial,
				origin = color.getOrigin().transform(),
				destination = color.getDestination().transform(),
				attrs;
			if (radial) {
				attrs = {
					cx: origin.x,
					cy: origin.y,
					r: origin.getDistance(destination)
				};
				var highlight = color.getHighlight();
				if (highlight) {
					highlight = highlight.transform();
					attrs.fx = highlight.x;
					attrs.fy = highlight.y;
				}
			} else {
				attrs = {
					x1: origin.x,
					y1: origin.y,
					x2: destination.x,
					y2: destination.y
				};
			}
			attrs.gradientUnits = 'userSpaceOnUse';
			gradientNode = createElement(
					(radial ? 'radial' : 'linear') + 'Gradient', attrs);
			var stops = gradient._stops;
			for (var i = 0, l = stops.length; i < l; i++) {
				var stop = stops[i],
					stopColor = stop._color,
					alpha = stopColor.getAlpha();
				attrs = {
					offset: stop._rampPoint,
					'stop-color': stopColor.toCSS(true)
				};
				if (alpha < 1)
					attrs['stop-opacity'] = alpha;
				gradientNode.appendChild(createElement('stop', attrs));
			}
			setDefinition(color, gradientNode, 'color');
		}
		return 'url(#' + gradientNode.id + ')';
	}

	function exportText(item) {
		var node = createElement('text', getTransform(item, true));
		node.textContent = item._content;
		return node;
	}

	var exporters = {
		group: exportGroup,
		layer: exportGroup,
		raster: exportRaster,
		path: exportPath,
		shape: exportShape,
		'compound-path': exportCompoundPath,
		'placed-symbol': exportPlacedSymbol,
		'point-text': exportText
	};

	function applyStyle(item, node) {
		var attrs = {},
			parent = item.getParent();

		if (item._name != null)
			attrs.id = item._name;

		Base.each(SVGStyles, function(entry) {
			var get = entry.get,
				type = entry.type,
				value = item[get]();
			if (!parent || !Base.equals(parent[get](), value)) {
				if (type === 'color' && value != null) {
					var alpha = value.getAlpha();
					if (alpha < 1)
						attrs[entry.attribute + '-opacity'] = alpha;
				}
				attrs[entry.attribute] = value == null
					? 'none'
					: type === 'number'
						? formatter.number(value)
						: type === 'color'
							? value.gradient
								? exportGradient(value, item)
								: value.toCSS(true)
							: type === 'array'
								? value.join(',')
								: type === 'lookup'
									? entry.toSVG[value]
									: value;
			}
		});

		if (attrs.opacity === 1)
			delete attrs.opacity;

		if (item._visibility != null && !item._visibility)
			attrs.visibility = 'hidden';

		return setAttributes(node, attrs);
	}

	var definitions;
	function getDefinition(item, type) {
		if (!definitions)
			definitions = { ids: {}, svgs: {} };
		return item && definitions.svgs[type + '-' + item._id];
	}

	function setDefinition(item, node, type) {
		if (!definitions)
			getDefinition();
		var id = definitions.ids[type] = (definitions.ids[type] || 0) + 1;
		node.id = type + '-' + id;
		definitions.svgs[type + '-' + item._id] = node;
	}

	function exportDefinitions(node, options) {
		var svg = node,
			defs = null;
		if (definitions) {
			svg = node.nodeName.toLowerCase() === 'svg' && node;
			for (var i in definitions.svgs) {
				if (!defs) {
					if (!svg) {
						svg = createElement('svg');
						svg.appendChild(node);
					}
					defs = svg.insertBefore(createElement('defs'),
							svg.firstChild);
				}
				defs.appendChild(definitions.svgs[i]);
			}
			definitions = null;
		}
		return options.asString
				? new XMLSerializer().serializeToString(svg)
				: svg;
	}

	function exportSVG(item, options) {
		var exporter = exporters[item._type],
			node = exporter && exporter(item, options);
		if (node && item._data)
			node.setAttribute('data-paper-data', JSON.stringify(item._data));
		return node && applyStyle(item, node);
	}

	function setOptions(options) {
		if (!options)
			options = {};
		formatter = new Formatter(options.precision);
		return options;
	}

	Item.inject({
		exportSVG: function(options) {
			options = setOptions(options);
			return exportDefinitions(exportSVG(this, options), options);
		}
	});

	Project.inject({
		exportSVG: function(options) {
			options = setOptions(options);
			var layers = this.layers,
				size = this.view.getSize(),
				node = createElement('svg', {
					x: 0,
					y: 0,
					width: size.width,
					height: size.height,
					version: '1.1',
					xmlns: 'http://www.w3.org/2000/svg',
					'xmlns:xlink': 'http://www.w3.org/1999/xlink'
				});
			for (var i = 0, l = layers.length; i < l; i++)
				node.appendChild(exportSVG(layers[i], options));
			return exportDefinitions(node, options);
		}
	});
};

new function() {

	function getValue(node, name, isString, allowNull) {
		var namespace = SVGNamespaces[name],
			value = namespace
				? node.getAttributeNS(namespace, name)
				: node.getAttribute(name);
		if (value === 'null')
			value = null;
		return value == null
				? allowNull
					? null
					: isString
						? ''
						: 0
				: isString
					? value
					: parseFloat(value);
	}

	function getPoint(node, x, y, allowNull) {
		x = getValue(node, x, false, allowNull);
		y = getValue(node, y, false, allowNull);
		return allowNull && (x == null || y == null) ? null
				: new Point(x, y);
	}

	function getSize(node, w, h, allowNull) {
		w = getValue(node, w, false, allowNull);
		h = getValue(node, h, false, allowNull);
		return allowNull && (w == null || h == null) ? null
				: new Size(w, h);
	}

	function convertValue(value, type, lookup) {
		return value === 'none'
				? null
				: type === 'number'
					? parseFloat(value)
					: type === 'array'
						? value ? value.split(/[\s,]+/g).map(parseFloat) : []
						: type === 'color'
							? getDefinition(value) || value
							: type === 'lookup'
								? lookup[value]
								: value;
	}

	function importGroup(node, type, isRoot, options) {
		var nodes = node.childNodes,
			isClip = type === 'clippath',
			item = new Group(),
			project = item._project,
			currentStyle = project._currentStyle,
			children = [];
		if (!isClip) {
			item._applyMatrix = false;
			item = applyAttributes(item, node, isRoot);
			project._currentStyle = item._style.clone();
		}
		for (var i = 0, l = nodes.length; i < l; i++) {
			var childNode = nodes[i],
				child;
			if (childNode.nodeType === 1
					&& (child = importSVG(childNode, false, options))
					&& !(child instanceof Symbol))
				children.push(child);
		}
		item.addChildren(children);
		if (isClip)
			item = applyAttributes(item.reduce(), node, isRoot);
		project._currentStyle = currentStyle;
		if (isClip || type === 'defs') {
			item.remove();
			item = null;
		}
		return item;
	}

	function importPoly(node, type) {
		var coords = node.getAttribute('points').match(
					/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g),
			points = [];
		for (var i = 0, l = coords.length; i < l; i += 2)
			points.push(new Point(
					parseFloat(coords[i]),
					parseFloat(coords[i + 1])));
		var path = new Path(points);
		if (type === 'polygon')
			path.closePath();
		return path;
	}

	function importPath(node) {
		var data = node.getAttribute('d'),
			param = { pathData: data };
		return data.match(/m/gi).length > 1 || /z\S+/i.test(data)
				? new CompoundPath(param)
				: new Path(param);
	}

	function importGradient(node, type) {
		var nodes = node.childNodes,
			stops = [];
		for (var i = 0, l = nodes.length; i < l; i++) {
			var child = nodes[i];
			if (child.nodeType === 1)
				stops.push(applyAttributes(new GradientStop(), child));
		}
		var isRadial = type === 'radialgradient',
			gradient = new Gradient(stops, isRadial),
			origin, destination, highlight;
		if (isRadial) {
			origin = getPoint(node, 'cx', 'cy');
			destination = origin.add(getValue(node, 'r'), 0);
			highlight = getPoint(node, 'fx', 'fy', true);
		} else {
			origin = getPoint(node, 'x1', 'y1');
			destination = getPoint(node, 'x2', 'y2');
		}
		applyAttributes(
			new Color(gradient, origin, destination, highlight), node);
		return null;
	}

	var importers = {
		'#document': function (node, type, isRoot, options) {
			var nodes = node.childNodes;
			for (var i = 0, l = nodes.length; i < l; i++) {
				var child = nodes[i];
				if (child.nodeType === 1) {
					var next = child.nextSibling;
					document.body.appendChild(child);
					var item = importSVG(child, isRoot, options);
					if (next) {
						node.insertBefore(child, next);
					} else {
						node.appendChild(child);
					}
					return item;
				}
			}
		},
		g: importGroup,
		svg: importGroup,
		clippath: importGroup,
		polygon: importPoly,
		polyline: importPoly,
		path: importPath,
		lineargradient: importGradient,
		radialgradient: importGradient,

		image: function (node) {
			var raster = new Raster(getValue(node, 'href', true));
			raster.attach('load', function() {
				var size = getSize(node, 'width', 'height');
				this.setSize(size);
				var center = this._matrix._transformPoint(
						getPoint(node, 'x', 'y').add(size.divide(2)));
				this.translate(center);
			});
			return raster;
		},

		symbol: function(node, type, isRoot, options) {
			return new Symbol(importGroup(node, type, isRoot, options), true);
		},

		defs: importGroup,

		use: function(node) {
			var id = (getValue(node, 'href', true) || '').substring(1),
				definition = definitions[id],
				point = getPoint(node, 'x', 'y');
			return definition
					? definition instanceof Symbol
						? definition.place(point)
						: definition.clone().translate(point)
					: null;
		},

		circle: function(node) {
			return new Shape.Circle(getPoint(node, 'cx', 'cy'),
					getValue(node, 'r'));
		},

		ellipse: function(node) {
			return new Shape.Ellipse({
				center: getPoint(node, 'cx', 'cy'),
				radius: getSize(node, 'rx', 'ry')
			});
		},

		rect: function(node) {
			var point = getPoint(node, 'x', 'y'),
				size = getSize(node, 'width', 'height'),
				radius = getSize(node, 'rx', 'ry');
			return new Shape.Rectangle(new Rectangle(point, size), radius);
		},

		line: function(node) {
			return new Path.Line(getPoint(node, 'x1', 'y1'),
					getPoint(node, 'x2', 'y2'));
		},

		text: function(node) {
			var text = new PointText(getPoint(node, 'x', 'y')
					.add(getPoint(node, 'dx', 'dy')));
			text.setContent(node.textContent.trim() || '');
			return text;
		}
	};

	function applyTransform(item, value, name, node) {
		var transforms = (node.getAttribute(name) || '').split(/\)\s*/g),
			matrix = new Matrix();
		for (var i = 0, l = transforms.length; i < l; i++) {
			var transform = transforms[i];
			if (!transform)
				break;
			var parts = transform.split('('),
				command = parts[0],
				v = parts[1].split(/[\s,]+/g);
			for (var j = 0, m = v.length; j < m; j++)
				v[j] = parseFloat(v[j]);
			switch (command) {
			case 'matrix':
				matrix.concatenate(
						new Matrix(v[0], v[1], v[2], v[3], v[4], v[5]));
				break;
			case 'rotate':
				matrix.rotate(v[0], v[1], v[2]);
				break;
			case 'translate':
				matrix.translate(v[0], v[1]);
				break;
			case 'scale':
				matrix.scale(v);
				break;
			case 'skewX':
				matrix.skew(v[0], 0);
				break;
			case 'skewY':
				matrix.skew(0, v[0]);
				break;
			}
		}
		item.transform(matrix);
	}

	function applyOpacity(item, value, name) {
		var color = item[name === 'fill-opacity' ? 'getFillColor'
				: 'getStrokeColor']();
		if (color)
			color.setAlpha(parseFloat(value));
	}

	var attributes = Base.each(SVGStyles, function(entry) {
		this[entry.attribute] = function(item, value) {
			item[entry.set](convertValue(value, entry.type, entry.fromSVG));
			if (entry.type === 'color' && item instanceof Shape) {
				var color = item[entry.get]();
				if (color)
					color.transform(new Matrix().translate(
							item.getPosition(true).negate()));
			}
		};
	}, {
		id: function(item, value) {
			definitions[value] = item;
			if (item.setName)
				item.setName(value);
		},

		'clip-path': function(item, value) {
			var clip = getDefinition(value);
			if (clip) {
				clip = clip.clone();
				clip.setClipMask(true);
				if (item instanceof Group) {
					item.insertChild(0, clip);
				} else {
					return new Group(clip, item);
				}
			}
		},

		gradientTransform: applyTransform,
		transform: applyTransform,

		'fill-opacity': applyOpacity,
		'stroke-opacity': applyOpacity,

		visibility: function(item, value) {
			item.setVisible(value === 'visible');
		},

		'stop-color': function(item, value) {
			if (item.setColor)
				item.setColor(value);
		},

		'stop-opacity': function(item, value) {
			if (item._color)
				item._color.setAlpha(parseFloat(value));
		},

		offset: function(item, value) {
			var percentage = value.match(/(.*)%$/);
			item.setRampPoint(percentage
					? percentage[1] / 100
					: parseFloat(value));
		},

		viewBox: function(item, value, name, node, styles) {
			var rect = new Rectangle(convertValue(value, 'array')),
				size = getSize(node, 'width', 'height', true);
			if (item instanceof Group) {
				var scale = size ? rect.getSize().divide(size) : 1,
					matrix = new Matrix().translate(rect.getPoint()).scale(scale);
				item.transform(matrix.inverted());
			} else if (item instanceof Symbol) {
				if (size)
					rect.setSize(size);
				var clip = getAttribute(node, 'overflow', styles) != 'visible',
					group = item._definition;
				if (clip && !rect.contains(group.getBounds())) {
					clip = new Shape.Rectangle(rect).transform(group._matrix);
					clip.setClipMask(true);
					group.addChild(clip);
				}
			}
		}
	});

	function getAttribute(node, name, styles) {
		var attr = node.attributes[name],
			value = attr && attr.value;
		if (!value) {
			var style = Base.camelize(name);
			value = node.style[style];
			if (!value && styles.node[style] !== styles.parent[style])
				value = styles.node[style];
		}
		return !value
				? undefined
				: value === 'none'
					? null
					: value;
	}

	function applyAttributes(item, node, isRoot) {
		var styles = {
			node: DomElement.getStyles(node) || {},
			parent: !isRoot && DomElement.getStyles(node.parentNode) || {}
		};
		Base.each(attributes, function(apply, name) {
			var value = getAttribute(node, name, styles);
			if (value !== undefined)
				item = Base.pick(apply(item, value, name, node, styles), item);
		});
		return item;
	}

	var definitions = {};
	function getDefinition(value) {
		var match = value && value.match(/\((?:#|)([^)']+)/);
		return match && definitions[match[1]];
	}

	function importSVG(source, isRoot, options) {
		if (!source)
			return null;
		if (!options) {
			options = {};
		} else if (typeof options === 'function') {
			options = { onLoad: options };
		}

		var node = source,
			scope = paper;

		function onLoadCallback(svg) {
			paper = scope;
			var item = importSVG(svg, isRoot, options),
				onLoad = options.onLoad,
				view = scope.project && scope.project.view;
			if (onLoad)
				onLoad.call(this, item);
			view.update();
		}

		if (isRoot) {
			if (typeof source === 'string' && !/^.*3){n.sort(function(e,r){return r.length-e.length}),t+="switch(str.length){";for(var a=0;a<n.length;++a){var i="n[a];t+="case" "+i[0].length+":",r(i)}t+="}" }else r(e);return new function("str",t)}function a(){this.line="Ar,this.column=br-Sr}function" o(){ar="1,br=Sr=0,Er=!0,u()}function" i(e,r){gr="br,fr.locations&&(kr=new" a),wr="e,u(),Cr=r,Er=e.beforeExpr}function" s(){var e="fr.onComment&&fr.locations&&new" a,r="br,n=pr.indexOf("*/",br+=2);if(-1===n&&t(br-2,"Unterminated" comment"),br="n+2,fr.locations){Kt.lastIndex=r;for(var" o;(o="Kt.exec(pr))&&o.index<br;)++Ar,Sr=o.index+o[0].length}fr.onComment&&fr.onComment(!0,pr.slice(r+2,n),r,br,e,fr.locations&&new" a)}function c(){for(var a,t="pr.charCodeAt(br+=2);dr">br&&10!==t&&13!==t&&8232!==t&&8329!==t;)++br,t=pr.charCodeAt(br);fr.onComment&&fr.onComment(!1,pr.slice(e+2,br),e,br,r,fr.locations&&new a)}function u(){for(;dr>br;){var e=pr.charCodeAt(br);if(32===e)++br;else if(13===e){++br;var r=pr.charCodeAt(br);10===r&&++br,fr.locations&&(++Ar,Sr=br)}else if(10===e)++br,++Ar,Sr=br;else if(14>e&&e>8)++br;else if(47===e){var r=pr.charCodeAt(br+1);if(42===r)s();else{if(47!==r)break;c()}}else if(160===e)++br;else{if(!(e>=5760&&Jt.test(String.fromCharCode(e))))break;++br}}}function l(){var e=pr.charCodeAt(br+1);return e>=48&&57>=e?E(!0):(++br,i(xt))}function f(){var e=pr.charCodeAt(br+1);return Er?(++br,k()):61===e?x(Et,2):x(wt,1)}function p(){var e=pr.charCodeAt(br+1);return 61===e?x(Et,2):x(Ft,1)}function d(e){var r=pr.charCodeAt(br+1);return r===e?x(124===e?Lt:Ut,2):61===r?x(Et,2):x(124===e?Rt:Vt,1)}function m(){var e=pr.charCodeAt(br+1);return 61===e?x(Et,2):x(Tt,1)}function h(e){var r=pr.charCodeAt(br+1);return r===e?x(St,2):61===r?x(Et,2):x(At,1)}function v(e){var r=pr.charCodeAt(br+1),t=1;return r===e?(t=62===e&&62===pr.charCodeAt(br+2)?3:2,61===pr.charCodeAt(br+t)?x(Et,t+1):x(jt,t)):(61===r&&(t=61===pr.charCodeAt(br+2)?3:2),x(Ot,t))}function b(e){var r=pr.charCodeAt(br+1);return 61===r?x(qt,61===pr.charCodeAt(br+2)?3:2):x(61===e?Ct:It,1)}function y(e){switch(e){case 46:return l();case 40:return++br,i(ht);case 41:return++br,i(vt);case 59:return++br,i(yt);case 44:return++br,i(bt);case 91:return++br,i(ft);case 93:return++br,i(pt);case 123:return++br,i(dt);case 125:return++br,i(mt);case 58:return++br,i(gt);case 63:return++br,i(kt);case 48:var r=pr.charCodeAt(br+1);if(120===r||88===r)return C();case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:return E(!1);case 34:case 39:return A(e);case 47:return f(e);case 37:case 42:return p();case 124:case 38:return d(e);case 94:return m();case 43:case 45:return h(e);case 60:case 62:return v(e);case 61:case 33:return b(e);case 126:return x(It,1)}return!1}function g(e){if(e?br=yr+1:yr=br,fr.locations&&(xr=new a),e)return k();if(br>=dr)return i(Br);var r=pr.charCodeAt(br);if(Qt(r)||92===r)return L();var n=y(r);if(n===!1){var o=String.fromCharCode(r);if("\\"===o||$t.test(o))return L();t(br,"Unexpected character '"+o+"'")}return n}function x(e,r){var t=pr.slice(br,br+r);br+=r,i(e,t)}function k(){for(var e,r,n="",a=br;;){br>=dr&&t(a,"Unterminated regular expression");var o=pr.charAt(br);if(Gt.test(o)&&t(a,"Unterminated regular expression"),e)e=!1;else{if("["===o)r=!0;else if("]"===o&&r)r=!1;else if("/"===o&&!r)break;e="\\"===o}++br}var n=pr.slice(a,br);++br;var s=I();return s&&!/^[gmsiy]*$/.test(s)&&t(a,"Invalid regexp flag"),i(jr,new RegExp(n,s))}function w(e,r){for(var t=br,n=0,a=0,o=null==r?1/0:r;o>a;++a){var i,s=pr.charCodeAt(br);if(i=s>=97?s-97+10:s>=65?s-65+10:s>=48&&57>=s?s-48:1/0,i>=e)break;++br,n=n*e+i}return br===t||null!=r&&br-t!==r?null:n}function C(){br+=2;var e=w(16);return null==e&&t(yr+2,"Expected hexadecimal number"),Qt(pr.charCodeAt(br))&&t(br,"Identifier directly after number"),i(Or,e)}function E(e){var r=br,n=!1,a=48===pr.charCodeAt(br);e||null!==w(10)||t(r,"Invalid number"),46===pr.charCodeAt(br)&&(++br,w(10),n=!0);var o=pr.charCodeAt(br);(69===o||101===o)&&(o=pr.charCodeAt(++br),(43===o||45===o)&&++br,null===w(10)&&t(r,"Invalid number"),n=!0),Qt(pr.charCodeAt(br))&&t(br,"Identifier directly after number");var s,c=pr.slice(r,br);return n?s=parseFloat(c):a&&1!==c.length?/[89]/.test(c)||Vr?t(r,"Invalid number"):s=parseInt(c,8):s=parseInt(c,10),i(Or,s)}function A(e){br++;for(var r="";;){br>=dr&&t(yr,"Unterminated string constant");var n=pr.charCodeAt(br);if(n===e)return++br,i(Fr,r);if(92===n){n=pr.charCodeAt(++br);var a=/^[0-7]+/.exec(pr.slice(br,br+3));for(a&&(a=a[0]);a&&parseInt(a,8)>255;)a=a.slice(0,a.length-1);if("0"===a&&(a=null),++br,a)Vr&&t(br-2,"Octal literal in strict mode"),r+=String.fromCharCode(parseInt(a,8)),br+=a.length-1;else switch(n){case 110:r+="\n";break;case 114:r+="\r";break;case 120:r+=String.fromCharCode(S(2));break;case 117:r+=String.fromCharCode(S(4));break;case 85:r+=String.fromCharCode(S(8));break;case 116:r+="	";break;case 98:r+="\b";break;case 118:r+="";break;case 102:r+="\f";break;case 48:r+="\0";break;case 13:10===pr.charCodeAt(br)&&++br;case 10:fr.locations&&(Sr=br,++Ar);break;default:r+=String.fromCharCode(n)}}else(13===n||10===n||8232===n||8329===n)&&t(yr,"Unterminated string constant"),r+=String.fromCharCode(n),++br}}function S(e){var r=w(16,e);return null===r&&t(yr,"Bad character escape sequence"),r}function I(){Bt=!1;for(var e,r=!0,n=br;;){var a=pr.charCodeAt(br);if(Yt(a))Bt&&(e+=pr.charAt(br)),++br;else{if(92!==a)break;Bt||(e=pr.slice(n,br)),Bt=!0,117!=pr.charCodeAt(++br)&&t(br,"Expecting Unicode escape sequence \\uXXXX"),++br;var o=S(4),i=String.fromCharCode(o);i||t(br-1,"Invalid Unicode escape"),(r?Qt(o):Yt(o))||t(br-4,"Invalid Unicode escape"),e+=i}r=!1}return Bt?e:pr.slice(n,br)}function L(){var e=I(),r=Dr;return Bt||(Wt(e)?r=lt[e]:(fr.forbidReserved&&(3===fr.ecmaVersion?Mt:zt)(e)||Vr&&Xt(e))&&t(yr,"The keyword '"+e+"' is reserved")),i(r,e)}function U(){Ir=yr,Lr=gr,Ur=kr,g()}function R(e){for(Vr=e,br=Lr;Sr>br;)Sr=pr.lastIndexOf("\n",Sr-2)+1,--Ar;u(),g()}function T(){this.type=null,this.start=yr,this.end=null}function V(){this.start=xr,this.end=null,null!==mr&&(this.source=mr)}function q(){var e=new T;return fr.locations&&(e.loc=new V),fr.ranges&&(e.range=[yr,0]),e}function O(e){var r=new T;return r.start=e.start,fr.locations&&(r.loc=new V,r.loc.start=e.loc.start),fr.ranges&&(r.range=[e.range[0],0]),r}function j(e,r){return e.type=r,e.end=Lr,fr.locations&&(e.loc.end=Ur),fr.ranges&&(e.range[1]=Lr),e}function F(e){return fr.ecmaVersion>=5&&"ExpressionStatement"===e.type&&"Literal"===e.expression.type&&"use strict"===e.expression.value}function D(e){return wr===e?(U(),!0):void 0}function B(){return!fr.strictSemicolons&&(wr===Br||wr===mt||Gt.test(pr.slice(Lr,yr)))}function M(){D(yt)||B()||X()}function z(e){wr===e?U():X()}function X(){t(yr,"Unexpected token")}function N(e){"Identifier"!==e.type&&"MemberExpression"!==e.type&&t(e.start,"Assigning to rvalue"),Vr&&"Identifier"===e.type&&Nt(e.name)&&t(e.start,"Assigning to "+e.name+" in strict mode")}function W(e){Ir=Lr=br,fr.locations&&(Ur=new a),Rr=Vr=null,Tr=[],g();var r=e||q(),t=!0;for(e||(r.body=[]);wr!==Br;){var n=J();r.body.push(n),t&&F(n)&&R(!0),t=!1}return j(r,"Program")}function J(){wr===wt&&g(!0);var e=wr,r=q();switch(e){case Mr:case Nr:U();var n=e===Mr;D(yt)||B()?r.label=null:wr!==Dr?X():(r.label=lr(),M());for(var a=0;a<tr.length;++a){var o="Tr[a];if(null==r.label||o.name===r.label.name){if(null!=o.kind&&(n||"loop"===o.kind))break;if(r.label&&n)break}}return" a="==Tr.length&&t(r.start,"Unsyntactic" "+e.keyword),j(r,n?"breakstatement":"continuestatement");case wr:return u(),m(),j(r,"debuggerstatement");case pr:return u(),tr.push(zt),r.body="J(),Tr.pop(),z(tt),r.test=P(),M(),j(r,"DoWhileStatement");case" _r:if(u(),tr.push(zt),z(ht),wr="==yt)return" $(r,null);if(wr="==rt){var" i="q();return" u(),g(i,!0),1="==i.declarations.length&&D(ut)?_(r,i):$(r,i)}var" d(ut)?(n(i),_(r,i)):$(r,i);case gr:return u(),cr(r,!0);case kr:return u(),r.test="P(),r.consequent=J(),r.alternate=D(Hr)?J():null,j(r,"IfStatement");case" qr:return rr||t(yr,"'return' outside of function"),u(),d(yt)||b()?r.argument="null:(r.argument=K(),M()),j(r,"ReturnStatement");case" yr:u(),r.discriminant="P(),r.cases=[],z(dt),Tr.push(en);for(var" s,c;wr!="mt;)if(wr===zr||wr===Jr){var" u="wr===zr;s&&j(s,"SwitchCase"),r.cases.push(s=q()),s.consequent=[],U(),u?s.test=K():(c&&t(Ir,"Multiple" default clauses"),c="!0,s.test=null),z(gt)}else" s||x(),s.consequent.push(j());return s&&j(s,"switchcase"),u(),tr.pop(),j(r,"switchstatement");case zr:return u(),gt.test(pr.slice(lr,yr))&&t(lr,"illegal newline after throw"),r.argument="K(),M(),j(r,"ThrowStatement");case" et:if(u(),r.block="H(),r.handler=null,wr===Xr){var" l="q();U(),z(ht),l.param=lr(),Vr&&Nt(l.param.name)&&t(l.param.start,"Binding" "+l.param.name+" in strict mode"),z(vt),l.guard="null,l.body=H(),r.handler=j(l,"CatchClause")}return" r.guardedhandlers="qr,r.finalizer=D($r)?H():null,r.handler||r.finalizer||t(r.start,"Missing" catch or finally clause"),j(r,"trystatement");case rt:return u(),r="G(r),M(),r;case" tt:return nt:return vr&&t(yr,"'with' mode"),u(),r.object="P(),r.body=J(),j(r,"WithStatement");case" dt:return h();case yt:return u(),j(r,"emptystatement");default:var f="Cr,p=K();if(e===Dr&&"Identifier"===p.type&&D(gt)){for(var" '"+f+"' is already declared");var d="wr.isLoop?"loop":wr===Yr?"switch":null;return" tr.push({name:f,kind:d}),r.body="J(),Tr.pop(),r.label=p,j(r,"LabeledStatement")}return" r.expression="p,M(),j(r,"ExpressionStatement")}}function" p(){z(ht);var e="K();return" z(vt),e}function h(e){var r,t="q(),n=!0,a=!1;for(t.body=[],z(dt);!D(mt);){var" a&&!r&&r(!1),j(t,"blockstatement")}function $(e,r){return e.init="r,z(yt),e.test=wr===yt?null:K(),z(yt),e.update=wr===vt?null:K(),z(vt),e.body=J(),Tr.pop(),j(e,"ForStatement")}function" _(e,r){return e.left="r,e.right=K(),z(vt),e.body=J(),Tr.pop(),j(e,"ForInStatement")}function" g(e,r){for(e.declarations="[],e.kind="var";;){var" n="q();if(n.id=lr(),Vr&&Nt(n.id.name)&&t(n.id.start,"Binding" "+n.id.name+" mode"),n.init="D(Ct)?K(!0,r):null,e.declarations.push(j(n,"VariableDeclarator")),!D(bt))break}return" j(e,"variabledeclaration")}function k(e,r){var t="Q(r);if(!e&&wr===bt){var" j(n,"sequenceexpression")}return t}function q(e){var r="Y(e);if(wr.isAssign){var" t.operator="Cr,t.left=r,U(),t.right=Q(e),N(r),j(t,"AssignmentExpression")}return" r}function y(e){var t.test="r,t.consequent=K(!0),z(gt),t.alternate=K(!0,e),j(t,"ConditionalExpression")}return" z(e){return er(rr(),-1,e)}function er(e,r,t){var>r){var a=O(e);a.left=e,a.operator=Cr,U(),a.right=er(rr(),n,t);var a=j(a,/&&|\|\|/.test(a.operator)?"LogicalExpression":"BinaryExpression");return er(a,r,t)}return e}function rr(){if(wr.prefix){var e=q(),r=wr.isUpdate;return e.operator=Cr,e.prefix=!0,U(),e.argument=rr(),r?N(e.argument):Vr&&"delete"===e.operator&&"Identifier"===e.argument.type&&t(e.start,"Deleting local variable in strict mode"),j(e,r?"UpdateExpression":"UnaryExpression")}for(var n=tr();wr.postfix&&!B();){var e=O(n);e.operator=Cr,e.prefix=!1,e.argument=n,N(n),U(),n=j(e,"UpdateExpression")}return n}function tr(){return nr(ar())}function nr(e,r){if(D(xt)){var t=O(e);return t.object=e,t.property=lr(!0),t.computed=!1,nr(j(t,"MemberExpression"),r)}if(D(ft)){var t=O(e);return t.object=e,t.property=K(),t.computed=!0,z(pt),nr(j(t,"MemberExpression"),r)}if(!r&&D(ht)){var t=O(e);return t.callee=e,t.arguments=ur(vt,!1),nr(j(t,"CallExpression"),r)}return e}function ar(){switch(wr){case ot:var e=q();return U(),j(e,"ThisExpression");case Dr:return lr();case Or:case Fr:case jr:var e=q();return e.value=Cr,e.raw=pr.slice(yr,gr),U(),j(e,"Literal");case it:case st:case ct:var e=q();return e.value=wr.atomValue,e.raw=wr.keyword,U(),j(e,"Literal");case ht:var r=xr,t=yr;U();var n=K();return n.start=t,n.end=gr,fr.locations&&(n.loc.start=r,n.loc.end=kr),fr.ranges&&(n.range=[t,gr]),z(vt),n;case ft:var e=q();return U(),e.elements=ur(pt,!0,!0),j(e,"ArrayExpression");case dt:return ir();case Gr:var e=q();return U(),cr(e,!1);case at:return or();default:X()}}function or(){var e=q();return U(),e.callee=nr(ar(),!0),e.arguments=D(ht)?ur(vt,!1):qr,j(e,"NewExpression")}function ir(){var e=q(),r=!0,n=!1;for(e.properties=[],U();!D(mt);){if(r)r=!1;else if(z(bt),fr.allowTrailingCommas&&D(mt))break;var a,o={key:sr()},i=!1;if(D(gt)?(o.value=K(!0),a=o.kind="init"):fr.ecmaVersion>=5&&"Identifier"===o.key.type&&("get"===o.key.name||"set"===o.key.name)?(i=n=!0,a=o.kind=o.key.name,o.key=sr(),wr!==ht&&X(),o.value=cr(q(),!1)):X(),"Identifier"===o.key.type&&(Vr||n))for(var s=0;s<e.properties.length;++s){var c="e.properties[s];if(c.key.name===o.key.name){var" u="a==c.kind||i&&"init"===c.kind||"init"===a&&("get"===c.kind||"set"===c.kind);u&&!Vr&&"init"===a&&"init"===c.kind&&(u=!1),u&&t(o.key.start,"Redefinition" of property")}}e.properties.push(o)}return j(e,"objectexpression")}function sr(){return wr="==Or||wr===Fr?ar():lr(!0)}function" cr(e,r){wr="==Dr?e.id=lr():r?X():e.id=null,e.params=[];var" n="!0;for(z(ht);!D(vt);)n?n=!1:z(bt),e.params.push(lr());var" a="Rr,o=Tr;if(Rr=!0,Tr=[],e.body=H(!0),Rr=a,Tr=o,Vr||e.body.body.length&&F(e.body.body[0]))for(var" i="e.id?-1:0;i<e.params.length;++i){var" s="0">i?e.id:e.params[i];if((Xt(s.name)||Nt(s.name))&&t(s.start,"Defining '"+s.name+"' in strict mode"),i>=0)for(var c=0;i>c;++c)s.name===e.params[c].name&&t(s.start,"Argument name clash in strict mode")}return j(e,r?"FunctionDeclaration":"FunctionExpression")}function ur(e,r,t){for(var n=[],a=!0;!D(e);){if(a)a=!1;else if(z(bt),r&&fr.allowTrailingCommas&&D(e))break;t&&wr===bt?n.push(null):n.push(K(!0))}return n}function lr(e){var r=q();return r.name=wr===Dr?Cr:e&&!fr.forbidReserved&&wr.keyword||X(),U(),j(r,"Identifier")}e.version="0.3.2";var fr,pr,dr,mr;e.parse=function(e,t){return pr=String(e),dr=pr.length,r(t),o(),W(fr.program)};var hr=e.defaultOptions={ecmaVersion:5,strictSemicolons:!1,allowTrailingCommas:!0,forbidReserved:!1,locations:!1,onComment:null,ranges:!1,program:null,sourceFile:null},vr=e.getLineInfo=function(e,r){for(var t=1,n=0;;){Kt.lastIndex=n;var a=Kt.exec(e);if(!(a&&a.index<r))break;++t,n=a.index+a[0].length}return{line:t,column:r-n}};e.tokenize=function(e,t){function 65 n(e){return g(e),a.start="yr,a.end=gr,a.startLoc=xr,a.endLoc=kr,a.type=wr,a.value=Cr,a}pr=String(e),dr=pr.length,r(t),o();var" a="{};return" n.jumpto="function(e,r){if(br=e,fr.locations){Ar=1,Sr=Kt.lastIndex=0;for(var" t;(t="Kt.exec(pr))&&t.index<e;)++Ar,Sr=t.index+t[0].length}Er=r,u()},n};var" br,yr,gr,xr,kr,wr,cr,er,ar,sr,ir,lr,ur,rr,tr,vr,qr="[],Or={type:"num"},jr={type:"regexp"},Fr={type:"string"},Dr={type:"name"},Br={type:"eof"},Mr={keyword:"break"},zr={keyword:"case",beforeExpr:!0},Xr={keyword:"catch"},Nr={keyword:"continue"},Wr={keyword:"debugger"},Jr={keyword:"default"},Pr={keyword:"do",isLoop:!0},Hr={keyword:"else",beforeExpr:!0},$r={keyword:"finally"},_r={keyword:"for",isLoop:!0},Gr={keyword:"function"},Kr={keyword:"if"},Qr={keyword:"return",beforeExpr:!0},Yr={keyword:"switch"},Zr={keyword:"throw",beforeExpr:!0},et={keyword:"try"},rt={keyword:"var"},tt={keyword:"while",isLoop:!0},nt={keyword:"with"},at={keyword:"new",beforeExpr:!0},ot={keyword:"this"},it={keyword:"null",atomValue:null},st={keyword:"true",atomValue:!0},ct={keyword:"false",atomValue:!1},ut={keyword:"in",binop:7,beforeExpr:!0},lt={"break":Mr,"case":zr,"catch":Xr,"continue":Nr,"debugger":Wr,"default":Jr,"do":Pr,"else":Hr,"finally":$r,"for":_r,"function":Gr,"if":Kr,"return":Qr,"switch":Yr,"throw":Zr,"try":et,"var":rt,"while":tt,"with":nt,"null":it,"true":st,"false":ct,"new":at,"in":ut,"instanceof":{keyword:"instanceof",binop:7,beforeExpr:!0},"this":ot,"typeof":{keyword:"typeof",prefix:!0,beforeExpr:!0},"void":{keyword:"void",prefix:!0,beforeExpr:!0},"delete":{keyword:"delete",prefix:!0,beforeExpr:!0}},ft={type:"[",beforeExpr:!0},pt={type:"]"},dt={type:"{",beforeExpr:!0},mt={type:"}"},ht={type:"(",beforeExpr:!0},vt={type:")"},bt={type:",",beforeExpr:!0},yt={type:";",beforeExpr:!0},gt={type:":",beforeExpr:!0},xt={type:"."},kt={type:"?",beforeExpr:!0},wt={binop:10,beforeExpr:!0},Ct={isAssign:!0,beforeExpr:!0},Et={isAssign:!0,beforeExpr:!0},At={binop:9,prefix:!0,beforeExpr:!0},St={postfix:!0,prefix:!0,isUpdate:!0},It={prefix:!0,beforeExpr:!0},Lt={binop:1,beforeExpr:!0},Ut={binop:2,beforeExpr:!0},Rt={binop:3,beforeExpr:!0},Tt={binop:4,beforeExpr:!0},Vt={binop:5,beforeExpr:!0},qt={binop:6,beforeExpr:!0},Ot={binop:7,beforeExpr:!0},jt={binop:8,beforeExpr:!0},Ft={binop:10,beforeExpr:!0};e.tokTypes={bracketL:ft,bracketR:pt,braceL:dt,braceR:mt,parenL:ht,parenR:vt,comma:bt,semi:yt,colon:gt,dot:xt,question:kt,slash:wt,eq:Ct,name:Dr,eof:Br,num:Or,regexp:jr,string:Fr};for(var" dt in lt)e.toktypes["_"+dt]="lt[Dt];var" bt,mt="n("abstract" boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile"),zt="n("class" const import"),xt="n("implements" let yield"),nt="n("eval" arguments"),wt="n("break" case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new this"),jt="/[\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/,Pt="\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc",Ht="\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f",$t=new" regexp("["+pt+"]"),_t="new" regexp("["+pt+ht+"]"),gt="/[\n\r\u2028\u2029]/,Kt=/\r\n|[\n\r\u2028\u2029]/g,Qt=e.isIdentifierStart=function(e){return">e?36===e:91>e?!0:97>e?95===e:123>e?!0:e>=170&&$t.test(String.fromCharCode(e))},Yt=e.isIdentifierChar=function(e){return 48>e?36===e:58>e?!0:65>e?!1:91>e?!0:97>e?95===e:123>e?!0:e>=170&&_t.test(String.fromCharCode(e))},Zt={kind:"loop"},en={kind:"switch"}});

	var binaryOperators = {
		'+': '__add',
		'-': '__subtract',
		'*': '__multiply',
		'/': '__divide',
		'%': '__modulo',
		'==': 'equals',
		'!=': 'equals'
	};

	var unaryOperators = {
		'-': '__negate',
		'+': null
	};

	var fields = Base.each(
		['add', 'subtract', 'multiply', 'divide', 'modulo', 'negate'],
		function(name) {
			this['__' + name] = '#' + name;
		}, 
		{}
	);
	Point.inject(fields);
	Size.inject(fields);
	Color.inject(fields);

	function _$_(left, operator, right) {
		var handler = binaryOperators[operator];
		if (left && left[handler]) {
			var res = left[handler](right);
			return operator === '!=' ? !res : res;
		}
		switch (operator) {
		case '+': return left + right;
		case '-': return left - right;
		case '*': return left * right;
		case '/': return left / right;
		case '%': return left % right;
		case '==': return left == right;
		case '!=': return left != right;
		}
	}

	function $_(operator, value) {
		var handler = unaryOperators[operator];
		if (handler && value && value[handler])
			return value[handler]();
		switch (operator) {
		case '+': return +value;
		case '-': return -value;
		}
	}

	function compile(code) {

		var insertions = [];

		function getOffset(offset) {
			for (var i = 0, l = insertions.length; i < l; i++) {
				var insertion = insertions[i];
				if (insertion[0] >= offset)
					break;
				offset += insertion[1];
			}
			return offset;
		}

		function getCode(node) {
			return code.substring(getOffset(node.range[0]),
					getOffset(node.range[1]));
		}

		function replaceCode(node, str) {
			var start = getOffset(node.range[0]),
				end = getOffset(node.range[1]),
				insert = 0;
			for (var i = insertions.length - 1; i >= 0; i--) {
				if (start > insertions[i][0]) {
					insert = i + 1;
					break;
				}
			}
			insertions.splice(insert, 0, [start, str.length - end + start]);
			code = code.substring(0, start) + str + code.substring(end);
		}

		function walkAST(node, parent) {
			if (!node)
				return;
			for (var key in node) {
				if (key === 'range')
					continue;
				var value = node[key];
				if (Array.isArray(value)) {
					for (var i = 0, l = value.length; i < l; i++)
						walkAST(value[i], node);
				} else if (value && typeof value === 'object') {
					walkAST(value, node);
				}
			}
			switch (node && node.type) {
			case 'UnaryExpression': 
				if (node.operator in unaryOperators
						&& node.argument.type !== 'Literal') {
					var arg = getCode(node.argument);
					replaceCode(node, '$_("' + node.operator + '", '
							+ arg + ')');
				}
				break;
			case 'BinaryExpression': 
				if (node.operator in binaryOperators
						&& node.left.type !== 'Literal') {
					var left = getCode(node.left),
						right = getCode(node.right);
					replaceCode(node, '_$_(' + left + ', "' + node.operator
							+ '", ' + right + ')');
				}
				break;
			case 'UpdateExpression': 
			case 'AssignmentExpression': 
				if (!(parent && (
						parent.type === 'ForStatement'
						|| parent.type === 'BinaryExpression'
							&& /^[=!<>]/.test(parent.operator)
						|| parent.type === 'MemberExpression'
							&& parent.computed))) {
					if (node.type === 'UpdateExpression') {
						if (!node.prefix) {
							var arg = getCode(node.argument);
							replaceCode(node, arg + ' = _$_(' + arg + ', "'
									+ node.operator[0] + '", 1)');
						}
					} else { 
						if (/^.=$/.test(node.operator)
								&& node.left.type !== 'Literal') {
							var left = getCode(node.left),
								right = getCode(node.right);
							replaceCode(node, left + ' = _$_(' + left + ', "'
									+ node.operator[0] + '", ' + right + ')');
						}
					}
				}
				break;
			}
		}
		walkAST(scope.acorn.parse(code, { ranges: true }));
		return code;
	}

	function execute(code, scope) {
		paper = scope;
		var view = scope.getView(),
			tool = /\s+on(?:Key|Mouse)(?:Up|Down|Move|Drag)\b/.test(code)
					? new Tool()
					: null,
			toolHandlers = tool ? tool._events : [],
			handlers = ['onFrame', 'onResize'].concat(toolHandlers),
			params = [],
			args = [],
			func;
		code = compile(code);
		function expose(scope, hidden) {
			for (var key in scope) {
				if ((hidden || !/^_/.test(key)) && new RegExp(
						'\\b' + key.replace(/\$/g, '\\$') + '\\b').test(code)) {
					params.push(key);
					args.push(scope[key]);
				}
			}
		}
		expose({ _$_: _$_, $_: $_, view: view, tool: tool }, true);
		expose(scope);
		handlers = Base.each(handlers, function(key) {
			if (new RegExp('\\s+' + key + '\\b').test(code)) {
				params.push(key);
				this.push(key + ': ' + key);
			}
		}, []).join(', ');
		if (handlers)
			code += '\nreturn { ' + handlers + ' };';
		var firefox = window.InstallTrigger;
		if (firefox || window.chrome) {
			var script = document.createElement('script'),
				head = document.head;
			if (firefox)
				code = '\n' + code;
			script.appendChild(document.createTextNode(
				'paper._execute = function(' + params + ') {' + code + '\n}'
			));
			head.appendChild(script);
			func = paper._execute;
			delete paper._execute;
			head.removeChild(script);
		} else {
			func = Function(params, code);
		}
		var res = func.apply(scope, args) || {};
		Base.each(toolHandlers, function(key) {
			var value = res[key];
			if (value)
				tool[key] = value;
		});
		if (view) {
			if (res.onResize)
				view.setOnResize(res.onResize);
			view.fire('resize', {
				size: view.size,
				delta: new Point()
			});
			if (res.onFrame)
				view.setOnFrame(res.onFrame);
			view.update();
		}
	}

	function load() {
		Base.each(document.getElementsByTagName('script'), function(script) {
			if (/^text\/(?:x-|)paperscript$/.test(script.type)
					&& !script.getAttribute('data-paper-ignore')) {
				var canvas = PaperScope.getAttribute(script, 'canvas'),
					scope = PaperScope.get(canvas)
							|| new PaperScope(script).setup(canvas),
					src = script.src;
				if (src) {
					Http.request('get', src, function(code) {
						execute(code, scope);
					});
				} else {
					execute(script.innerHTML, scope);
				}
				script.setAttribute('data-paper-ignore', true);
			}
		}, this);
	}

	if (document.readyState === 'complete') {
		setTimeout(load);
	} else {
		DomEvent.add(window, { load: load });
	}

	return {
		compile: compile,
		execute: execute,
		load: load,
		lineNumberBase: 0
	};

}).call(this);

paper = new (PaperScope.inject(Base.exports, {
	enumerable: true,
	Base: Base,
	Numerical: Numerical,
	DomElement: DomElement,
	DomEvent: DomEvent,
	Http: Http,
	Key: Key
}))();

if (typeof define === 'function' && define.amd)
	define('paper', paper);

return paper;
};
</r))break;++t,n=a.index+a[0].length}return{line:t,column:r-n}};e.tokenize=function(e,t){function></e.properties.length;++s){var></tr.length;++a){var></n.length;++a){var></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=></=>