(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/matter-js/build/matter.js
  var require_matter = __commonJS({
    "node_modules/matter-js/build/matter.js"(exports, module) {
      (function webpackUniversalModuleDefinition(root2, factory) {
        if (typeof exports === "object" && typeof module === "object")
          module.exports = factory();
        else if (typeof define === "function" && define.amd)
          define("Matter", [], factory);
        else if (typeof exports === "object")
          exports["Matter"] = factory();
        else
          root2["Matter"] = factory();
      })(exports, function() {
        return (
          /******/
          (function(modules) {
            var installedModules = {};
            function __webpack_require__(moduleId) {
              if (installedModules[moduleId]) {
                return installedModules[moduleId].exports;
              }
              var module2 = installedModules[moduleId] = {
                /******/
                i: moduleId,
                /******/
                l: false,
                /******/
                exports: {}
                /******/
              };
              modules[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
              module2.l = true;
              return module2.exports;
            }
            __webpack_require__.m = modules;
            __webpack_require__.c = installedModules;
            __webpack_require__.d = function(exports2, name, getter) {
              if (!__webpack_require__.o(exports2, name)) {
                Object.defineProperty(exports2, name, { enumerable: true, get: getter });
              }
            };
            __webpack_require__.r = function(exports2) {
              if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
              }
              Object.defineProperty(exports2, "__esModule", { value: true });
            };
            __webpack_require__.t = function(value, mode) {
              if (mode & 1) value = __webpack_require__(value);
              if (mode & 8) return value;
              if (mode & 4 && typeof value === "object" && value && value.__esModule) return value;
              var ns = /* @__PURE__ */ Object.create(null);
              __webpack_require__.r(ns);
              Object.defineProperty(ns, "default", { enumerable: true, value });
              if (mode & 2 && typeof value != "string") for (var key in value) __webpack_require__.d(ns, key, function(key2) {
                return value[key2];
              }.bind(null, key));
              return ns;
            };
            __webpack_require__.n = function(module2) {
              var getter = module2 && module2.__esModule ? (
                /******/
                function getDefault() {
                  return module2["default"];
                }
              ) : (
                /******/
                function getModuleExports() {
                  return module2;
                }
              );
              __webpack_require__.d(getter, "a", getter);
              return getter;
            };
            __webpack_require__.o = function(object, property) {
              return Object.prototype.hasOwnProperty.call(object, property);
            };
            __webpack_require__.p = "";
            return __webpack_require__(__webpack_require__.s = 20);
          })([
            /* 0 */
            /***/
            (function(module2, exports2) {
              var Common2 = {};
              module2.exports = Common2;
              (function() {
                Common2._baseDelta = 1e3 / 60;
                Common2._nextId = 0;
                Common2._seed = 0;
                Common2._nowStartTime = +/* @__PURE__ */ new Date();
                Common2._warnedOnce = {};
                Common2._decomp = null;
                Common2.extend = function(obj, deep) {
                  var argsStart, args, deepClone;
                  if (typeof deep === "boolean") {
                    argsStart = 2;
                    deepClone = deep;
                  } else {
                    argsStart = 1;
                    deepClone = true;
                  }
                  for (var i = argsStart; i < arguments.length; i++) {
                    var source = arguments[i];
                    if (source) {
                      for (var prop in source) {
                        if (deepClone && source[prop] && source[prop].constructor === Object) {
                          if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            Common2.extend(obj[prop], deepClone, source[prop]);
                          } else {
                            obj[prop] = source[prop];
                          }
                        } else {
                          obj[prop] = source[prop];
                        }
                      }
                    }
                  }
                  return obj;
                };
                Common2.clone = function(obj, deep) {
                  return Common2.extend({}, deep, obj);
                };
                Common2.keys = function(obj) {
                  if (Object.keys)
                    return Object.keys(obj);
                  var keys2 = [];
                  for (var key in obj)
                    keys2.push(key);
                  return keys2;
                };
                Common2.values = function(obj) {
                  var values = [];
                  if (Object.keys) {
                    var keys2 = Object.keys(obj);
                    for (var i = 0; i < keys2.length; i++) {
                      values.push(obj[keys2[i]]);
                    }
                    return values;
                  }
                  for (var key in obj)
                    values.push(obj[key]);
                  return values;
                };
                Common2.get = function(obj, path, begin, end) {
                  path = path.split(".").slice(begin, end);
                  for (var i = 0; i < path.length; i += 1) {
                    obj = obj[path[i]];
                  }
                  return obj;
                };
                Common2.set = function(obj, path, val, begin, end) {
                  var parts = path.split(".").slice(begin, end);
                  Common2.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
                  return val;
                };
                Common2.shuffle = function(array) {
                  for (var i = array.length - 1; i > 0; i--) {
                    var j = Math.floor(Common2.random() * (i + 1));
                    var temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                  }
                  return array;
                };
                Common2.choose = function(choices) {
                  return choices[Math.floor(Common2.random() * choices.length)];
                };
                Common2.isElement = function(obj) {
                  if (typeof HTMLElement !== "undefined") {
                    return obj instanceof HTMLElement;
                  }
                  return !!(obj && obj.nodeType && obj.nodeName);
                };
                Common2.isArray = function(obj) {
                  return Object.prototype.toString.call(obj) === "[object Array]";
                };
                Common2.isFunction = function(obj) {
                  return typeof obj === "function";
                };
                Common2.isPlainObject = function(obj) {
                  return typeof obj === "object" && obj.constructor === Object;
                };
                Common2.isString = function(obj) {
                  return toString.call(obj) === "[object String]";
                };
                Common2.clamp = function(value, min, max) {
                  if (value < min)
                    return min;
                  if (value > max)
                    return max;
                  return value;
                };
                Common2.sign = function(value) {
                  return value < 0 ? -1 : 1;
                };
                Common2.now = function() {
                  if (typeof window !== "undefined" && window.performance) {
                    if (window.performance.now) {
                      return window.performance.now();
                    } else if (window.performance.webkitNow) {
                      return window.performance.webkitNow();
                    }
                  }
                  if (Date.now) {
                    return Date.now();
                  }
                  return /* @__PURE__ */ new Date() - Common2._nowStartTime;
                };
                Common2.random = function(min, max) {
                  min = typeof min !== "undefined" ? min : 0;
                  max = typeof max !== "undefined" ? max : 1;
                  return min + _seededRandom() * (max - min);
                };
                var _seededRandom = function() {
                  Common2._seed = (Common2._seed * 9301 + 49297) % 233280;
                  return Common2._seed / 233280;
                };
                Common2.colorToNumber = function(colorString) {
                  colorString = colorString.replace("#", "");
                  if (colorString.length == 3) {
                    colorString = colorString.charAt(0) + colorString.charAt(0) + colorString.charAt(1) + colorString.charAt(1) + colorString.charAt(2) + colorString.charAt(2);
                  }
                  return parseInt(colorString, 16);
                };
                Common2.logLevel = 1;
                Common2.log = function() {
                  if (console && Common2.logLevel > 0 && Common2.logLevel <= 3) {
                    console.log.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
                  }
                };
                Common2.info = function() {
                  if (console && Common2.logLevel > 0 && Common2.logLevel <= 2) {
                    console.info.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
                  }
                };
                Common2.warn = function() {
                  if (console && Common2.logLevel > 0 && Common2.logLevel <= 3) {
                    console.warn.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
                  }
                };
                Common2.warnOnce = function() {
                  var message = Array.prototype.slice.call(arguments).join(" ");
                  if (!Common2._warnedOnce[message]) {
                    Common2.warn(message);
                    Common2._warnedOnce[message] = true;
                  }
                };
                Common2.deprecated = function(obj, prop, warning) {
                  obj[prop] = Common2.chain(function() {
                    Common2.warnOnce("\u{1F505} deprecated \u{1F505}", warning);
                  }, obj[prop]);
                };
                Common2.nextId = function() {
                  return Common2._nextId++;
                };
                Common2.indexOf = function(haystack, needle) {
                  if (haystack.indexOf)
                    return haystack.indexOf(needle);
                  for (var i = 0; i < haystack.length; i++) {
                    if (haystack[i] === needle)
                      return i;
                  }
                  return -1;
                };
                Common2.map = function(list, func) {
                  if (list.map) {
                    return list.map(func);
                  }
                  var mapped = [];
                  for (var i = 0; i < list.length; i += 1) {
                    mapped.push(func(list[i]));
                  }
                  return mapped;
                };
                Common2.topologicalSort = function(graph) {
                  var result = [], visited = [], temp = [];
                  for (var node in graph) {
                    if (!visited[node] && !temp[node]) {
                      Common2._topologicalSort(node, visited, temp, graph, result);
                    }
                  }
                  return result;
                };
                Common2._topologicalSort = function(node, visited, temp, graph, result) {
                  var neighbors = graph[node] || [];
                  temp[node] = true;
                  for (var i = 0; i < neighbors.length; i += 1) {
                    var neighbor = neighbors[i];
                    if (temp[neighbor]) {
                      continue;
                    }
                    if (!visited[neighbor]) {
                      Common2._topologicalSort(neighbor, visited, temp, graph, result);
                    }
                  }
                  temp[node] = false;
                  visited[node] = true;
                  result.push(node);
                };
                Common2.chain = function() {
                  var funcs = [];
                  for (var i = 0; i < arguments.length; i += 1) {
                    var func = arguments[i];
                    if (func._chained) {
                      funcs.push.apply(funcs, func._chained);
                    } else {
                      funcs.push(func);
                    }
                  }
                  var chain = function() {
                    var lastResult, args = new Array(arguments.length);
                    for (var i2 = 0, l = arguments.length; i2 < l; i2++) {
                      args[i2] = arguments[i2];
                    }
                    for (i2 = 0; i2 < funcs.length; i2 += 1) {
                      var result = funcs[i2].apply(lastResult, args);
                      if (typeof result !== "undefined") {
                        lastResult = result;
                      }
                    }
                    return lastResult;
                  };
                  chain._chained = funcs;
                  return chain;
                };
                Common2.chainPathBefore = function(base2, path, func) {
                  return Common2.set(base2, path, Common2.chain(
                    func,
                    Common2.get(base2, path)
                  ));
                };
                Common2.chainPathAfter = function(base2, path, func) {
                  return Common2.set(base2, path, Common2.chain(
                    Common2.get(base2, path),
                    func
                  ));
                };
                Common2.setDecomp = function(decomp) {
                  Common2._decomp = decomp;
                };
                Common2.getDecomp = function() {
                  var decomp = Common2._decomp;
                  try {
                    if (!decomp && typeof window !== "undefined") {
                      decomp = window.decomp;
                    }
                    if (!decomp && typeof global !== "undefined") {
                      decomp = global.decomp;
                    }
                  } catch (e) {
                    decomp = null;
                  }
                  return decomp;
                };
              })();
            }),
            /* 1 */
            /***/
            (function(module2, exports2) {
              var Bounds2 = {};
              module2.exports = Bounds2;
              (function() {
                Bounds2.create = function(vertices) {
                  var bounds = {
                    min: { x: 0, y: 0 },
                    max: { x: 0, y: 0 }
                  };
                  if (vertices)
                    Bounds2.update(bounds, vertices);
                  return bounds;
                };
                Bounds2.update = function(bounds, vertices, velocity) {
                  bounds.min.x = Infinity;
                  bounds.max.x = -Infinity;
                  bounds.min.y = Infinity;
                  bounds.max.y = -Infinity;
                  for (var i = 0; i < vertices.length; i++) {
                    var vertex = vertices[i];
                    if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
                    if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
                    if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
                    if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
                  }
                  if (velocity) {
                    if (velocity.x > 0) {
                      bounds.max.x += velocity.x;
                    } else {
                      bounds.min.x += velocity.x;
                    }
                    if (velocity.y > 0) {
                      bounds.max.y += velocity.y;
                    } else {
                      bounds.min.y += velocity.y;
                    }
                  }
                };
                Bounds2.contains = function(bounds, point) {
                  return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
                };
                Bounds2.overlaps = function(boundsA, boundsB) {
                  return boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y;
                };
                Bounds2.translate = function(bounds, vector) {
                  bounds.min.x += vector.x;
                  bounds.max.x += vector.x;
                  bounds.min.y += vector.y;
                  bounds.max.y += vector.y;
                };
                Bounds2.shift = function(bounds, position) {
                  var deltaX = bounds.max.x - bounds.min.x, deltaY = bounds.max.y - bounds.min.y;
                  bounds.min.x = position.x;
                  bounds.max.x = position.x + deltaX;
                  bounds.min.y = position.y;
                  bounds.max.y = position.y + deltaY;
                };
              })();
            }),
            /* 2 */
            /***/
            (function(module2, exports2) {
              var Vector2 = {};
              module2.exports = Vector2;
              (function() {
                Vector2.create = function(x, y) {
                  return { x: x || 0, y: y || 0 };
                };
                Vector2.clone = function(vector) {
                  return { x: vector.x, y: vector.y };
                };
                Vector2.magnitude = function(vector) {
                  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
                };
                Vector2.magnitudeSquared = function(vector) {
                  return vector.x * vector.x + vector.y * vector.y;
                };
                Vector2.rotate = function(vector, angle, output) {
                  var cos = Math.cos(angle), sin = Math.sin(angle);
                  if (!output) output = {};
                  var x = vector.x * cos - vector.y * sin;
                  output.y = vector.x * sin + vector.y * cos;
                  output.x = x;
                  return output;
                };
                Vector2.rotateAbout = function(vector, angle, point, output) {
                  var cos = Math.cos(angle), sin = Math.sin(angle);
                  if (!output) output = {};
                  var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
                  output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
                  output.x = x;
                  return output;
                };
                Vector2.normalise = function(vector) {
                  var magnitude = Vector2.magnitude(vector);
                  if (magnitude === 0)
                    return { x: 0, y: 0 };
                  return { x: vector.x / magnitude, y: vector.y / magnitude };
                };
                Vector2.dot = function(vectorA, vectorB) {
                  return vectorA.x * vectorB.x + vectorA.y * vectorB.y;
                };
                Vector2.cross = function(vectorA, vectorB) {
                  return vectorA.x * vectorB.y - vectorA.y * vectorB.x;
                };
                Vector2.cross3 = function(vectorA, vectorB, vectorC) {
                  return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
                };
                Vector2.add = function(vectorA, vectorB, output) {
                  if (!output) output = {};
                  output.x = vectorA.x + vectorB.x;
                  output.y = vectorA.y + vectorB.y;
                  return output;
                };
                Vector2.sub = function(vectorA, vectorB, output) {
                  if (!output) output = {};
                  output.x = vectorA.x - vectorB.x;
                  output.y = vectorA.y - vectorB.y;
                  return output;
                };
                Vector2.mult = function(vector, scalar) {
                  return { x: vector.x * scalar, y: vector.y * scalar };
                };
                Vector2.div = function(vector, scalar) {
                  return { x: vector.x / scalar, y: vector.y / scalar };
                };
                Vector2.perp = function(vector, negate) {
                  negate = negate === true ? -1 : 1;
                  return { x: negate * -vector.y, y: negate * vector.x };
                };
                Vector2.neg = function(vector) {
                  return { x: -vector.x, y: -vector.y };
                };
                Vector2.angle = function(vectorA, vectorB) {
                  return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
                };
                Vector2._temp = [
                  Vector2.create(),
                  Vector2.create(),
                  Vector2.create(),
                  Vector2.create(),
                  Vector2.create(),
                  Vector2.create()
                ];
              })();
            }),
            /* 3 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Vertices2 = {};
              module2.exports = Vertices2;
              var Vector2 = __webpack_require__(2);
              var Common2 = __webpack_require__(0);
              (function() {
                Vertices2.create = function(points, body) {
                  var vertices = [];
                  for (var i = 0; i < points.length; i++) {
                    var point = points[i], vertex = {
                      x: point.x,
                      y: point.y,
                      index: i,
                      body,
                      isInternal: false
                    };
                    vertices.push(vertex);
                  }
                  return vertices;
                };
                Vertices2.fromPath = function(path, body) {
                  var pathPattern = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/ig, points = [];
                  path.replace(pathPattern, function(match, x, y) {
                    points.push({ x: parseFloat(x), y: parseFloat(y) });
                  });
                  return Vertices2.create(points, body);
                };
                Vertices2.centre = function(vertices) {
                  var area = Vertices2.area(vertices, true), centre = { x: 0, y: 0 }, cross, temp, j;
                  for (var i = 0; i < vertices.length; i++) {
                    j = (i + 1) % vertices.length;
                    cross = Vector2.cross(vertices[i], vertices[j]);
                    temp = Vector2.mult(Vector2.add(vertices[i], vertices[j]), cross);
                    centre = Vector2.add(centre, temp);
                  }
                  return Vector2.div(centre, 6 * area);
                };
                Vertices2.mean = function(vertices) {
                  var average = { x: 0, y: 0 };
                  for (var i = 0; i < vertices.length; i++) {
                    average.x += vertices[i].x;
                    average.y += vertices[i].y;
                  }
                  return Vector2.div(average, vertices.length);
                };
                Vertices2.area = function(vertices, signed) {
                  var area = 0, j = vertices.length - 1;
                  for (var i = 0; i < vertices.length; i++) {
                    area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
                    j = i;
                  }
                  if (signed)
                    return area / 2;
                  return Math.abs(area) / 2;
                };
                Vertices2.inertia = function(vertices, mass) {
                  var numerator = 0, denominator = 0, v = vertices, cross, j;
                  for (var n = 0; n < v.length; n++) {
                    j = (n + 1) % v.length;
                    cross = Math.abs(Vector2.cross(v[j], v[n]));
                    numerator += cross * (Vector2.dot(v[j], v[j]) + Vector2.dot(v[j], v[n]) + Vector2.dot(v[n], v[n]));
                    denominator += cross;
                  }
                  return mass / 6 * (numerator / denominator);
                };
                Vertices2.translate = function(vertices, vector, scalar) {
                  scalar = typeof scalar !== "undefined" ? scalar : 1;
                  var verticesLength = vertices.length, translateX = vector.x * scalar, translateY = vector.y * scalar, i;
                  for (i = 0; i < verticesLength; i++) {
                    vertices[i].x += translateX;
                    vertices[i].y += translateY;
                  }
                  return vertices;
                };
                Vertices2.rotate = function(vertices, angle, point) {
                  if (angle === 0)
                    return;
                  var cos = Math.cos(angle), sin = Math.sin(angle), pointX = point.x, pointY = point.y, verticesLength = vertices.length, vertex, dx, dy, i;
                  for (i = 0; i < verticesLength; i++) {
                    vertex = vertices[i];
                    dx = vertex.x - pointX;
                    dy = vertex.y - pointY;
                    vertex.x = pointX + (dx * cos - dy * sin);
                    vertex.y = pointY + (dx * sin + dy * cos);
                  }
                  return vertices;
                };
                Vertices2.contains = function(vertices, point) {
                  var pointX = point.x, pointY = point.y, verticesLength = vertices.length, vertex = vertices[verticesLength - 1], nextVertex;
                  for (var i = 0; i < verticesLength; i++) {
                    nextVertex = vertices[i];
                    if ((pointX - vertex.x) * (nextVertex.y - vertex.y) + (pointY - vertex.y) * (vertex.x - nextVertex.x) > 0) {
                      return false;
                    }
                    vertex = nextVertex;
                  }
                  return true;
                };
                Vertices2.scale = function(vertices, scaleX, scaleY, point) {
                  if (scaleX === 1 && scaleY === 1)
                    return vertices;
                  point = point || Vertices2.centre(vertices);
                  var vertex, delta;
                  for (var i = 0; i < vertices.length; i++) {
                    vertex = vertices[i];
                    delta = Vector2.sub(vertex, point);
                    vertices[i].x = point.x + delta.x * scaleX;
                    vertices[i].y = point.y + delta.y * scaleY;
                  }
                  return vertices;
                };
                Vertices2.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
                  if (typeof radius === "number") {
                    radius = [radius];
                  } else {
                    radius = radius || [8];
                  }
                  quality = typeof quality !== "undefined" ? quality : -1;
                  qualityMin = qualityMin || 2;
                  qualityMax = qualityMax || 14;
                  var newVertices = [];
                  for (var i = 0; i < vertices.length; i++) {
                    var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1], vertex = vertices[i], nextVertex = vertices[(i + 1) % vertices.length], currentRadius = radius[i < radius.length ? i : radius.length - 1];
                    if (currentRadius === 0) {
                      newVertices.push(vertex);
                      continue;
                    }
                    var prevNormal = Vector2.normalise({
                      x: vertex.y - prevVertex.y,
                      y: prevVertex.x - vertex.x
                    });
                    var nextNormal = Vector2.normalise({
                      x: nextVertex.y - vertex.y,
                      y: vertex.x - nextVertex.x
                    });
                    var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)), radiusVector = Vector2.mult(Common2.clone(prevNormal), currentRadius), midNormal = Vector2.normalise(Vector2.mult(Vector2.add(prevNormal, nextNormal), 0.5)), scaledVertex = Vector2.sub(vertex, Vector2.mult(midNormal, diagonalRadius));
                    var precision = quality;
                    if (quality === -1) {
                      precision = Math.pow(currentRadius, 0.32) * 1.75;
                    }
                    precision = Common2.clamp(precision, qualityMin, qualityMax);
                    if (precision % 2 === 1)
                      precision += 1;
                    var alpha = Math.acos(Vector2.dot(prevNormal, nextNormal)), theta = alpha / precision;
                    for (var j = 0; j < precision; j++) {
                      newVertices.push(Vector2.add(Vector2.rotate(radiusVector, theta * j), scaledVertex));
                    }
                  }
                  return newVertices;
                };
                Vertices2.clockwiseSort = function(vertices) {
                  var centre = Vertices2.mean(vertices);
                  vertices.sort(function(vertexA, vertexB) {
                    return Vector2.angle(centre, vertexA) - Vector2.angle(centre, vertexB);
                  });
                  return vertices;
                };
                Vertices2.isConvex = function(vertices) {
                  var flag = 0, n = vertices.length, i, j, k, z;
                  if (n < 3)
                    return null;
                  for (i = 0; i < n; i++) {
                    j = (i + 1) % n;
                    k = (i + 2) % n;
                    z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
                    z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);
                    if (z < 0) {
                      flag |= 1;
                    } else if (z > 0) {
                      flag |= 2;
                    }
                    if (flag === 3) {
                      return false;
                    }
                  }
                  if (flag !== 0) {
                    return true;
                  } else {
                    return null;
                  }
                };
                Vertices2.hull = function(vertices) {
                  var upper = [], lower = [], vertex, i;
                  vertices = vertices.slice(0);
                  vertices.sort(function(vertexA, vertexB) {
                    var dx = vertexA.x - vertexB.x;
                    return dx !== 0 ? dx : vertexA.y - vertexB.y;
                  });
                  for (i = 0; i < vertices.length; i += 1) {
                    vertex = vertices[i];
                    while (lower.length >= 2 && Vector2.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
                      lower.pop();
                    }
                    lower.push(vertex);
                  }
                  for (i = vertices.length - 1; i >= 0; i -= 1) {
                    vertex = vertices[i];
                    while (upper.length >= 2 && Vector2.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
                      upper.pop();
                    }
                    upper.push(vertex);
                  }
                  upper.pop();
                  lower.pop();
                  return upper.concat(lower);
                };
              })();
            }),
            /* 4 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Body2 = {};
              module2.exports = Body2;
              var Vertices2 = __webpack_require__(3);
              var Vector2 = __webpack_require__(2);
              var Sleeping = __webpack_require__(7);
              var Common2 = __webpack_require__(0);
              var Bounds2 = __webpack_require__(1);
              var Axes = __webpack_require__(11);
              (function() {
                Body2._timeCorrection = true;
                Body2._inertiaScale = 4;
                Body2._nextCollidingGroupId = 1;
                Body2._nextNonCollidingGroupId = -1;
                Body2._nextCategory = 1;
                Body2._baseDelta = 1e3 / 60;
                Body2.create = function(options) {
                  var defaults = {
                    id: Common2.nextId(),
                    type: "body",
                    label: "Body",
                    parts: [],
                    plugin: {},
                    angle: 0,
                    vertices: Vertices2.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),
                    position: { x: 0, y: 0 },
                    force: { x: 0, y: 0 },
                    torque: 0,
                    positionImpulse: { x: 0, y: 0 },
                    constraintImpulse: { x: 0, y: 0, angle: 0 },
                    totalContacts: 0,
                    speed: 0,
                    angularSpeed: 0,
                    velocity: { x: 0, y: 0 },
                    angularVelocity: 0,
                    isSensor: false,
                    isStatic: false,
                    isSleeping: false,
                    motion: 0,
                    sleepThreshold: 60,
                    density: 1e-3,
                    restitution: 0,
                    friction: 0.1,
                    frictionStatic: 0.5,
                    frictionAir: 0.01,
                    collisionFilter: {
                      category: 1,
                      mask: 4294967295,
                      group: 0
                    },
                    slop: 0.05,
                    timeScale: 1,
                    render: {
                      visible: true,
                      opacity: 1,
                      strokeStyle: null,
                      fillStyle: null,
                      lineWidth: null,
                      sprite: {
                        xScale: 1,
                        yScale: 1,
                        xOffset: 0,
                        yOffset: 0
                      }
                    },
                    events: null,
                    bounds: null,
                    chamfer: null,
                    circleRadius: 0,
                    positionPrev: null,
                    anglePrev: 0,
                    parent: null,
                    axes: null,
                    area: 0,
                    mass: 0,
                    inertia: 0,
                    deltaTime: 1e3 / 60,
                    _original: null
                  };
                  var body = Common2.extend(defaults, options);
                  _initProperties(body, options);
                  return body;
                };
                Body2.nextGroup = function(isNonColliding) {
                  if (isNonColliding)
                    return Body2._nextNonCollidingGroupId--;
                  return Body2._nextCollidingGroupId++;
                };
                Body2.nextCategory = function() {
                  Body2._nextCategory = Body2._nextCategory << 1;
                  return Body2._nextCategory;
                };
                var _initProperties = function(body, options) {
                  options = options || {};
                  Body2.set(body, {
                    bounds: body.bounds || Bounds2.create(body.vertices),
                    positionPrev: body.positionPrev || Vector2.clone(body.position),
                    anglePrev: body.anglePrev || body.angle,
                    vertices: body.vertices,
                    parts: body.parts || [body],
                    isStatic: body.isStatic,
                    isSleeping: body.isSleeping,
                    parent: body.parent || body
                  });
                  Vertices2.rotate(body.vertices, body.angle, body.position);
                  Axes.rotate(body.axes, body.angle);
                  Bounds2.update(body.bounds, body.vertices, body.velocity);
                  Body2.set(body, {
                    axes: options.axes || body.axes,
                    area: options.area || body.area,
                    mass: options.mass || body.mass,
                    inertia: options.inertia || body.inertia
                  });
                  var defaultFillStyle = body.isStatic ? "#14151f" : Common2.choose(["#f19648", "#f5d259", "#f55a3c", "#063e7b", "#ececd1"]), defaultStrokeStyle = body.isStatic ? "#555" : "#ccc", defaultLineWidth = body.isStatic && body.render.fillStyle === null ? 1 : 0;
                  body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
                  body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
                  body.render.lineWidth = body.render.lineWidth || defaultLineWidth;
                  body.render.sprite.xOffset += -(body.bounds.min.x - body.position.x) / (body.bounds.max.x - body.bounds.min.x);
                  body.render.sprite.yOffset += -(body.bounds.min.y - body.position.y) / (body.bounds.max.y - body.bounds.min.y);
                };
                Body2.set = function(body, settings, value) {
                  var property;
                  if (typeof settings === "string") {
                    property = settings;
                    settings = {};
                    settings[property] = value;
                  }
                  for (property in settings) {
                    if (!Object.prototype.hasOwnProperty.call(settings, property))
                      continue;
                    value = settings[property];
                    switch (property) {
                      case "isStatic":
                        Body2.setStatic(body, value);
                        break;
                      case "isSleeping":
                        Sleeping.set(body, value);
                        break;
                      case "mass":
                        Body2.setMass(body, value);
                        break;
                      case "density":
                        Body2.setDensity(body, value);
                        break;
                      case "inertia":
                        Body2.setInertia(body, value);
                        break;
                      case "vertices":
                        Body2.setVertices(body, value);
                        break;
                      case "position":
                        Body2.setPosition(body, value);
                        break;
                      case "angle":
                        Body2.setAngle(body, value);
                        break;
                      case "velocity":
                        Body2.setVelocity(body, value);
                        break;
                      case "angularVelocity":
                        Body2.setAngularVelocity(body, value);
                        break;
                      case "speed":
                        Body2.setSpeed(body, value);
                        break;
                      case "angularSpeed":
                        Body2.setAngularSpeed(body, value);
                        break;
                      case "parts":
                        Body2.setParts(body, value);
                        break;
                      case "centre":
                        Body2.setCentre(body, value);
                        break;
                      default:
                        body[property] = value;
                    }
                  }
                };
                Body2.setStatic = function(body, isStatic) {
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    part.isStatic = isStatic;
                    if (isStatic) {
                      part._original = {
                        restitution: part.restitution,
                        friction: part.friction,
                        mass: part.mass,
                        inertia: part.inertia,
                        density: part.density,
                        inverseMass: part.inverseMass,
                        inverseInertia: part.inverseInertia
                      };
                      part.restitution = 0;
                      part.friction = 1;
                      part.mass = part.inertia = part.density = Infinity;
                      part.inverseMass = part.inverseInertia = 0;
                      part.positionPrev.x = part.position.x;
                      part.positionPrev.y = part.position.y;
                      part.anglePrev = part.angle;
                      part.angularVelocity = 0;
                      part.speed = 0;
                      part.angularSpeed = 0;
                      part.motion = 0;
                    } else if (part._original) {
                      part.restitution = part._original.restitution;
                      part.friction = part._original.friction;
                      part.mass = part._original.mass;
                      part.inertia = part._original.inertia;
                      part.density = part._original.density;
                      part.inverseMass = part._original.inverseMass;
                      part.inverseInertia = part._original.inverseInertia;
                      part._original = null;
                    }
                  }
                };
                Body2.setMass = function(body, mass) {
                  var moment = body.inertia / (body.mass / 6);
                  body.inertia = moment * (mass / 6);
                  body.inverseInertia = 1 / body.inertia;
                  body.mass = mass;
                  body.inverseMass = 1 / body.mass;
                  body.density = body.mass / body.area;
                };
                Body2.setDensity = function(body, density) {
                  Body2.setMass(body, density * body.area);
                  body.density = density;
                };
                Body2.setInertia = function(body, inertia) {
                  body.inertia = inertia;
                  body.inverseInertia = 1 / body.inertia;
                };
                Body2.setVertices = function(body, vertices) {
                  if (vertices[0].body === body) {
                    body.vertices = vertices;
                  } else {
                    body.vertices = Vertices2.create(vertices, body);
                  }
                  body.axes = Axes.fromVertices(body.vertices);
                  body.area = Vertices2.area(body.vertices);
                  Body2.setMass(body, body.density * body.area);
                  var centre = Vertices2.centre(body.vertices);
                  Vertices2.translate(body.vertices, centre, -1);
                  Body2.setInertia(body, Body2._inertiaScale * Vertices2.inertia(body.vertices, body.mass));
                  Vertices2.translate(body.vertices, body.position);
                  Bounds2.update(body.bounds, body.vertices, body.velocity);
                };
                Body2.setParts = function(body, parts, autoHull) {
                  var i;
                  parts = parts.slice(0);
                  body.parts.length = 0;
                  body.parts.push(body);
                  body.parent = body;
                  for (i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    if (part !== body) {
                      part.parent = body;
                      body.parts.push(part);
                    }
                  }
                  if (body.parts.length === 1)
                    return;
                  autoHull = typeof autoHull !== "undefined" ? autoHull : true;
                  if (autoHull) {
                    var vertices = [];
                    for (i = 0; i < parts.length; i++) {
                      vertices = vertices.concat(parts[i].vertices);
                    }
                    Vertices2.clockwiseSort(vertices);
                    var hull = Vertices2.hull(vertices), hullCentre = Vertices2.centre(hull);
                    Body2.setVertices(body, hull);
                    Vertices2.translate(body.vertices, hullCentre);
                  }
                  var total = Body2._totalProperties(body);
                  body.area = total.area;
                  body.parent = body;
                  body.position.x = total.centre.x;
                  body.position.y = total.centre.y;
                  body.positionPrev.x = total.centre.x;
                  body.positionPrev.y = total.centre.y;
                  Body2.setMass(body, total.mass);
                  Body2.setInertia(body, total.inertia);
                  Body2.setPosition(body, total.centre);
                };
                Body2.setCentre = function(body, centre, relative) {
                  if (!relative) {
                    body.positionPrev.x = centre.x - (body.position.x - body.positionPrev.x);
                    body.positionPrev.y = centre.y - (body.position.y - body.positionPrev.y);
                    body.position.x = centre.x;
                    body.position.y = centre.y;
                  } else {
                    body.positionPrev.x += centre.x;
                    body.positionPrev.y += centre.y;
                    body.position.x += centre.x;
                    body.position.y += centre.y;
                  }
                };
                Body2.setPosition = function(body, position, updateVelocity) {
                  var delta = Vector2.sub(position, body.position);
                  if (updateVelocity) {
                    body.positionPrev.x = body.position.x;
                    body.positionPrev.y = body.position.y;
                    body.velocity.x = delta.x;
                    body.velocity.y = delta.y;
                    body.speed = Vector2.magnitude(delta);
                  } else {
                    body.positionPrev.x += delta.x;
                    body.positionPrev.y += delta.y;
                  }
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    part.position.x += delta.x;
                    part.position.y += delta.y;
                    Vertices2.translate(part.vertices, delta);
                    Bounds2.update(part.bounds, part.vertices, body.velocity);
                  }
                };
                Body2.setAngle = function(body, angle, updateVelocity) {
                  var delta = angle - body.angle;
                  if (updateVelocity) {
                    body.anglePrev = body.angle;
                    body.angularVelocity = delta;
                    body.angularSpeed = Math.abs(delta);
                  } else {
                    body.anglePrev += delta;
                  }
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    part.angle += delta;
                    Vertices2.rotate(part.vertices, delta, body.position);
                    Axes.rotate(part.axes, delta);
                    Bounds2.update(part.bounds, part.vertices, body.velocity);
                    if (i > 0) {
                      Vector2.rotateAbout(part.position, delta, body.position, part.position);
                    }
                  }
                };
                Body2.setVelocity = function(body, velocity) {
                  var timeScale = body.deltaTime / Body2._baseDelta;
                  body.positionPrev.x = body.position.x - velocity.x * timeScale;
                  body.positionPrev.y = body.position.y - velocity.y * timeScale;
                  body.velocity.x = (body.position.x - body.positionPrev.x) / timeScale;
                  body.velocity.y = (body.position.y - body.positionPrev.y) / timeScale;
                  body.speed = Vector2.magnitude(body.velocity);
                };
                Body2.getVelocity = function(body) {
                  var timeScale = Body2._baseDelta / body.deltaTime;
                  return {
                    x: (body.position.x - body.positionPrev.x) * timeScale,
                    y: (body.position.y - body.positionPrev.y) * timeScale
                  };
                };
                Body2.getSpeed = function(body) {
                  return Vector2.magnitude(Body2.getVelocity(body));
                };
                Body2.setSpeed = function(body, speed) {
                  Body2.setVelocity(body, Vector2.mult(Vector2.normalise(Body2.getVelocity(body)), speed));
                };
                Body2.setAngularVelocity = function(body, velocity) {
                  var timeScale = body.deltaTime / Body2._baseDelta;
                  body.anglePrev = body.angle - velocity * timeScale;
                  body.angularVelocity = (body.angle - body.anglePrev) / timeScale;
                  body.angularSpeed = Math.abs(body.angularVelocity);
                };
                Body2.getAngularVelocity = function(body) {
                  return (body.angle - body.anglePrev) * Body2._baseDelta / body.deltaTime;
                };
                Body2.getAngularSpeed = function(body) {
                  return Math.abs(Body2.getAngularVelocity(body));
                };
                Body2.setAngularSpeed = function(body, speed) {
                  Body2.setAngularVelocity(body, Common2.sign(Body2.getAngularVelocity(body)) * speed);
                };
                Body2.translate = function(body, translation, updateVelocity) {
                  Body2.setPosition(body, Vector2.add(body.position, translation), updateVelocity);
                };
                Body2.rotate = function(body, rotation, point, updateVelocity) {
                  if (!point) {
                    Body2.setAngle(body, body.angle + rotation, updateVelocity);
                  } else {
                    var cos = Math.cos(rotation), sin = Math.sin(rotation), dx = body.position.x - point.x, dy = body.position.y - point.y;
                    Body2.setPosition(body, {
                      x: point.x + (dx * cos - dy * sin),
                      y: point.y + (dx * sin + dy * cos)
                    }, updateVelocity);
                    Body2.setAngle(body, body.angle + rotation, updateVelocity);
                  }
                };
                Body2.scale = function(body, scaleX, scaleY, point) {
                  var totalArea = 0, totalInertia = 0;
                  point = point || body.position;
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    Vertices2.scale(part.vertices, scaleX, scaleY, point);
                    part.axes = Axes.fromVertices(part.vertices);
                    part.area = Vertices2.area(part.vertices);
                    Body2.setMass(part, body.density * part.area);
                    Vertices2.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
                    Body2.setInertia(part, Body2._inertiaScale * Vertices2.inertia(part.vertices, part.mass));
                    Vertices2.translate(part.vertices, { x: part.position.x, y: part.position.y });
                    if (i > 0) {
                      totalArea += part.area;
                      totalInertia += part.inertia;
                    }
                    part.position.x = point.x + (part.position.x - point.x) * scaleX;
                    part.position.y = point.y + (part.position.y - point.y) * scaleY;
                    Bounds2.update(part.bounds, part.vertices, body.velocity);
                  }
                  if (body.parts.length > 1) {
                    body.area = totalArea;
                    if (!body.isStatic) {
                      Body2.setMass(body, body.density * totalArea);
                      Body2.setInertia(body, totalInertia);
                    }
                  }
                  if (body.circleRadius) {
                    if (scaleX === scaleY) {
                      body.circleRadius *= scaleX;
                    } else {
                      body.circleRadius = null;
                    }
                  }
                };
                Body2.update = function(body, deltaTime) {
                  deltaTime = (typeof deltaTime !== "undefined" ? deltaTime : 1e3 / 60) * body.timeScale;
                  var deltaTimeSquared = deltaTime * deltaTime, correction = Body2._timeCorrection ? deltaTime / (body.deltaTime || deltaTime) : 1;
                  var frictionAir = 1 - body.frictionAir * (deltaTime / Common2._baseDelta), velocityPrevX = (body.position.x - body.positionPrev.x) * correction, velocityPrevY = (body.position.y - body.positionPrev.y) * correction;
                  body.velocity.x = velocityPrevX * frictionAir + body.force.x / body.mass * deltaTimeSquared;
                  body.velocity.y = velocityPrevY * frictionAir + body.force.y / body.mass * deltaTimeSquared;
                  body.positionPrev.x = body.position.x;
                  body.positionPrev.y = body.position.y;
                  body.position.x += body.velocity.x;
                  body.position.y += body.velocity.y;
                  body.deltaTime = deltaTime;
                  body.angularVelocity = (body.angle - body.anglePrev) * frictionAir * correction + body.torque / body.inertia * deltaTimeSquared;
                  body.anglePrev = body.angle;
                  body.angle += body.angularVelocity;
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    Vertices2.translate(part.vertices, body.velocity);
                    if (i > 0) {
                      part.position.x += body.velocity.x;
                      part.position.y += body.velocity.y;
                    }
                    if (body.angularVelocity !== 0) {
                      Vertices2.rotate(part.vertices, body.angularVelocity, body.position);
                      Axes.rotate(part.axes, body.angularVelocity);
                      if (i > 0) {
                        Vector2.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
                      }
                    }
                    Bounds2.update(part.bounds, part.vertices, body.velocity);
                  }
                };
                Body2.updateVelocities = function(body) {
                  var timeScale = Body2._baseDelta / body.deltaTime, bodyVelocity = body.velocity;
                  bodyVelocity.x = (body.position.x - body.positionPrev.x) * timeScale;
                  bodyVelocity.y = (body.position.y - body.positionPrev.y) * timeScale;
                  body.speed = Math.sqrt(bodyVelocity.x * bodyVelocity.x + bodyVelocity.y * bodyVelocity.y);
                  body.angularVelocity = (body.angle - body.anglePrev) * timeScale;
                  body.angularSpeed = Math.abs(body.angularVelocity);
                };
                Body2.applyForce = function(body, position, force) {
                  var offset = { x: position.x - body.position.x, y: position.y - body.position.y };
                  body.force.x += force.x;
                  body.force.y += force.y;
                  body.torque += offset.x * force.y - offset.y * force.x;
                };
                Body2._totalProperties = function(body) {
                  var properties = {
                    mass: 0,
                    area: 0,
                    inertia: 0,
                    centre: { x: 0, y: 0 }
                  };
                  for (var i = body.parts.length === 1 ? 0 : 1; i < body.parts.length; i++) {
                    var part = body.parts[i], mass = part.mass !== Infinity ? part.mass : 1;
                    properties.mass += mass;
                    properties.area += part.area;
                    properties.inertia += part.inertia;
                    properties.centre = Vector2.add(properties.centre, Vector2.mult(part.position, mass));
                  }
                  properties.centre = Vector2.div(properties.centre, properties.mass);
                  return properties;
                };
              })();
            }),
            /* 5 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Events2 = {};
              module2.exports = Events2;
              var Common2 = __webpack_require__(0);
              (function() {
                Events2.on = function(object, eventNames, callback) {
                  var names = eventNames.split(" "), name;
                  for (var i = 0; i < names.length; i++) {
                    name = names[i];
                    object.events = object.events || {};
                    object.events[name] = object.events[name] || [];
                    object.events[name].push(callback);
                  }
                  return callback;
                };
                Events2.off = function(object, eventNames, callback) {
                  if (!eventNames) {
                    object.events = {};
                    return;
                  }
                  if (typeof eventNames === "function") {
                    callback = eventNames;
                    eventNames = Common2.keys(object.events).join(" ");
                  }
                  var names = eventNames.split(" ");
                  for (var i = 0; i < names.length; i++) {
                    var callbacks = object.events[names[i]], newCallbacks = [];
                    if (callback && callbacks) {
                      for (var j = 0; j < callbacks.length; j++) {
                        if (callbacks[j] !== callback)
                          newCallbacks.push(callbacks[j]);
                      }
                    }
                    object.events[names[i]] = newCallbacks;
                  }
                };
                Events2.trigger = function(object, eventNames, event) {
                  var names, name, callbacks, eventClone;
                  var events = object.events;
                  if (events && Common2.keys(events).length > 0) {
                    if (!event)
                      event = {};
                    names = eventNames.split(" ");
                    for (var i = 0; i < names.length; i++) {
                      name = names[i];
                      callbacks = events[name];
                      if (callbacks) {
                        eventClone = Common2.clone(event, false);
                        eventClone.name = name;
                        eventClone.source = object;
                        for (var j = 0; j < callbacks.length; j++) {
                          callbacks[j].apply(object, [eventClone]);
                        }
                      }
                    }
                  }
                };
              })();
            }),
            /* 6 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Composite2 = {};
              module2.exports = Composite2;
              var Events2 = __webpack_require__(5);
              var Common2 = __webpack_require__(0);
              var Bounds2 = __webpack_require__(1);
              var Body2 = __webpack_require__(4);
              (function() {
                Composite2.create = function(options) {
                  return Common2.extend({
                    id: Common2.nextId(),
                    type: "composite",
                    parent: null,
                    isModified: false,
                    bodies: [],
                    constraints: [],
                    composites: [],
                    label: "Composite",
                    plugin: {},
                    cache: {
                      allBodies: null,
                      allConstraints: null,
                      allComposites: null
                    }
                  }, options);
                };
                Composite2.setModified = function(composite, isModified, updateParents, updateChildren) {
                  composite.isModified = isModified;
                  if (isModified && composite.cache) {
                    composite.cache.allBodies = null;
                    composite.cache.allConstraints = null;
                    composite.cache.allComposites = null;
                  }
                  if (updateParents && composite.parent) {
                    Composite2.setModified(composite.parent, isModified, updateParents, updateChildren);
                  }
                  if (updateChildren) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      var childComposite = composite.composites[i];
                      Composite2.setModified(childComposite, isModified, updateParents, updateChildren);
                    }
                  }
                };
                Composite2.add = function(composite, object) {
                  var objects = [].concat(object);
                  Events2.trigger(composite, "beforeAdd", { object });
                  for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    switch (obj.type) {
                      case "body":
                        if (obj.parent !== obj) {
                          Common2.warn("Composite.add: skipped adding a compound body part (you must add its parent instead)");
                          break;
                        }
                        Composite2.addBody(composite, obj);
                        break;
                      case "constraint":
                        Composite2.addConstraint(composite, obj);
                        break;
                      case "composite":
                        Composite2.addComposite(composite, obj);
                        break;
                      case "mouseConstraint":
                        Composite2.addConstraint(composite, obj.constraint);
                        break;
                    }
                  }
                  Events2.trigger(composite, "afterAdd", { object });
                  return composite;
                };
                Composite2.remove = function(composite, object, deep) {
                  var objects = [].concat(object);
                  Events2.trigger(composite, "beforeRemove", { object });
                  for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    switch (obj.type) {
                      case "body":
                        Composite2.removeBody(composite, obj, deep);
                        break;
                      case "constraint":
                        Composite2.removeConstraint(composite, obj, deep);
                        break;
                      case "composite":
                        Composite2.removeComposite(composite, obj, deep);
                        break;
                      case "mouseConstraint":
                        Composite2.removeConstraint(composite, obj.constraint);
                        break;
                    }
                  }
                  Events2.trigger(composite, "afterRemove", { object });
                  return composite;
                };
                Composite2.addComposite = function(compositeA, compositeB) {
                  compositeA.composites.push(compositeB);
                  compositeB.parent = compositeA;
                  Composite2.setModified(compositeA, true, true, false);
                  return compositeA;
                };
                Composite2.removeComposite = function(compositeA, compositeB, deep) {
                  var position = Common2.indexOf(compositeA.composites, compositeB);
                  if (position !== -1) {
                    Composite2.removeCompositeAt(compositeA, position);
                  }
                  if (deep) {
                    for (var i = 0; i < compositeA.composites.length; i++) {
                      Composite2.removeComposite(compositeA.composites[i], compositeB, true);
                    }
                  }
                  return compositeA;
                };
                Composite2.removeCompositeAt = function(composite, position) {
                  composite.composites.splice(position, 1);
                  Composite2.setModified(composite, true, true, false);
                  return composite;
                };
                Composite2.addBody = function(composite, body) {
                  composite.bodies.push(body);
                  Composite2.setModified(composite, true, true, false);
                  return composite;
                };
                Composite2.removeBody = function(composite, body, deep) {
                  var position = Common2.indexOf(composite.bodies, body);
                  if (position !== -1) {
                    Composite2.removeBodyAt(composite, position);
                  }
                  if (deep) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      Composite2.removeBody(composite.composites[i], body, true);
                    }
                  }
                  return composite;
                };
                Composite2.removeBodyAt = function(composite, position) {
                  composite.bodies.splice(position, 1);
                  Composite2.setModified(composite, true, true, false);
                  return composite;
                };
                Composite2.addConstraint = function(composite, constraint) {
                  composite.constraints.push(constraint);
                  Composite2.setModified(composite, true, true, false);
                  return composite;
                };
                Composite2.removeConstraint = function(composite, constraint, deep) {
                  var position = Common2.indexOf(composite.constraints, constraint);
                  if (position !== -1) {
                    Composite2.removeConstraintAt(composite, position);
                  }
                  if (deep) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      Composite2.removeConstraint(composite.composites[i], constraint, true);
                    }
                  }
                  return composite;
                };
                Composite2.removeConstraintAt = function(composite, position) {
                  composite.constraints.splice(position, 1);
                  Composite2.setModified(composite, true, true, false);
                  return composite;
                };
                Composite2.clear = function(composite, keepStatic, deep) {
                  if (deep) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      Composite2.clear(composite.composites[i], keepStatic, true);
                    }
                  }
                  if (keepStatic) {
                    composite.bodies = composite.bodies.filter(function(body) {
                      return body.isStatic;
                    });
                  } else {
                    composite.bodies.length = 0;
                  }
                  composite.constraints.length = 0;
                  composite.composites.length = 0;
                  Composite2.setModified(composite, true, true, false);
                  return composite;
                };
                Composite2.allBodies = function(composite) {
                  if (composite.cache && composite.cache.allBodies) {
                    return composite.cache.allBodies;
                  }
                  var bodies = [].concat(composite.bodies);
                  for (var i = 0; i < composite.composites.length; i++)
                    bodies = bodies.concat(Composite2.allBodies(composite.composites[i]));
                  if (composite.cache) {
                    composite.cache.allBodies = bodies;
                  }
                  return bodies;
                };
                Composite2.allConstraints = function(composite) {
                  if (composite.cache && composite.cache.allConstraints) {
                    return composite.cache.allConstraints;
                  }
                  var constraints = [].concat(composite.constraints);
                  for (var i = 0; i < composite.composites.length; i++)
                    constraints = constraints.concat(Composite2.allConstraints(composite.composites[i]));
                  if (composite.cache) {
                    composite.cache.allConstraints = constraints;
                  }
                  return constraints;
                };
                Composite2.allComposites = function(composite) {
                  if (composite.cache && composite.cache.allComposites) {
                    return composite.cache.allComposites;
                  }
                  var composites = [].concat(composite.composites);
                  for (var i = 0; i < composite.composites.length; i++)
                    composites = composites.concat(Composite2.allComposites(composite.composites[i]));
                  if (composite.cache) {
                    composite.cache.allComposites = composites;
                  }
                  return composites;
                };
                Composite2.get = function(composite, id, type) {
                  var objects, object;
                  switch (type) {
                    case "body":
                      objects = Composite2.allBodies(composite);
                      break;
                    case "constraint":
                      objects = Composite2.allConstraints(composite);
                      break;
                    case "composite":
                      objects = Composite2.allComposites(composite).concat(composite);
                      break;
                  }
                  if (!objects)
                    return null;
                  object = objects.filter(function(object2) {
                    return object2.id.toString() === id.toString();
                  });
                  return object.length === 0 ? null : object[0];
                };
                Composite2.move = function(compositeA, objects, compositeB) {
                  Composite2.remove(compositeA, objects);
                  Composite2.add(compositeB, objects);
                  return compositeA;
                };
                Composite2.rebase = function(composite) {
                  var objects = Composite2.allBodies(composite).concat(Composite2.allConstraints(composite)).concat(Composite2.allComposites(composite));
                  for (var i = 0; i < objects.length; i++) {
                    objects[i].id = Common2.nextId();
                  }
                  return composite;
                };
                Composite2.translate = function(composite, translation, recursive) {
                  var bodies = recursive ? Composite2.allBodies(composite) : composite.bodies;
                  for (var i = 0; i < bodies.length; i++) {
                    Body2.translate(bodies[i], translation);
                  }
                  return composite;
                };
                Composite2.rotate = function(composite, rotation, point, recursive) {
                  var cos = Math.cos(rotation), sin = Math.sin(rotation), bodies = recursive ? Composite2.allBodies(composite) : composite.bodies;
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], dx = body.position.x - point.x, dy = body.position.y - point.y;
                    Body2.setPosition(body, {
                      x: point.x + (dx * cos - dy * sin),
                      y: point.y + (dx * sin + dy * cos)
                    });
                    Body2.rotate(body, rotation);
                  }
                  return composite;
                };
                Composite2.scale = function(composite, scaleX, scaleY, point, recursive) {
                  var bodies = recursive ? Composite2.allBodies(composite) : composite.bodies;
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], dx = body.position.x - point.x, dy = body.position.y - point.y;
                    Body2.setPosition(body, {
                      x: point.x + dx * scaleX,
                      y: point.y + dy * scaleY
                    });
                    Body2.scale(body, scaleX, scaleY);
                  }
                  return composite;
                };
                Composite2.bounds = function(composite) {
                  var bodies = Composite2.allBodies(composite), vertices = [];
                  for (var i = 0; i < bodies.length; i += 1) {
                    var body = bodies[i];
                    vertices.push(body.bounds.min, body.bounds.max);
                  }
                  return Bounds2.create(vertices);
                };
              })();
            }),
            /* 7 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Sleeping = {};
              module2.exports = Sleeping;
              var Body2 = __webpack_require__(4);
              var Events2 = __webpack_require__(5);
              var Common2 = __webpack_require__(0);
              (function() {
                Sleeping._motionWakeThreshold = 0.18;
                Sleeping._motionSleepThreshold = 0.08;
                Sleeping._minBias = 0.9;
                Sleeping.update = function(bodies, delta) {
                  var timeScale = delta / Common2._baseDelta, motionSleepThreshold = Sleeping._motionSleepThreshold;
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], speed = Body2.getSpeed(body), angularSpeed = Body2.getAngularSpeed(body), motion = speed * speed + angularSpeed * angularSpeed;
                    if (body.force.x !== 0 || body.force.y !== 0) {
                      Sleeping.set(body, false);
                      continue;
                    }
                    var minMotion = Math.min(body.motion, motion), maxMotion = Math.max(body.motion, motion);
                    body.motion = Sleeping._minBias * minMotion + (1 - Sleeping._minBias) * maxMotion;
                    if (body.sleepThreshold > 0 && body.motion < motionSleepThreshold) {
                      body.sleepCounter += 1;
                      if (body.sleepCounter >= body.sleepThreshold / timeScale) {
                        Sleeping.set(body, true);
                      }
                    } else if (body.sleepCounter > 0) {
                      body.sleepCounter -= 1;
                    }
                  }
                };
                Sleeping.afterCollisions = function(pairs2) {
                  var motionSleepThreshold = Sleeping._motionSleepThreshold;
                  for (var i = 0; i < pairs2.length; i++) {
                    var pair = pairs2[i];
                    if (!pair.isActive)
                      continue;
                    var collision = pair.collision, bodyA = collision.bodyA.parent, bodyB = collision.bodyB.parent;
                    if (bodyA.isSleeping && bodyB.isSleeping || bodyA.isStatic || bodyB.isStatic)
                      continue;
                    if (bodyA.isSleeping || bodyB.isSleeping) {
                      var sleepingBody = bodyA.isSleeping && !bodyA.isStatic ? bodyA : bodyB, movingBody = sleepingBody === bodyA ? bodyB : bodyA;
                      if (!sleepingBody.isStatic && movingBody.motion > motionSleepThreshold) {
                        Sleeping.set(sleepingBody, false);
                      }
                    }
                  }
                };
                Sleeping.set = function(body, isSleeping) {
                  var wasSleeping = body.isSleeping;
                  if (isSleeping) {
                    body.isSleeping = true;
                    body.sleepCounter = body.sleepThreshold;
                    body.positionImpulse.x = 0;
                    body.positionImpulse.y = 0;
                    body.positionPrev.x = body.position.x;
                    body.positionPrev.y = body.position.y;
                    body.anglePrev = body.angle;
                    body.speed = 0;
                    body.angularSpeed = 0;
                    body.motion = 0;
                    if (!wasSleeping) {
                      Events2.trigger(body, "sleepStart");
                    }
                  } else {
                    body.isSleeping = false;
                    body.sleepCounter = 0;
                    if (wasSleeping) {
                      Events2.trigger(body, "sleepEnd");
                    }
                  }
                };
              })();
            }),
            /* 8 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Collision = {};
              module2.exports = Collision;
              var Vertices2 = __webpack_require__(3);
              var Pair = __webpack_require__(9);
              (function() {
                var _supports = [];
                var _overlapAB = {
                  overlap: 0,
                  axis: null
                };
                var _overlapBA = {
                  overlap: 0,
                  axis: null
                };
                Collision.create = function(bodyA, bodyB) {
                  return {
                    pair: null,
                    collided: false,
                    bodyA,
                    bodyB,
                    parentA: bodyA.parent,
                    parentB: bodyB.parent,
                    depth: 0,
                    normal: { x: 0, y: 0 },
                    tangent: { x: 0, y: 0 },
                    penetration: { x: 0, y: 0 },
                    supports: []
                  };
                };
                Collision.collides = function(bodyA, bodyB, pairs2) {
                  Collision._overlapAxes(_overlapAB, bodyA.vertices, bodyB.vertices, bodyA.axes);
                  if (_overlapAB.overlap <= 0) {
                    return null;
                  }
                  Collision._overlapAxes(_overlapBA, bodyB.vertices, bodyA.vertices, bodyB.axes);
                  if (_overlapBA.overlap <= 0) {
                    return null;
                  }
                  var pair = pairs2 && pairs2.table[Pair.id(bodyA, bodyB)], collision;
                  if (!pair) {
                    collision = Collision.create(bodyA, bodyB);
                    collision.collided = true;
                    collision.bodyA = bodyA.id < bodyB.id ? bodyA : bodyB;
                    collision.bodyB = bodyA.id < bodyB.id ? bodyB : bodyA;
                    collision.parentA = collision.bodyA.parent;
                    collision.parentB = collision.bodyB.parent;
                  } else {
                    collision = pair.collision;
                  }
                  bodyA = collision.bodyA;
                  bodyB = collision.bodyB;
                  var minOverlap;
                  if (_overlapAB.overlap < _overlapBA.overlap) {
                    minOverlap = _overlapAB;
                  } else {
                    minOverlap = _overlapBA;
                  }
                  var normal = collision.normal, supports = collision.supports, minAxis = minOverlap.axis, minAxisX = minAxis.x, minAxisY = minAxis.y;
                  if (minAxisX * (bodyB.position.x - bodyA.position.x) + minAxisY * (bodyB.position.y - bodyA.position.y) < 0) {
                    normal.x = minAxisX;
                    normal.y = minAxisY;
                  } else {
                    normal.x = -minAxisX;
                    normal.y = -minAxisY;
                  }
                  collision.tangent.x = -normal.y;
                  collision.tangent.y = normal.x;
                  collision.depth = minOverlap.overlap;
                  collision.penetration.x = normal.x * collision.depth;
                  collision.penetration.y = normal.y * collision.depth;
                  var supportsB = Collision._findSupports(bodyA, bodyB, normal, 1), supportCount = 0;
                  if (Vertices2.contains(bodyA.vertices, supportsB[0])) {
                    supports[supportCount++] = supportsB[0];
                  }
                  if (Vertices2.contains(bodyA.vertices, supportsB[1])) {
                    supports[supportCount++] = supportsB[1];
                  }
                  if (supportCount < 2) {
                    var supportsA = Collision._findSupports(bodyB, bodyA, normal, -1);
                    if (Vertices2.contains(bodyB.vertices, supportsA[0])) {
                      supports[supportCount++] = supportsA[0];
                    }
                    if (supportCount < 2 && Vertices2.contains(bodyB.vertices, supportsA[1])) {
                      supports[supportCount++] = supportsA[1];
                    }
                  }
                  if (supportCount === 0) {
                    supports[supportCount++] = supportsB[0];
                  }
                  supports.length = supportCount;
                  return collision;
                };
                Collision._overlapAxes = function(result, verticesA, verticesB, axes) {
                  var verticesALength = verticesA.length, verticesBLength = verticesB.length, verticesAX = verticesA[0].x, verticesAY = verticesA[0].y, verticesBX = verticesB[0].x, verticesBY = verticesB[0].y, axesLength = axes.length, overlapMin = Number.MAX_VALUE, overlapAxisNumber = 0, overlap, overlapAB, overlapBA, dot, i, j;
                  for (i = 0; i < axesLength; i++) {
                    var axis = axes[i], axisX = axis.x, axisY = axis.y, minA = verticesAX * axisX + verticesAY * axisY, minB = verticesBX * axisX + verticesBY * axisY, maxA = minA, maxB = minB;
                    for (j = 1; j < verticesALength; j += 1) {
                      dot = verticesA[j].x * axisX + verticesA[j].y * axisY;
                      if (dot > maxA) {
                        maxA = dot;
                      } else if (dot < minA) {
                        minA = dot;
                      }
                    }
                    for (j = 1; j < verticesBLength; j += 1) {
                      dot = verticesB[j].x * axisX + verticesB[j].y * axisY;
                      if (dot > maxB) {
                        maxB = dot;
                      } else if (dot < minB) {
                        minB = dot;
                      }
                    }
                    overlapAB = maxA - minB;
                    overlapBA = maxB - minA;
                    overlap = overlapAB < overlapBA ? overlapAB : overlapBA;
                    if (overlap < overlapMin) {
                      overlapMin = overlap;
                      overlapAxisNumber = i;
                      if (overlap <= 0) {
                        break;
                      }
                    }
                  }
                  result.axis = axes[overlapAxisNumber];
                  result.overlap = overlapMin;
                };
                Collision._projectToAxis = function(projection, vertices, axis) {
                  var min = vertices[0].x * axis.x + vertices[0].y * axis.y, max = min;
                  for (var i = 1; i < vertices.length; i += 1) {
                    var dot = vertices[i].x * axis.x + vertices[i].y * axis.y;
                    if (dot > max) {
                      max = dot;
                    } else if (dot < min) {
                      min = dot;
                    }
                  }
                  projection.min = min;
                  projection.max = max;
                };
                Collision._findSupports = function(bodyA, bodyB, normal, direction) {
                  var vertices = bodyB.vertices, verticesLength = vertices.length, bodyAPositionX = bodyA.position.x, bodyAPositionY = bodyA.position.y, normalX = normal.x * direction, normalY = normal.y * direction, nearestDistance = Number.MAX_VALUE, vertexA, vertexB, vertexC, distance, j;
                  for (j = 0; j < verticesLength; j += 1) {
                    vertexB = vertices[j];
                    distance = normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y);
                    if (distance < nearestDistance) {
                      nearestDistance = distance;
                      vertexA = vertexB;
                    }
                  }
                  vertexC = vertices[(verticesLength + vertexA.index - 1) % verticesLength];
                  nearestDistance = normalX * (bodyAPositionX - vertexC.x) + normalY * (bodyAPositionY - vertexC.y);
                  vertexB = vertices[(vertexA.index + 1) % verticesLength];
                  if (normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y) < nearestDistance) {
                    _supports[0] = vertexA;
                    _supports[1] = vertexB;
                    return _supports;
                  }
                  _supports[0] = vertexA;
                  _supports[1] = vertexC;
                  return _supports;
                };
              })();
            }),
            /* 9 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Pair = {};
              module2.exports = Pair;
              var Contact = __webpack_require__(16);
              (function() {
                Pair.create = function(collision, timestamp) {
                  var bodyA = collision.bodyA, bodyB = collision.bodyB;
                  var pair = {
                    id: Pair.id(bodyA, bodyB),
                    bodyA,
                    bodyB,
                    collision,
                    contacts: [],
                    activeContacts: [],
                    separation: 0,
                    isActive: true,
                    confirmedActive: true,
                    isSensor: bodyA.isSensor || bodyB.isSensor,
                    timeCreated: timestamp,
                    timeUpdated: timestamp,
                    inverseMass: 0,
                    friction: 0,
                    frictionStatic: 0,
                    restitution: 0,
                    slop: 0
                  };
                  Pair.update(pair, collision, timestamp);
                  return pair;
                };
                Pair.update = function(pair, collision, timestamp) {
                  var contacts = pair.contacts, supports = collision.supports, activeContacts = pair.activeContacts, parentA = collision.parentA, parentB = collision.parentB, parentAVerticesLength = parentA.vertices.length;
                  pair.isActive = true;
                  pair.timeUpdated = timestamp;
                  pair.collision = collision;
                  pair.separation = collision.depth;
                  pair.inverseMass = parentA.inverseMass + parentB.inverseMass;
                  pair.friction = parentA.friction < parentB.friction ? parentA.friction : parentB.friction;
                  pair.frictionStatic = parentA.frictionStatic > parentB.frictionStatic ? parentA.frictionStatic : parentB.frictionStatic;
                  pair.restitution = parentA.restitution > parentB.restitution ? parentA.restitution : parentB.restitution;
                  pair.slop = parentA.slop > parentB.slop ? parentA.slop : parentB.slop;
                  collision.pair = pair;
                  activeContacts.length = 0;
                  for (var i = 0; i < supports.length; i++) {
                    var support = supports[i], contactId = support.body === parentA ? support.index : parentAVerticesLength + support.index, contact = contacts[contactId];
                    if (contact) {
                      activeContacts.push(contact);
                    } else {
                      activeContacts.push(contacts[contactId] = Contact.create(support));
                    }
                  }
                };
                Pair.setActive = function(pair, isActive, timestamp) {
                  if (isActive) {
                    pair.isActive = true;
                    pair.timeUpdated = timestamp;
                  } else {
                    pair.isActive = false;
                    pair.activeContacts.length = 0;
                  }
                };
                Pair.id = function(bodyA, bodyB) {
                  if (bodyA.id < bodyB.id) {
                    return "A" + bodyA.id + "B" + bodyB.id;
                  } else {
                    return "A" + bodyB.id + "B" + bodyA.id;
                  }
                };
              })();
            }),
            /* 10 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Constraint2 = {};
              module2.exports = Constraint2;
              var Vertices2 = __webpack_require__(3);
              var Vector2 = __webpack_require__(2);
              var Sleeping = __webpack_require__(7);
              var Bounds2 = __webpack_require__(1);
              var Axes = __webpack_require__(11);
              var Common2 = __webpack_require__(0);
              (function() {
                Constraint2._warming = 0.4;
                Constraint2._torqueDampen = 1;
                Constraint2._minLength = 1e-6;
                Constraint2.create = function(options) {
                  var constraint = options;
                  if (constraint.bodyA && !constraint.pointA)
                    constraint.pointA = { x: 0, y: 0 };
                  if (constraint.bodyB && !constraint.pointB)
                    constraint.pointB = { x: 0, y: 0 };
                  var initialPointA = constraint.bodyA ? Vector2.add(constraint.bodyA.position, constraint.pointA) : constraint.pointA, initialPointB = constraint.bodyB ? Vector2.add(constraint.bodyB.position, constraint.pointB) : constraint.pointB, length = Vector2.magnitude(Vector2.sub(initialPointA, initialPointB));
                  constraint.length = typeof constraint.length !== "undefined" ? constraint.length : length;
                  constraint.id = constraint.id || Common2.nextId();
                  constraint.label = constraint.label || "Constraint";
                  constraint.type = "constraint";
                  constraint.stiffness = constraint.stiffness || (constraint.length > 0 ? 1 : 0.7);
                  constraint.damping = constraint.damping || 0;
                  constraint.angularStiffness = constraint.angularStiffness || 0;
                  constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
                  constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;
                  constraint.plugin = {};
                  var render = {
                    visible: true,
                    lineWidth: 2,
                    strokeStyle: "#ffffff",
                    type: "line",
                    anchors: true
                  };
                  if (constraint.length === 0 && constraint.stiffness > 0.1) {
                    render.type = "pin";
                    render.anchors = false;
                  } else if (constraint.stiffness < 0.9) {
                    render.type = "spring";
                  }
                  constraint.render = Common2.extend(render, constraint.render);
                  return constraint;
                };
                Constraint2.preSolveAll = function(bodies) {
                  for (var i = 0; i < bodies.length; i += 1) {
                    var body = bodies[i], impulse = body.constraintImpulse;
                    if (body.isStatic || impulse.x === 0 && impulse.y === 0 && impulse.angle === 0) {
                      continue;
                    }
                    body.position.x += impulse.x;
                    body.position.y += impulse.y;
                    body.angle += impulse.angle;
                  }
                };
                Constraint2.solveAll = function(constraints, delta) {
                  var timeScale = Common2.clamp(delta / Common2._baseDelta, 0, 1);
                  for (var i = 0; i < constraints.length; i += 1) {
                    var constraint = constraints[i], fixedA = !constraint.bodyA || constraint.bodyA && constraint.bodyA.isStatic, fixedB = !constraint.bodyB || constraint.bodyB && constraint.bodyB.isStatic;
                    if (fixedA || fixedB) {
                      Constraint2.solve(constraints[i], timeScale);
                    }
                  }
                  for (i = 0; i < constraints.length; i += 1) {
                    constraint = constraints[i];
                    fixedA = !constraint.bodyA || constraint.bodyA && constraint.bodyA.isStatic;
                    fixedB = !constraint.bodyB || constraint.bodyB && constraint.bodyB.isStatic;
                    if (!fixedA && !fixedB) {
                      Constraint2.solve(constraints[i], timeScale);
                    }
                  }
                };
                Constraint2.solve = function(constraint, timeScale) {
                  var bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB;
                  if (!bodyA && !bodyB)
                    return;
                  if (bodyA && !bodyA.isStatic) {
                    Vector2.rotate(pointA, bodyA.angle - constraint.angleA, pointA);
                    constraint.angleA = bodyA.angle;
                  }
                  if (bodyB && !bodyB.isStatic) {
                    Vector2.rotate(pointB, bodyB.angle - constraint.angleB, pointB);
                    constraint.angleB = bodyB.angle;
                  }
                  var pointAWorld = pointA, pointBWorld = pointB;
                  if (bodyA) pointAWorld = Vector2.add(bodyA.position, pointA);
                  if (bodyB) pointBWorld = Vector2.add(bodyB.position, pointB);
                  if (!pointAWorld || !pointBWorld)
                    return;
                  var delta = Vector2.sub(pointAWorld, pointBWorld), currentLength = Vector2.magnitude(delta);
                  if (currentLength < Constraint2._minLength) {
                    currentLength = Constraint2._minLength;
                  }
                  var difference = (currentLength - constraint.length) / currentLength, isRigid = constraint.stiffness >= 1 || constraint.length === 0, stiffness = isRigid ? constraint.stiffness * timeScale : constraint.stiffness * timeScale * timeScale, damping = constraint.damping * timeScale, force = Vector2.mult(delta, difference * stiffness), massTotal = (bodyA ? bodyA.inverseMass : 0) + (bodyB ? bodyB.inverseMass : 0), inertiaTotal = (bodyA ? bodyA.inverseInertia : 0) + (bodyB ? bodyB.inverseInertia : 0), resistanceTotal = massTotal + inertiaTotal, torque, share, normal, normalVelocity, relativeVelocity;
                  if (damping > 0) {
                    var zero = Vector2.create();
                    normal = Vector2.div(delta, currentLength);
                    relativeVelocity = Vector2.sub(
                      bodyB && Vector2.sub(bodyB.position, bodyB.positionPrev) || zero,
                      bodyA && Vector2.sub(bodyA.position, bodyA.positionPrev) || zero
                    );
                    normalVelocity = Vector2.dot(normal, relativeVelocity);
                  }
                  if (bodyA && !bodyA.isStatic) {
                    share = bodyA.inverseMass / massTotal;
                    bodyA.constraintImpulse.x -= force.x * share;
                    bodyA.constraintImpulse.y -= force.y * share;
                    bodyA.position.x -= force.x * share;
                    bodyA.position.y -= force.y * share;
                    if (damping > 0) {
                      bodyA.positionPrev.x -= damping * normal.x * normalVelocity * share;
                      bodyA.positionPrev.y -= damping * normal.y * normalVelocity * share;
                    }
                    torque = Vector2.cross(pointA, force) / resistanceTotal * Constraint2._torqueDampen * bodyA.inverseInertia * (1 - constraint.angularStiffness);
                    bodyA.constraintImpulse.angle -= torque;
                    bodyA.angle -= torque;
                  }
                  if (bodyB && !bodyB.isStatic) {
                    share = bodyB.inverseMass / massTotal;
                    bodyB.constraintImpulse.x += force.x * share;
                    bodyB.constraintImpulse.y += force.y * share;
                    bodyB.position.x += force.x * share;
                    bodyB.position.y += force.y * share;
                    if (damping > 0) {
                      bodyB.positionPrev.x += damping * normal.x * normalVelocity * share;
                      bodyB.positionPrev.y += damping * normal.y * normalVelocity * share;
                    }
                    torque = Vector2.cross(pointB, force) / resistanceTotal * Constraint2._torqueDampen * bodyB.inverseInertia * (1 - constraint.angularStiffness);
                    bodyB.constraintImpulse.angle += torque;
                    bodyB.angle += torque;
                  }
                };
                Constraint2.postSolveAll = function(bodies) {
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], impulse = body.constraintImpulse;
                    if (body.isStatic || impulse.x === 0 && impulse.y === 0 && impulse.angle === 0) {
                      continue;
                    }
                    Sleeping.set(body, false);
                    for (var j = 0; j < body.parts.length; j++) {
                      var part = body.parts[j];
                      Vertices2.translate(part.vertices, impulse);
                      if (j > 0) {
                        part.position.x += impulse.x;
                        part.position.y += impulse.y;
                      }
                      if (impulse.angle !== 0) {
                        Vertices2.rotate(part.vertices, impulse.angle, body.position);
                        Axes.rotate(part.axes, impulse.angle);
                        if (j > 0) {
                          Vector2.rotateAbout(part.position, impulse.angle, body.position, part.position);
                        }
                      }
                      Bounds2.update(part.bounds, part.vertices, body.velocity);
                    }
                    impulse.angle *= Constraint2._warming;
                    impulse.x *= Constraint2._warming;
                    impulse.y *= Constraint2._warming;
                  }
                };
                Constraint2.pointAWorld = function(constraint) {
                  return {
                    x: (constraint.bodyA ? constraint.bodyA.position.x : 0) + (constraint.pointA ? constraint.pointA.x : 0),
                    y: (constraint.bodyA ? constraint.bodyA.position.y : 0) + (constraint.pointA ? constraint.pointA.y : 0)
                  };
                };
                Constraint2.pointBWorld = function(constraint) {
                  return {
                    x: (constraint.bodyB ? constraint.bodyB.position.x : 0) + (constraint.pointB ? constraint.pointB.x : 0),
                    y: (constraint.bodyB ? constraint.bodyB.position.y : 0) + (constraint.pointB ? constraint.pointB.y : 0)
                  };
                };
              })();
            }),
            /* 11 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Axes = {};
              module2.exports = Axes;
              var Vector2 = __webpack_require__(2);
              var Common2 = __webpack_require__(0);
              (function() {
                Axes.fromVertices = function(vertices) {
                  var axes = {};
                  for (var i = 0; i < vertices.length; i++) {
                    var j = (i + 1) % vertices.length, normal = Vector2.normalise({
                      x: vertices[j].y - vertices[i].y,
                      y: vertices[i].x - vertices[j].x
                    }), gradient = normal.y === 0 ? Infinity : normal.x / normal.y;
                    gradient = gradient.toFixed(3).toString();
                    axes[gradient] = normal;
                  }
                  return Common2.values(axes);
                };
                Axes.rotate = function(axes, angle) {
                  if (angle === 0)
                    return;
                  var cos = Math.cos(angle), sin = Math.sin(angle);
                  for (var i = 0; i < axes.length; i++) {
                    var axis = axes[i], xx;
                    xx = axis.x * cos - axis.y * sin;
                    axis.y = axis.x * sin + axis.y * cos;
                    axis.x = xx;
                  }
                };
              })();
            }),
            /* 12 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Bodies2 = {};
              module2.exports = Bodies2;
              var Vertices2 = __webpack_require__(3);
              var Common2 = __webpack_require__(0);
              var Body2 = __webpack_require__(4);
              var Bounds2 = __webpack_require__(1);
              var Vector2 = __webpack_require__(2);
              (function() {
                Bodies2.rectangle = function(x, y, width, height, options) {
                  options = options || {};
                  var rectangle = {
                    label: "Rectangle Body",
                    position: { x, y },
                    vertices: Vertices2.fromPath("L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    rectangle.vertices = Vertices2.chamfer(
                      rectangle.vertices,
                      chamfer.radius,
                      chamfer.quality,
                      chamfer.qualityMin,
                      chamfer.qualityMax
                    );
                    delete options.chamfer;
                  }
                  return Body2.create(Common2.extend({}, rectangle, options));
                };
                Bodies2.trapezoid = function(x, y, width, height, slope, options) {
                  options = options || {};
                  slope *= 0.5;
                  var roof = (1 - slope * 2) * width;
                  var x1 = width * slope, x2 = x1 + roof, x3 = x2 + x1, verticesPath;
                  if (slope < 0.5) {
                    verticesPath = "L 0 0 L " + x1 + " " + -height + " L " + x2 + " " + -height + " L " + x3 + " 0";
                  } else {
                    verticesPath = "L 0 0 L " + x2 + " " + -height + " L " + x3 + " 0";
                  }
                  var trapezoid = {
                    label: "Trapezoid Body",
                    position: { x, y },
                    vertices: Vertices2.fromPath(verticesPath)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    trapezoid.vertices = Vertices2.chamfer(
                      trapezoid.vertices,
                      chamfer.radius,
                      chamfer.quality,
                      chamfer.qualityMin,
                      chamfer.qualityMax
                    );
                    delete options.chamfer;
                  }
                  return Body2.create(Common2.extend({}, trapezoid, options));
                };
                Bodies2.circle = function(x, y, radius, options, maxSides) {
                  options = options || {};
                  var circle = {
                    label: "Circle Body",
                    circleRadius: radius
                  };
                  maxSides = maxSides || 25;
                  var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));
                  if (sides % 2 === 1)
                    sides += 1;
                  return Bodies2.polygon(x, y, sides, radius, Common2.extend({}, circle, options));
                };
                Bodies2.polygon = function(x, y, sides, radius, options) {
                  options = options || {};
                  if (sides < 3)
                    return Bodies2.circle(x, y, radius, options);
                  var theta = 2 * Math.PI / sides, path = "", offset = theta * 0.5;
                  for (var i = 0; i < sides; i += 1) {
                    var angle = offset + i * theta, xx = Math.cos(angle) * radius, yy = Math.sin(angle) * radius;
                    path += "L " + xx.toFixed(3) + " " + yy.toFixed(3) + " ";
                  }
                  var polygon = {
                    label: "Polygon Body",
                    position: { x, y },
                    vertices: Vertices2.fromPath(path)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    polygon.vertices = Vertices2.chamfer(
                      polygon.vertices,
                      chamfer.radius,
                      chamfer.quality,
                      chamfer.qualityMin,
                      chamfer.qualityMax
                    );
                    delete options.chamfer;
                  }
                  return Body2.create(Common2.extend({}, polygon, options));
                };
                Bodies2.fromVertices = function(x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea, removeDuplicatePoints) {
                  var decomp = Common2.getDecomp(), canDecomp, body, parts, isConvex, isConcave, vertices, i, j, k, v, z;
                  canDecomp = Boolean(decomp && decomp.quickDecomp);
                  options = options || {};
                  parts = [];
                  flagInternal = typeof flagInternal !== "undefined" ? flagInternal : false;
                  removeCollinear = typeof removeCollinear !== "undefined" ? removeCollinear : 0.01;
                  minimumArea = typeof minimumArea !== "undefined" ? minimumArea : 10;
                  removeDuplicatePoints = typeof removeDuplicatePoints !== "undefined" ? removeDuplicatePoints : 0.01;
                  if (!Common2.isArray(vertexSets[0])) {
                    vertexSets = [vertexSets];
                  }
                  for (v = 0; v < vertexSets.length; v += 1) {
                    vertices = vertexSets[v];
                    isConvex = Vertices2.isConvex(vertices);
                    isConcave = !isConvex;
                    if (isConcave && !canDecomp) {
                      Common2.warnOnce(
                        "Bodies.fromVertices: Install the 'poly-decomp' library and use Common.setDecomp or provide 'decomp' as a global to decompose concave vertices."
                      );
                    }
                    if (isConvex || !canDecomp) {
                      if (isConvex) {
                        vertices = Vertices2.clockwiseSort(vertices);
                      } else {
                        vertices = Vertices2.hull(vertices);
                      }
                      parts.push({
                        position: { x, y },
                        vertices
                      });
                    } else {
                      var concave = vertices.map(function(vertex) {
                        return [vertex.x, vertex.y];
                      });
                      decomp.makeCCW(concave);
                      if (removeCollinear !== false)
                        decomp.removeCollinearPoints(concave, removeCollinear);
                      if (removeDuplicatePoints !== false && decomp.removeDuplicatePoints)
                        decomp.removeDuplicatePoints(concave, removeDuplicatePoints);
                      var decomposed = decomp.quickDecomp(concave);
                      for (i = 0; i < decomposed.length; i++) {
                        var chunk = decomposed[i];
                        var chunkVertices = chunk.map(function(vertices2) {
                          return {
                            x: vertices2[0],
                            y: vertices2[1]
                          };
                        });
                        if (minimumArea > 0 && Vertices2.area(chunkVertices) < minimumArea)
                          continue;
                        parts.push({
                          position: Vertices2.centre(chunkVertices),
                          vertices: chunkVertices
                        });
                      }
                    }
                  }
                  for (i = 0; i < parts.length; i++) {
                    parts[i] = Body2.create(Common2.extend(parts[i], options));
                  }
                  if (flagInternal) {
                    var coincident_max_dist = 5;
                    for (i = 0; i < parts.length; i++) {
                      var partA = parts[i];
                      for (j = i + 1; j < parts.length; j++) {
                        var partB = parts[j];
                        if (Bounds2.overlaps(partA.bounds, partB.bounds)) {
                          var pav = partA.vertices, pbv = partB.vertices;
                          for (k = 0; k < partA.vertices.length; k++) {
                            for (z = 0; z < partB.vertices.length; z++) {
                              var da = Vector2.magnitudeSquared(Vector2.sub(pav[(k + 1) % pav.length], pbv[z])), db = Vector2.magnitudeSquared(Vector2.sub(pav[k], pbv[(z + 1) % pbv.length]));
                              if (da < coincident_max_dist && db < coincident_max_dist) {
                                pav[k].isInternal = true;
                                pbv[z].isInternal = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  if (parts.length > 1) {
                    body = Body2.create(Common2.extend({ parts: parts.slice(0) }, options));
                    Body2.setPosition(body, { x, y });
                    return body;
                  } else {
                    return parts[0];
                  }
                };
              })();
            }),
            /* 13 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Detector = {};
              module2.exports = Detector;
              var Common2 = __webpack_require__(0);
              var Collision = __webpack_require__(8);
              (function() {
                Detector.create = function(options) {
                  var defaults = {
                    bodies: [],
                    pairs: null
                  };
                  return Common2.extend(defaults, options);
                };
                Detector.setBodies = function(detector, bodies) {
                  detector.bodies = bodies.slice(0);
                };
                Detector.clear = function(detector) {
                  detector.bodies = [];
                };
                Detector.collisions = function(detector) {
                  var collisions = [], pairs2 = detector.pairs, bodies = detector.bodies, bodiesLength = bodies.length, canCollide = Detector.canCollide, collides = Collision.collides, i, j;
                  bodies.sort(Detector._compareBoundsX);
                  for (i = 0; i < bodiesLength; i++) {
                    var bodyA = bodies[i], boundsA = bodyA.bounds, boundXMax = bodyA.bounds.max.x, boundYMax = bodyA.bounds.max.y, boundYMin = bodyA.bounds.min.y, bodyAStatic = bodyA.isStatic || bodyA.isSleeping, partsALength = bodyA.parts.length, partsASingle = partsALength === 1;
                    for (j = i + 1; j < bodiesLength; j++) {
                      var bodyB = bodies[j], boundsB = bodyB.bounds;
                      if (boundsB.min.x > boundXMax) {
                        break;
                      }
                      if (boundYMax < boundsB.min.y || boundYMin > boundsB.max.y) {
                        continue;
                      }
                      if (bodyAStatic && (bodyB.isStatic || bodyB.isSleeping)) {
                        continue;
                      }
                      if (!canCollide(bodyA.collisionFilter, bodyB.collisionFilter)) {
                        continue;
                      }
                      var partsBLength = bodyB.parts.length;
                      if (partsASingle && partsBLength === 1) {
                        var collision = collides(bodyA, bodyB, pairs2);
                        if (collision) {
                          collisions.push(collision);
                        }
                      } else {
                        var partsAStart = partsALength > 1 ? 1 : 0, partsBStart = partsBLength > 1 ? 1 : 0;
                        for (var k = partsAStart; k < partsALength; k++) {
                          var partA = bodyA.parts[k], boundsA = partA.bounds;
                          for (var z = partsBStart; z < partsBLength; z++) {
                            var partB = bodyB.parts[z], boundsB = partB.bounds;
                            if (boundsA.min.x > boundsB.max.x || boundsA.max.x < boundsB.min.x || boundsA.max.y < boundsB.min.y || boundsA.min.y > boundsB.max.y) {
                              continue;
                            }
                            var collision = collides(partA, partB, pairs2);
                            if (collision) {
                              collisions.push(collision);
                            }
                          }
                        }
                      }
                    }
                  }
                  return collisions;
                };
                Detector.canCollide = function(filterA, filterB) {
                  if (filterA.group === filterB.group && filterA.group !== 0)
                    return filterA.group > 0;
                  return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
                };
                Detector._compareBoundsX = function(bodyA, bodyB) {
                  return bodyA.bounds.min.x - bodyB.bounds.min.x;
                };
              })();
            }),
            /* 14 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Mouse = {};
              module2.exports = Mouse;
              var Common2 = __webpack_require__(0);
              (function() {
                Mouse.create = function(element) {
                  var mouse2 = {};
                  if (!element) {
                    Common2.log("Mouse.create: element was undefined, defaulting to document.body", "warn");
                  }
                  mouse2.element = element || document.body;
                  mouse2.absolute = { x: 0, y: 0 };
                  mouse2.position = { x: 0, y: 0 };
                  mouse2.mousedownPosition = { x: 0, y: 0 };
                  mouse2.mouseupPosition = { x: 0, y: 0 };
                  mouse2.offset = { x: 0, y: 0 };
                  mouse2.scale = { x: 1, y: 1 };
                  mouse2.wheelDelta = 0;
                  mouse2.button = -1;
                  mouse2.pixelRatio = parseInt(mouse2.element.getAttribute("data-pixel-ratio"), 10) || 1;
                  mouse2.sourceEvents = {
                    mousemove: null,
                    mousedown: null,
                    mouseup: null,
                    mousewheel: null
                  };
                  mouse2.mousemove = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse2.element, mouse2.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      mouse2.button = 0;
                      event.preventDefault();
                    }
                    mouse2.absolute.x = position.x;
                    mouse2.absolute.y = position.y;
                    mouse2.position.x = mouse2.absolute.x * mouse2.scale.x + mouse2.offset.x;
                    mouse2.position.y = mouse2.absolute.y * mouse2.scale.y + mouse2.offset.y;
                    mouse2.sourceEvents.mousemove = event;
                  };
                  mouse2.mousedown = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse2.element, mouse2.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      mouse2.button = 0;
                      event.preventDefault();
                    } else {
                      mouse2.button = event.button;
                    }
                    mouse2.absolute.x = position.x;
                    mouse2.absolute.y = position.y;
                    mouse2.position.x = mouse2.absolute.x * mouse2.scale.x + mouse2.offset.x;
                    mouse2.position.y = mouse2.absolute.y * mouse2.scale.y + mouse2.offset.y;
                    mouse2.mousedownPosition.x = mouse2.position.x;
                    mouse2.mousedownPosition.y = mouse2.position.y;
                    mouse2.sourceEvents.mousedown = event;
                  };
                  mouse2.mouseup = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse2.element, mouse2.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      event.preventDefault();
                    }
                    mouse2.button = -1;
                    mouse2.absolute.x = position.x;
                    mouse2.absolute.y = position.y;
                    mouse2.position.x = mouse2.absolute.x * mouse2.scale.x + mouse2.offset.x;
                    mouse2.position.y = mouse2.absolute.y * mouse2.scale.y + mouse2.offset.y;
                    mouse2.mouseupPosition.x = mouse2.position.x;
                    mouse2.mouseupPosition.y = mouse2.position.y;
                    mouse2.sourceEvents.mouseup = event;
                  };
                  mouse2.mousewheel = function(event) {
                    mouse2.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
                    event.preventDefault();
                  };
                  Mouse.setElement(mouse2, mouse2.element);
                  return mouse2;
                };
                Mouse.setElement = function(mouse2, element) {
                  mouse2.element = element;
                  element.addEventListener("mousemove", mouse2.mousemove);
                  element.addEventListener("mousedown", mouse2.mousedown);
                  element.addEventListener("mouseup", mouse2.mouseup);
                  element.addEventListener("mousewheel", mouse2.mousewheel);
                  element.addEventListener("DOMMouseScroll", mouse2.mousewheel);
                  element.addEventListener("touchmove", mouse2.mousemove);
                  element.addEventListener("touchstart", mouse2.mousedown);
                  element.addEventListener("touchend", mouse2.mouseup);
                };
                Mouse.clearSourceEvents = function(mouse2) {
                  mouse2.sourceEvents.mousemove = null;
                  mouse2.sourceEvents.mousedown = null;
                  mouse2.sourceEvents.mouseup = null;
                  mouse2.sourceEvents.mousewheel = null;
                  mouse2.wheelDelta = 0;
                };
                Mouse.setOffset = function(mouse2, offset) {
                  mouse2.offset.x = offset.x;
                  mouse2.offset.y = offset.y;
                  mouse2.position.x = mouse2.absolute.x * mouse2.scale.x + mouse2.offset.x;
                  mouse2.position.y = mouse2.absolute.y * mouse2.scale.y + mouse2.offset.y;
                };
                Mouse.setScale = function(mouse2, scale2) {
                  mouse2.scale.x = scale2.x;
                  mouse2.scale.y = scale2.y;
                  mouse2.position.x = mouse2.absolute.x * mouse2.scale.x + mouse2.offset.x;
                  mouse2.position.y = mouse2.absolute.y * mouse2.scale.y + mouse2.offset.y;
                };
                Mouse._getRelativeMousePosition = function(event, element, pixelRatio) {
                  var elementBounds = element.getBoundingClientRect(), rootNode = document.documentElement || document.body.parentNode || document.body, scrollX = window.pageXOffset !== void 0 ? window.pageXOffset : rootNode.scrollLeft, scrollY = window.pageYOffset !== void 0 ? window.pageYOffset : rootNode.scrollTop, touches = event.changedTouches, x, y;
                  if (touches) {
                    x = touches[0].pageX - elementBounds.left - scrollX;
                    y = touches[0].pageY - elementBounds.top - scrollY;
                  } else {
                    x = event.pageX - elementBounds.left - scrollX;
                    y = event.pageY - elementBounds.top - scrollY;
                  }
                  return {
                    x: x / (element.clientWidth / (element.width || element.clientWidth) * pixelRatio),
                    y: y / (element.clientHeight / (element.height || element.clientHeight) * pixelRatio)
                  };
                };
              })();
            }),
            /* 15 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Plugin = {};
              module2.exports = Plugin;
              var Common2 = __webpack_require__(0);
              (function() {
                Plugin._registry = {};
                Plugin.register = function(plugin) {
                  if (!Plugin.isPlugin(plugin)) {
                    Common2.warn("Plugin.register:", Plugin.toString(plugin), "does not implement all required fields.");
                  }
                  if (plugin.name in Plugin._registry) {
                    var registered2 = Plugin._registry[plugin.name], pluginVersion = Plugin.versionParse(plugin.version).number, registeredVersion = Plugin.versionParse(registered2.version).number;
                    if (pluginVersion > registeredVersion) {
                      Common2.warn("Plugin.register:", Plugin.toString(registered2), "was upgraded to", Plugin.toString(plugin));
                      Plugin._registry[plugin.name] = plugin;
                    } else if (pluginVersion < registeredVersion) {
                      Common2.warn("Plugin.register:", Plugin.toString(registered2), "can not be downgraded to", Plugin.toString(plugin));
                    } else if (plugin !== registered2) {
                      Common2.warn("Plugin.register:", Plugin.toString(plugin), "is already registered to different plugin object");
                    }
                  } else {
                    Plugin._registry[plugin.name] = plugin;
                  }
                  return plugin;
                };
                Plugin.resolve = function(dependency) {
                  return Plugin._registry[Plugin.dependencyParse(dependency).name];
                };
                Plugin.toString = function(plugin) {
                  return typeof plugin === "string" ? plugin : (plugin.name || "anonymous") + "@" + (plugin.version || plugin.range || "0.0.0");
                };
                Plugin.isPlugin = function(obj) {
                  return obj && obj.name && obj.version && obj.install;
                };
                Plugin.isUsed = function(module3, name) {
                  return module3.used.indexOf(name) > -1;
                };
                Plugin.isFor = function(plugin, module3) {
                  var parsed = plugin.for && Plugin.dependencyParse(plugin.for);
                  return !plugin.for || module3.name === parsed.name && Plugin.versionSatisfies(module3.version, parsed.range);
                };
                Plugin.use = function(module3, plugins) {
                  module3.uses = (module3.uses || []).concat(plugins || []);
                  if (module3.uses.length === 0) {
                    Common2.warn("Plugin.use:", Plugin.toString(module3), "does not specify any dependencies to install.");
                    return;
                  }
                  var dependencies = Plugin.dependencies(module3), sortedDependencies = Common2.topologicalSort(dependencies), status = [];
                  for (var i = 0; i < sortedDependencies.length; i += 1) {
                    if (sortedDependencies[i] === module3.name) {
                      continue;
                    }
                    var plugin = Plugin.resolve(sortedDependencies[i]);
                    if (!plugin) {
                      status.push("\u274C " + sortedDependencies[i]);
                      continue;
                    }
                    if (Plugin.isUsed(module3, plugin.name)) {
                      continue;
                    }
                    if (!Plugin.isFor(plugin, module3)) {
                      Common2.warn("Plugin.use:", Plugin.toString(plugin), "is for", plugin.for, "but installed on", Plugin.toString(module3) + ".");
                      plugin._warned = true;
                    }
                    if (plugin.install) {
                      plugin.install(module3);
                    } else {
                      Common2.warn("Plugin.use:", Plugin.toString(plugin), "does not specify an install function.");
                      plugin._warned = true;
                    }
                    if (plugin._warned) {
                      status.push("\u{1F536} " + Plugin.toString(plugin));
                      delete plugin._warned;
                    } else {
                      status.push("\u2705 " + Plugin.toString(plugin));
                    }
                    module3.used.push(plugin.name);
                  }
                  if (status.length > 0) {
                    Common2.info(status.join("  "));
                  }
                };
                Plugin.dependencies = function(module3, tracked) {
                  var parsedBase = Plugin.dependencyParse(module3), name = parsedBase.name;
                  tracked = tracked || {};
                  if (name in tracked) {
                    return;
                  }
                  module3 = Plugin.resolve(module3) || module3;
                  tracked[name] = Common2.map(module3.uses || [], function(dependency) {
                    if (Plugin.isPlugin(dependency)) {
                      Plugin.register(dependency);
                    }
                    var parsed = Plugin.dependencyParse(dependency), resolved2 = Plugin.resolve(dependency);
                    if (resolved2 && !Plugin.versionSatisfies(resolved2.version, parsed.range)) {
                      Common2.warn(
                        "Plugin.dependencies:",
                        Plugin.toString(resolved2),
                        "does not satisfy",
                        Plugin.toString(parsed),
                        "used by",
                        Plugin.toString(parsedBase) + "."
                      );
                      resolved2._warned = true;
                      module3._warned = true;
                    } else if (!resolved2) {
                      Common2.warn(
                        "Plugin.dependencies:",
                        Plugin.toString(dependency),
                        "used by",
                        Plugin.toString(parsedBase),
                        "could not be resolved."
                      );
                      module3._warned = true;
                    }
                    return parsed.name;
                  });
                  for (var i = 0; i < tracked[name].length; i += 1) {
                    Plugin.dependencies(tracked[name][i], tracked);
                  }
                  return tracked;
                };
                Plugin.dependencyParse = function(dependency) {
                  if (Common2.isString(dependency)) {
                    var pattern = /^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/;
                    if (!pattern.test(dependency)) {
                      Common2.warn("Plugin.dependencyParse:", dependency, "is not a valid dependency string.");
                    }
                    return {
                      name: dependency.split("@")[0],
                      range: dependency.split("@")[1] || "*"
                    };
                  }
                  return {
                    name: dependency.name,
                    range: dependency.range || dependency.version
                  };
                };
                Plugin.versionParse = function(range) {
                  var pattern = /^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;
                  if (!pattern.test(range)) {
                    Common2.warn("Plugin.versionParse:", range, "is not a valid version or range.");
                  }
                  var parts = pattern.exec(range);
                  var major = Number(parts[4]);
                  var minor = Number(parts[5]);
                  var patch = Number(parts[6]);
                  return {
                    isRange: Boolean(parts[1] || parts[2]),
                    version: parts[3],
                    range,
                    operator: parts[1] || parts[2] || "",
                    major,
                    minor,
                    patch,
                    parts: [major, minor, patch],
                    prerelease: parts[7],
                    number: major * 1e8 + minor * 1e4 + patch
                  };
                };
                Plugin.versionSatisfies = function(version, range) {
                  range = range || "*";
                  var r = Plugin.versionParse(range), v = Plugin.versionParse(version);
                  if (r.isRange) {
                    if (r.operator === "*" || version === "*") {
                      return true;
                    }
                    if (r.operator === ">") {
                      return v.number > r.number;
                    }
                    if (r.operator === ">=") {
                      return v.number >= r.number;
                    }
                    if (r.operator === "~") {
                      return v.major === r.major && v.minor === r.minor && v.patch >= r.patch;
                    }
                    if (r.operator === "^") {
                      if (r.major > 0) {
                        return v.major === r.major && v.number >= r.number;
                      }
                      if (r.minor > 0) {
                        return v.minor === r.minor && v.patch >= r.patch;
                      }
                      return v.patch === r.patch;
                    }
                  }
                  return version === range || version === "*";
                };
              })();
            }),
            /* 16 */
            /***/
            (function(module2, exports2) {
              var Contact = {};
              module2.exports = Contact;
              (function() {
                Contact.create = function(vertex) {
                  return {
                    vertex,
                    normalImpulse: 0,
                    tangentImpulse: 0
                  };
                };
              })();
            }),
            /* 17 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Engine2 = {};
              module2.exports = Engine2;
              var Sleeping = __webpack_require__(7);
              var Resolver = __webpack_require__(18);
              var Detector = __webpack_require__(13);
              var Pairs = __webpack_require__(19);
              var Events2 = __webpack_require__(5);
              var Composite2 = __webpack_require__(6);
              var Constraint2 = __webpack_require__(10);
              var Common2 = __webpack_require__(0);
              var Body2 = __webpack_require__(4);
              (function() {
                Engine2.create = function(options) {
                  options = options || {};
                  var defaults = {
                    positionIterations: 6,
                    velocityIterations: 4,
                    constraintIterations: 2,
                    enableSleeping: false,
                    events: [],
                    plugin: {},
                    gravity: {
                      x: 0,
                      y: 1,
                      scale: 1e-3
                    },
                    timing: {
                      timestamp: 0,
                      timeScale: 1,
                      lastDelta: 0,
                      lastElapsed: 0
                    }
                  };
                  var engine2 = Common2.extend(defaults, options);
                  engine2.world = options.world || Composite2.create({ label: "World" });
                  engine2.pairs = options.pairs || Pairs.create();
                  engine2.detector = options.detector || Detector.create();
                  engine2.grid = { buckets: [] };
                  engine2.world.gravity = engine2.gravity;
                  engine2.broadphase = engine2.grid;
                  engine2.metrics = {};
                  return engine2;
                };
                Engine2.update = function(engine2, delta) {
                  var startTime = Common2.now();
                  var world = engine2.world, detector = engine2.detector, pairs2 = engine2.pairs, timing = engine2.timing, timestamp = timing.timestamp, i;
                  delta = typeof delta !== "undefined" ? delta : Common2._baseDelta;
                  delta *= timing.timeScale;
                  timing.timestamp += delta;
                  timing.lastDelta = delta;
                  var event = {
                    timestamp: timing.timestamp,
                    delta
                  };
                  Events2.trigger(engine2, "beforeUpdate", event);
                  var allBodies2 = Composite2.allBodies(world), allConstraints = Composite2.allConstraints(world);
                  if (world.isModified) {
                    Detector.setBodies(detector, allBodies2);
                    Composite2.setModified(world, false, false, true);
                  }
                  if (engine2.enableSleeping)
                    Sleeping.update(allBodies2, delta);
                  Engine2._bodiesApplyGravity(allBodies2, engine2.gravity);
                  if (delta > 0) {
                    Engine2._bodiesUpdate(allBodies2, delta);
                  }
                  Constraint2.preSolveAll(allBodies2);
                  for (i = 0; i < engine2.constraintIterations; i++) {
                    Constraint2.solveAll(allConstraints, delta);
                  }
                  Constraint2.postSolveAll(allBodies2);
                  detector.pairs = engine2.pairs;
                  var collisions = Detector.collisions(detector);
                  Pairs.update(pairs2, collisions, timestamp);
                  if (engine2.enableSleeping)
                    Sleeping.afterCollisions(pairs2.list);
                  if (pairs2.collisionStart.length > 0)
                    Events2.trigger(engine2, "collisionStart", { pairs: pairs2.collisionStart });
                  var positionDamping = Common2.clamp(20 / engine2.positionIterations, 0, 1);
                  Resolver.preSolvePosition(pairs2.list);
                  for (i = 0; i < engine2.positionIterations; i++) {
                    Resolver.solvePosition(pairs2.list, delta, positionDamping);
                  }
                  Resolver.postSolvePosition(allBodies2);
                  Constraint2.preSolveAll(allBodies2);
                  for (i = 0; i < engine2.constraintIterations; i++) {
                    Constraint2.solveAll(allConstraints, delta);
                  }
                  Constraint2.postSolveAll(allBodies2);
                  Resolver.preSolveVelocity(pairs2.list);
                  for (i = 0; i < engine2.velocityIterations; i++) {
                    Resolver.solveVelocity(pairs2.list, delta);
                  }
                  Engine2._bodiesUpdateVelocities(allBodies2);
                  if (pairs2.collisionActive.length > 0)
                    Events2.trigger(engine2, "collisionActive", { pairs: pairs2.collisionActive });
                  if (pairs2.collisionEnd.length > 0)
                    Events2.trigger(engine2, "collisionEnd", { pairs: pairs2.collisionEnd });
                  Engine2._bodiesClearForces(allBodies2);
                  Events2.trigger(engine2, "afterUpdate", event);
                  engine2.timing.lastElapsed = Common2.now() - startTime;
                  return engine2;
                };
                Engine2.merge = function(engineA, engineB) {
                  Common2.extend(engineA, engineB);
                  if (engineB.world) {
                    engineA.world = engineB.world;
                    Engine2.clear(engineA);
                    var bodies = Composite2.allBodies(engineA.world);
                    for (var i = 0; i < bodies.length; i++) {
                      var body = bodies[i];
                      Sleeping.set(body, false);
                      body.id = Common2.nextId();
                    }
                  }
                };
                Engine2.clear = function(engine2) {
                  Pairs.clear(engine2.pairs);
                  Detector.clear(engine2.detector);
                };
                Engine2._bodiesClearForces = function(bodies) {
                  var bodiesLength = bodies.length;
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i];
                    body.force.x = 0;
                    body.force.y = 0;
                    body.torque = 0;
                  }
                };
                Engine2._bodiesApplyGravity = function(bodies, gravity) {
                  var gravityScale = typeof gravity.scale !== "undefined" ? gravity.scale : 1e-3, bodiesLength = bodies.length;
                  if (gravity.x === 0 && gravity.y === 0 || gravityScale === 0) {
                    return;
                  }
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i];
                    if (body.isStatic || body.isSleeping)
                      continue;
                    body.force.y += body.mass * gravity.y * gravityScale;
                    body.force.x += body.mass * gravity.x * gravityScale;
                  }
                };
                Engine2._bodiesUpdate = function(bodies, delta) {
                  var bodiesLength = bodies.length;
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i];
                    if (body.isStatic || body.isSleeping)
                      continue;
                    Body2.update(body, delta);
                  }
                };
                Engine2._bodiesUpdateVelocities = function(bodies) {
                  var bodiesLength = bodies.length;
                  for (var i = 0; i < bodiesLength; i++) {
                    Body2.updateVelocities(bodies[i]);
                  }
                };
              })();
            }),
            /* 18 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Resolver = {};
              module2.exports = Resolver;
              var Vertices2 = __webpack_require__(3);
              var Common2 = __webpack_require__(0);
              var Bounds2 = __webpack_require__(1);
              (function() {
                Resolver._restingThresh = 2;
                Resolver._restingThreshTangent = Math.sqrt(6);
                Resolver._positionDampen = 0.9;
                Resolver._positionWarming = 0.8;
                Resolver._frictionNormalMultiplier = 5;
                Resolver._frictionMaxStatic = Number.MAX_VALUE;
                Resolver.preSolvePosition = function(pairs2) {
                  var i, pair, activeCount, pairsLength = pairs2.length;
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs2[i];
                    if (!pair.isActive)
                      continue;
                    activeCount = pair.activeContacts.length;
                    pair.collision.parentA.totalContacts += activeCount;
                    pair.collision.parentB.totalContacts += activeCount;
                  }
                };
                Resolver.solvePosition = function(pairs2, delta, damping) {
                  var i, pair, collision, bodyA, bodyB, normal, contactShare, positionImpulse, positionDampen = Resolver._positionDampen * (damping || 1), slopDampen = Common2.clamp(delta / Common2._baseDelta, 0, 1), pairsLength = pairs2.length;
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs2[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.parentA;
                    bodyB = collision.parentB;
                    normal = collision.normal;
                    pair.separation = normal.x * (bodyB.positionImpulse.x + collision.penetration.x - bodyA.positionImpulse.x) + normal.y * (bodyB.positionImpulse.y + collision.penetration.y - bodyA.positionImpulse.y);
                  }
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs2[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.parentA;
                    bodyB = collision.parentB;
                    normal = collision.normal;
                    positionImpulse = pair.separation - pair.slop * slopDampen;
                    if (bodyA.isStatic || bodyB.isStatic)
                      positionImpulse *= 2;
                    if (!(bodyA.isStatic || bodyA.isSleeping)) {
                      contactShare = positionDampen / bodyA.totalContacts;
                      bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
                      bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
                    }
                    if (!(bodyB.isStatic || bodyB.isSleeping)) {
                      contactShare = positionDampen / bodyB.totalContacts;
                      bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
                      bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
                    }
                  }
                };
                Resolver.postSolvePosition = function(bodies) {
                  var positionWarming = Resolver._positionWarming, bodiesLength = bodies.length, verticesTranslate = Vertices2.translate, boundsUpdate = Bounds2.update;
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i], positionImpulse = body.positionImpulse, positionImpulseX = positionImpulse.x, positionImpulseY = positionImpulse.y, velocity = body.velocity;
                    body.totalContacts = 0;
                    if (positionImpulseX !== 0 || positionImpulseY !== 0) {
                      for (var j = 0; j < body.parts.length; j++) {
                        var part = body.parts[j];
                        verticesTranslate(part.vertices, positionImpulse);
                        boundsUpdate(part.bounds, part.vertices, velocity);
                        part.position.x += positionImpulseX;
                        part.position.y += positionImpulseY;
                      }
                      body.positionPrev.x += positionImpulseX;
                      body.positionPrev.y += positionImpulseY;
                      if (positionImpulseX * velocity.x + positionImpulseY * velocity.y < 0) {
                        positionImpulse.x = 0;
                        positionImpulse.y = 0;
                      } else {
                        positionImpulse.x *= positionWarming;
                        positionImpulse.y *= positionWarming;
                      }
                    }
                  }
                };
                Resolver.preSolveVelocity = function(pairs2) {
                  var pairsLength = pairs2.length, i, j;
                  for (i = 0; i < pairsLength; i++) {
                    var pair = pairs2[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    var contacts = pair.activeContacts, contactsLength = contacts.length, collision = pair.collision, bodyA = collision.parentA, bodyB = collision.parentB, normal = collision.normal, tangent = collision.tangent;
                    for (j = 0; j < contactsLength; j++) {
                      var contact = contacts[j], contactVertex = contact.vertex, normalImpulse = contact.normalImpulse, tangentImpulse = contact.tangentImpulse;
                      if (normalImpulse !== 0 || tangentImpulse !== 0) {
                        var impulseX = normal.x * normalImpulse + tangent.x * tangentImpulse, impulseY = normal.y * normalImpulse + tangent.y * tangentImpulse;
                        if (!(bodyA.isStatic || bodyA.isSleeping)) {
                          bodyA.positionPrev.x += impulseX * bodyA.inverseMass;
                          bodyA.positionPrev.y += impulseY * bodyA.inverseMass;
                          bodyA.anglePrev += bodyA.inverseInertia * ((contactVertex.x - bodyA.position.x) * impulseY - (contactVertex.y - bodyA.position.y) * impulseX);
                        }
                        if (!(bodyB.isStatic || bodyB.isSleeping)) {
                          bodyB.positionPrev.x -= impulseX * bodyB.inverseMass;
                          bodyB.positionPrev.y -= impulseY * bodyB.inverseMass;
                          bodyB.anglePrev -= bodyB.inverseInertia * ((contactVertex.x - bodyB.position.x) * impulseY - (contactVertex.y - bodyB.position.y) * impulseX);
                        }
                      }
                    }
                  }
                };
                Resolver.solveVelocity = function(pairs2, delta) {
                  var timeScale = delta / Common2._baseDelta, timeScaleSquared = timeScale * timeScale, timeScaleCubed = timeScaleSquared * timeScale, restingThresh = -Resolver._restingThresh * timeScale, restingThreshTangent = Resolver._restingThreshTangent, frictionNormalMultiplier = Resolver._frictionNormalMultiplier * timeScale, frictionMaxStatic = Resolver._frictionMaxStatic, pairsLength = pairs2.length, tangentImpulse, maxFriction, i, j;
                  for (i = 0; i < pairsLength; i++) {
                    var pair = pairs2[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    var collision = pair.collision, bodyA = collision.parentA, bodyB = collision.parentB, bodyAVelocity = bodyA.velocity, bodyBVelocity = bodyB.velocity, normalX = collision.normal.x, normalY = collision.normal.y, tangentX = collision.tangent.x, tangentY = collision.tangent.y, contacts = pair.activeContacts, contactsLength = contacts.length, contactShare = 1 / contactsLength, inverseMassTotal = bodyA.inverseMass + bodyB.inverseMass, friction = pair.friction * pair.frictionStatic * frictionNormalMultiplier;
                    bodyAVelocity.x = bodyA.position.x - bodyA.positionPrev.x;
                    bodyAVelocity.y = bodyA.position.y - bodyA.positionPrev.y;
                    bodyBVelocity.x = bodyB.position.x - bodyB.positionPrev.x;
                    bodyBVelocity.y = bodyB.position.y - bodyB.positionPrev.y;
                    bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
                    bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;
                    for (j = 0; j < contactsLength; j++) {
                      var contact = contacts[j], contactVertex = contact.vertex;
                      var offsetAX = contactVertex.x - bodyA.position.x, offsetAY = contactVertex.y - bodyA.position.y, offsetBX = contactVertex.x - bodyB.position.x, offsetBY = contactVertex.y - bodyB.position.y;
                      var velocityPointAX = bodyAVelocity.x - offsetAY * bodyA.angularVelocity, velocityPointAY = bodyAVelocity.y + offsetAX * bodyA.angularVelocity, velocityPointBX = bodyBVelocity.x - offsetBY * bodyB.angularVelocity, velocityPointBY = bodyBVelocity.y + offsetBX * bodyB.angularVelocity;
                      var relativeVelocityX = velocityPointAX - velocityPointBX, relativeVelocityY = velocityPointAY - velocityPointBY;
                      var normalVelocity = normalX * relativeVelocityX + normalY * relativeVelocityY, tangentVelocity = tangentX * relativeVelocityX + tangentY * relativeVelocityY;
                      var normalOverlap = pair.separation + normalVelocity;
                      var normalForce = Math.min(normalOverlap, 1);
                      normalForce = normalOverlap < 0 ? 0 : normalForce;
                      var frictionLimit = normalForce * friction;
                      if (tangentVelocity < -frictionLimit || tangentVelocity > frictionLimit) {
                        maxFriction = tangentVelocity > 0 ? tangentVelocity : -tangentVelocity;
                        tangentImpulse = pair.friction * (tangentVelocity > 0 ? 1 : -1) * timeScaleCubed;
                        if (tangentImpulse < -maxFriction) {
                          tangentImpulse = -maxFriction;
                        } else if (tangentImpulse > maxFriction) {
                          tangentImpulse = maxFriction;
                        }
                      } else {
                        tangentImpulse = tangentVelocity;
                        maxFriction = frictionMaxStatic;
                      }
                      var oAcN = offsetAX * normalY - offsetAY * normalX, oBcN = offsetBX * normalY - offsetBY * normalX, share = contactShare / (inverseMassTotal + bodyA.inverseInertia * oAcN * oAcN + bodyB.inverseInertia * oBcN * oBcN);
                      var normalImpulse = (1 + pair.restitution) * normalVelocity * share;
                      tangentImpulse *= share;
                      if (normalVelocity < restingThresh) {
                        contact.normalImpulse = 0;
                      } else {
                        var contactNormalImpulse = contact.normalImpulse;
                        contact.normalImpulse += normalImpulse;
                        if (contact.normalImpulse > 0) contact.normalImpulse = 0;
                        normalImpulse = contact.normalImpulse - contactNormalImpulse;
                      }
                      if (tangentVelocity < -restingThreshTangent || tangentVelocity > restingThreshTangent) {
                        contact.tangentImpulse = 0;
                      } else {
                        var contactTangentImpulse = contact.tangentImpulse;
                        contact.tangentImpulse += tangentImpulse;
                        if (contact.tangentImpulse < -maxFriction) contact.tangentImpulse = -maxFriction;
                        if (contact.tangentImpulse > maxFriction) contact.tangentImpulse = maxFriction;
                        tangentImpulse = contact.tangentImpulse - contactTangentImpulse;
                      }
                      var impulseX = normalX * normalImpulse + tangentX * tangentImpulse, impulseY = normalY * normalImpulse + tangentY * tangentImpulse;
                      if (!(bodyA.isStatic || bodyA.isSleeping)) {
                        bodyA.positionPrev.x += impulseX * bodyA.inverseMass;
                        bodyA.positionPrev.y += impulseY * bodyA.inverseMass;
                        bodyA.anglePrev += (offsetAX * impulseY - offsetAY * impulseX) * bodyA.inverseInertia;
                      }
                      if (!(bodyB.isStatic || bodyB.isSleeping)) {
                        bodyB.positionPrev.x -= impulseX * bodyB.inverseMass;
                        bodyB.positionPrev.y -= impulseY * bodyB.inverseMass;
                        bodyB.anglePrev -= (offsetBX * impulseY - offsetBY * impulseX) * bodyB.inverseInertia;
                      }
                    }
                  }
                };
              })();
            }),
            /* 19 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Pairs = {};
              module2.exports = Pairs;
              var Pair = __webpack_require__(9);
              var Common2 = __webpack_require__(0);
              (function() {
                Pairs.create = function(options) {
                  return Common2.extend({
                    table: {},
                    list: [],
                    collisionStart: [],
                    collisionActive: [],
                    collisionEnd: []
                  }, options);
                };
                Pairs.update = function(pairs2, collisions, timestamp) {
                  var pairsList = pairs2.list, pairsListLength = pairsList.length, pairsTable = pairs2.table, collisionsLength = collisions.length, collisionStart = pairs2.collisionStart, collisionEnd = pairs2.collisionEnd, collisionActive = pairs2.collisionActive, collision, pairIndex, pair, i;
                  collisionStart.length = 0;
                  collisionEnd.length = 0;
                  collisionActive.length = 0;
                  for (i = 0; i < pairsListLength; i++) {
                    pairsList[i].confirmedActive = false;
                  }
                  for (i = 0; i < collisionsLength; i++) {
                    collision = collisions[i];
                    pair = collision.pair;
                    if (pair) {
                      if (pair.isActive) {
                        collisionActive.push(pair);
                      } else {
                        collisionStart.push(pair);
                      }
                      Pair.update(pair, collision, timestamp);
                      pair.confirmedActive = true;
                    } else {
                      pair = Pair.create(collision, timestamp);
                      pairsTable[pair.id] = pair;
                      collisionStart.push(pair);
                      pairsList.push(pair);
                    }
                  }
                  var removePairIndex = [];
                  pairsListLength = pairsList.length;
                  for (i = 0; i < pairsListLength; i++) {
                    pair = pairsList[i];
                    if (!pair.confirmedActive) {
                      Pair.setActive(pair, false, timestamp);
                      collisionEnd.push(pair);
                      if (!pair.collision.bodyA.isSleeping && !pair.collision.bodyB.isSleeping) {
                        removePairIndex.push(i);
                      }
                    }
                  }
                  for (i = 0; i < removePairIndex.length; i++) {
                    pairIndex = removePairIndex[i] - i;
                    pair = pairsList[pairIndex];
                    pairsList.splice(pairIndex, 1);
                    delete pairsTable[pair.id];
                  }
                };
                Pairs.clear = function(pairs2) {
                  pairs2.table = {};
                  pairs2.list.length = 0;
                  pairs2.collisionStart.length = 0;
                  pairs2.collisionActive.length = 0;
                  pairs2.collisionEnd.length = 0;
                  return pairs2;
                };
              })();
            }),
            /* 20 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Matter2 = module2.exports = __webpack_require__(21);
              Matter2.Axes = __webpack_require__(11);
              Matter2.Bodies = __webpack_require__(12);
              Matter2.Body = __webpack_require__(4);
              Matter2.Bounds = __webpack_require__(1);
              Matter2.Collision = __webpack_require__(8);
              Matter2.Common = __webpack_require__(0);
              Matter2.Composite = __webpack_require__(6);
              Matter2.Composites = __webpack_require__(22);
              Matter2.Constraint = __webpack_require__(10);
              Matter2.Contact = __webpack_require__(16);
              Matter2.Detector = __webpack_require__(13);
              Matter2.Engine = __webpack_require__(17);
              Matter2.Events = __webpack_require__(5);
              Matter2.Grid = __webpack_require__(23);
              Matter2.Mouse = __webpack_require__(14);
              Matter2.MouseConstraint = __webpack_require__(24);
              Matter2.Pair = __webpack_require__(9);
              Matter2.Pairs = __webpack_require__(19);
              Matter2.Plugin = __webpack_require__(15);
              Matter2.Query = __webpack_require__(25);
              Matter2.Render = __webpack_require__(26);
              Matter2.Resolver = __webpack_require__(18);
              Matter2.Runner = __webpack_require__(27);
              Matter2.SAT = __webpack_require__(28);
              Matter2.Sleeping = __webpack_require__(7);
              Matter2.Svg = __webpack_require__(29);
              Matter2.Vector = __webpack_require__(2);
              Matter2.Vertices = __webpack_require__(3);
              Matter2.World = __webpack_require__(30);
              Matter2.Engine.run = Matter2.Runner.run;
              Matter2.Common.deprecated(Matter2.Engine, "run", "Engine.run \u27A4 use Matter.Runner.run(engine) instead");
            }),
            /* 21 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Matter2 = {};
              module2.exports = Matter2;
              var Plugin = __webpack_require__(15);
              var Common2 = __webpack_require__(0);
              (function() {
                Matter2.name = "matter-js";
                Matter2.version = true ? "0.19.0" : void 0;
                Matter2.uses = [];
                Matter2.used = [];
                Matter2.use = function() {
                  Plugin.use(Matter2, Array.prototype.slice.call(arguments));
                };
                Matter2.before = function(path, func) {
                  path = path.replace(/^Matter./, "");
                  return Common2.chainPathBefore(Matter2, path, func);
                };
                Matter2.after = function(path, func) {
                  path = path.replace(/^Matter./, "");
                  return Common2.chainPathAfter(Matter2, path, func);
                };
              })();
            }),
            /* 22 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Composites = {};
              module2.exports = Composites;
              var Composite2 = __webpack_require__(6);
              var Constraint2 = __webpack_require__(10);
              var Common2 = __webpack_require__(0);
              var Body2 = __webpack_require__(4);
              var Bodies2 = __webpack_require__(12);
              var deprecated = Common2.deprecated;
              (function() {
                Composites.stack = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
                  var stack = Composite2.create({ label: "Stack" }), x = xx, y = yy, lastBody, i = 0;
                  for (var row = 0; row < rows; row++) {
                    var maxHeight = 0;
                    for (var column2 = 0; column2 < columns; column2++) {
                      var body = callback(x, y, column2, row, lastBody, i);
                      if (body) {
                        var bodyHeight = body.bounds.max.y - body.bounds.min.y, bodyWidth = body.bounds.max.x - body.bounds.min.x;
                        if (bodyHeight > maxHeight)
                          maxHeight = bodyHeight;
                        Body2.translate(body, { x: bodyWidth * 0.5, y: bodyHeight * 0.5 });
                        x = body.bounds.max.x + columnGap;
                        Composite2.addBody(stack, body);
                        lastBody = body;
                        i += 1;
                      } else {
                        x += columnGap;
                      }
                    }
                    y += maxHeight + rowGap;
                    x = xx;
                  }
                  return stack;
                };
                Composites.chain = function(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
                  var bodies = composite.bodies;
                  for (var i = 1; i < bodies.length; i++) {
                    var bodyA = bodies[i - 1], bodyB = bodies[i], bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y, bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x, bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y, bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
                    var defaults = {
                      bodyA,
                      pointA: { x: bodyAWidth * xOffsetA, y: bodyAHeight * yOffsetA },
                      bodyB,
                      pointB: { x: bodyBWidth * xOffsetB, y: bodyBHeight * yOffsetB }
                    };
                    var constraint = Common2.extend(defaults, options);
                    Composite2.addConstraint(composite, Constraint2.create(constraint));
                  }
                  composite.label += " Chain";
                  return composite;
                };
                Composites.mesh = function(composite, columns, rows, crossBrace, options) {
                  var bodies = composite.bodies, row, col, bodyA, bodyB, bodyC;
                  for (row = 0; row < rows; row++) {
                    for (col = 1; col < columns; col++) {
                      bodyA = bodies[col - 1 + row * columns];
                      bodyB = bodies[col + row * columns];
                      Composite2.addConstraint(composite, Constraint2.create(Common2.extend({ bodyA, bodyB }, options)));
                    }
                    if (row > 0) {
                      for (col = 0; col < columns; col++) {
                        bodyA = bodies[col + (row - 1) * columns];
                        bodyB = bodies[col + row * columns];
                        Composite2.addConstraint(composite, Constraint2.create(Common2.extend({ bodyA, bodyB }, options)));
                        if (crossBrace && col > 0) {
                          bodyC = bodies[col - 1 + (row - 1) * columns];
                          Composite2.addConstraint(composite, Constraint2.create(Common2.extend({ bodyA: bodyC, bodyB }, options)));
                        }
                        if (crossBrace && col < columns - 1) {
                          bodyC = bodies[col + 1 + (row - 1) * columns];
                          Composite2.addConstraint(composite, Constraint2.create(Common2.extend({ bodyA: bodyC, bodyB }, options)));
                        }
                      }
                    }
                  }
                  composite.label += " Mesh";
                  return composite;
                };
                Composites.pyramid = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
                  return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column2, row, lastBody, i) {
                    var actualRows = Math.min(rows, Math.ceil(columns / 2)), lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
                    if (row > actualRows)
                      return;
                    row = actualRows - row;
                    var start = row, end = columns - 1 - row;
                    if (column2 < start || column2 > end)
                      return;
                    if (i === 1) {
                      Body2.translate(lastBody, { x: (column2 + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
                    }
                    var xOffset = lastBody ? column2 * lastBodyWidth : 0;
                    return callback(xx + xOffset + column2 * columnGap, y, column2, row, lastBody, i);
                  });
                };
                Composites.newtonsCradle = function(xx, yy, number, size, length) {
                  var newtonsCradle = Composite2.create({ label: "Newtons Cradle" });
                  for (var i = 0; i < number; i++) {
                    var separation = 1.9, circle = Bodies2.circle(
                      xx + i * (size * separation),
                      yy + length,
                      size,
                      { inertia: Infinity, restitution: 1, friction: 0, frictionAir: 1e-4, slop: 1 }
                    ), constraint = Constraint2.create({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });
                    Composite2.addBody(newtonsCradle, circle);
                    Composite2.addConstraint(newtonsCradle, constraint);
                  }
                  return newtonsCradle;
                };
                deprecated(Composites, "newtonsCradle", "Composites.newtonsCradle \u27A4 moved to newtonsCradle example");
                Composites.car = function(xx, yy, width, height, wheelSize) {
                  var group = Body2.nextGroup(true), wheelBase = 20, wheelAOffset = -width * 0.5 + wheelBase, wheelBOffset = width * 0.5 - wheelBase, wheelYOffset = 0;
                  var car = Composite2.create({ label: "Car" }), body = Bodies2.rectangle(xx, yy, width, height, {
                    collisionFilter: {
                      group
                    },
                    chamfer: {
                      radius: height * 0.5
                    },
                    density: 2e-4
                  });
                  var wheelA = Bodies2.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, {
                    collisionFilter: {
                      group
                    },
                    friction: 0.8
                  });
                  var wheelB = Bodies2.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
                    collisionFilter: {
                      group
                    },
                    friction: 0.8
                  });
                  var axelA = Constraint2.create({
                    bodyB: body,
                    pointB: { x: wheelAOffset, y: wheelYOffset },
                    bodyA: wheelA,
                    stiffness: 1,
                    length: 0
                  });
                  var axelB = Constraint2.create({
                    bodyB: body,
                    pointB: { x: wheelBOffset, y: wheelYOffset },
                    bodyA: wheelB,
                    stiffness: 1,
                    length: 0
                  });
                  Composite2.addBody(car, body);
                  Composite2.addBody(car, wheelA);
                  Composite2.addBody(car, wheelB);
                  Composite2.addConstraint(car, axelA);
                  Composite2.addConstraint(car, axelB);
                  return car;
                };
                deprecated(Composites, "car", "Composites.car \u27A4 moved to car example");
                Composites.softBody = function(xx, yy, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
                  particleOptions = Common2.extend({ inertia: Infinity }, particleOptions);
                  constraintOptions = Common2.extend({ stiffness: 0.2, render: { type: "line", anchors: false } }, constraintOptions);
                  var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y) {
                    return Bodies2.circle(x, y, particleRadius, particleOptions);
                  });
                  Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);
                  softBody.label = "Soft Body";
                  return softBody;
                };
                deprecated(Composites, "softBody", "Composites.softBody \u27A4 moved to softBody and cloth examples");
              })();
            }),
            /* 23 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Grid = {};
              module2.exports = Grid;
              var Pair = __webpack_require__(9);
              var Common2 = __webpack_require__(0);
              var deprecated = Common2.deprecated;
              (function() {
                Grid.create = function(options) {
                  var defaults = {
                    buckets: {},
                    pairs: {},
                    pairsList: [],
                    bucketWidth: 48,
                    bucketHeight: 48
                  };
                  return Common2.extend(defaults, options);
                };
                Grid.update = function(grid, bodies, engine2, forceUpdate) {
                  var i, col, row, world = engine2.world, buckets = grid.buckets, bucket, bucketId, gridChanged = false;
                  for (i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (body.isSleeping && !forceUpdate)
                      continue;
                    if (world.bounds && (body.bounds.max.x < world.bounds.min.x || body.bounds.min.x > world.bounds.max.x || body.bounds.max.y < world.bounds.min.y || body.bounds.min.y > world.bounds.max.y))
                      continue;
                    var newRegion = Grid._getRegion(grid, body);
                    if (!body.region || newRegion.id !== body.region.id || forceUpdate) {
                      if (!body.region || forceUpdate)
                        body.region = newRegion;
                      var union = Grid._regionUnion(newRegion, body.region);
                      for (col = union.startCol; col <= union.endCol; col++) {
                        for (row = union.startRow; row <= union.endRow; row++) {
                          bucketId = Grid._getBucketId(col, row);
                          bucket = buckets[bucketId];
                          var isInsideNewRegion = col >= newRegion.startCol && col <= newRegion.endCol && row >= newRegion.startRow && row <= newRegion.endRow;
                          var isInsideOldRegion = col >= body.region.startCol && col <= body.region.endCol && row >= body.region.startRow && row <= body.region.endRow;
                          if (!isInsideNewRegion && isInsideOldRegion) {
                            if (isInsideOldRegion) {
                              if (bucket)
                                Grid._bucketRemoveBody(grid, bucket, body);
                            }
                          }
                          if (body.region === newRegion || isInsideNewRegion && !isInsideOldRegion || forceUpdate) {
                            if (!bucket)
                              bucket = Grid._createBucket(buckets, bucketId);
                            Grid._bucketAddBody(grid, bucket, body);
                          }
                        }
                      }
                      body.region = newRegion;
                      gridChanged = true;
                    }
                  }
                  if (gridChanged)
                    grid.pairsList = Grid._createActivePairsList(grid);
                };
                deprecated(Grid, "update", "Grid.update \u27A4 replaced by Matter.Detector");
                Grid.clear = function(grid) {
                  grid.buckets = {};
                  grid.pairs = {};
                  grid.pairsList = [];
                };
                deprecated(Grid, "clear", "Grid.clear \u27A4 replaced by Matter.Detector");
                Grid._regionUnion = function(regionA, regionB) {
                  var startCol = Math.min(regionA.startCol, regionB.startCol), endCol = Math.max(regionA.endCol, regionB.endCol), startRow = Math.min(regionA.startRow, regionB.startRow), endRow = Math.max(regionA.endRow, regionB.endRow);
                  return Grid._createRegion(startCol, endCol, startRow, endRow);
                };
                Grid._getRegion = function(grid, body) {
                  var bounds = body.bounds, startCol = Math.floor(bounds.min.x / grid.bucketWidth), endCol = Math.floor(bounds.max.x / grid.bucketWidth), startRow = Math.floor(bounds.min.y / grid.bucketHeight), endRow = Math.floor(bounds.max.y / grid.bucketHeight);
                  return Grid._createRegion(startCol, endCol, startRow, endRow);
                };
                Grid._createRegion = function(startCol, endCol, startRow, endRow) {
                  return {
                    id: startCol + "," + endCol + "," + startRow + "," + endRow,
                    startCol,
                    endCol,
                    startRow,
                    endRow
                  };
                };
                Grid._getBucketId = function(column2, row) {
                  return "C" + column2 + "R" + row;
                };
                Grid._createBucket = function(buckets, bucketId) {
                  var bucket = buckets[bucketId] = [];
                  return bucket;
                };
                Grid._bucketAddBody = function(grid, bucket, body) {
                  var gridPairs = grid.pairs, pairId = Pair.id, bucketLength = bucket.length, i;
                  for (i = 0; i < bucketLength; i++) {
                    var bodyB = bucket[i];
                    if (body.id === bodyB.id || body.isStatic && bodyB.isStatic)
                      continue;
                    var id = pairId(body, bodyB), pair = gridPairs[id];
                    if (pair) {
                      pair[2] += 1;
                    } else {
                      gridPairs[id] = [body, bodyB, 1];
                    }
                  }
                  bucket.push(body);
                };
                Grid._bucketRemoveBody = function(grid, bucket, body) {
                  var gridPairs = grid.pairs, pairId = Pair.id, i;
                  bucket.splice(Common2.indexOf(bucket, body), 1);
                  var bucketLength = bucket.length;
                  for (i = 0; i < bucketLength; i++) {
                    var pair = gridPairs[pairId(body, bucket[i])];
                    if (pair)
                      pair[2] -= 1;
                  }
                };
                Grid._createActivePairsList = function(grid) {
                  var pair, gridPairs = grid.pairs, pairKeys = Common2.keys(gridPairs), pairKeysLength = pairKeys.length, pairs2 = [], k;
                  for (k = 0; k < pairKeysLength; k++) {
                    pair = gridPairs[pairKeys[k]];
                    if (pair[2] > 0) {
                      pairs2.push(pair);
                    } else {
                      delete gridPairs[pairKeys[k]];
                    }
                  }
                  return pairs2;
                };
              })();
            }),
            /* 24 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var MouseConstraint = {};
              module2.exports = MouseConstraint;
              var Vertices2 = __webpack_require__(3);
              var Sleeping = __webpack_require__(7);
              var Mouse = __webpack_require__(14);
              var Events2 = __webpack_require__(5);
              var Detector = __webpack_require__(13);
              var Constraint2 = __webpack_require__(10);
              var Composite2 = __webpack_require__(6);
              var Common2 = __webpack_require__(0);
              var Bounds2 = __webpack_require__(1);
              (function() {
                MouseConstraint.create = function(engine2, options) {
                  var mouse2 = (engine2 ? engine2.mouse : null) || (options ? options.mouse : null);
                  if (!mouse2) {
                    if (engine2 && engine2.render && engine2.render.canvas) {
                      mouse2 = Mouse.create(engine2.render.canvas);
                    } else if (options && options.element) {
                      mouse2 = Mouse.create(options.element);
                    } else {
                      mouse2 = Mouse.create();
                      Common2.warn("MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected");
                    }
                  }
                  var constraint = Constraint2.create({
                    label: "Mouse Constraint",
                    pointA: mouse2.position,
                    pointB: { x: 0, y: 0 },
                    length: 0.01,
                    stiffness: 0.1,
                    angularStiffness: 1,
                    render: {
                      strokeStyle: "#90EE90",
                      lineWidth: 3
                    }
                  });
                  var defaults = {
                    type: "mouseConstraint",
                    mouse: mouse2,
                    element: null,
                    body: null,
                    constraint,
                    collisionFilter: {
                      category: 1,
                      mask: 4294967295,
                      group: 0
                    }
                  };
                  var mouseConstraint = Common2.extend(defaults, options);
                  Events2.on(engine2, "beforeUpdate", function() {
                    var allBodies2 = Composite2.allBodies(engine2.world);
                    MouseConstraint.update(mouseConstraint, allBodies2);
                    MouseConstraint._triggerEvents(mouseConstraint);
                  });
                  return mouseConstraint;
                };
                MouseConstraint.update = function(mouseConstraint, bodies) {
                  var mouse2 = mouseConstraint.mouse, constraint = mouseConstraint.constraint, body = mouseConstraint.body;
                  if (mouse2.button === 0) {
                    if (!constraint.bodyB) {
                      for (var i = 0; i < bodies.length; i++) {
                        body = bodies[i];
                        if (Bounds2.contains(body.bounds, mouse2.position) && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                          for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices2.contains(part.vertices, mouse2.position)) {
                              constraint.pointA = mouse2.position;
                              constraint.bodyB = mouseConstraint.body = body;
                              constraint.pointB = { x: mouse2.position.x - body.position.x, y: mouse2.position.y - body.position.y };
                              constraint.angleB = body.angle;
                              Sleeping.set(body, false);
                              Events2.trigger(mouseConstraint, "startdrag", { mouse: mouse2, body });
                              break;
                            }
                          }
                        }
                      }
                    } else {
                      Sleeping.set(constraint.bodyB, false);
                      constraint.pointA = mouse2.position;
                    }
                  } else {
                    constraint.bodyB = mouseConstraint.body = null;
                    constraint.pointB = null;
                    if (body)
                      Events2.trigger(mouseConstraint, "enddrag", { mouse: mouse2, body });
                  }
                };
                MouseConstraint._triggerEvents = function(mouseConstraint) {
                  var mouse2 = mouseConstraint.mouse, mouseEvents = mouse2.sourceEvents;
                  if (mouseEvents.mousemove)
                    Events2.trigger(mouseConstraint, "mousemove", { mouse: mouse2 });
                  if (mouseEvents.mousedown)
                    Events2.trigger(mouseConstraint, "mousedown", { mouse: mouse2 });
                  if (mouseEvents.mouseup)
                    Events2.trigger(mouseConstraint, "mouseup", { mouse: mouse2 });
                  Mouse.clearSourceEvents(mouse2);
                };
              })();
            }),
            /* 25 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Query2 = {};
              module2.exports = Query2;
              var Vector2 = __webpack_require__(2);
              var Collision = __webpack_require__(8);
              var Bounds2 = __webpack_require__(1);
              var Bodies2 = __webpack_require__(12);
              var Vertices2 = __webpack_require__(3);
              (function() {
                Query2.collides = function(body, bodies) {
                  var collisions = [], bodiesLength = bodies.length, bounds = body.bounds, collides = Collision.collides, overlaps = Bounds2.overlaps;
                  for (var i = 0; i < bodiesLength; i++) {
                    var bodyA = bodies[i], partsALength = bodyA.parts.length, partsAStart = partsALength === 1 ? 0 : 1;
                    if (overlaps(bodyA.bounds, bounds)) {
                      for (var j = partsAStart; j < partsALength; j++) {
                        var part = bodyA.parts[j];
                        if (overlaps(part.bounds, bounds)) {
                          var collision = collides(part, body);
                          if (collision) {
                            collisions.push(collision);
                            break;
                          }
                        }
                      }
                    }
                  }
                  return collisions;
                };
                Query2.ray = function(bodies, startPoint, endPoint, rayWidth) {
                  rayWidth = rayWidth || 1e-100;
                  var rayAngle = Vector2.angle(startPoint, endPoint), rayLength = Vector2.magnitude(Vector2.sub(startPoint, endPoint)), rayX = (endPoint.x + startPoint.x) * 0.5, rayY = (endPoint.y + startPoint.y) * 0.5, ray = Bodies2.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }), collisions = Query2.collides(ray, bodies);
                  for (var i = 0; i < collisions.length; i += 1) {
                    var collision = collisions[i];
                    collision.body = collision.bodyB = collision.bodyA;
                  }
                  return collisions;
                };
                Query2.region = function(bodies, bounds, outside) {
                  var result = [];
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], overlaps = Bounds2.overlaps(body.bounds, bounds);
                    if (overlaps && !outside || !overlaps && outside)
                      result.push(body);
                  }
                  return result;
                };
                Query2.point = function(bodies, point) {
                  var result = [];
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (Bounds2.contains(body.bounds, point)) {
                      for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                        var part = body.parts[j];
                        if (Bounds2.contains(part.bounds, point) && Vertices2.contains(part.vertices, point)) {
                          result.push(body);
                          break;
                        }
                      }
                    }
                  }
                  return result;
                };
              })();
            }),
            /* 26 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Render = {};
              module2.exports = Render;
              var Body2 = __webpack_require__(4);
              var Common2 = __webpack_require__(0);
              var Composite2 = __webpack_require__(6);
              var Bounds2 = __webpack_require__(1);
              var Events2 = __webpack_require__(5);
              var Vector2 = __webpack_require__(2);
              var Mouse = __webpack_require__(14);
              (function() {
                var _requestAnimationFrame, _cancelAnimationFrame;
                if (typeof window !== "undefined") {
                  _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                    window.setTimeout(function() {
                      callback(Common2.now());
                    }, 1e3 / 60);
                  };
                  _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
                }
                Render._goodFps = 30;
                Render._goodDelta = 1e3 / 60;
                Render.create = function(options) {
                  var defaults = {
                    engine: null,
                    element: null,
                    canvas: null,
                    mouse: null,
                    frameRequestId: null,
                    timing: {
                      historySize: 60,
                      delta: 0,
                      deltaHistory: [],
                      lastTime: 0,
                      lastTimestamp: 0,
                      lastElapsed: 0,
                      timestampElapsed: 0,
                      timestampElapsedHistory: [],
                      engineDeltaHistory: [],
                      engineElapsedHistory: [],
                      elapsedHistory: []
                    },
                    options: {
                      width: 800,
                      height: 600,
                      pixelRatio: 1,
                      background: "#14151f",
                      wireframeBackground: "#14151f",
                      hasBounds: !!options.bounds,
                      enabled: true,
                      wireframes: true,
                      showSleeping: true,
                      showDebug: false,
                      showStats: false,
                      showPerformance: false,
                      showBounds: false,
                      showVelocity: false,
                      showCollisions: false,
                      showSeparations: false,
                      showAxes: false,
                      showPositions: false,
                      showAngleIndicator: false,
                      showIds: false,
                      showVertexNumbers: false,
                      showConvexHulls: false,
                      showInternalEdges: false,
                      showMousePosition: false
                    }
                  };
                  var render = Common2.extend(defaults, options);
                  if (render.canvas) {
                    render.canvas.width = render.options.width || render.canvas.width;
                    render.canvas.height = render.options.height || render.canvas.height;
                  }
                  render.mouse = options.mouse;
                  render.engine = options.engine;
                  render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
                  render.context = render.canvas.getContext("2d");
                  render.textures = {};
                  render.bounds = render.bounds || {
                    min: {
                      x: 0,
                      y: 0
                    },
                    max: {
                      x: render.canvas.width,
                      y: render.canvas.height
                    }
                  };
                  render.controller = Render;
                  render.options.showBroadphase = false;
                  if (render.options.pixelRatio !== 1) {
                    Render.setPixelRatio(render, render.options.pixelRatio);
                  }
                  if (Common2.isElement(render.element)) {
                    render.element.appendChild(render.canvas);
                  }
                  return render;
                };
                Render.run = function(render) {
                  (function loop2(time) {
                    render.frameRequestId = _requestAnimationFrame(loop2);
                    _updateTiming(render, time);
                    Render.world(render, time);
                    if (render.options.showStats || render.options.showDebug) {
                      Render.stats(render, render.context, time);
                    }
                    if (render.options.showPerformance || render.options.showDebug) {
                      Render.performance(render, render.context, time);
                    }
                  })();
                };
                Render.stop = function(render) {
                  _cancelAnimationFrame(render.frameRequestId);
                };
                Render.setPixelRatio = function(render, pixelRatio) {
                  var options = render.options, canvas3 = render.canvas;
                  if (pixelRatio === "auto") {
                    pixelRatio = _getPixelRatio(canvas3);
                  }
                  options.pixelRatio = pixelRatio;
                  canvas3.setAttribute("data-pixel-ratio", pixelRatio);
                  canvas3.width = options.width * pixelRatio;
                  canvas3.height = options.height * pixelRatio;
                  canvas3.style.width = options.width + "px";
                  canvas3.style.height = options.height + "px";
                };
                Render.lookAt = function(render, objects, padding, center) {
                  center = typeof center !== "undefined" ? center : true;
                  objects = Common2.isArray(objects) ? objects : [objects];
                  padding = padding || {
                    x: 0,
                    y: 0
                  };
                  var bounds = {
                    min: { x: Infinity, y: Infinity },
                    max: { x: -Infinity, y: -Infinity }
                  };
                  for (var i = 0; i < objects.length; i += 1) {
                    var object = objects[i], min = object.bounds ? object.bounds.min : object.min || object.position || object, max = object.bounds ? object.bounds.max : object.max || object.position || object;
                    if (min && max) {
                      if (min.x < bounds.min.x)
                        bounds.min.x = min.x;
                      if (max.x > bounds.max.x)
                        bounds.max.x = max.x;
                      if (min.y < bounds.min.y)
                        bounds.min.y = min.y;
                      if (max.y > bounds.max.y)
                        bounds.max.y = max.y;
                    }
                  }
                  var width = bounds.max.x - bounds.min.x + 2 * padding.x, height = bounds.max.y - bounds.min.y + 2 * padding.y, viewHeight = render.canvas.height, viewWidth = render.canvas.width, outerRatio = viewWidth / viewHeight, innerRatio = width / height, scaleX = 1, scaleY = 1;
                  if (innerRatio > outerRatio) {
                    scaleY = innerRatio / outerRatio;
                  } else {
                    scaleX = outerRatio / innerRatio;
                  }
                  render.options.hasBounds = true;
                  render.bounds.min.x = bounds.min.x;
                  render.bounds.max.x = bounds.min.x + width * scaleX;
                  render.bounds.min.y = bounds.min.y;
                  render.bounds.max.y = bounds.min.y + height * scaleY;
                  if (center) {
                    render.bounds.min.x += width * 0.5 - width * scaleX * 0.5;
                    render.bounds.max.x += width * 0.5 - width * scaleX * 0.5;
                    render.bounds.min.y += height * 0.5 - height * scaleY * 0.5;
                    render.bounds.max.y += height * 0.5 - height * scaleY * 0.5;
                  }
                  render.bounds.min.x -= padding.x;
                  render.bounds.max.x -= padding.x;
                  render.bounds.min.y -= padding.y;
                  render.bounds.max.y -= padding.y;
                  if (render.mouse) {
                    Mouse.setScale(render.mouse, {
                      x: (render.bounds.max.x - render.bounds.min.x) / render.canvas.width,
                      y: (render.bounds.max.y - render.bounds.min.y) / render.canvas.height
                    });
                    Mouse.setOffset(render.mouse, render.bounds.min);
                  }
                };
                Render.startViewTransform = function(render) {
                  var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / render.options.width, boundsScaleY = boundsHeight / render.options.height;
                  render.context.setTransform(
                    render.options.pixelRatio / boundsScaleX,
                    0,
                    0,
                    render.options.pixelRatio / boundsScaleY,
                    0,
                    0
                  );
                  render.context.translate(-render.bounds.min.x, -render.bounds.min.y);
                };
                Render.endViewTransform = function(render) {
                  render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
                };
                Render.world = function(render, time) {
                  var startTime = Common2.now(), engine2 = render.engine, world = engine2.world, canvas3 = render.canvas, context = render.context, options = render.options, timing = render.timing;
                  var allBodies2 = Composite2.allBodies(world), allConstraints = Composite2.allConstraints(world), background = options.wireframes ? options.wireframeBackground : options.background, bodies = [], constraints = [], i;
                  var event = {
                    timestamp: engine2.timing.timestamp
                  };
                  Events2.trigger(render, "beforeRender", event);
                  if (render.currentBackground !== background)
                    _applyBackground(render, background);
                  context.globalCompositeOperation = "source-in";
                  context.fillStyle = "transparent";
                  context.fillRect(0, 0, canvas3.width, canvas3.height);
                  context.globalCompositeOperation = "source-over";
                  if (options.hasBounds) {
                    for (i = 0; i < allBodies2.length; i++) {
                      var body = allBodies2[i];
                      if (Bounds2.overlaps(body.bounds, render.bounds))
                        bodies.push(body);
                    }
                    for (i = 0; i < allConstraints.length; i++) {
                      var constraint = allConstraints[i], bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointAWorld = constraint.pointA, pointBWorld = constraint.pointB;
                      if (bodyA) pointAWorld = Vector2.add(bodyA.position, constraint.pointA);
                      if (bodyB) pointBWorld = Vector2.add(bodyB.position, constraint.pointB);
                      if (!pointAWorld || !pointBWorld)
                        continue;
                      if (Bounds2.contains(render.bounds, pointAWorld) || Bounds2.contains(render.bounds, pointBWorld))
                        constraints.push(constraint);
                    }
                    Render.startViewTransform(render);
                    if (render.mouse) {
                      Mouse.setScale(render.mouse, {
                        x: (render.bounds.max.x - render.bounds.min.x) / render.options.width,
                        y: (render.bounds.max.y - render.bounds.min.y) / render.options.height
                      });
                      Mouse.setOffset(render.mouse, render.bounds.min);
                    }
                  } else {
                    constraints = allConstraints;
                    bodies = allBodies2;
                    if (render.options.pixelRatio !== 1) {
                      render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
                    }
                  }
                  if (!options.wireframes || engine2.enableSleeping && options.showSleeping) {
                    Render.bodies(render, bodies, context);
                  } else {
                    if (options.showConvexHulls)
                      Render.bodyConvexHulls(render, bodies, context);
                    Render.bodyWireframes(render, bodies, context);
                  }
                  if (options.showBounds)
                    Render.bodyBounds(render, bodies, context);
                  if (options.showAxes || options.showAngleIndicator)
                    Render.bodyAxes(render, bodies, context);
                  if (options.showPositions)
                    Render.bodyPositions(render, bodies, context);
                  if (options.showVelocity)
                    Render.bodyVelocity(render, bodies, context);
                  if (options.showIds)
                    Render.bodyIds(render, bodies, context);
                  if (options.showSeparations)
                    Render.separations(render, engine2.pairs.list, context);
                  if (options.showCollisions)
                    Render.collisions(render, engine2.pairs.list, context);
                  if (options.showVertexNumbers)
                    Render.vertexNumbers(render, bodies, context);
                  if (options.showMousePosition)
                    Render.mousePosition(render, render.mouse, context);
                  Render.constraints(constraints, context);
                  if (options.hasBounds) {
                    Render.endViewTransform(render);
                  }
                  Events2.trigger(render, "afterRender", event);
                  timing.lastElapsed = Common2.now() - startTime;
                };
                Render.stats = function(render, context, time) {
                  var engine2 = render.engine, world = engine2.world, bodies = Composite2.allBodies(world), parts = 0, width = 55, height = 44, x = 0, y = 0;
                  for (var i = 0; i < bodies.length; i += 1) {
                    parts += bodies[i].parts.length;
                  }
                  var sections = {
                    "Part": parts,
                    "Body": bodies.length,
                    "Cons": Composite2.allConstraints(world).length,
                    "Comp": Composite2.allComposites(world).length,
                    "Pair": engine2.pairs.list.length
                  };
                  context.fillStyle = "#0e0f19";
                  context.fillRect(x, y, width * 5.5, height);
                  context.font = "12px Arial";
                  context.textBaseline = "top";
                  context.textAlign = "right";
                  for (var key in sections) {
                    var section = sections[key];
                    context.fillStyle = "#aaa";
                    context.fillText(key, x + width, y + 8);
                    context.fillStyle = "#eee";
                    context.fillText(section, x + width, y + 26);
                    x += width;
                  }
                };
                Render.performance = function(render, context) {
                  var engine2 = render.engine, timing = render.timing, deltaHistory = timing.deltaHistory, elapsedHistory = timing.elapsedHistory, timestampElapsedHistory = timing.timestampElapsedHistory, engineDeltaHistory = timing.engineDeltaHistory, engineElapsedHistory = timing.engineElapsedHistory, lastEngineDelta = engine2.timing.lastDelta;
                  var deltaMean = _mean(deltaHistory), elapsedMean = _mean(elapsedHistory), engineDeltaMean = _mean(engineDeltaHistory), engineElapsedMean = _mean(engineElapsedHistory), timestampElapsedMean = _mean(timestampElapsedHistory), rateMean = timestampElapsedMean / deltaMean || 0, fps = 1e3 / deltaMean || 0;
                  var graphHeight = 4, gap = 12, width = 60, height = 34, x = 10, y = 69;
                  context.fillStyle = "#0e0f19";
                  context.fillRect(0, 50, gap * 4 + width * 5 + 22, height);
                  Render.status(
                    context,
                    x,
                    y,
                    width,
                    graphHeight,
                    deltaHistory.length,
                    Math.round(fps) + " fps",
                    fps / Render._goodFps,
                    function(i) {
                      return deltaHistory[i] / deltaMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + gap + width,
                    y,
                    width,
                    graphHeight,
                    engineDeltaHistory.length,
                    lastEngineDelta.toFixed(2) + " dt",
                    Render._goodDelta / lastEngineDelta,
                    function(i) {
                      return engineDeltaHistory[i] / engineDeltaMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 2,
                    y,
                    width,
                    graphHeight,
                    engineElapsedHistory.length,
                    engineElapsedMean.toFixed(2) + " ut",
                    1 - engineElapsedMean / Render._goodFps,
                    function(i) {
                      return engineElapsedHistory[i] / engineElapsedMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 3,
                    y,
                    width,
                    graphHeight,
                    elapsedHistory.length,
                    elapsedMean.toFixed(2) + " rt",
                    1 - elapsedMean / Render._goodFps,
                    function(i) {
                      return elapsedHistory[i] / elapsedMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 4,
                    y,
                    width,
                    graphHeight,
                    timestampElapsedHistory.length,
                    rateMean.toFixed(2) + " x",
                    rateMean * rateMean * rateMean,
                    function(i) {
                      return (timestampElapsedHistory[i] / deltaHistory[i] / rateMean || 0) - 1;
                    }
                  );
                };
                Render.status = function(context, x, y, width, height, count, label, indicator, plotY) {
                  context.strokeStyle = "#888";
                  context.fillStyle = "#444";
                  context.lineWidth = 1;
                  context.fillRect(x, y + 7, width, 1);
                  context.beginPath();
                  context.moveTo(x, y + 7 - height * Common2.clamp(0.4 * plotY(0), -2, 2));
                  for (var i = 0; i < width; i += 1) {
                    context.lineTo(x + i, y + 7 - (i < count ? height * Common2.clamp(0.4 * plotY(i), -2, 2) : 0));
                  }
                  context.stroke();
                  context.fillStyle = "hsl(" + Common2.clamp(25 + 95 * indicator, 0, 120) + ",100%,60%)";
                  context.fillRect(x, y - 7, 4, 4);
                  context.font = "12px Arial";
                  context.textBaseline = "middle";
                  context.textAlign = "right";
                  context.fillStyle = "#eee";
                  context.fillText(label, x + width, y - 5);
                };
                Render.constraints = function(constraints, context) {
                  var c = context;
                  for (var i = 0; i < constraints.length; i++) {
                    var constraint = constraints[i];
                    if (!constraint.render.visible || !constraint.pointA || !constraint.pointB)
                      continue;
                    var bodyA = constraint.bodyA, bodyB = constraint.bodyB, start, end;
                    if (bodyA) {
                      start = Vector2.add(bodyA.position, constraint.pointA);
                    } else {
                      start = constraint.pointA;
                    }
                    if (constraint.render.type === "pin") {
                      c.beginPath();
                      c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                      c.closePath();
                    } else {
                      if (bodyB) {
                        end = Vector2.add(bodyB.position, constraint.pointB);
                      } else {
                        end = constraint.pointB;
                      }
                      c.beginPath();
                      c.moveTo(start.x, start.y);
                      if (constraint.render.type === "spring") {
                        var delta = Vector2.sub(end, start), normal = Vector2.perp(Vector2.normalise(delta)), coils = Math.ceil(Common2.clamp(constraint.length / 5, 12, 20)), offset;
                        for (var j = 1; j < coils; j += 1) {
                          offset = j % 2 === 0 ? 1 : -1;
                          c.lineTo(
                            start.x + delta.x * (j / coils) + normal.x * offset * 4,
                            start.y + delta.y * (j / coils) + normal.y * offset * 4
                          );
                        }
                      }
                      c.lineTo(end.x, end.y);
                    }
                    if (constraint.render.lineWidth) {
                      c.lineWidth = constraint.render.lineWidth;
                      c.strokeStyle = constraint.render.strokeStyle;
                      c.stroke();
                    }
                    if (constraint.render.anchors) {
                      c.fillStyle = constraint.render.strokeStyle;
                      c.beginPath();
                      c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                      c.arc(end.x, end.y, 3, 0, 2 * Math.PI);
                      c.closePath();
                      c.fill();
                    }
                  }
                };
                Render.bodies = function(render, bodies, context) {
                  var c = context, engine2 = render.engine, options = render.options, showInternalEdges = options.showInternalEdges || !options.wireframes, body, part, i, k;
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                      part = body.parts[k];
                      if (!part.render.visible)
                        continue;
                      if (options.showSleeping && body.isSleeping) {
                        c.globalAlpha = 0.5 * part.render.opacity;
                      } else if (part.render.opacity !== 1) {
                        c.globalAlpha = part.render.opacity;
                      }
                      if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
                        var sprite = part.render.sprite, texture = _getTexture(render, sprite.texture);
                        c.translate(part.position.x, part.position.y);
                        c.rotate(part.angle);
                        c.drawImage(
                          texture,
                          texture.width * -sprite.xOffset * sprite.xScale,
                          texture.height * -sprite.yOffset * sprite.yScale,
                          texture.width * sprite.xScale,
                          texture.height * sprite.yScale
                        );
                        c.rotate(-part.angle);
                        c.translate(-part.position.x, -part.position.y);
                      } else {
                        if (part.circleRadius) {
                          c.beginPath();
                          c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
                        } else {
                          c.beginPath();
                          c.moveTo(part.vertices[0].x, part.vertices[0].y);
                          for (var j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                              c.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                              c.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }
                            if (part.vertices[j].isInternal && !showInternalEdges) {
                              c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                          }
                          c.lineTo(part.vertices[0].x, part.vertices[0].y);
                          c.closePath();
                        }
                        if (!options.wireframes) {
                          c.fillStyle = part.render.fillStyle;
                          if (part.render.lineWidth) {
                            c.lineWidth = part.render.lineWidth;
                            c.strokeStyle = part.render.strokeStyle;
                            c.stroke();
                          }
                          c.fill();
                        } else {
                          c.lineWidth = 1;
                          c.strokeStyle = "#bbb";
                          c.stroke();
                        }
                      }
                      c.globalAlpha = 1;
                    }
                  }
                };
                Render.bodyWireframes = function(render, bodies, context) {
                  var c = context, showInternalEdges = render.options.showInternalEdges, body, part, i, j, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                      part = body.parts[k];
                      c.moveTo(part.vertices[0].x, part.vertices[0].y);
                      for (j = 1; j < part.vertices.length; j++) {
                        if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                          c.lineTo(part.vertices[j].x, part.vertices[j].y);
                        } else {
                          c.moveTo(part.vertices[j].x, part.vertices[j].y);
                        }
                        if (part.vertices[j].isInternal && !showInternalEdges) {
                          c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                        }
                      }
                      c.lineTo(part.vertices[0].x, part.vertices[0].y);
                    }
                  }
                  c.lineWidth = 1;
                  c.strokeStyle = "#bbb";
                  c.stroke();
                };
                Render.bodyConvexHulls = function(render, bodies, context) {
                  var c = context, body, part, i, j, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible || body.parts.length === 1)
                      continue;
                    c.moveTo(body.vertices[0].x, body.vertices[0].y);
                    for (j = 1; j < body.vertices.length; j++) {
                      c.lineTo(body.vertices[j].x, body.vertices[j].y);
                    }
                    c.lineTo(body.vertices[0].x, body.vertices[0].y);
                  }
                  c.lineWidth = 1;
                  c.strokeStyle = "rgba(255,255,255,0.2)";
                  c.stroke();
                };
                Render.vertexNumbers = function(render, bodies, context) {
                  var c = context, i, j, k;
                  for (i = 0; i < bodies.length; i++) {
                    var parts = bodies[i].parts;
                    for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                      var part = parts[k];
                      for (j = 0; j < part.vertices.length; j++) {
                        c.fillStyle = "rgba(255,255,255,0.2)";
                        c.fillText(i + "_" + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
                      }
                    }
                  }
                };
                Render.mousePosition = function(render, mouse2, context) {
                  var c = context;
                  c.fillStyle = "rgba(255,255,255,0.8)";
                  c.fillText(mouse2.position.x + "  " + mouse2.position.y, mouse2.position.x + 5, mouse2.position.y - 5);
                };
                Render.bodyBounds = function(render, bodies, context) {
                  var c = context, engine2 = render.engine, options = render.options;
                  c.beginPath();
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (body.render.visible) {
                      var parts = bodies[i].parts;
                      for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        var part = parts[j];
                        c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                      }
                    }
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "rgba(255,255,255,0.08)";
                  } else {
                    c.strokeStyle = "rgba(0,0,0,0.1)";
                  }
                  c.lineWidth = 1;
                  c.stroke();
                };
                Render.bodyAxes = function(render, bodies, context) {
                  var c = context, engine2 = render.engine, options = render.options, part, i, j, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    var body = bodies[i], parts = body.parts;
                    if (!body.render.visible)
                      continue;
                    if (options.showAxes) {
                      for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        part = parts[j];
                        for (k = 0; k < part.axes.length; k++) {
                          var axis = part.axes[k];
                          c.moveTo(part.position.x, part.position.y);
                          c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
                        }
                      }
                    } else {
                      for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        part = parts[j];
                        for (k = 0; k < part.axes.length; k++) {
                          c.moveTo(part.position.x, part.position.y);
                          c.lineTo(
                            (part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2,
                            (part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2
                          );
                        }
                      }
                    }
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "indianred";
                    c.lineWidth = 1;
                  } else {
                    c.strokeStyle = "rgba(255, 255, 255, 0.4)";
                    c.globalCompositeOperation = "overlay";
                    c.lineWidth = 2;
                  }
                  c.stroke();
                  c.globalCompositeOperation = "source-over";
                };
                Render.bodyPositions = function(render, bodies, context) {
                  var c = context, engine2 = render.engine, options = render.options, body, part, i, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    for (k = 0; k < body.parts.length; k++) {
                      part = body.parts[k];
                      c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
                      c.closePath();
                    }
                  }
                  if (options.wireframes) {
                    c.fillStyle = "indianred";
                  } else {
                    c.fillStyle = "rgba(0,0,0,0.5)";
                  }
                  c.fill();
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (body.render.visible) {
                      c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
                      c.closePath();
                    }
                  }
                  c.fillStyle = "rgba(255,165,0,0.8)";
                  c.fill();
                };
                Render.bodyVelocity = function(render, bodies, context) {
                  var c = context;
                  c.beginPath();
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    var velocity = Body2.getVelocity(body);
                    c.moveTo(body.position.x, body.position.y);
                    c.lineTo(body.position.x + velocity.x, body.position.y + velocity.y);
                  }
                  c.lineWidth = 3;
                  c.strokeStyle = "cornflowerblue";
                  c.stroke();
                };
                Render.bodyIds = function(render, bodies, context) {
                  var c = context, i, j;
                  for (i = 0; i < bodies.length; i++) {
                    if (!bodies[i].render.visible)
                      continue;
                    var parts = bodies[i].parts;
                    for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                      var part = parts[j];
                      c.font = "12px Arial";
                      c.fillStyle = "rgba(255,255,255,0.5)";
                      c.fillText(part.id, part.position.x + 10, part.position.y - 10);
                    }
                  }
                };
                Render.collisions = function(render, pairs2, context) {
                  var c = context, options = render.options, pair, collision, corrected, bodyA, bodyB, i, j;
                  c.beginPath();
                  for (i = 0; i < pairs2.length; i++) {
                    pair = pairs2[i];
                    if (!pair.isActive)
                      continue;
                    collision = pair.collision;
                    for (j = 0; j < pair.activeContacts.length; j++) {
                      var contact = pair.activeContacts[j], vertex = contact.vertex;
                      c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
                    }
                  }
                  if (options.wireframes) {
                    c.fillStyle = "rgba(255,255,255,0.7)";
                  } else {
                    c.fillStyle = "orange";
                  }
                  c.fill();
                  c.beginPath();
                  for (i = 0; i < pairs2.length; i++) {
                    pair = pairs2[i];
                    if (!pair.isActive)
                      continue;
                    collision = pair.collision;
                    if (pair.activeContacts.length > 0) {
                      var normalPosX = pair.activeContacts[0].vertex.x, normalPosY = pair.activeContacts[0].vertex.y;
                      if (pair.activeContacts.length === 2) {
                        normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                        normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                      }
                      if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                        c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
                      } else {
                        c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
                      }
                      c.lineTo(normalPosX, normalPosY);
                    }
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "rgba(255,165,0,0.7)";
                  } else {
                    c.strokeStyle = "orange";
                  }
                  c.lineWidth = 1;
                  c.stroke();
                };
                Render.separations = function(render, pairs2, context) {
                  var c = context, options = render.options, pair, collision, corrected, bodyA, bodyB, i, j;
                  c.beginPath();
                  for (i = 0; i < pairs2.length; i++) {
                    pair = pairs2[i];
                    if (!pair.isActive)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.bodyA;
                    bodyB = collision.bodyB;
                    var k = 1;
                    if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
                    if (bodyB.isStatic) k = 0;
                    c.moveTo(bodyB.position.x, bodyB.position.y);
                    c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);
                    k = 1;
                    if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
                    if (bodyA.isStatic) k = 0;
                    c.moveTo(bodyA.position.x, bodyA.position.y);
                    c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "rgba(255,165,0,0.5)";
                  } else {
                    c.strokeStyle = "orange";
                  }
                  c.stroke();
                };
                Render.inspector = function(inspector, context) {
                  var engine2 = inspector.engine, selected = inspector.selected, render = inspector.render, options = render.options, bounds;
                  if (options.hasBounds) {
                    var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / render.options.width, boundsScaleY = boundsHeight / render.options.height;
                    context.scale(1 / boundsScaleX, 1 / boundsScaleY);
                    context.translate(-render.bounds.min.x, -render.bounds.min.y);
                  }
                  for (var i = 0; i < selected.length; i++) {
                    var item = selected[i].data;
                    context.translate(0.5, 0.5);
                    context.lineWidth = 1;
                    context.strokeStyle = "rgba(255,165,0,0.9)";
                    context.setLineDash([1, 2]);
                    switch (item.type) {
                      case "body":
                        bounds = item.bounds;
                        context.beginPath();
                        context.rect(
                          Math.floor(bounds.min.x - 3),
                          Math.floor(bounds.min.y - 3),
                          Math.floor(bounds.max.x - bounds.min.x + 6),
                          Math.floor(bounds.max.y - bounds.min.y + 6)
                        );
                        context.closePath();
                        context.stroke();
                        break;
                      case "constraint":
                        var point = item.pointA;
                        if (item.bodyA)
                          point = item.pointB;
                        context.beginPath();
                        context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                        context.closePath();
                        context.stroke();
                        break;
                    }
                    context.setLineDash([]);
                    context.translate(-0.5, -0.5);
                  }
                  if (inspector.selectStart !== null) {
                    context.translate(0.5, 0.5);
                    context.lineWidth = 1;
                    context.strokeStyle = "rgba(255,165,0,0.6)";
                    context.fillStyle = "rgba(255,165,0,0.1)";
                    bounds = inspector.selectBounds;
                    context.beginPath();
                    context.rect(
                      Math.floor(bounds.min.x),
                      Math.floor(bounds.min.y),
                      Math.floor(bounds.max.x - bounds.min.x),
                      Math.floor(bounds.max.y - bounds.min.y)
                    );
                    context.closePath();
                    context.stroke();
                    context.fill();
                    context.translate(-0.5, -0.5);
                  }
                  if (options.hasBounds)
                    context.setTransform(1, 0, 0, 1, 0, 0);
                };
                var _updateTiming = function(render, time) {
                  var engine2 = render.engine, timing = render.timing, historySize = timing.historySize, timestamp = engine2.timing.timestamp;
                  timing.delta = time - timing.lastTime || Render._goodDelta;
                  timing.lastTime = time;
                  timing.timestampElapsed = timestamp - timing.lastTimestamp || 0;
                  timing.lastTimestamp = timestamp;
                  timing.deltaHistory.unshift(timing.delta);
                  timing.deltaHistory.length = Math.min(timing.deltaHistory.length, historySize);
                  timing.engineDeltaHistory.unshift(engine2.timing.lastDelta);
                  timing.engineDeltaHistory.length = Math.min(timing.engineDeltaHistory.length, historySize);
                  timing.timestampElapsedHistory.unshift(timing.timestampElapsed);
                  timing.timestampElapsedHistory.length = Math.min(timing.timestampElapsedHistory.length, historySize);
                  timing.engineElapsedHistory.unshift(engine2.timing.lastElapsed);
                  timing.engineElapsedHistory.length = Math.min(timing.engineElapsedHistory.length, historySize);
                  timing.elapsedHistory.unshift(timing.lastElapsed);
                  timing.elapsedHistory.length = Math.min(timing.elapsedHistory.length, historySize);
                };
                var _mean = function(values) {
                  var result = 0;
                  for (var i = 0; i < values.length; i += 1) {
                    result += values[i];
                  }
                  return result / values.length || 0;
                };
                var _createCanvas = function(width, height) {
                  var canvas3 = document.createElement("canvas");
                  canvas3.width = width;
                  canvas3.height = height;
                  canvas3.oncontextmenu = function() {
                    return false;
                  };
                  canvas3.onselectstart = function() {
                    return false;
                  };
                  return canvas3;
                };
                var _getPixelRatio = function(canvas3) {
                  var context = canvas3.getContext("2d"), devicePixelRatio = window.devicePixelRatio || 1, backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
                  return devicePixelRatio / backingStorePixelRatio;
                };
                var _getTexture = function(render, imagePath) {
                  var image = render.textures[imagePath];
                  if (image)
                    return image;
                  image = render.textures[imagePath] = new Image();
                  image.src = imagePath;
                  return image;
                };
                var _applyBackground = function(render, background) {
                  var cssBackground = background;
                  if (/(jpg|gif|png)$/.test(background))
                    cssBackground = "url(" + background + ")";
                  render.canvas.style.background = cssBackground;
                  render.canvas.style.backgroundSize = "contain";
                  render.currentBackground = background;
                };
              })();
            }),
            /* 27 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Runner = {};
              module2.exports = Runner;
              var Events2 = __webpack_require__(5);
              var Engine2 = __webpack_require__(17);
              var Common2 = __webpack_require__(0);
              (function() {
                var _requestAnimationFrame, _cancelAnimationFrame;
                if (typeof window !== "undefined") {
                  _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
                  _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
                }
                if (!_requestAnimationFrame) {
                  var _frameTimeout;
                  _requestAnimationFrame = function(callback) {
                    _frameTimeout = setTimeout(function() {
                      callback(Common2.now());
                    }, 1e3 / 60);
                  };
                  _cancelAnimationFrame = function() {
                    clearTimeout(_frameTimeout);
                  };
                }
                Runner.create = function(options) {
                  var defaults = {
                    fps: 60,
                    deltaSampleSize: 60,
                    counterTimestamp: 0,
                    frameCounter: 0,
                    deltaHistory: [],
                    timePrev: null,
                    frameRequestId: null,
                    isFixed: false,
                    enabled: true
                  };
                  var runner = Common2.extend(defaults, options);
                  runner.delta = runner.delta || 1e3 / runner.fps;
                  runner.deltaMin = runner.deltaMin || 1e3 / runner.fps;
                  runner.deltaMax = runner.deltaMax || 1e3 / (runner.fps * 0.5);
                  runner.fps = 1e3 / runner.delta;
                  return runner;
                };
                Runner.run = function(runner, engine2) {
                  if (typeof runner.positionIterations !== "undefined") {
                    engine2 = runner;
                    runner = Runner.create();
                  }
                  (function run(time) {
                    runner.frameRequestId = _requestAnimationFrame(run);
                    if (time && runner.enabled) {
                      Runner.tick(runner, engine2, time);
                    }
                  })();
                  return runner;
                };
                Runner.tick = function(runner, engine2, time) {
                  var timing = engine2.timing, delta;
                  if (runner.isFixed) {
                    delta = runner.delta;
                  } else {
                    delta = time - runner.timePrev || runner.delta;
                    runner.timePrev = time;
                    runner.deltaHistory.push(delta);
                    runner.deltaHistory = runner.deltaHistory.slice(-runner.deltaSampleSize);
                    delta = Math.min.apply(null, runner.deltaHistory);
                    delta = delta < runner.deltaMin ? runner.deltaMin : delta;
                    delta = delta > runner.deltaMax ? runner.deltaMax : delta;
                    runner.delta = delta;
                  }
                  var event = {
                    timestamp: timing.timestamp
                  };
                  Events2.trigger(runner, "beforeTick", event);
                  runner.frameCounter += 1;
                  if (time - runner.counterTimestamp >= 1e3) {
                    runner.fps = runner.frameCounter * ((time - runner.counterTimestamp) / 1e3);
                    runner.counterTimestamp = time;
                    runner.frameCounter = 0;
                  }
                  Events2.trigger(runner, "tick", event);
                  Events2.trigger(runner, "beforeUpdate", event);
                  Engine2.update(engine2, delta);
                  Events2.trigger(runner, "afterUpdate", event);
                  Events2.trigger(runner, "afterTick", event);
                };
                Runner.stop = function(runner) {
                  _cancelAnimationFrame(runner.frameRequestId);
                };
                Runner.start = function(runner, engine2) {
                  Runner.run(runner, engine2);
                };
              })();
            }),
            /* 28 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var SAT = {};
              module2.exports = SAT;
              var Collision = __webpack_require__(8);
              var Common2 = __webpack_require__(0);
              var deprecated = Common2.deprecated;
              (function() {
                SAT.collides = function(bodyA, bodyB) {
                  return Collision.collides(bodyA, bodyB);
                };
                deprecated(SAT, "collides", "SAT.collides \u27A4 replaced by Collision.collides");
              })();
            }),
            /* 29 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Svg = {};
              module2.exports = Svg;
              var Bounds2 = __webpack_require__(1);
              var Common2 = __webpack_require__(0);
              (function() {
                Svg.pathToVertices = function(path, sampleLength) {
                  if (typeof window !== "undefined" && !("SVGPathSeg" in window)) {
                    Common2.warn("Svg.pathToVertices: SVGPathSeg not defined, a polyfill is required.");
                  }
                  var i, il, total, point, segment, segments, segmentsQueue, lastSegment, lastPoint, segmentIndex, points = [], lx, ly, length = 0, x = 0, y = 0;
                  sampleLength = sampleLength || 15;
                  var addPoint = function(px, py, pathSegType) {
                    var isRelative = pathSegType % 2 === 1 && pathSegType > 1;
                    if (!lastPoint || px != lastPoint.x || py != lastPoint.y) {
                      if (lastPoint && isRelative) {
                        lx = lastPoint.x;
                        ly = lastPoint.y;
                      } else {
                        lx = 0;
                        ly = 0;
                      }
                      var point2 = {
                        x: lx + px,
                        y: ly + py
                      };
                      if (isRelative || !lastPoint) {
                        lastPoint = point2;
                      }
                      points.push(point2);
                      x = lx + px;
                      y = ly + py;
                    }
                  };
                  var addSegmentPoint = function(segment2) {
                    var segType = segment2.pathSegTypeAsLetter.toUpperCase();
                    if (segType === "Z")
                      return;
                    switch (segType) {
                      case "M":
                      case "L":
                      case "T":
                      case "C":
                      case "S":
                      case "Q":
                        x = segment2.x;
                        y = segment2.y;
                        break;
                      case "H":
                        x = segment2.x;
                        break;
                      case "V":
                        y = segment2.y;
                        break;
                    }
                    addPoint(x, y, segment2.pathSegType);
                  };
                  Svg._svgPathToAbsolute(path);
                  total = path.getTotalLength();
                  segments = [];
                  for (i = 0; i < path.pathSegList.numberOfItems; i += 1)
                    segments.push(path.pathSegList.getItem(i));
                  segmentsQueue = segments.concat();
                  while (length < total) {
                    segmentIndex = path.getPathSegAtLength(length);
                    segment = segments[segmentIndex];
                    if (segment != lastSegment) {
                      while (segmentsQueue.length && segmentsQueue[0] != segment)
                        addSegmentPoint(segmentsQueue.shift());
                      lastSegment = segment;
                    }
                    switch (segment.pathSegTypeAsLetter.toUpperCase()) {
                      case "C":
                      case "T":
                      case "S":
                      case "Q":
                      case "A":
                        point = path.getPointAtLength(length);
                        addPoint(point.x, point.y, 0);
                        break;
                    }
                    length += sampleLength;
                  }
                  for (i = 0, il = segmentsQueue.length; i < il; ++i)
                    addSegmentPoint(segmentsQueue[i]);
                  return points;
                };
                Svg._svgPathToAbsolute = function(path) {
                  var x0, y0, x1, y1, x2, y2, segs = path.pathSegList, x = 0, y = 0, len = segs.numberOfItems;
                  for (var i = 0; i < len; ++i) {
                    var seg = segs.getItem(i), segType = seg.pathSegTypeAsLetter;
                    if (/[MLHVCSQTA]/.test(segType)) {
                      if ("x" in seg) x = seg.x;
                      if ("y" in seg) y = seg.y;
                    } else {
                      if ("x1" in seg) x1 = x + seg.x1;
                      if ("x2" in seg) x2 = x + seg.x2;
                      if ("y1" in seg) y1 = y + seg.y1;
                      if ("y2" in seg) y2 = y + seg.y2;
                      if ("x" in seg) x += seg.x;
                      if ("y" in seg) y += seg.y;
                      switch (segType) {
                        case "m":
                          segs.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
                          break;
                        case "l":
                          segs.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
                          break;
                        case "h":
                          segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
                          break;
                        case "v":
                          segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
                          break;
                        case "c":
                          segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
                          break;
                        case "s":
                          segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
                          break;
                        case "q":
                          segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
                          break;
                        case "t":
                          segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
                          break;
                        case "a":
                          segs.replaceItem(path.createSVGPathSegArcAbs(x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag), i);
                          break;
                        case "z":
                        case "Z":
                          x = x0;
                          y = y0;
                          break;
                      }
                    }
                    if (segType == "M" || segType == "m") {
                      x0 = x;
                      y0 = y;
                    }
                  }
                };
              })();
            }),
            /* 30 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var World = {};
              module2.exports = World;
              var Composite2 = __webpack_require__(6);
              var Common2 = __webpack_require__(0);
              (function() {
                World.create = Composite2.create;
                World.add = Composite2.add;
                World.remove = Composite2.remove;
                World.clear = Composite2.clear;
                World.addComposite = Composite2.addComposite;
                World.addBody = Composite2.addBody;
                World.addConstraint = Composite2.addConstraint;
              })();
            })
            /******/
          ])
        );
      });
    }
  });

  // src/sim/spells/registry.js
  var registry_exports = {};
  __export(registry_exports, {
    SPELLS: () => SPELLS
  });
  var SPELLS = {};

  // src/sim/world.js
  var world_exports = {};
  __export(world_exports, {
    H: () => H,
    W: () => W,
    column: () => column,
    createWorld: () => createWorld,
    destroyWorld: () => destroyWorld,
    onWorldReset: () => onWorldReset
  });

  // src/sim/phys/matter-backend.js
  var import_matter_js = __toESM(require_matter(), 1);
  var { Bounds, Common, Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector, Vertices } = import_matter_js.default;
  var engine = null;
  var root = null;
  function createEngine() {
    resetPhysRandom();
    engine = Engine.create();
    root = engine.world;
    return engine;
  }
  function destroyEngine() {
    if (engine) {
      Composite.clear(root, false);
      Engine.clear(engine);
    }
    engine = null;
    root = null;
  }
  function resetPhysRandom() {
    Common._seed = 0;
  }
  function createCircle(x, y, r, opts) {
    return Bodies.circle(x, y, r, opts);
  }
  function createBox(x, y, w, h, opts) {
    return Bodies.rectangle(x, y, w, h, opts);
  }
  function createPolygon(x, y, sides, r, opts) {
    return Bodies.polygon(x, y, sides, r, opts);
  }
  function newCollisionGroup() {
    return Body.nextGroup(true);
  }
  function addBody(b) {
    Composite.add(root, b);
  }
  function removeBody(b, deep = false) {
    Composite.remove(root, b, deep);
  }
  function createComposite() {
    return Composite.create();
  }
  function addTo(container, item) {
    Composite.add(container, item);
  }
  function removeFrom(container, item, deep = false) {
    Composite.remove(container, item, deep);
  }
  function allBodies(container = root) {
    return Composite.allBodies(container);
  }
  function allJoints(container = root) {
    return Composite.allConstraints(container);
  }
  function bodyById(id, container = root) {
    return Composite.get(container, id, "body");
  }
  function setPosition(b, p) {
    Body.setPosition(b, p);
  }
  function setAngle(b, a) {
    Body.setAngle(b, a);
  }
  function setAngularVelocity(b, w) {
    Body.setAngularVelocity(b, w);
  }
  function setVelocity(b, v) {
    Body.setVelocity(b, v);
  }
  function addVelocity(b, dv) {
    Body.setVelocity(b, { x: b.velocity.x + dv.x, y: b.velocity.y + dv.y });
  }
  function applyForce(b, at, f) {
    Body.applyForce(b, at, f);
  }
  function setType(b, type) {
    if (type === "kinematic") {
      throw new Error("setType: matter-js has no kinematic body type. Drive a static body with setPosition, or add real support to both backends.");
    }
    Body.setStatic(b, type === "static");
  }
  function setFixedRotation(b, on) {
    if (on) {
      if (b.__inertiaBeforePin === void 0) b.__inertiaBeforePin = b.inertia;
      Body.setInertia(b, Infinity);
    } else if (b.__inertiaBeforePin !== void 0) {
      Body.setInertia(b, b.__inertiaBeforePin);
      b.__inertiaBeforePin = void 0;
    }
  }
  function setFrictionAir(b, v) {
    b.frictionAir = v;
  }
  function setFriction(b, v) {
    b.friction = v;
  }
  function setRestitution(b, v) {
    b.restitution = v;
  }
  function setFilter(b, filter) {
    Object.assign(b.collisionFilter, filter);
  }
  function scaleBody(b, sx, sy) {
    Body.scale(b, sx, sy);
  }
  function setGravityY(y) {
    engine.gravity.y = y;
  }
  function gravityY() {
    return engine.gravity.y;
  }
  function worldGravityScale() {
    return engine.gravity.scale;
  }
  function queryRay(from, to, opts = {}) {
    const bodies = allBodies(opts.container);
    const dx = to.x - from.x, dy = to.y - from.y;
    const span = {
      min: { x: Math.min(from.x, to.x), y: Math.min(from.y, to.y) },
      max: { x: Math.max(from.x, to.x), y: Math.max(from.y, to.y) }
    };
    let best = null;
    for (const body of bodies) {
      if (opts.filter && !opts.filter(body)) continue;
      if (!Bounds.overlaps(body.bounds, span)) continue;
      const h = segmentHit(body, from, dx, dy, span);
      if (h && (best === null || h.t < best.t)) best = h;
    }
    if (!best) return null;
    return {
      body: best.body,
      point: { x: from.x + dx * best.t, y: from.y + dy * best.t },
      normal: best.normal,
      distance: best.t * Math.hypot(dx, dy)
    };
  }
  function segmentHit(body, from, dx, dy, span) {
    const parts = body.parts;
    let t = Infinity, normal = null;
    for (let i = parts.length > 1 ? 1 : 0; i < parts.length; i++) {
      const part = parts[i];
      if (!Bounds.overlaps(part.bounds, span)) continue;
      if (Vertices.contains(part.vertices, from)) return { body, t: 0, normal: { x: 0, y: 0 } };
      const vs = part.vertices;
      for (let j = 0; j < vs.length; j++) {
        const a = vs[j], b = vs[(j + 1) % vs.length];
        const ex = b.x - a.x, ey = b.y - a.y;
        const den = dx * ey - dy * ex;
        if (den === 0) continue;
        const wx = a.x - from.x, wy = a.y - from.y;
        const ts = (wx * ey - wy * ex) / den;
        if (ts < 0 || ts > 1 || ts >= t) continue;
        const u = (dy * wx - dx * wy) / den;
        if (u < 0 || u > 1) continue;
        t = ts;
        const len = Math.hypot(ex, ey) || 1;
        let nx = ey / len, ny = -ex / len;
        if (nx * dx + ny * dy > 0) {
          nx = -nx;
          ny = -ny;
        }
        normal = { x: nx, y: ny };
      }
    }
    return t === Infinity ? null : { body, t, normal };
  }
  function queryRegion(aabb, opts = {}) {
    const bodies = allBodies(opts.container);
    const found = Query.region(bodies, aabb);
    return opts.filter ? found.filter(opts.filter) : found;
  }
  function pointInBody(body, point) {
    return Vertices.contains(body.vertices, point);
  }
  function queryRadius(center, r, opts = {}) {
    const bodies = allBodies(opts.container);
    const out = [];
    for (const b of bodies) {
      if (opts.filter && !opts.filter(b)) continue;
      if (Math.hypot(b.position.x - center.x, b.position.y - center.y) <= r) out.push(b);
    }
    return out;
  }
  function queryCapsule(from, to, halfWidth, opts = {}) {
    const bodies = allBodies(opts.container);
    const dx = to.x - from.x, dy = to.y - from.y;
    const len2 = dx * dx + dy * dy;
    const out = [];
    for (const b of bodies) {
      if (opts.filter && !opts.filter(b)) continue;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((b.position.x - from.x) * dx + (b.position.y - from.y) * dy) / len2));
      const px = from.x + t * dx, py = from.y + t * dy;
      if (Math.hypot(b.position.x - px, b.position.y - py) <= halfWidth) out.push(b);
    }
    return out;
  }
  function createJoint(desc) {
    return Constraint.create(desc);
  }
  function jointEnds(c) {
    const a = c.bodyA ? Vector.add(c.bodyA.position, Vector.rotate(c.pointA, c.bodyA.angle)) : c.pointA;
    const b = c.bodyB ? Vector.add(c.bodyB.position, Vector.rotate(c.pointB, c.bodyB.angle)) : c.pointB;
    return [a, b];
  }
  function physStep(dtMs) {
    Engine.update(engine, dtMs);
  }
  function onContact(handler) {
    Events.on(engine, "collisionStart", (e) => handler(e.pairs));
  }

  // src/sim/gravity.js
  var base = 2;
  var seq = 0;
  var mods = [];
  var KINDS = /* @__PURE__ */ new Set(["scale", "flip", "set"]);
  function setBase(v) {
    base = v;
    apply();
  }
  var baseGravity = () => base;
  function push(mod) {
    if (!KINDS.has(mod?.kind)) throw new Error(`unknown gravity modifier kind: ${mod?.kind}`);
    const id = ++seq;
    mods.push({ ...mod, id });
    apply();
    return id;
  }
  function pop(id) {
    const i = mods.findIndex((m) => m.id === id);
    if (i < 0) return;
    mods.splice(i, 1);
    apply();
  }
  function clearModifiers() {
    mods = [];
    apply();
  }
  function currentGravity() {
    let g = base;
    for (const m of mods) {
      if (m.kind === "scale") g *= m.value;
      else if (m.kind === "flip") g = -g;
      else g = m.value;
    }
    return g;
  }
  function apply() {
    setGravityY(currentGravity());
  }

  // src/sim/world.js
  var W = 1280;
  var H = 720;
  function column(x0, x1 = x0) {
    return { min: { x: x0, y: -Infinity }, max: { x: x1, y: Infinity } };
  }
  var resetHooks = [];
  function onWorldReset(fn) {
    resetHooks.push(fn);
  }
  function createWorld() {
    const engine2 = createEngine();
    clearModifiers();
    setBase(2);
    for (const fn of resetHooks) fn();
    return engine2;
  }
  function destroyWorld() {
    destroyEngine();
  }

  // src/sim/time.js
  var time_exports = {};
  __export(time_exports, {
    LEGACY_FRAME_MS: () => LEGACY_FRAME_MS,
    MAX_CATCHUP: () => MAX_CATCHUP,
    TICK_HZ: () => TICK_HZ,
    TICK_MS: () => TICK_MS,
    advanceTick: () => advanceTick,
    currentTick: () => currentTick,
    perSecond: () => perSecond,
    perSecondAt: () => perSecondAt,
    resetTick: () => resetTick,
    simNow: () => simNow,
    ticks: () => ticks
  });
  var TICK_HZ = 60;
  var TICK_MS = 1e3 / TICK_HZ;
  var MAX_CATCHUP = 5;
  var tick = 0;
  var currentTick = () => tick;
  var advanceTick = () => ++tick;
  var resetTick = (t = 0) => {
    tick = t;
  };
  var simNow = () => tick * TICK_MS;
  var ticks = (ms) => Math.round(ms / TICK_MS);
  var LEGACY_FRAME_MS = 1e3 / 60;
  var perSecondAt = (perFrameValue, tickMs) => perFrameValue * (tickMs / LEGACY_FRAME_MS);
  var perSecond = (perFrameValue) => perSecondAt(perFrameValue, TICK_MS);

  // src/sim/rng.js
  var rng_exports = {};
  __export(rng_exports, {
    makeRng: () => makeRng,
    pick: () => pick,
    rand: () => rand,
    reseed: () => reseed,
    simPick: () => simPick,
    simRandom: () => simRandom,
    simRange: () => simRange
  });
  function makeRng(seed) {
    let a = seed >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var next = makeRng(1);
  function reseed(seed) {
    next = makeRng(seed);
  }
  var simRandom = () => next();
  var simRange = (a, b) => a + next() * (b - a);
  var simPick = (arr) => arr[Math.floor(next() * arr.length)];
  var rand = simRange;
  var pick = simPick;

  // src/sim/fx.js
  var fx_exports = {};
  __export(fx_exports, {
    addShake: () => addShake,
    clearParticles: () => clearParticles,
    doFlash: () => doFlash,
    spawnBurst: () => spawnBurst,
    spawnParticle: () => spawnParticle,
    spawnParticles: () => spawnParticles,
    spawnRing: () => spawnRing,
    spawnText: () => spawnText
  });

  // src/sim/emit.js
  var emit_exports = {};
  __export(emit_exports, {
    drainEmitted: () => drainEmitted,
    emit: () => emit,
    emittedCount: () => emittedCount
  });
  var queue = [];
  function emit(name, ...args) {
    queue.push({ f: name, a: args });
  }
  function drainEmitted() {
    const out = queue.slice();
    queue.length = 0;
    return out;
  }
  var emittedCount = () => queue.length;
  onWorldReset(() => {
    queue.length = 0;
  });

  // src/sim/fx.js
  function spawnParticles(...a) {
    emit("spawnParticles", ...a);
  }
  function spawnRing(...a) {
    emit("spawnRing", ...a);
  }
  function spawnText(...a) {
    emit("spawnText", ...a);
  }
  function spawnBurst(...a) {
    emit("spawnBurst", ...a);
  }
  function doFlash(...a) {
    emit("doFlash", ...a);
  }
  function addShake(...a) {
    emit("addShake", ...a);
  }
  function spawnParticle(spec) {
    emit("particle", spec);
  }
  function clearParticles() {
    emit("clearParticles");
  }

  // src/sim/pace.js
  var pace_exports = {};
  __export(pace_exports, {
    BASE_PACE: () => BASE_PACE,
    paceScale: () => paceScale,
    slowMo: () => slowMo,
    updatePace: () => updatePace
  });

  // src/sim/env.js
  var performance2 = globalThis.performance;

  // src/sim/pace.js
  var BASE_PACE = 0.85;
  var MIN_PACE = 0.05;
  var scale = BASE_PACE;
  var slowUntil = 0;
  var paceScale = () => scale;
  function slowMo(s, ms) {
    emit("slowMo", s, ms);
    scale = Math.max(MIN_PACE, s);
    slowUntil = performance2.now() + ms;
  }
  function updatePace() {
    if (performance2.now() > slowUntil) scale += (BASE_PACE - scale) * 0.08;
  }
  onWorldReset(() => {
    scale = BASE_PACE;
    slowUntil = 0;
  });

  // src/sim/sfx.js
  var sfx_exports = {};
  __export(sfx_exports, {
    SFX_KEYS: () => SFX_KEYS,
    sfx: () => sfx
  });
  var SFX_KEYS = [
    "jump",
    "cast",
    "explosion",
    "lightning",
    "death",
    "pickup",
    "blackhole",
    "freeze",
    "fight",
    "boing",
    "clang",
    "squeak",
    "oink",
    "hyper",
    "event",
    "thud",
    "boss",
    "roundWin",
    "victory"
  ];
  var sfx = {};
  for (const key of SFX_KEYS) sfx[key] = () => emit("sfx", key);

  // src/sim/player/combat.js
  var combat_exports = {};
  __export(combat_exports, {
    damagePlayer: () => damagePlayer,
    killPlayer: () => killPlayer,
    knockHatOff: () => knockHatOff
  });

  // src/sim/awards.js
  var awards_exports = {};
  __export(awards_exports, {
    addKillFeed: () => addKillFeed,
    computeAwards: () => computeAwards,
    creditKill: () => creditKill,
    killFeedLines: () => killFeedLines,
    matchStats: () => matchStats,
    resetMatchStats: () => resetMatchStats,
    statFor: () => statFor
  });

  // src/sim/player/lifecycle.js
  var lifecycle_exports = {};
  __export(lifecycle_exports, {
    FALL_SAFE_DROP: () => FALL_SAFE_DROP,
    MAX_HP: () => MAX_HP,
    MAX_PLAYERS: () => MAX_PLAYERS,
    PLAYER_DEFS: () => PLAYER_DEFS,
    addSpell: () => addSpell,
    clearSpells: () => clearSpells,
    createPlayer: () => createPlayer,
    despawnPlayer: () => despawnPlayer,
    disarmPlayer: () => disarmPlayer,
    gibs: () => gibs,
    healPlayer: () => healPlayer,
    players: () => players,
    setPlayerScale: () => setPlayerScale,
    spawnPlayer: () => spawnPlayer,
    spawnPointFor: () => spawnPointFor
  });

  // src/sim/input-contract.js
  var IDLE_INPUT = { move: 0, jump: false, cast: false, cast2: false, block: false, jumpPressed: false, castPressed: false, cast2Pressed: false, blockPressed: false, startPressed: false, aimPoint: null, aimVec: null };

  // src/sim/match.js
  var match_exports = {};
  __export(match_exports, {
    banner: () => banner,
    bannerColor: () => bannerColor,
    bannerHyper: () => bannerHyper,
    bannerUntil: () => bannerUntil,
    beginFromLobby: () => beginFromLobby,
    checkRoundEnd: () => checkRoundEnd,
    currentMap: () => currentMap,
    game: () => game,
    joinPlayer: () => joinPlayer,
    loadMap: () => loadMap,
    minPlayers: () => minPlayers,
    nextMapIndex: () => nextMapIndex,
    resetMatch: () => resetMatch,
    setBanner: () => setBanner,
    setCurrentMap: () => setCurrentMap,
    setWins: () => setWins,
    startRound: () => startRound,
    startVictory: () => startVictory,
    toggleMode: () => toggleMode
  });

  // src/sim/cooldown.js
  var pairs = /* @__PURE__ */ new Map();
  var keyOf = (tag, a, b) => a.id < b.id ? `${tag}|${a.id}|${b.id}` : `${tag}|${b.id}|${a.id}`;
  var pairCooldown = {
    // True if this pair may act now, in which case the gate closes for `ms`.
    // ASKING IS TAKING: call it last in a condition, after everything else that
    // could veto the hit, which is exactly where the stamp assignments it
    // replaced sat.
    //
    // `tag` names the gate — the property name the old stamps carried. Two sites
    // sharing a tag share a window on purpose; two sites sharing one by accident
    // is the bug above, so a missing tag throws rather than silently aliasing.
    //
    // THE BOUNDARY. `<` means the gate opens on tick T + ticks(ms) — a 700ms gate
    // taken on tick T is open again 42 ticks later, the duration as authored.
    // That is what `p._bossHurtAt` and `b._touchAt` did (`now < stamp` → skip),
    // and those two are polled EVERY TICK from the boss and enemy update loops,
    // so their reopening tick is observed every time the gate is used. The other
    // three wrote `now > stamp`, which held one tick longer; they are driven by
    // collisionStart, which only fires when a contact is newly formed, so their
    // reopening tick is almost never the tick a contact actually lands on.
    // Unifying has to pick one, and this picks the one that is both the authored
    // duration and faithful where the difference is observable. Neither choice
    // moves either golden tape — both were run.
    //
    // The `?? 0` default falls out of the same choice: at tick 0 the gate is
    // open, as it was for the two `<` sites.
    ready(a, b, ms, tag) {
      if (!tag) throw new Error("pairCooldown: every gate needs a tag, or two gates quietly share one");
      const t = currentTick();
      const key = keyOf(tag, a, b);
      if (t < (pairs.get(key) ?? 0)) return false;
      pairs.set(key, t + ticks(ms));
      return true;
    },
    // A gate scoped to ONE entity rather than to a pair — `ready(x, x, ms, tag)`.
    //
    // ALL FIVE of the stamps this replaced had this shape, and it has to be kept:
    // `a._cdAt` gated the falling anvil against every wizard at once, not against
    // one of them, so the anvil hit whoever it reached first and nobody else for
    // 400ms. Re-keying those on (attacker, victim) would let the same anvil hit a
    // second wizard inside the same window — a livelier game, and a different one.
    // The pair form is what a genuinely pair-scoped gate would use; no site in the
    // sim wants one today.
    readySelf(x, ms, tag) {
      return pairCooldown.ready(x, x, ms, tag);
    },
    clear() {
      pairs.clear();
    },
    // For tests and diagnostics. Unlike the per-body stamps this replaced, an
    // entry does not die with its body — it lives until loadMap clears the map.
    // What bounds it is the analysis, not a measurement: an entry is only created
    // when a gate is TAKEN, so the count is at most one per (tag, body) that has
    // landed a gated hit this round — not per body, not per contact. Gibs and
    // projectiles raining through a round add nothing. That, plus the clear at the
    // round boundary, is why there is no sweep here. (The three-round tape peaks
    // at 5 entries, but it takes a gate twelve times in 4,200 ticks, so it is a
    // corroboration of the bound and nowhere near a workload that tests it.)
    get size() {
      return pairs.size;
    }
  };
  onWorldReset(() => pairs.clear());

  // src/sim/schedule.js
  var seq2 = 0;
  var entries = [];
  var running = null;
  function scheduleAt(at, fn, tag = null) {
    const id = ++seq2;
    entries.push({ at, id, fn, tag });
    return id;
  }
  var scheduleIn = (ms, fn, tag = null) => scheduleAt(currentTick() + ticks(ms), fn, tag);
  var retract = (match) => {
    entries = entries.filter((e) => !match(e));
    if (running) {
      for (const e of running) if (match(e)) e.cancelled = true;
    }
  };
  function cancelTag(tag) {
    retract((e) => e.tag === tag);
  }
  function drainScheduled(tick2) {
    if (!entries.length) return;
    const due = entries.filter((e) => e.at <= tick2).sort((a, b) => a.at - b.at || a.id - b.id);
    if (!due.length) return;
    const dueIds = new Set(due.map((e) => e.id));
    entries = entries.filter((e) => !dueIds.has(e.id));
    const outer = running;
    running = due;
    try {
      for (const e of due) if (!e.cancelled) e.fn();
    } finally {
      running = outer;
    }
  }
  onWorldReset(() => {
    entries = [];
    running = null;
  });

  // src/sim/telemetry.js
  var telemetry_exports = {};
  __export(telemetry_exports, {
    computeSpellReport: () => computeSpellReport,
    flushRoundTelemetry: () => flushRoundTelemetry,
    matchSpellTally: () => matchSpellTally,
    postTelemetry: () => postTelemetry,
    resetMatchTelemetry: () => resetMatchTelemetry,
    resetTelemetry: () => resetTelemetry,
    setPostTelemetry: () => setPostTelemetry,
    spellTally: () => spellTally,
    telBossDmg: () => telBossDmg,
    telCast: () => telCast,
    telDeath: () => telDeath,
    telDmg: () => telDmg,
    telKill: () => telKill,
    telPick: () => telPick
  });

  // src/version.js
  var GAME_VERSION = 9;

  // src/sim/net-mode.js
  var netMode = "couch";
  function setNetMode(mode) {
    netMode = mode;
  }

  // src/sim/ai/bot.js
  var bot_exports = {};
  __export(bot_exports, {
    BOT_PERSONAS: () => BOT_PERSONAS,
    BotController: () => BotController,
    addBot: () => addBot,
    navGroundY: () => navGroundY
  });

  // src/sim/pickups.js
  var pickups_exports = {};
  __export(pickups_exports, {
    dealStartingSpells: () => dealStartingSpells,
    grabCatalyst: () => grabCatalyst,
    hats: () => hats,
    pickupHat: () => pickupHat,
    pickupTome: () => pickupTome,
    scheduleTomes: () => scheduleTomes,
    spawnCatalyst: () => spawnCatalyst,
    spawnHat: () => spawnHat,
    spawnTome: () => spawnTome,
    tomeDropSpot: () => tomeDropSpot,
    tomes: () => tomes,
    unMega: () => unMega,
    updateTomes: () => updateTomes
  });

  // src/sim/spells/tiers.js
  var tiers_exports = {};
  __export(tiers_exports, {
    SPELL_TIERS: () => SPELL_TIERS,
    TIER_COLOR: () => TIER_COLOR,
    TIER_RANK: () => TIER_RANK,
    TIER_WEIGHT: () => TIER_WEIGHT,
    spellTier: () => spellTier,
    tierColor: () => tierColor,
    weightedSpellPick: () => weightedSpellPick
  });
  var TIER_WEIGHT = { common: 100, uncommon: 45, rare: 12, legendary: 4, hybrid: 0 };
  var TIER_COLOR = { common: "#c9c9d6", uncommon: "#7bd88f", rare: "#4ecdff", legendary: "#ffd166", hybrid: "#ff4df0" };
  var TIER_RANK = { common: 0, uncommon: 1, rare: 2, legendary: 3, hybrid: 4 };
  var SPELL_TIERS = {
    // ---- core starters (js/spells.js) ----
    fireball: "common",
    gust: "common",
    lightning: "common",
    frost: "uncommon",
    blackhole: "rare",
    meteor: "legendary",
    // ---- bolts & bombs ----
    ember: "common",
    twinfire: "common",
    trishot: "common",
    scatter: "common",
    wobble: "common",
    mortar: "uncommon",
    bouncer: "uncommon",
    homing: "uncommon",
    boomerang: "uncommon",
    skullrocket: "uncommon",
    landmine: "uncommon",
    sticky: "uncommon",
    shard: "uncommon",
    firecrackers: "uncommon",
    dragonbreath: "uncommon",
    cannonball: "uncommon",
    bowling: "uncommon",
    starfall: "uncommon",
    sunburst: "rare",
    cluster: "rare",
    // ---- hitscan & beams (no travel time — priced up a tier) ----
    zapspell: "uncommon",
    skysmite: "uncommon",
    sweep: "uncommon",
    thunderlance: "rare",
    chain: "rare",
    disintegrate: "rare",
    stormcall: "rare",
    railgun: "rare",
    // ---- push, pull & air ----
    shove: "common",
    updraft: "common",
    cyclone: "uncommon",
    vortexpull: "uncommon",
    slam: "uncommon",
    magnetpalm: "uncommon",
    repulsor: "rare",
    tornado: "rare",
    // ---- ice & control ----
    iceshard: "common",
    snowball: "common",
    icicledrop: "uncommon",
    coldsnap: "uncommon",
    glacier: "rare",
    blizzard: "rare",
    flashfreeze: "rare",
    frostnova: "rare",
    brainfreeze: "rare",
    permafrost: "rare",
    // ---- fire & status ----
    ignite: "common",
    phoenixdash: "uncommon",
    flamewall: "rare",
    napalm: "rare",
    volcanospell: "rare",
    fireflies: "rare",
    // ---- movement & self ----
    blink: "uncommon",
    rocketleap: "uncommon",
    smokebomb: "uncommon",
    springheel: "uncommon",
    featherfall: "uncommon",
    ghostwalk: "rare",
    swaphex: "rare",
    timeskip: "rare",
    secondwind: "rare",
    aegis: "rare",
    // ---- summons ----
    rubberduck: "common",
    cratedrop: "uncommon",
    anvil: "uncommon",
    bouncycastle: "uncommon",
    stonewall: "uncommon",
    trampoline: "uncommon",
    decoy: "uncommon",
    boulder: "uncommon",
    sawblade: "uncommon",
    blackcat: "uncommon",
    piano: "rare",
    beehive: "rare",
    // ---- chaos & global (aimless, high-impact — mostly rare/legendary) ----
    confetti: "common",
    roulette: "uncommon",
    moongrav: "rare",
    earthquake: "rare",
    poltergeist: "rare",
    frograin: "rare",
    midas: "rare",
    gravflip: "legendary",
    disarm: "legendary",
    chaostheory: "legendary",
    bigbang: "legendary",
    kingsdecree: "legendary",
    // ---- weird & outlandish ----
    banana: "common",
    balloonhex: "uncommon",
    anchorhex: "uncommon",
    shrinkray: "uncommon",
    growthspurt: "uncommon",
    mirrorcast: "uncommon",
    vampirebolt: "uncommon",
    kitchensink: "uncommon",
    yoink: "rare",
    unoreverse: "rare",
    lightningrod: "rare",
    teslacoil: "rare",
    lifeswap: "legendary",
    pigmorph: "legendary"
  };
  function spellTier(id) {
    if (typeof SPELLS !== "undefined" && SPELLS[id] && SPELLS[id].hybrid) return "hybrid";
    return SPELL_TIERS[id] || "common";
  }
  function tierColor(id) {
    return TIER_COLOR[spellTier(id)];
  }
  function weightedSpellPick(ids) {
    ids = ids || Object.keys(SPELLS);
    if (!ids.length) return null;
    let total = 0;
    for (const id of ids) total += TIER_WEIGHT[spellTier(id)] || 1;
    let r = simRandom() * total;
    for (const id of ids) {
      r -= TIER_WEIGHT[spellTier(id)] || 1;
      if (r <= 0) return id;
    }
    return ids[ids.length - 1];
  }

  // src/sim/spells/fusion.js
  var fusion_exports = {};
  __export(fusion_exports, {
    FUSIONS: () => FUSIONS,
    F_AIR: () => F_AIR,
    F_EARTH: () => F_EARTH,
    F_FIRE: () => F_FIRE,
    F_ICE: () => F_ICE,
    F_LIFE: () => F_LIFE,
    F_TRICK: () => F_TRICK,
    F_VOID: () => F_VOID,
    F_ZAP: () => F_ZAP,
    HYBRID_SPELLS: () => HYBRID_SPELLS,
    WILD: () => WILD,
    hybridFor: () => hybridFor,
    tryFuse: () => tryFuse
  });

  // src/sim/player/status.js
  var status_exports = {};
  __export(status_exports, {
    BASE_FRICTION_AIR: () => BASE_FRICTION_AIR,
    BLOCK_CD: () => BLOCK_CD,
    BLOCK_MS: () => BLOCK_MS,
    FROZEN_FRICTION_AIR: () => FROZEN_FRICTION_AIR,
    applyFreeze: () => applyFreeze,
    clearStatuses: () => clearStatuses,
    freezeUntil: () => freezeUntil,
    tickStatuses: () => tickStatuses,
    tryBlock: () => tryBlock
  });
  function clearStatuses(p) {
    p.frozenUntil = 0;
    p.burnUntil = 0;
    p.nextBurnTick = 0;
    p.wetUntil = 0;
    p.reversedUntil = 0;
    p.slipUntil = 0;
    p.floatyUntil = 0;
    p.featherUntil = 0;
    p.heavyUntil = 0;
    p.speedUntil = 0;
    p.jumpBoostUntil = 0;
    p.invulnUntil = 0;
    p.reflectUntil = 0;
    p.shrinkUntil = 0;
    p.growUntil = 0;
    p.pigUntil = 0;
    p.megaCasts = 0;
    p.megaUntil = 0;
    p.blockCdUntil = 0;
  }
  var BASE_FRICTION_AIR = 0.02;
  var FROZEN_FRICTION_AIR = 1e-3;
  function applyFreeze(p, until) {
    p.frozenUntil = until;
    setFrictionAir(p.body, FROZEN_FRICTION_AIR);
  }
  function freezeUntil(p, until) {
    p.frozenUntil = until;
  }
  function tickStatuses(p, now) {
    const frozen = now < p.frozenUntil;
    if (p.wasFrozen && !frozen) {
      setFrictionAir(p.body, BASE_FRICTION_AIR);
      spawnParticles(p.body.position.x, p.body.position.y, "#9be7ff", 10, 4);
      p.wetUntil = now + 4500;
    }
    p.wasFrozen = frozen;
  }
  var BLOCK_MS = 240;
  var BLOCK_CD = 1400;
  function tryBlock(p, now) {
    if (now < (p.blockCdUntil || 0) || now < (p.frozenUntil || 0)) return;
    p.blockCdUntil = now + BLOCK_CD;
    p.invulnUntil = Math.max(p.invulnUntil || 0, now + BLOCK_MS);
    p.reflectUntil = Math.max(p.reflectUntil || 0, now + BLOCK_MS);
    spawnRing(p.body.position.x, p.body.position.y, "#4ecdff");
    sfx.clang?.();
  }

  // src/sim/spells/core.js
  var core_exports = {};
  __export(core_exports, {
    CAST_FLOOR: () => CAST_FLOOR,
    activeEffects: () => activeEffects,
    aimDir: () => aimDir,
    boltVisual: () => boltVisual,
    castSpell: () => castSpell,
    dropProjectile: () => dropProjectile,
    effectiveCooldown: () => effectiveCooldown,
    enemiesOf: () => enemiesOf,
    explode: () => explode,
    groundYAt: () => groundYAt,
    hybridCharges: () => hybridCharges,
    hybridPotency: () => hybridPotency,
    loose: () => loose,
    makeZone: () => makeZone,
    nearestEnemy: () => nearestEnemy,
    projectiles: () => projectiles,
    raycastHit: () => raycastHit,
    removeProjectile: () => removeProjectile,
    removeSummon: () => removeSummon,
    resolvePotency: () => resolvePotency,
    shoot: () => shoot,
    skyBolt: () => skyBolt,
    spawnSingularity: () => spawnSingularity,
    summon: () => summon,
    summons: () => summons,
    updateEffects: () => updateEffects,
    zapHit: () => zapHit
  });

  // src/sim/ai/boss.js
  var boss_exports = {};
  __export(boss_exports, {
    BOSSES: () => BOSSES,
    BOSS_EVERY: () => BOSS_EVERY,
    SECRET_BOSSES: () => SECRET_BOSSES,
    bossAliveTarget: () => bossAliveTarget,
    bossBolt: () => bossBolt,
    bossTouchAll: () => bossTouchAll,
    damageBoss: () => damageBoss,
    isBossRound: () => isBossRound,
    slayBoss: () => slayBoss,
    spawnBoss: () => spawnBoss,
    updateBoss: () => updateBoss
  });

  // src/sim/replay.js
  var replay_exports = {};
  __export(replay_exports, {
    REPLAY: () => REPLAY,
    clearReplay: () => clearReplay,
    replayFrameAt: () => replayFrameAt,
    replayRecord: () => replayRecord,
    startReplay: () => startReplay
  });

  // src/sim/snapshot.js
  var snapshot_exports = {};
  __export(snapshot_exports, {
    serializeSnapshot: () => serializeSnapshot
  });
  function serializeSnapshot() {
    const now = simNow();
    const flag = (k, on) => on ? { [k]: 1 } : {};
    const ps = players.map((p) => ({
      s: p.slot,
      n: p.name,
      c: p.color,
      h: p.hat,
      x: Math.round(p.body.position.x),
      y: Math.round(p.body.position.y),
      vx: +p.body.velocity.x.toFixed(1),
      vy: +p.body.velocity.y.toFixed(1),
      an: +(p.body.angle * 0.35).toFixed(2),
      f: p.facing,
      wp: +p.walkPhase.toFixed(2),
      hp: Math.round(p.hp),
      al: p.alive ? 1 : 0,
      sc: +p.sizeScale.toFixed(2),
      ...flag("fz", now < p.frozenUntil),
      ...flag("fl", now < (p.floatyUntil || 0)),
      ...flag("iv", now < (p.invulnUntil || 0)),
      ...flag("rf", now < (p.reflectUntil || 0)),
      ...flag("pg", now < (p.pigUntil || 0)),
      ...flag("hu", now < (p.hurtUntil || 0)),
      ...p.ghost && !p.alive ? { gx: Math.round(p.ghost.x), gy: Math.round(p.ghost.y) } : {},
      // C4: rd/c0/c1 report the cooldown the cast gate ENFORCES, not the one
      // the spell declares. Same wire shape, corrected values — a client that
      // drew Fireball's bar full at 450ms was drawing a lie.
      sp: p.spellId,
      ...flag("rd", p.spellId && now - p.lastCast > effectiveCooldown(p.spellId)),
      // both spell slots + per-slot cooldown fraction for the two-slot HUD
      s0: p.slots[0],
      s1: p.slots[1],
      h0: p.slotCharges?.[0] ?? void 0,
      h1: p.slotCharges?.[1] ?? void 0,
      // fusion charges left
      c0: p.slots[0] ? +Math.min(1, (now - p.casts[0]) / effectiveCooldown(p.slots[0])).toFixed(2) : 0,
      c1: p.slots[1] ? +Math.min(1, (now - p.casts[1]) / effectiveCooldown(p.slots[1])).toFixed(2) : 0,
      ...p.megaCasts ? { mc: p.megaCasts } : {},
      ...p.roundWins ? { w: p.roundWins } : {},
      ...flag("b", typeof BotController !== "undefined" && p.controller instanceof BotController),
      ...flag("off", !!p.offline)
      // online: seat's connection dropped (server sets it)
    }));
    const bodies = [];
    const pushGhost = (b, label, color, extra) => {
      const e = { id: b.id, l: label, c: color, a: +b.angle.toFixed(3), ...extra };
      e.x = Math.round(b.position.x);
      e.y = Math.round(b.position.y);
      const v = b.vertices;
      if (b.circleRadius) {
        e.r = Math.round(b.circleRadius);
      } else if (v.length === 4) {
        e.w = Math.round(Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y));
        e.h = Math.round(Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y));
      } else if (v.length >= 3 && v.length <= 12) {
        e.n = v.length;
        e.r = Math.round(Math.hypot(v[0].x - b.position.x, v[0].y - b.position.y));
      } else {
        e.v = v.flatMap((pt) => [Math.round(pt.x), Math.round(pt.y)]);
      }
      bodies.push(e);
    };
    for (const fb of projectiles) pushGhost(fb, "projectile", fb.color);
    for (const s of summons) {
      const extra = {};
      if (s.critter) extra.cd = s.critter.dir;
      if (s.decoyOf) extra.dc = [s.decoyOf.color, s.decoyOf.hat];
      if (s.bossType) extra.bt = s.bossType;
      pushGhost(s, s.label, s.render.fillStyle, extra);
    }
    let gibsSent = 0;
    for (const g of gibs) {
      if (++gibsSent > 14) break;
      pushGhost(g, "gib", g.color);
    }
    for (const t of tomes) bodies.push({ id: t.id, l: "tome", x: Math.round(t.position.x), y: Math.round(t.position.y), a: +t.angle.toFixed(3), sp: t.spell });
    for (const h of hats) bodies.push({ id: h.id, l: "hat", x: Math.round(h.position.x), y: Math.round(h.position.y), a: +h.angle.toFixed(3) });
    for (const b of allBodies(currentMap.composite)) {
      if (b.label === "lava") continue;
      if (!b.isStatic) pushGhost(b, b.label, b.render.fillStyle);
      else if (b.spin || b.phantom || b.kinematic) {
        pushGhost(b, b.label, b.render.fillStyle, {
          ...b.phantom ? { ph: b.phantomSolid === false ? 0 : 1 } : {},
          ...b.spin ? { spn: 1 } : {}
        });
      }
    }
    const segs = [];
    for (const c of allJoints(currentMap.composite)) {
      if (c.label !== "breakable" && c.label !== "chain") continue;
      const [a, b] = jointEnds(c);
      segs.push([c.label === "chain" ? 1 : 0, Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)]);
    }
    const fxLite = activeEffects.filter((e) => e.net).map((e) => e.net);
    return {
      v: GAME_VERSION,
      st: game.state,
      mi: game.mapIndex,
      wn: game.winsNeeded,
      ...game.mode !== "versus" ? { md: game.mode } : {},
      // lobby needs the mode line
      ...game.mode === "wave" && game.bestWave ? { bw: game.bestWave } : {},
      msd: game.mapSeed,
      // seed for deterministic map extras (client regenerates statics)
      rn: game.totalRounds || 0,
      // increments every round start — the "re-plan now" signal
      lv: currentMap.data.lavaY != null ? Math.round(currentMap.data.lavaY) : null,
      // winner only while a round/match is actually resolving — it must not linger
      // into the next round (headless clients use wr==null as their reset signal)
      wr: (game.state === "ROUND_END" || game.state === "VICTORY") && game.winner ? game.winner.slot : null,
      ev: game.envEvent?.announced ? game.envEvent.def.id : null,
      bd: currentMap.data.broken && currentMap.data.broken.length ? currentMap.data.broken : void 0,
      // broken destructibles for LAN mirroring
      bs: game.boss?.announced ? { n: game.boss.title || game.boss.def.name, c: game.boss.enraged ? "#ff4d4d" : game.boss.def.color, hp: Math.max(0, Math.round(game.boss.hp)), mhp: game.boss.maxHp } : null,
      aw: game.state === "VICTORY" ? game.awards || null : null,
      sr: game.state === "VICTORY" ? game.spellReport || null : null,
      ps,
      bodies,
      segs,
      fxLite
    };
  }

  // src/sim/replay.js
  var REPLAY = {
    BUF_MS: 3400,
    // ring buffer horizon
    HZ_DIV: 3,
    // record every 3rd frame (~20Hz — plenty for the slow-mo killcam)
    TAIL_MS: 2200,
    // portion of buffer actually replayed (the kill)
    SPEED: 0.45,
    // slow-mo playback rate
    LEAD_MS: 500,
    // beat of frozen frame before playback starts
    HOLD_MS: 400,
    // hold on the last frame after playback
    MIN_MS: 600
    // skip replay if the round was too short
  };
  var replayBuf = [];
  var replayFrameCounter = 0;
  function replayRecord(now) {
    if (game.state !== "PLAY") return;
    if (++replayFrameCounter % REPLAY.HZ_DIV !== 0) return;
    replayBuf.push({ t: now, snap: serializeSnapshot() });
    while (replayBuf.length && replayBuf[0].t < now - REPLAY.BUF_MS) replayBuf.shift();
  }
  function clearReplay() {
    replayBuf.length = 0;
    game.replay = null;
  }
  function startReplay(now) {
    if (replayBuf.length < 2 || replayBuf[replayBuf.length - 1].t - replayBuf[0].t < REPLAY.MIN_MS) {
      replayBuf.length = 0;
      return 0;
    }
    const cutoff = replayBuf[replayBuf.length - 1].t - REPLAY.TAIL_MS;
    let i = replayBuf.findIndex((f) => f.t >= cutoff);
    if (i > 0) i--;
    const frames = replayBuf.slice(Math.max(i, 0));
    const durMs = frames[frames.length - 1].t - frames[0].t;
    game.replay = { frames, playAt: now + REPLAY.LEAD_MS, durMs };
    replayBuf.length = 0;
    return REPLAY.LEAD_MS + durMs / REPLAY.SPEED + REPLAY.HOLD_MS;
  }
  function replayFrameAt() {
    const now = simNow();
    const r = game.replay;
    if (!r) return null;
    const t = r.frames[0].t + Math.max(0, now - r.playAt) * REPLAY.SPEED;
    let i = 1;
    while (i < r.frames.length && r.frames[i].t < t) i++;
    if (i >= r.frames.length) i = r.frames.length - 1;
    const prev = r.frames[i - 1], cur = r.frames[i];
    const alpha = Math.max(0, Math.min(1, (t - prev.t) / Math.max(cur.t - prev.t, 1)));
    const done = now > r.playAt + r.durMs / REPLAY.SPEED + REPLAY.HOLD_MS;
    return { snap: cur.snap, prev: prev.snap, alpha, done };
  }
  onWorldReset(() => {
    replayBuf.length = 0;
    replayFrameCounter = 0;
  });

  // src/sim/ai/boss.js
  var BOSS_EVERY = 10;
  function bossAliveTarget(from) {
    const alive = players.filter((p) => p.alive);
    if (!alive.length) return null;
    if (!from) return pick(alive);
    return alive.reduce((a, b) => Math.hypot(a.body.position.x - from.x, a.body.position.y - from.y) < Math.hypot(b.body.position.x - from.x, b.body.position.y - from.y) ? a : b);
  }
  function bossBolt(from, target, { speed = 10, r = 8, color, spread = 0, boom = [60, 9, 11] }) {
    const t = target.body.position;
    const a = Math.atan2(t.y - from.y, t.x - from.x) + spread;
    const off = (game.boss?.body.circleRadius || 40) + r + 14;
    const fb = createCircle(from.x + Math.cos(a) * off, from.y + Math.sin(a) * off, r, { density: 4e-3, frictionAir: 0, label: "projectile" });
    fb.owner = null;
    fb.color = color;
    fb.gravityScale = 0.25;
    fb.expireAt = simNow() + 5e3;
    const dm = game.boss?.dmgMult || 1;
    fb.onHit = (self) => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2] * dm, "boss");
    setVelocity(fb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
    projectiles.add(fb);
    addBody(fb);
    return fb;
  }
  var bcd = (bs, min, max) => rand(min, max) / (bs.rate || 1);
  function bossTouchAll(bs, dmg, pad = 8) {
    const bb = bs.body.bounds;
    for (const p of players) {
      if (!p.alive) continue;
      const q = p.body.position;
      if (q.x > bb.min.x - pad && q.x < bb.max.x + pad && q.y > bb.min.y - pad && q.y < bb.max.y + pad && pairCooldown.readySelf(p.body, 700, "boss-touch")) {
        damagePlayer(p, dmg * (bs.dmgMult || 1));
        const away = Math.sign(q.x - bs.body.position.x) || pick([-1, 1]);
        setVelocity(p.body, { x: away * 8, y: -6 });
      }
    }
  }
  var BOSSES = [
    {
      id: "dragon",
      name: "THE DRAGON",
      color: "#e15d5d",
      make() {
        return createCircle(W / 2, 140, 42, { density: 0.012, frictionAir: 0.06, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        applyForce(b, b.position, { x: 0, y: -gravityY() * worldGravityScale() * b.mass });
        if (!bs.wp || Math.hypot(bs.wp.x - b.position.x, bs.wp.y - b.position.y) < 70) {
          bs.wp = { x: rand(150, W - 150), y: rand(90, 320) };
        }
        const dx = bs.wp.x - b.position.x, dy = bs.wp.y - b.position.y, d = Math.hypot(dx, dy) || 1;
        setVelocity(b, { x: b.velocity.x * 0.92 + dx / d * 1.1, y: b.velocity.y * 0.92 + dy / d * 1.1 });
        if (now > (bs.nextSpit || (bs.nextSpit = now + 1800))) {
          bs.nextSpit = now + bcd(bs, 2300, 3300);
          const t = bossAliveTarget(b.position);
          if (t) {
            const fan = bs.num >= 3 ? [-0.32, -0.16, 0, 0.16, 0.32] : [-0.18, 0, 0.18];
            for (const off of fan) bossBolt(b.position, t, { speed: 9.5, r: 9, color: "#ff8c5a", spread: off });
            sfx.cast();
          }
        }
        if (now > (bs.nextVolley || (bs.nextVolley = now + 7e3))) {
          bs.nextVolley = now + bcd(bs, 8500, 12e3);
          for (let i = 0; i < 4; i++) {
            const fb = dropProjectile(null, rand(80, W - 80), -30, { r: 10, vx: rand(-2, 2), vy: 9, color: "#ff8c5a", density: 6e-3, expireMs: 9e3 });
            fb.onHit = (self) => explode(self.position.x, self.position.y, 85, 13, 13 * bs.dmgMult, "boss");
          }
        }
        bossTouchAll(bs, 10);
      }
    },
    {
      id: "lich",
      name: "THE LICH",
      color: "#c084fc",
      make() {
        return createCircle(W / 2, 160, 30, { density: 0.01, frictionAir: 0.12, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        applyForce(b, b.position, { x: 0, y: -gravityY() * worldGravityScale() * b.mass });
        setVelocity(b, { x: b.velocity.x * 0.9, y: b.velocity.y * 0.9 + Math.sin(now * 3e-3) * 0.25 });
        if (now > (bs.nextBlink || (bs.nextBlink = now + 3e3))) {
          bs.nextBlink = now + bcd(bs, 3200, 4400);
          spawnParticles(b.position.x, b.position.y, "#c084fc", 16, 5);
          setPosition(b, { x: rand(140, W - 140), y: rand(100, 340) });
          spawnParticles(b.position.x, b.position.y, "#c084fc", 16, 5);
          sfx.freeze();
        }
        if (now > (bs.nextBolt || (bs.nextBolt = now + 2200))) {
          bs.nextBolt = now + bcd(bs, 1700, 2500);
          const t = bossAliveTarget(null);
          if (t) {
            bossBolt(b.position, t, { speed: 11, r: 7, color: "#c084fc", boom: [55, 8, 10] });
            sfx.cast();
          }
        }
        if (now > (bs.nextRaise || (bs.nextRaise = now + 7e3))) {
          bs.nextRaise = now + bcd(bs, 8e3, 11e3);
          for (const side of [-1, 1]) {
            const sk = createCircle(b.position.x + side * 30, b.position.y + 20, 9, { density: 2e-3, friction: 0.5, restitution: 0.4, label: "critter" });
            sk.critter = { hopAt: 0, dir: side, hop: 6, speed: 4 };
            summon(sk, { life: 16e3, color: "#e8e8dc", contactDamage: 6 * bs.dmgMult });
          }
          spawnText(b.position.x, b.position.y - 50, "RISE!", "#c084fc");
        }
        bossTouchAll(bs, 8);
      }
    },
    {
      id: "golem",
      name: "THE GOLEM",
      color: "#b08948",
      make() {
        return createBox(W / 2, 60, 74, 92, { density: 0.02, friction: 0.8, restitution: 0, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        setAngle(b, b.angle * 0.8);
        setAngularVelocity(b, 0);
        if (b.position.y > H - 20) {
          setPosition(b, { x: W / 2, y: 40 });
          setVelocity(b, { x: 0, y: 0 });
          addShake(6);
        }
        const t = bossAliveTarget(b.position);
        if (t && !bs.airborne) {
          const dir = Math.sign(t.body.position.x - b.position.x);
          setVelocity(b, { x: b.velocity.x * 0.8 + dir * 0.9, y: b.velocity.y });
        }
        if (t && now > (bs.nextLeap || (bs.nextLeap = now + 3500)) && Math.abs(b.velocity.y) < 1) {
          bs.nextLeap = now + bcd(bs, 4500, 6500);
          bs.airborne = true;
          const dir = Math.sign(t.body.position.x - b.position.x) || 1;
          setVelocity(b, { x: dir * rand(6, 10), y: -16 });
          sfx.boing();
        }
        if (bs.airborne && b.velocity.y >= 0 && Math.abs(b.velocity.y) < 0.8) {
          bs.airborne = false;
          explode(b.position.x, b.position.y + 30, 140, 20, 16 * bs.dmgMult, "boss");
          addShake(14);
        }
        bossTouchAll(bs, 12);
      }
    },
    {
      id: "kraken",
      name: "THE KRAKEN",
      color: "#3d6a8a",
      make() {
        return createCircle(W / 2, H - 95, 42, { isStatic: true, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        setPosition(b, { x: W / 2 + Math.sin(now / 3200) * 200, y: H - 95 + Math.sin(now / 900) * 12 });
        bs.pending ??= [];
        bs.tentacles ??= [];
        if (now > (bs.nextTent || (bs.nextTent = now + 2500))) {
          bs.nextTent = now + bcd(bs, 2600, 3800);
          const t = bossAliveTarget(null);
          if (t) bs.pending.push({ x: t.body.position.x, at: now + 650 });
        }
        for (const w of bs.pending) {
          if (simRandom() < 0.5) spawnParticles(w.x + rand(-12, 12), H - 30, "#3d6a8a", 1, 2, 14);
          if (now > w.at) {
            const tb = createBox(w.x, H + 120, 26, 240, { isStatic: true, label: "tentacle" });
            summon(tb, { life: 3e3, color: "#3d6a8a" });
            bs.tentacles.push({ b: tb, t0: now, x: w.x, hit: /* @__PURE__ */ new Set() });
            sfx.squeak();
          }
        }
        bs.pending = bs.pending.filter((w) => now <= w.at);
        for (const tn of [...bs.tentacles]) {
          const age = now - tn.t0;
          const rise = age < 450 ? age / 450 : age < 1400 ? 1 : Math.max(0, 1 - (age - 1400) / 700);
          setPosition(tn.b, { x: tn.x, y: H + 120 - rise * 260 });
          for (const p of players) {
            if (!p.alive || tn.hit.has(p)) continue;
            const q = p.body.position;
            if (Math.abs(q.x - tn.x) < 26 && q.y > tn.b.bounds.min.y - 12) {
              tn.hit.add(p);
              damagePlayer(p, 14 * bs.dmgMult);
              setVelocity(p.body, { x: Math.sign(q.x - tn.x || 1) * 7, y: -13 });
            }
          }
          if (age > 2100) {
            removeSummon(tn.b);
            bs.tentacles.splice(bs.tentacles.indexOf(tn), 1);
          }
        }
        bossTouchAll(bs, 10);
      }
    }
  ];
  var SECRET_BOSSES = [
    {
      // Conor, CEO — "THE RIZARD" (his favourite joke). Flips Rizzard <-> Tizzard.
      id: "rizard",
      name: "THE RIZARD",
      color: "#ffd166",
      secret: true,
      make() {
        return createCircle(W / 2, 150, 34, { density: 0.011, frictionAir: 0.1, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        applyForce(b, b.position, { x: 0, y: -gravityY() * worldGravityScale() * b.mass });
        const rizz = Math.floor(now / 7e3) % 2 === 0;
        b.bossType = rizz ? "rizard_rizz" : "rizard_tizz";
        if (bs.lastMode !== b.bossType) {
          bs.lastMode = b.bossType;
          if (rizz) {
            setBanner("\u{1F60E} RIZZARD MODE", "#ffd166", 1300);
            doFlash("#ffd166", 0.2);
          } else {
            setBanner("\u{1F3AF} TIZZARD MODE \u2014 LOCKED IN", "#3fb5ff", 1400, true);
            doFlash("#3fb5ff", 0.28);
          }
        }
        if (rizz) {
          if (!bs.wp || Math.hypot(bs.wp.x - b.position.x, bs.wp.y - b.position.y) < 60) bs.wp = { x: rand(180, W - 180), y: rand(90, 300) };
          const dx = bs.wp.x - b.position.x, dy = bs.wp.y - b.position.y, d = Math.hypot(dx, dy) || 1;
          setVelocity(b, { x: b.velocity.x * 0.9 + dx / d * 1, y: b.velocity.y * 0.9 + dy / d * 1 });
          if (now > (bs.nextCharm || (bs.nextCharm = now + 3200))) {
            bs.nextCharm = now + bcd(bs, 3600, 5e3);
            spawnRing(b.position.x, b.position.y, "#ff9ecb");
            setBanner(pick(["LFG!", "W RIZZ", "UNMATCHED RIZZ", "IT'S GIVING UNICORN", "HAVE YOU SEEN OUR SERIES A?", "LET ME PITCH YOU"]), "#ffd166", 1100);
            for (const p of players) {
              if (!p.alive) continue;
              if (Math.hypot(p.body.position.x - b.position.x, p.body.position.y - b.position.y) < 440) {
                p.reversedUntil = now + 2600;
                const pull = Math.sign(b.position.x - p.body.position.x) || 1;
                setVelocity(p.body, { x: p.body.velocity.x + pull * 5, y: -4 });
                spawnBurst(p.body.position.x, p.body.position.y - 10, "#ff9ecb", 8, { speed: 4, up: 3, g: -0.03 });
              }
            }
            sfx.cast();
          }
          if (now > (bs.nextDeal || (bs.nextDeal = now + 2200))) {
            bs.nextDeal = now + bcd(bs, 2e3, 2800);
            const t = bossAliveTarget(b.position);
            if (t) {
              for (const off of [-0.14, 0.14]) bossBolt(b.position, t, { speed: 10, r: 8, color: "#ff9ecb", spread: off, boom: [70, 9, 12] });
              sfx.cast();
            }
          }
        } else {
          if (!bs.focusPt || Math.hypot(bs.focusPt.x - b.position.x, bs.focusPt.y - b.position.y) < 40) {
            bs.focusPt = { x: rand(240, W - 240), y: rand(110, 240) };
          }
          const fdx = bs.focusPt.x - b.position.x, fdy = bs.focusPt.y - b.position.y, fd = Math.hypot(fdx, fdy) || 1;
          setVelocity(b, { x: b.velocity.x * 0.85 + fdx / fd * 0.9, y: b.velocity.y * 0.85 + fdy / fd * 0.9 });
          if (now > (bs.nextTrack || (bs.nextTrack = now + 850))) {
            bs.nextTrack = now + bcd(bs, 800, 1100);
            const t = bossAliveTarget(b.position);
            if (t) {
              const lead = { body: { position: { x: t.body.position.x + (t.body.velocity.x || 0) * 8, y: t.body.position.y + (t.body.velocity.y || 0) * 8 } } };
              bossBolt(b.position, lead, { speed: 15, r: 7, color: "#3fb5ff", boom: [55, 8, 13] });
              if (simRandom() < 0.3) setBanner(pick(["LFG!", "LOCKED IN", "PATTERN RECOGNIZED", "HYPERFOCUS", "I SEE THE WHOLE BOARD", "THE TIZZARD SEES ALL", "EVERY. DETAIL."]), "#3fb5ff", 1e3);
            }
            sfx.cast();
          }
          if (now > (bs.nextPattern || (bs.nextPattern = now + 3400))) {
            bs.nextPattern = now + bcd(bs, 3600, 4800);
            const t = bossAliveTarget(b.position);
            if (t) {
              spawnRing(b.position.x, b.position.y, "#3fb5ff");
              for (const off of [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36]) bossBolt(b.position, t, { speed: 12, r: 6, color: "#7fd0ff", spread: off, boom: [48, 7, 10] });
            }
            sfx.lightning();
          }
        }
        bossTouchAll(bs, rizz ? 10 : 12);
      }
    },
    {
      // Manu, CTO — lives between Germany and Mexico. Flips German <-> Mexican mode.
      id: "manu",
      name: "MANU",
      color: "#b39ddb",
      secret: true,
      make() {
        return createCircle(W / 2, 150, 32, { density: 0.011, frictionAir: 0.1, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        applyForce(b, b.position, { x: 0, y: -gravityY() * worldGravityScale() * b.mass });
        const de = Math.floor(now / 7e3) % 2 === 0;
        b.bossType = de ? "manu_de" : "manu_mx";
        if (bs.lastMode !== b.bossType) {
          bs.lastMode = b.bossType;
          if (de) {
            setBanner("\u{1F1E9}\u{1F1EA} ORDNUNG MUSS SEIN", "#d0d0d8", 1300);
            doFlash("#c0c0d0", 0.2);
          } else {
            setBanner("\u{1F1F2}\u{1F1FD} \xA1\xD3RALE!", "#6cbf5b", 1300);
            doFlash("#e15d5d", 0.2);
          }
        }
        setVelocity(b, { x: b.velocity.x * 0.92 + Math.sin(now * 1e-3) * 0.8, y: b.velocity.y * 0.9 + Math.sin(now * 3e-3) * 0.3 });
        if (b.position.y < 90) setVelocity(b, { x: b.velocity.x, y: 1.5 });
        if (b.position.y > 340) setVelocity(b, { x: b.velocity.x, y: -1.5 });
        if (de) {
          if (now > (bs.nextDe || (bs.nextDe = now + 1500))) {
            bs.nextDe = now + bcd(bs, 1500, 1500);
            const t = bossAliveTarget(b.position);
            if (t) bossBolt(b.position, t, { speed: 13, r: 7, color: "#9ec9ff", boom: [55, 8, 12] });
            if (simRandom() < 0.4) {
              const q = bossAliveTarget(null);
              if (q) applyFreeze(q, now + 700);
            }
            sfx.freeze();
          }
        } else {
          if (now > (bs.nextMx || (bs.nextMx = now + 1100))) {
            bs.nextMx = now + bcd(bs, 850, 1400);
            const t = bossAliveTarget(b.position);
            if (t) for (const off of [-0.18, 0.08]) bossBolt(b.position, t, { speed: 10, r: 8, color: "#ff7043", spread: off, boom: [70, 9, 12] });
            for (const p of players) if (p.alive && Math.hypot(p.body.position.x - b.position.x, p.body.position.y - b.position.y) < 220) p.burnUntil = now + 1600;
            if (simRandom() < 0.3) spawnParticles(b.position.x, b.position.y, pick(["#6cbf5b", "#e15d5d", "#ffd166"]), 10, 5);
            sfx.cast();
          }
        }
        bossTouchAll(bs, de ? 9 : 12);
      }
    }
  ];
  function isBossRound() {
    return !!game.boss;
  }
  var BOSS_ROMAN = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  function spawnBoss(now, opts = {}) {
    const secret = opts.bossId ? SECRET_BOSSES.some((d) => d.id === opts.bossId) : simRandom() < 0.12;
    const pool = secret ? SECRET_BOSSES : BOSSES;
    const def = opts.bossId ? [...BOSSES, ...SECRET_BOSSES].find((d) => d.id === opts.bossId) || pick(pool) : pick(pool);
    const body = def.make();
    body.bossType = def.id;
    summon(body, { life: 1e12, color: def.color });
    const num = opts.tier != null ? Math.max(1, Math.round(opts.tier)) : Math.max(1, Math.round((game.totalRounds || BOSS_EVERY) / BOSS_EVERY));
    const maxHp = Math.round((400 + 200 * Math.max(2, players.length)) * (1 + 0.4 * (num - 1)));
    const title = def.name + (num > 1 ? " " + (BOSS_ROMAN[num] || `\xD7${num}`) : "");
    game.boss = {
      def,
      body,
      hp: maxHp,
      maxHp,
      announced: false,
      invulnerableUntilAnnounced: true,
      secret,
      num,
      dmgMult: 1 + 0.12 * (num - 1),
      rate: 1 + 0.1 * (num - 1),
      title,
      enraged: false,
      enrageAt: 0,
      nextEnrageWave: 0
    };
    return game.boss;
  }
  function damageBoss(dmg, at, src) {
    const bs = game.boss;
    if (!bs || game.state !== "PLAY" || bs.hp <= 0) return;
    if (bs.invulnerableUntilAnnounced && !bs.announced) return;
    if (src && src.slot !== void 0) statFor(src).bossDmg += dmg;
    if (src && src.spellId) telBossDmg(src.spellId, dmg);
    bs.hp -= dmg;
    bs.hurtAt = simNow();
    if (at) spawnParticles(at.x, at.y, bs.def.color, 8, 4);
    if (bs.hp <= 0) slayBoss();
  }
  function slayBoss() {
    const bs = game.boss;
    const pos = { ...bs.body.position };
    removeSummon(bs.body);
    for (const tn of bs.tentacles || []) removeSummon(tn.b);
    game.boss = null;
    explode(pos.x, pos.y, 220, 26, 0, "boss");
    spawnParticles(pos.x, pos.y, bs.def.color, 40, 10, 70);
    spawnRing(pos.x, pos.y, "#ffd166");
    if (game.mode === "wave") {
      setBanner(bs.secret ? `${bs.def.name} RAGE-QUITS` : `${bs.def.name} IS SLAIN!`, "#ffd166", 1600);
      sfx.victory();
      slowMo(0.25, 900);
      return;
    }
    game.state = "ROUND_END";
    game.winner = null;
    const replayMs = startReplay(simNow());
    setBanner(bs.secret ? `${bs.def.name} RAGE-QUITS` : `${bs.def.name} IS SLAIN!`, "#ffd166", 1800 + replayMs);
    sfx.victory();
    slowMo(0.25, 1100);
    scheduleIn(1900 + replayMs, () => {
      if (game.state === "ROUND_END") startRound(nextMapIndex());
    }, "round");
  }
  function updateBoss(now) {
    const bs = game.boss;
    if (!bs || game.state !== "PLAY") return;
    if (!bs.announced) {
      if (now > (game.fightAt || 0) + 800) {
        bs.announced = true;
        if (bs.secret) {
          setBanner(`\u2753 SECRET BOSS \u2753  ${bs.title}`, bs.def.color, 2800, true);
          doFlash(bs.def.color, 0.45);
          addShake(16);
        } else {
          setBanner(`${bs.title} AWAKENS`, bs.def.color, 2200);
          doFlash(bs.def.color, 0.25);
          addShake(10);
        }
        sfx.boss();
        bs.enrageAt = now + Math.max(2e4, 38e3 - (bs.num - 1) * 4e3);
      }
      return;
    }
    bs.def.update(bs, now);
    if (!bs.enraged && bs.enrageAt && now > bs.enrageAt) {
      bs.enraged = true;
      bs.dmgMult *= 1.6;
      bs.title += " \u2014 ENRAGED";
      setBanner(`${bs.def.name} IS ENRAGED!`, "#ff4d4d", 2e3);
      doFlash("#ff4d4d", 0.35);
      addShake(14);
      sfx.boss();
      bs.nextEnrageWave = now + 1600;
    }
    if (bs.enraged && now > bs.nextEnrageWave) {
      bs.nextEnrageWave = now + 1500;
      const { x, y } = bs.body.position;
      explode(x, y, 210, 12, 14 * bs.dmgMult, "boss");
      spawnRing(x, y, "#ff4d4d");
      addShake(8);
    }
  }

  // src/sim/ai/enemies.js
  var enemies_exports = {};
  __export(enemies_exports, {
    ENEMY_TYPES: () => ENEMY_TYPES,
    damageEnemy: () => damageEnemy,
    enemies: () => enemies,
    enemyBolt: () => enemyBolt,
    enemyChase: () => enemyChase,
    enemyStrike: () => enemyStrike,
    killEnemy: () => killEnemy,
    spawnEnemy: () => spawnEnemy,
    updateEnemies: () => updateEnemies
  });
  var enemies = /* @__PURE__ */ new Set();
  onWorldReset(() => enemies.clear());
  function enemyBolt(from, target, { speed = 9, r = 7, color = "#ff8c5a", spread = 0, boom = [55, 8, 10] } = {}) {
    const t = target.body.position;
    const a = Math.atan2(t.y - from.y, t.x - from.x) + spread;
    const fb = createCircle(from.x + Math.cos(a) * 24, from.y + Math.sin(a) * 24, r, { density: 4e-3, frictionAir: 0, label: "projectile" });
    fb.owner = "boss";
    fb.color = color;
    fb.gravityScale = 0.3;
    fb.expireAt = simNow() + 5e3;
    fb.onHit = (self) => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2], "boss");
    setVelocity(fb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
    projectiles.add(fb);
    addBody(fb);
    return fb;
  }
  function enemyStrike(b, e, reach = 34) {
    const t = bossAliveTarget(b.position);
    if (!t) return;
    const q = t.body.position;
    if (Math.abs(q.x - b.position.x) < reach && Math.abs(q.y - b.position.y) < 44 && pairCooldown.readySelf(b, 700, "enemy-swing")) {
      damagePlayer(t, e.dmg);
      const away = Math.sign(q.x - b.position.x) || 1;
      setVelocity(t.body, { x: away * 6, y: -5 });
      spawnParticles(q.x, q.y, e.color, 6, 4);
    }
  }
  function enemyChase(b, now, { speed = 1.1, jump = true } = {}) {
    const t = bossAliveTarget(b.position);
    if (!t) return null;
    const dir = Math.sign(t.body.position.x - b.position.x) || 1;
    setVelocity(b, { x: b.velocity.x * 0.8 + dir * speed, y: b.velocity.y });
    const grounded2 = Math.abs(b.velocity.y) < 1;
    if (jump && grounded2 && t.body.position.y < b.position.y - 60 && now > (b._jumpAt || 0)) {
      b._jumpAt = now + 900;
      setVelocity(b, { x: b.velocity.x, y: -11 });
    }
    return t;
  }
  var ENEMY_TYPES = {
    // grunt: marches in and swings a blade
    swordsman: {
      color: "#5b5470",
      hp: 40,
      dmg: 12,
      make(x, y) {
        return createBox(x, y, 26, 44, { density: 0.012, friction: 0.6, frictionAir: 0.02, restitution: 0, label: "enemy", chamfer: { radius: 6 } });
      },
      ai(e, b, now) {
        enemyChase(b, now, { speed: 1.15 });
        enemyStrike(b, e, 36);
      }
    },
    // ranged: hangs back and fires bolts, backpedals when crowded
    archer: {
      color: "#8fce7a",
      hp: 28,
      dmg: 9,
      make(x, y) {
        return createBox(x, y, 24, 42, { density: 0.01, friction: 0.6, frictionAir: 0.03, restitution: 0, label: "enemy", chamfer: { radius: 6 } });
      },
      ai(e, b, now) {
        const t = bossAliveTarget(b.position);
        if (!t) return;
        const d = Math.hypot(t.body.position.x - b.position.x, t.body.position.y - b.position.y);
        const dir = Math.sign(t.body.position.x - b.position.x) || 1;
        const move = d > 360 ? dir : d < 200 ? -dir : 0;
        setVelocity(b, { x: b.velocity.x * 0.82 + move * 1, y: b.velocity.y });
        if (now > (b._fireAt || (b._fireAt = now + 900))) {
          b._fireAt = now + rand(1400, 2100);
          enemyBolt(b.position, t, { speed: 10, r: 6, color: "#8fce7a", boom: [50, 7, e.dmg] });
          sfx.cast?.();
        }
      }
    },
    // swarm: small, fast, hops straight at the nearest wizard
    bug: {
      color: "#b57edc",
      hp: 14,
      dmg: 7,
      make(x, y) {
        return createCircle(x, y, 12, { density: 4e-3, friction: 0.4, frictionAir: 0.01, restitution: 0.5, label: "enemy" });
      },
      ai(e, b, now) {
        const t = bossAliveTarget(b.position);
        if (!t) return;
        const dir = Math.sign(t.body.position.x - b.position.x) || 1;
        if (Math.abs(b.velocity.y) < 1 && now > (b._hopAt || 0)) {
          b._hopAt = now + rand(320, 560);
          setVelocity(b, { x: dir * rand(3, 5.5), y: -7 });
        }
        enemyStrike(b, e, 20);
      }
    },
    // heavy: slow, tanky, leaps and slams the ground for an AoE shock
    ogre: {
      color: "#c98a4a",
      hp: 120,
      dmg: 20,
      make(x, y) {
        return createBox(x, y, 54, 70, { density: 0.03, friction: 0.8, frictionAir: 0.02, restitution: 0, label: "enemy", chamfer: { radius: 8 } });
      },
      ai(e, b, now) {
        const t = enemyChase(b, now, { speed: 0.7, jump: false });
        if (!t) return;
        if (now > (b._leapAt || (b._leapAt = now + 2500)) && Math.abs(b.velocity.y) < 1) {
          b._leapAt = now + rand(4e3, 6e3);
          b._airborne = true;
          const dir = Math.sign(t.body.position.x - b.position.x) || 1;
          setVelocity(b, { x: dir * rand(4, 7), y: -14 });
          sfx.boing?.();
        }
        if (b._airborne && b.velocity.y >= 0 && Math.abs(b.velocity.y) < 0.8) {
          b._airborne = false;
          explode(b.position.x, b.position.y + 24, 110, 14, e.dmg, "boss");
          addShake(10);
        }
        enemyStrike(b, e, 44);
      }
    }
  };
  function spawnEnemy(type, x, y, tier = 1) {
    const def = ENEMY_TYPES[type];
    if (!def) return null;
    const b = def.make(x, y);
    b.label = "enemy";
    if (type !== "bug") {
      setFixedRotation(b, true);
      setAngle(b, 0);
    }
    const hp = Math.round(def.hp * (1 + 0.35 * (tier - 1)));
    const e = { type, tier, color: def.color, hp, maxHp: hp, dmg: def.dmg * (1 + 0.25 * (tier - 1)), hurtAt: 0, body: b };
    b.enemy = e;
    enemies.add(b);
    summon(b, { life: 1e12, color: def.color });
    return e;
  }
  function damageEnemy(e, dmg, at, src) {
    if (!e || e.hp <= 0) return;
    e.hp -= dmg;
    e.hurtAt = simNow();
    if (at) spawnParticles(at.x, at.y, e.color, 6, 4);
    if (e.hp <= 0) killEnemy(e, src);
  }
  function killEnemy(e, src) {
    const b = e.body;
    if (!enemies.has(b)) return;
    enemies.delete(b);
    spawnParticles(b.position.x, b.position.y, e.color, 18, 8, 40);
    spawnRing(b.position.x, b.position.y, e.color);
    removeSummon(b);
    sfx.death?.();
  }
  function updateEnemies(now) {
    if (game.state !== "PLAY") return;
    for (const b of [...enemies]) {
      if (!summons.has(b)) {
        enemies.delete(b);
        continue;
      }
      const e = b.enemy;
      if (!e || e.hp <= 0) {
        enemies.delete(b);
        continue;
      }
      ENEMY_TYPES[e.type].ai(e, b, now);
    }
  }

  // src/sim/maps/builders.js
  var builders_exports = {};
  __export(builders_exports, {
    MAPS: () => MAPS,
    addAlcove: () => addAlcove,
    addBarrels: () => addBarrels,
    addBody: () => addBody2,
    addBumper: () => addBumper,
    addChandelier: () => addChandelier,
    addCoverPillar: () => addCoverPillar,
    addCrystalCluster: () => addCrystalCluster,
    addDestructible: () => addDestructible,
    addGiantMushroom: () => addGiantMushroom,
    addGlacierSpire: () => addGlacierSpire,
    addHangingPlatform: () => addHangingPlatform,
    addIceBlock: () => addIceBlock,
    addIcicles: () => addIcicles,
    addLava: () => addLava,
    addMover: () => addMover,
    addObsidianFang: () => addObsidianFang,
    addPendulumBall: () => addPendulumBall,
    addSeesaw: () => addSeesaw,
    addSpinner: () => addSpinner,
    addStatic: () => addStatic,
    addStoneArch: () => addStoneArch,
    addThemedCover: () => addThemedCover,
    addTree: () => addTree,
    addWallGap: () => addWallGap,
    applyWind: () => applyWind,
    breakDestructible: () => breakDestructible,
    buildBridge: () => buildBridge,
    buildCratePyramid: () => buildCratePyramid,
    buildCrateStack: () => buildCrateStack,
    damageDestructible: () => damageDestructible,
    defineMap: () => defineMap,
    ensureSetPiece: () => ensureSetPiece,
    isLeafy: () => isLeafy,
    keepPendulumsSwinging: () => keepPendulumsSwinging,
    updateBoulders: () => updateBoulders,
    updateCrateRain: () => updateCrateRain,
    updateGeysers: () => updateGeysers,
    updateIcicles: () => updateIcicles,
    updateMovers: () => updateMovers,
    updateStrikes: () => updateStrikes
  });

  // src/sim/events.js
  var events_exports = {};
  __export(events_exports, {
    ENV_EVENTS: () => ENV_EVENTS,
    ENV_EVENT_CHANCE: () => ENV_EVENT_CHANCE,
    envEventById: () => envEventById,
    killVine: () => killVine,
    platformSpots: () => platformSpots,
    rollEnvEvent: () => rollEnvEvent,
    updateEnvEvent: () => updateEnvEvent
  });
  var ENV_EVENT_CHANCE = 0.2;
  var SPAWN_CLEAR = 55;
  var inSpawnColumn = (m, x) => (m.def.spawns || []).some((s) => Math.abs(s.x - x) < SPAWN_CLEAR);
  function platformSpots(m, n, rng) {
    const rr = rng ? (a, b) => a + rng() * (b - a) : rand;
    const solid = (x) => (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 && b.bounds.min.x > -60 && b.bounds.max.x < W + 60 && x > b.bounds.min.x + 8 && x < b.bounds.max.x - 8;
    const spots = [];
    for (let pass = 0; pass < 2 && spots.length < n; pass++) {
      for (let tries = 0; tries < n * 10 && spots.length < n; tries++) {
        const x = rr(90, W - 90);
        if (pass === 0 && inSpawnColumn(m, x)) continue;
        const col = queryRegion(column(x), { container: m.composite, filter: solid(x) });
        if (!col.length) continue;
        const tops = col.map((b) => b.bounds.min.y).filter((y2) => y2 > 150 && y2 < H - 60);
        if (!tops.length) continue;
        const y = Math.min(...tops);
        if (spots.some((s) => Math.abs(s.x - x) < 70 && Math.abs(s.y - y) < 60)) continue;
        spots.push({ x, y });
      }
    }
    return spots;
  }
  function killVine(v) {
    const vines = currentMap.data.vines;
    if (!vines || !vines.includes(v)) return;
    vines.splice(vines.indexOf(v), 1);
    removeFrom(currentMap.composite, v);
    spawnParticles(v.position.x, v.position.y, "#7bd88f", 12, 4);
    sfx.squeak();
  }
  var ENV_EVENTS = [
    {
      id: "overgrowth",
      name: "OVERGROWTH",
      color: "#7bd88f",
      start(m, now) {
        m.data.vines = [];
        for (const s of platformSpots(m, 12)) {
          const v = createBox(s.x, s.y - 24, 22, 48, { isStatic: true, isSensor: true, label: "vine" });
          v.render.fillStyle = "#4f8a3d";
          v.kinematic = true;
          v.bornAt = now;
          addTo(m.composite, v);
          m.data.vines.push(v);
        }
      },
      update(m, now) {
        for (const p of players) {
          if (!p.alive) continue;
          for (const v of m.data.vines || []) {
            if (Math.abs(p.body.position.x - v.position.x) < 26 && Math.abs(p.body.position.y - v.position.y) < 44) {
              p.vineSlowUntil = now + 130;
              break;
            }
          }
        }
      }
    },
    {
      id: "winter",
      name: "WINTER",
      color: "#bfe8ff",
      start(m) {
        m.data.eventIcy = true;
        for (const b of allBodies(m.composite)) {
          if (b.isStatic && !b.isSensor) setFriction(b, 0.01);
        }
      }
    },
    {
      id: "tempest",
      name: "TEMPEST",
      color: "#9ef0f0",
      update(m, now) {
        applyWind(Math.sin(now / 1400) * 0.38);
        updateStrikes(m, now, 3200, 20);
      }
    },
    {
      id: "meteors",
      name: "METEOR SHOWER",
      color: "#ff8c5a",
      update(m, now) {
        if (now > (m.data.nextMeteor || (m.data.nextMeteor = now + 1600))) {
          m.data.nextMeteor = now + rand(1800, 3200);
          const fb = dropProjectile(null, rand(80, W - 80), -30, { r: 11, vx: rand(-3, 3), vy: 10, color: "#ff8c5a", density: 6e-3, expireMs: 9e3 });
          fb.onHit = (self) => explode(self.position.x, self.position.y, 95, 14, 16, null);
        }
      }
    },
    {
      id: "moonshot",
      name: "MOONSHOT",
      color: "#e8d5ff",
      start() {
        push({ kind: "scale", value: 0.45 });
      }
    },
    {
      id: "nightfall",
      name: "NIGHTFALL",
      color: "#3d2f5c"
    },
    {
      id: "quake",
      name: "EARTHQUAKE",
      color: "#b08948",
      update(m, now) {
        if (now > (m.data.nextQuake || (m.data.nextQuake = now + 2600))) {
          m.data.nextQuake = now + rand(3500, 6e3);
          m.data.quakeUntil = now + 900;
          sfx.explosion();
        }
        if (now < (m.data.quakeUntil || 0)) {
          addShake(1.3);
          if (simRandom() < 0.25) {
            for (const b of allBodies()) {
              if (b.isStatic || b.isSensor) continue;
              addVelocity(b, { x: perSecond(rand(-1.6, 1.6)), y: -perSecond(rand(0, 1.2)) });
            }
          }
        }
      }
    },
    {
      id: "rubber",
      name: "RUBBER WORLD",
      color: "#ff8fc7",
      start(m) {
        for (const b of allBodies(m.composite)) {
          if (b.isStatic && !b.isSensor) setRestitution(b, 0.9);
        }
      }
    },
    {
      id: "critters",
      name: "CRITTER PLAGUE",
      color: "#9be15d",
      update(m, now) {
        if (now > (m.data.nextCritter || (m.data.nextCritter = now + 2e3))) {
          m.data.nextCritter = now + rand(2200, 3600);
          if ([...summons].filter((b) => b.label === "critter").length < 8) {
            const side = pick([-1, 1]);
            const b = createCircle(side < 0 ? -14 : W + 14, rand(80, 300), 9, { density: 2e-3, friction: 0.5, restitution: 0.4, label: "critter" });
            b.critter = { hopAt: 0, dir: -side, hop: 6, speed: 4 };
            summon(b, { life: 22e3, color: pick(["#9be15d", "#e15d5d", "#c084fc"]), contactDamage: 6 });
            setVelocity(b, { x: -side * 4, y: 0 });
          }
        }
      }
    },
    {
      id: "surge",
      name: "ARCANE SURGE",
      color: "#ffd166",
      update(m, now) {
        if (now > (m.data.nextSurge || (m.data.nextSurge = now + 1200))) {
          m.data.nextSurge = now + rand(1400, 2200);
          if (tomes.size < 10) spawnTome(now);
        }
      }
    }
  ];
  function envEventById(id) {
    return ENV_EVENTS.find((e) => e.id === id) || null;
  }
  function rollEnvEvent(now) {
    game.envEvent = null;
    if (simRandom() >= ENV_EVENT_CHANCE) return;
    const def = pick(ENV_EVENTS);
    game.envEvent = { def, announced: false };
    def.start?.(currentMap, now);
  }
  function updateEnvEvent(now) {
    const ev = game.envEvent;
    if (!ev || game.state !== "PLAY") return;
    if (!ev.announced && now > (game.fightAt || 0) + 800) {
      ev.announced = true;
      setBanner(ev.def.name, ev.def.color, 1700);
      doFlash(ev.def.color, 0.18);
      sfx.event();
    }
    if (ev.announced) ev.def.update?.(currentMap, now);
  }

  // src/sim/maps/builders.js
  var MAPS = [];
  function defineMap(def) {
    MAPS.push(def);
  }
  function addBody2(m, body, color) {
    if (color) body.render.fillStyle = color;
    addTo(m.composite, body);
    return body;
  }
  function addStatic(m, x, y, w, h, opts = {}) {
    const b = createBox(x, y, w, h, {
      isStatic: true,
      friction: opts.friction ?? 0.6,
      restitution: opts.restitution ?? 0,
      angle: opts.angle ?? 0,
      label: opts.label || "terrain"
    });
    b.w = w;
    b.h = h;
    return addBody2(m, b, opts.color || "#171221");
  }
  function addDestructible(m, x, y, w, h, opts = {}) {
    const b = createBox(x, y, w, h, { isStatic: true, friction: 0.6, restitution: opts.rest ?? 0, angle: opts.angle ?? 0, label: "destructible" });
    b.w = w;
    b.h = h;
    b.maxHp = opts.hp ?? 45;
    b.hp = b.maxHp;
    b.dcolor = opts.color || "#6b4a2a";
    b.debrisN = opts.debris ?? 4;
    b.kind = opts.kind || "wood";
    return addBody2(m, b, b.dcolor);
  }
  function damageDestructible(b, dmg) {
    if (b.hp == null || b.hp <= 0) return;
    if (b.hp === b.maxHp && b.kind === "wood" && isLeafy(b.dcolor) && simRandom() < 0.75) {
      spawnBurst(b.position.x, b.position.y - 10, "#2c2438", 3, { kind: "bird", dir: -Math.PI / 2, spread: 1.8, speed: 2.5, up: 3, g: -0.02, life: 85, r: 3 });
    }
    b.hp -= dmg;
    spawnParticles(b.position.x + rand(-b.w / 2, b.w / 2), b.position.y + rand(-b.h / 2, b.h / 2), b.dcolor, 3, 3, 20);
    if (b.hp <= 0) breakDestructible(b);
  }
  function breakDestructible(b) {
    const { x, y } = b.position;
    removeFrom(currentMap.composite, b);
    (currentMap.data.broken ||= []).push([Math.round(x), Math.round(y)]);
    spawnParticles(x, y, b.dcolor, 16, 6, 40);
    for (let i = 0; i < (b.debrisN || 4); i++) {
      const g = createBox(x + rand(-b.w / 3, b.w / 3), y + rand(-b.h / 3, b.h / 3), rand(6, 13), rand(6, 13), { density: 1e-3, frictionAir: 0.02, label: "gib" });
      g.color = b.dcolor;
      g.dieAt = simNow() + 2600;
      setVelocity(g, { x: rand(-6, 6), y: rand(-9, -2) });
      setAngularVelocity(g, rand(-0.5, 0.5));
      gibs.add(g);
      addBody(g);
    }
    explode(x, y, 80, 10, 9, null);
    if (b.kind === "ice") {
      const now = simNow();
      for (const q of players) {
        if (!q.alive) continue;
        if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 100) applyFreeze(q, Math.max(q.frozenUntil || 0, now + 450));
      }
      spawnParticles(x, y, "#eaffff", 12, 5, 30);
      sfx.freeze?.();
    }
    addShake(3);
    sfx.thud?.();
  }
  function addIceBlock(m, x, groundY, tall = 2) {
    for (let i = 0; i < tall; i++) {
      addDestructible(m, x, groundY - 23 - i * 46, 46, 44, { hp: 55, color: i % 2 ? "#9fd8f0" : "#bfe8ff", debris: 5, kind: "ice" });
    }
  }
  function addGlacierSpire(m, x, groundY, s = 1) {
    const widths = [66, 50, 36, 24];
    let y = groundY;
    for (let i = 0; i < widths.length; i++) {
      const h = (i === widths.length - 1 ? 56 : 42) * s;
      addDestructible(m, x + (i % 2 ? 3 : -2) * s, y - h / 2, widths[i] * s, h, { hp: 55, color: i % 2 ? "#9fd8f0" : "#bfe8ff", debris: 5, kind: "ice" });
      y -= h;
    }
  }
  function addObsidianFang(m, x, groundY, s = 1) {
    const widths = [58, 42, 28, 16];
    let y = groundY;
    for (let i = 0; i < widths.length; i++) {
      const h = (i === widths.length - 1 ? 48 : 40) * s;
      addDestructible(m, x + (i % 2 ? -3 : 2) * s, y - h / 2, widths[i] * s, h, { hp: 70, color: i % 2 ? "#241a2e" : "#2e2238", debris: 5, kind: "obsidian" });
      y -= h;
    }
  }
  function addGiantMushroom(m, x, groundY, s = 1) {
    const stalkH = 44 * s;
    for (let i = 0; i < 2; i++) addDestructible(m, x, groundY - stalkH / 2 - i * stalkH, 28 * s, stalkH, { hp: 45, color: i % 2 ? "#ded2b4" : "#e8dcc0", debris: 4, kind: "shroom" });
    addDestructible(m, x, groundY - 2 * stalkH - 15 * s, 116 * s, 30 * s, { hp: 60, color: "#c75e54", debris: 7, kind: "shroom", rest: 1.1 });
  }
  function addStoneArch(m, x, groundY, s = 1) {
    for (const side of [-1, 1]) addCoverPillar(m, x + side * 70 * s, groundY, 130 * s, 34 * s, "#8a7a5c");
    addDestructible(m, x, groundY - 130 * s - 12 * s, 190 * s, 24 * s, { hp: 60, color: "#9a8a68", debris: 6, kind: "stone" });
  }
  function addCrystalCluster(m, x, groundY, s = 1) {
    for (const [dx, ang, w, h, c] of [
      [-26, -0.32, 24, 88, "#8a6de0"],
      [4, 0.08, 30, 120, "#a88df0"],
      [32, 0.38, 20, 70, "#c8b8ff"]
    ]) {
      addDestructible(m, x + dx * s, groundY - h / 2 * s + 4, w * s, h * s, { hp: 55, color: c, debris: 5, kind: "ice", angle: ang });
    }
  }
  function ensureSetPiece(m, rng) {
    if (m.def.cozy || rng() < 0.25) return;
    const spots = platformSpots(m, 3, rng);
    if (!spots.length) return;
    const spot = spots[Math.floor(rng() * spots.length)];
    const x = Math.max(120, Math.min(W - 120, spot.x)), y = spot.y + 8;
    const c = m.def.cover;
    const s = 0.85 + rng() * 0.4;
    if (c === "ice") addGlacierSpire(m, x, y, s);
    else if (c === "rock") addObsidianFang(m, x, y, s);
    else if (c === "tree") {
      if (m.def.muddy) addGiantMushroom(m, x, y, s);
      else addTree(m, x, y, 1.1 * s);
    } else if (c === "pillar") {
      if (m.def.stars) addCrystalCluster(m, x, y, s);
      else addStoneArch(m, x, y, Math.min(s, 1));
    }
  }
  function addThemedCover(m, x, groundY, rr, pk) {
    const kind = m.def?.cover || (m.def?.icy ? "ice" : "pillar");
    if (kind === "tree") addTree(m, x, groundY, rr(0.55, 0.75));
    else if (kind === "ice") {
      if (rr(0, 1) < 0.3) addGlacierSpire(m, x, groundY, rr(0.55, 0.75));
      else addIceBlock(m, x, groundY, pk([2, 2, 3]));
    } else if (kind === "rock") addDestructible(m, x, groundY - 24, 54, 46, { hp: 65, color: "#5a5245", debris: 6, kind: "stone" });
    else if (kind === "crate") addDestructible(m, x, groundY - 24, 46, 46, { hp: 45, color: "#9a7440", debris: 5, kind: "crate" });
    else addCoverPillar(m, x, groundY, pk([90, 120, 130]));
  }
  function addTree(m, x, groundY, scale2 = 1) {
    const trunkW = 34 * scale2, seg = 42 * scale2, segs = 4;
    for (let i = 0; i < segs; i++) {
      addDestructible(m, x, groundY - seg / 2 - i * seg, trunkW, seg, { hp: 60, color: i % 2 ? "#5a3d22" : "#6b4a2a", debris: 5 });
    }
    const cy = groundY - segs * seg;
    for (const [dx, dy, w, h, c] of [
      [0, -26 * scale2, 130 * scale2, 62 * scale2, "#3f7d3a"],
      [-72 * scale2, 8 * scale2, 84 * scale2, 58 * scale2, "#356b33"],
      [72 * scale2, 8 * scale2, 84 * scale2, 58 * scale2, "#356b33"],
      [-34 * scale2, -68 * scale2, 96 * scale2, 56 * scale2, "#4a8f42"],
      [42 * scale2, -64 * scale2, 88 * scale2, 54 * scale2, "#4a8f42"]
    ]) {
      addDestructible(m, x + dx, cy + dy, w, h, { hp: 40, color: c, debris: 6 });
    }
  }
  function addAlcove(m, x, floorY, w = 160, h = 96, side = 1, color) {
    addStatic(m, x, floorY, w, 20, { color });
    addStatic(m, x + side * (w / 2 - 12), floorY - h / 2, 24, h, { color });
    addStatic(m, x, floorY - h + 10, w, 20, { color });
  }
  function addWallGap(m, x, y0, y1, gapC, gapH = 84, wallW = 48, color) {
    const topH = gapC - gapH / 2 - y0;
    const botH = y1 - (gapC + gapH / 2);
    if (topH > 8) addStatic(m, x, y0 + topH / 2, wallW, topH, { color });
    if (botH > 8) addStatic(m, x, gapC + gapH / 2 + botH / 2, wallW, botH, { color });
  }
  function addCoverPillar(m, x, groundY, h = 120, w = 40, color = "#6b6b7a") {
    const segs = Math.max(2, Math.round(h / 40));
    const seg = h / segs;
    for (let i = 0; i < segs; i++) addDestructible(m, x, groundY - seg / 2 - i * seg, w, seg, { hp: 50, color, debris: 4, kind: "stone" });
  }
  function addLava(m, y = H - 22, acid = false) {
    m.data.lavaY = y;
    m.data.acid = acid;
    m.data.lavaBody = createBox(W / 2, y + 30, W * 2, 60, { isStatic: true, isSensor: true, label: "lava" });
    addTo(m.composite, m.data.lavaBody);
  }
  function buildCrateStack(m, cx, bottomY, cols, rows) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const crate = createBox(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody2(m, crate, "#b08948");
      }
    }
  }
  function buildCratePyramid(m, cx, bottomY, baseCols) {
    for (let row = 0; row < baseCols; row++) {
      const cols = baseCols - row;
      for (let col = 0; col < cols; col++) {
        const crate = createBox(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody2(m, crate, "#b08948");
      }
    }
  }
  function buildBridge(m, x0, x1, y) {
    const n = 9, step = (x1 - x0) / n;
    let prev = null;
    for (let i = 0; i < n; i++) {
      const plank = createBox(x0 + step * (i + 0.5), y, Math.abs(step) - 4, 10, { density: 2e-3, friction: 0.5, label: "plank" });
      plank.rope = true;
      addBody2(m, plank, "#8a6f4d");
      const link = prev ? createJoint({ bodyA: prev, bodyB: plank, pointA: { x: step / 2, y: 0 }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 }) : createJoint({ bodyB: plank, pointA: { x: x0, y }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 });
      link.label = "breakable";
      addTo(m.composite, link);
      prev = plank;
    }
    const end = createJoint({ bodyA: prev, pointA: { x: step / 2, y: 0 }, pointB: { x: x1, y }, stiffness: 0.9, length: 4 });
    end.label = "breakable";
    addTo(m.composite, end);
  }
  function addSeesaw(m, x, y, w = 220) {
    const plank = createBox(x, y, w, 12, { density: 4e-3, friction: 0.6, label: "plank" });
    plank.w = w;
    plank.h = 12;
    addBody2(m, plank, "#8a6f4d");
    const pivot = createJoint({ pointA: { x, y }, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0 });
    pivot.label = "pivot";
    addTo(m.composite, pivot);
    addStatic(m, x, y + 34, 14, 44);
  }
  function addChandelier(m, x, topY, dropLen, r = 26) {
    const ball = createCircle(x, topY + dropLen, r, { density: 8e-3, friction: 0.4, label: "ball" });
    addBody2(m, ball, "#100c18");
    const rope = createJoint({ pointA: { x, y: topY }, bodyB: ball, stiffness: 0.95, length: dropLen });
    rope.label = "breakable";
    addTo(m.composite, rope);
  }
  function addHangingPlatform(m, x, topY, dropLen, w = 150) {
    const plat = createBox(x, topY + dropLen, w, 14, { density: 3e-3, friction: 0.6, label: "plank" });
    plat.w = w;
    plat.h = 14;
    addBody2(m, plat, "#8a6f4d");
    for (const side of [-1, 1]) {
      const rope = createJoint({
        pointA: { x: x + side * (w / 2 - 10), y: topY },
        bodyB: plat,
        pointB: { x: side * (w / 2 - 10), y: 0 },
        stiffness: 0.9,
        length: dropLen
      });
      rope.label = "breakable";
      addTo(m.composite, rope);
    }
  }
  function addBarrels(m, xs, y) {
    for (const x of xs) {
      const b = createCircle(x, y, 14, { density: 2e-3, friction: 0.3, restitution: 0.3, label: "barrel" });
      addBody2(m, b, "#7d5a9e");
    }
  }
  function addPendulumBall(m, x, topY, len, r = 45, shove = 14) {
    const ball = createCircle(x, topY + len, r, { density: 0.01, friction: 0.3, restitution: 0.4, label: "ball" });
    addBody2(m, ball, "#100c18");
    const chain = createJoint({ pointA: { x, y: topY }, bodyB: ball, stiffness: 1, length: len });
    chain.label = "chain";
    addTo(m.composite, chain);
    setVelocity(ball, { x: shove, y: 0 });
    (m.data.pendulums ??= []).push(ball);
    return ball;
  }
  function keepPendulumsSwinging(m) {
    for (const b of m.data.pendulums || []) {
      if (Math.hypot(b.velocity.x, b.velocity.y) < 2.5) {
        addVelocity(b, { x: perSecond(b.position.x < W / 2 ? 1.5 : -1.5), y: 0 });
      }
    }
  }
  function addSpinner(m, x, y, len, rate = 0.02, color = "#2c2438") {
    const b = addStatic(m, x, y, len, 16, { color });
    b.spin = rate;
    return b;
  }
  function addMover(m, x, y, w, h, { ay = 80, period = 3e3, color } = {}) {
    const b = addStatic(m, x, y, w, h, { color });
    b.kinematic = true;
    (m.data.movers ??= []).push({ b, x, y, ay, phase: rand(0, 6.28), period });
    return b;
  }
  function updateMovers(m, now) {
    for (const mv of m.data.movers || []) {
      setPosition(mv.b, { x: mv.x, y: mv.y + Math.sin(now / mv.period * Math.PI * 2 + mv.phase) * mv.ay });
    }
  }
  function addBumper(m, x, y, r = 22) {
    const b = createCircle(x, y, r, { isStatic: true, restitution: 1.4, label: "bouncy" });
    return addBody2(m, b, "#ff8fc7");
  }
  function addIcicles(m, xs, y = 80) {
    m.data.icicles = [];
    for (const x of xs) {
      const ice = createPolygon(x, y, 3, 24, { isStatic: true, density: 8e-3, angle: Math.PI / 2, label: "icicle" });
      addBody2(m, ice, "#bfe8ff");
      m.data.icicles.push({ body: ice, shakeAt: 0, fallen: false });
    }
  }
  function updateIcicles(m, now) {
    for (const ic of m.data.icicles || []) {
      if (ic.fallen) continue;
      if (ic.body._blast && !ic.shakeAt) ic.shakeAt = now;
      const ix = ic.body.position.x;
      if (!ic.shakeAt) {
        const trig = players.some((p) => p.alive && Math.abs(p.body.position.x - ix) < 42 && p.body.position.y > ic.body.position.y);
        if (trig) ic.shakeAt = now;
      } else if (now - ic.shakeAt > 350) {
        ic.fallen = true;
        setType(ic.body, "dynamic");
        setVelocity(ic.body, { x: 0, y: 2 });
      } else if (simRandom() < 0.3) {
        spawnParticle({ kind: "square", x: ix + rand(-8, 8), y: ic.body.position.y + 20, vx: 0, vy: 1, life: 20, maxLife: 20, color: "#bfe8ff", r: 2 });
      }
    }
  }
  function applyWind(fx) {
    const dv = perSecond(fx);
    for (const b of allBodies()) {
      if (b.isStatic || b.isSensor) continue;
      addVelocity(b, { x: dv, y: 0 });
    }
  }
  function updateGeysers(m, now) {
    for (const g of m.data.geysers || []) {
      if (now > (g.nextAt || 0)) {
        g.nextAt = now + rand(2500, 5e3);
        explode(g.x, g.y, 90, 16, 6);
      }
    }
  }
  function updateStrikes(m, now, interval = 2800, dmg = 22) {
    if (now > (m.data.nextStrike || (m.data.nextStrike = now + interval))) {
      m.data.nextStrike = now + rand(interval * 0.6, interval * 1.4);
      const xs = m.data.strikeXs;
      skyBolt(xs ? pick(xs) + rand(-40, 40) : rand(80, W - 80), dmg, null);
    }
  }
  function updateCrateRain(m, now, cap = 26, interval = 2600) {
    if (now > (m.data.nextCrate || 0)) {
      m.data.nextCrate = now + interval;
      if ((m.data.rained || 0) < cap) {
        m.data.rained = (m.data.rained || 0) + 1;
        const crate = createBox(rand(100, W - 100), -40, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody2(m, crate, "#b08948");
      }
    }
  }
  function updateBoulders(m, now, interval = 5e3) {
    if (now > (m.data.nextBoulder || (m.data.nextBoulder = now + 2500))) {
      m.data.nextBoulder = now + interval;
      const side = pick([-1, 1]);
      const rock = createCircle(side < 0 ? -20 : W + 20, m.data.boulderY ?? 100, 24, { density: 0.01, friction: 0.4, restitution: 0.2, label: "ball" });
      addBody2(m, rock, "#5a5245");
      setVelocity(rock, { x: -side * rand(8, 14), y: 0 });
    }
  }
  function isLeafy(hex) {
    if (typeof hex !== "string" || hex[0] !== "#") return false;
    return parseInt(hex.slice(3, 5), 16) > parseInt(hex.slice(1, 3), 16) + 20;
  }

  // src/sim/player/controller.js
  var controller_exports = {};
  __export(controller_exports, {
    gravDirFor: () => gravDirFor,
    grounded: () => grounded,
    updatePlayers: () => updatePlayers
  });
  function gravDirFor(p) {
    if (p && simNow() < (p.gravityLockUntil || 0)) return p.gravityLockDir;
    return gravityY() < 0 ? -1 : 1;
  }
  function grounded(p) {
    const { x, y } = p.body.position;
    const s = p.sizeScale || 1;
    const dir = gravDirFor(p);
    const y0 = y + 14 * s * dir, y1 = y + 22 * s * dir;
    const below = queryRegion({
      min: { x: x - 11 * s, y: Math.min(y0, y1) },
      max: { x: x + 11 * s, y: Math.max(y0, y1) }
    });
    return below.some((b) => b !== p.body && b.label !== "projectile" && b.label !== "lava" && b.label !== "gib" && b.collisionFilter.mask !== 0);
  }
  function updatePlayers(now) {
    for (const p of players) {
      if (!p.alive) continue;
      const body = p.body;
      const frozen = now < p.frozenUntil;
      const slipped = now < (p.slipUntil || 0);
      const piggy = now < (p.pigUntil || 0);
      const base2 = p.megaCasts > 0 || now < p.megaUntil ? 2 : 1;
      let mod = 1;
      if (now < (p.shrinkUntil || 0) || piggy) mod = 0.6;
      else if (now < (p.growUntil || 0)) mod = 1.85;
      const desired = base2 * mod;
      if (Math.abs(desired - p.sizeScale) > 0.01) setPlayerScale(p, desired);
      if (now < (p.burnUntil || 0) && now > (p.nextBurnTick || 0)) {
        p.nextBurnTick = now + 450;
        damagePlayer(p, 3);
        spawnParticles(body.position.x, body.position.y - 10, "#ff8c5a", 3, 3, 20);
      }
      const lift = now < (p.floatyUntil || 0) ? 1.5 : now < (p.featherUntil || 0) ? 0.72 : 0;
      if (lift) {
        applyForce(body, body.position, { x: 0, y: -gravityY() * worldGravityScale() * body.mass * lift });
        if (lift < 1 && simRandom() < 0.06) spawnParticles(body.position.x + rand(-10, 10), body.position.y - 18, "#fffde7", 1, 1.2, 22);
      }
      tickStatuses(p, now);
      if (currentMap.def.icy || currentMap.data.eventIcy) p.wetUntil = Math.max(p.wetUntil || 0, now + 600);
      if (now < (p.wetUntil || 0) && simRandom() < 0.04) spawnParticles(body.position.x, body.position.y + 8, "#9ec9ff", 1, 1.5, 16);
      const c = p.input;
      const gdir = gravDirFor(p);
      if (now < (p.gravityLockUntil || 0)) {
        const want = p.gravityLockDir * Math.abs(gravityY());
        applyForce(body, body.position, { x: 0, y: (want - gravityY()) * worldGravityScale() * body.mass });
      }
      const onGround = grounded(p);
      const vAlong = body.velocity.y * gdir;
      if (vAlong > (p.fallPeak || 0)) p.fallPeak = vAlong;
      const yAlong = body.position.y * gdir;
      if (p.lastGdir !== gdir) {
        p.apexAlong = null;
        p.fallPeak = 0;
        p.lastGdir = gdir;
      }
      if (!onGround) {
        if (p.apexAlong == null || yAlong < p.apexAlong) p.apexAlong = yAlong;
      } else if (vAlong < 2) {
        if (p.apexAlong != null && game.state === "PLAY" && now > (game.fightAt || 0) && now > (p.floatyUntil || 0) && now > (p.featherUntil || 0)) {
          const drop = yAlong - p.apexAlong;
          if (drop > FALL_SAFE_DROP && p.fallPeak > 14) {
            const dmg = Math.min(40, Math.round((drop - FALL_SAFE_DROP) * 0.12));
            if (dmg >= 3) {
              statFor(p).fallDmg += dmg;
              damagePlayer(p, dmg);
              addShake(4);
              sfx.thud();
              spawnParticles(body.position.x, body.position.y + 14 * gdir, "#9c8ab8", 8, 3, 25);
            }
          }
        }
        p.apexAlong = null;
        p.fallPeak = 0;
      }
      if (!frozen && !slipped && game.state !== "VICTORY") {
        if (onGround) {
          p.lastGround = now;
          p.airJumps = 1;
        }
        const canJump = now - p.lastGround < 120;
        let move = c.move;
        if (now < (p.reversedUntil || 0)) move = -move;
        if (c.aimVec) p.aimAngle = Math.atan2(c.aimVec.y, c.aimVec.x);
        else if (c.aimPoint) p.aimAngle = Math.atan2(c.aimPoint.y - body.position.y, c.aimPoint.x - body.position.x);
        else if (c.aimAngle != null) p.aimAngle = c.aimAngle;
        else p.aimAngle = null;
        if (p.aimAngle != null && Math.abs(Math.cos(p.aimAngle)) > 0.25) p.facing = Math.cos(p.aimAngle) > 0 ? 1 : -1;
        else if (move) p.facing = move > 0 ? 1 : -1;
        let target = move * 6;
        if (now < (p.speedUntil || 0)) target *= 1.6;
        if (now < (p.heavyUntil || 0)) target *= 0.5;
        if (currentMap.def.muddy || now < (p.vineSlowUntil || 0)) target *= 0.65;
        const icy = currentMap.def.icy || currentMap.data.eventIcy;
        const blend = onGround ? icy ? perSecond(0.09) : currentMap.def.muddy ? perSecond(0.12) : perSecond(0.25) : perSecond(0.08);
        setVelocity(body, { x: body.velocity.x + (target - body.velocity.x) * blend, y: body.velocity.y });
        const heavy = now < (p.heavyUntil || 0);
        const jumpVy = (now < (p.jumpBoostUntil || 0) ? -22 : p.sizeScale > 1.6 ? -17 : -15) * gdir;
        if (!heavy) {
          if (c.jump && canJump && body.velocity.y * gdir > -2) {
            setVelocity(body, { x: body.velocity.x, y: jumpVy });
            p.lastGround = 0;
            sfx.jump();
          } else if (c.jumpPressed && !canJump && p.airJumps > 0) {
            p.airJumps--;
            setVelocity(body, { x: body.velocity.x, y: (now < (p.jumpBoostUntil || 0) ? -19 : -13) * gdir });
            spawnParticles(body.position.x, body.position.y + 12 * gdir, "#e8d5ff", 8, 3, 20);
            sfx.jump();
          }
        }
        if (!piggy && now > (game.fightAt || 0)) {
          if (c.blockPressed) tryBlock(p, now);
          if (c.cast && p.slots[0]) castSpell(p, now, 0);
          if (c.cast2 && p.slots[1]) castSpell(p, now, 1);
        }
      }
      if (!slipped) setAngle(body, body.angle * 0.88);
      setAngularVelocity(body, body.angularVelocity * 0.9);
      p.walkPhase += Math.abs(body.velocity.x) * 0.06;
      if (body.position.y > H + 60) killPlayer(p);
      if (currentMap.def.wrap) {
        if (body.position.x < -20) setPosition(body, { x: W + 15, y: body.position.y });
        if (body.position.x > W + 20) setPosition(body, { x: -15, y: body.position.y });
      }
    }
  }

  // src/sim/spells/core.js
  var projectiles = /* @__PURE__ */ new Set();
  var activeEffects = [];
  var summons = /* @__PURE__ */ new Set();
  var loose = (b) => !b.isStatic && !b.isSensor;
  function aimDir(p, speed = 20, vy = 0) {
    if (p.aimAngle != null) return { x: Math.cos(p.aimAngle), y: Math.sin(p.aimAngle) };
    const gdir = gravDirFor(p);
    const len = Math.hypot(speed, vy) || 1;
    return { x: p.facing * (speed / len), y: vy * gdir / len };
  }
  function shoot(p, { r, speed, vy = 0, color, density = 2e-3, restitution = 0.6, expireMs, gravityScale = 1, angle }) {
    const { x, y } = p.body.position;
    const dir = angle != null ? { x: Math.cos(angle), y: Math.sin(angle) } : aimDir(p, speed, vy);
    const spd = Math.hypot(speed, vy);
    const muzzle = { x: x + dir.x * 28, y: y - 6 + dir.y * 16 };
    const blocked = queryRay(
      { x, y: y - 6 },
      muzzle,
      { filter: (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 }
    );
    const spawn = blocked ? { x: blocked.point.x - dir.x * 4, y: blocked.point.y - dir.y * 4 } : muzzle;
    const fb = createCircle(spawn.x, spawn.y, r, {
      density,
      frictionAir: 0,
      restitution,
      label: "projectile",
      collisionFilter: { group: p.group }
    });
    fb.owner = p;
    fb.color = color;
    fb.gravityScale = gravityScale;
    if (expireMs) fb.expireAt = simNow() + expireMs;
    setVelocity(fb, { x: dir.x * spd, y: dir.y * spd });
    projectiles.add(fb);
    addBody(fb);
    return fb;
  }
  function dropProjectile(p, x, y, { r = 10, vx = 0, vy = 12, color, density = 4e-3, expireMs = 6e3 }) {
    if (gravityY() < 0) {
      y = H - y;
      vy = -vy;
    }
    const fb = createCircle(x, y, r, { density, frictionAir: 0, label: "projectile" });
    fb.owner = p;
    fb.color = color;
    fb.gravityScale = 1;
    fb.expireAt = simNow() + expireMs;
    setVelocity(fb, { x: vx, y: vy });
    projectiles.add(fb);
    addBody(fb);
    return fb;
  }
  function removeProjectile(fb) {
    projectiles.delete(fb);
    removeBody(fb);
  }
  function summon(body, { life = 5e3, color, ...flags } = {}) {
    if (color) body.render.fillStyle = color;
    Object.assign(body, flags);
    body.dieAt = simNow() + life;
    summons.add(body);
    addBody(body);
    return body;
  }
  function removeSummon(b) {
    if (!summons.has(b)) return;
    summons.delete(b);
    spawnParticles(b.position.x, b.position.y, b.render.fillStyle || "#e8d5ff", 6, 3, 20);
    removeBody(b);
  }
  function enemiesOf(p) {
    return players.filter((q) => q.alive && q !== p);
  }
  function nearestEnemy(p, maxD = 1e9, from = p.body.position) {
    let best = null, bd = maxD;
    for (const q of enemiesOf(p)) {
      const d = Math.hypot(q.body.position.x - from.x, q.body.position.y - from.y);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    return best;
  }
  function explode(x, y, radius = 150, power = 22, damage = 0, owner = null, opts = {}) {
    addShake(Math.min(14, power * 0.7));
    sfx.explosion();
    spawnRing(x, y, "#ffb347");
    spawnParticles(x, y, "#ffb347", 26, 9);
    spawnParticles(x, y, "#ff5e57", 18, 7);
    if (power >= 18) doFlash("#ffb347", 0.12);
    for (const body of queryRadius({ x, y }, radius)) {
      const dx = body.position.x - x, dy = body.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      if (body.label === "boss" && damage && owner !== "boss") {
        damageBoss(damage * (1 - d / (radius * 1.15)) * 1.2, body.position, owner);
      }
      if (body.isStatic) {
        if (body.label === "icicle") body._blast = true;
        if (body.label === "destructible" && damage) damageDestructible(body, damage * (1 - d / (radius * 1.1)));
        continue;
      }
      const s = 1 - d / radius;
      setVelocity(body, {
        x: body.velocity.x + dx / d * power * s,
        y: body.velocity.y + dy / d * power * s - 4 * s
      });
      setAngularVelocity(body, body.angularVelocity + (simRandom() - 0.5) * 0.4);
      if (body.label === "player" && damage) {
        const dmg = damage * (1 - d / (radius * 1.15));
        if (body.player === owner) {
          if (!opts.selfSafe) damagePlayer(body.player, dmg * 0.5, owner);
        } else damagePlayer(body.player, dmg, owner);
      }
      if (body.label === "enemy" && damage && owner !== "boss") {
        damageEnemy(body.enemy, damage * (1 - d / (radius * 1.15)), body.position, owner);
      }
    }
    for (const c of allJoints(currentMap.composite)) {
      if (c.label !== "breakable") continue;
      const pos = (c.bodyA || c.bodyB).position;
      if (Math.hypot(pos.x - x, pos.y - y) < radius * 0.75) removeFrom(currentMap.composite, c);
    }
  }
  function raycastHit(p, angOff = 0) {
    let dir = aimDir(p, 1, 0);
    if (angOff) {
      const a = Math.atan2(dir.y, dir.x) + angOff;
      dir = { x: Math.cos(a), y: Math.sin(a) };
    }
    const from = { x: p.body.position.x + dir.x * 22, y: p.body.position.y - 6 + dir.y * 14 };
    const to = { x: from.x + dir.x * 1400, y: from.y + dir.y * 1400 };
    const hit = queryRay(from, to, {
      filter: (b) => b !== p.body && !b.isSensor && b.label !== "gib" && b.label !== "projectile" && b.collisionFilter.mask !== 0
    });
    return { hit: hit?.body ?? null, pt: hit?.point ?? to, from, dir };
  }
  function boltVisual(...a) {
    emit("boltVisual", ...a);
  }
  function groundYAt(x) {
    const hit = queryRay(
      { x, y: 0 },
      { x, y: H },
      { filter: (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 }
    );
    return hit ? hit.point.y : H - 30;
  }
  function zapHit(target, dmg, src) {
    const now = simNow();
    if (now < (target.wetUntil || 0)) {
      dmg *= 1.6;
      spawnText(target.body.position.x, target.body.position.y - 46, "CONDUCT!", "#9ef0f0");
      let best = null, bd = 300;
      for (const q of players) {
        if (!q.alive || q === target || q === src) continue;
        const d = Math.hypot(q.body.position.x - target.body.position.x, q.body.position.y - target.body.position.y);
        if (d < bd) {
          bd = d;
          best = q;
        }
      }
      if (best) {
        boltVisual(target.body.position.x, target.body.position.y, best.body.position.x, best.body.position.y, "#9ef0f0", 3, 120);
        damagePlayer(best, dmg * 0.45, src);
      }
    }
    damagePlayer(target, dmg, src);
  }
  function skyBolt(x, dmg, owner, m = 1, opts) {
    const hitY = groundYAt(x);
    boltVisual(x, -20, x, hitY, "#fff89e", 3 * m);
    doFlash("#ffffff", 0.2);
    sfx.lightning();
    explode(x, hitY, 80 * m, 12 * m, dmg * m, owner, opts);
  }
  function spawnSingularity(x, y, m = 1, owner = null, opts = {}) {
    sfx.blackhole();
    doFlash("#a55eea", 0.2);
    spawnRing(x, y, "#a55eea");
    activeEffects.push({
      until: simNow() + 2200 * m,
      net: { k: "sing", x, y },
      vfx: { k: "sing", x, y },
      // what the couch screen draws; `net` is the same look, over the wire
      update() {
        const R = 350 * (1 + (m - 1) * 0.5);
        for (const b of queryRadius({ x, y }, R, { filter: loose })) {
          const dx = x - b.position.x, dy = y - b.position.y;
          const d = Math.hypot(dx, dy);
          if (d === 0) continue;
          if (d < 30) {
            if (b.label === "player") {
              if (!(opts.selfSafe && b.player === owner)) damagePlayer(b.player, 999, owner);
            } else if (b.label !== "boss") {
              spawnParticles(b.position.x, b.position.y, "#a55eea", 6, 3);
              projectiles.delete(b);
              gibs.delete(b);
              tomes.delete(b);
              hats.delete(b);
              summons.delete(b);
              removeBody(b, true);
            }
            continue;
          }
          const s = 1 - d / R;
          const pull = perSecond(0.9) * s, tang = perSecond(0.35) * s;
          setVelocity(b, {
            x: b.velocity.x + dx / d * pull + -dy / d * tang,
            y: b.velocity.y + dy / d * pull + dx / d * tang
          });
        }
        for (const c of allJoints(currentMap.composite)) {
          if (c.label !== "breakable") continue;
          const pos = (c.bodyA || c.bodyB).position;
          if (Math.hypot(pos.x - x, pos.y - y) < 140) removeFrom(currentMap.composite, c);
        }
        if (simRandom() < 0.6) {
          const a = rand(0, Math.PI * 2), dd = rand(60, 180);
          spawnParticle({ kind: "square", x: x + Math.cos(a) * dd, y: y + Math.sin(a) * dd, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4, life: 16, maxLife: 16, color: "#a55eea", r: 2.5 });
        }
      },
      onEnd() {
        explode(x, y, 160, 18, 25, owner, opts);
      }
    });
  }
  function makeZone({ x, y, r, life, color, tick: tick2, tickBody, vfx, onEnd }) {
    activeEffects.push({
      until: simNow() + life,
      x,
      y,
      r,
      net: { k: "zone", x, y, r, c: color },
      vfx: vfx || { k: "zone", x, y, r, c: color },
      update(now) {
        if (tick2) {
          for (const q of players) {
            if (!q.alive) continue;
            if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < r) tick2(q, now);
          }
        }
        if (tickBody) {
          for (const b of queryRadius({ x, y }, r, { filter: loose })) tickBody(b, now);
        }
      },
      onEnd
    });
  }
  var CAST_FLOOR = 480;
  var effectiveCooldown = (id) => Math.max(SPELLS[id]?.cooldown ?? 0, CAST_FLOOR);
  var resolvePotency = (p, o = {}) => o.m ?? p?.mega ?? 1;
  function hybridCharges(def) {
    return def.charges ?? (def.cooldown >= 3400 ? 1 : def.cooldown >= 2400 ? 2 : 3);
  }
  function hybridPotency(charges) {
    return charges <= 1 ? 1.5 : charges === 2 ? 1.35 : 1.2;
  }
  function castSpell(p, now, slot = 0) {
    const id = p.slots[slot];
    const spell = id && SPELLS[id];
    if (!spell) return;
    if (now - p.casts[slot] < effectiveCooldown(id)) return;
    p.casts[slot] = now;
    p.lastCastSlot = slot;
    telCast(id);
    const hyper = simRandom() < Math.min(0.06, spell.cooldown * 12e-6);
    const potency = spell.hybrid ? hybridPotency(hybridCharges(spell)) : 1;
    p.mega = (p.megaCasts > 0 ? 1.7 : 1) * (hyper ? 2.2 : 1) * potency;
    if (hyper) {
      statFor(p).procs++;
      setBanner("\u2726 HYPERSPELL \u2726", "#e8d5ff", 1100, true);
      doFlash("#a55eea", 0.4);
      slowMo(0.25, 380);
      addShake(10);
      spawnRing(p.body.position.x, p.body.position.y, "#a55eea");
      sfx.hyper();
    }
    sfx.cast();
    spell.cast(p);
    if (spell.hybrid && !hyper) {
      slowMo(0.28, 150);
      addShake(5);
    }
    if (spell.hybrid && p.slotCharges?.[slot] != null) {
      p.slotCharges[slot]--;
      if (p.slotCharges[slot] <= 0) {
        p.slots[slot] = null;
        p.slotCharges[slot] = null;
        spawnText(p.body.position.x, p.body.position.y - 74, "FUSION SPENT", "#ff4df0");
        spawnParticles(p.body.position.x, p.body.position.y - 20, "#ff4df0", 14, 4);
        sfx.freeze?.();
      } else {
        spawnText(p.body.position.x, p.body.position.y - 74, `${p.slotCharges[slot]} LEFT`, spell.color);
      }
    }
    if (p.megaCasts > 0) {
      p.megaCasts--;
      spawnText(p.body.position.x, p.body.position.y - 60, `${p.megaCasts} LEFT`, "#ffd700");
      if (p.megaCasts === 0) p.megaUntil = now + 600;
    }
  }
  function updateEffects(now) {
    for (let i = activeEffects.length - 1; i >= 0; i--) {
      const e = activeEffects[i];
      e.update?.(now);
      if (now > e.until) {
        e.onEnd?.();
        activeEffects.splice(i, 1);
      }
    }
  }
  onWorldReset(() => {
    projectiles.clear();
    summons.clear();
    activeEffects.length = 0;
  });

  // src/sim/spells/book.js
  var BOOK_SPELLS = {};
  function regSpell(id, def) {
    BOOK_SPELLS[id] = def;
  }
  var castablePool = () => Object.keys(SPELLS).filter((k) => k !== "roulette" && k !== "mirrorcast" && !SPELLS[k].hybrid);
  var roulettePool = castablePool;
  var mirrorPool = castablePool;
  var mirrorEligible = (id) => !!id && mirrorPool().includes(id);
  function boomBolt(p, o = {}) {
    const m = resolvePotency(p, o);
    const fb = shoot(p, {
      r: (o.r ?? 7) * m,
      speed: o.speed ?? 20,
      vy: o.vy ?? -6,
      color: o.color,
      gravityScale: o.g ?? 0.45,
      restitution: o.rest ?? 0.6,
      expireMs: o.expireMs,
      density: o.density ?? 2e-3,
      angle: o.angle
    });
    if (o.blast !== false) {
      fb.onHit = () => explode(fb.position.x, fb.position.y, (o.radius ?? 120) * m, (o.power ?? 18) * m, (o.dmg ?? 25) * m, fb.owner, o.selfSafe ? { selfSafe: true } : void 0);
    }
    return fb;
  }
  function statusBolt(p, o, apply2) {
    const m = resolvePotency(p, o);
    const fb = shoot(p, { r: (o.r ?? 6) * m, speed: o.speed ?? 18, vy: o.vy ?? -5, color: o.color, gravityScale: o.g ?? 0.5 });
    fb.onHit = (self, other) => {
      spawnParticles(self.position.x, self.position.y, o.color, 10, 4);
      if (o.dmg && other && other.label === "player") damagePlayer(other.player, o.dmg * m, p);
      if (other && other.label === "player" && other.player.alive) apply2(other.player, m);
    };
    return fb;
  }
  function zapRay(p, dmg, imp, width = 3, angOff = 0) {
    const m = resolvePotency(p);
    const { hit, pt, from, dir } = raycastHit(p, angOff);
    boltVisual(from.x, from.y, pt.x, pt.y, "#fff89e", width * m);
    spawnParticles(pt.x, pt.y, "#fff89e", 10, 5);
    if (hit && !hit.isStatic) {
      setVelocity(hit, { x: hit.velocity.x + dir.x * imp * m, y: hit.velocity.y + dir.y * imp * m - imp * 0.2 * m });
      if (hit.label === "player") zapHit(hit.player, dmg * m, p);
    }
    return { hit, pt };
  }
  function summonCritter(p, o = {}) {
    const b = createCircle(
      o.x ?? p.body.position.x + p.facing * 34,
      o.y ?? p.body.position.y - 10,
      o.r ?? 8,
      { density: 2e-3, friction: 0.5, restitution: o.rest ?? 0.4, label: "critter" }
    );
    b.critter = { hopAt: 0, dir: o.dir ?? p.facing, hop: o.hop ?? 6, speed: o.speed ?? 4 };
    b.owner = p;
    return summon(b, { life: o.life ?? 4500, color: o.color, contactDamage: o.dmg, contactExplode: o.boom });
  }
  function frontPos(p, dist, up = 0) {
    return {
      x: Math.max(30, Math.min(W - 30, p.body.position.x + p.facing * dist)),
      y: p.body.position.y - up
    };
  }
  regSpell("ember", { name: "Ember Shot", color: "#ff9d5c", cooldown: 250, cast(p) {
    boomBolt(p, { color: "#ff9d5c", r: 4, speed: 23, vy: -3, radius: 70, power: 10, dmg: 12 });
  } });
  regSpell("sunburst", { name: "Sunburst", color: "#ffe066", cooldown: 1600, cast(p) {
    boomBolt(p, { color: "#ffe066", r: 14, speed: 13, vy: -7, radius: 240, power: 30, dmg: 55 });
  } });
  regSpell("twinfire", { name: "Twin Fire", color: "#ff7f50", cooldown: 650, cast(p) {
    boomBolt(p, { color: "#ff7f50", vy: -3, radius: 100, dmg: 20 });
    boomBolt(p, { color: "#ff7f50", vy: -9, radius: 100, dmg: 20 });
  } });
  regSpell("trishot", { name: "Trishot", color: "#ffa07a", cooldown: 800, cast(p) {
    for (const vy of [-2, -6, -10]) boomBolt(p, { color: "#ffa07a", r: 5, vy, radius: 85, power: 14, dmg: 15 });
  } });
  regSpell("scatter", { name: "Scattershot", color: "#ffcf99", cooldown: 900, cast(p) {
    for (let i = 0; i < 5; i++) boomBolt(p, { color: "#ffcf99", r: 3.5, speed: rand(16, 24), vy: rand(-10, -1), radius: 60, power: 9, dmg: 9 });
  } });
  regSpell("mortar", { name: "Mortar", color: "#c9a227", cooldown: 1400, cast(p) {
    boomBolt(p, { color: "#c9a227", r: 10, speed: 11, vy: -14, g: 0.9, radius: 170, power: 26, dmg: 45 });
  } });
  regSpell("bouncer", { name: "Bouncing Betty", color: "#7bd88f", cooldown: 1200, cast(p) {
    const fb = boomBolt(p, { color: "#7bd88f", r: 8, rest: 1.05, expireMs: 2500, radius: 150, power: 22, dmg: 35 });
    fb.noContactBoom = true;
  } });
  regSpell("cluster", {
    name: "Cluster Bomb",
    color: "#ffad66",
    cooldown: 2200,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 9 * m, speed: 18, vy: -7, color: "#ffad66", gravityScale: 0.5 });
      fb.onHit = () => {
        const { x, y } = fb.position;
        explode(x, y, 90 * m, 14 * m, 18 * m, p);
        for (let i = 0; i < 4; i++) {
          const bomblet = dropProjectile(p, x + rand(-20, 20), y - 10, { r: 5, vx: rand(-8, 8), vy: rand(-12, -6), color: "#ffad66", expireMs: 1500 });
          bomblet.gravityScale = 1;
          bomblet.onHit = () => explode(bomblet.position.x, bomblet.position.y, 70 * m, 11 * m, 14 * m, p);
        }
      };
    }
  });
  regSpell("homing", {
    name: "Homing Wisp",
    color: "#c3f9ff",
    cooldown: 1300,
    cast(p) {
      const fb = boomBolt(p, { color: "#c3f9ff", r: 6, speed: 12, vy: -2, g: 0, radius: 110, power: 16, dmg: 28, expireMs: 3e3 });
      fb.update = (self) => {
        const t = nearestEnemy(p, 1e9, self.position);
        if (!t) return;
        const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = 13;
        setVelocity(self, {
          x: self.velocity.x * 0.9 + dx / d * sp * 0.14,
          y: self.velocity.y * 0.9 + dy / d * sp * 0.14
        });
      };
    }
  });
  regSpell("boomerang", {
    name: "Boomerang Orb",
    color: "#d2b4de",
    cooldown: 1100,
    cast(p) {
      const fb = boomBolt(p, { color: "#d2b4de", r: 7, speed: 18, vy: -4, g: 0.2, radius: 110, power: 16, dmg: 26, expireMs: 2400 });
      fb.bornAt = simNow();
      fb.update = (self, now) => {
        if (!self.turned && now - fb.bornAt > 600) {
          self.turned = true;
          setVelocity(self, { x: -self.velocity.x, y: self.velocity.y - 2 });
        }
      };
    }
  });
  regSpell("skullrocket", { name: "Skull Rocket", color: "#e8e8e8", cooldown: 1300, cast(p) {
    boomBolt(p, { color: "#e8e8e8", r: 8, speed: 26, vy: 0, g: 0.15, radius: 110, power: 24, dmg: 40 });
  } });
  regSpell("wobble", {
    name: "Wobble Hex",
    color: "#e69bff",
    cooldown: 900,
    cast(p) {
      const fb = boomBolt(p, { color: "#e69bff", r: 6, speed: 15, vy: 0, g: 0, radius: 110, power: 16, dmg: 24, expireMs: 2500 });
      fb.update = (self, now) => setVelocity(self, { x: self.velocity.x, y: Math.sin(now * 0.02) * 6 });
    }
  });
  regSpell("landmine", {
    name: "Landmine",
    color: "#b8b8b8",
    cooldown: 2e3,
    cast(p) {
      const m = p.mega || 1;
      const b = createBox(p.body.position.x + p.facing * 30, p.body.position.y + 8, 16, 8, { density: 3e-3, friction: 0.9, label: "mine" });
      b.owner = p;
      b.mineBlast = { radius: 130 * m, power: 20 * m, dmg: 35 * m };
      summon(b, { life: 12e3, color: "#b8b8b8" });
    }
  });
  regSpell("sticky", {
    name: "Sticky Bomb",
    color: "#aef05a",
    cooldown: 1600,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 7 * m, speed: 19, vy: -5, color: "#aef05a", gravityScale: 0.5 });
      fb.keepOnHit = true;
      fb.onHit = () => {
        if (fb.stuck) return;
        fb.stuck = true;
        setType(fb, "static");
        activeEffects.push({
          until: simNow() + 900,
          vfx: { k: "blink", body: fb, r: 4, a: "#aef05a", b: "#fff", rate: 0.03 },
          // the armed charge, blinking on the body it stuck to
          onEnd() {
            removeProjectile(fb);
            explode(fb.position.x, fb.position.y, 160 * m, 24 * m, 40 * m, p);
          }
        });
      };
    }
  });
  regSpell("shard", {
    name: "Meteor Shard",
    color: "#ff8c5a",
    cooldown: 1800,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const x = t ? t.body.position.x : frontPos(p, 250).x;
      const rock = dropProjectile(p, x + rand(-30, 30), -40, { r: 18, vy: 16, color: "#ff8c5a", density: 8e-3 });
      rock.onHit = () => explode(rock.position.x, rock.position.y, 130 * m, 20 * m, 45 * m, p);
    }
  });
  regSpell("firecrackers", {
    name: "Firecrackers",
    color: "#ff6f61",
    cooldown: 1700,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      const t0 = simNow();
      let i = 0;
      activeEffects.push({
        until: t0 + 1e3,
        update(now) {
          if (now > t0 + i * 100 && i < 10) {
            i++;
            explode(x + rand(-110, 110), y + rand(-70, 30), 50 * m, 8 * m, 8 * m, p);
          }
        }
      });
    }
  });
  regSpell("dragonbreath", {
    name: "Dragon's Breath",
    color: "#ff5e3a",
    cooldown: 1900,
    cast(p) {
      const t0 = simNow();
      const m = p.mega || 1;
      let i = 0;
      activeEffects.push({
        until: t0 + 720,
        update(now) {
          if (now > t0 + i * 120 && i < 6 && p.alive) {
            i++;
            boomBolt(p, { m, color: "#ff5e3a", r: 4, speed: rand(19, 25), vy: rand(-4, 0), g: 0.3, radius: 65, power: 9, dmg: 9 });
          }
        }
      });
    }
  });
  regSpell("cannonball", {
    name: "Cannonball",
    color: "#3d3d4d",
    cooldown: 1500,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 13 * m, speed: 24, vy: -1, color: "#3d3d4d", gravityScale: 0.9, density: 0.012, restitution: 0.3, expireMs: 4e3 });
      fb.noContactBoom = true;
      fb.contactDamage = 30 * m;
      addVelocity(p.body, { x: -p.facing * 5, y: 0 });
    }
  });
  regSpell("bowling", {
    name: "Bowling Ball",
    color: "#4a4a5a",
    cooldown: 1800,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 20 * m, speed: 16, vy: 2, color: "#4a4a5a", gravityScale: 1, density: 0.01, restitution: 0.1, expireMs: 3500 });
      fb.noContactBoom = true;
      fb.contactDamage = 25 * m;
    }
  });
  regSpell("starfall", {
    name: "Star Fall",
    color: "#fff3b0",
    cooldown: 1600,
    cast(p) {
      const m = p.mega || 1;
      const cx = frontPos(p, 220).x;
      for (let i = 0; i < 5; i++) {
        const star = dropProjectile(p, cx + (i - 2) * 55, -40 - Math.abs(i - 2) * 30, { r: 6, vy: 15, color: "#fff3b0" });
        star.onHit = () => explode(star.position.x, star.position.y, 70 * m, 11 * m, 15 * m, p);
      }
    }
  });
  regSpell("zapspell", { name: "Zap", color: "#fdfd96", cooldown: 350, beam: true, cast(p) {
    zapRay(p, 18, 10, 2);
    sfx.lightning();
  } });
  regSpell("thunderlance", { name: "Thunder Lance", color: "#fffacd", cooldown: 1800, beam: true, cast(p) {
    zapRay(p, 85, 40, 6);
    sfx.lightning();
    doFlash("#ffffff", 0.4);
    slowMo(0.05, 90);
    addShake(9);
  } });
  regSpell("chain", {
    name: "Chain Lightning",
    color: "#e3f265",
    cooldown: 1500,
    cast(p) {
      const m = p.mega || 1;
      sfx.lightning();
      let from = p.body.position, cur = p, dmg = 35;
      const hitSet = /* @__PURE__ */ new Set([p]);
      for (let hop = 0; hop < 3; hop++) {
        let best = null, bd = hop === 0 ? 500 : 400;
        for (const q of players) {
          if (!q.alive || hitSet.has(q)) continue;
          const d = Math.hypot(q.body.position.x - from.x, q.body.position.y - from.y);
          if (d < bd) {
            bd = d;
            best = q;
          }
        }
        if (!best) break;
        hitSet.add(best);
        boltVisual(from.x, from.y - 8, best.body.position.x, best.body.position.y, "#e3f265", 3 * m);
        damagePlayer(best, dmg * m);
        addVelocity(best.body, { x: rand(-6, 6), y: -8 });
        from = best.body.position;
        dmg -= 10;
      }
    }
  });
  regSpell("skysmite", {
    name: "Sky Smite",
    color: "#fff89e",
    cooldown: 1700,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const x = t ? t.body.position.x : frontPos(p, 200).x;
      const gy = groundYAt(x);
      spawnText(x, gy - 44, "\u26A1", "#fff89e");
      spawnParticles(x, gy - 8, "#fff89e", 6, 2, 30);
      const t0 = simNow();
      activeEffects.push({
        until: t0 + 550,
        vfx: { k: "pulsering", x, y: gy - 8, r: 26, c: "#fff89e", lw: 2 },
        onEnd() {
          skyBolt(x, 45, p, m);
        }
      });
    }
  });
  regSpell("sweep", { name: "Laser Sweep", color: "#ffef99", cooldown: 1300, beam: true, cast(p) {
    for (const ao of [-0.16, 0, 0.16]) zapRay(p, 20, 12, 2, ao);
    sfx.lightning();
  } });
  regSpell("disintegrate", {
    name: "Disintegrate",
    color: "#ff4df0",
    cooldown: 2400,
    beam: true,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      const dir = aimDir(p, 1, 0);
      boltVisual(x + dir.x * 16, y - 6 + dir.y * 16, x + dir.x * 1500, y - 6 + dir.y * 1500, "#ff4df0", 5 * m, 180);
      sfx.lightning();
      doFlash("#ff4df0", 0.2);
      const muzzle = { x, y: y - 6 };
      const tip = { x: x + dir.x * 1500, y: y - 6 + dir.y * 1500 };
      for (const b of queryCapsule(muzzle, tip, 26, { filter: (b2) => loose(b2) && b2 !== p.body })) {
        const rx = b.position.x - x, ry = b.position.y - (y - 6);
        const t = rx * dir.x + ry * dir.y;
        if (t < 0 || t > 1500) continue;
        if (Math.abs(rx * dir.y - ry * dir.x) > 26) continue;
        if (b.label === "player") {
          damagePlayer(b.player, 30 * m);
          continue;
        }
        if (b.label === "boss") {
          damageBoss(30 * m, b.position, p);
          continue;
        }
        spawnParticles(b.position.x, b.position.y, "#ff4df0", 8, 4);
        projectiles.delete(b);
        gibs.delete(b);
        tomes.delete(b);
        hats.delete(b);
        summons.delete(b);
        removeBody(b, true);
      }
    }
  });
  regSpell("stormcall", {
    name: "Storm Call",
    color: "#d9e650",
    cooldown: 3200,
    cast(p) {
      const m = p.mega || 1;
      const t0 = simNow();
      let i = 0;
      activeEffects.push({
        until: t0 + 1300,
        update(now) {
          if (now > t0 + i * 240 && i < 5) {
            i++;
            skyBolt(rand(80, W - 80), 25, p, m);
          }
        }
      });
    }
  });
  regSpell("railgun", {
    name: "Railgun",
    color: "#9ef0f0",
    cooldown: 2e3,
    beam: true,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      const dir = aimDir(p, 1, 0);
      boltVisual(x + dir.x * 16, y - 6 + dir.y * 16, x + dir.x * 1500, y - 6 + dir.y * 1500, "#9ef0f0", 4 * m, 160);
      sfx.lightning();
      addShake(8);
      addVelocity(p.body, { x: -dir.x * 8, y: -dir.y * 5 });
      const muzzle = { x, y: y - 6 };
      const tip = { x: x + dir.x * 1500, y: y - 6 + dir.y * 1500 };
      for (const b of queryCapsule(muzzle, tip, 28, { filter: (b2) => loose(b2) && b2 !== p.body })) {
        const rx = b.position.x - x, ry = b.position.y - (y - 6);
        const t = rx * dir.x + ry * dir.y;
        if (t < 0 || t > 1500) continue;
        if (Math.abs(rx * dir.y - ry * dir.x) > 28) continue;
        setVelocity(b, { x: b.velocity.x + dir.x * 30 * m, y: b.velocity.y + dir.y * 30 * m - 4 });
        if (b.label === "player") damagePlayer(b.player, 40 * m);
      }
    }
  });
  regSpell("shove", { name: "Shove", color: "#f0e6d2", cooldown: 500, cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p, 130);
    if (t) {
      addVelocity(t.body, { x: p.facing * 26 * m, y: -6 });
      damagePlayer(t, 5 * m);
    }
    spawnParticles(frontPos(p, 40).x, p.body.position.y, "#f0e6d2", 8, 5);
  } });
  regSpell("cyclone", {
    name: "Cyclone",
    color: "#c8f7f7",
    cooldown: 1400,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      spawnRing(x, y, "#c8f7f7");
      for (const b of queryRadius({ x, y }, 220 * m, { filter: (b2) => loose(b2) && b2 !== p.body })) {
        const dx = b.position.x - x, dy = b.position.y - y;
        const d = Math.hypot(dx, dy);
        if (d === 0) continue;
        const s = (1 - d / (220 * m)) * 20 * m;
        setVelocity(b, { x: b.velocity.x + dx / d * s, y: b.velocity.y + dy / d * s - 4 });
      }
    }
  });
  regSpell("vortexpull", {
    name: "Vortex",
    color: "#b58aff",
    cooldown: 1400,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      for (const b of queryRadius({ x, y }, 260 * m, { filter: (b2) => loose(b2) && b2 !== p.body })) {
        const dx = x - b.position.x, dy = y - b.position.y;
        const d = Math.hypot(dx, dy);
        if (d === 0) continue;
        const s = (1 - d / (260 * m)) * 16 * m;
        setVelocity(b, { x: b.velocity.x + dx / d * s, y: b.velocity.y + dy / d * s - 2 });
      }
      spawnRing(x, y, "#b58aff");
    }
  });
  regSpell("updraft", {
    name: "Updraft",
    color: "#e0ffff",
    cooldown: 1200,
    cast(p) {
      const m = p.mega || 1;
      const x = p.body.position.x;
      const reach = 130 * m;
      for (const b of queryRegion(
        column(x - reach, x + reach),
        { filter: (b2) => loose(b2) && Math.abs(b2.position.x - x) <= reach }
      )) {
        addVelocity(b, { x: 0, y: -18 * m });
      }
      for (let i = 0; i < 16; i++) spawnParticle({ kind: "spark", x: x + rand(-100, 100), y: rand(100, H - 60), vx: 0, vy: -rand(8, 14), life: 20, maxLife: 20, color: "#e0ffff", r: 2 });
    }
  });
  regSpell("slam", {
    name: "Seismic Slam",
    color: "#d1a054",
    cooldown: 2200,
    cast(p) {
      const m = p.mega || 1;
      setVelocity(p.body, { x: p.body.velocity.x, y: 30 });
      const e = {
        until: simNow() + 1600,
        update(now) {
          if (!p.alive) {
            e.until = 0;
            return;
          }
          if (now > (e.armAt ?? (e.armAt = now + 120)) && grounded(p) && p.body.velocity.y > -1) {
            explode(p.body.position.x, p.body.position.y + 10, 170 * m, 24 * m, 30 * m, p);
            e.until = 0;
          }
        }
      };
      activeEffects.push(e);
    }
  });
  regSpell("repulsor", {
    name: "Repulsor Field",
    color: "#ffd7f0",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      makeZone({
        x,
        y,
        r: 200 * m,
        life: 3e3,
        color: "#ffd7f0",
        tick(q) {
          if (q === p) return;
          const dx = q.body.position.x - x, dy = q.body.position.y - y;
          const d = Math.hypot(dx, dy) || 1;
          addVelocity(q.body, { x: dx / d * perSecond(2.4), y: dy / d * perSecond(1.2) });
        }
      });
    }
  });
  regSpell("magnetpalm", {
    name: "Magnet Palm",
    color: "#ff9ecb",
    cooldown: 1100,
    cast(p) {
      const t = nearestEnemy(p, 420);
      if (!t) return;
      const dx = p.body.position.x - t.body.position.x, dy = p.body.position.y - t.body.position.y;
      const d = Math.hypot(dx, dy) || 1;
      setVelocity(t.body, { x: dx / d * 18, y: dy / d * 18 - 3 });
      damagePlayer(t, 5);
      boltVisual(p.body.position.x, p.body.position.y - 6, t.body.position.x, t.body.position.y, "#ff9ecb", 2, 100);
    }
  });
  regSpell("tornado", {
    name: "Tornado",
    color: "#cfe8e8",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1;
      const start = frontPos(p, 60);
      const e = {
        until: simNow() + 3500,
        x: start.x,
        vx: p.facing * 2.6,
        net: { k: "tor", x: start.x },
        update() {
          e.x += e.vx;
          e.net.x = e.x;
          if (e.x < 40 || e.x > W - 40) e.vx = -e.vx;
          const reach = 120 * m;
          for (const b of queryRegion(
            column(e.x - reach, e.x + reach),
            { filter: (b2) => loose(b2) && Math.abs(b2.position.x - e.x) <= reach }
          )) {
            const dx = b.position.x - e.x;
            setVelocity(b, { x: b.velocity.x - Math.sign(dx) * perSecond(0.9) + perSecond(rand(-0.5, 0.5)), y: b.velocity.y - perSecond(1.5) * m });
          }
        },
        // the funnel tracks e.x, which update() moves every tick — that is why
        // the renderer is handed the whole effect and not a frozen descriptor
        vfx: { k: "tor" }
      };
      activeEffects.push(e);
    }
  });
  regSpell("iceshard", { name: "Ice Shard", color: "#bfe8ff", cooldown: 400, cast(p) {
    statusBolt(p, { color: "#bfe8ff", r: 4, speed: 23, vy: -2, dmg: 12 }, (q) => {
      freezeUntil(q, simNow() + 450);
    });
  } });
  regSpell("glacier", {
    name: "Glacier",
    color: "#9be7ff",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 70);
      const wall = createBox(pos.x, pos.y - 30, 26 * m, 120 * m, { isStatic: true, friction: 0.01, label: "wall" });
      summon(wall, { life: 4500, color: "#9be7ff" });
      sfx.freeze();
    }
  });
  regSpell("blizzard", {
    name: "Blizzard",
    color: "#d8f4ff",
    cooldown: 4e3,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 170);
      makeZone({
        x: pos.x,
        y: pos.y,
        r: 240 * m,
        life: 3200,
        color: "#d8f4ff",
        tick(q, now) {
          if (q === p) return;
          freezeUntil(q, Math.max(q.frozenUntil, now + 200));
          if (simRandom() < 0.02) damagePlayer(q, 3);
        },
        vfx: { k: "blizzard", x: pos.x, y: pos.y, r: 240 * m, c: "#d8f4ff" }
      });
      sfx.freeze();
    }
  });
  regSpell("snowball", {
    name: "Snowball",
    color: "#f4fbff",
    cooldown: 900,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 14 * m, speed: 15, vy: -4, color: "#f4fbff", gravityScale: 0.7, density: 4e-3, restitution: 0.2, expireMs: 3e3 });
      fb.noContactBoom = true;
      fb.contactDamage = 8 * m;
    }
  });
  regSpell("flashfreeze", { name: "Flash Freeze", color: "#e0f7ff", cooldown: 3400, cast(p) {
    const m = p.mega || 1;
    sfx.freeze();
    doFlash("#bfe8ff", 0.3);
    for (const q of enemiesOf(p)) applyFreeze(q, simNow() + 800 * m);
  } });
  regSpell("frostnova", {
    name: "Frost Nova",
    color: "#aee4ff",
    cooldown: 2400,
    cast(p) {
      const m = p.mega || 1;
      spawnRing(p.body.position.x, p.body.position.y, "#aee4ff");
      sfx.freeze();
      for (const q of enemiesOf(p)) {
        const d = Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y);
        if (d < 180 * m) {
          applyFreeze(q, simNow() + 1200 * m);
          damagePlayer(q, 10 * m);
        }
      }
    }
  });
  regSpell("icicledrop", {
    name: "Icicle Drop",
    color: "#bfe8ff",
    cooldown: 2400,
    cast(p) {
      const m = p.mega || 1;
      for (const q of enemiesOf(p)) {
        const ice = createPolygon(q.body.position.x + rand(-20, 20), Math.max(30, q.body.position.y - 260), 3, 16 * m, { angle: Math.PI / 2, density: 6e-3, label: "critter" });
        summon(ice, { life: 3e3, color: "#bfe8ff", contactDamage: 25 * m });
        setVelocity(ice, { x: 0, y: 6 });
      }
      sfx.freeze();
    }
  });
  regSpell("brainfreeze", { name: "Brain Freeze", color: "#ceb4ff", cooldown: 3e3, cast(p) {
    const m = p.mega || 1;
    for (const q of enemiesOf(p)) {
      q.reversedUntil = simNow() + 3e3 * m;
      spawnText(q.body.position.x, q.body.position.y - 40, "?!", "#ceb4ff");
    }
    sfx.freeze();
  } });
  regSpell("coldsnap", {
    name: "Cold Snap",
    color: "#9be7ff",
    cooldown: 1800,
    cast(p) {
      statusBolt(p, { color: "#9be7ff", r: 5, speed: 19, vy: -3, dmg: 6 }, (q, m) => {
        applyFreeze(q, simNow() + 1e3 * m);
        sfx.freeze();
      });
    }
  });
  regSpell("permafrost", { name: "Permafrost", color: "#7fd4ff", cooldown: 2800, cast(p) {
    statusBolt(p, { color: "#7fd4ff", r: 9, speed: 10, vy: -3, dmg: 20 }, (q, m) => {
      applyFreeze(q, simNow() + 2600 * m);
      sfx.freeze();
    });
  } });
  regSpell("ignite", { name: "Ignite", color: "#ff8c5a", cooldown: 700, cast(p) {
    statusBolt(p, { color: "#ff8c5a", dmg: 8 }, (q, m) => {
      q.burnUntil = simNow() + 3e3 * m;
    });
  } });
  regSpell("flamewall", {
    name: "Flame Wall",
    color: "#ff5e3a",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 130);
      makeZone({
        x: pos.x,
        y: pos.y - 40,
        r: 90 * m,
        life: 3e3,
        color: "#ff5e3a",
        tick(q, now) {
          if (q !== p) {
            q.burnUntil = Math.max(q.burnUntil || 0, now + 1200);
          }
        }
      });
    }
  });
  regSpell("napalm", {
    name: "Napalm",
    color: "#ff7043",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 8 * m, speed: 18, vy: -6, color: "#ff7043", gravityScale: 0.5 });
      fb.onHit = () => {
        const { x, y } = fb.position;
        explode(x, y, 120 * m, 18 * m, 20 * m, p);
        makeZone({
          x,
          y,
          r: 110 * m,
          life: 2500,
          color: "#ff7043",
          tick(q, now) {
            q.burnUntil = Math.max(q.burnUntil || 0, now + 1e3);
          }
        });
      };
    }
  });
  regSpell("phoenixdash", {
    name: "Phoenix Dash",
    color: "#ffb347",
    cooldown: 2e3,
    selfMove: true,
    cast(p) {
      const dir = aimDir(p, 25, 4);
      setVelocity(p.body, { x: dir.x * 25, y: dir.y * 25 - 2 });
      p.invulnUntil = simNow() + 600;
      for (let i = 0; i < 20; i++) spawnParticle({ kind: "spark", x: p.body.position.x - dir.x * i * 4, y: p.body.position.y - dir.y * i * 4 + rand(-8, 8), vx: -dir.x * rand(2, 6), vy: rand(-2, 2), life: 22, maxLife: 22, color: "#ffb347", r: 2.5 });
    }
  });
  regSpell("volcanospell", {
    name: "Volcano",
    color: "#ff5e57",
    cooldown: 3400,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 190);
      const gy = groundYAt(pos.x);
      explode(pos.x, gy, 90 * m, 14 * m, 18 * m, p);
      for (let i = 0; i < 6; i++) {
        const rock = dropProjectile(p, pos.x + rand(-20, 20), gy - 20, { r: 8, vx: rand(-9, 9), vy: -rand(12, 20), color: "#ff5e57", density: 5e-3, expireMs: 3e3 });
        rock.gravityScale = 1;
        rock.noContactBoom = true;
        rock.contactDamage = 20 * m;
      }
    }
  });
  regSpell("fireflies", {
    name: "Firefly Swarm",
    color: "#ffe066",
    cooldown: 2600,
    cast(p) {
      for (let i = 0; i < 6; i++) {
        const fb = shoot(p, { r: 3, speed: rand(6, 10), vy: rand(-8, 0), color: "#ffe066", gravityScale: 0, expireMs: 3500 });
        fb.onHit = (self, other) => {
          spawnParticles(self.position.x, self.position.y, "#ffe066", 6, 3);
          if (other && other.label === "player") {
            damagePlayer(other.player, 6);
            other.player.burnUntil = simNow() + 1200;
          }
        };
        fb.update = (self) => {
          const t = nearestEnemy(p, 1e9, self.position);
          if (!t) return;
          const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
          const d = Math.hypot(dx, dy) || 1;
          setVelocity(self, { x: self.velocity.x * 0.92 + dx / d * 1.6, y: self.velocity.y * 0.92 + dy / d * 1.6 });
        };
      }
    }
  });
  regSpell("blink", {
    name: "Blink",
    color: "#c3b1e1",
    cooldown: 1300,
    selfMove: true,
    cast(p) {
      spawnParticles(p.body.position.x, p.body.position.y, "#c3b1e1", 14, 5);
      const dir = aimDir(p, 1, 0);
      const nx = Math.max(30, Math.min(W - 30, p.body.position.x + dir.x * 220));
      const ny = Math.max(40, Math.min(H - 60, p.body.position.y + dir.y * 160));
      setPosition(p.body, { x: nx, y: ny });
      p.invulnUntil = simNow() + 300;
      spawnParticles(nx, ny, "#c3b1e1", 14, 5);
      sfx.pickup();
    }
  });
  regSpell("rocketleap", {
    name: "Rocket Leap",
    color: "#ffab76",
    cooldown: 2e3,
    selfMove: true,
    cast(p) {
      const m = p.mega || 1;
      explode(p.body.position.x, p.body.position.y + 16, 120 * m, 18 * m, 15 * m, p);
      setVelocity(p.body, { x: p.body.velocity.x, y: -26 });
    }
  });
  regSpell("ghostwalk", { name: "Ghost Walk", color: "#e8e8ff", cooldown: 4e3, cast(p) {
    p.speedUntil = simNow() + 1500;
    p.invulnUntil = simNow() + 1500;
    spawnText(p.body.position.x, p.body.position.y - 44, "GHOSTLY", "#e8e8ff");
  } });
  regSpell("swaphex", {
    name: "Swap Hex",
    color: "#f5b7ff",
    cooldown: 3200,
    cast(p) {
      const others = enemiesOf(p);
      if (!others.length) return;
      const t = pick(others);
      const a = { ...p.body.position }, b = { ...t.body.position };
      setPosition(p.body, b);
      setPosition(t.body, a);
      spawnParticles(a.x, a.y, "#f5b7ff", 12, 5);
      spawnParticles(b.x, b.y, "#f5b7ff", 12, 5);
      spawnText(b.x, b.y - 44, "SWAP!", "#f5b7ff");
      sfx.pickup();
    }
  });
  regSpell("timeskip", { name: "Time Skip", color: "#b0e0e6", cooldown: 5e3, cast(p) {
    slowMo(0.35, 1300);
    p.speedUntil = simNow() + 1300;
    doFlash("#b0e0e6", 0.2);
  } });
  regSpell("smokebomb", {
    name: "Smoke Bomb",
    color: "#9a9ab0",
    cooldown: 1800,
    selfMove: true,
    cast(p) {
      spawnParticles(p.body.position.x, p.body.position.y, "#9a9ab0", 30, 5, 60);
      const nx = Math.max(30, Math.min(W - 30, p.body.position.x - p.facing * 170));
      setPosition(p.body, { x: nx, y: p.body.position.y - 10 });
      p.invulnUntil = simNow() + 400;
    }
  });
  regSpell("springheel", { name: "Springheel", color: "#baffc9", cooldown: 5500, cast(p) {
    p.jumpBoostUntil = simNow() + 5e3;
    spawnText(p.body.position.x, p.body.position.y - 44, "BOING!", "#baffc9");
    sfx.boing();
  } });
  regSpell("featherfall", { name: "Feather Fall", color: "#fffde7", cooldown: 5e3, cast(p) {
    p.featherUntil = simNow() + 4e3;
    spawnText(p.body.position.x, p.body.position.y - 44, "FEATHER-LIGHT", "#fffde7");
  } });
  regSpell("secondwind", { name: "Second Wind", color: "#7bd88f", cooldown: 6e3, cast(p) {
    healPlayer(p, 35);
    spawnParticles(p.body.position.x, p.body.position.y, "#7bd88f", 16, 4);
  } });
  regSpell("aegis", { name: "Aegis", color: "#ffd700", cooldown: 6e3, cast(p) {
    p.invulnUntil = simNow() + 2500;
    sfx.pickup();
  } });
  regSpell("cratedrop", {
    name: "Crate Drop",
    color: "#b08948",
    cooldown: 2200,
    cast(p) {
      const pos = frontPos(p, 190);
      for (let i = 0; i < 3; i++) {
        const crate = createBox(pos.x + (i - 1) * 34, -40 - i * 30, 26, 26, { density: 3e-3, friction: 0.4, label: "crate" });
        crate.owner = p;
        summon(crate, { life: 9e3, contactDamage: 14 });
        setVelocity(crate, { x: 0, y: 9 });
      }
    }
  });
  regSpell("anvil", {
    name: "Anvil",
    color: "#2f2f3a",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const x = t ? t.body.position.x : frontPos(p, 200).x;
      const anvil = createBox(x, -40, 44 * m, 26 * m, { density: 0.02, friction: 0.8, label: "anvil" });
      summon(anvil, { life: 5e3, color: "#2f2f3a", contactDamage: 55 * m });
      sfx.clang();
    }
  });
  regSpell("piano", {
    name: "Grand Piano",
    color: "#14141c",
    cooldown: 4200,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const x = t ? t.body.position.x : frontPos(p, 200).x;
      const piano = createBox(x, -60, 84 * m, 44 * m, { density: 0.018, friction: 0.8, label: "piano" });
      summon(piano, { life: 5500, color: "#14141c", contactDamage: 80 * m });
      sfx.clang();
      setBanner("\u{1F3B9}", "#fff", 700);
    }
  });
  regSpell("bouncycastle", {
    name: "Bouncy Castle",
    color: "#ffb3de",
    cooldown: 3e3,
    cast(p) {
      for (let i = 0; i < 3; i++) {
        const ball = createCircle(p.body.position.x + p.facing * (50 + i * 30), p.body.position.y - 40 - i * 20, 14, { density: 1e-3, restitution: 1.35, friction: 0.01, label: "bouncy" });
        ball.owner = p;
        summon(ball, { life: 6e3, color: "#ffb3de", contactDamage: 13 });
        setVelocity(ball, { x: p.facing * rand(6, 12), y: -rand(3, 9) });
      }
      sfx.boing();
    }
  });
  regSpell("stonewall", {
    name: "Stone Wall",
    color: "#6b6b7a",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 80);
      const wall = createBox(pos.x, pos.y - 30, 30 * m, 130 * m, { isStatic: true, friction: 0.6, label: "wall" });
      summon(wall, { life: 5500, color: "#6b6b7a" });
    }
  });
  regSpell("trampoline", {
    name: "Trampoline",
    color: "#ff8fc7",
    cooldown: 3200,
    cast(p) {
      const pos = frontPos(p, 90);
      const gy = groundYAt(pos.x);
      const tramp = createBox(pos.x, gy - 8, 100, 14, { isStatic: true, restitution: 0.4, friction: 0.1, label: "tramp" });
      summon(tramp, { life: 7e3, color: "#ff8fc7" });
      sfx.boing();
    }
  });
  regSpell("decoy", {
    name: "Mirror Image",
    color: "#e8d5ff",
    cooldown: 3400,
    cast(p) {
      for (const dir of [-1, 1]) {
        const d = createCircle(p.body.position.x + dir * 40, p.body.position.y - 10, 15, { density: 4e-3, friction: 0.05, restitution: 0.2, label: "decoy" });
        d.decoyOf = p;
        summon(d, { life: 5e3 });
        setVelocity(d, { x: dir * rand(3, 7), y: -5 });
      }
    }
  });
  regSpell("beehive", {
    name: "Beehive",
    color: "#e8b647",
    cooldown: 4200,
    cast(p) {
      const pos = frontPos(p, 120);
      const hive = createBox(pos.x, pos.y - 20, 22, 26, { density: 2e-3, friction: 0.6, label: "hive" });
      summon(hive, { life: 3e3, color: "#e8b647" });
      const t0 = simNow();
      let i = 0;
      activeEffects.push({
        until: t0 + 2200,
        update(now) {
          if (now > t0 + i * 260 && i < 8) {
            i++;
            const bee = shoot(p, { r: 2.5, speed: rand(4, 7), vy: rand(-6, -2), color: "#ffe066", gravityScale: 0, expireMs: 3e3 });
            setPosition(bee, { x: hive.position.x, y: hive.position.y - 10 });
            bee.onHit = (self, other) => {
              if (other && other.label === "player") damagePlayer(other.player, 7, p);
            };
            bee.update = (self) => {
              const t = nearestEnemy(p, 1e9, self.position);
              if (!t) return;
              const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
              const d = Math.hypot(dx, dy) || 1;
              setVelocity(self, { x: self.velocity.x * 0.9 + dx / d * 1.8, y: self.velocity.y * 0.9 + dy / d * 1.8 });
            };
          }
        }
      });
    }
  });
  regSpell("boulder", {
    name: "Boulder",
    color: "#5a5245",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const x = t ? t.body.position.x + rand(-40, 40) : frontPos(p, 220).x;
      const rock = createCircle(x, -50, 26 * m, { density: 0.012, friction: 0.4, restitution: 0.2, label: "boulderS" });
      summon(rock, { life: 6e3, color: "#5a5245", contactDamage: 35 * m });
    }
  });
  regSpell("sawblade", {
    name: "Sawblade",
    color: "#c0c0cc",
    cooldown: 2400,
    cast(p) {
      const m = p.mega || 1;
      const saw = createCircle(p.body.position.x + p.facing * 36, p.body.position.y, 15 * m, { density: 4e-3, friction: 0.9, restitution: 0.4, label: "saw" });
      saw.owner = p;
      saw.sawDir = p.facing;
      summon(saw, { life: 3500, color: "#c0c0cc", contactDamage: 18 * m });
      setVelocity(saw, { x: p.facing * 13, y: -2 });
      setAngularVelocity(saw, p.facing * 0.9);
    }
  });
  regSpell("blackcat", {
    name: "Black Cat",
    color: "#1a1a24",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      const cat = summonCritter(p, { color: "#1a1a24", r: 8, hop: 5, speed: 7, life: 5e3 });
      cat.contactExplode = { radius: 120 * m, power: 18 * m, dmg: 30 * m };
    }
  });
  regSpell("rubberduck", {
    name: "Rubber Duck",
    color: "#ffd700",
    cooldown: 1600,
    cast(p) {
      summonCritter(p, { color: "#ffd700", r: 9, hop: 8, speed: 5, life: 6e3, rest: 0.9, dmg: 9 });
      spawnText(p.body.position.x + p.facing * 40, p.body.position.y - 30, "QUACK", "#ffd700");
      sfx.squeak();
    }
  });
  regSpell("gravflip", {
    name: "Gravity Flip",
    color: "#c084fc",
    cooldown: 6e3,
    cast(p) {
      p.gravityLockDir = gravityY() < 0 ? -1 : 1;
      p.gravityLockUntil = simNow() + 2500;
      const id = push({ kind: "flip" });
      doFlash("#c084fc", 0.3);
      setBanner("GRAVITY!", "#c084fc", 1e3);
      activeEffects.push({ until: simNow() + 2500, onEnd() {
        pop(id);
      } });
    }
  });
  regSpell("moongrav", {
    name: "Moon Gravity",
    color: "#d8d8f0",
    cooldown: 6e3,
    cast() {
      const id = push({ kind: "scale", value: 0.3 });
      setBanner("LOW GRAVITY", "#d8d8f0", 1e3);
      activeEffects.push({ until: simNow() + 4e3, onEnd() {
        pop(id);
      } });
    }
  });
  regSpell("earthquake", {
    name: "Earthquake",
    color: "#a0785a",
    cooldown: 4e3,
    cast(p) {
      addShake(24);
      sfx.explosion();
      for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        addVelocity(b, { x: rand(-8, 8), y: -rand(2, 10) });
      }
    }
  });
  regSpell("poltergeist", {
    name: "Poltergeist",
    color: "#b39ddb",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1;
      const props = queryRadius(
        p.body.position,
        520,
        { filter: (b) => loose(b) && b.label !== "player" && b.label !== "boss" }
      );
      if (props.length < 5) {
        for (let i = 0; i < 6; i++) {
          const junk = createPolygon(p.body.position.x + rand(-70, 70), p.body.position.y - rand(20, 90), pick([3, 4, 5, 6]), rand(9, 16), { density: 25e-4, frictionAir: 0.01, label: "ball" });
          junk.color = "#b39ddb";
          junk.owner = p;
          summon(junk, { life: 4e3, color: "#b39ddb", contactDamage: 12 * m });
          props.push(junk);
        }
      }
      spawnRing(p.body.position.x, p.body.position.y, "#b39ddb");
      for (const b of props) {
        const t = nearestEnemy(p, 1e9, b.position);
        if (!t) break;
        const dx = t.body.position.x - b.position.x, dy = t.body.position.y - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        setVelocity(b, { x: dx / d * 18, y: dy / d * 18 - 3 });
        if (simRandom() < 0.5) spawnParticles(b.position.x, b.position.y, "#b39ddb", 3, 2, 16);
      }
    }
  });
  regSpell("disarm", { name: "Butterfingers", color: "#f5deb3", cooldown: 4500, cast(p) {
    for (const q of enemiesOf(p)) {
      disarmPlayer(q);
      spawnText(q.body.position.x, q.body.position.y - 44, "DISARMED", "#f5deb3");
    }
  } });
  regSpell("roulette", {
    name: "Roulette",
    color: "#ff6b81",
    cooldown: 1e3,
    cast(p) {
      const k = pick(roulettePool());
      spawnText(p.body.position.x, p.body.position.y - 52, SPELLS[k].name.toUpperCase() + "?!", SPELLS[k].color);
      SPELLS[k].cast(p);
    }
  });
  regSpell("chaostheory", {
    name: "Chaos Theory",
    color: "#ff4df0",
    cooldown: 5e3,
    cast() {
      doFlash("#ff4df0", 0.3);
      for (const q of players) {
        if (!q.alive) continue;
        spawnParticles(q.body.position.x, q.body.position.y, "#ff4df0", 10, 4);
        setPosition(q.body, { x: rand(100, W - 100), y: rand(80, 300) });
        setVelocity(q.body, { x: 0, y: 0 });
        spawnParticles(q.body.position.x, q.body.position.y, "#ff4df0", 10, 4);
      }
    }
  });
  regSpell("bigbang", {
    name: "Big Bang",
    color: "#fff3d6",
    cooldown: 6e3,
    cast(p) {
      const m = p.mega || 1;
      doFlash("#fff3d6", 0.5);
      slowMo(0.15, 400);
      explode(p.body.position.x, p.body.position.y, 400 * m, 34 * m, 60 * m, p);
    }
  });
  regSpell("frograin", {
    name: "Rain of Frogs",
    color: "#7bd88f",
    cooldown: 4200,
    cast(p) {
      for (let i = 0; i < 8; i++) {
        summonCritter(p, { color: "#7bd88f", r: 7, hop: 9, speed: 3, life: 6e3, x: rand(100, W - 100), y: -30 - i * 25, dir: pick([-1, 1]), dmg: 4 });
      }
      setBanner("RIBBIT", "#7bd88f", 800);
    }
  });
  regSpell("confetti", {
    name: "Confetti Cannon",
    color: "#ff9ff3",
    cooldown: 500,
    cast(p) {
      const m = p.mega || 1;
      for (let i = 0; i < 24; i++) {
        spawnParticle({ kind: "confetti", x: p.body.position.x + p.facing * 20, y: p.body.position.y - 8, vx: p.facing * rand(4, 14), vy: rand(-8, 2), life: 60, maxLife: 60, color: pick(["#4ecdc4", "#ff6b81", "#ffd166", "#a55eea", "#e8d5ff"]), r: 4 });
      }
      const t = nearestEnemy(p, 200 * m);
      if (t && Math.sign(t.body.position.x - p.body.position.x) === p.facing) {
        addVelocity(t.body, { x: p.facing * 14 * m, y: -5 });
      }
      sfx.squeak();
    }
  });
  regSpell("kingsdecree", { name: "King's Decree", color: "#ffd700", cooldown: 5e3, cast(p) {
    const m = p.mega || 1;
    for (const q of enemiesOf(p)) {
      q.shrinkUntil = simNow() + 4e3 * m;
      spawnText(q.body.position.x, q.body.position.y - 44, "SHRUNK", "#ffd700");
    }
    setBanner("BY ROYAL DECREE", "#ffd700", 1100);
  } });
  regSpell("midas", {
    name: "Midas Touch",
    color: "#ffd700",
    cooldown: 3400,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p, 320);
      if (!t) return;
      const now = simNow(), dur = 2e3 * m;
      applyFreeze(t, now + dur);
      t.heavyUntil = now + dur;
      spawnParticles(t.body.position.x, t.body.position.y, "#ffd700", 20, 5);
      spawnText(t.body.position.x, t.body.position.y - 44, "GOLD!", "#ffd700");
      activeEffects.push({ until: now + dur, onEnd() {
        if (!t.alive) return;
        damagePlayer(t, 16 * m, p);
        spawnParticles(t.body.position.x, t.body.position.y, "#ffd700", 22, 7);
        spawnText(t.body.position.x, t.body.position.y - 44, "SHATTER!", "#ffd700");
        sfx.freeze?.();
      } });
    }
  });
  regSpell("banana", {
    name: "Banana Peel",
    color: "#ffe135",
    cooldown: 1400,
    cast(p) {
      const pos = frontPos(p, 60);
      const peel = createBox(pos.x, pos.y, 16, 6, { density: 1e-3, friction: 0.05, label: "banana" });
      peel.owner = p;
      summon(peel, { life: 1e4, color: "#ffe135", armAt: simNow() + 700 });
    }
  });
  regSpell("yoink", {
    name: "Yoink",
    color: "#7ae7c7",
    cooldown: 1600,
    cast(p) {
      let target = null, bd = 1e9;
      for (const t of [...tomes, ...hats]) {
        const d = Math.hypot(t.position.x - p.body.position.x, t.position.y - p.body.position.y);
        if (d < bd) {
          bd = d;
          target = t;
        }
      }
      if (target) {
        const dx = p.body.position.x - target.position.x, dy = p.body.position.y - target.position.y;
        const d = Math.hypot(dx, dy) || 1;
        setVelocity(target, { x: dx / d * 20, y: dy / d * 20 - 2 });
        boltVisual(p.body.position.x, p.body.position.y, target.position.x, target.position.y, "#7ae7c7", 2, 100);
        spawnText(p.body.position.x, p.body.position.y - 44, "YOINK!", "#7ae7c7");
      } else {
        const t = nearestEnemy(p, 500);
        if (t) {
          const dx = p.body.position.x - t.body.position.x, dy = p.body.position.y - t.body.position.y;
          const d = Math.hypot(dx, dy) || 1;
          setVelocity(t.body, { x: dx / d * 16, y: dy / d * 16 - 3 });
          spawnText(p.body.position.x, p.body.position.y - 44, "YOINK!", "#7ae7c7");
        }
      }
    }
  });
  regSpell("unoreverse", { name: "Uno Reverse", color: "#4ecdff", cooldown: 5e3, cast(p) {
    p.reflectUntil = simNow() + 3e3;
    spawnText(p.body.position.x, p.body.position.y - 44, "REVERSE!", "#4ecdff");
  } });
  regSpell("balloonhex", {
    name: "Balloon Hex",
    color: "#ff6b81",
    cooldown: 2600,
    cast(p) {
      statusBolt(p, { color: "#ff6b81", r: 6, speed: 16, vy: -4, dmg: 5 }, (q, m) => {
        q.floatyUntil = simNow() + 1800 * m;
        setVelocity(q.body, { x: q.body.velocity.x, y: -7 });
        spawnText(q.body.position.x, q.body.position.y - 44, "UP UP", "#ff6b81");
        sfx.boing?.();
      });
    }
  });
  regSpell("anchorhex", {
    name: "Anchor Hex",
    color: "#5a6b7a",
    cooldown: 2600,
    cast(p) {
      statusBolt(p, { color: "#5a6b7a", r: 6, speed: 16, vy: -4, dmg: 5 }, (q, m) => {
        q.heavyUntil = simNow() + 2600 * m;
        setVelocity(q.body, { x: q.body.velocity.x, y: 11 });
        spawnText(q.body.position.x, q.body.position.y - 44, "HEAVY", "#5a6b7a");
        sfx.thud?.();
      });
    }
  });
  regSpell("shrinkray", { name: "Shrink Ray", color: "#98fb98", cooldown: 2200, cast(p) {
    statusBolt(p, { color: "#98fb98", dmg: 10 }, (q, m) => {
      q.shrinkUntil = simNow() + 4e3 * m;
      spawnText(q.body.position.x, q.body.position.y - 40, "tiny!", "#98fb98");
    });
  } });
  regSpell("growthspurt", { name: "Growth Spurt", color: "#a7e88f", cooldown: 5e3, cast(p) {
    p.growUntil = simNow() + 4e3;
    spawnText(p.body.position.x, p.body.position.y - 50, "BIG!", "#a7e88f");
  } });
  regSpell("mirrorcast", {
    name: "Mirror Cast",
    color: "#dcdcf0",
    cooldown: 1200,
    cast(p) {
      const t = nearestEnemy(p);
      const src = t && t.spellId;
      const id = mirrorEligible(src) ? src : null;
      if (!id) {
        spawnText(p.body.position.x, p.body.position.y - 52, "NOTHING!", "#dcdcf0");
        return;
      }
      spawnText(p.body.position.x, p.body.position.y - 52, SPELLS[id].name.toUpperCase(), SPELLS[id].color);
      SPELLS[id].cast(p);
    }
  });
  regSpell("vampirebolt", {
    name: "Vampire Bolt",
    color: "#c2185b",
    cooldown: 1400,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 7 * m, speed: 19, vy: -5, color: "#c2185b", gravityScale: 0.5 });
      fb.onHit = (self, other) => {
        spawnParticles(self.position.x, self.position.y, "#c2185b", 10, 4);
        if (other && other.label === "player") {
          damagePlayer(other.player, 25 * m);
          healPlayer(p, 25 * m);
        }
      };
    }
  });
  regSpell("lifeswap", {
    name: "Life Swap",
    color: "#ff80ab",
    cooldown: 5e3,
    cast(p) {
      const fb = shoot(p, { r: 8, speed: 17, vy: -5, color: "#ff80ab", gravityScale: 0.5 });
      fb.onHit = (self, other) => {
        spawnParticles(self.position.x, self.position.y, "#ff80ab", 12, 4);
        if (other && other.label === "player" && other.player.alive && p.alive) {
          const q = other.player;
          const tmp = p.hp;
          p.hp = q.hp;
          q.hp = tmp;
          spawnText(p.body.position.x, p.body.position.y - 44, `${Math.round(p.hp)}HP`, "#ff80ab");
          spawnText(q.body.position.x, q.body.position.y - 44, `${Math.round(q.hp)}HP`, "#ff80ab");
        }
      };
    }
  });
  regSpell("pigmorph", {
    name: "Pig Morph",
    color: "#ff9ecb",
    cooldown: 3e3,
    cast(p) {
      statusBolt(p, { color: "#ff9ecb", dmg: 5 }, (q, m) => {
        q.pigUntil = simNow() + 3800 * m;
        spawnText(q.body.position.x, q.body.position.y - 44, "OINK!", "#ff9ecb");
        sfx.oink();
      });
    }
  });
  regSpell("lightningrod", {
    name: "Lightning Rod",
    color: "#e3f265",
    cooldown: 5e3,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 140);
      const gy = groundYAt(pos.x);
      const rod = createBox(pos.x, gy - 40, 8, 80, { isStatic: true, label: "wall" });
      summon(rod, { life: 5e3, color: "#e3f265" });
      const t0 = simNow();
      let next2 = t0 + 700;
      activeEffects.push({
        until: t0 + 5e3,
        update(now) {
          if (now > next2 && summons.has(rod)) {
            next2 = now + 900;
            skyBolt(rod.position.x + rand(-40, 40), 25, p, m);
          }
        }
      });
    }
  });
  regSpell("teslacoil", {
    name: "Tesla Coil",
    color: "#9ef0f0",
    cooldown: 4800,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 110);
      const gy = groundYAt(pos.x);
      const coil = createBox(pos.x, gy - 25, 14, 50, { isStatic: true, label: "wall" });
      summon(coil, { life: 4e3, color: "#9ef0f0" });
      const t0 = simNow();
      let next2 = t0 + 400;
      activeEffects.push({
        until: t0 + 4e3,
        update(now) {
          if (now > next2 && summons.has(coil)) {
            next2 = now + 500;
            for (const q of enemiesOf(p)) {
              const d = Math.hypot(q.body.position.x - coil.position.x, q.body.position.y - coil.position.y);
              if (d < 240 * m) {
                boltVisual(coil.position.x, coil.position.y - 20, q.body.position.x, q.body.position.y, "#9ef0f0", 2, 90);
                damagePlayer(q, 8 * m);
              }
            }
          }
        }
      });
    }
  });
  regSpell("kitchensink", {
    name: "Kitchen Sink",
    color: "#d8d8e0",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 14 * m, speed: 18, vy: -5, color: "#d8d8e0", gravityScale: 0.8, density: 0.015, restitution: 0.3, expireMs: 3e3 });
      fb.noContactBoom = true;
      fb.contactDamage = 45 * m;
      setAngularVelocity(fb, p.facing * 0.5);
      sfx.clang();
      spawnText(p.body.position.x, p.body.position.y - 50, "EVERYTHING!", "#d8d8e0");
    }
  });

  // src/sim/spells/fusion.js
  var WILD = "__wild__";
  var HYBRID_SPELLS = {};
  function regHybrid(id, def) {
    def.hybrid = true;
    HYBRID_SPELLS[id] = def;
  }
  var F_FIRE = ["fireball", "ember", "twinfire", "trishot", "scatter", "mortar", "sunburst", "skullrocket", "dragonbreath", "ignite", "shard", "firecrackers", "volcanospell", "napalm", "flamewall", "phoenixdash", "starfall"];
  var F_ICE = ["frost", "iceshard", "snowball", "coldsnap", "glacier", "permafrost", "blizzard", "frostnova", "icicledrop", "flashfreeze"];
  var F_ZAP = ["lightning", "zapspell", "thunderlance", "chain", "railgun", "sweep", "skysmite", "teslacoil", "lightningrod", "stormcall"];
  var F_AIR = ["gust", "shove", "cyclone", "vortexpull", "updraft", "tornado", "repulsor", "slam", "magnetpalm"];
  var F_EARTH = ["cratedrop", "anvil", "piano", "boulder", "stonewall", "bowling", "sawblade", "cannonball"];
  var F_VOID = ["blackhole", "meteor", "bigbang", "gravflip", "chaostheory", "moongrav"];
  var F_LIFE = ["secondwind", "vampirebolt", "aegis", "ghostwalk"];
  var F_TRICK = ["banana", "pigmorph", "swaphex", "roulette", "shrinkray", "balloonhex", "anchorhex", "unoreverse", "wobble", "decoy", "blackcat", "rubberduck", "confetti", "poltergeist", "brainfreeze", "disarm", "kingsdecree", "midas", "growthspurt", "smokebomb", "mirrorcast", "timeskip", "yoink", "lifeswap", "frograin", "boomerang", "kitchensink"];
  var FUSIONS = [
    // --- amplified (same-school) ---
    { id: "inferno", a: F_FIRE, b: F_FIRE },
    { id: "absolutezero", a: F_ICE, b: F_ICE },
    { id: "overload", a: F_ZAP, b: F_ZAP },
    { id: "maelstrom", a: F_AIR, b: F_AIR },
    { id: "rockslide", a: F_EARTH, b: F_EARTH },
    { id: "bigcrunch", a: F_VOID, b: F_VOID },
    { id: "sanctuary", a: F_LIFE, b: F_LIFE },
    { id: "pandemonium", a: F_TRICK, b: F_TRICK },
    // --- cross-school ---
    { id: "steamburst", a: F_FIRE, b: F_ICE },
    { id: "plasmalance", a: F_FIRE, b: F_ZAP },
    { id: "firestorm", a: F_FIRE, b: F_AIR },
    { id: "moltenmeteor", a: F_FIRE, b: F_EARTH },
    { id: "blacksun", a: F_FIRE, b: F_VOID },
    { id: "soulflame", a: F_FIRE, b: F_LIFE },
    { id: "superconductor", a: F_ICE, b: F_ZAP },
    { id: "howlingblizzard", a: F_ICE, b: F_AIR },
    { id: "avalanche", a: F_ICE, b: F_EARTH },
    { id: "frozenstar", a: F_ICE, b: F_VOID },
    { id: "frostward", a: F_ICE, b: F_LIFE },
    { id: "thunderstorm", a: F_ZAP, b: F_AIR },
    { id: "teslashrapnel", a: F_ZAP, b: F_EARTH },
    { id: "ionstorm", a: F_ZAP, b: F_VOID },
    { id: "defibrillator", a: F_ZAP, b: F_LIFE },
    { id: "sandstorm", a: F_AIR, b: F_EARTH },
    { id: "eventhorizon", a: F_AIR, b: F_VOID },
    { id: "zephyr", a: F_AIR, b: F_LIFE },
    { id: "gravitywell", a: F_EARTH, b: F_VOID },
    { id: "bulwark", a: F_EARTH, b: F_LIFE },
    { id: "soulharvest", a: F_VOID, b: F_LIFE },
    { id: "hexfire", a: F_TRICK, b: F_FIRE },
    { id: "coldfeet", a: F_TRICK, b: F_ICE },
    { id: "joybuzzer", a: F_TRICK, b: F_ZAP },
    { id: "whirligig", a: F_TRICK, b: F_AIR },
    { id: "boobytrap", a: F_TRICK, b: F_EARTH },
    { id: "realityglitch", a: F_TRICK, b: F_VOID },
    { id: "voodoo", a: F_TRICK, b: F_LIFE }
  ];
  function hybridFor(x, y) {
    if (!x || !y || x === WILD && y === WILD) return null;
    for (const r of FUSIONS) {
      if (x === WILD) {
        if (r.a.includes(y) || r.b.includes(y)) return r.id;
        continue;
      }
      if (y === WILD) {
        if (r.a.includes(x) || r.b.includes(x)) return r.id;
        continue;
      }
      if (r.a.includes(x) && r.b.includes(y) || r.a.includes(y) && r.b.includes(x)) return r.id;
    }
    return null;
  }
  function tryFuse(p) {
    if (!p.slots[0] || !p.slots[1]) return false;
    const id = hybridFor(p.slots[0], p.slots[1]);
    if (!id) return false;
    const def = SPELLS[id];
    const charges = hybridCharges(def);
    p.slots[0] = id;
    p.slots[1] = null;
    p.slotCharges[0] = charges;
    p.slotCharges[1] = null;
    p.casts[0] = 0;
    p.slotFilledAt[0] = simNow();
    p.lastCastSlot = 0;
    const { x, y } = p.body.position;
    setBanner("\u26A1 FUSION! " + def.name.toUpperCase(), def.color, 1800, true);
    spawnText(x, y - 62, `${def.name.toUpperCase()}! \xD7${charges}`, def.color);
    spawnRing(x, y, def.color);
    spawnParticles(x, y, def.color, 28, 8);
    doFlash(def.color, 0.35);
    addShake(9);
    slowMo(0.32, 700);
    sfx.hyper?.();
    if (game.state === "PLAY") telPick(id);
    return true;
  }
  regHybrid("inferno", {
    name: "Inferno",
    color: "#ff5e3a",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      for (let i = 0; i < 6; i++) {
        const fb = shoot(p, { r: 6, speed: 16, vy: 0, color: "#ff5e3a", gravityScale: 0.3, angle: i / 6 * Math.PI * 2 });
        fb.owner = p;
        fb.onHit = () => explode(fb.position.x, fb.position.y, 90 * m, 14 * m, 22 * m, p, { selfSafe: true });
      }
      explode(p.body.position.x, p.body.position.y, 130 * m, 12 * m, 8 * m, p, { selfSafe: true });
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 320 * m) q.burnUntil = simNow() + 2500 * m;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        spawnBurst(p.body.position.x + Math.cos(a) * 30, p.body.position.y + Math.sin(a) * 30, i % 2 ? "#ffd166" : "#ff5e3a", 4, { dir: -Math.PI / 2, spread: 1, speed: 5, up: 4, g: 0.06, life: 46 });
      }
      doFlash("#ff5e3a", 0.3);
      addShake(7);
      sfx.cast();
    }
  });
  regHybrid("absolutezero", {
    name: "Absolute Zero",
    color: "#bfe8ff",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      sfx.freeze();
      doFlash("#bfe8ff", 0.35);
      addShake(6);
      for (const q of enemiesOf(p)) {
        applyFreeze(q, simNow() + 1400 * m);
        damagePlayer(q, 14 * m, p);
        spawnBurst(q.body.position.x, q.body.position.y, "#eaffff", 14, { kind: "spark", speed: 9, r: 2.5 });
        spawnBurst(q.body.position.x, q.body.position.y, "#bfe8ff", 8, { speed: 4, r: 3 });
      }
    }
  });
  regHybrid("overload", {
    name: "Overload",
    color: "#fffacd",
    cooldown: 2400,
    beam: true,
    cast(p) {
      for (const ao of [-0.28, -0.14, 0, 0.14, 0.28]) zapRay(p, 26, 14, 3, ao);
      const d = aimDir(p, 1, 0), base2 = Math.atan2(d.y, d.x);
      for (let i = 0; i < 18; i++) spawnBurst(p.body.position.x, p.body.position.y - 6, i % 2 ? "#fffacd" : "#ffffff", 2, { kind: "spark", dir: base2 + rand(-0.35, 0.35), spread: 0.1, speed: 11, r: 2 });
      sfx.lightning();
      doFlash("#ffffff", 0.4);
      addShake(9);
    }
  });
  regHybrid("steamburst", {
    name: "Steam Burst",
    color: "#d7f0ea",
    cooldown: 1800,
    cast(p) {
      const m = p.mega || 1;
      const fb = boomBolt(p, { selfSafe: true, color: "#d7f0ea", r: 12, vy: -5, speed: 15, radius: 180, power: 22, dmg: 36 });
      const base2 = fb.onHit;
      fb.onHit = (self, other) => {
        base2?.(self, other);
        if (other?.label === "player" && other.player.alive) applyFreeze(other.player, simNow() + 700 * m);
      };
      const sp = frontPos(p, 90, -6);
      spawnBurst(sp.x, sp.y, "#eafaf6", 22, { speed: 3.5, up: 3, g: -0.08, life: 60, r: 5 });
      spawnBurst(sp.x, sp.y, "#c8e8e0", 14, { speed: 2.2, up: 4, g: -0.06, life: 70, r: 6 });
      sfx.freeze();
      doFlash("#d7f0ea", 0.15);
    }
  });
  regHybrid("plasmalance", {
    name: "Plasma Lance",
    color: "#ff4df0",
    cooldown: 2e3,
    beam: true,
    cast(p) {
      const m = p.mega || 1;
      const { hit } = zapRay(p, 52, 26, 4);
      const d = aimDir(p, 1, 0);
      for (let i = 1; i <= 8; i++) spawnBurst(p.body.position.x + d.x * i * 90, p.body.position.y - 6 + d.y * i * 90, i % 2 ? "#ff4df0" : "#ffd6fb", 3, { kind: "spark", speed: 5, r: 2 });
      sfx.lightning();
      doFlash("#ff4df0", 0.3);
      addShake(8);
      if (hit && hit.label === "player") hit.player.burnUntil = simNow() + 2600 * m;
    }
  });
  regHybrid("superconductor", {
    name: "Superconductor",
    color: "#9ef0f0",
    cooldown: 2400,
    beam: true,
    cast(p) {
      const m = p.mega || 1;
      const { hit, pt } = zapRay(p, 38, 10, 3);
      if (hit && hit.label === "player") {
        applyFreeze(hit.player, simNow() + 1e3 * m);
      }
      const d = aimDir(p, 1, 0);
      const px = Math.max(30, Math.min(W - 30, pt.x - d.x * 16));
      const pillar = createBox(px, pt.y - 42, 26 * Math.min(m, 1.5), 110 * Math.min(m, 1.5), { isStatic: true, friction: 0.01, label: "wall" });
      summon(pillar, { life: 3500, color: "#bfe8ff" });
      spawnBurst(pt.x, pt.y, "#eaffff", 14, { kind: "spark", speed: 8, r: 2 });
      spawnBurst(px, pt.y - 70, "#9ef0f0", 10, { speed: 3, up: 2, g: 0.04, life: 40 });
      doFlash("#9ef0f0", 0.2);
      addShake(5);
      sfx.lightning();
      sfx.freeze();
    }
  });
  regHybrid("firestorm", {
    name: "Firestorm",
    color: "#ff7043",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const start = frontPos(p, 70);
      const e = {
        until: simNow() + 2400,
        x: start.x,
        vx: p.facing * 3.2,
        net: { k: "tor", x: start.x, c: "#ff7043" },
        update(now) {
          e.x += e.vx;
          e.net.x = e.x;
          if (e.x < 50 || e.x > W - 50) e.vx = -e.vx;
          const reach = 110 * m;
          for (const b of queryRegion(column(e.x - reach, e.x + reach), {
            filter: (b2) => loose(b2) && !(b2.label === "player" && b2.player === p) && Math.abs(b2.position.x - e.x) <= reach
          })) {
            const dx = b.position.x - e.x;
            setVelocity(b, { x: b.velocity.x - Math.sign(dx || 1) * perSecond(0.8) + perSecond(rand(-0.5, 0.5)), y: b.velocity.y - perSecond(1.6) * m });
            if (b.label === "player" && b.player.alive) b.player.burnUntil = Math.max(b.player.burnUntil || 0, now + 900 * m);
          }
        },
        // narrower rings, a per-ring heat gradient and a faster sway than the air
        // tornado's — tracks e.x, which update() moves every tick
        vfx: { k: "firetor" }
      };
      activeEffects.push(e);
      spawnBurst(start.x, p.body.position.y, "#ff7043", 16, { dir: -Math.PI / 2, spread: 1.2, speed: 6, up: 3, g: -0.03, life: 40 });
      doFlash("#ff7043", 0.2);
      addShake(6);
      sfx.cast();
    }
  });
  regHybrid("howlingblizzard", {
    name: "Howling Blizzard",
    color: "#d8f4ff",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      explode(x + p.facing * 260, y, 220, 10 * m, 18 * m, p, { selfSafe: true });
      for (const q of enemiesOf(p)) {
        if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 440) {
          applyFreeze(q, simNow() + 800 * m);
          addVelocity(q.body, { x: p.facing * 6, y: 0 });
        }
      }
      spawnParticles(x + p.facing * 200, y, "#d8f4ff", 22, 6);
      sfx.freeze();
    }
  });
  regHybrid("thunderstorm", {
    name: "Thunderstorm",
    color: "#d9e650",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      const t0 = simNow();
      let i = 0;
      activeEffects.push({ until: t0 + 950, update(now) {
        if (now > t0 + i * 180 && i < 4) {
          i++;
          skyBolt(rand(80, W - 80), 22, p, m, { selfSafe: true });
        }
      } });
      sfx.lightning();
    }
  });
  regHybrid("moltenmeteor", {
    name: "Molten Meteor",
    color: "#ff5e57",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const fb = boomBolt(p, { selfSafe: true, color: "#ff5e57", r: 14, vy: -12, speed: 12, g: 0.9, radius: 180, power: 26, dmg: 40 });
      const base2 = fb.onHit;
      fb.onHit = (self, other) => {
        base2?.(self, other);
        if (other?.label === "player" && other.player.alive) other.player.burnUntil = simNow() + 2200 * m;
        for (let i = 0; i < 4; i++) {
          const blob = dropProjectile(p, self.position.x + rand(-14, 14), self.position.y - 24, { r: 6, vx: rand(-9, 9), vy: rand(-10, -5), color: i % 2 ? "#ff8c5a" : "#ff5e57", density: 3e-3, expireMs: 2600 });
          blob.onHit = (bSelf, bOther) => {
            explode(blob.position.x, blob.position.y, 70 * m, 9 * m, 12 * m, p, { selfSafe: true });
            if (bOther?.label === "player" && bOther.player.alive) bOther.player.burnUntil = simNow() + 1400 * m;
          };
        }
        spawnBurst(self.position.x, self.position.y, "#ffd166", 14, { dir: -Math.PI / 2, spread: 2, speed: 8, up: 4, g: 0.12, life: 40 });
      };
      addShake(6);
    }
  });
  regHybrid("avalanche", {
    name: "Avalanche",
    color: "#8aa0b0",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const tx = t ? t.body.position.x : p.body.position.x + p.facing * 300;
      const t0 = simNow();
      let dropped = 0;
      activeEffects.push({
        until: t0 + 900,
        update(now) {
          while (dropped < 5 && now > t0 + dropped * 150) {
            dropped++;
            const rx = Math.max(60, Math.min(W - 60, tx + rand(-110, 110)));
            const chunk = dropProjectile(p, rx, -40, { r: rand(10, 15) * Math.min(m, 1.6), vy: rand(15, 19), color: dropped % 2 ? "#eaf6ff" : "#bfe8ff", density: 7e-3 });
            chunk.onHit = () => {
              explode(chunk.position.x, chunk.position.y, 90 * m, 12 * m, 16 * m, p, { selfSafe: true });
              const nw = simNow();
              for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - chunk.position.x, q.body.position.y - chunk.position.y) < 120) applyFreeze(q, Math.max(q.frozenUntil || 0, nw + 700 * m));
              spawnBurst(chunk.position.x, chunk.position.y, "#eaffff", 10, { kind: "spark", speed: 7 });
            };
          }
        }
      });
      for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - tx) < 180) q.heavyUntil = simNow() + 1500 * m;
      addShake(9);
      sfx.freeze?.();
    }
  });
  regHybrid("teslashrapnel", {
    name: "Tesla Shrapnel",
    color: "#c0c0cc",
    cooldown: 2200,
    beam: true,
    cast(p) {
      zapRay(p, 44, 30, 4);
      addShake(9);
      addVelocity(p.body, { x: -p.facing * 8, y: -4 });
      for (let i = 0; i < 3; i++) boomBolt(p, { selfSafe: true, color: "#c0c0cc", r: 4, vy: rand(-6, 0), speed: rand(18, 26), radius: 60, power: 12, dmg: 12 });
      sfx.lightning();
    }
  });
  regHybrid("blacksun", {
    name: "Black Sun",
    color: "#a55eea",
    cooldown: 3400,
    cast(p) {
      const m = p.mega || 1;
      const dir = aimDir(p, 1, 0);
      const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y - 40 + dir.y * 240;
      spawnSingularity(sx, sy, m, p, { selfSafe: true });
      explode(sx, sy, 160, 8 * m, 20 * m, p, { selfSafe: true });
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 300) q.burnUntil = simNow() + 2600 * m;
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2;
        spawnBurst(sx + Math.cos(a) * 44, sy + Math.sin(a) * 44, i % 3 ? "#ff7043" : "#a55eea", 2, { dir: a + Math.PI / 2, spread: 0.3, speed: 5, g: 0, life: 44 });
      }
      doFlash("#a55eea", 0.3);
    }
  });
  regHybrid("eventhorizon", {
    name: "Event Horizon",
    color: "#b58aff",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1;
      const dir = aimDir(p, 1, 0);
      const sx = p.body.position.x + dir.x * 260, sy = p.body.position.y + dir.y * 260;
      spawnSingularity(sx, sy, m, p, { selfSafe: true });
      activeEffects.push({ until: simNow() + 720, onEnd() {
        explode(sx, sy, 260, 26 * m, 34 * m, p, { selfSafe: true });
        addShake(12);
      } });
    }
  });
  regHybrid("soulflame", {
    name: "Soul Flame",
    color: "#c2185b",
    cooldown: 2e3,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 7, speed: 18, vy: -4, color: "#c2185b", gravityScale: 0.5 });
      fb.owner = p;
      fb.onHit = (self, other) => {
        explode(self.position.x, self.position.y, 90 * m, 10 * m, 26 * m, p, { selfSafe: true });
        if (other && other.label === "player") healPlayer(p, 16 * m);
        spawnParticles(self.position.x, self.position.y, "#c2185b", 12, 4);
      };
    }
  });
  regHybrid("maelstrom", {
    name: "Maelstrom",
    color: "#c8f7f7",
    cooldown: 3200,
    cast(p) {
      const m = p.mega || 1;
      const { x, y } = p.body.position;
      for (const q of enemiesOf(p)) {
        const dx = x - q.body.position.x, dy = y - 120 - q.body.position.y, d = Math.hypot(dx, dy) || 1;
        setVelocity(q.body, { x: q.body.velocity.x + dx / d * 9, y: -6 + dy / d * 4 });
        damagePlayer(q, 10 * m, p);
      }
      spawnRing(x, y, "#c8f7f7");
      spawnParticles(x, y, "#c8f7f7", 24, 7);
      addShake(7);
      sfx.cast();
    }
  });
  regHybrid("rockslide", {
    name: "Rockslide",
    color: "#8a7a5a",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const cx = t ? t.body.position.x : p.body.position.x + p.facing * 300;
      const t0 = simNow();
      let dropped = 0;
      activeEffects.push({
        until: t0 + 1100,
        update(now) {
          while (dropped < 6 && now > t0 + dropped * 140) {
            dropped++;
            const rx = Math.max(60, Math.min(W - 60, cx + rand(-150, 150)));
            const rock = dropProjectile(p, rx, -40, { r: rand(11, 17) * Math.min(m, 1.6), vy: rand(14, 18), vx: rand(-1.5, 1.5), color: dropped % 2 ? "#8a7a5a" : "#5a5245", density: 8e-3 });
            rock.onHit = () => explode(rock.position.x, rock.position.y, 100 * m, 15 * m, 20 * m, p, { selfSafe: true });
          }
        }
      });
      for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - cx) < 220) q.heavyUntil = simNow() + 1800 * m;
      addShake(11);
      sfx.thud?.();
    }
  });
  regHybrid("bigcrunch", {
    name: "Big Crunch",
    color: "#a55eea",
    cooldown: 4e3,
    cast(p) {
      const m = p.mega || 1;
      const dir = aimDir(p, 1, 0);
      const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y + dir.y * 240;
      spawnSingularity(sx, sy, 1.6 * m, p, { selfSafe: true });
      activeEffects.push({ until: simNow() + 1e3, onEnd() {
        explode(sx, sy, 320, 30 * m, 44 * m, p, { selfSafe: true });
        addShake(16);
        doFlash("#a55eea", 0.4);
      } });
    }
  });
  regHybrid("sanctuary", {
    name: "Sanctuary",
    color: "#7bd88f",
    cooldown: 6e3,
    cast(p) {
      const m = p.mega || 1;
      healPlayer(p, 45 * m);
      p.invulnUntil = simNow() + 2200 * m;
      spawnRing(p.body.position.x, p.body.position.y, "#7bd88f");
      spawnParticles(p.body.position.x, p.body.position.y, "#7bd88f", 22, 5);
      spawnText(p.body.position.x, p.body.position.y - 50, "SANCTUARY", "#7bd88f");
      sfx.pickup?.();
    }
  });
  regHybrid("frozenstar", {
    name: "Frozen Star",
    color: "#9be7ff",
    cooldown: 3400,
    cast(p) {
      const m = p.mega || 1;
      const dir = aimDir(p, 1, 0);
      const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y - 30 + dir.y * 240;
      spawnSingularity(sx, sy, m, p, { selfSafe: true });
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 320) applyFreeze(q, simNow() + 1100 * m);
      doFlash("#9be7ff", 0.3);
      sfx.freeze();
    }
  });
  regHybrid("frostward", {
    name: "Frost Ward",
    color: "#aee4ff",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1, now = simNow();
      healPlayer(p, 22 * m);
      p.reflectUntil = Math.max(p.reflectUntil || 0, now + 1900 * m);
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 260) applyFreeze(q, now + 900 * m);
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        spawnBurst(p.body.position.x + Math.cos(a) * 34, p.body.position.y - 8 + Math.sin(a) * 34, "#eaffff", 2, { kind: "spark", dir: a, spread: 0.2, speed: 1.5, g: 0, life: 50, r: 2 });
      }
      spawnRing(p.body.position.x, p.body.position.y, "#aee4ff");
      spawnText(p.body.position.x, p.body.position.y - 50, "FROST WARD", "#aee4ff");
      sfx.freeze();
    }
  });
  regHybrid("ionstorm", {
    name: "Ion Storm",
    color: "#9ef0f0",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1;
      const dir = aimDir(p, 1, 0);
      const sx = p.body.position.x + dir.x * 260, sy = p.body.position.y + dir.y * 200;
      spawnSingularity(sx, sy, m, p, { selfSafe: true });
      const t0 = simNow();
      let i = 0;
      activeEffects.push({ until: t0 + 1100, update(now) {
        if (now > t0 + i * 200 && i < 5) {
          i++;
          skyBolt(sx + rand(-120, 120), 18, p, m, { selfSafe: true });
        }
      } });
      doFlash("#9ef0f0", 0.25);
    }
  });
  regHybrid("defibrillator", {
    name: "Defibrillator",
    color: "#e3f265",
    cooldown: 3e3,
    beam: true,
    cast(p) {
      const m = p.mega || 1;
      healPlayer(p, 22 * m);
      for (const ao of [-0.12, 0.12]) zapRay(p, 34, 20, 4, ao);
      doFlash("#ffffff", 0.35);
      addShake(8);
      sfx.lightning();
    }
  });
  regHybrid("sandstorm", {
    name: "Sandstorm",
    color: "#d8c48a",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1;
      for (let i = 0; i < 6; i++) boomBolt(p, { selfSafe: true, color: "#d8c48a", r: 4, vy: rand(-6, 2), speed: rand(16, 26), radius: 55, power: 12, dmg: 10 });
      for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - p.body.position.x) < 500 && (q.body.position.x - p.body.position.x) * p.facing > 0) {
        q.reversedUntil = simNow() + 1400 * m;
        addVelocity(q.body, { x: p.facing * 7, y: -2 });
      }
      spawnParticles(p.body.position.x + p.facing * 120, p.body.position.y, "#d8c48a", 20, 6);
      sfx.cast();
    }
  });
  regHybrid("zephyr", {
    name: "Zephyr",
    color: "#dfffff",
    cooldown: 4e3,
    cast(p) {
      const m = p.mega || 1;
      healPlayer(p, 20 * m);
      p.speedUntil = simNow() + 3e3;
      p.jumpBoostUntil = simNow() + 3e3;
      p.featherUntil = simNow() + 2e3;
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 240) setVelocity(q.body, { x: (q.body.position.x - p.body.position.x) * 0.05 + Math.sign(q.body.position.x - p.body.position.x) * 8, y: -7 });
      spawnText(p.body.position.x, p.body.position.y - 50, "ZEPHYR", "#dfffff");
      spawnParticles(p.body.position.x, p.body.position.y, "#dfffff", 16, 5);
      sfx.boing?.();
    }
  });
  regHybrid("gravitywell", {
    name: "Gravity Well",
    color: "#7a6a9a",
    cooldown: 3400,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const cx = t ? t.body.position.x : p.body.position.x + p.facing * 260;
      const cy = t ? t.body.position.y : p.body.position.y;
      for (const q of enemiesOf(p)) {
        const dx = cx - q.body.position.x, dy = cy - q.body.position.y, d = Math.hypot(dx, dy) || 1;
        if (d < 400) {
          addVelocity(q.body, { x: dx / d * 10, y: dy / d * 6 });
          q.heavyUntil = simNow() + 2e3 * m;
        }
      }
      activeEffects.push({ until: simNow() + 500, onEnd() {
        explode(cx, cy, 200, 20 * m, 30 * m, p, { selfSafe: true });
        addShake(12);
      } });
      spawnRing(cx, cy, "#7a6a9a");
    }
  });
  regHybrid("bulwark", {
    name: "Bulwark",
    color: "#9a8a6a",
    cooldown: 4200,
    cast(p) {
      const m = p.mega || 1;
      healPlayer(p, 28 * m);
      p.invulnUntil = simNow() + 1400 * m;
      explode(p.body.position.x, p.body.position.y, 180, 22 * m, 16 * m, p, { selfSafe: true });
      spawnRing(p.body.position.x, p.body.position.y, "#9a8a6a");
      spawnText(p.body.position.x, p.body.position.y - 50, "BULWARK", "#9a8a6a");
      addShake(8);
    }
  });
  regHybrid("soulharvest", {
    name: "Soul Harvest",
    color: "#b39ddb",
    cooldown: 4e3,
    cast(p) {
      const m = p.mega || 1;
      let reaped = 0;
      for (const q of enemiesOf(p)) {
        if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 420) {
          damagePlayer(q, 22 * m, p);
          reaped++;
          boltVisual(q.body.position.x, q.body.position.y, p.body.position.x, p.body.position.y, "#b39ddb", 2, 130);
          spawnBurst(q.body.position.x, q.body.position.y, "#b39ddb", 8, { speed: 4, up: 3, g: -0.05, life: 46 });
        }
      }
      if (reaped) healPlayer(p, 12 * reaped * m);
      spawnParticles(p.body.position.x, p.body.position.y, "#b39ddb", 20, 5);
      doFlash("#b39ddb", 0.2);
      sfx.blackhole?.();
    }
  });
  var CHAOS_COLORS = ["#ff6b81", "#4ecdff", "#ffd166", "#7bd88f", "#a55eea", "#ff9ff3"];
  function chaosBurst(x, y, count = 14, o = {}) {
    for (const c of CHAOS_COLORS) spawnBurst(x, y, c, Math.ceil(count / CHAOS_COLORS.length), o);
  }
  regHybrid("pandemonium", {
    name: "Pandemonium",
    color: "#ff9ff3",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1, now = simNow();
      for (const q of enemiesOf(p)) {
        const roll = Math.floor(simRandom() * 5);
        if (roll === 0) freezeUntil(q, now + 1e3 * m);
        else if (roll === 1) q.reversedUntil = now + 2500 * m;
        else if (roll === 2) q.shrinkUntil = now + 3500 * m;
        else if (roll === 3) {
          q.floatyUntil = now + 2500 * m;
          setVelocity(q.body, { x: q.body.velocity.x, y: -9 });
        } else q.heavyUntil = now + 2500 * m;
        chaosBurst(q.body.position.x, q.body.position.y, 12, { speed: 5, up: 2 });
      }
      chaosBurst(p.body.position.x, p.body.position.y, 30, { speed: 8, up: 3 });
      setBanner("PANDEMONIUM!", "#ff9ff3", 900, true);
      addShake(8);
      sfx.hyper?.();
    }
  });
  regHybrid("hexfire", {
    name: "Hexfire",
    color: "#ff7ac0",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1, now = simNow();
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 460) {
        q.burnUntil = now + 2600 * m;
        q.shrinkUntil = now + 3e3 * m;
        damagePlayer(q, 12 * m, p);
        spawnBurst(q.body.position.x, q.body.position.y, "#ff7ac0", 10, { speed: 5, up: 3, g: 0.1 });
      }
      doFlash("#ff7ac0", 0.2);
      sfx.cast();
    }
  });
  regHybrid("coldfeet", {
    name: "Cold Feet",
    color: "#a7d8ff",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1, now = simNow();
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 420) {
        applyFreeze(q, now + 700 * m);
        q.reversedUntil = now + 3e3 * m;
        spawnBurst(q.body.position.x, q.body.position.y, "#a7d8ff", 12, { speed: 5, r: 2.5 });
      }
      sfx.freeze();
    }
  });
  regHybrid("joybuzzer", {
    name: "Joy Buzzer",
    color: "#f2e14e",
    cooldown: 2400,
    beam: true,
    cast(p) {
      const m = p.mega || 1;
      const { hit } = zapRay(p, 30, 22, 4);
      if (hit && hit.label === "player") {
        hit.player.reversedUntil = simNow() + 2600 * m;
        spawnBurst(hit.position.x, hit.position.y, "#f2e14e", 16, { kind: "spark", speed: 8 });
      }
      doFlash("#ffffff", 0.3);
      addShake(7);
      sfx.lightning();
    }
  });
  regHybrid("whirligig", {
    name: "Whirligig",
    color: "#c9f7ff",
    cooldown: 2800,
    cast(p) {
      const m = p.mega || 1, now = simNow(), { x, y } = p.body.position;
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 380) {
        q.floatyUntil = now + 2600 * m;
        q.reversedUntil = now + 1600 * m;
        const ang = Math.atan2(q.body.position.y - y, q.body.position.x - x) + Math.PI / 2;
        setVelocity(q.body, { x: Math.cos(ang) * 10, y: -8 });
      }
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * Math.PI * 2;
        spawnBurst(x + Math.cos(a) * 40, y + Math.sin(a) * 40, "#c9f7ff", 2, { dir: a + Math.PI / 2, spread: 0.4, speed: 6, up: 0 });
      }
      sfx.boing?.();
    }
  });
  regHybrid("boobytrap", {
    name: "Booby Trap",
    color: "#d8b26a",
    cooldown: 3e3,
    cast(p) {
      const m = p.mega || 1;
      const t = nearestEnemy(p);
      const cx = t ? t.body.position.x : p.body.position.x + p.facing * 260;
      const gy = groundYAt(cx);
      spawnText(cx, gy - 40, "TICK...", "#d8b26a");
      spawnParticles(cx, gy - 12, "#d8b26a", 6, 2, 30);
      const t0 = simNow();
      activeEffects.push({
        until: t0 + 900,
        vfx: { k: "blink", x: cx, y: gy - 10, r: 7, a: "#d8b26a", b: "#ff5e57", rate: 0.025 },
        onEnd() {
          explode(cx, gy - 10, 170, 22 * m, 28 * m, p, { selfSafe: true });
          const nw = simNow();
          for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - cx) < 200 && Math.abs(q.body.position.y - gy) < 160) q.heavyUntil = nw + 2500 * m;
          chaosBurst(cx, gy - 20, 12, { speed: 6, up: 3 });
          addShake(10);
          sfx.thud?.();
        }
      });
    }
  });
  regHybrid("realityglitch", {
    name: "Reality Glitch",
    color: "#b06bff",
    cooldown: 3800,
    cast(p) {
      const m = p.mega || 1;
      const dir = aimDir(p, 1, 0);
      const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y + dir.y * 240;
      spawnSingularity(sx, sy, m, p, { selfSafe: true });
      for (const q of enemiesOf(p)) {
        setPosition(q.body, { x: rand(120, W - 120), y: rand(120, 360) });
        chaosBurst(q.body.position.x, q.body.position.y, 12, { speed: 6 });
      }
      doFlash("#b06bff", 0.35);
      slowMo(0.4, 260);
      sfx.freeze();
    }
  });
  regHybrid("voodoo", {
    name: "Voodoo",
    color: "#c65ba0",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1, now = simNow();
      let drained = 0;
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 440) {
        damagePlayer(q, 16 * m, p);
        q.shrinkUntil = now + 3500 * m;
        drained++;
        boltVisual(q.body.position.x, q.body.position.y, p.body.position.x, p.body.position.y, "#c65ba0", 2, 120);
      }
      if (drained) healPlayer(p, 10 * drained * m);
      spawnBurst(p.body.position.x, p.body.position.y, "#c65ba0", 20, { speed: 5, up: 2 });
      doFlash("#c65ba0", 0.2);
      sfx.blackhole?.();
    }
  });

  // src/sim/pickups.js
  var tomes = /* @__PURE__ */ new Set();
  var hats = /* @__PURE__ */ new Set();
  var nextTomeAt = 0;
  var lastTomeSpell = null;
  var firstDrop = false;
  function tomePool() {
    return Object.keys(SPELLS).filter((id) => !SPELLS[id].hybrid);
  }
  function dealStartingSpells(who = players) {
    const pool = tomePool();
    const dealt = new Set(players.map((p) => p.slots[0]).filter(Boolean));
    for (const p of who) {
      let id = weightedSpellPick(pool);
      for (let tries = 0; tries < 12 && dealt.has(id); tries++) id = weightedSpellPick(pool);
      if (!id) continue;
      dealt.add(id);
      addSpell(p, id);
    }
  }
  function scheduleTomes(now) {
    nextTomeAt = now + rand(2500, 4e3);
    firstDrop = false;
  }
  function updateTomes(now) {
    const tomeCap = Math.max(3, Math.ceil(players.length / 2));
    if (now > nextTomeAt && (firstDrop || tomes.size < tomeCap)) {
      if (firstDrop) {
        firstDrop = false;
        const n = Math.max(2, players.length);
        for (let i = 0; i < n; i++) spawnTome(now);
      } else {
        const roll = simRandom();
        const megaOut = hats.size > 0 || players.some((p) => p.megaCasts > 0);
        if (!megaOut && roll < 0.12) spawnHat(now);
        else if (roll < 0.22) spawnCatalyst(now);
        else spawnTome(now);
      }
      nextTomeAt = now + rand(3500, 5500);
    }
    for (const t of [...tomes, ...hats]) {
      if (now - t.bornAt > 2e4 || t.position.y > H + 80 || t.position.y < -120) {
        spawnParticles(t.position.x, t.position.y, "#e8d5ff", 6, 3);
        tomes.delete(t);
        hats.delete(t);
        removeBody(t);
      }
    }
  }
  function tomeDropSpot() {
    const g = gravityY();
    const landable = (x) => (b) => (b.isStatic || b.label === "plank") && !b.isSensor && b.collisionFilter.mask !== 0 && b.bounds.min.x > -60 && b.bounds.max.x < W + 60 && x > b.bounds.min.x + 6 && x < b.bounds.max.x - 6;
    for (let tries = 0; tries < 24; tries++) {
      const x = rand(90, W - 90);
      const col = queryRegion(column(x), { filter: landable(x) });
      if (!col.length) continue;
      if (g >= 0) {
        const tops = col.map((b) => b.bounds.min.y).filter((y) => y > 130 && y < H - 50);
        if (!tops.length) continue;
        const top = Math.min(...tops);
        const blocked = col.some((b) => b.bounds.max.y < top - 4 && b.bounds.max.y > 0);
        return { x, y: blocked ? top - 34 : -40 };
      } else {
        const bottoms = col.map((b) => b.bounds.max.y).filter((y) => y > 100 && y < H - 80);
        if (!bottoms.length) continue;
        const bottom = Math.max(...bottoms);
        const blocked = col.some((b) => b.bounds.min.y > bottom + 4 && b.bounds.min.y < H);
        return { x, y: blocked ? bottom + 34 : H + 40 };
      }
    }
    const s = pick(currentMap.def.spawns);
    return { x: s.x, y: Math.max(60, s.y - 40) };
  }
  function spawnTome(now) {
    const pool = tomePool();
    let spell;
    do {
      spell = weightedSpellPick(pool);
    } while (spell === lastTomeSpell && pool.length > 1);
    lastTomeSpell = spell;
    const spot = tomeDropSpot();
    const tome = createBox(spot.x, spot.y, 20, 24, { density: 1e-3, frictionAir: 0.05, label: "tome" });
    tome.spell = spell;
    tome.bornAt = now;
    tomes.add(tome);
    addBody(tome);
  }
  function spawnCatalyst(now) {
    const spot = tomeDropSpot();
    const c = createBox(spot.x, spot.y, 22, 22, { density: 1e-3, frictionAir: 0.05, label: "tome" });
    c.catalyst = true;
    c.bornAt = now;
    tomes.add(c);
    addBody(c);
  }
  function spawnHat(now) {
    const spot = tomeDropSpot();
    const hat = createBox(spot.x, spot.y, 28, 20, { density: 1e-3, frictionAir: 0.05, label: "hat" });
    hat.bornAt = now;
    hats.add(hat);
    addBody(hat);
    setBanner("A MEGA HAT FALLS...", "#ffd700", 1200);
  }
  function pickupTome(tome, p) {
    if (!tomes.has(tome) || !p.alive) return;
    tomes.delete(tome);
    removeBody(tome);
    if (tome.catalyst) {
      grabCatalyst(p);
      return;
    }
    if (game.state === "PLAY") {
      statFor(p).tomes++;
      telPick(tome.spell);
    }
    const slot = addSpell(p, tome.spell);
    if (slot === -1) return;
    sfx.pickup();
    spawnParticles(tome.position.x, tome.position.y, SPELLS[tome.spell].color, 14, 5);
    spawnText(p.body.position.x, p.body.position.y - 48, SPELLS[tome.spell].name.toUpperCase() + "!", SPELLS[tome.spell].color);
    const tier = spellTier(tome.spell);
    if ((TIER_RANK[tier] || 0) >= 2) {
      spawnText(p.body.position.x, p.body.position.y - 66, tier === "legendary" ? "\u2605 LEGENDARY \u2605" : "RARE!", TIER_COLOR[tier]);
      spawnParticles(tome.position.x, tome.position.y, TIER_COLOR[tier], tier === "legendary" ? 22 : 12, 6);
      if (tier === "legendary") {
        setBanner("\u2605 LEGENDARY SPELL \u2605", TIER_COLOR[tier], 900);
        sfx.hyper?.();
      }
    }
    tryFuse(p);
  }
  function grabCatalyst(p) {
    sfx.pickup();
    const { x, y } = p.body.position;
    spawnParticles(x, y, "#ff4df0", 18, 6);
    if (tryFuse(p)) return;
    const held = p.slots[0] || p.slots[1];
    if (held) {
      const keepSlot = p.slotFilledAt[0] >= p.slotFilledAt[1] ? 0 : 1;
      const kept = p.slots[keepSlot] || held;
      p.slots[0] = WILD;
      p.slots[1] = kept;
      if (tryFuse(p)) return;
      p.slots[0] = kept;
      p.slots[1] = null;
    }
    spawnText(x, y - 52, "NO FUSION", "#ff4df0");
  }
  function pickupHat(hat, p) {
    if (!hats.has(hat) || !p.alive) return;
    hats.delete(hat);
    removeBody(hat);
    p.megaCasts = 3;
    p.hp = MAX_HP;
    if ((p.sizeScale || 1) === 1) {
      scaleBody(p.body, 2, 2);
      p.sizeScale = 2;
    }
    sfx.victory();
    doFlash("#ffd700", 0.2);
    addShake(8);
    spawnRing(p.body.position.x, p.body.position.y, "#ffd700");
    spawnParticles(p.body.position.x, p.body.position.y, "#ffd700", 24, 7);
    spawnText(p.body.position.x, p.body.position.y - 70, "MEGA WIZARD!", "#ffd700");
    setBanner(`${p.name} IS MEGA`, "#ffd700", 1400);
  }
  function unMega(p) {
    if ((p.sizeScale || 1) > 1) {
      scaleBody(p.body, 0.5, 0.5);
      p.sizeScale = 1;
      spawnParticles(p.body.position.x, p.body.position.y, "#ffd700", 12, 4);
    }
  }
  onWorldReset(() => {
    tomes.clear();
    hats.clear();
    nextTomeAt = 0;
    lastTomeSpell = null;
    firstDrop = false;
  });

  // src/sim/ai/bot.js
  var BOT_PERSONAS = {
    // the classic all-rounder — today's bot, unchanged
    balanced: {
      names: ["BOTLIN", "CLANKY", "SPARKY", "RUSTY", "GIZMO", "WIZ-E", "COGSWORTH", "BLIP"],
      cadence: 1,
      combo: 0.22,
      keepDist: 0.15,
      standoff: 0,
      blockOdds: 0.3,
      aimMult: 1,
      tomeLust: false,
      fleeHp: 0,
      bully: false,
      chaos: false,
      nerve: 0.03
    },
    // wants your face: picks on the weakest wizard, presses in, fires fast, rarely blocks
    berserker: {
      names: ["CRUSHER", "MAULBOT", "RAMPAGE", "SMASHY", "GRIMBOLT"],
      cadence: 0.6,
      combo: 0.4,
      keepDist: 0,
      standoff: 0,
      blockOdds: 0.15,
      aimMult: 1.15,
      tomeLust: false,
      fleeHp: 0,
      bully: true,
      chaos: false,
      nerve: 0.055
    },
    // fights at arm's length: kites to a standoff range, parries well, runs when hurt
    skirmisher: {
      names: ["SKITTER", "DODGEREL", "ZOOMBOT", "FLICKER", "WISPY"],
      cadence: 1.1,
      combo: 0.15,
      keepDist: 0.3,
      standoff: 340,
      blockOdds: 0.45,
      aimMult: 0.95,
      tomeLust: false,
      fleeHp: 55,
      bully: false,
      chaos: false,
      nerve: 0.02
    },
    // plays the long game: a tome that completes a fusion outranks any fight
    alchemist: {
      names: ["BREWBOT", "FUSEY", "MIXTRON", "CAULDRON", "ALEMBIC"],
      cadence: 1.15,
      combo: 0.3,
      keepDist: 0.3,
      standoff: 0,
      blockOdds: 0.3,
      aimMult: 1,
      tomeLust: true,
      fleeHp: 45,
      bully: false,
      chaos: false,
      nerve: 0.015
    },
    // nobody knows what it wants, including itself — wild aim, wandering feet
    trickster: {
      names: ["JESTER", "WOBBLES", "GLITCHY", "HOOPLA", "KAZOO"],
      cadence: 0.85,
      combo: 0.3,
      keepDist: 0.25,
      standoff: 0,
      blockOdds: 0.25,
      aimMult: 1.3,
      tomeLust: false,
      fleeHp: 0,
      bully: false,
      chaos: true,
      nerve: 0.075
    }
  };
  var PERSONA_ORDER = ["berserker", "skirmisher", "alchemist", "trickster", "balanced"];
  var nextPersona = 0;
  var NAV_SKIP = /* @__PURE__ */ new Set(["lava", "spikes", "projectile", "gib", "player", "boss", "enemy", "tome", "hat"]);
  var _navBodies = null;
  var _navBodiesAt = -1e9;
  var _navMap = null;
  function navCandidates() {
    const now = simNow();
    if (!_navBodies || _navMap !== currentMap || now - _navBodiesAt > 200) {
      _navBodies = allBodies().filter((b) => !b.isSensor && !NAV_SKIP.has(b.label));
      _navBodiesAt = now;
      _navMap = currentMap;
    }
    return _navBodies;
  }
  onWorldReset(() => {
    _navBodies = null;
    _navBodiesAt = -1e9;
    _navMap = null;
  });
  function navGroundY(x, fromY) {
    let best = null;
    for (const b of navCandidates()) {
      if (b.collisionFilter.mask === 0) continue;
      if (x < b.bounds.min.x + 4 || x > b.bounds.max.x - 4) continue;
      if (b.bounds.min.y < fromY - 8) continue;
      if (best == null || b.bounds.min.y < best) best = b.bounds.min.y;
    }
    return best;
  }
  var BotController = class {
    constructor(persona) {
      this.persona = persona && BOT_PERSONAS[persona] ? persona : PERSONA_ORDER[nextPersona++ % PERSONA_ORDER.length];
      this.mood = BOT_PERSONAS[this.persona];
      this.prevJump = false;
      this.prevCast = false;
      this.nextThink = 0;
      this.plan = { move: 0, jump: false, cast: false, aim: null };
    }
    idle() {
      this.prevJump = false;
      this.prevCast = false;
      this.prevCast2 = false;
      return { move: 0, jump: false, cast: false, cast2: false, block: false, jumpPressed: false, castPressed: false, cast2Pressed: false, blockPressed: false, startPressed: false, aimPoint: null, aimVec: null, aimAngle: null };
    }
    // is stepping one pace in `dir` a walk into lava or off into a deep pit?
    // The lookahead has to cover everything the bot will traverse before its next
    // think (up to 280ms), so it scales with speed — and it samples ACROSS that
    // span rather than only at the far end, because a narrow gap between here and
    // there is still a hole to fall into.
    fallDanger(me, dir, vx = 0) {
      const look = Math.max(46, 42 + Math.abs(vx) * 14);
      const lava2 = currentMap.data.lavaY;
      for (const frac of [0.7, 1]) {
        const aheadX = Math.max(20, Math.min(W - 20, me.x + dir * look * frac));
        const g = navGroundY(aheadX, me.y);
        if (g == null) return true;
        if (lava2 != null && g > lava2 - 24) return true;
        if (g - me.y > 300) return true;
      }
      return false;
    }
    // How far this wizard can actually throw itself right now: a ground jump plus
    // the air jump it still has, carried by whatever speed it already has. Bots
    // used to assume one fixed 135px hop and refuse gaps they could clear.
    //
    // DIVERGES FROM UPSTREAM, deliberately and measurably. Upstream computes
    // `|vx| * 36`, optionally * 1.5 for the air jump — a model in which a standing
    // jump covers no ground at all. That is not true here: controller.js blends
    // in-air velocity toward +/-6 at perSecond(0.08) every tick, so a wizard that
    // leaves the ground at rest still crosses real distance. Upstream's formula
    // predicts 0px against a measured 176px.
    //
    // These two lines are measured in this engine, jumping at takeoff speed v and
    // holding air control: one jump reaches 176 + 9.2v, two reach 320 + 9v. An
    // earlier cut of this port used (274 + 150) scaled by speed, which
    // over-estimated at pace — 12 of 629 committed gap leaps went for a gap wider
    // than the wizard could cross, which is the exact failure the upstream commit
    // set out to remove, reintroduced in a different speed band.
    jumpReach(p, vx = 0) {
      const v = Math.abs(vx);
      return p.airJumps > 0 ? 320 + 9 * v : 176 + 9.2 * v;
    }
    // nearest direction with real footing within reach (used mid-air over death)
    safeGroundDir(me, lavaY) {
      for (let d = 60; d <= 380; d += 48) {
        for (const dir of [-1, 1]) {
          const x = me.x + dir * d;
          if (x < 30 || x > W - 30) continue;
          const g = navGroundY(x, me.y);
          if (g != null && (lavaY == null || g < lavaY - 24) && g - me.y < 300) return dir;
        }
      }
      return 0;
    }
    think(p, now) {
      const me = p.body.position;
      const lavaY = currentMap.data.lavaY;
      if (now - (p.lastGround || 0) >= 220) {
        const gBelow = navGroundY(me.x, me.y);
        if (gBelow == null || lavaY != null && gBelow > lavaY - 24) {
          const dir = this.safeGroundDir(me, lavaY) || (me.x > W / 2 ? -1 : 1);
          this.plan = { move: dir, jump: p.body.velocity.y > 2 && p.airJumps > 0, cast: false, cast2: false, aim: null, block: false };
          this.nextThink = now + 70;
          return;
        }
      }
      if (now < (p.spookedUntil || 0)) {
        this.plan = { move: pick([-1, 1]), jump: simRandom() < 0.3, cast: false, cast2: false, aim: null, block: false };
        this.nextThink = now + 130;
        return;
      }
      const m = this.mood;
      let tpos = null, tbody = null, vsBoss = false;
      if (game.boss?.announced) {
        tbody = game.boss.body;
        tpos = tbody.position;
        vsBoss = true;
      } else {
        let t = nearestEnemy(p);
        if (m.bully) {
          let weakest = null;
          for (const q of enemiesOf(p)) if (q.alive && (!weakest || q.hp < weakest.hp)) weakest = q;
          if (weakest) t = weakest;
        }
        if (t) {
          tbody = t.body;
          tpos = tbody.position;
        }
        if (tpos && simRandom() < 0.5) {
          for (const s of summons) {
            if (s.label === "decoy" && s.decoyOf !== p && Math.hypot(s.position.x - tpos.x, s.position.y - tpos.y) < 260) {
              tbody = s;
              tpos = { x: s.position.x, y: s.position.y };
              break;
            }
          }
        }
      }
      let goal = tpos;
      if (!p.spellId) {
        let best = null, bd = 1e9;
        for (const t of tomes) {
          const d = Math.hypot(t.position.x - me.x, t.position.y - me.y);
          if (d < bd) {
            bd = d;
            best = t;
          }
        }
        if (best) goal = best.position;
      } else if (m.tomeLust && goal === tpos) {
        const enemyClose = tpos && Math.hypot(tpos.x - me.x, tpos.y - me.y) < 170;
        if (!enemyClose) {
          let best = null, bd = 1e9;
          for (const t of tomes) {
            const fuses = t.catalyst || p.slots[0] && !p.slots[1] && hybridFor(p.slots[0], t.spell);
            if (!fuses) continue;
            const d = Math.hypot(t.position.x - me.x, t.position.y - me.y);
            if (d < 700 && d < bd) {
              bd = d;
              best = t;
            }
          }
          if (best) goal = best.position;
        }
      }
      const stale = game.lastDamageAt != null && now - game.lastDamageAt > 7e3;
      const FLEE_NEAR = 420;
      const REENGAGE_MS = 2800;
      let fleeing = false;
      if (!stale && m.fleeHp && tpos && goal === tpos && p.hp < m.fleeHp) {
        const dThreat = Math.hypot(tpos.x - me.x, tpos.y - me.y);
        if (now < (this.fleeUntil || 0)) fleeing = true;
        else if (now < (this.reengageUntil || 0)) fleeing = false;
        else if (dThreat < FLEE_NEAR) {
          this.fleeUntil = now + rand(900, 1700);
          this.reengageUntil = this.fleeUntil + REENGAGE_MS;
          fleeing = true;
        }
      }
      const standoff = stale ? 0 : m.standoff;
      let move = 0;
      if (goal) {
        const dx = goal.x - me.x;
        const d = goal === tpos ? Math.hypot(tpos.x - me.x, tpos.y - me.y) : 1e9;
        if (fleeing) move = -Math.sign(dx || 1);
        else if (goal === tpos && standoff && d < standoff - 60) move = -Math.sign(dx || 1);
        else if (Math.abs(dx) > 46 && !(goal === tpos && standoff && d < standoff + 60)) move = Math.sign(dx);
        else if (goal === tpos && !stale && simRandom() < m.keepDist) move = -Math.sign(dx || 1);
      } else if (simRandom() < 0.12) {
        move = pick([-1, 0, 1]);
      }
      if (m.chaos && simRandom() < 0.2) move = pick([-1, 0, 1]);
      if (me.x < 80) move = 1;
      if (me.x > W - 80) move = -1;
      const grounded2 = now - (p.lastGround || 0) < 220;
      let jump = false;
      if (!grounded2 && now < (this.gapJumpUntil || 0) && p.airJumps > 0 && p.body.velocity.y > 1) {
        const dir = Math.sign(p.body.velocity.x) || p.facing || 1;
        const ahead = navGroundY(me.x + dir * 40, me.y);
        if (ahead == null || ahead - me.y > 130) jump = true;
      }
      if (currentMap.data.lavaY != null && me.y > currentMap.data.lavaY - 60) jump = true;
      const vx = p.body.velocity.x;
      const lava2 = currentMap.data.lavaY;
      let vetoed = false;
      const blundering = now < (this.blunderUntil || 0);
      if (move && !blundering && this.fallDanger(me, move, vx)) {
        const reach = this.jumpReach(p, vx) * 0.85;
        let landDir = 0;
        for (const dist of [110, 135, 165, 195, 240, 300, 360]) {
          if (dist > reach) break;
          const landX = Math.max(24, Math.min(W - 24, me.x + move * dist));
          const gLand = navGroundY(landX, me.y);
          if (gLand == null) continue;
          if (lava2 != null && gLand > lava2 - 24) continue;
          if (gLand - me.y < 240 && gLand - me.y > -140) {
            landDir = move;
            break;
          }
        }
        const nerveOdds = (m.nerve ?? 0.03) * (fleeing ? 2.5 : 1);
        if (landDir && grounded2) {
          jump = true;
          this.gapJumpUntil = now + 1100;
        } else if (Math.abs(vx) > 1.6 && simRandom() < nerveOdds) {
          this.blunderUntil = now + 520;
        } else {
          move = 0;
          vetoed = true;
        }
      }
      if (Math.abs(vx) > 1.2 && !blundering) {
        const slideDir = Math.sign(vx);
        if (this.fallDanger(me, slideDir, vx) && (move === 0 || move === slideDir)) {
          move = -slideDir;
          vetoed = true;
        }
      }
      if (vetoed) this.nextThink = now + 70;
      if (goal && goal.y < me.y - 70 && grounded2 && simRandom() < 0.4) jump = true;
      if (move && Math.abs(p.body.velocity.x) < 0.5 && grounded2 && simRandom() < 0.3) jump = true;
      if (m.chaos && grounded2 && simRandom() < 0.15) jump = true;
      let cast = false, cast2 = false, aim = null;
      if (tpos && (p.slots[0] || p.slots[1])) {
        const d = Math.hypot(tpos.x - me.x, tpos.y - me.y);
        if (d < 620) {
          if (now - (this.lastShot || 0) > 520 * m.cadence) {
            const risky = (id) => currentMap.data.lavaY != null && SPELLS[id]?.selfMove;
            const r0 = p.slots[0] && !risky(p.slots[0]) && now - p.casts[0] > (SPELLS[p.slots[0]].cooldown || 0);
            const r1 = p.slots[1] && !risky(p.slots[1]) && now - p.casts[1] > (SPELLS[p.slots[1]].cooldown || 0);
            if (r0 && r1 && simRandom() < m.combo) {
              cast = true;
              cast2 = true;
            } else if (r0 && (!r1 || simRandom() < 0.6)) cast = true;
            else if (r1) cast2 = true;
          }
          const firingId = cast ? p.slots[0] : cast2 ? p.slots[1] : p.slots[0] || p.slots[1];
          const beam = !!(firingId && SPELLS[firingId]?.beam);
          const tspd = tbody ? Math.hypot(tbody.velocity.x, tbody.velocity.y) : 0;
          let err = (0.07 + d * 12e-5 + tspd * 0.014) * m.aimMult;
          if (beam) {
            err = err * 1.7 + 0.09;
            if ((cast || cast2) && now - (this.lastBeam || 0) < 950) {
              cast = cast2 = false;
            } else if ((cast || cast2) && tspd > 6 && simRandom() < 0.4) {
              cast = cast2 = false;
            }
            if (cast || cast2) this.lastBeam = now;
          }
          if (vsBoss) err *= 0.45;
          aim = Math.atan2(tpos.y - me.y, tpos.x - me.x) + rand(-Math.min(err, 0.45), Math.min(err, 0.45));
          if (cast || cast2) this.lastShot = now;
        }
      }
      let block = false;
      if (!vsBoss) {
        for (const fb of projectiles) {
          if (fb.owner === p) continue;
          const dx = me.x - fb.position.x, dy = me.y - fb.position.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && (fb.velocity.x * dx + fb.velocity.y * dy) / (d || 1) > 5 && simRandom() < m.blockOdds) {
            block = true;
            break;
          }
        }
      }
      this.plan = { move, jump, cast, cast2, aim, block };
    }
    poll() {
      const now = simNow();
      const p = this.player ??= players.find((q) => q.controller === this);
      if (!p || !p.alive || game.state !== "PLAY" && game.state !== "LOBBY") return this.idle();
      if (now > this.nextThink) {
        this.nextThink = now + rand(130, 280);
        this.think(p, now);
      }
      const { move, jump, cast, cast2, aim, block } = this.plan;
      const s = {
        move,
        jump,
        cast,
        cast2,
        block,
        jumpPressed: jump && !this.prevJump,
        castPressed: cast && !this.prevCast,
        cast2Pressed: cast2 && !this.prevCast2,
        blockPressed: block && !this.prevBlock,
        startPressed: false,
        aimPoint: null,
        aimVec: null,
        aimAngle: aim
      };
      this.prevJump = jump;
      this.prevCast = cast;
      this.prevCast2 = cast2;
      this.prevBlock = block;
      return s;
    }
  };
  function addBot(persona) {
    if (players.length >= MAX_PLAYERS) return;
    const bc = new BotController(persona);
    const used = new Set(players.map((p) => p.name));
    const name = BOT_PERSONAS[bc.persona].names.find((n) => !used.has(n)) || BOT_PERSONAS.balanced.names.find((n) => !used.has(n)) || `BOT ${players.length + 1}`;
    joinPlayer(bc, name);
  }
  onWorldReset(() => {
    nextPersona = 0;
  });

  // src/sim/telemetry.js
  var spellTally = {};
  var matchSpellTally = {};
  var blank = () => ({ picks: 0, casts: 0, dmg: 0, bossDmg: 0, kills: 0, deaths: 0 });
  function telSpell(id) {
    if (!id) return null;
    matchSpellTally[id] ??= blank();
    return spellTally[id] ??= blank();
  }
  function bump(id, key, n) {
    const s = telSpell(id);
    if (!s) return;
    s[key] += n;
    matchSpellTally[id][key] += n;
  }
  function telPick(id) {
    bump(id, "picks", 1);
  }
  function telCast(id) {
    bump(id, "casts", 1);
  }
  function telDmg(id, amt) {
    bump(id, "dmg", amt);
  }
  function telBossDmg(id, amt) {
    bump(id, "bossDmg", amt);
  }
  function telKill(id) {
    bump(id, "kills", 1);
  }
  function telDeath(id) {
    bump(id, "deaths", 1);
  }
  function resetTelemetry() {
    for (const k of Object.keys(spellTally)) delete spellTally[k];
  }
  function resetMatchTelemetry() {
    for (const k of Object.keys(matchSpellTally)) delete matchSpellTally[k];
  }
  function computeSpellReport(limit = 5) {
    const rows = [];
    for (const [id, s] of Object.entries(matchSpellTally)) {
      const dmg = Math.round(s.dmg + s.bossDmg);
      if (!s.kills && !dmg && !s.casts) continue;
      const def = typeof SPELLS !== "undefined" && SPELLS[id] || null;
      rows.push({
        id,
        n: def ? def.name : id,
        c: def ? def.color : "#e8d5ff",
        t: typeof spellTier === "function" ? spellTier(id) : "common",
        k: s.kills,
        d: dmg,
        ca: s.casts
      });
    }
    rows.sort((a, b) => b.k - a.k || b.d - a.d || b.ca - a.ca);
    return rows.slice(0, limit);
  }
  function flushRoundTelemetry() {
    if (netMode === "online") return;
    const spells = {};
    for (const [id, v] of Object.entries(spellTally)) spells[id] = { ...v };
    const rec = {
      // wall clock: log stamp, not sim state
      ts: Date.now(),
      ver: GAME_VERSION,
      round: game.totalRounds || 0,
      map: currentMap?.def?.name ?? null,
      boss: game.boss ? game.boss.def.id : null,
      winner: game.winner ? game.winner.name : null,
      players: players.length,
      bots: players.filter((p) => p.controller instanceof BotController).length,
      // what each wizard was holding when the round ended — correlate spell → outcome
      roster: players.map((p) => ({
        name: p.name,
        spell: p.spellId || null,
        alive: !!p.alive,
        bot: p.controller instanceof BotController,
        won: game.winner === p
      })),
      spells
    };
    postTelemetry(rec);
  }
  var postTelemetry = () => {
  };
  function setPostTelemetry(fn) {
    postTelemetry = fn || (() => {
    });
  }
  onWorldReset(() => {
    for (const k of Object.keys(spellTally)) delete spellTally[k];
    for (const k of Object.keys(matchSpellTally)) delete matchSpellTally[k];
  });

  // src/sim/maps/extras.js
  var extras_exports = {};
  __export(extras_exports, {
    GAP_MAX: () => GAP_MAX,
    GAP_STEP: () => GAP_STEP,
    buildMapExtras: () => buildMapExtras,
    ensureCover: () => ensureCover,
    ensureTraversable: () => ensureTraversable,
    scatterProps: () => scatterProps
  });
  function scatterProps(m, rng) {
    const rr = (a, b) => a + rng() * (b - a);
    const pk = (arr) => arr[Math.floor(rng() * arr.length)];
    const spots = platformSpots(m, 3 + Math.floor(rng() * 3), rng);
    for (const s of spots) {
      const roll = rng();
      if (roll < 0.26) buildCrateStack(m, s.x, s.y - 14, pk([1, 2]), pk([1, 2, 3]));
      else if (roll < 0.4) addBarrels(m, [s.x - 14, s.x + 14], s.y - 16);
      else if (roll < 0.54) buildCrateStack(m, s.x, s.y - 14, 2, pk([3, 4]));
      else if (roll < 0.9) addThemedCover(m, s.x, s.y + 8, rr, pk);
      else {
        const big = createBox(s.x, s.y - 24, 42, 42, { density: 4e-3, friction: 0.6, label: "crate" });
        addBody2(m, big, "#9a7440");
      }
    }
  }
  var GAP_MAX = 190;
  var GAP_STEP = 165;
  function ensureTraversable(m, rng) {
    if ((m.def.gravity ?? 2) < 0) return;
    const rr = (a, b) => a + rng() * (b - a);
    const walkable = allBodies(m.composite).filter((b) => !b.isSensor && b.label !== "spikes" && b.collisionFilter.mask !== 0 && (b.isStatic || b.label === "plank") && b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
    const deathY = (m.data.lavaY ?? H) - 24;
    const step = 16;
    const cols = [];
    for (let x = 24; x <= W - 24; x += step) {
      const tops = walkable.filter((b) => x > b.bounds.min.x + 2 && x < b.bounds.max.x - 2).map((b) => b.bounds.min.y).filter((y) => y > 90 && y < deathY);
      cols.push({ x, y: tops.length ? Math.min(...tops) : null });
    }
    let i = 0;
    while (i < cols.length) {
      if (cols[i].y != null) {
        i++;
        continue;
      }
      let j = i;
      while (j < cols.length && cols[j].y == null) j++;
      const leftEdge = i > 0 ? cols[i - 1] : null;
      const rightEdge = j < cols.length ? cols[j] : null;
      const x0 = leftEdge ? leftEdge.x : cols[i].x;
      const x1 = rightEdge ? rightEdge.x : cols[j - 1].x;
      const width = x1 - x0;
      if (width > GAP_MAX) {
        const edgeY = Math.min(leftEdge?.y ?? 560, rightEdge?.y ?? 560);
        const n = Math.max(1, Math.ceil(width / GAP_STEP) - 1);
        for (let k = 1; k <= n; k++) {
          const px = Math.max(60, Math.min(W - 60, x0 + width * k / (n + 1)));
          const py = Math.max(150, Math.min(deathY - 80, edgeY + rr(-40, 25)));
          let color = "#171221", bd = 1e9;
          for (const b of walkable) {
            const d = Math.hypot(b.position.x - px, b.position.y - py);
            if (d < bd) {
              bd = d;
              color = b.render.fillStyle || color;
            }
          }
          addStatic(m, px, py, rr(104, 148), 22, { color, friction: m.def.icy ? 0.01 : 0.6 });
          if (rng() < 0.35) addThemedCover(m, px, py - 11, rr, (arr) => arr[Math.floor(rng() * arr.length)]);
        }
      }
      i = j + 1;
    }
  }
  function ensureCover(m, rng) {
    const rr = (a, b) => a + rng() * (b - a);
    const pk = (arr) => arr[Math.floor(rng() * arr.length)];
    const want = m.def.cozy ? 2 : 3;
    const have = allBodies(m.composite).filter((b) => b.label === "destructible").length;
    if (have >= want * 3) return;
    const spots = platformSpots(m, want, rng);
    for (const s of spots) addThemedCover(m, s.x, s.y + 8, rr, pk);
  }
  function buildMapExtras(m, seed) {
    const rng = makeRng(seed);
    ensureTraversable(m, rng);
    scatterProps(m, rng);
    ensureCover(m, rng);
    ensureSetPiece(m, rng);
  }

  // src/sim/waves.js
  var waves_exports = {};
  __export(waves_exports, {
    WAVE_ENEMY_CAP: () => WAVE_ENEMY_CAP,
    clearEnemies: () => clearEnemies,
    endRun: () => endRun,
    pendingSpawns: () => pendingSpawns,
    queueSpawn: () => queueSpawn,
    startRun: () => startRun,
    startWave: () => startWave,
    updateWaveMode: () => updateWaveMode,
    waveComposition: () => waveComposition,
    waveTier: () => waveTier
  });

  // src/sim/storage.js
  var storage_exports = {};
  __export(storage_exports, {
    setStorage: () => setStorage,
    storage: () => storage
  });
  var NO_STORAGE = { getItem: () => null, setItem() {
  }, removeItem() {
  } };
  var storage = NO_STORAGE;
  function setStorage(s) {
    storage = s || NO_STORAGE;
  }

  // src/sim/waves.js
  var pendingSpawns = [];
  function clearEnemies() {
    for (const b of [...enemies]) removeSummon(b);
    enemies.clear();
    pendingSpawns = [];
  }
  var WAVE_ENEMY_CAP = 20;
  function waveTier(n) {
    return 1 + Math.floor((n - 1) / 5);
  }
  function waveComposition(n) {
    const list = [];
    for (let i = 0; i < 2 + Math.floor(n * 0.8); i++) list.push("swordsman");
    if (n >= 3) for (let i = 0; i < 1 + Math.floor(n / 4); i++) list.push("archer");
    if (n >= 4) for (let i = 0; i < 3 + Math.floor(n / 2); i++) list.push("bug");
    if (n >= 6) for (let i = 0; i < Math.floor((n - 4) / 3); i++) list.push("ogre");
    if (list.length > WAVE_ENEMY_CAP) {
      console.warn(`wave ${n}: capping ${list.length} enemies to ${WAVE_ENEMY_CAP}`);
      return list.slice(0, WAVE_ENEMY_CAP);
    }
    return list;
  }
  function queueSpawn(type, tier, at) {
    const side = simRandom() < 0.5 ? -1 : 1;
    pendingSpawns.push({ type, tier, at, x: side < 0 ? 40 : W - 40, y: 120 });
  }
  function startWave(n) {
    game.wave = n;
    game.waveState = "active";
    const now = simNow();
    const tier = waveTier(n);
    if (n % 5 === 0) {
      game.fightAt = now;
      spawnBoss(now, { tier });
      const adds = Math.min(4, 1 + Math.floor(n / 10));
      for (let i = 0; i < adds; i++) queueSpawn("swordsman", tier, now + 500 + i * 500);
      setBanner(`WAVE ${n} \u2014 BOSS`, "#ffd166", 1600);
    } else {
      let t = now + 300;
      for (const type of waveComposition(n)) {
        queueSpawn(type, tier, t);
        t += rand(160, 340);
      }
      setBanner(`WAVE ${n}`, "#e8d5ff", 1200);
    }
    sfx.roundWin?.();
  }
  function updateWaveMode(now) {
    if (game.mode !== "wave" || game.state !== "PLAY") return;
    if (pendingSpawns.length) {
      pendingSpawns = pendingSpawns.filter((s) => {
        if (now < s.at) return true;
        spawnEnemy(s.type, s.x, s.y, s.tier);
        return false;
      });
    }
    if (game.waveState === "active") {
      if (!pendingSpawns.length && enemies.size === 0 && !game.boss) {
        game.waveState = "intermission";
        game.intermissionAt = now + 3200;
        for (const p of players) if (!p.alive) spawnPlayer(p, spawnPointFor(p));
        spawnTome(now);
        spawnTome(now);
        setBanner(`WAVE ${game.wave} CLEARED`, "#7bd88f", 1600);
        sfx.victory?.();
      }
    } else if (game.waveState === "intermission" && now > game.intermissionAt) {
      startWave(game.wave + 1);
    }
  }
  function startRun() {
    game.mode = "wave";
    clearReplay();
    resetMatchStats();
    resetMatchTelemetry();
    game.totalRounds = 0;
    game.wave = 0;
    game.winner = null;
    game.boss = null;
    clearEnemies();
    const idx = MAPS.findIndex((m) => !m.cozy && (m.gravity ?? 2) > 0);
    loadMap(idx >= 0 ? idx : 0);
    for (const p of players) {
      clearSpells(p);
      despawnPlayer(p);
      spawnPlayer(p, spawnPointFor(p));
    }
    game.state = "PLAY";
    game.fightAt = simNow() + 900;
    game.fightShown = false;
    game.bestWave = +(storage.getItem("hs-best-wave") || 0);
    scheduleTomes(simNow());
    startWave(1);
  }
  function endRun() {
    const reached = game.wave;
    game.runScore = reached;
    if (reached > (game.bestWave || 0)) {
      game.bestWave = reached;
      storage.setItem("hs-best-wave", String(reached));
    }
    game.state = "RUN_OVER";
    game.winner = null;
    clearEnemies();
    game.boss = null;
    setBanner(`OVERRUN \u2014 REACHED WAVE ${reached}`, "#ff6b6b", 2400);
    sfx.death?.();
    slowMo(0.3, 1e3);
  }
  onWorldReset(() => {
    pendingSpawns = [];
  });

  // src/sim/match.js
  var game = { state: "LOBBY", winsNeeded: 5, winner: null, mapIndex: 0, baseGravity: 2, mode: "versus", wave: 0, waveState: "active" };
  function minPlayers() {
    return game.mode === "wave" ? 1 : 2;
  }
  var currentMap = null;
  function setCurrentMap(m) {
    currentMap = m;
  }
  var banner = "";
  var bannerColor = "#fff";
  var bannerUntil = 0;
  var bannerHyper = false;
  function setBanner(...a) {
    emit("setBanner", ...a);
    const [text, color, ms = 1400, hyper = false] = a;
    banner = text;
    bannerColor = color;
    bannerUntil = simNow() + ms;
    bannerHyper = hyper;
  }
  function loadMap(index) {
    for (const fb of projectiles) removeBody(fb);
    projectiles.clear();
    for (const g of gibs) removeBody(g);
    gibs.clear();
    for (const t of tomes) removeBody(t);
    tomes.clear();
    for (const h of hats) removeBody(h);
    hats.clear();
    for (const s of summons) removeBody(s);
    summons.clear();
    for (const e of activeEffects) e.onAbandon?.();
    activeEffects.length = 0;
    clearParticles();
    pairCooldown.clear();
    if (currentMap) removeBody(currentMap.composite);
    const def = MAPS[index];
    const m = { def, composite: createComposite(), data: {} };
    for (const x of [-30, W + 30]) {
      const wall = createBox(x, H / 2, 60, H * 3, { isStatic: true });
      wall.render.fillStyle = "#171221";
      addTo(m.composite, wall);
    }
    def.build(m);
    game.mapSeed = simRandom() * 4294967295 >>> 0;
    m.data.seed = game.mapSeed;
    buildMapExtras(m, game.mapSeed);
    reseed(game.mapSeed ^ 2654435769);
    if (def.stars) {
      m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
    }
    addBody(m.composite);
    currentMap = m;
    game.mapIndex = index;
    game.baseGravity = def.gravity ?? 2;
    clearModifiers();
    setBase(game.baseGravity);
    game.envEvent = null;
    game.boss = null;
  }
  function startRound(index) {
    cancelTag("round");
    clearReplay();
    if (game.state === "LOBBY") {
      resetMatchStats();
      resetMatchTelemetry();
    }
    game.totalRounds = (game.totalRounds || 0) + 1;
    resetTelemetry();
    const bossTime = game.totalRounds % BOSS_EVERY === 0;
    let tries = 0;
    while (bossTime && MAPS[index].cozy && ++tries < 60) index = Math.floor(simRandom() * MAPS.length);
    loadMap(index);
    for (const p of players) {
      clearSpells(p);
      despawnPlayer(p);
    }
    for (const p of players) spawnPlayer(p, spawnPointFor(p));
    dealStartingSpells();
    game.lastDamageAt = simNow();
    game.state = "PLAY";
    game.fightAt = simNow() + 1100;
    game.fightShown = false;
    scheduleTomes(simNow());
    if (bossTime) spawnBoss(simNow());
    else rollEnvEvent(simNow());
    setBanner(bossTime ? "BOSS BATTLE" : currentMap.def.name, bossTime ? "#ffd166" : "#e8d5ff", 1e3);
  }
  game.onDeath = (p) => {
    if (game.state === "LOBBY") {
      scheduleIn(1200, () => {
        if (game.state === "LOBBY" && !p.alive) spawnPlayer(p, spawnPointFor(p));
      }, "lobby-respawn");
      return;
    }
    if (game.state !== "PLAY") return;
    scheduleIn(650, checkRoundEnd, "round");
  };
  function checkRoundEnd() {
    if (game.state !== "PLAY") return;
    const alive = players.filter((p) => p.alive);
    if (game.mode === "wave") {
      if (alive.length === 0) endRun();
      return;
    }
    if (game.boss) {
      if (alive.length > 0) return;
      game.state = "ROUND_END";
      game.winner = null;
      flushRoundTelemetry();
      const replayMs2 = startReplay(simNow());
      for (const p of players) p.roundWins = 0;
      setBanner(`${game.boss.def.name} PREVAILS \u2014 START OVER`, game.boss.def.color, 1800 + replayMs2);
      sfx.death();
      slowMo(0.3, 900);
      scheduleIn(1900 + replayMs2, () => {
        if (game.state === "ROUND_END") startRound(nextMapIndex());
      }, "round");
      return;
    }
    if (alive.length > 1) return;
    const winner = alive[0] || null;
    game.state = "ROUND_END";
    game.winner = winner;
    flushRoundTelemetry();
    const replayMs = startReplay(simNow());
    if (winner) {
      winner.roundWins++;
      setBanner(`${winner.name} +1`, winner.color, 1800 + replayMs);
    } else {
      setBanner("DRAW", "#e8d5ff", 1800 + replayMs);
    }
    sfx.roundWin();
    slowMo(0.3, 900);
    scheduleIn(1900 + replayMs, () => {
      if (game.state !== "ROUND_END") return;
      if (winner && winner.roundWins >= game.winsNeeded) startVictory(winner);
      else startRound(nextMapIndex());
    }, "round");
  }
  function nextMapIndex() {
    const crowded = players.length >= 6;
    let i, tries = 0;
    do {
      i = Math.floor(simRandom() * MAPS.length);
    } while ((i === game.mapIndex || crowded && MAPS[i].cozy) && ++tries < 60);
    return i;
  }
  function startVictory(p) {
    game.state = "VICTORY";
    game.winner = p;
    game.awards = computeAwards();
    game.spellReport = computeSpellReport();
    sfx.victory();
    doFlash(p.color, 0.4);
  }
  function resetMatch() {
    cancelTag("round");
    clearReplay();
    for (const p of players) p.roundWins = 0;
    game.state = "LOBBY";
    loadMap(0);
    for (const p of players) {
      despawnPlayer(p);
      spawnPlayer(p, spawnPointFor(p));
    }
    setBanner("LOBBY", "#e8d5ff", 900);
  }
  function setWins(n) {
    game.winsNeeded = Math.max(1, Math.min(20, n));
    setBanner(`FIRST TO ${game.winsNeeded}`, "#e8d5ff", 900);
  }
  function beginFromLobby() {
    if (game.state !== "LOBBY" || players.length < minPlayers()) return;
    if (game.mode === "wave") startRun();
    else startRound(game.mapIndex);
  }
  function toggleMode() {
    if (game.state !== "LOBBY") return;
    game.mode = game.mode === "wave" ? "versus" : "wave";
    setBanner(game.mode === "wave" ? "WAVE SURVIVAL" : "VERSUS", "#ffd166", 1100);
  }
  function joinPlayer(controller, name) {
    if (players.length >= MAX_PLAYERS) return;
    let slot = 0;
    while (players.some((p2) => p2.slot === slot)) slot++;
    const p = createPlayer(slot, controller);
    if (name) p.name = name;
    spawnPlayer(p, spawnPointFor(p));
    sfx.pickup();
    setBanner(`${p.name} JOINED`, p.color, 900);
  }
  var INITIAL_GAME = { state: "LOBBY", winsNeeded: 5, winner: null, mapIndex: 0, baseGravity: 2, mode: "versus", wave: 0, waveState: "active" };
  onWorldReset(() => {
    for (const k of Object.keys(game)) if (k !== "onDeath") delete game[k];
    Object.assign(game, INITIAL_GAME);
    currentMap = null;
    banner = "";
    bannerColor = "#fff";
    bannerUntil = 0;
    bannerHyper = false;
  });

  // src/sim/maps/reach.js
  var REACH_CELL = 16;
  var REACH_PAD = 15;
  var REACH_CLIMB = 21;
  var REACH_SHARE = 0.35;
  function buildReach(m) {
    const cols = Math.ceil(W / REACH_CELL), rows = Math.ceil(H / REACH_CELL);
    const n = cols * rows;
    const solid = new Uint8Array(n), firm = new Uint8Array(n);
    for (const b of allBodies(m.composite)) {
      if (!b.isStatic && b.label !== "plank" || b.isSensor || b.collisionFilter.mask === 0 || b.label === "lava") continue;
      const solidOnly = !!b.rope || b.label === "destructible";
      const x0 = Math.max(0, Math.floor((b.bounds.min.x - REACH_PAD) / REACH_CELL));
      const x1 = Math.min(cols - 1, Math.floor((b.bounds.max.x + REACH_PAD) / REACH_CELL));
      const y0 = Math.max(0, Math.floor((b.bounds.min.y - REACH_PAD) / REACH_CELL));
      const y1 = Math.min(rows - 1, Math.floor((b.bounds.max.y + REACH_PAD) / REACH_CELL));
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const i = cy * cols + cx;
          if (solid[i] && (solidOnly || firm[i])) continue;
          const x = cx * REACH_CELL + REACH_CELL / 2, y = cy * REACH_CELL + REACH_CELL / 2;
          if (pointInBody(b, { x, y }) || pointInBody(b, { x: x - REACH_PAD, y }) || pointInBody(b, { x: x + REACH_PAD, y }) || pointInBody(b, { x, y: y - REACH_PAD }) || pointInBody(b, { x, y: y + REACH_PAD })) {
            solid[i] = 1;
            if (!solidOnly) firm[i] = 1;
          }
        }
      }
    }
    const gdir = (m.def.gravity ?? 2) < 0 ? -1 : 1;
    const deadFrom = gdir > 0 ? (m.data.lavaY ?? H + 40) - 8 : null;
    const pass = new Uint8Array(n), stand = new Uint8Array(n), footing = new Uint8Array(n);
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const i = cy * cols + cx;
        if (solid[i]) continue;
        if (deadFrom != null && (cy + 1) * REACH_CELL > deadFrom) continue;
        const head = i - gdir * cols;
        if (head < 0 || head >= n || solid[head]) continue;
        pass[i] = 1;
        const foot = i + gdir * cols;
        if (foot < 0 || foot >= n) continue;
        if (solid[foot]) stand[i] = 1;
        if (firm[foot]) footing[i] = 1;
      }
    }
    return { cols, rows, solid, pass, stand, footing, gdir, wrap: !!m.def.wrap, escape: /* @__PURE__ */ new Map() };
  }
  function reachFrom(g, start) {
    const { cols, pass, stand, gdir, wrap } = g;
    const best = new Int16Array(pass.length).fill(-1);
    best[start] = REACH_CLIMB;
    const stack = [start];
    while (stack.length) {
      const i = stack.pop();
      const b = best[i];
      const cx = i % cols, cy = (i - cx) / cols;
      const step = (ni, nb) => {
        if (nb < 0 || ni < 0 || ni >= pass.length || !pass[ni]) return;
        const v = stand[ni] ? REACH_CLIMB : nb;
        if (v <= best[ni]) return;
        best[ni] = v;
        stack.push(ni);
      };
      step(i + gdir * cols, b);
      step(i - gdir * cols, b - 1);
      const air = stand[i] ? b : b - 1;
      if (cx > 0) step(i - 1, air);
      else if (wrap) step(cy * cols + cols - 1, air);
      if (cx < cols - 1) step(i + 1, air);
      else if (wrap) step(cy * cols, air);
    }
    return best;
  }
  function reachCount(g, best) {
    let n = 0;
    for (let i = 0; i < best.length; i++) if (best[i] >= 0 && g.stand[i]) n++;
    return n;
  }
  function reachLanding(g, x, y) {
    const { cols, rows, pass, stand, gdir } = g;
    const cx = Math.max(0, Math.min(cols - 1, Math.floor(x / REACH_CELL)));
    const cy = Math.max(0, Math.min(rows - 1, Math.floor(y / REACH_CELL)));
    let i = cy * cols + cx;
    if (!pass[i]) return -1;
    for (let t = 0; t < rows; t++) {
      if (stand[i]) return i;
      const next2 = i + gdir * cols;
      if (next2 < 0 || next2 >= pass.length || !pass[next2]) return -1;
      i = next2;
    }
    return -1;
  }
  function reachEscape(g, land) {
    let k = land;
    while (k % g.cols > 0 && g.stand[k - 1]) k--;
    let n = g.escape.get(k);
    if (n == null) {
      n = reachCount(g, reachFrom(g, k));
      g.escape.set(k, n);
    }
    return n;
  }
  function reachInfo(m) {
    if (m.data.reach) return m.data.reach;
    const g = buildReach(m);
    const seeds = m.def.spawns.map((s) => reachLanding(g, s.x, s.y));
    for (let cx = 2; cx < g.cols; cx += 5) {
      for (let cy = 0; cy < g.rows; cy++) {
        const i = cy * g.cols + cx;
        if (g.stand[i]) {
          seeds.push(i);
          break;
        }
      }
    }
    g.arenaN = 1;
    for (const i of seeds) if (i >= 0) g.arenaN = Math.max(g.arenaN, reachEscape(g, i));
    m.data.reach = g;
    return g;
  }
  function reachLandable(g, i) {
    const cx = i % g.cols;
    return !!g.footing[i] && cx > 0 && cx < g.cols - 1 && !!g.footing[i - 1] && !!g.footing[i + 1];
  }
  function cellEscapes(g, i) {
    return i >= 0 && reachEscape(g, i) >= g.arenaN * REACH_SHARE;
  }
  function reachSpots(g) {
    if (g.spots) return g.spots;
    g.spots = [];
    for (let i = 0; i < g.stand.length; i++) {
      const cx = i % g.cols;
      if (cx < 3 || cx > g.cols - 4) continue;
      if (!reachLandable(g, i)) continue;
      g.spots.push({ i, x: cx * REACH_CELL + REACH_CELL / 2, y: (i - cx) / g.cols * REACH_CELL + REACH_CELL / 2 });
    }
    return g.spots;
  }
  var DROP_LABELS = /* @__PURE__ */ new Set(["crate", "barrel", "ball"]);
  function dropColumnClear(m, x, y0, y1) {
    y1 += y1 >= y0 ? REACH_PAD : -REACH_PAD;
    const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    for (const b of allBodies(m.composite)) {
      if (b.isStatic || b.isSensor || !DROP_LABELS.has(b.label)) continue;
      if (b.bounds.max.x < x - 18 || b.bounds.min.x > x + 18) continue;
      if (b.bounds.max.y < lo || b.bounds.min.y > hi) continue;
      return false;
    }
    return true;
  }
  function arenaSpawnNear(m, x, y, busy = []) {
    const g = reachInfo(m);
    const cost = (s) => Math.abs(s.x - x) + Math.abs(s.y - y) * 0.35;
    const ranked = reachSpots(g).filter((s) => !busy.some((q) => Math.hypot(q.x - s.x, q.y - s.y) < 70)).sort((a, b) => cost(a) - cost(b));
    for (const needClear of [true, false]) {
      for (const s of ranked) {
        if (!cellEscapes(g, s.i)) continue;
        let lift = 0;
        while (lift < 8) {
          const above = s.i - g.gdir * g.cols * (lift + 1);
          if (above < 0 || above >= g.pass.length || !g.pass[above]) break;
          lift++;
        }
        const y0 = s.y - g.gdir * lift * REACH_CELL;
        if (needClear && !dropColumnClear(m, s.x, y0, s.y)) continue;
        return { x: s.x, y: y0 };
      }
    }
    return null;
  }
  var SPAWN_CLEAR2 = 70;
  function safeSpawnPoint(m, x, y, busy = []) {
    const g = reachInfo(m);
    const escapes = (i) => cellEscapes(g, i);
    const cellX = (i) => i % g.cols * REACH_CELL + REACH_CELL / 2;
    const clearOfBusy = (px) => !busy.some((q) => Math.abs(q.x - px) < SPAWN_CLEAR2);
    const sound = (i) => i >= 0 && reachLandable(g, i) && escapes(i) && dropColumnClear(m, cellX(i), y, (i - i % g.cols) / g.cols * REACH_CELL);
    const land = reachLanding(g, x, y);
    if (escapes(land)) {
      if (sound(land) && clearOfBusy(cellX(land))) return { x: cellX(land), y };
      for (let d = 1; d <= 11; d++) {
        for (const side of [-1, 1]) {
          const nx = x + side * d * REACH_CELL;
          if (nx < 40 || nx > W - 40) continue;
          const ni = reachLanding(g, nx, y);
          if (sound(ni) && clearOfBusy(cellX(ni))) return { x: cellX(ni), y };
        }
      }
    }
    return arenaSpawnNear(m, x, y, busy) || { x, y };
  }

  // src/sim/player/lifecycle.js
  var MAX_PLAYERS = 8;
  var FALL_SAFE_DROP = 440;
  var PLAYER_DEFS = [
    { name: "P1", color: "#4ecdc4", hat: "#2a9d94" },
    { name: "P2", color: "#ff6b81", hat: "#c44558" },
    { name: "P3", color: "#ffd166", hat: "#d4a52f" },
    { name: "P4", color: "#a55eea", hat: "#7d3fc4" },
    { name: "P5", color: "#ff9f43", hat: "#c67a2e" },
    { name: "P6", color: "#9acd32", hat: "#6b9023" },
    { name: "P7", color: "#e8e8f0", hat: "#a8a8c0" },
    { name: "P8", color: "#7f9cf5", hat: "#5a6fc2" }
  ];
  function spawnPointFor(p) {
    const spawns = currentMap.def.spawns;
    const base2 = spawns[p.slot % spawns.length];
    const jitter = p.slot >= spawns.length ? (p.slot - spawns.length + 1) * 26 * (p.slot % 2 ? 1 : -1) : 0;
    const busy = players.filter((q) => q !== p && q.alive && q.body).map((q) => ({ x: q.body.position.x, y: q.body.position.y }));
    return safeSpawnPoint(currentMap, Math.max(40, Math.min(W - 40, base2.x + jitter)), base2.y, busy);
  }
  var players = [];
  var gibs = /* @__PURE__ */ new Set();
  var MAX_HP = 150;
  function createPlayer(slot, controller) {
    const def = PLAYER_DEFS[slot];
    const p = {
      ...def,
      slot,
      controller,
      group: newCollisionGroup(),
      roundWins: 0,
      hp: MAX_HP,
      alive: false,
      facing: slot % 2 === 0 ? 1 : -1,
      walkPhase: 0,
      lastGround: 0,
      airJumps: 1,
      sizeScale: 1,
      megaCasts: 0,
      megaUntil: 0,
      frozenUntil: 0,
      wasFrozen: false,
      input: { ...IDLE_INPUT },
      // two spell slots (A, B), each with its own last-cast time; lastCastSlot is
      // the one most recently fired (drives the spellId/lastCast accessors below)
      slots: [null, null],
      casts: [0, 0],
      slotFilledAt: [0, 0],
      lastCastSlot: 0,
      slotCharges: [null, null]
      // hybrid fusion charges; null = a normal, limitless spell
    };
    Object.defineProperties(p, {
      spellId: {
        enumerable: true,
        configurable: true,
        get() {
          return p.slots[p.lastCastSlot] ?? p.slots[0] ?? p.slots[1] ?? null;
        },
        set(v) {
          if (v == null) {
            p.slots[0] = p.slots[1] = null;
            p.slotCharges[0] = p.slotCharges[1] = null;
          } else {
            p.slots[0] = v;
            p.slotCharges[0] = null;
          }
        }
      },
      lastCast: {
        enumerable: true,
        configurable: true,
        get() {
          return p.casts[p.lastCastSlot] ?? 0;
        },
        set(v) {
          p.casts[p.lastCastSlot] = v;
        }
      }
    });
    p.body = createCircle(0, -100, 15, {
      density: 4e-3,
      friction: 0.05,
      frictionAir: 0.02,
      restitution: 0.2,
      label: "player",
      collisionFilter: { group: p.group }
    });
    p.body.player = p;
    players.push(p);
    return p;
  }
  function setPlayerScale(p, target) {
    const ratio = target / p.sizeScale;
    if (Math.abs(ratio - 1) < 0.01) return;
    scaleBody(p.body, ratio, ratio);
    p.sizeScale = target;
    spawnParticles(p.body.position.x, p.body.position.y, "#e8d5ff", 6, 3);
  }
  function spawnPlayer(p, pos) {
    if (!p.alive) addBody(p.body);
    p.alive = true;
    p.hp = MAX_HP;
    p.airJumps = 1;
    p.fallPeak = 0;
    p.gravityLockUntil = 0;
    p.ghost = null;
    p.lastHitBy = null;
    clearStatuses(p);
    setPlayerScale(p, 1);
    setFrictionAir(p.body, BASE_FRICTION_AIR);
    setPosition(p.body, pos);
    setVelocity(p.body, { x: 0, y: 0 });
    setAngularVelocity(p.body, 0);
    setAngle(p.body, 0);
    spawnParticles(pos.x, pos.y, "#e8d5ff", 12, 5);
  }
  function despawnPlayer(p) {
    if (!p.alive) return;
    removeBody(p.body);
    p.alive = false;
  }
  function healPlayer(p, amt) {
    if (!p.alive) return;
    p.hp = Math.min(MAX_HP, p.hp + amt);
    spawnText(p.body.position.x, p.body.position.y - 34, `+${Math.round(amt)}`, "#7bd88f");
  }
  function addSpell(p, id) {
    const now = simNow();
    const locked = (s) => p.slots[s] != null && p.slotCharges[s] > 0;
    let i = p.slots[0] == null ? 0 : p.slots[1] == null ? 1 : p.slotFilledAt[0] <= p.slotFilledAt[1] ? 0 : 1;
    if (locked(i)) i = 1 - i;
    if (locked(i)) {
      spawnText(p.body.position.x, p.body.position.y - 48, "HANDS FULL!", "#ff4df0");
      return -1;
    }
    p.slots[i] = id;
    p.casts[i] = 0;
    p.slotCharges[i] = null;
    p.slotFilledAt[i] = now;
    return i;
  }
  function disarmPlayer(q) {
    q.slots[0] = q.slots[1] = null;
    q.slotCharges[0] = q.slotCharges[1] = null;
    q.casts[0] = q.casts[1] = 0;
    q.slotFilledAt[0] = q.slotFilledAt[1] = 0;
  }
  function clearSpells(p) {
    p.slots[0] = p.slots[1] = null;
    p.casts[0] = p.casts[1] = 0;
    p.slotCharges[0] = p.slotCharges[1] = null;
    p.slotFilledAt[0] = p.slotFilledAt[1] = 0;
    p.lastCastSlot = 0;
  }
  onWorldReset(() => {
    players.length = 0;
    gibs.clear();
  });

  // src/sim/awards.js
  var matchStats = {};
  var killFeedLines = [];
  function statFor(p) {
    return matchStats[p.slot] ??= {
      kills: 0,
      deaths: 0,
      selfKills: 0,
      hatsLost: 0,
      procs: 0,
      fallDmg: 0,
      slips: 0,
      bossDmg: 0,
      tomes: 0
    };
  }
  function resetMatchStats() {
    for (const k of Object.keys(matchStats)) delete matchStats[k];
    killFeedLines.length = 0;
  }
  function addKillFeed(...a) {
    emit("addKillFeed", ...a);
    const [aName, aColor, bName, bColor, self] = a;
    killFeedLines.push({ a: aName, ac: aColor, b: bName, bc: bColor, self, at: simNow() });
    if (killFeedLines.length > 5) killFeedLines.shift();
  }
  function creditKill(victim) {
    statFor(victim).deaths++;
    telDeath(victim.spellId);
    const hit = victim.lastHitBy;
    const killer = hit && simNow() - hit.at < 4e3 ? hit.player : null;
    if (killer === victim) {
      statFor(victim).selfKills++;
      addKillFeed(victim.name, victim.color, null, null, true, victim.slot, victim.slot);
    } else if (killer) {
      statFor(killer).kills++;
      telKill(killer.spellId);
      addKillFeed(killer.name, killer.color, victim.name, victim.color, false, killer.slot, victim.slot);
    } else {
      addKillFeed(null, null, victim.name, victim.color, false, null, victim.slot);
    }
  }
  function computeAwards() {
    const AWARD_DEFS = [
      ["MOST SHAMED", "hatsLost", "hats lost"],
      ["MOST DANGEROUS", "kills", "kills"],
      ["SELF-OWN CHAMPION", "selfKills", "self-KOs"],
      ["GRAVITY'S FAVORITE", "fallDmg", "fall damage"],
      ["HYPER LUCKY", "procs", "HYPERSPELLs"],
      ["BANANA MAGNET", "slips", "slips"],
      ["TOME GOBLIN", "tomes", "tomes grabbed"],
      ["BOSSBANE", "bossDmg", "boss damage"]
    ];
    const out = [];
    for (const [title, key, unit] of AWARD_DEFS) {
      let best = null, bestV = 0;
      for (const p of players) {
        const v = statFor(p)[key];
        if (v > bestV) {
          bestV = v;
          best = p;
        }
      }
      if (best) out.push({ t: title, n: best.name, c: best.color, v: `${Math.round(bestV)} ${unit}` });
    }
    return out.slice(0, 5);
  }
  onWorldReset(() => {
    for (const k of Object.keys(matchStats)) delete matchStats[k];
    killFeedLines.length = 0;
  });

  // src/sim/player/combat.js
  function damagePlayer(p, amt, src) {
    if (!p || !p.alive) return;
    const now = simNow();
    if (now < (p.invulnUntil || 0)) {
      spawnText(p.body.position.x, p.body.position.y - 34, "BLOCKED", "#e8d5ff");
      return;
    }
    if (src && src.slot !== void 0) p.lastHitBy = { player: src, at: now };
    game.lastDamageAt = now;
    let n = Math.round(amt);
    if (n <= 0) return;
    if (now < (p.frozenUntil || 0) && n >= 8) {
      n += Math.max(8, Math.round(n * 0.6));
      p.frozenUntil = 0;
      spawnText(p.body.position.x, p.body.position.y - 48, "SHATTER!", "#bfe8ff");
      spawnParticles(p.body.position.x, p.body.position.y, "#bfe8ff", 16, 6);
      sfx.freeze?.();
    }
    if (src && src.spellId) telDmg(src.spellId, n);
    const hadHat = p.hp >= MAX_HP * 0.5;
    p.hp -= n;
    p.hurtUntil = now + 130;
    if (p.hp <= 0) killPlayer(p);
    else {
      spawnText(p.body.position.x, p.body.position.y - 34, `-${n}`, "#ffffff");
      if (hadHat && p.hp < MAX_HP * 0.5) knockHatOff(p);
    }
  }
  function knockHatOff(p) {
    const { x, y } = p.body.position;
    const s = p.sizeScale || 1;
    const hat = createPolygon(x, y - 22 * s, 3, 8, { density: 8e-4, frictionAir: 0.02, angle: -Math.PI / 2, label: "gib" });
    hat.color = p.hat;
    hat.dieAt = simNow() + 3500;
    setVelocity(hat, { x: p.body.velocity.x * 0.5 + rand(-3, 3), y: -7 * (gravityY() < 0 ? -1 : 1) });
    setAngularVelocity(hat, rand(-0.4, 0.4));
    gibs.add(hat);
    addBody(hat);
    statFor(p).hatsLost++;
    spawnText(x, y - 52 * s, "THE SHAME!", p.hat);
    sfx.squeak();
  }
  function killPlayer(p) {
    if (!p.alive) return;
    p.alive = false;
    const { x, y } = p.body.position;
    spawnParticles(x, y, p.color, 24, 8, 60);
    addShake(10);
    sfx.death();
    doFlash(p.color, 0.12);
    if (game.state === "PLAY") slowMo(0.3, 550);
    for (let i = 0; i < 6; i++) {
      const gib = createBox(x, y, 14, 4, { density: 1e-3, frictionAir: 0.01, label: "gib" });
      gib.color = p.color;
      gib.dieAt = simNow() + 3e3;
      setVelocity(gib, { x: (simRandom() - 0.5) * 16, y: -6 - simRandom() * 8 });
      setAngularVelocity(gib, (simRandom() - 0.5) * 0.6);
      gibs.add(gib);
      addBody(gib);
    }
    removeBody(p.body);
    if (game.state === "PLAY") {
      creditKill(p);
      p.ghost = { x, y: y - 10, nextGust: 0 };
    }
    game.onDeath(p);
  }

  // src/sim/spells/starters.js
  var STARTERS = {
    fireball: {
      name: "Fireball",
      color: "#ffb347",
      cooldown: 450,
      cast(p) {
        const m = p.mega || 1;
        const fb = shoot(p, { r: 7 * m, speed: 20, vy: -6, color: "#ffb347", gravityScale: 0.45 });
        fb.onHit = () => explode(fb.position.x, fb.position.y, 150 * m, 22 * m, 35 * m, fb.owner);
        addVelocity(p.body, { x: -p.facing * 2, y: 0 });
      }
    },
    gust: {
      name: "Gust",
      color: "#d7f5ef",
      cooldown: 700,
      cast(p) {
        const m = p.mega || 1;
        const range = 240 * m;
        const { x, y } = p.body.position;
        const dir = aimDir(p, 1, 0);
        for (const b of queryRadius({ x, y }, range, { filter: (b2) => loose(b2) && b2 !== p.body })) {
          const dx = b.position.x - x, dy = b.position.y - y;
          const d = Math.hypot(dx, dy);
          if (d === 0) continue;
          if ((dx * dir.x + dy * dir.y) / d < 0.55) continue;
          const s = 1 - d / range;
          if (b.label === "projectile") {
            const spd = Math.hypot(b.velocity.x, b.velocity.y);
            setVelocity(b, { x: dir.x * spd, y: dir.y * spd });
            continue;
          }
          setVelocity(b, { x: b.velocity.x + dir.x * 18 * m * s, y: b.velocity.y + dir.y * 18 * m * s - 3 * s });
        }
        setVelocity(p.body, { x: p.body.velocity.x - dir.x * 7, y: p.body.velocity.y - dir.y * 4 - 2 });
        for (let i = 0; i < 14; i++) {
          spawnParticle({ kind: "spark", x: x + dir.x * 20, y: y - 6 + dir.y * 20 + rand(-10, 10), vx: dir.x * rand(6, 14), vy: dir.y * rand(6, 14) + rand(-1, 1), life: 18, maxLife: 18, color: "#d7f5ef", r: 2 });
        }
      }
    },
    lightning: {
      name: "Lightning",
      color: "#fff89e",
      cooldown: 900,
      beam: true,
      cast(p) {
        const m = p.mega || 1;
        const { hit, pt, from, dir } = raycastHit(p);
        sfx.lightning();
        doFlash("#ffffff", 0.35);
        slowMo(0.05, 70);
        addShake(6);
        boltVisual(from.x, from.y, pt.x, pt.y, "#fff89e", 3 * m);
        spawnParticles(pt.x, pt.y, "#fff89e", 12, 6);
        if (hit && !hit.isStatic) {
          setVelocity(hit, { x: hit.velocity.x + dir.x * 28 * m, y: hit.velocity.y + dir.y * 28 * m - 8 * m });
          if (hit.label === "player") damagePlayer(hit.player, 50 * m);
        }
      }
    },
    frost: {
      name: "Frost",
      color: "#9be7ff",
      cooldown: 1100,
      cast(p) {
        const m = p.mega || 1;
        const fb = shoot(p, { r: 6 * m, speed: 17, vy: -4, color: "#9be7ff", gravityScale: 0.5 });
        fb.onHit = (self, other) => {
          spawnParticles(self.position.x, self.position.y, "#9be7ff", 10, 4);
          if (other && other.label === "player" && other.player.alive) {
            damagePlayer(other.player, 15 * m);
            applyFreeze(other.player, simNow() + 1500 * m);
            sfx.freeze();
          }
        };
      }
    },
    blackhole: {
      name: "Black Hole",
      color: "#a55eea",
      cooldown: 4e3,
      cast(p) {
        const m = p.mega || 1;
        const fb = shoot(p, { r: 10 * m, speed: 9, vy: -2, color: "#a55eea", restitution: 0.2, expireMs: 1600, gravityScale: 0.4 });
        fb.onHit = () => spawnSingularity(fb.position.x, fb.position.y, m, p);
      }
    },
    meteor: {
      name: "Meteor Storm",
      color: "#ff8c5a",
      cooldown: 5e3,
      cast(p) {
        const m = p.mega || 1;
        const cx = Math.max(120, Math.min(W - 120, p.body.position.x + p.facing * 300));
        const t0 = simNow();
        const times = Array.from({ length: Math.round(7 * m) }, (_, i) => t0 + i * 170 + rand(0, 80));
        let spawned = 0;
        activeEffects.push({
          until: t0 + 1600 + (times.length - 7) * 170,
          update(now) {
            while (spawned < times.length && now > times[spawned]) {
              spawned++;
              const rock = dropProjectile(p, cx + rand(-260, 260), -50, { r: 13, vy: 18, vx: rand(-2, 2), color: "#ff8c5a", density: 6e-3 });
              rock.onHit = () => explode(rock.position.x, rock.position.y, 90 * m, 14 * m, 28 * m, p);
            }
          }
        });
      }
    }
  };

  // src/sim/spells/cast-kind.js
  var CAST_OVERRIDES = {
    chain: "ray",
    // draws bolt visuals rather than a ray, but it is hitscan
    boomerang: "bolt",
    // comes back to you; on the way out it is still a thrown bolt
    gust: "nova",
    // a cone off your own hands, not an aimed projectile
    shove: "nova",
    // a short shunt at contact range; nothing leaves your hands
    // --- this branch ---
    teslacoil: "place",
    // boltVisual zaps are the payload; the static coil you leave behind is the spell
    beehive: "place",
    // shoot() sends the bees, but what you cast is a hive at a spot
    midas: "ray",
    // nearestEnemy(p, 320) + freeze: instant, at range, no travel time.
    // A `nearestEnemy` RULE is not available — Homing Wisp calls it
    // every tick in its update and is the most ordinary bolt there is.
    soulharvest: "nova",
    // drains every enemy within 420px of you; the tethers are cosmetic
    voodoo: "nova",
    // same shape at 440px
    boobytrap: "place"
    // arms a charge at the nearest enemy's feet — placed, not thrown
  };
  var CAST_RULES = [
    // a body constructed above the top of the screen, or far above its target, is
    // being dropped — this is what separates Anvil and Rain of Frogs (drop) from
    // Black Cat and Rubber Duck (place), all four of which are summons
    // Two guards here are load-bearing, both learned the hard way:
    //   [^A-Za-z]y:  — a bare /y:\s*-\d/ also matches the `vy: -6` in every
    //                  ordinary shoot() call, which called half the game rain
    //   -\d{2,}      — spawn heights are -30 and up; single digits are impulses
    // (setVelocity is stripped from the source before this runs, for the same reason)
    // the body-constructor alternation is spelled out in full rather than as
    // `create(?:Box|…)` because test/no-undefined-identifiers.test.js reads the
    // shape `name(` as a call and does not strip regex literals — the short form
    // makes this file look like it calls an undeclared create()
    ["drop", /dropProjectile|skyBolt|(?:createBox|createCircle|createPolygon)\s*\([^,]*,\s*-\d|[^A-Za-z]y:\s*-\d{2,}|position\.y\s*-\s*(?:2[0-9]{2}|[3-9][0-9]{2})/],
    ["ray", /zapRay|raycastHit|boltVisual/],
    ["bolt", /boomBolt|statusBolt|shoot\s*\(/],
    // makeZone is this branch's verb for "a patch of ground that does something".
    // Only an EXPLICITLY positioned one is a placement — `makeZone({ x: pos.x`,
    // where pos came from frontPos (Blizzard, Flame Wall). A zone opened with
    // shorthand `{ x, y,` is centred on whatever the caster already is, and that
    // is a nova; see the clause below. (Napalm also opens a shorthand zone, at
    // its fireball's impact point, but the bolt rule above claims it first — it
    // is a thrown bolt that happens to leave a fire behind.)
    ["place", /summonCritter|summon\s*\(|makeZone\s*\(\s*\{\s*x:/],
    // allBodies() is the whole-world shape: if a spell moves every body there is,
    // there is nothing to aim at. Likewise a zone centred on you (Repulsor Field).
    ["nova", /enemiesOf\s*\(\s*p\s*\)|explode\s*\(\s*p\.body\.position|allBodies\s*\(|makeZone\s*\(\s*\{\s*x,/],
    // pushGravity changes the world you both stand in; healPlayer(p) changes you
    ["self", /p\.\w+Until\s*=|pushGravity\s*\(|healPlayer\s*\(\s*p\b/]
  ];
  function classifyCast(id, def, rules = CAST_RULES) {
    if (CAST_OVERRIDES[id]) return CAST_OVERRIDES[id];
    if (def.beam) return "ray";
    if (def.selfMove) return "self";
    const src = (typeof def.cast === "function" ? String(def.cast) : "").replace(/(?:set|add)Velocity\s*\([^)]*\)/g, "");
    for (const [kind, re] of rules) if (re.test(src)) return kind;
    return "bolt";
  }
  function castKind(id) {
    const def = id && SPELLS[id];
    if (!def) return null;
    if (!def._cast) def._cast = classifyCast(id, def);
    return def._cast;
  }
  function classifyAllCasts() {
    const out = {};
    for (const id of Object.keys(SPELLS)) out[id] = castKind(id);
    return out;
  }

  // src/sim/maps/book.js
  var DEF_SPAWNS = [
    { x: 140, y: 120 },
    { x: W - 140, y: 120 },
    { x: 440, y: 120 },
    { x: W - 440, y: 120 },
    { x: W / 2, y: 120 },
    { x: 290, y: 120 },
    { x: W - 290, y: 120 },
    { x: 540, y: 120 }
  ];
  function theme(tname, defaults, variants) {
    for (const v of variants) {
      defineMap({
        name: `${tname} \xB7 ${v.n}`.toUpperCase(),
        bg: v.bg ?? defaults.bg,
        icy: v.icy ?? defaults.icy,
        muddy: v.muddy ?? defaults.muddy,
        gravity: v.gravity ?? defaults.gravity,
        wrap: v.wrap,
        stars: v.stars ?? defaults.stars,
        spawns: v.s ?? defaults.s ?? DEF_SPAWNS,
        cozy: v.cozy,
        // too tight for big lobbies; skipped when 6+ wizards fight
        cover: v.cover ?? defaults.cover,
        // themed destructible cover kind (maps.js addThemedCover)
        build: v.b,
        update: v.u
      });
    }
  }
  theme("Box Land", { bg: "#28211a", cover: "crate" }, [
    { n: "Crate Mountain", b(m) {
      addStatic(m, W / 2, 650, W, 50);
      buildCratePyramid(m, W / 2, 600, 8);
      addLava(m, H - 12);
    } },
    { n: "Twin Towers", b(m) {
      addStatic(m, 260, 620, 480, 44);
      addStatic(m, W - 260, 620, 480, 44);
      buildCrateStack(m, 260, 572, 3, 8);
      buildCrateStack(m, W - 260, 572, 3, 8);
      addLava(m);
    } },
    { n: "Crate Bridge", b(m) {
      addStatic(m, 180, 560, 360, 40);
      addStatic(m, W - 180, 560, 360, 40);
      for (let i = 0; i < 9; i++) {
        const c = createBox(400 + i * 55, 528, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody2(m, c, "#b08948");
      }
      addLava(m);
    } },
    { n: "Box Rain", b(m) {
      addStatic(m, W / 2, 640, W - 200, 44);
      addLava(m);
    }, u(m, now) {
      updateCrateRain(m, now, 30, 2200);
    } },
    { n: "The Wall", b(m) {
      addStatic(m, W / 2, 650, W, 50);
      buildCrateStack(m, W / 2, 600, 3, 10);
      addBarrels(m, [200, 260, W - 200, W - 260], 560);
      addLava(m, H - 12);
    } },
    { n: "Crate Steps", b(m) {
      for (let i = 0; i < 5; i++) {
        addStatic(m, 160 + i * 240, 640 - i * 80, 190, 34);
        buildCrateStack(m, 160 + i * 240, 604 - i * 80, 2, 2);
      }
      addLava(m);
    }, s: [{ x: 160, y: 120 }, { x: W - 160, y: 120 }, { x: 640, y: 120 }, { x: 880, y: 120 }] },
    { n: "Sandwich", b(m) {
      addStatic(m, W / 2, 650, W, 50);
      addStatic(m, 300, 400, 340, 30);
      addStatic(m, W - 300, 400, 340, 30);
      buildCrateStack(m, 300, 362, 4, 4);
      buildCrateStack(m, W - 300, 362, 4, 4);
      addLava(m, H - 12);
    } },
    { n: "Box Pit", cozy: true, b(m) {
      addStatic(m, 120, 500, 240, 400);
      addStatic(m, W - 120, 500, 240, 400);
      addStatic(m, W / 2, 680, W, 60);
      for (let i = 0; i < 24; i++) {
        const c = createBox(rand(300, W - 300), rand(350, 600), 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody2(m, c, "#b08948");
      }
    }, s: [{ x: 120, y: 240 }, { x: W - 120, y: 240 }, { x: 400, y: 120 }, { x: W - 400, y: 120 }] },
    { n: "Seesaw Storage", b(m) {
      addStatic(m, W / 2, 680, W, 50);
      addSeesaw(m, 320, 560, 240);
      addSeesaw(m, W / 2, 460, 240);
      addSeesaw(m, W - 320, 560, 240);
      buildCrateStack(m, W / 2, 640, 2, 2);
    } },
    { n: "Fort Knox", b(m) {
      addStatic(m, 230, 620, 460, 44);
      addStatic(m, W - 230, 620, 460, 44);
      buildCrateStack(m, 130, 572, 2, 5);
      buildCrateStack(m, 330, 572, 2, 5);
      buildCrateStack(m, W - 130, 572, 2, 5);
      buildCrateStack(m, W - 330, 572, 2, 5);
      addChandelier(m, W / 2, -10, 240, 34);
      addLava(m);
    } }
  ]);
  theme("Lava Works", { bg: "#2b1d22", cover: "rock" }, [
    { n: "Stepping Stones", b(m) {
      for (let i = 0; i < 6; i++) addStatic(m, 130 + i * 205, 560 + i % 2 * 60, 130, 30);
      addLava(m);
    }, s: [{ x: 130, y: 120 }, { x: W - 125, y: 120 }, { x: 540, y: 120 }, { x: 745, y: 120 }] },
    { n: "Geyser Alley", b(m) {
      addStatic(m, W / 2, 640, W - 160, 40);
      addLava(m);
      m.data.geysers = [{ x: 320, y: 620 }, { x: W / 2, y: 620 }, { x: W - 320, y: 620 }];
    }, u(m, now) {
      updateGeysers(m, now);
    } },
    { n: "The Cauldron", cozy: true, b(m) {
      addStatic(m, 110, 460, 220, 380);
      addStatic(m, W - 110, 460, 220, 380);
      addStatic(m, W / 2, 500, 240, 32);
      addLava(m, H - 40);
      m.data.lavaBase = H - 40;
    }, u(m, now) {
      m.data.lavaY = m.data.lavaBase + Math.sin(now / 2400) * 90 - 60;
      setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
    }, s: [{ x: 110, y: 180 }, { x: W - 110, y: 180 }, { x: W / 2 - 80, y: 300 }, { x: W / 2 + 80, y: 300 }] },
    { n: "Chandelier Hall", b(m) {
      addStatic(m, W / 2, 650, W - 100, 44);
      addChandelier(m, 320, -10, 220, 28);
      addChandelier(m, W / 2, -10, 300, 34);
      addChandelier(m, W - 320, -10, 220, 28);
      addLava(m, H - 10);
    } },
    { n: "Volcano Peak", b(m) {
      for (let i = 0; i < 4; i++) {
        addStatic(m, W / 2 - 300 + i * 100, 640 - i * 70, 110, 30);
        addStatic(m, W / 2 + 300 - i * 100, 640 - i * 70, 110, 30);
      }
      addStatic(m, W / 2, 400, 150, 30);
      addLava(m);
      m.data.geysers = [{ x: W / 2, y: 390 }];
    }, u(m, now) {
      updateGeysers(m, now);
    }, s: [{ x: W / 2 - 300, y: 120 }, { x: W / 2 + 300, y: 120 }, { x: W / 2 - 100, y: 120 }, { x: W / 2 + 100, y: 120 }] },
    { n: "Charcoal Beams", b(m) {
      for (let i = 0; i < 3; i++) {
        addStatic(m, 250 + i * 390, 600 - i * 40, 300, 18);
        addStatic(m, 250 + i * 390, 380 + i * 30, 240, 18);
      }
      addLava(m);
    }, s: [{ x: 250, y: 120 }, { x: W - 250, y: 120 }, { x: 640, y: 120 }, { x: 250, y: 300 }] },
    { n: "Magma Pistons", b(m) {
      addStatic(m, 160, 600, 280, 36);
      addStatic(m, W - 160, 600, 280, 36);
      addMover(m, W / 2 - 200, 480, 170, 26, { ay: 110, period: 3400 });
      addMover(m, W / 2 + 200, 480, 170, 26, { ay: 110, period: 3400 });
      addMover(m, W / 2, 380, 170, 26, { ay: 140, period: 4200 });
      addLava(m);
    }, u(m, now) {
      updateMovers(m, now);
    }, s: [{ x: 160, y: 120 }, { x: W - 160, y: 120 }, { x: 320, y: 120 }, { x: W - 320, y: 120 }] },
    { n: "Twin Bridges", b(m) {
      addStatic(m, 150, 560, 300, 40);
      addStatic(m, W - 150, 560, 300, 40);
      buildBridge(m, 300, 620, 420);
      buildBridge(m, W - 300, W - 620, 420);
      buildBridge(m, 460, 820, 560);
      addLava(m);
    }, s: [{ x: 150, y: 120 }, { x: W - 150, y: 120 }, { x: 350, y: 120 }, { x: W - 350, y: 120 }] },
    { n: "Lava Foundry II", b(m) {
      addStatic(m, 170, 520, 340, 40);
      addStatic(m, W - 170, 520, 340, 40);
      addStatic(m, W / 2, 660, 260, 40);
      buildCrateStack(m, W / 2, 612, 4, 7);
      buildBridge(m, 340, 570, 480);
      buildBridge(m, W - 340, W - 570, 480);
      addChandelier(m, W / 2, -10, 190, 30);
      addBarrels(m, [90, W - 90], 480);
      addLava(m);
    }, s: [{ x: 120, y: 440 }, { x: W - 120, y: 440 }, { x: 260, y: 440 }, { x: W - 260, y: 440 }] },
    { n: "The Climb", cozy: true, b(m) {
      for (let i = 0; i < 6; i++) addStatic(m, i % 2 ? 250 : W - 250, 620 - i * 100, 300, 28);
      addStatic(m, W / 2, 80, 240, 28);
      addLava(m);
      m.data.lavaRise = true;
    }, u(m, now, dt) {
      m.data.lavaY = Math.max(160, m.data.lavaY - 12 * dt / 1e3);
      setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
    }, s: [{ x: W - 250, y: 500 }, { x: 250, y: 420 }, { x: W - 250, y: 320 }, { x: 250, y: 220 }] }
  ]);
  theme("Frost Fields", { bg: "#1c2531", icy: true, cover: "ice" }, [
    { n: "Frozen Lake", b(m) {
      addStatic(m, W / 2, 620, W - 80, 44, { friction: 0.01, color: "#3d5a73" });
      addBarrels(m, [300, W - 300], 560);
      addLava(m);
    } },
    { n: "Icicle Cave", b(m) {
      addStatic(m, 250, 560, 500, 40, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, W - 250, 560, 500, 40, { friction: 0.01, color: "#3d5a73" });
      addSeesaw(m, W / 2, 590, 240);
      addIcicles(m, [180, 330, 480, 640, 800, 950, 1100]);
      addLava(m);
    }, u(m, now) {
      updateIcicles(m, now);
    }, s: [{ x: 150, y: 480 }, { x: W - 150, y: 480 }, { x: 420, y: 480 }, { x: W - 420, y: 480 }] },
    { n: "Slalom", b(m) {
      addStatic(m, 300, 420, 560, 26, { friction: 0.01, color: "#3d5a73", angle: 0.22 });
      addStatic(m, W - 300, 560, 560, 26, { friction: 0.01, color: "#3d5a73", angle: -0.22 });
      addStatic(m, W / 2, 670, 300, 30, { friction: 0.01, color: "#3d5a73" });
      addLava(m);
    }, s: [{ x: 120, y: 200 }, { x: W - 120, y: 340 }, { x: 400, y: 200 }, { x: W - 400, y: 340 }] },
    { n: "Avalanche", b(m) {
      addStatic(m, W / 2, 630, W - 140, 44, { friction: 0.01, color: "#3d5a73" });
      addLava(m);
    }, u(m, now) {
      if (now > (m.data.nextIce || 0)) {
        m.data.nextIce = now + rand(1800, 3200);
        const chunk = createPolygon(rand(120, W - 120), -30, pick([3, 4, 5]), rand(12, 22), { density: 4e-3, label: "ball" });
        addBody2(m, chunk, "#bfe8ff");
      }
    } },
    { n: "Igloo", b(m) {
      addStatic(m, W / 2, 650, W - 120, 40, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, 350, 480, 200, 24, { angle: 0.5, color: "#4d6a83" });
      addStatic(m, W - 350, 480, 200, 24, { angle: -0.5, color: "#4d6a83" });
      addStatic(m, W / 2, 420, 260, 24, { color: "#4d6a83" });
      addLava(m, H - 10);
    } },
    { n: "Crosswind", b(m) {
      addStatic(m, W / 2, 620, W - 200, 40, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, 200, 460, 200, 26, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, W - 200, 460, 200, 26, { friction: 0.01, color: "#3d5a73" });
      addLava(m);
    }, u(m, now) {
      applyWind(Math.sin(now / 1800) * 0.25);
      if (simRandom() < 0.3) spawnParticle({ kind: "square", x: rand(0, W), y: rand(0, H - 100), vx: Math.sin(now / 1800) * 6, vy: 1, life: 20, maxLife: 20, color: "#fff", r: 2 });
    } },
    { n: "Ice Towers", cozy: true, b(m) {
      for (const x of [180, 490, 790, 1100]) {
        addStatic(m, x, 520, 120, 300, { friction: 0.01, color: "#3d5a73" });
      }
      addLava(m);
    }, s: [{ x: 180, y: 120 }, { x: 1100, y: 120 }, { x: 490, y: 120 }, { x: 790, y: 120 }] },
    { n: "Glacier Gap", b(m) {
      addStatic(m, 240, 540, 480, 200, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, W - 240, 540, 480, 200, { friction: 0.01, color: "#3d5a73" });
      addHangingPlatform(m, W / 2, -10, 320, 170);
      addLava(m);
    }, s: [{ x: 200, y: 200 }, { x: W - 200, y: 200 }, { x: 400, y: 200 }, { x: W - 400, y: 200 }] },
    { n: "Snowman Alley", b(m) {
      addStatic(m, W / 2, 640, W - 120, 40, { friction: 0.01, color: "#3d5a73" });
      for (const x of [300, W / 2, W - 300]) {
        for (let i = 0; i < 3; i++) {
          const ball = createCircle(x, 590 - i * 38, 22 - i * 5, { density: 1e-3, friction: 0.3, label: "ball" });
          addBody2(m, ball, "#f4fbff");
        }
      }
      addLava(m, H - 10);
    } },
    { n: "Deep Freeze", b(m) {
      addStatic(m, W / 2, 600, 700, 36, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, 240, 440, 180, 24, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, W - 240, 440, 180, 24, { friction: 0.01, color: "#3d5a73" });
      addIcicles(m, [400, 560, 720, 880], 60);
      addLava(m);
    }, u(m, now) {
      updateIcicles(m, now);
    }, s: [{ x: 340, y: 120 }, { x: W - 340, y: 120 }, { x: 240, y: 300 }, { x: W - 240, y: 300 }] }
  ]);
  theme("Sky Isles", { bg: "#232a40", stars: true, cover: "crate" }, [
    { n: "Archipelago", b(m) {
      addStatic(m, 170, 560, 260, 30);
      addStatic(m, 490, 460, 220, 30);
      addStatic(m, W / 2, 620, 200, 30);
      addStatic(m, W - 490, 460, 220, 30);
      addStatic(m, W - 170, 560, 260, 30);
    }, s: [{ x: 170, y: 120 }, { x: W - 170, y: 120 }, { x: 490, y: 120 }, { x: W - 490, y: 120 }] },
    { n: "Stepping Sky", b(m) {
      for (let i = 0; i < 8; i++) addStatic(m, 130 + i * 148, 580 - i % 3 * 130, 90, 22);
    }, s: [{ x: 130, y: 120 }, { x: 130 + 7 * 148, y: 120 }, { x: 130 + 3 * 148, y: 120 }, { x: 130 + 4 * 148, y: 120 }] },
    { n: "Rope Crossing", b(m) {
      addStatic(m, 170, 500, 280, 30);
      addStatic(m, W - 170, 500, 280, 30);
      buildBridge(m, 310, 610, 460);
      buildBridge(m, W - 310, W - 610, 460);
      addStatic(m, W / 2, 640, 160, 26);
    }, s: [{ x: 170, y: 120 }, { x: W - 170, y: 120 }, { x: 350, y: 120 }, { x: W - 350, y: 120 }] },
    { n: "Updraft Canyon", b(m) {
      addStatic(m, 200, 540, 320, 34);
      addStatic(m, W - 200, 540, 320, 34);
      addStatic(m, W / 2, 300, 200, 26);
    }, u(m) {
      for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        if (Math.abs(b.position.x - W / 2) < 110) addVelocity(b, { x: 0, y: -perSecond(0.9) });
      }
      if (simRandom() < 0.4) spawnParticle({ kind: "spark", x: W / 2 + rand(-100, 100), y: rand(300, H), vx: 0, vy: -9, life: 18, maxLife: 18, color: "#e0ffff", r: 2 });
    }, s: [{ x: 200, y: 120 }, { x: W - 200, y: 120 }, { x: 340, y: 120 }, { x: W - 340, y: 120 }] },
    { n: "Cloud Bounce", cozy: true, b(m) {
      addStatic(m, 220, 580, 260, 30, { restitution: 1.2, color: "#4a5578" });
      addStatic(m, W / 2, 480, 240, 30, { restitution: 1.2, color: "#4a5578" });
      addStatic(m, W - 220, 580, 260, 30, { restitution: 1.2, color: "#4a5578" });
    }, s: [{ x: 220, y: 120 }, { x: W - 220, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] },
    { n: "Balloon Ride", b(m) {
      addHangingPlatform(m, 250, -10, 260, 160);
      addHangingPlatform(m, W / 2, -10, 380, 160);
      addHangingPlatform(m, W - 250, -10, 260, 160);
      addStatic(m, W / 2, 680, 240, 30);
    }, s: [{ x: 250, y: 120 }, { x: W - 250, y: 120 }, { x: W / 2 - 60, y: 200 }, { x: W / 2 + 60, y: 200 }] },
    { n: "The Spiral", b(m) {
      const pts = [[180, 620], [430, 540], [660, 450], [880, 360], [1080, 270], [860, 180], [620, 150]];
      for (const [x, y] of pts) addStatic(m, x, y, 150, 22);
    }, s: [{ x: 180, y: 120 }, { x: 1080, y: 120 }, { x: 660, y: 120 }, { x: 430, y: 120 }] },
    { n: "Islet Duel", cozy: true, b(m) {
      addStatic(m, 220, 520, 300, 36);
      addStatic(m, W - 220, 520, 300, 36);
    }, s: [{ x: 220, y: 120 }, { x: W - 220, y: 120 }, { x: 160, y: 120 }, { x: W - 160, y: 120 }] },
    { n: "Windy Ridge", b(m) {
      addStatic(m, W / 2, 560, W - 320, 26);
      addStatic(m, 240, 400, 160, 22);
      addStatic(m, W - 240, 400, 160, 22);
    }, u(m, now) {
      applyWind(Math.sin(now / 2200) * 0.3);
    }, s: [{ x: 300, y: 120 }, { x: W - 300, y: 120 }, { x: 500, y: 120 }, { x: W - 500, y: 120 }] },
    { n: "Heaven's Gate", b(m) {
      addStatic(m, W / 2, 640, 300, 30);
      addStatic(m, 300, 500, 200, 24);
      addStatic(m, W - 300, 500, 200, 24);
      addStatic(m, 450, 330, 180, 24);
      addStatic(m, W - 450, 330, 180, 24);
      addStatic(m, W / 2, 200, 220, 24);
      addChandelier(m, W / 2, -10, 140, 24);
    }, s: [{ x: 300, y: 120 }, { x: W - 300, y: 120 }, { x: W / 2 - 80, y: 300 }, { x: W / 2 + 80, y: 300 }] }
  ]);
  theme("The Machine", { bg: "#221c2b", cover: "pillar" }, [
    { n: "The Pendulum", b(m) {
      addStatic(m, W / 2, 645, 660, 40);
      addStatic(m, 110, 470, 220, 36);
      addStatic(m, W - 110, 470, 220, 36);
      buildCrateStack(m, W / 2 + 200, 611, 3, 3);
      addHangingPlatform(m, 330, -10, 260, 150);
      addHangingPlatform(m, W - 330, -10, 260, 150);
      addPendulumBall(m, W / 2, -80, 400);
      addLava(m);
    }, u(m) {
      keepPendulumsSwinging(m);
    }, s: [{ x: 110, y: 410 }, { x: W - 110, y: 410 }, { x: W / 2 - 240, y: 580 }, { x: W / 2 + 240, y: 580 }] },
    { n: "Gear Works", b(m) {
      addStatic(m, 180, 600, 300, 36);
      addStatic(m, W - 180, 600, 300, 36);
      addSpinner(m, W / 2, 480, 260, 0.018);
      addSpinner(m, 400, 300, 200, -0.025);
      addSpinner(m, W - 400, 300, 200, 0.025);
      addLava(m);
    }, s: [{ x: 180, y: 120 }, { x: W - 180, y: 120 }, { x: 300, y: 120 }, { x: W - 300, y: 120 }] },
    { n: "The Crusher", b(m) {
      addStatic(m, W / 2, 650, W - 200, 40);
      addMover(m, W / 2, 240, 320, 60, { ay: 200, period: 5200, color: "#0d0a14" });
      addStatic(m, 160, 500, 220, 30);
      addStatic(m, W - 160, 500, 220, 30);
      addLava(m);
    }, u(m, now) {
      updateMovers(m, now);
    }, s: [{ x: 160, y: 120 }, { x: W - 160, y: 120 }, { x: 340, y: 120 }, { x: W - 340, y: 120 }] },
    { n: "Conveyor", b(m) {
      addStatic(m, 320, 600, 600, 36, { color: "#33283f" });
      addStatic(m, W - 320, 450, 600, 36, { color: "#33283f" });
      addLava(m);
      m.data.belts = [{ x0: 40, x1: 620, y: 582, dir: 1 }, { x0: W - 620, x1: W - 40, y: 432, dir: -1 }];
    }, u(m) {
      for (const belt of m.data.belts) for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        if (b.position.x > belt.x0 && b.position.x < belt.x1 && Math.abs(b.position.y - belt.y + 20) < 34) setVelocity(b, { x: Math.max(-9, Math.min(9, b.velocity.x + belt.dir * perSecond(0.25))), y: b.velocity.y });
      }
    }, s: [{ x: 320, y: 120 }, { x: W - 320, y: 120 }, { x: 160, y: 120 }, { x: W - 160, y: 120 }] },
    { n: "Hammer Time", b(m) {
      addStatic(m, W / 2, 630, W - 240, 40);
      addPendulumBall(m, 340, -60, 330, 36, 12);
      addPendulumBall(m, W - 340, -60, 330, 36, -12);
      addLava(m);
    }, u(m) {
      keepPendulumsSwinging(m);
    } },
    { n: "Assembly Line", b(m) {
      addStatic(m, W / 2, 620, W - 160, 36, { color: "#33283f" });
      addLava(m);
      m.data.belts = [{ x0: 100, x1: W - 100, y: 602, dir: 1 }];
    }, u(m, now) {
      updateCrateRain(m, now, 24, 3e3);
      for (const belt of m.data.belts) for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        if (b.position.x > belt.x0 && b.position.x < belt.x1 && Math.abs(b.position.y - belt.y + 20) < 34) setVelocity(b, { x: Math.max(-9, Math.min(9, b.velocity.x + belt.dir * perSecond(0.25))), y: b.velocity.y });
      }
    } },
    { n: "Twin Wrecking", b(m) {
      addStatic(m, W / 2, 660, 400, 40);
      addStatic(m, 150, 520, 260, 34);
      addStatic(m, W - 150, 520, 260, 34);
      addPendulumBall(m, W / 2 - 180, -80, 380, 40, 14);
      addPendulumBall(m, W / 2 + 180, -80, 380, 40, -14);
      addLava(m);
    }, u(m) {
      keepPendulumsSwinging(m);
    }, s: [{ x: 150, y: 120 }, { x: W - 150, y: 120 }, { x: W / 2 - 80, y: 500 }, { x: W / 2 + 80, y: 500 }] },
    { n: "Pinball", b(m) {
      addStatic(m, W / 2, 660, W, 40);
      addBumper(m, 320, 480);
      addBumper(m, W / 2, 340);
      addBumper(m, W - 320, 480);
      addBumper(m, W / 2 - 140, 560, 18);
      addBumper(m, W / 2 + 140, 560, 18);
      addLava(m, H - 12);
    } },
    { n: "Clockface", b(m) {
      addStatic(m, W / 2, 660, 520, 40);
      addStatic(m, 140, 480, 240, 30);
      addStatic(m, W - 140, 480, 240, 30);
      addSpinner(m, W / 2, 400, 340, 0.014);
      const cross = addSpinner(m, W / 2, 400, 340, 0.014);
      setAngle(cross, Math.PI / 2);
      addLava(m);
    }, s: [{ x: 140, y: 120 }, { x: W - 140, y: 120 }, { x: W / 2 - 100, y: 560 }, { x: W / 2 + 100, y: 560 }] },
    { n: "The Gauntlet", b(m) {
      addStatic(m, W / 2, 650, W - 100, 40, { color: "#33283f" });
      addPendulumBall(m, 350, -60, 300, 32, 12);
      addSpinner(m, W - 380, 480, 220, 0.022);
      addLava(m);
      m.data.belts = [{ x0: 80, x1: W - 80, y: 632, dir: -1 }];
    }, u(m, now) {
      keepPendulumsSwinging(m);
      for (const belt of m.data.belts) for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        if (b.position.x > belt.x0 && b.position.x < belt.x1 && Math.abs(b.position.y - belt.y + 20) < 34) setVelocity(b, { x: Math.max(-9, Math.min(9, b.velocity.x + belt.dir * perSecond(0.25))), y: b.velocity.y });
      }
    } }
  ]);
  theme("Goo Swamp", { bg: "#1e2b1e", muddy: true, cover: "tree" }, [
    { n: "Bog Standard", b(m) {
      addStatic(m, 280, 600, 540, 40, { color: "#2d3d2a" });
      addStatic(m, W - 280, 600, 540, 40, { color: "#2d3d2a" });
      addLava(m, H - 22, true);
    }, s: [{ x: 280, y: 120 }, { x: W - 280, y: 120 }, { x: 140, y: 120 }, { x: W - 140, y: 120 }] },
    { n: "Bounce Marsh", b(m) {
      addStatic(m, W / 2, 640, W - 160, 40, { color: "#2d3d2a" });
      addBumper(m, 300, 560, 26);
      addBumper(m, W / 2, 520, 30);
      addBumper(m, W - 300, 560, 26);
      addLava(m, H - 12, true);
    } },
    { n: "Lily Hop", b(m) {
      for (let i = 0; i < 6; i++) addStatic(m, 140 + i * 200, 590, 110, 18, { color: "#3d5c36" });
      addLava(m, H - 40, true);
    }, s: [{ x: 140, y: 120 }, { x: 140 + 5 * 200, y: 120 }, { x: 540, y: 120 }, { x: 740, y: 120 }] },
    { n: "Vine Swing", b(m) {
      addStatic(m, 170, 540, 280, 36, { color: "#2d3d2a" });
      addStatic(m, W - 170, 540, 280, 36, { color: "#2d3d2a" });
      buildBridge(m, 310, 640, 440);
      buildBridge(m, W - 310, W - 640, 440);
      addHangingPlatform(m, W / 2, -10, 300, 150);
      addLava(m, H - 22, true);
    }, s: [{ x: 170, y: 120 }, { x: W - 170, y: 120 }, { x: 350, y: 120 }, { x: W - 350, y: 120 }] },
    { n: "Sticky Situation", b(m) {
      addStatic(m, W / 2, 620, W - 120, 44, { friction: 1, color: "#3a4a2e" });
      buildCrateStack(m, W / 2, 570, 3, 3);
      addLava(m, H - 10, true);
    } },
    // vents live in map data as {x,y} so drawGasVents can mark them on every
    // screen; eruption puffs go through spawnBurst (fx-wrapped → LAN broadcast),
    // not raw particles.push, so remote players see the lift columns fire too
    { n: "Gas Vents", b(m) {
      addStatic(m, W / 2, 640, W - 180, 40, { color: "#2d3d2a" });
      addLava(m, H - 12, true);
      m.data.vents = [{ x: 280, y: 620 }, { x: W / 2, y: 620 }, { x: W - 280, y: 620 }];
    }, u(m, now) {
      for (const v of m.data.vents) {
        if (Math.sin(now / 900 + v.x) > 0.7) {
          for (const b of allBodies()) {
            if (b.isStatic || b.isSensor) continue;
            if (Math.abs(b.position.x - v.x) < 60) addVelocity(b, { x: 0, y: -perSecond(1.4) });
          }
          if (!v.blowing) {
            v.blowing = true;
            spawnBurst(v.x, v.y - 8, "#aef05a", 16, { dir: -Math.PI / 2, spread: 0.5, speed: 8, up: 2, g: -0.02, life: 34, r: 3.5 });
            spawnBurst(v.x, v.y - 4, "#7bd88f", 8, { dir: -Math.PI / 2, spread: 0.9, speed: 5, up: 1, g: -0.02, life: 40, r: 2.5 });
          } else if (simRandom() < 0.3) {
            spawnBurst(v.x + rand(-30, 30), v.y - 10, "#aef05a", 2, { dir: -Math.PI / 2, spread: 0.4, speed: 7, up: 1, g: -0.02, life: 26, r: 3 });
          }
        } else v.blowing = false;
      }
    } },
    { n: "Log Ride", b(m) {
      addStatic(m, 150, 560, 240, 34, { color: "#2d3d2a" });
      addStatic(m, W - 150, 560, 240, 34, { color: "#2d3d2a" });
      addSeesaw(m, 480, 520, 260);
      addSeesaw(m, W - 480, 520, 260);
      addLava(m, H - 30, true);
    }, s: [{ x: 150, y: 120 }, { x: W - 150, y: 120 }, { x: 480, y: 120 }, { x: W - 480, y: 120 }] },
    { n: "Toadstool Towers", b(m) {
      for (const [x, y] of [[220, 520], [520, 400], [820, 480], [1100, 380]]) {
        addStatic(m, x, y, 130, 20, { restitution: 1.1, color: "#c75e54" });
        addStatic(m, x, y + 100, 30, 180, { color: "#e8dcc0" });
      }
      addLava(m, H - 22, true);
    }, s: [{ x: 220, y: 120 }, { x: 1100, y: 120 }, { x: 520, y: 120 }, { x: 820, y: 120 }] },
    { n: "Quagmire", b(m) {
      for (let i = 0; i < 5; i++) addStatic(m, 160 + i * 240, 560 + i % 2 * 70, 150, 28, { color: "#2d3d2a" });
      addLava(m, H - 34, true);
    }, s: [{ x: 160, y: 120 }, { x: 160 + 4 * 240, y: 120 }, { x: 400, y: 120 }, { x: 880, y: 120 }] },
    { n: "The Belch", cozy: true, b(m) {
      addStatic(m, 130, 480, 220, 320, { color: "#2d3d2a" });
      addStatic(m, W - 130, 480, 220, 320, { color: "#2d3d2a" });
      addStatic(m, W / 2, 560, 280, 30, { color: "#2d3d2a" });
      addLava(m, H - 30, true);
      m.data.lavaBase = H - 30;
    }, u(m, now) {
      const burp = Math.max(0, Math.sin(now / 1700)) ** 6;
      m.data.lavaY = m.data.lavaBase - burp * 260;
      setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
    }, s: [{ x: 130, y: 200 }, { x: W - 130, y: 200 }, { x: W / 2 - 80, y: 300 }, { x: W / 2 + 80, y: 300 }] }
  ]);
  theme("Deep Space", { bg: "#141426", stars: true, cover: "pillar" }, [
    { n: "Moon Base", gravity: 1.1, b(m) {
      addStatic(m, W / 2, 640, W - 100, 44, { color: "#2a2a40" });
      addStatic(m, 300, 500, 180, 26, { color: "#2a2a40" });
      addStatic(m, W - 300, 500, 180, 26, { color: "#2a2a40" });
      addLava(m, H - 10);
    } },
    { n: "Asteroid Belt", cozy: true, gravity: 0.5, b(m) {
      addStatic(m, W / 2, 660, 500, 36, { color: "#2a2a40" });
      for (let i = 0; i < 10; i++) {
        const rock = createPolygon(rand(100, W - 100), rand(150, 450), pick([5, 6, 7]), rand(14, 30), { density: 3e-3, frictionAir: 0.02, label: "ball" });
        addBody2(m, rock, "#4a4a5f");
      }
    }, s: [{ x: W / 2 - 180, y: 120 }, { x: W / 2 + 180, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] },
    { n: "Zero-G Arena", gravity: 0.15, b(m) {
      addStatic(m, W / 2, 690, W, 40, { color: "#2a2a40" });
      addStatic(m, W / 2, 20, W, 40, { color: "#2a2a40" });
      addStatic(m, 260, 380, 200, 24, { color: "#2a2a40" });
      addStatic(m, W - 260, 380, 200, 24, { color: "#2a2a40" });
      addStatic(m, W / 2, 500, 220, 24, { color: "#2a2a40" });
    } },
    { n: "The Core", gravity: 0.7, b(m) {
      addStatic(m, W / 2, 690, W, 40, { color: "#2a2a40" });
      addStatic(m, 160, 420, 220, 26, { color: "#2a2a40" });
      addStatic(m, W - 160, 420, 220, 26, { color: "#2a2a40" });
    }, u(m) {
      for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        const dx = W / 2 - b.position.x, dy = 360 - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 420) addVelocity(b, { x: dx / d * perSecond(0.35), y: dy / d * perSecond(0.35) });
      }
    }, s: [{ x: 160, y: 120 }, { x: W - 160, y: 120 }, { x: 300, y: 120 }, { x: W - 300, y: 120 }] },
    { n: "Solar Array", cozy: true, gravity: 1.2, b(m) {
      addStatic(m, W / 2, 650, 480, 36, { color: "#2a2a40" });
      addSpinner(m, 300, 420, 240, 0.016, "#3a3a55");
      addSpinner(m, W - 300, 420, 240, -0.016, "#3a3a55");
      addLava(m, H - 10);
    }, s: [{ x: W / 2 - 160, y: 120 }, { x: W / 2 + 160, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] },
    { n: "Wraparound", gravity: 1.3, wrap: true, b(m) {
      addStatic(m, 260, 560, 340, 30, { color: "#2a2a40" });
      addStatic(m, W - 260, 560, 340, 30, { color: "#2a2a40" });
      addStatic(m, W / 2, 380, 260, 26, { color: "#2a2a40" });
      addLava(m);
    }, s: [{ x: 260, y: 120 }, { x: W - 260, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] },
    { n: "Junkyard Orbit", gravity: 0.6, b(m) {
      addStatic(m, W / 2, 660, W - 300, 36, { color: "#2a2a40" });
      for (let i = 0; i < 12; i++) {
        const junk = createBox(rand(150, W - 150), rand(150, 480), rand(16, 42), rand(10, 22), { density: 2e-3, frictionAir: 0.015, label: "crate" });
        addBody2(m, junk, "#5a5a6f");
      }
    }, s: [{ x: W / 2 - 200, y: 120 }, { x: W / 2 + 200, y: 120 }, { x: W / 2 - 80, y: 120 }, { x: W / 2 + 80, y: 120 }] },
    { n: "Flip Zone", gravity: 1.5, b(m) {
      addStatic(m, W / 2, 660, W - 160, 36, { color: "#2a2a40" });
      addStatic(m, W / 2, 60, W - 160, 36, { color: "#2a2a40" });
      addStatic(m, 240, 380, 220, 24, { color: "#2a2a40" });
      addStatic(m, W - 240, 380, 220, 24, { color: "#2a2a40" });
    }, u(m, now) {
      const flipped = Math.floor(now / 8e3) % 2 === 1;
      const want = flipped ? -game.baseGravity : game.baseGravity;
      if (baseGravity() !== want) {
        setBase(want);
        doFlash("#c084fc", 0.25);
        setBanner(flipped ? "GRAVITY UP!" : "GRAVITY DOWN!", "#c084fc", 900);
      }
    }, s: [{ x: 240, y: 300 }, { x: W - 240, y: 300 }, { x: 400, y: 300 }, { x: W - 400, y: 300 }] },
    { n: "Comet Run", gravity: 0.8, b(m) {
      addStatic(m, W / 2, 640, W - 240, 34, { color: "#2a2a40" });
      addStatic(m, 170, 460, 180, 24, { color: "#2a2a40" });
      addStatic(m, W - 170, 460, 180, 24, { color: "#2a2a40" });
      m.data.boulderY = 200;
    }, u(m, now) {
      updateBoulders(m, now, 4200);
    } },
    { n: "Dark Side", cozy: true, gravity: 0.55, wrap: true, b(m) {
      addStatic(m, 300, 560, 260, 28, { color: "#2a2a40" });
      addStatic(m, W - 300, 560, 260, 28, { color: "#2a2a40" });
      addStatic(m, W / 2, 360, 220, 24, { color: "#2a2a40" });
      for (let i = 0; i < 6; i++) {
        const rock = createPolygon(rand(100, W - 100), rand(120, 320), 6, rand(12, 20), { density: 3e-3, frictionAir: 0.02, label: "ball" });
        addBody2(m, rock, "#4a4a5f");
      }
    }, s: [{ x: 300, y: 120 }, { x: W - 300, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] }
  ]);
  theme("Ancient Ruins", { bg: "#26221c", cover: "pillar" }, [
    { n: "Pillar Hall", b(m) {
      addStatic(m, W / 2, 650, W - 80, 44, { color: "#3a3226" });
      for (const x of [280, 560, 840, 1060]) {
        for (let i = 0; i < 4; i++) {
          const seg = createBox(x, 596 - i * 66, 36, 62, { density: 4e-3, friction: 0.6, label: "crate" });
          addBody2(m, seg, "#8a7a5c");
        }
      }
      addLava(m, H - 10);
    } },
    { n: "Collapsing Temple", b(m) {
      addStatic(m, 200, 620, 340, 40, { color: "#3a3226" });
      addStatic(m, W - 200, 620, 340, 40, { color: "#3a3226" });
      const roof = createBox(W / 2, 260, 460, 26, { density: 6e-3, label: "plank" });
      roof.w = 460;
      roof.h = 26;
      addBody2(m, roof, "#8a7a5c");
      for (const side of [-1, 1]) {
        const rope = createJoint({ pointA: { x: W / 2 + side * 210, y: 40 }, bodyB: roof, pointB: { x: side * 210, y: 0 }, stiffness: 0.9, length: 200 });
        rope.label = "breakable";
        addTo(m.composite, rope);
      }
      addLava(m);
    }, s: [{ x: 200, y: 120 }, { x: W - 200, y: 120 }, { x: 340, y: 120 }, { x: W - 340, y: 120 }] },
    { n: "Boulder Run", b(m) {
      addStatic(m, W / 2, 640, W, 44, { color: "#3a3226" });
      addStatic(m, 300, 480, 200, 26, { color: "#3a3226" });
      addStatic(m, W - 300, 480, 200, 26, { color: "#3a3226" });
      addLava(m, H - 10);
      m.data.boulderY = 80;
    }, u(m, now) {
      updateBoulders(m, now, 3800);
    } },
    { n: "Spike Pit", b(m) {
      addStatic(m, 240, 600, 440, 40, { color: "#3a3226" });
      addStatic(m, W - 240, 600, 440, 40, { color: "#3a3226" });
      addStatic(m, W / 2, 660, 260, 20, { label: "spikes", color: "#8a2f3d" });
      addHangingPlatform(m, W / 2, -10, 340, 160);
      addLava(m);
    }, s: [{ x: 240, y: 120 }, { x: W - 240, y: 120 }, { x: 400, y: 120 }, { x: W - 400, y: 120 }] },
    { n: "Ziggurat", b(m) {
      for (let i = 0; i < 5; i++) addStatic(m, W / 2, 650 - i * 70, 800 - i * 160, 36, { color: "#3a3226" });
      addLava(m, H - 10);
    }, s: [{ x: 340, y: 120 }, { x: W - 340, y: 120 }, { x: 500, y: 120 }, { x: W - 500, y: 120 }] },
    { n: "Obelisk Duel", b(m) {
      addStatic(m, W / 2, 650, W - 200, 40, { color: "#3a3226" });
      for (const x of [360, W - 360]) {
        const ob = createBox(x, 540, 30, 180, { density: 5e-3, label: "crate" });
        addBody2(m, ob, "#8a7a5c");
      }
      addBarrels(m, [W / 2 - 60, W / 2 + 60], 600);
      addLava(m, H - 10);
    } },
    { n: "Broken Aqueduct", b(m) {
      for (const [x, w] of [[180, 300], [560, 240], [940, 240], [1180, 160]]) addStatic(m, x, 500, w, 30, { color: "#3a3226" });
      buildBridge(m, 680, 820, 500);
      addLava(m);
    }, s: [{ x: 180, y: 120 }, { x: 1180, y: 120 }, { x: 560, y: 120 }, { x: 940, y: 120 }] },
    { n: "The Tomb", b(m) {
      addStatic(m, W / 2, 640, W - 140, 40, { color: "#3a3226" });
      addStatic(m, W / 2, 120, W - 140, 30, { color: "#3a3226" });
      addStatic(m, W / 2 - 300, 420, 30, 240, { color: "#3a3226" });
      addStatic(m, W / 2 + 300, 420, 30, 240, { color: "#3a3226" });
      buildCrateStack(m, W / 2, 592, 2, 3);
      addLava(m, H - 10);
    } },
    { n: "Sandslide", b(m) {
      addStatic(m, 320, 480, 620, 26, { angle: 0.18, color: "#3a3226" });
      addStatic(m, W - 320, 480, 620, 26, { angle: -0.18, color: "#3a3226" });
      addStatic(m, W / 2, 660, 300, 30, { color: "#3a3226" });
      addBarrels(m, [200, 300, W - 200, W - 300], 380);
      addLava(m);
    }, s: [{ x: 200, y: 120 }, { x: W - 200, y: 120 }, { x: 440, y: 120 }, { x: W - 440, y: 120 }] },
    { n: "Antechamber", b(m) {
      addStatic(m, 170, 560, 300, 36, { color: "#3a3226" });
      addStatic(m, W - 170, 560, 300, 36, { color: "#3a3226" });
      addStatic(m, W / 2, 440, 240, 30, { color: "#3a3226" });
      addStatic(m, W / 2 - 200, 660, 120, 20, { label: "spikes", color: "#8a2f3d" });
      addStatic(m, W / 2 + 200, 660, 120, 20, { label: "spikes", color: "#8a2f3d" });
      addChandelier(m, W / 2, -10, 200, 28);
      addLava(m);
    }, s: [{ x: 170, y: 120 }, { x: W - 170, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] }
  ]);
  theme("Storm Peaks", { bg: "#1a2030", cover: "pillar" }, [
    { n: "Thunder Spire", b(m) {
      addStatic(m, W / 2, 660, 400, 40, { color: "#2a3242" });
      addStatic(m, W / 2, 460, 160, 300, { color: "#2a3242" });
      addStatic(m, 220, 540, 280, 30, { color: "#2a3242" });
      addStatic(m, W - 220, 540, 280, 30, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      updateStrikes(m, now, 3200);
    }, s: [{ x: 220, y: 120 }, { x: W - 220, y: 120 }, { x: W / 2 - 140, y: 200 }, { x: W / 2 + 140, y: 200 }] },
    { n: "Gale Force", b(m) {
      addStatic(m, W / 2, 620, W - 200, 36, { color: "#2a3242" });
      addStatic(m, 240, 450, 200, 24, { color: "#2a3242" });
      addStatic(m, W - 240, 450, 200, 24, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      applyWind(Math.sin(now / 1500) * 0.4);
    } },
    { n: "Rain Slick", icy: true, b(m) {
      addStatic(m, W / 2, 600, W - 140, 36, { friction: 0.02, color: "#2a3242" });
      addStatic(m, 300, 440, 220, 24, { friction: 0.02, color: "#2a3242" });
      addStatic(m, W - 300, 440, 220, 24, { friction: 0.02, color: "#2a3242" });
      addLava(m);
    }, u() {
      for (let i = 0; i < 3; i++) spawnParticle({ kind: "spark", x: rand(0, W), y: rand(0, H - 120), vx: -1, vy: 11, life: 12, maxLife: 12, color: "#6a86b8", r: 1.5 });
    } },
    { n: "Eye of the Storm", b(m) {
      addStatic(m, W / 2, 580, 340, 36, { color: "#2a3242" });
      addStatic(m, 150, 500, 220, 28, { color: "#2a3242" });
      addStatic(m, W - 150, 500, 220, 28, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        const off = b.position.x - W / 2;
        if (Math.abs(off) > 240) addVelocity(b, { x: -Math.sign(off) * perSecond(0.3), y: 0 });
      }
    }, s: [{ x: 150, y: 120 }, { x: W - 150, y: 120 }, { x: W / 2 - 80, y: 120 }, { x: W / 2 + 80, y: 120 }] },
    { n: "Lightning Rods", b(m) {
      addStatic(m, W / 2, 640, W - 160, 40, { color: "#2a3242" });
      for (const x of [280, W / 2, W - 280]) addStatic(m, x, 560, 10, 120, { color: "#e3f265" });
      addLava(m);
      m.data.strikeXs = [280, W / 2, W - 280];
    }, u(m, now) {
      updateStrikes(m, now, 2400, 28);
    } },
    { n: "Crosswinds Canyon", b(m) {
      addStatic(m, 190, 560, 300, 34, { color: "#2a3242" });
      addStatic(m, W - 190, 560, 300, 34, { color: "#2a3242" });
      addHangingPlatform(m, W / 2 - 160, -10, 300, 140);
      addHangingPlatform(m, W / 2 + 160, -10, 380, 140);
      addLava(m);
    }, u(m, now) {
      applyWind(Math.sin(now / 1100) * 0.35);
    }, s: [{ x: 190, y: 120 }, { x: W - 190, y: 120 }, { x: 330, y: 120 }, { x: W - 330, y: 120 }] },
    { n: "Static Field", b(m) {
      addStatic(m, 250, 580, 380, 34, { color: "#2a3242" });
      addStatic(m, W - 250, 580, 380, 34, { color: "#2a3242" });
      addStatic(m, W / 2, 420, 240, 26, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      if (now > (m.data.nextZap || 0)) {
        m.data.nextZap = now + rand(900, 1800);
        const a = { x: rand(200, W - 200), y: rand(200, 500) };
        const b = { x: a.x + rand(-260, 260), y: a.y + rand(-140, 140) };
        boltVisual(a.x, a.y, b.x, b.y, "#9ef0f0", 2, 110);
        for (const q of players) {
          if (!q.alive) continue;
          const d = Math.hypot(q.body.position.x - (a.x + b.x) / 2, q.body.position.y - (a.y + b.y) / 2);
          if (d < 90) damagePlayer(q, 5);
        }
      }
    } },
    { n: "Downpour", b(m) {
      addStatic(m, W / 2, 630, W - 180, 40, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      updateCrateRain(m, now, 20, 3400);
      for (let i = 0; i < 2; i++) spawnParticle({ kind: "spark", x: rand(0, W), y: rand(0, H - 120), vx: 0, vy: 12, life: 10, maxLife: 10, color: "#6a86b8", r: 1.5 });
    } },
    { n: "Cliffhanger", b(m) {
      addStatic(m, 320, 520, 640, 400, { color: "#2a3242" });
      addStatic(m, 850, 620, 240, 30, { color: "#2a3242" });
      addStatic(m, 1120, 500, 200, 26, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      applyWind(0.16 + Math.sin(now / 2e3) * 0.12);
    }, s: [{ x: 160, y: 200 }, { x: 480, y: 200 }, { x: 850, y: 120 }, { x: 1120, y: 120 }] },
    { n: "Tempest Bridge", b(m) {
      addStatic(m, 130, 540, 240, 36, { color: "#2a3242" });
      addStatic(m, W - 130, 540, 240, 36, { color: "#2a3242" });
      buildBridge(m, 250, 620, 440);
      buildBridge(m, 620, W - 250, 440);
      addLava(m);
    }, u(m, now) {
      applyWind(Math.sin(now / 1300) * 0.3);
      updateStrikes(m, now, 3600, 20);
    }, s: [{ x: 130, y: 120 }, { x: W - 130, y: 120 }, { x: 300, y: 120 }, { x: W - 300, y: 120 }] }
  ]);
  theme("The Void", { bg: "#0d0a14", stars: true, cover: "pillar" }, [
    { n: "Null Island", cozy: true, b(m) {
      addStatic(m, W / 2, 560, 460, 40, { color: "#1f1830" });
    }, s: [{ x: W / 2 - 160, y: 120 }, { x: W / 2 + 160, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] },
    { n: "Wrap Void", cozy: true, wrap: true, b(m) {
      addStatic(m, 220, 560, 260, 26, { color: "#1f1830" });
      addStatic(m, W / 2, 430, 220, 26, { color: "#1f1830" });
      addStatic(m, W - 220, 560, 260, 26, { color: "#1f1830" });
    }, s: [{ x: 220, y: 120 }, { x: W - 220, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] },
    { n: "Phantom Floors", b(m) {
      const xs = [[220, 560], [520, 460], [820, 560], [1080, 440], [W / 2, 640]];
      xs.forEach(([x, y], i) => {
        const b = addStatic(m, x, y, 200, 24, { color: "#3d2f5c" });
        b.phantom = { speed: 12e-4, offset: i * 1.9 };
      });
      addStatic(m, W / 2, 690, 340, 24, { color: "#1f1830" });
    }, s: [{ x: W / 2 - 120, y: 120 }, { x: W / 2 + 120, y: 120 }, { x: W / 2 - 40, y: 120 }, { x: W / 2 + 40, y: 120 }] },
    { n: "Event Horizon", b(m) {
      const ring = [[W / 2, 660], [280, 540], [W - 280, 540], [380, 340], [W - 380, 340], [W / 2, 220]];
      for (const [x, y] of ring) addStatic(m, x, y, 180, 22, { color: "#1f1830" });
    }, u(m) {
      for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        const dx = W / 2 - b.position.x, dy = 430 - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 60 && d < 500) addVelocity(b, { x: dx / d * perSecond(0.25), y: dy / d * perSecond(0.25) });
      }
    }, s: [{ x: 280, y: 120 }, { x: W - 280, y: 120 }, { x: 380, y: 120 }, { x: W - 380, y: 120 }] },
    { n: "Antigrav", gravity: -1.4, b(m) {
      addStatic(m, W / 2, 100, W - 200, 36, { color: "#1f1830" });
      addStatic(m, 260, 260, 240, 26, { color: "#1f1830" });
      addStatic(m, W - 260, 260, 240, 26, { color: "#1f1830" });
      const top = createBox(W / 2, -40, W * 2, 60, { isStatic: true, isSensor: true, label: "lava" });
      addTo(m.composite, top);
      m.data.voidTop = true;
    }, s: [{ x: 260, y: 400 }, { x: W - 260, y: 400 }, { x: W / 2 - 80, y: 400 }, { x: W / 2 + 80, y: 400 }] },
    { n: "Blink", b(m) {
      addStatic(m, W / 2, 650, W - 200, 36, { color: "#1f1830" });
      addStatic(m, W / 2, 90, W - 200, 36, { color: "#1f1830" });
      addStatic(m, 250, 380, 220, 24, { color: "#1f1830" });
      addStatic(m, W - 250, 380, 220, 24, { color: "#1f1830" });
    }, u(m, now) {
      const flipped = Math.floor(now / 6e3) % 2 === 1;
      const want = flipped ? -game.baseGravity : game.baseGravity;
      if (baseGravity() !== want) {
        setBase(want);
        doFlash("#ff4df0", 0.25);
        setBanner("BLINK", "#ff4df0", 700);
      }
    }, s: [{ x: 250, y: 300 }, { x: W - 250, y: 300 }, { x: 420, y: 300 }, { x: W - 420, y: 300 }] },
    { n: "Mirror Match", cozy: true, wrap: true, b(m) {
      addStatic(m, 300, 560, 240, 24, { color: "#1f1830" });
      addStatic(m, W - 300, 560, 240, 24, { color: "#1f1830" });
      addStatic(m, 300, 340, 200, 22, { color: "#1f1830" });
      addStatic(m, W - 300, 340, 200, 22, { color: "#1f1830" });
    }, s: [{ x: 300, y: 120 }, { x: W - 300, y: 120 }, { x: 300, y: 260 }, { x: W - 300, y: 260 }] },
    { n: "The Maw", b(m) {
      addStatic(m, 200, 480, 320, 30, { color: "#1f1830" });
      addStatic(m, W - 200, 480, 320, 30, { color: "#1f1830" });
      addStatic(m, W / 2, 300, 240, 26, { color: "#1f1830" });
    }, u(m, now) {
      for (const b of allBodies()) {
        if (b.isStatic || b.isSensor) continue;
        const dx = W / 2 - b.position.x, dy = 720 - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 480) addVelocity(b, { x: dx / d * perSecond(0.3), y: dy / d * perSecond(0.3) });
      }
      if (simRandom() < 0.4) spawnParticle({ kind: "square", x: W / 2 + rand(-160, 160), y: H - rand(10, 60), vx: 0, vy: 2, life: 18, maxLife: 18, color: "#a55eea", r: 2.5 });
    }, s: [{ x: 200, y: 120 }, { x: W - 200, y: 120 }, { x: 340, y: 120 }, { x: W - 340, y: 120 }] },
    { n: "Glitch", wrap: true, b(m) {
      const xs = [[260, 560], [640, 470], [1020, 560], [W / 2, 300]];
      xs.forEach(([x, y], i) => {
        const b = addStatic(m, x, y, 220, 24, { color: "#3d2f5c" });
        b.phantom = { speed: 18e-4, offset: i * 2.3 };
      });
      addStatic(m, W / 2, 680, 400, 24, { color: "#1f1830" });
    }, u(m, now) {
      setBase(game.baseGravity * (1 + Math.sin(now / 2600) * 0.5));
    }, s: [{ x: W / 2 - 140, y: 120 }, { x: W / 2 + 140, y: 120 }, { x: W / 2 - 50, y: 120 }, { x: W / 2 + 50, y: 120 }] },
    { n: "Everything", b(m) {
      addStatic(m, 170, 520, 300, 36, { color: "#1f1830" });
      addStatic(m, W - 170, 520, 300, 36, { color: "#1f1830" });
      addStatic(m, W / 2, 650, 300, 36, { color: "#1f1830" });
      buildCrateStack(m, W / 2, 604, 3, 4);
      addPendulumBall(m, W / 2, -80, 340, 38);
      addIcicles(m, [340, 560, 720, 940], 60);
      buildBridge(m, 320, 560, 470);
      buildBridge(m, W - 320, W - 560, 470);
      addLava(m);
      m.data.lavaBase = H - 22;
    }, u(m, now, dt) {
      keepPendulumsSwinging(m);
      updateIcicles(m, now);
      applyWind(Math.sin(now / 1700) * 0.18);
      m.data.lavaY = Math.max(400, m.data.lavaY - 4 * dt / 1e3);
      setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
    }, s: [{ x: 170, y: 120 }, { x: W - 170, y: 120 }, { x: 320, y: 120 }, { x: W - 320, y: 120 }] }
  ]);
  theme("Classic", { bg: "#241d2e", cover: "crate" }, [
    { n: "Lava Foundry", b(m) {
      addStatic(m, 170, 520, 340, 40);
      addStatic(m, W - 170, 520, 340, 40);
      addStatic(m, W / 2, 660, 260, 40);
      buildCrateStack(m, W / 2, 612, 4, 7);
      buildBridge(m, 340, 570, 480);
      buildBridge(m, W - 340, W - 570, 480);
      addChandelier(m, W / 2, -10, 190, 30);
      addBarrels(m, [90, 130, W - 90, W - 130], 480);
      addLava(m);
    }, s: [{ x: 120, y: 440 }, { x: W - 120, y: 440 }, { x: 260, y: 440 }, { x: W - 260, y: 440 }] },
    { n: "Frost Cavern", icy: true, bg: "#1c2531", b(m) {
      addStatic(m, 250, 560, 500, 40, { friction: 0.01, color: "#3d5a73" });
      addStatic(m, W - 250, 560, 500, 40, { friction: 0.01, color: "#3d5a73" });
      addSeesaw(m, W / 2, 590, 240);
      buildCrateStack(m, 250, 532, 2, 2);
      buildCrateStack(m, W - 250, 532, 2, 2);
      addIcicles(m, [180, 330, 480, 640, 800, 950, 1100]);
      addLava(m);
    }, u(m, now) {
      updateIcicles(m, now);
    }, s: [{ x: 150, y: 480 }, { x: W - 150, y: 480 }, { x: 420, y: 480 }, { x: W - 420, y: 480 }] },
    { n: "Rising Lava", bg: "#2b1d22", b(m) {
      addStatic(m, W / 2, 640, 320, 36);
      addStatic(m, 240, 500, 240, 32);
      addStatic(m, W - 240, 500, 240, 32);
      addStatic(m, W / 2, 380, 260, 32);
      addStatic(m, 170, 250, 200, 32);
      addStatic(m, W - 170, 250, 200, 32);
      addStatic(m, W / 2, 140, 220, 32);
      buildCrateStack(m, W / 2, 358, 3, 2);
      addBarrels(m, [240, 280, W - 240, W - 280], 470);
      addHangingPlatform(m, 460, 30, 130, 130);
      addHangingPlatform(m, W - 460, 30, 130, 130);
      addLava(m);
    }, u(m, now, dt) {
      m.data.lavaY = Math.max(210, m.data.lavaY - 14 * dt / 1e3);
      setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
    }, s: [{ x: W / 2 - 100, y: 600 }, { x: W / 2 + 100, y: 600 }, { x: 240, y: 460 }, { x: W - 240, y: 460 }] },
    { n: "Pendulum Prime", bg: "#221c2b", b(m) {
      addStatic(m, W / 2, 645, 660, 40);
      addStatic(m, 110, 470, 220, 36);
      addStatic(m, W - 110, 470, 220, 36);
      buildCrateStack(m, W / 2 + 200, 611, 3, 3);
      addBarrels(m, [W / 2 - 180, W / 2 - 220], 600);
      addPendulumBall(m, W / 2, -80, 400);
      addLava(m);
    }, u(m) {
      keepPendulumsSwinging(m);
    }, s: [{ x: 110, y: 410 }, { x: W - 110, y: 410 }, { x: W / 2 - 240, y: 580 }, { x: W / 2 + 240, y: 580 }] }
  ]);
  theme("Wildwood", { bg: "#182014", cover: "tree" }, [
    { n: "The Grove", b(m) {
      addStatic(m, W / 2, 660, W, 44, { color: "#2a3320" });
      addStatic(m, 250, 500, 300, 26, { color: "#2a3320" });
      addStatic(m, W - 250, 500, 300, 26, { color: "#2a3320" });
      addStatic(m, W / 2, 380, 280, 26, { color: "#2a3320" });
      addTree(m, 430, 638, 0.9);
      addTree(m, W - 430, 638, 0.9);
      addTree(m, W / 2, 638, 1.15);
      addAlcove(m, 150, 638, 170, 100, 1, "#2a3320");
      addAlcove(m, W - 150, 638, 170, 100, -1, "#2a3320");
    }, s: [{ x: 250, y: 430 }, { x: W - 250, y: 430 }, { x: W / 2, y: 300 }, { x: 150, y: 120 }] },
    { n: "Thicket", cozy: true, b(m) {
      addStatic(m, W / 2, 660, W, 44, { color: "#2a3320" });
      addStatic(m, 210, 520, 260, 26, { color: "#2a3320" });
      addStatic(m, W - 210, 520, 260, 26, { color: "#2a3320" });
      for (const x of [300, 560, W - 560, W - 300]) addTree(m, x, 638, 0.7);
      for (const x of [430, W / 2, W - 430]) addCoverPillar(m, x, 638, 130);
    }, s: [{ x: 210, y: 460 }, { x: W - 210, y: 460 }, { x: 120, y: 120 }, { x: W - 120, y: 120 }] },
    { n: "Hollow Log", b(m) {
      addStatic(m, W / 2, 660, W, 44, { color: "#2a3320" });
      addStatic(m, W / 2, 470, 540, 60, { color: "#4a3420" });
      addWallGap(m, 375, 380, 640, 560, 92, 44, "#4a3420");
      addWallGap(m, W - 375, 380, 640, 560, 92, 44, "#4a3420");
      addTree(m, 190, 638, 0.9);
      addTree(m, W - 190, 638, 0.9);
      addAlcove(m, W / 2, 638, 210, 92, 1, "#2a3320");
    }, s: [{ x: 190, y: 120 }, { x: W - 190, y: 120 }, { x: W / 2 - 130, y: 120 }, { x: W / 2 + 130, y: 120 }] },
    { n: "Ancient Oak", b(m) {
      addStatic(m, W / 2, 660, W, 44, { color: "#2a3320" });
      addStatic(m, 220, 470, 240, 26, { color: "#2a3320" });
      addStatic(m, W - 220, 470, 240, 26, { color: "#2a3320" });
      addTree(m, W / 2, 638, 1.7);
      addCoverPillar(m, 430, 638, 100);
      addCoverPillar(m, W - 430, 638, 100);
    }, s: [{ x: 220, y: 410 }, { x: W - 220, y: 410 }, { x: 120, y: 120 }, { x: W - 120, y: 120 }] },
    { n: "Treetops", b(m) {
      addStatic(m, 200, 560, 300, 26, { color: "#2a3320" });
      addStatic(m, W - 200, 560, 300, 26, { color: "#2a3320" });
      addStatic(m, W / 2, 440, 260, 26, { color: "#2a3320" });
      addTree(m, 200, 547, 0.85);
      addTree(m, W - 200, 547, 0.85);
      addTree(m, W / 2, 427, 0.8);
      addLava(m, H - 6);
    }, s: [{ x: 200, y: 500 }, { x: W - 200, y: 500 }, { x: W / 2, y: 380 }, { x: W / 2, y: 120 }] },
    { n: "Root Cellar", cozy: true, b(m) {
      addStatic(m, W / 2, 660, W, 44, { color: "#2a2418" });
      addStatic(m, W / 2, 380, 720, 26, { color: "#2a2418" });
      addWallGap(m, 340, 405, 660, 585, 94, 46, "#3a2f20");
      addWallGap(m, W - 340, 405, 660, 585, 94, 46, "#3a2f20");
      addAlcove(m, 150, 638, 160, 96, 1, "#2a2418");
      addAlcove(m, W - 150, 638, 160, 96, -1, "#2a2418");
      addCoverPillar(m, W / 2, 638, 90);
    }, s: [{ x: 200, y: 330 }, { x: W - 200, y: 330 }, { x: W / 2 - 150, y: 120 }, { x: W / 2 + 150, y: 120 }] }
  ]);

  // src/sim/content.js
  Object.assign(SPELLS, STARTERS, BOOK_SPELLS, HYBRID_SPELLS);
  classifyAllCasts();

  // src/render/artkit.js
  var artkit_exports = {};
  __export(artkit_exports, {
    INK: () => INK,
    PARCHMENT: () => PARCHMENT,
    VAL_BRONZE: () => VAL_BRONZE,
    VAL_GOLD: () => VAL_GOLD,
    VAL_HAIR: () => VAL_HAIR,
    VAL_HAIR_HI: () => VAL_HAIR_HI,
    VAL_OX: () => VAL_OX,
    VAL_RIM: () => VAL_RIM,
    VAL_SKIN: () => VAL_SKIN,
    VAL_SKIN_SH: () => VAL_SKIN_SH,
    avatarVariant: () => avatarVariant,
    drawSecretBoss: () => drawSecretBoss,
    drawStar: () => drawStar,
    drawStoryBackdrop: () => drawStoryBackdrop,
    drawStoryBoss: () => drawStoryBoss,
    drawStoryCatalyst: () => drawStoryCatalyst,
    drawStoryCrate: () => drawStoryCrate,
    drawStoryDestructible: () => drawStoryDestructible,
    drawStoryGandalf: () => drawStoryGandalf,
    drawStoryHat: () => drawStoryHat,
    drawStoryParticles: () => drawStoryParticles,
    drawStorySorceress: () => drawStorySorceress,
    drawStorySpikes: () => drawStorySpikes,
    drawStoryTerrain: () => drawStoryTerrain,
    drawStoryTome: () => drawStoryTome,
    drawStoryWizard: () => drawStoryWizard,
    glowOrb: () => glowOrb,
    mix: () => mix,
    rgba: () => rgba,
    runeRing: () => runeRing,
    setAvatarVariant: () => setAvatarVariant,
    shade: () => shade
  });
  function _hx(hex) {
    if (typeof hex !== "string" || hex[0] !== "#") return { r: 150, g: 140, b: 165 };
    let h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 };
  }
  function shade(hex, amt) {
    const c = _hx(hex), t = amt < 0 ? 0 : 255, p = Math.min(1, Math.abs(amt));
    const m = (v) => Math.round(v + (t - v) * p);
    return `rgb(${m(c.r)},${m(c.g)},${m(c.b)})`;
  }
  function rgba(hex, a) {
    const c = _hx(hex);
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }
  function mix(a, b, t) {
    const x = _hx(a), y = _hx(b), m = (u, v) => Math.round(u + (v - u) * t);
    return `rgb(${m(x.r, y.r)},${m(x.g, y.g)},${m(x.b, y.b)})`;
  }
  var PARCHMENT = "#e8d2b0";
  var INK = "#2a1f38";
  function runeRing(ctx2, x, y, r, color, now, o = {}) {
    const n = o.count || 6, spin = o.spin ?? 18e-4;
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(now * spin);
    ctx2.globalAlpha = o.alpha ?? 0.85;
    ctx2.strokeStyle = color;
    ctx2.lineWidth = o.lw || 1;
    ctx2.beginPath();
    ctx2.arc(0, 0, r, 0, Math.PI * 2);
    ctx2.stroke();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      ctx2.beginPath();
      ctx2.moveTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
      ctx2.lineTo(Math.cos(a) * (r + 2.5), Math.sin(a) * (r + 2.5));
      ctx2.stroke();
    }
    ctx2.restore();
    ctx2.globalAlpha = 1;
  }
  function glowOrb(ctx2, x, y, r, color, alpha = 1) {
    const g = ctx2.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(shade(color, 0.55), alpha));
    g.addColorStop(0.4, rgba(color, alpha));
    g.addColorStop(1, rgba(color, 0));
    ctx2.fillStyle = g;
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, Math.PI * 2);
    ctx2.fill();
  }
  function baseAvatarVariant(name) {
    const n = (name || "").toLowerCase();
    if (/a\s*linea/.test(n)) return "alinea";
    if (/grey|gray|gandalf|szarz/.test(n)) return "grey";
    return null;
  }
  var avatarVariant = baseAvatarVariant;
  function setAvatarVariant(fn) {
    avatarVariant = fn;
  }
  function drawStoryWizard(ctx2, o) {
    if (o.variant === "alinea") return drawStorySorceress(ctx2, o);
    if (o.variant === "grey") return drawStoryGandalf(ctx2, o);
    const scale2 = o.scale ?? 1, now = o.now || 0, facing = o.facing || 1;
    const piggy = !!o.piggy, alive = o.alive !== false && o.alive !== 0;
    const col = piggy ? "#ff9ecb" : o.color || "#b98cff";
    const hatc = o.hat || "#6c4bd6";
    const ink = shade(col, -0.62), lift = shade(col, 0.42), dark = shade(col, -0.32);
    const hp = o.hp ?? 100;
    const f = Math.min(1, Math.abs(o.vx || 0) / 6);
    const ph = o.walkPhase || 0;
    ctx2.save();
    ctx2.translate(o.x, o.y);
    ctx2.rotate(o.angle || 0);
    ctx2.scale(scale2, scale2);
    ctx2.translate(0, Math.sin(ph) * 0.8 * f);
    ctx2.lineJoin = "round";
    ctx2.lineCap = "round";
    ctx2.fillStyle = shade(hatc, -0.2);
    for (const side of [0, Math.PI]) {
      const sp = ph + side;
      const bx = Math.sin(sp) * 5 * f * facing + (side ? 3 : -3) * (1 - f * 0.5);
      const lft = Math.max(0, Math.cos(sp)) * 3 * f;
      ctx2.beginPath();
      ctx2.ellipse(bx, 15 - lft, 3.4, 2.2, 0, 0, Math.PI * 2);
      ctx2.fill();
    }
    const sway = Math.sin(now * 4e-3 + ph) * 1.4 + facing * f * 2.5;
    const hemL = -9 - (facing < 0 ? f * 3 : 0);
    const hemR = 9 + (facing > 0 ? f * 3 : 0);
    ctx2.beginPath();
    ctx2.moveTo(-4.5, -6);
    ctx2.quadraticCurveTo(-8, 4, hemL + sway * 0.3, 15);
    ctx2.quadraticCurveTo(-3, 17, 0, 16.5);
    ctx2.quadraticCurveTo(3, 17, hemR + sway * 0.3, 15);
    ctx2.quadraticCurveTo(8, 4, 4.5, -6);
    ctx2.closePath();
    const rg = ctx2.createLinearGradient(0, -6, 0, 16);
    rg.addColorStop(0, shade(col, 0.12));
    rg.addColorStop(0.55, col);
    rg.addColorStop(1, dark);
    ctx2.fillStyle = rg;
    ctx2.fill();
    ctx2.strokeStyle = rgba(shade(col, -0.4), 0.5);
    ctx2.lineWidth = 1;
    for (const fx of [-3.5, 0.5, 4]) {
      ctx2.beginPath();
      ctx2.moveTo(fx * 0.4, -4);
      ctx2.quadraticCurveTo(fx * 0.8, 6, fx + sway * 0.25, 14);
      ctx2.stroke();
    }
    ctx2.strokeStyle = rgba(lift, 0.7);
    ctx2.lineWidth = 1.2;
    ctx2.beginPath();
    ctx2.moveTo(facing * 4.6, -5.5);
    ctx2.quadraticCurveTo(facing * 7.5, 4, (facing > 0 ? hemR : hemL) + sway * 0.3, 14.5);
    ctx2.stroke();
    ctx2.strokeStyle = ink;
    ctx2.lineWidth = 0.9;
    ctx2.beginPath();
    ctx2.moveTo(-4.5, -6);
    ctx2.quadraticCurveTo(-8, 4, hemL + sway * 0.3, 15);
    ctx2.quadraticCurveTo(0, 17.5, hemR + sway * 0.3, 15);
    ctx2.quadraticCurveTo(8, 4, 4.5, -6);
    ctx2.stroke();
    ctx2.strokeStyle = dark;
    ctx2.lineWidth = 3.4;
    ctx2.beginPath();
    ctx2.moveTo(-facing * 2, -4);
    ctx2.quadraticCurveTo(-facing * 7, 0, -facing * 6.5, 5);
    ctx2.stroke();
    ctx2.strokeStyle = col;
    ctx2.lineWidth = 3.6;
    const reach = o.spellReady ? 1 : 0.7;
    ctx2.beginPath();
    ctx2.moveTo(facing * 2, -4);
    ctx2.quadraticCurveTo(facing * 8, -6 * reach, facing * 11, -6 * reach - 1);
    ctx2.stroke();
    ctx2.fillStyle = PARCHMENT;
    ctx2.beginPath();
    ctx2.arc(0, -11, 5.4, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = rgba(INK, 0.12);
    ctx2.beginPath();
    ctx2.arc(0, -13.5, 5.4, Math.PI, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = rgba(INK, 0.5);
    ctx2.lineWidth = 0.8;
    ctx2.beginPath();
    ctx2.arc(0, -11, 5.4, 0, Math.PI * 2);
    ctx2.stroke();
    if (piggy) {
      ctx2.fillStyle = "#ff7eb6";
      ctx2.beginPath();
      ctx2.arc(facing * 4.5, -10, 2.4, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "#d84f8f";
      ctx2.beginPath();
      ctx2.arc(facing * 4, -10.6, 0.5, 0, Math.PI * 2);
      ctx2.arc(facing * 5, -10.6, 0.5, 0, Math.PI * 2);
      ctx2.fill();
    } else {
      ctx2.fillStyle = INK;
      ctx2.beginPath();
      ctx2.arc(facing * 2.4, -11, 0.9, 0, Math.PI * 2);
      ctx2.fill();
    }
    if (hp >= 50) {
      ctx2.save();
      if (hp < 75) {
        ctx2.translate(facing * 2, -15);
        ctx2.rotate(facing * 0.4);
        ctx2.translate(0, 15);
      }
      ctx2.fillStyle = shade(hatc, -0.15);
      ctx2.beginPath();
      ctx2.ellipse(0, -15.5, 12, 3.2, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(-8.5, -15);
      ctx2.quadraticCurveTo(-4, -26, facing * 2, -31);
      ctx2.quadraticCurveTo(facing * 7, -33, facing * 8.5, -29);
      ctx2.quadraticCurveTo(2, -24, 8.5, -15);
      ctx2.closePath();
      const hg = ctx2.createLinearGradient(-8, -15, 8, -30);
      hg.addColorStop(0, shade(hatc, -0.25));
      hg.addColorStop(0.5, hatc);
      hg.addColorStop(1, shade(hatc, 0.25));
      ctx2.fillStyle = hg;
      ctx2.fill();
      ctx2.strokeStyle = shade(hatc, -0.55);
      ctx2.lineWidth = 0.9;
      ctx2.stroke();
      ctx2.strokeStyle = shade(hatc, 0.4);
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.moveTo(-8, -16);
      ctx2.quadraticCurveTo(0, -14.5, 8, -16);
      ctx2.stroke();
      drawStar(ctx2, facing * 1, -16, 2.1, mix(hatc, "#fff6c8", 0.7));
      if (hp >= 75 && alive && !piggy) {
        ctx2.globalAlpha = 0.35 + 0.15 * Math.sin(now * 4e-3);
        runeRing(ctx2, facing * 2, -20, 9, rgba(mix(hatc, "#fff", 0.4), 1), now, { count: 5, lw: 0.6, alpha: 1 });
        ctx2.globalAlpha = 1;
      }
      ctx2.restore();
    }
    if (hp < 25 && alive) {
      for (let i = 0; i < 3; i++) {
        const t = (now * 0.05 + i * 37) % 30;
        ctx2.globalAlpha = 0.4 * (1 - t / 30);
        ctx2.fillStyle = mix("#8a7ba0", "#ffb27a", 0.3);
        ctx2.beginPath();
        ctx2.arc(Math.sin(now * 4e-3 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.globalAlpha = 1;
    }
    if (o.spellReady) {
      const sc = o.spellColor || "#fff";
      glowOrb(ctx2, facing * 12, -7, 4.5 + Math.sin(now * 8e-3) * 0.8, sc, 0.9);
      runeRing(ctx2, facing * 12, -7, 5, rgba(sc, 1), now, { count: 4, lw: 0.7, spin: 4e-3 });
    }
    ctx2.restore();
  }
  function drawStar(ctx2, x, y, r, color) {
    ctx2.fillStyle = color;
    ctx2.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      ctx2[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx2.closePath();
    ctx2.fill();
  }
  var VAL_SKIN = "#c98a5a";
  var VAL_SKIN_SH = "#7f5231";
  var VAL_HAIR = "#3a1e12";
  var VAL_HAIR_HI = "#7a4a28";
  var VAL_BRONZE = "#c48a2c";
  var VAL_GOLD = "#e6bd6a";
  var VAL_OX = "#6e2230";
  var VAL_RIM = "#ffcf8a";
  function drawStorySorceress(ctx2, o) {
    const scale2 = o.scale ?? 1, now = o.now || 0, facing = o.facing || 1;
    const piggy = !!o.piggy, alive = o.alive !== false && o.alive !== 0;
    const leather = piggy ? "#c86a8a" : mix("#2a1c12", o.color || "#2a1c12", 0.4);
    const skin = piggy ? "#ff9ecb" : VAL_SKIN;
    const hp = o.hp ?? 100;
    const f = Math.min(1, Math.abs(o.vx || 0) / 6);
    const ph = o.walkPhase || 0;
    ctx2.save();
    ctx2.translate(o.x, o.y);
    ctx2.rotate(o.angle || 0);
    ctx2.scale(scale2, scale2);
    ctx2.translate(0, Math.sin(ph) * 0.8 * f);
    ctx2.lineJoin = "round";
    ctx2.lineCap = "round";
    if (alive) {
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      glowOrb(ctx2, facing * -2, -2, 22 + Math.sin(now * 4e-3) * 2, VAL_RIM, 0.09);
      ctx2.restore();
    }
    const cs = Math.sin(now * 35e-4) * 2;
    ctx2.beginPath();
    ctx2.moveTo(-facing * 3, -7);
    ctx2.quadraticCurveTo(-facing * 13 + cs, -2, -facing * 12 + cs, 16);
    ctx2.quadraticCurveTo(-facing * 6, 13, -facing * 2, 14);
    ctx2.quadraticCurveTo(-facing * 4, 2, -facing * 3, -7);
    ctx2.closePath();
    const cg = ctx2.createLinearGradient(0, -7, -facing * 12, 16);
    cg.addColorStop(0, VAL_OX);
    cg.addColorStop(1, shade(VAL_OX, -0.5));
    ctx2.fillStyle = cg;
    ctx2.fill();
    ctx2.strokeStyle = rgba(VAL_RIM, 0.4);
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(-facing * 3, -7);
    ctx2.quadraticCurveTo(-facing * 13 + cs, -2, -facing * 12 + cs, 16);
    ctx2.stroke();
    const hg = ctx2.createLinearGradient(0, -14, -facing * 6, 10);
    hg.addColorStop(0, VAL_HAIR_HI);
    hg.addColorStop(1, VAL_HAIR);
    ctx2.strokeStyle = hg;
    ctx2.lineWidth = 3.4;
    for (const k of [0, 1]) {
      const sw = Math.sin(now * 4e-3 + k) * 2;
      ctx2.beginPath();
      ctx2.moveTo(-facing * 1 + k * 2, -13);
      ctx2.quadraticCurveTo(-facing * 7 + sw, -2, -facing * 5 + sw, 8 + k * 2);
      ctx2.stroke();
    }
    for (const side of [0, Math.PI]) {
      const sp = ph + side;
      const bx = Math.sin(sp) * 5 * f * facing + (side ? 3 : -3) * (1 - f * 0.5);
      const lft = Math.max(0, Math.cos(sp)) * 3 * f;
      const bg = ctx2.createLinearGradient(bx - 2, 7, bx + 2, 16);
      bg.addColorStop(0, shade(leather, 0.15));
      bg.addColorStop(1, shade(leather, -0.3));
      ctx2.fillStyle = bg;
      ctx2.beginPath();
      ctx2.ellipse(bx, 15 - lft, 3, 2.4, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillRect(bx - 2, 5 - lft, 4, 10);
      ctx2.strokeStyle = rgba(VAL_BRONZE, 0.7);
      ctx2.lineWidth = 0.5;
      for (let ly = 6; ly < 14; ly += 2.5) {
        ctx2.beginPath();
        ctx2.moveTo(bx - 1.6, ly - lft);
        ctx2.lineTo(bx + 1.6, ly - lft);
        ctx2.stroke();
      }
    }
    ctx2.beginPath();
    ctx2.moveTo(-3, 2);
    ctx2.quadraticCurveTo(-10, 8, -8.5, 16);
    ctx2.quadraticCurveTo(0, 18, 8.5, 16);
    ctx2.quadraticCurveTo(10, 8, 3, 2);
    ctx2.closePath();
    const sg = ctx2.createLinearGradient(0, 2, 0, 16);
    sg.addColorStop(0, shade(leather, 0.12));
    sg.addColorStop(1, shade(leather, -0.4));
    ctx2.fillStyle = sg;
    ctx2.fill();
    ctx2.strokeStyle = rgba(shade(leather, -0.5), 0.6);
    ctx2.lineWidth = 0.8;
    for (const px of [-5, -1.5, 1.5, 5]) {
      ctx2.beginPath();
      ctx2.moveTo(px * 0.5, 3);
      ctx2.lineTo(px, 15.5);
      ctx2.stroke();
    }
    ctx2.strokeStyle = VAL_BRONZE;
    ctx2.lineWidth = 1.8;
    ctx2.beginPath();
    ctx2.moveTo(-4, 2.5);
    ctx2.quadraticCurveTo(0, 4, 4, 2.5);
    ctx2.stroke();
    ctx2.fillStyle = VAL_GOLD;
    ctx2.beginPath();
    ctx2.arc(0, 3.2, 1.3, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = skin;
    ctx2.fillRect(-2.6, -0.5, 5.2, 3);
    ctx2.fillStyle = rgba(VAL_SKIN_SH, 0.5);
    ctx2.fillRect(-2.6, 1.2, 5.2, 1.3);
    ctx2.strokeStyle = shade(skin, -0.25);
    ctx2.lineWidth = 2.4;
    ctx2.beginPath();
    ctx2.moveTo(-facing * 2, -4);
    ctx2.quadraticCurveTo(-facing * 7, 0, -facing * 6, 5);
    ctx2.stroke();
    ctx2.strokeStyle = VAL_BRONZE;
    ctx2.lineWidth = 2.6;
    ctx2.beginPath();
    ctx2.moveTo(-facing * 5.4, 3);
    ctx2.lineTo(-facing * 6.2, 5.2);
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.moveTo(-4.6, -6.5);
    ctx2.quadraticCurveTo(-5.4, -2.5, -2.6, 0);
    ctx2.quadraticCurveTo(0, 1.4, 2.6, 0);
    ctx2.quadraticCurveTo(5.4, -2.5, 4.6, -6.5);
    ctx2.quadraticCurveTo(0, -4.2, -4.6, -6.5);
    ctx2.closePath();
    const bg2 = ctx2.createLinearGradient(-5, -6, 5, 1);
    bg2.addColorStop(0, shade(leather, 0.2));
    bg2.addColorStop(0.5, leather);
    bg2.addColorStop(1, shade(leather, -0.35));
    ctx2.fillStyle = bg2;
    ctx2.fill();
    ctx2.fillStyle = skin;
    ctx2.beginPath();
    ctx2.moveTo(-4.4, -6.6);
    ctx2.quadraticCurveTo(0, -4.4, 4.4, -6.6);
    ctx2.quadraticCurveTo(0, -8.6, -4.4, -6.6);
    ctx2.fill();
    ctx2.strokeStyle = rgba(VAL_SKIN_SH, 0.6);
    ctx2.lineWidth = 0.7;
    ctx2.beginPath();
    ctx2.moveTo(0, -6.8);
    ctx2.lineTo(0, -5.2);
    ctx2.stroke();
    ctx2.strokeStyle = VAL_GOLD;
    ctx2.lineWidth = 0.6;
    for (let ly = -5.5; ly < 0; ly += 1.5) {
      ctx2.beginPath();
      ctx2.moveTo(-1.4, ly);
      ctx2.lineTo(1.4, ly + 0.6);
      ctx2.moveTo(1.4, ly);
      ctx2.lineTo(-1.4, ly + 0.6);
      ctx2.stroke();
    }
    ctx2.strokeStyle = VAL_BRONZE;
    ctx2.lineWidth = 0.9;
    ctx2.beginPath();
    ctx2.arc(0, -6.5, 5, Math.PI * 1.08, Math.PI * 1.92);
    ctx2.stroke();
    ctx2.strokeStyle = skin;
    ctx2.lineWidth = 2.4;
    ctx2.beginPath();
    ctx2.moveTo(facing * 2, -4);
    ctx2.quadraticCurveTo(facing * 8, -6, facing * 10, -8);
    ctx2.stroke();
    ctx2.strokeStyle = VAL_BRONZE;
    ctx2.lineWidth = 2.6;
    ctx2.beginPath();
    ctx2.moveTo(facing * 6.5, -6.6);
    ctx2.lineTo(facing * 8.2, -7.4);
    ctx2.stroke();
    const wood = "#4a3120";
    ctx2.strokeStyle = wood;
    ctx2.lineWidth = 1.7;
    ctx2.beginPath();
    ctx2.moveTo(facing * 10, -8);
    ctx2.lineTo(facing * 12.5, -26);
    ctx2.stroke();
    ctx2.strokeStyle = VAL_BRONZE;
    ctx2.lineWidth = 2.2;
    ctx2.beginPath();
    ctx2.moveTo(facing * 12, -22);
    ctx2.lineTo(facing * 13, -28);
    ctx2.stroke();
    if (alive) {
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      glowOrb(ctx2, facing * 13, -28, 5, "#ffab5e", 0.85);
      ctx2.restore();
    }
    ctx2.fillStyle = "#c85a2a";
    ctx2.beginPath();
    ctx2.arc(facing * 13, -28, 1.8, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = skin;
    ctx2.beginPath();
    ctx2.arc(0, -11, 5.2, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = rgba(VAL_SKIN_SH, 0.55);
    ctx2.beginPath();
    ctx2.arc(-facing * 1.5, -11, 5.2, Math.PI * 0.5, Math.PI * 1.5, facing < 0);
    ctx2.fill();
    ctx2.fillStyle = hg;
    ctx2.beginPath();
    ctx2.arc(0, -13, 5.7, Math.PI * 1.02, Math.PI * 1.98);
    ctx2.fill();
    if (piggy) {
      ctx2.fillStyle = "#ff7eb6";
      ctx2.beginPath();
      ctx2.arc(facing * 4.2, -10, 2.3, 0, Math.PI * 2);
      ctx2.fill();
    } else {
      ctx2.fillStyle = INK;
      ctx2.beginPath();
      ctx2.ellipse(facing * 2.2, -11, 1, 0.8, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.strokeStyle = shade(VAL_HAIR, 0.1);
      ctx2.lineWidth = 0.7;
      ctx2.beginPath();
      ctx2.moveTo(facing * 0.8, -12.6);
      ctx2.lineTo(facing * 3.8, -12.2);
      ctx2.stroke();
      ctx2.strokeStyle = "#7a2e28";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(-1, -7.6);
      ctx2.lineTo(1.2, -7.6);
      ctx2.stroke();
    }
    ctx2.strokeStyle = rgba(VAL_RIM, 0.7);
    ctx2.lineWidth = 0.9;
    ctx2.beginPath();
    ctx2.arc(0, -11, 5.2, Math.PI * (facing > 0 ? -0.45 : 1.45), Math.PI * (facing > 0 ? 0.4 : 0.55), facing < 0);
    ctx2.stroke();
    if (hp >= 50) {
      ctx2.save();
      if (hp < 75) {
        ctx2.translate(facing * 2, -15);
        ctx2.rotate(facing * 0.4);
        ctx2.translate(0, 15);
      }
      ctx2.strokeStyle = VAL_BRONZE;
      ctx2.lineWidth = 1.8;
      ctx2.beginPath();
      ctx2.arc(0, -12.5, 6, Math.PI * 1.12, Math.PI * 1.88);
      ctx2.stroke();
      ctx2.fillStyle = VAL_GOLD;
      for (const px of [-4.5, 4.5]) {
        ctx2.beginPath();
        ctx2.arc(px, -14.6, 0.9, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      glowOrb(ctx2, 0, -16.5, 3, "#ffab5e", 0.8);
      ctx2.restore();
      ctx2.fillStyle = "#c85a2a";
      ctx2.beginPath();
      ctx2.ellipse(0, -16.5, 1.6, 2, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = rgba("#ffd9a8", 0.9);
      ctx2.beginPath();
      ctx2.arc(-0.5, -17.2, 0.5, 0, Math.PI * 2);
      ctx2.fill();
      if (hp >= 75 && alive && !piggy) {
        ctx2.globalAlpha = 0.3 + 0.15 * Math.sin(now * 5e-3);
        runeRing(ctx2, 0, -16.5, 8, rgba(VAL_RIM, 1), now, { count: 6, lw: 0.6, alpha: 1, spin: 16e-4 });
        ctx2.globalAlpha = 1;
      }
      ctx2.restore();
    }
    if (hp < 25 && alive) {
      for (let i = 0; i < 3; i++) {
        const t = (now * 0.05 + i * 37) % 30;
        ctx2.globalAlpha = 0.4 * (1 - t / 30);
        ctx2.fillStyle = mix("#ffab5e", "#8a6a4a", 0.4);
        ctx2.beginPath();
        ctx2.arc(Math.sin(now * 4e-3 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.globalAlpha = 1;
    }
    if (o.spellReady) {
      const sc = o.spellColor || "#ffab5e";
      glowOrb(ctx2, facing * 12, -7, 4.5 + Math.sin(now * 8e-3) * 0.8, sc, 0.9);
    }
    ctx2.restore();
  }
  function drawStoryGandalf(ctx2, o) {
    const scale2 = o.scale ?? 1, now = o.now || 0, facing = o.facing || 1;
    const piggy = !!o.piggy, alive = o.alive !== false && o.alive !== 0;
    const robe = piggy ? "#ff9ecb" : mix("#8c8794", o.color || "#8c8794", 0.25);
    const beard = "#dcd9e0", hatc = "#6f6a78", wood = "#6b4f34";
    const ink = shade(robe, -0.55), dark = shade(robe, -0.3), lift = shade(robe, 0.4);
    const hp = o.hp ?? 100;
    const f = Math.min(1, Math.abs(o.vx || 0) / 6);
    const ph = o.walkPhase || 0;
    ctx2.save();
    ctx2.translate(o.x, o.y);
    ctx2.rotate(o.angle || 0);
    ctx2.scale(scale2, scale2);
    ctx2.translate(0, Math.sin(ph) * 0.7 * f);
    ctx2.lineJoin = "round";
    ctx2.lineCap = "round";
    ctx2.fillStyle = shade(wood, 0.1);
    for (const side of [0, Math.PI]) {
      const sp = ph + side;
      const bx = Math.sin(sp) * 4 * f * facing + (side ? 3 : -3) * (1 - f * 0.5);
      ctx2.beginPath();
      ctx2.ellipse(bx, 15, 3.2, 2, 0, 0, Math.PI * 2);
      ctx2.fill();
    }
    const sway = Math.sin(now * 3e-3 + ph) * 1.2 + facing * f * 2;
    ctx2.beginPath();
    ctx2.moveTo(-5, -6);
    ctx2.quadraticCurveTo(-9, 4, -10 + sway * 0.3, 16);
    ctx2.quadraticCurveTo(0, 18, 10 + sway * 0.3, 16);
    ctx2.quadraticCurveTo(9, 4, 5, -6);
    ctx2.closePath();
    const rg = ctx2.createLinearGradient(0, -6, 0, 16);
    rg.addColorStop(0, shade(robe, 0.1));
    rg.addColorStop(0.55, robe);
    rg.addColorStop(1, dark);
    ctx2.fillStyle = rg;
    ctx2.fill();
    ctx2.strokeStyle = rgba(shade(robe, -0.4), 0.5);
    ctx2.lineWidth = 1;
    for (const fx of [-4, 0, 4]) {
      ctx2.beginPath();
      ctx2.moveTo(fx * 0.4, -4);
      ctx2.quadraticCurveTo(fx * 0.8, 6, fx + sway * 0.25, 15);
      ctx2.stroke();
    }
    ctx2.strokeStyle = rgba(lift, 0.6);
    ctx2.lineWidth = 1.1;
    ctx2.beginPath();
    ctx2.moveTo(facing * 5, -5.5);
    ctx2.quadraticCurveTo(facing * 8.5, 4, (facing > 0 ? 10 : -10) + sway * 0.3, 15.5);
    ctx2.stroke();
    ctx2.strokeStyle = ink;
    ctx2.lineWidth = 0.9;
    ctx2.beginPath();
    ctx2.moveTo(-5, -6);
    ctx2.quadraticCurveTo(-9, 4, -10 + sway * 0.3, 16);
    ctx2.quadraticCurveTo(0, 18.5, 10 + sway * 0.3, 16);
    ctx2.quadraticCurveTo(9, 4, 5, -6);
    ctx2.stroke();
    ctx2.fillStyle = shade(robe, -0.18);
    ctx2.beginPath();
    ctx2.moveTo(-6, -4);
    ctx2.quadraticCurveTo(0, 2, 6, -4);
    ctx2.quadraticCurveTo(0, -7, -6, -4);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = dark;
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.moveTo(-facing * 2, -3);
    ctx2.quadraticCurveTo(-facing * 7, 1, -facing * 6, 6);
    ctx2.stroke();
    ctx2.strokeStyle = robe;
    ctx2.lineWidth = 3.2;
    ctx2.beginPath();
    ctx2.moveTo(facing * 2, -3);
    ctx2.quadraticCurveTo(facing * 8, -2, facing * 9, 0);
    ctx2.stroke();
    ctx2.strokeStyle = wood;
    ctx2.lineWidth = 1.8;
    ctx2.beginPath();
    ctx2.moveTo(facing * 9, -18);
    ctx2.quadraticCurveTo(facing * 10, 0, facing * 9.5, 17);
    ctx2.stroke();
    ctx2.fillStyle = shade(wood, 0.15);
    ctx2.beginPath();
    ctx2.arc(facing * 9, -18, 2.4, 0, Math.PI * 2);
    ctx2.fill();
    if (o.spellReady) {
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      glowOrb(ctx2, facing * 9, -18, 6, o.spellColor || "#cfe0ff", 0.85);
      ctx2.restore();
    }
    ctx2.fillStyle = PARCHMENT;
    ctx2.beginPath();
    ctx2.arc(0, -11, 5.2, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = rgba(INK, 0.16);
    ctx2.beginPath();
    ctx2.arc(0, -12.5, 5.2, Math.PI, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = INK;
    ctx2.beginPath();
    ctx2.arc(facing * 2.2, -11.4, 0.8, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = beard;
    ctx2.lineWidth = 1.4;
    ctx2.beginPath();
    ctx2.moveTo(facing * 0.6, -13.4);
    ctx2.lineTo(facing * 4, -12.8);
    ctx2.stroke();
    ctx2.fillStyle = beard;
    ctx2.beginPath();
    ctx2.moveTo(-4.5, -9);
    ctx2.quadraticCurveTo(-5.5, -1, -2.5, 4);
    ctx2.quadraticCurveTo(0, 7 + Math.sin(now * 4e-3) * 0.6, 2.5, 4);
    ctx2.quadraticCurveTo(5.5, -1, 4.5, -9);
    ctx2.quadraticCurveTo(0, -6, -4.5, -9);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = rgba("#b8b4c0", 0.6);
    ctx2.lineWidth = 0.5;
    ctx2.beginPath();
    ctx2.moveTo(-1.5, -6);
    ctx2.lineTo(-1, 4);
    ctx2.moveTo(1.5, -6);
    ctx2.lineTo(1, 4);
    ctx2.stroke();
    ctx2.fillStyle = beard;
    ctx2.beginPath();
    ctx2.moveTo(-3, -8.5);
    ctx2.quadraticCurveTo(0, -6.5, 3, -8.5);
    ctx2.quadraticCurveTo(0, -7.2, -3, -8.5);
    ctx2.fill();
    if (hp >= 50) {
      ctx2.save();
      if (hp < 75) {
        ctx2.translate(facing * 2, -15);
        ctx2.rotate(facing * 0.36);
        ctx2.translate(0, 15);
      }
      ctx2.fillStyle = shade(hatc, -0.2);
      ctx2.beginPath();
      ctx2.ellipse(0, -15, 13, 3.6, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(-8, -15);
      ctx2.quadraticCurveTo(-5, -27, facing * 1, -33);
      ctx2.quadraticCurveTo(facing * 6, -35, facing * 6.5, -31);
      ctx2.quadraticCurveTo(2, -25, 8, -15);
      ctx2.closePath();
      const hgd = ctx2.createLinearGradient(-8, -15, 8, -32);
      hgd.addColorStop(0, shade(hatc, -0.25));
      hgd.addColorStop(0.5, hatc);
      hgd.addColorStop(1, shade(hatc, 0.2));
      ctx2.fillStyle = hgd;
      ctx2.fill();
      ctx2.strokeStyle = shade(hatc, -0.5);
      ctx2.lineWidth = 0.9;
      ctx2.stroke();
      ctx2.strokeStyle = rgba(shade(hatc, -0.4), 0.7);
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.moveTo(-7.5, -16);
      ctx2.quadraticCurveTo(0, -14.5, 7.5, -16);
      ctx2.stroke();
      ctx2.restore();
    }
    if (hp < 25 && alive) {
      for (let i = 0; i < 3; i++) {
        const t = (now * 0.05 + i * 37) % 30;
        ctx2.globalAlpha = 0.4 * (1 - t / 30);
        ctx2.fillStyle = "#9c96a6";
        ctx2.beginPath();
        ctx2.arc(Math.sin(now * 4e-3 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.globalAlpha = 1;
    }
    ctx2.restore();
  }
  function drawStoryTome(ctx2, o) {
    const now = o.now || 0, color = o.color || "#b98cff";
    const rank = o.rank || 0;
    const bob = Math.sin(now * 3e-3 + o.x * 0.05) * 1.5;
    if (rank >= 2 && o.rarityColor) {
      const pulse = 0.5 + 0.5 * Math.sin(now * (rank >= 3 ? 0.012 : 8e-3));
      glowOrb(ctx2, o.x, o.y + bob, 22 + 8 * pulse + rank * 3, o.rarityColor, 0.35 + 0.2 * pulse);
    }
    ctx2.save();
    ctx2.translate(o.x, o.y + bob);
    ctx2.rotate((o.angle || 0) * 0.5);
    const leather = shade(color, -0.5);
    const cg = ctx2.createLinearGradient(-11, 0, 11, 0);
    cg.addColorStop(0, shade(leather, -0.3));
    cg.addColorStop(0.5, leather);
    cg.addColorStop(1, shade(leather, 0.2));
    ctx2.fillStyle = PARCHMENT;
    ctx2.fillRect(-6, -13, 15, 26);
    ctx2.strokeStyle = rgba(INK, 0.3);
    ctx2.lineWidth = 0.5;
    for (let i = -10; i < 12; i += 2.5) {
      ctx2.beginPath();
      ctx2.moveTo(8.5, i);
      ctx2.lineTo(9.5, i);
      ctx2.stroke();
    }
    ctx2.fillStyle = cg;
    ctx2.beginPath();
    ctx2.roundRect ? ctx2.roundRect(-10, -14, 17, 28, 2) : ctx2.rect(-10, -14, 17, 28);
    ctx2.fill();
    ctx2.fillStyle = color;
    ctx2.fillRect(-10, -14, 3.5, 28);
    ctx2.strokeStyle = shade(color, 0.4);
    ctx2.lineWidth = 0.6;
    ctx2.strokeRect(-10, -14, 3.5, 28);
    ctx2.shadowColor = color;
    ctx2.shadowBlur = 8 + 4 * Math.sin(now * 8e-3);
    drawStar(ctx2, -1.5, 0, 5, color);
    ctx2.shadowBlur = 0;
    runeRing(ctx2, -1.5, 0, 7, rgba(color, 1), now, { count: 6, lw: 0.7, alpha: 0.7 });
    ctx2.fillStyle = mix(color, "#ffe9a8", 0.6);
    ctx2.fillRect(6, -3, 3, 6);
    ctx2.strokeStyle = rgba(INK, 0.6);
    ctx2.lineWidth = 0.9;
    ctx2.strokeRect(-10, -14, 17, 28);
    ctx2.restore();
  }
  function drawStoryHat(ctx2, o) {
    const now = o.now || 0, gold = "#ffd700";
    const bob = Math.sin(now * 4e-3) * 2;
    ctx2.save();
    ctx2.translate(o.x, o.y + bob);
    ctx2.rotate((o.angle || 0) * 0.4);
    glowOrb(ctx2, 0, -4, 20 + 4 * Math.sin(now * 0.01), gold, 0.4);
    ctx2.shadowColor = gold;
    ctx2.shadowBlur = 12;
    ctx2.fillStyle = shade(gold, -0.15);
    ctx2.beginPath();
    ctx2.ellipse(0, 7, 15, 4, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.beginPath();
    ctx2.moveTo(-11, 7);
    ctx2.quadraticCurveTo(-5, -12, 3, -16);
    ctx2.quadraticCurveTo(9, -18, 10, -13);
    ctx2.quadraticCurveTo(4, -6, 11, 7);
    ctx2.closePath();
    const hg = ctx2.createLinearGradient(-11, 7, 10, -16);
    hg.addColorStop(0, "#c99700");
    hg.addColorStop(0.5, gold);
    hg.addColorStop(1, "#fff3b0");
    ctx2.fillStyle = hg;
    ctx2.fill();
    ctx2.shadowBlur = 0;
    ctx2.strokeStyle = "#8a6a00";
    ctx2.lineWidth = 2.5;
    ctx2.beginPath();
    ctx2.moveTo(-10, 4);
    ctx2.quadraticCurveTo(0, 6, 10, 3);
    ctx2.stroke();
    drawStar(ctx2, 0, 3.5, 2.6, "#fff3b0");
    drawStar(ctx2, -5, -3, 1.6, "#fff8d8");
    drawStar(ctx2, 4, -8, 1.4, "#fff8d8");
    ctx2.restore();
  }
  function drawStoryCatalyst(ctx2, o) {
    const now = o.now || 0, mag = "#ff4df0";
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.01);
    glowOrb(ctx2, o.x, o.y, 20 + 9 * pulse, mag, 0.45);
    ctx2.save();
    ctx2.translate(o.x, o.y);
    ctx2.rotate(now * 4e-3);
    ctx2.shadowColor = mag;
    ctx2.shadowBlur = 14 + 6 * pulse;
    const g = ctx2.createLinearGradient(0, -12, 0, 12);
    g.addColorStop(0, "#ffd6fb");
    g.addColorStop(0.5, mag);
    g.addColorStop(1, "#a01e9a");
    ctx2.fillStyle = g;
    ctx2.beginPath();
    ctx2.moveTo(0, -13);
    ctx2.lineTo(11, -2);
    ctx2.lineTo(6, 12);
    ctx2.lineTo(-6, 12);
    ctx2.lineTo(-11, -2);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = rgba("#ffd6fb", 0.8);
    ctx2.lineWidth = 0.8;
    ctx2.beginPath();
    ctx2.moveTo(0, -13);
    ctx2.lineTo(0, 12);
    ctx2.moveTo(-11, -2);
    ctx2.lineTo(11, -2);
    ctx2.stroke();
    ctx2.shadowBlur = 0;
    ctx2.fillStyle = rgba("#fff", 0.85);
    ctx2.beginPath();
    ctx2.moveTo(0, -8);
    ctx2.lineTo(4, -2);
    ctx2.lineTo(0, 3);
    ctx2.lineTo(-4, -2);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();
    runeRing(ctx2, o.x, o.y, 16, rgba(mag, 1), now, { count: 8, lw: 0.8, alpha: 0.5, spin: -3e-3 });
  }
  function drawStoryCrate(ctx2, o) {
    const wood = "#a6763c";
    ctx2.save();
    ctx2.fillStyle = wood;
    ctx2.strokeStyle = shade(wood, -0.35);
    ctx2.lineWidth = 5;
    ctx2.lineJoin = "round";
    ctx2.beginPath();
    const v = o.vertices;
    ctx2.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx2.lineTo(v[i].x, v[i].y);
    ctx2.closePath();
    ctx2.fill();
    ctx2.stroke();
    ctx2.translate(o.x, o.y);
    ctx2.rotate(o.angle || 0);
    const gg = ctx2.createLinearGradient(0, -10, 0, 10);
    gg.addColorStop(0, rgba("#ffffff", 0.18));
    gg.addColorStop(0.5, rgba("#ffffff", 0));
    gg.addColorStop(1, rgba(INK, 0.22));
    ctx2.fillStyle = gg;
    ctx2.fillRect(-10, -10, 20, 20);
    ctx2.strokeStyle = rgba(shade(wood, -0.4), 0.55);
    ctx2.lineWidth = 1;
    for (const gx of [-4.5, 0, 4.5]) {
      ctx2.beginPath();
      ctx2.moveTo(gx, -9);
      ctx2.lineTo(gx, 9);
      ctx2.stroke();
    }
    ctx2.strokeStyle = rgba(shade(wood, -0.2), 0.4);
    ctx2.beginPath();
    ctx2.moveTo(-9, -3);
    ctx2.lineTo(9, -3);
    ctx2.moveTo(-9, 4);
    ctx2.lineTo(9, 4);
    ctx2.stroke();
    ctx2.strokeStyle = "#3d3550";
    ctx2.lineWidth = 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx2.beginPath();
      ctx2.moveTo(sx * 9, sy * 5);
      ctx2.lineTo(sx * 9, sy * 9);
      ctx2.lineTo(sx * 5, sy * 9);
      ctx2.stroke();
      ctx2.fillStyle = "#5a5070";
      ctx2.beginPath();
      ctx2.arc(sx * 7.5, sy * 7.5, 1, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  }
  function _ridge(ctx2, W2, H2, baseY, amp, freq, sharp, tint, rim, phase) {
    const yAt = (x) => {
      let s = Math.sin(x * freq + phase) * 0.6 + Math.sin(x * freq * 2.3 + phase * 1.6) * 0.4;
      s = s * 0.5 + 0.5;
      if (sharp > 1) s = Math.pow(s, sharp);
      return baseY - amp * s;
    };
    ctx2.beginPath();
    ctx2.moveTo(-30, H2 + 30);
    ctx2.lineTo(-30, yAt(-30));
    for (let x = -30; x <= W2 + 30; x += 22) ctx2.lineTo(x, yAt(x));
    ctx2.lineTo(W2 + 30, H2 + 30);
    ctx2.closePath();
    ctx2.fillStyle = tint;
    ctx2.fill();
    if (rim) {
      ctx2.strokeStyle = rim;
      ctx2.lineWidth = 1.4;
      ctx2.beginPath();
      let first = true;
      for (let x = -30; x <= W2 + 30; x += 22) {
        const y = yAt(x);
        first ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
        first = false;
      }
      ctx2.stroke();
    }
  }
  function drawStoryBackdrop(ctx2, o) {
    const W2 = o.W, H2 = o.H, now = o.now || 0, base2 = o.bg || "#241d2e";
    const icy = !!o.icy, lava2 = o.lavaY != null, space = !!o.stars, acid = !!o.acid;
    const biome = icy ? { accent: "#bfe8ff", far: mix(base2, "#0a1830", 0.5), near: "#233a54", rim: rgba("#eafaff", 0.5), sharp: 2, freq: 0.016 } : lava2 ? { accent: acid ? "#c5f97d" : "#ff8c5a", far: mix(base2, "#160608", 0.5), near: "#2a1518", rim: rgba(acid ? "#c5f97d" : "#ff8c5a", 0.55), sharp: 1.4, freq: 0.011 } : space ? { accent: "#c8b8ff", far: mix(base2, "#0a0818", 0.5), near: shade(base2, -0.5), rim: rgba("#c8b8ff", 0.3), sharp: 1, freq: 0.01 } : { accent: "#b98cff", far: mix(base2, "#0c0818", 0.4), near: shade(base2, -0.45), rim: rgba("#b98cff", 0.28), sharp: 2.4, freq: 0.02 };
    const vg = ctx2.createLinearGradient(0, -30, 0, H2 + 30);
    vg.addColorStop(0, mix(shade(base2, 0.14), biome.accent, 0.14));
    vg.addColorStop(0.5, base2);
    vg.addColorStop(1, lava2 ? mix(shade(base2, -0.2), biome.accent, 0.22) : shade(base2, -0.32));
    ctx2.fillStyle = vg;
    ctx2.fillRect(-30, -30, W2 + 60, H2 + 60);
    if (!lava2) {
      const cx = space ? W2 * 0.78 : W2 * 0.2, cy = H2 * 0.24, cr = space ? 54 : 44;
      glowOrb(ctx2, cx, cy, cr * 2.2, biome.accent, 0.14);
      const mg = ctx2.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, cr * 0.2, cx, cy, cr);
      mg.addColorStop(0, rgba(mix(biome.accent, "#fff", 0.5), 0.9));
      mg.addColorStop(1, rgba(biome.accent, 0.28));
      ctx2.fillStyle = mg;
      ctx2.beginPath();
      ctx2.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx2.fill();
      if (space) {
        ctx2.save();
        ctx2.translate(cx, cy);
        ctx2.rotate(-0.4);
        ctx2.scale(1, 0.32);
        ctx2.strokeStyle = rgba("#e8d2b0", 0.4);
        ctx2.lineWidth = 5;
        ctx2.beginPath();
        ctx2.arc(0, 0, cr + 20, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.restore();
      } else {
        ctx2.fillStyle = rgba(shade(base2, -0.2), 0.5);
        ctx2.beginPath();
        ctx2.arc(cx + cr * 0.35, cy - cr * 0.1, cr, 0, Math.PI * 2);
        ctx2.fill();
      }
      if (icy) {
        for (let k = 0; k < 2; k++) {
          ctx2.strokeStyle = rgba(k ? "#9be1c8" : "#bfe8ff", 0.12);
          ctx2.lineWidth = 18;
          ctx2.beginPath();
          for (let x = 0; x <= W2; x += 40) ctx2[x ? "lineTo" : "moveTo"](x, 120 + k * 34 + Math.sin(x * 6e-3 + now * 6e-4 + k) * 26);
          ctx2.stroke();
        }
      }
    }
    ctx2.strokeStyle = rgba("#e8d2b0", 0.05);
    ctx2.lineWidth = 1;
    for (const [cx, cy, cr] of [[210, 150, 46], [1080, 180, 40]]) {
      ctx2.beginPath();
      ctx2.arc(cx, cy, cr + Math.sin(now * 1e-3) * 2, 0, Math.PI * 2);
      ctx2.stroke();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + now * 4e-4;
        ctx2.beginPath();
        ctx2.arc(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr, 1.2, 0, Math.PI * 2);
        ctx2.fillStyle = rgba("#e8d2b0", 0.12);
        ctx2.fill();
      }
    }
    if (o.stars) {
      for (const s of o.stars) {
        ctx2.globalAlpha = 0.4 + 0.4 * Math.sin(now * 2e-3 + s.tw);
        ctx2.fillStyle = "#f4ecd0";
        ctx2.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx2.globalAlpha = 1;
    }
    ctx2.globalAlpha = 0.85;
    _ridge(ctx2, W2, H2, H2 * 0.72, 70, biome.freq * 0.6, 1, biome.far, null, now * 3e-5);
    ctx2.globalAlpha = 1;
    _ridge(ctx2, W2, H2, H2 * 0.86, space ? 70 : 120, biome.freq, biome.sharp, biome.near, biome.rim, now * 7e-5);
    if (space) {
      for (const [ix, iy, iw] of [[300, 380, 90], [820, 300, 70], [1050, 440, 100]]) {
        const dy = Math.sin(now * 5e-4 + ix) * 6;
        ctx2.fillStyle = biome.near;
        ctx2.beginPath();
        ctx2.ellipse(ix, iy + dy, iw, 12, 0, 0, Math.PI);
        ctx2.fill();
        ctx2.beginPath();
        ctx2.moveTo(ix - iw, iy + dy);
        ctx2.quadraticCurveTo(ix, iy + dy + 40, ix + iw, iy + dy);
        ctx2.fill();
        ctx2.strokeStyle = biome.rim;
        ctx2.lineWidth = 1.2;
        ctx2.beginPath();
        ctx2.ellipse(ix, iy + dy, iw, 12, 0, Math.PI, Math.PI * 2);
        ctx2.stroke();
      }
    }
    if (lava2) {
      const lg = ctx2.createLinearGradient(0, H2, 0, H2 - 220);
      lg.addColorStop(0, rgba(biome.accent, 0.4));
      lg.addColorStop(1, rgba(biome.accent, 0));
      ctx2.fillStyle = lg;
      ctx2.fillRect(0, H2 - 220, W2, 220);
      for (let i = 0; i < 14; i++) {
        const ex = (i * 97 + now * 0.02) % W2;
        const ey = H2 - (now * 0.03 + i * 60) % 260;
        ctx2.globalAlpha = 0.3 * (1 - (H2 - ey) / 260);
        ctx2.fillStyle = biome.accent;
        ctx2.beginPath();
        ctx2.arc(ex, ey, 1.5 + i % 2, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.globalAlpha = 1;
    }
    for (let i = 0; i < 26; i++) {
      const mx = (i * 137.5 + now * 0.01 * (1 + i % 3)) % (W2 + 40) - 20;
      const my = (i * 53.3 + Math.sin(now * 6e-4 + i) * 20) % (H2 + 40) - 20;
      ctx2.globalAlpha = 0.06 + 0.06 * Math.sin(now * 2e-3 + i);
      ctx2.fillStyle = mix("#f0e2c4", biome.accent, 0.4);
      ctx2.beginPath();
      ctx2.arc(mx, my, 1 + i % 2, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.globalAlpha = 1;
    if (o.voidTop) {
      const g = ctx2.createLinearGradient(0, 0, 0, 60);
      g.addColorStop(0, "rgba(165,94,234,0.5)");
      g.addColorStop(1, "rgba(165,94,234,0)");
      ctx2.fillStyle = g;
      ctx2.fillRect(0, 0, W2, 60);
    }
  }
  function _thash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function drawStoryTerrain(ctx2, o) {
    const v = o.vertices, b = o.bounds, now = o.now || 0, base2 = o.color || "#2a2336";
    const top = b.min.y, bot = b.max.y, left = b.min.x, right = b.max.x;
    const flip = !!o.flip, crustY = flip ? bot : top, dir = flip ? 1 : -1;
    const aligned = Math.abs(Math.sin(o.angle || 0)) < 0.15;
    const trace = () => {
      ctx2.beginPath();
      ctx2.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) ctx2.lineTo(v[i].x, v[i].y);
      ctx2.closePath();
    };
    trace();
    const g = ctx2.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, shade(base2, flip ? -0.4 : 0.14));
    g.addColorStop(0.5, base2);
    g.addColorStop(1, shade(base2, flip ? 0.14 : -0.4));
    ctx2.fillStyle = g;
    ctx2.fill();
    ctx2.save();
    trace();
    ctx2.clip();
    ctx2.strokeStyle = rgba(shade(base2, -0.45), 0.5);
    ctx2.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const hx = left + (right - left) * _thash(i * 9.1 + left), hy = top + (bot - top) * _thash(i * 4.7 + top);
      ctx2.beginPath();
      ctx2.moveTo(hx, hy);
      ctx2.lineTo(hx + 4 + _thash(i) * 4, hy + 6 + _thash(i + 1) * 5);
      ctx2.stroke();
    }
    ctx2.fillStyle = rgba(shade(base2, 0.3), 0.28);
    for (let i = 0; i < 9; i++) {
      const hx = left + (right - left) * _thash(i * 13.3 + left + 5), hy = top + (bot - top) * _thash(i * 7.7 + bot);
      ctx2.beginPath();
      ctx2.arc(hx, hy, 0.7, 0, Math.PI * 2);
      ctx2.fill();
    }
    if (aligned) {
      const cc = _crustColors(o.crust, base2);
      const bandH = 6;
      const bg = ctx2.createLinearGradient(0, crustY, 0, crustY - dir * bandH);
      bg.addColorStop(0, rgba(cc.soil, 0));
      bg.addColorStop(1, cc.soil);
      ctx2.fillStyle = bg;
      ctx2.fillRect(left, Math.min(crustY, crustY - dir * bandH), right - left, bandH);
    }
    ctx2.restore();
    ctx2.strokeStyle = shade(base2, -0.6);
    ctx2.lineWidth = 1.5;
    ctx2.lineJoin = "round";
    trace();
    ctx2.stroke();
    if (aligned) {
      ctx2.strokeStyle = rgba(_crustColors(o.crust, base2).rim, 0.55);
      ctx2.lineWidth = 1.2;
      ctx2.beginPath();
      ctx2.moveTo(left + 1, crustY + dir * 0.5);
      ctx2.lineTo(right - 1, crustY + dir * 0.5);
      ctx2.stroke();
    }
    if (aligned) _crustTufts(ctx2, o.crust, left, right, crustY, dir, now, base2);
  }
  function _crustColors(kind, base2) {
    if (kind === "snow") return { soil: "#dfefff", rim: "#ffffff", a: "#eaf6ff", b: "#bcd8f0" };
    if (kind === "char") return { soil: "#241014", rim: "#ff8c5a", a: "#3a1c18", b: "#ffab5e" };
    if (kind === "crystal") return { soil: "#2a1d44", rim: "#c8b8ff", a: "#8a6de0", b: "#d8c8ff" };
    return { soil: "#3a6a2e", rim: "#8fe6a2", a: "#4f8a3d", b: "#8fe6a2" };
  }
  function _crustTufts(ctx2, kind, x0, x1, cy, dir, now, base2) {
    const cc = _crustColors(kind, base2), step = 7, w = x1 - x0;
    let grassGrad = null;
    if (kind === "grass") {
      grassGrad = ctx2.createLinearGradient(x0, cy, x0, cy + dir * 8);
      grassGrad.addColorStop(0, cc.a);
      grassGrad.addColorStop(1, cc.b);
    }
    for (let x = x0 + 4; x < x1 - 2; x += step) {
      const s = _thash(Math.round(x) * 3.3), sway = Math.sin(now * 3e-3 + x * 0.12) * 2;
      if (kind === "grass") {
        ctx2.strokeStyle = grassGrad;
        ctx2.lineWidth = 1.3;
        ctx2.lineCap = "round";
        for (const off of [-2, 0, 2]) {
          ctx2.beginPath();
          ctx2.moveTo(x + off, cy);
          ctx2.quadraticCurveTo(x + off + sway * 0.5, cy + dir * 4, x + off + sway + off * 0.4, cy + dir * (6 + s * 3));
          ctx2.stroke();
        }
        if (s > 0.86) {
          ctx2.fillStyle = ["#ffd166", "#ff8fc7", "#e8d5ff"][Math.floor(s * 20) % 3];
          ctx2.beginPath();
          ctx2.arc(x + sway, cy + dir * (7 + s * 3), 1.4, 0, Math.PI * 2);
          ctx2.fill();
        }
      } else if (kind === "snow") {
        ctx2.fillStyle = cc.a;
        ctx2.beginPath();
        ctx2.ellipse(x, cy, 4 + s * 2, 2.6, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = "#fff";
        ctx2.beginPath();
        ctx2.ellipse(x - 1, cy - dir * 0.5, 2 + s, 1.2, 0, 0, Math.PI * 2);
        ctx2.fill();
        const tw = 0.5 + 0.5 * Math.sin(now * 5e-3 + x);
        if (s > 0.7) {
          ctx2.globalAlpha = tw;
          ctx2.fillStyle = "#eaf6ff";
          ctx2.fillRect(x + 2, cy + dir * (3 + s * 3), 1, 1);
          ctx2.globalAlpha = 1;
        }
      } else if (kind === "char") {
        ctx2.fillStyle = shade(base2, -0.5);
        ctx2.beginPath();
        ctx2.moveTo(x - 2.5, cy);
        ctx2.lineTo(x + sway * 0.4, cy + dir * (5 + s * 4));
        ctx2.lineTo(x + 2.5, cy);
        ctx2.closePath();
        ctx2.fill();
        const flick = 0.4 + 0.6 * Math.abs(Math.sin(now * 8e-3 + x * 0.5));
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        ctx2.globalAlpha = flick * (0.5 + s * 0.5);
        ctx2.fillStyle = cc.b;
        ctx2.beginPath();
        ctx2.arc(x + sway * 0.3, cy + dir * (5 + s * 4), 1.1, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
        ctx2.globalAlpha = 1;
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(now * 4e-3 + x * 0.3);
        const h = 5 + s * 5;
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        glowOrb(ctx2, x, cy + dir * h * 0.5, 4, cc.b, 0.25 + pulse * 0.25);
        ctx2.restore();
        const cg = ctx2.createLinearGradient(x, cy, x, cy + dir * h);
        cg.addColorStop(0, cc.a);
        cg.addColorStop(1, rgba(cc.b, 0.9));
        ctx2.fillStyle = cg;
        ctx2.beginPath();
        ctx2.moveTo(x - 2, cy);
        ctx2.lineTo(x + (s - 0.5) * 2, cy + dir * h);
        ctx2.lineTo(x + 2, cy);
        ctx2.closePath();
        ctx2.fill();
        ctx2.strokeStyle = rgba("#fff", 0.4 + pulse * 0.3);
        ctx2.lineWidth = 0.5;
        ctx2.beginPath();
        ctx2.moveTo(x, cy);
        ctx2.lineTo(x + (s - 0.5) * 2, cy + dir * h);
        ctx2.stroke();
      }
    }
  }
  function drawStorySpikes(ctx2, o) {
    const w = o.w || 100, h = o.h || 20, base2 = o.color || "#8a2f3d";
    ctx2.save();
    ctx2.translate(o.x, o.y);
    ctx2.rotate(o.angle || 0);
    const teeth = Math.max(3, Math.round(w / 18));
    const tw = w / teeth;
    ctx2.fillStyle = shade(base2, -0.45);
    ctx2.fillRect(-w / 2, h / 2 - 5, w, 6);
    for (let i = 0; i < teeth; i++) {
      const x0 = -w / 2 + i * tw, xm = x0 + tw / 2, x1 = x0 + tw;
      ctx2.beginPath();
      ctx2.moveTo(x0, h / 2);
      ctx2.lineTo(xm, -h / 2 - 4);
      ctx2.lineTo(x1, h / 2);
      ctx2.closePath();
      const g = ctx2.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, shade(base2, -0.3));
      g.addColorStop(0.45, mix(base2, "#e8e8f0", 0.35));
      g.addColorStop(0.5, "#f4f4ff");
      g.addColorStop(0.55, mix(base2, "#e8e8f0", 0.35));
      g.addColorStop(1, shade(base2, -0.4));
      ctx2.fillStyle = g;
      ctx2.fill();
      ctx2.strokeStyle = shade(base2, -0.6);
      ctx2.lineWidth = 0.8;
      ctx2.stroke();
      ctx2.strokeStyle = "rgba(255,255,255,0.8)";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(xm - 1, -h / 2 + 1);
      ctx2.lineTo(xm, -h / 2 - 4);
      ctx2.stroke();
    }
    ctx2.restore();
  }
  function drawSecretBoss(ctx2, o) {
    const { x, y, now = 0 } = o;
    const r = o.r || 46;
    const type = o.type || "rizard_rizz";
    const founder = (opts) => {
      glowOrb(ctx2, x, y, r * 1.8, opts.aura, 0.26);
      const hr = r * 0.6, hy = y - r * 0.58;
      const shoulderY = y - r * 0.05, hemY = y + r * 1.4;
      const shoulderW = r * 1.8, hemW = r * 1.55;
      ctx2.fillStyle = opts.inner || "#d3d8de";
      ctx2.beginPath();
      ctx2.moveTo(x - shoulderW * 0.45, shoulderY);
      ctx2.lineTo(x + shoulderW * 0.45, shoulderY);
      ctx2.lineTo(x + hemW * 0.45, hemY);
      ctx2.lineTo(x - hemW * 0.45, hemY);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = opts.jacket;
      ctx2.beginPath();
      ctx2.moveTo(x - shoulderW / 2, shoulderY);
      ctx2.lineTo(x + shoulderW / 2, shoulderY);
      ctx2.lineTo(x + hemW / 2, hemY);
      ctx2.lineTo(x - hemW / 2, hemY);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = shade(opts.jacket, -0.5);
      ctx2.lineWidth = 1.3;
      ctx2.stroke();
      ctx2.fillStyle = opts.inner || "#d3d8de";
      ctx2.beginPath();
      ctx2.moveTo(x - r * 0.3, shoulderY);
      ctx2.lineTo(x + r * 0.3, shoulderY);
      ctx2.lineTo(x, shoulderY + r * 0.55);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = shade(opts.jacket, -0.6);
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.moveTo(x, shoulderY + r * 0.55);
      ctx2.lineTo(x, hemY);
      ctx2.stroke();
      const patchSize = r * 0.36, patchX = x - r * 0.5, patchY = y + r * 0.5;
      ctx2.fillStyle = opts.accent;
      ctx2.fillRect(patchX - patchSize / 2, patchY - patchSize / 2, patchSize, patchSize);
      ctx2.fillStyle = "#fff";
      ctx2.font = `bold ${Math.round(patchSize * 0.85)}px Georgia`;
      ctx2.textAlign = "center";
      ctx2.textBaseline = "middle";
      ctx2.fillText("Y", patchX, patchY + 1);
      ctx2.textBaseline = "alphabetic";
      ctx2.fillStyle = opts.skin;
      ctx2.fillRect(x - r * 0.15, hy + hr * 0.55, r * 0.3, r * 0.5);
      ctx2.beginPath();
      ctx2.arc(x, hy, hr, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.strokeStyle = shade(opts.skin, -0.4);
      ctx2.lineWidth = 1;
      ctx2.stroke();
      ctx2.fillStyle = "#f6f8fa";
      for (const side of [-1, 1]) {
        ctx2.fillRect(x + side * hr * 0.85 - 1.5, hy, 3, hr * 0.5);
        ctx2.beginPath();
        ctx2.arc(x + side * hr * 0.85, hy - 2, 2.7, 0, Math.PI * 2);
        ctx2.fill();
      }
      return { hy, hr };
    };
    const eyes = (cx, cy, dx, ey, er, glow) => {
      ctx2.shadowColor = glow;
      ctx2.shadowBlur = 10;
      ctx2.fillStyle = glow;
      ctx2.beginPath();
      ctx2.arc(cx - dx, cy + ey, er, 0, Math.PI * 2);
      ctx2.arc(cx + dx, cy + ey, er, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.shadowBlur = 0;
      ctx2.fillStyle = "#16121c";
      ctx2.beginPath();
      ctx2.arc(cx - dx, cy + ey, er * 0.4, 0, Math.PI * 2);
      ctx2.arc(cx + dx, cy + ey, er * 0.4, 0, Math.PI * 2);
      ctx2.fill();
    };
    if (type === "rizard_rizz" || type === "rizard_tizz") {
      const tizz = type === "rizard_tizz";
      if (tizz) runeRing(ctx2, x, y - r * 0.5, r * 0.9, "#3fb5ff", now, { count: 8, lw: 1.5, alpha: 0.6 });
      const { hy, hr } = founder({ aura: tizz ? "#3fb5ff" : "#ffd166", jacket: "#1c2b4a", accent: "#ff6a00", skin: "#e8b98a", inner: "#e6eaee" });
      ctx2.fillStyle = "#2a2018";
      ctx2.beginPath();
      ctx2.arc(x, hy - hr * 0.3, hr, Math.PI * 1.05, Math.PI * 1.95);
      ctx2.lineTo(x + hr * 0.7, hy - hr * 0.1);
      ctx2.quadraticCurveTo(x, hy - hr * 1.1, x - hr * 0.9, hy - hr * 0.1);
      ctx2.closePath();
      ctx2.fill();
      if (tizz) {
        eyes(x, hy, hr * 0.42, hr * 0.05, hr * 0.2, "#eaffff");
        ctx2.strokeStyle = "#5a3a24";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.arc(x, hy + hr * 0.45, hr * 0.35, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx2.stroke();
      } else {
        ctx2.fillStyle = "#16121c";
        ctx2.fillRect(x - hr * 0.75, hy - hr * 0.12, hr * 1.5, 2.5);
        ctx2.beginPath();
        ctx2.ellipse(x - hr * 0.42, hy, hr * 0.34, hr * 0.24, 0, 0, Math.PI * 2);
        ctx2.ellipse(x + hr * 0.42, hy, hr * 0.34, hr * 0.24, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = "rgba(255,255,255,0.5)";
        ctx2.beginPath();
        ctx2.arc(x - hr * 0.5, hy - hr * 0.08, 2, 0, Math.PI * 2);
        ctx2.arc(x + hr * 0.34, hy - hr * 0.08, 2, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.strokeStyle = "#5a3a24";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.arc(x + hr * 0.12, hy + hr * 0.5, hr * 0.4, 0.1 * Math.PI, 0.55 * Math.PI);
        ctx2.stroke();
      }
      return;
    }
    if (type === "manu_de" || type === "manu_mx") {
      const de = type === "manu_de";
      const { hy, hr } = founder({ aura: de ? "#c9cdd8" : "#e3a86a", jacket: de ? "#3d4450" : "#4a4f57", accent: de ? "#c0392b" : "#2e8b57", skin: "#d69a6a", inner: de ? "#cfd6e0" : "#e8dcc0" });
      ctx2.fillStyle = "#2a2018";
      ctx2.beginPath();
      ctx2.arc(x, hy - hr * 0.18, hr * 0.98, Math.PI * 1.08, Math.PI * 1.92);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = "#20242c";
      ctx2.lineWidth = 2.2;
      ctx2.beginPath();
      ctx2.arc(x - hr * 0.42, hy, hr * 0.3, 0, Math.PI * 2);
      ctx2.moveTo(x + hr * 0.72, hy);
      ctx2.arc(x + hr * 0.42, hy, hr * 0.3, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(x - hr * 0.12, hy);
      ctx2.lineTo(x + hr * 0.12, hy);
      ctx2.stroke();
      ctx2.strokeStyle = "#3a2a1a";
      ctx2.lineWidth = 4.5;
      ctx2.lineCap = "round";
      ctx2.beginPath();
      ctx2.moveTo(x - hr * 0.5, hy + hr * 0.58);
      ctx2.quadraticCurveTo(x - hr * 0.06, hy + hr * 0.9, x, hy + hr * 0.5);
      ctx2.quadraticCurveTo(x + hr * 0.06, hy + hr * 0.9, x + hr * 0.5, hy + hr * 0.58);
      ctx2.stroke();
      ctx2.lineCap = "butt";
      if (de) {
        ctx2.fillStyle = "#2b2f38";
        ctx2.beginPath();
        ctx2.arc(x, hy - hr * 0.12, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98);
        ctx2.closePath();
        ctx2.fill();
        ctx2.fillStyle = "#c0392b";
        ctx2.fillRect(x - hr * 0.95, hy - hr * 0.6, hr * 1.9, 4);
      } else {
        ctx2.fillStyle = "#8a5a2b";
        ctx2.beginPath();
        ctx2.ellipse(x, hy - hr * 0.7, hr * 1.5, hr * 0.3, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.beginPath();
        ctx2.ellipse(x, hy - hr * 1.02, hr * 0.55, hr * 0.5, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.strokeStyle = "#2e8b57";
        ctx2.lineWidth = 2.5;
        ctx2.beginPath();
        ctx2.ellipse(x, hy - hr * 0.82, hr * 0.55, hr * 0.16, 0, 0, Math.PI * 2);
        ctx2.stroke();
      }
    }
  }
  function drawStoryBoss(ctx2, o) {
    const { x, y, now = 0 } = o, r = o.r || 46, type = o.type, color = o.color || "#e15d5d";
    if (type === "rizard_rizz" || type === "rizard_tizz" || type === "manu_de" || type === "manu_mx") {
      return drawSecretBoss(ctx2, o);
    }
    glowOrb(ctx2, x, y, r * 1.7, color, 0.28);
    const bodyOrb = (fill, rim) => {
      const g = ctx2.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.2, x, y, r);
      g.addColorStop(0, shade(fill, 0.28));
      g.addColorStop(0.6, fill);
      g.addColorStop(1, shade(fill, -0.4));
      ctx2.fillStyle = g;
      ctx2.beginPath();
      ctx2.arc(x, y, r, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.strokeStyle = shade(fill, -0.6);
      ctx2.lineWidth = 1.4;
      ctx2.stroke();
      ctx2.strokeStyle = rgba(shade(fill, 0.5), 0.6);
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.arc(x, y, r - 2, Math.PI * 1.05, Math.PI * 1.6);
      ctx2.stroke();
      if (rim) {
        ctx2.shadowColor = rim;
      }
    };
    const eyes = (dx, ey, er, glow) => {
      ctx2.shadowColor = glow;
      ctx2.shadowBlur = 10;
      ctx2.fillStyle = glow;
      ctx2.beginPath();
      ctx2.arc(x - dx, y + ey, er, 0, Math.PI * 2);
      ctx2.arc(x + dx, y + ey, er, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.shadowBlur = 0;
      ctx2.fillStyle = "#16121c";
      ctx2.beginPath();
      ctx2.arc(x - dx, y + ey, er * 0.4, 0, Math.PI * 2);
      ctx2.arc(x + dx, y + ey, er * 0.4, 0, Math.PI * 2);
      ctx2.fill();
    };
    if (type === "dragon") {
      const flap = Math.sin(now * 0.012) * 0.5;
      for (const side of [-1, 1]) {
        ctx2.beginPath();
        ctx2.moveTo(x + side * r * 0.4, y - 8);
        ctx2.quadraticCurveTo(x + side * (r + 30), y - 40 - flap * 26, x + side * (r + 46), y - 30 - flap * 26);
        ctx2.quadraticCurveTo(x + side * (r + 30), y - 2, x + side * (r + 14), y + 16);
        ctx2.closePath();
        const wg = ctx2.createLinearGradient(x, y - 30, x + side * (r + 46), y);
        wg.addColorStop(0, "#7a2b2b");
        wg.addColorStop(1, "#c15353");
        ctx2.fillStyle = wg;
        ctx2.fill();
        ctx2.strokeStyle = "rgba(40,12,12,0.6)";
        ctx2.lineWidth = 1;
        for (const t of [0.4, 0.7]) {
          ctx2.beginPath();
          ctx2.moveTo(x + side * r * 0.4, y - 8);
          ctx2.lineTo(x + side * (r * 0.4 + (r + 40) * t), y - 30 - flap * 26 * t);
          ctx2.stroke();
        }
      }
      bodyOrb("#e15d5d");
      ctx2.fillStyle = "#a13d3d";
      for (const side of [-1, 1]) {
        ctx2.beginPath();
        ctx2.moveTo(x + side * 14, y - r + 6);
        ctx2.lineTo(x + side * 24, y - r - 18);
        ctx2.lineTo(x + side * 30, y - r + 12);
        ctx2.closePath();
        ctx2.fill();
        ctx2.strokeStyle = shade("#a13d3d", -0.5);
        ctx2.lineWidth = 0.8;
        ctx2.stroke();
      }
      ctx2.fillStyle = shade("#e15d5d", -0.35);
      ctx2.beginPath();
      ctx2.ellipse(x, y + 12, 9, 6, 0, 0, Math.PI * 2);
      ctx2.fill();
      eyes(14, -10, 5, "#ffd166");
    } else if (type === "lich") {
      ctx2.fillStyle = "#2a1d3d";
      ctx2.beginPath();
      ctx2.arc(x, y, r + 7, Math.PI, 0);
      ctx2.fill();
      ctx2.strokeStyle = shade("#2a1d3d", 0.3);
      ctx2.lineWidth = 1;
      ctx2.stroke();
      bodyOrb("#c084fc");
      ctx2.fillStyle = PARCHMENT;
      ctx2.beginPath();
      ctx2.ellipse(x, y + 2, r * 0.68, r * 0.78, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "#ffd166";
      ctx2.beginPath();
      ctx2.moveTo(x - 18, y - r - 2);
      for (let i = 0; i < 3; i++) {
        ctx2.lineTo(x - 12 + i * 12, y - r - 16);
        ctx2.lineTo(x - 6 + i * 12, y - r - 2);
      }
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "#e15d5d";
      for (let i = 0; i < 3; i++) {
        ctx2.beginPath();
        ctx2.arc(x - 12 + i * 12, y - r - 9, 1.6, 0, Math.PI * 2);
        ctx2.fill();
      }
      eyes(10, -4, 4.8, "#9be15d");
      runeRing(ctx2, x, y, r + 16, rgba("#9be15d", 1), now, { count: 8, lw: 0.8, alpha: 0.35, spin: 1e-3 });
    } else if (type === "golem") {
      bodyOrb("#a6763c");
      ctx2.strokeStyle = rgba("#ff8c5a", 0.7);
      ctx2.lineWidth = 2.5;
      ctx2.lineCap = "round";
      ctx2.shadowColor = "#ff8c5a";
      ctx2.shadowBlur = 6;
      ctx2.beginPath();
      ctx2.moveTo(x - 20, y - 30);
      ctx2.lineTo(x - 6, y - 10);
      ctx2.lineTo(x - 16, y + 14);
      ctx2.moveTo(x + 22, y - 20);
      ctx2.lineTo(x + 10, y + 4);
      ctx2.lineTo(x + 18, y + 22);
      ctx2.stroke();
      ctx2.shadowBlur = 0;
      ctx2.strokeStyle = rgba(shade("#a6763c", -0.5), 0.6);
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.moveTo(x - r + 6, y - 6);
      ctx2.lineTo(x - r * 0.5, y - 2);
      ctx2.stroke();
      eyes(13, -18, 5, "#ff8c5a");
    } else if (type === "kraken") {
      for (const side of [-1, 1]) {
        ctx2.strokeStyle = "#356082";
        ctx2.lineWidth = 10;
        ctx2.lineCap = "round";
        const ex = x + side * (r + 34), ey = y + r + Math.sin(now * 4e-3 + side) * 4;
        ctx2.beginPath();
        ctx2.moveTo(x + side * r * 0.7, y + r * 0.5);
        ctx2.quadraticCurveTo(x + side * (r + 24), y + r * 0.2 + Math.sin(now * 4e-3 + side) * 10, ex, ey);
        ctx2.stroke();
        ctx2.fillStyle = rgba("#8fc2dd", 0.7);
        for (let t = 0.4; t < 1; t += 0.25) {
          ctx2.beginPath();
          ctx2.arc(x + side * (r * 0.7 + (r + 20) * t), y + r * 0.5 + (ey - y - r * 0.5) * t, 1.6, 0, Math.PI * 2);
          ctx2.fill();
        }
      }
      bodyOrb("#4d7a9a");
      eyes(15, -8, 8, "#f4ecd0");
    } else {
      bodyOrb(color);
      eyes(13, -8, 5, mix(color, "#fff", 0.5));
    }
  }
  function _detSeed(x, y) {
    let a = Math.round(x) * 73856093 ^ Math.round(y) * 19349663;
    return () => {
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function drawStoryDestructible(ctx2, { x, y, w, h, angle = 0, kind = "wood", frac = 1, color = "#6b4a2a", now = 0 }) {
    const rnd = _detSeed(x, y);
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(angle);
    const hw = w / 2, hh = h / 2;
    if (kind === "ice") {
      ctx2.globalAlpha = 0.85;
      ctx2.fillStyle = color;
      ctx2.fillRect(-hw, -hh, w, h);
      ctx2.globalAlpha = 0.3;
      ctx2.strokeStyle = "#ffffff";
      ctx2.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const gx = -hw + w * (0.25 + rnd() * 0.5), gy = -hh + h * (0.2 + rnd() * 0.5);
        const shim = 0.5 + 0.5 * Math.sin(now * 2e-3 + gx);
        ctx2.globalAlpha = 0.18 + 0.2 * shim;
        ctx2.beginPath();
        ctx2.moveTo(gx - 5, gy + 7);
        ctx2.lineTo(gx + 5, gy - 7);
        ctx2.stroke();
      }
      ctx2.globalAlpha = 0.8;
      ctx2.strokeStyle = shade(color, 0.6);
      ctx2.lineWidth = 2.5;
      ctx2.beginPath();
      ctx2.moveTo(-hw + 2, -hh + 1.5);
      ctx2.lineTo(hw - 2, -hh + 1.5);
      ctx2.stroke();
      ctx2.globalAlpha = 1;
      ctx2.strokeStyle = rgba(color, 0.9);
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(-hw, -hh, w, h);
    } else if (kind === "obsidian") {
      ctx2.fillStyle = mix(color, "#120c18", 0.55);
      ctx2.fillRect(-hw, -hh, w, h);
      ctx2.globalAlpha = 0.14;
      ctx2.strokeStyle = "#ffffff";
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      ctx2.moveTo(-hw * 0.5, -hh);
      ctx2.lineTo(-hw * 0.1, hh);
      ctx2.stroke();
      ctx2.globalAlpha = 1;
      ctx2.strokeStyle = "rgba(0,0,0,0.5)";
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(-hw, -hh, w, h);
    } else if (kind === "stone") {
      ctx2.fillStyle = color;
      ctx2.fillRect(-hw, -hh, w, h);
      ctx2.strokeStyle = shade(color, -0.35);
      ctx2.lineWidth = 1.2;
      const rows = Math.max(1, Math.round(h / 22));
      for (let r = 1; r < rows; r++) {
        const yy = -hh + h * r / rows;
        ctx2.beginPath();
        ctx2.moveTo(-hw, yy);
        ctx2.lineTo(hw, yy);
        ctx2.stroke();
        const off = -hw + w * (0.3 + 0.4 * rnd());
        ctx2.beginPath();
        ctx2.moveTo(off, yy);
        ctx2.lineTo(off, yy - h / rows);
        ctx2.stroke();
      }
      ctx2.globalAlpha = 0.5;
      ctx2.fillStyle = "#4a6b3a";
      for (let i = 0; i < 2; i++) {
        const mx = -hw + w * rnd(), my = hh - h * 0.18 * rnd();
        ctx2.beginPath();
        ctx2.ellipse(mx, my, 4 + rnd() * 5, 3, 0, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.globalAlpha = 1;
      ctx2.strokeStyle = "rgba(0,0,0,0.35)";
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(-hw, -hh, w, h);
    } else if (kind === "crate") {
      ctx2.fillStyle = color;
      ctx2.fillRect(-hw, -hh, w, h);
      ctx2.strokeStyle = shade(color, -0.3);
      ctx2.lineWidth = 1.5;
      for (let i = 1; i < 3; i++) {
        const yy = -hh + h * i / 3;
        ctx2.beginPath();
        ctx2.moveTo(-hw, yy);
        ctx2.lineTo(hw, yy);
        ctx2.stroke();
      }
      ctx2.globalAlpha = 0.6;
      ctx2.beginPath();
      ctx2.moveTo(-hw + 2, -hh + 2);
      ctx2.lineTo(hw - 2, hh - 2);
      ctx2.stroke();
      ctx2.globalAlpha = 1;
      ctx2.fillStyle = shade(color, -0.45);
      for (const [nx, ny] of [[-hw + 4, -hh + 4], [hw - 4, -hh + 4], [-hw + 4, hh - 4], [hw - 4, hh - 4]]) {
        ctx2.beginPath();
        ctx2.arc(nx, ny, 1.6, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.strokeStyle = "rgba(0,0,0,0.4)";
      ctx2.strokeRect(-hw, -hh, w, h);
    } else if (kind === "shroom") {
      ctx2.fillStyle = color;
      ctx2.beginPath();
      if (typeof ctx2.roundRect === "function") ctx2.roundRect(-hw, -hh, w, h, Math.min(10, h / 3));
      else ctx2.rect(-hw, -hh, w, h);
      ctx2.fill();
      ctx2.fillStyle = "#f2e8d4";
      for (let i = 0; i < Math.max(2, Math.round(w / 26)); i++) {
        const sx = -hw + w * (0.12 + 0.76 * rnd()), sy = -hh + h * (0.2 + 0.5 * rnd());
        ctx2.beginPath();
        ctx2.ellipse(sx, sy, 3.5 + rnd() * 3, 2.5 + rnd() * 2, 0, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.strokeStyle = "rgba(0,0,0,0.3)";
      ctx2.lineWidth = 1.5;
      ctx2.stroke();
    } else if (kind === "wood" && _hx(color).g > _hx(color).r + 20) {
      ctx2.fillStyle = color;
      ctx2.fillRect(-hw, -hh + 4, w, h - 4);
      const lobes = Math.max(3, Math.round(w / 18));
      for (let i = 0; i <= lobes; i++) {
        const lx = -hw + w * i / lobes;
        const lr = 7 + rnd() * 6;
        ctx2.beginPath();
        ctx2.arc(lx, -hh + 4, lr, 0, Math.PI * 2);
        ctx2.fill();
        if (rnd() < 0.4) {
          ctx2.fillStyle = shade(color, 0.18);
          ctx2.beginPath();
          ctx2.arc(lx - 3, -hh + 1, lr * 0.5, 0, Math.PI * 2);
          ctx2.fill();
          ctx2.fillStyle = color;
        }
      }
      ctx2.fillStyle = shade(color, -0.22);
      ctx2.fillRect(-hw, hh - 5, w, 5);
      ctx2.globalAlpha = 0.55;
      ctx2.strokeStyle = shade(color, -0.3);
      ctx2.lineWidth = 1;
      for (let i = 0; i < Math.max(2, Math.round(w / 30)); i++) {
        const vx = -hw + w * (0.2 + 0.6 * rnd()), vy = -hh + h * (0.3 + 0.4 * rnd());
        ctx2.beginPath();
        ctx2.moveTo(vx - 3, vy + 3);
        ctx2.lineTo(vx + 3, vy - 3);
        ctx2.stroke();
      }
      ctx2.globalAlpha = 1;
    } else {
      ctx2.fillStyle = color;
      ctx2.fillRect(-hw, -hh, w, h);
      ctx2.strokeStyle = shade(color, -0.28);
      ctx2.lineWidth = 1.4;
      for (let i = 0; i < Math.max(2, Math.round(w / 14)); i++) {
        const gx = -hw + w * (0.12 + 0.76 * rnd());
        ctx2.beginPath();
        ctx2.moveTo(gx, -hh + 2);
        ctx2.quadraticCurveTo(gx + (rnd() - 0.5) * 6, 0, gx, hh - 2);
        ctx2.stroke();
      }
      if (rnd() < 0.6) {
        const kx = -hw + w * (0.25 + 0.5 * rnd()), ky = -hh + h * (0.3 + 0.4 * rnd());
        ctx2.strokeStyle = shade(color, -0.4);
        ctx2.beginPath();
        ctx2.ellipse(kx, ky, 3.5, 2.5, 0.3, 0, Math.PI * 2);
        ctx2.stroke();
      }
      ctx2.strokeStyle = shade(color, 0.12);
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(-hw + 1, -hh + 1);
      ctx2.lineTo(hw - 1, -hh + 1);
      ctx2.stroke();
      ctx2.strokeStyle = "rgba(0,0,0,0.3)";
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(-hw, -hh, w, h);
    }
    if (frac < 1) {
      if (kind === "obsidian") {
        ctx2.globalCompositeOperation = "lighter";
        ctx2.globalAlpha = (1 - frac) * 0.95;
        ctx2.strokeStyle = "#ff7043";
        ctx2.lineWidth = 1.6;
        ctx2.beginPath();
        ctx2.moveTo(-hw, -h / 5);
        ctx2.lineTo(0, 0);
        ctx2.lineTo(w / 4, -h / 3);
        if (frac < 0.5) {
          ctx2.moveTo(0, 0);
          ctx2.lineTo(-w / 4, h / 3);
          ctx2.moveTo(0, 0);
          ctx2.lineTo(hw, h / 5);
        }
        ctx2.stroke();
        ctx2.globalCompositeOperation = "source-over";
        ctx2.globalAlpha = 1;
      } else {
        ctx2.fillStyle = `rgba(0,0,0,${(1 - frac) * (kind === "ice" ? 0.22 : 0.4)})`;
        ctx2.fillRect(-hw, -hh, w, h);
        if (frac < 0.7) {
          ctx2.strokeStyle = kind === "ice" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)";
          ctx2.lineWidth = 1;
          ctx2.beginPath();
          ctx2.moveTo(-hw, -h / 5);
          ctx2.lineTo(0, 0);
          ctx2.lineTo(w / 4, -h / 3);
          if (frac < 0.35) {
            ctx2.moveTo(0, 0);
            ctx2.lineTo(-w / 4, h / 3);
            ctx2.moveTo(0, 0);
            ctx2.lineTo(hw, h / 5);
          }
          ctx2.stroke();
        }
      }
    }
    ctx2.restore();
  }
  function drawStoryParticles(ctx2, particles2) {
    ctx2.save();
    for (const pt of particles2) {
      const a = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      const hex = typeof pt.color === "string" && pt.color[0] === "#";
      if (pt.kind === "ring") {
        ctx2.globalCompositeOperation = "lighter";
        ctx2.strokeStyle = pt.color;
        ctx2.globalAlpha = a;
        ctx2.lineWidth = 2.5;
        ctx2.beginPath();
        ctx2.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.globalAlpha = a * 0.35;
        ctx2.lineWidth = 6;
        ctx2.beginPath();
        ctx2.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.globalCompositeOperation = "source-over";
      } else if (pt.kind === "text") {
        ctx2.globalCompositeOperation = "source-over";
        ctx2.globalAlpha = a;
        ctx2.font = "bold 16px Georgia";
        ctx2.textAlign = "center";
        ctx2.lineWidth = 3;
        ctx2.lineJoin = "round";
        ctx2.strokeStyle = "rgba(18,10,24,0.75)";
        ctx2.strokeText(pt.str, pt.x, pt.y);
        ctx2.fillStyle = pt.color;
        ctx2.fillText(pt.str, pt.x, pt.y);
      } else if (pt.kind === "spark") {
        ctx2.globalCompositeOperation = "lighter";
        ctx2.globalAlpha = a;
        ctx2.strokeStyle = pt.color;
        ctx2.lineWidth = 2;
        ctx2.lineCap = "round";
        ctx2.beginPath();
        ctx2.moveTo(pt.x, pt.y);
        ctx2.lineTo(pt.x - pt.vx * 2, pt.y - pt.vy * 2);
        ctx2.stroke();
        ctx2.globalCompositeOperation = "source-over";
      } else if (pt.kind === "bird") {
        ctx2.globalCompositeOperation = "source-over";
        ctx2.globalAlpha = Math.min(1, a * 1.6);
        ctx2.strokeStyle = pt.color;
        ctx2.lineWidth = 1.6;
        ctx2.lineCap = "round";
        const flap = Math.sin(pt.life * 0.55) * 4;
        ctx2.beginPath();
        ctx2.moveTo(pt.x - 5, pt.y - flap);
        ctx2.quadraticCurveTo(pt.x - 2, pt.y + 1, pt.x, pt.y);
        ctx2.quadraticCurveTo(pt.x + 2, pt.y + 1, pt.x + 5, pt.y - flap);
        ctx2.stroke();
      } else if (pt.kind === "leaf") {
        ctx2.globalCompositeOperation = "source-over";
        ctx2.globalAlpha = a;
        ctx2.fillStyle = pt.color;
        ctx2.save();
        ctx2.translate(pt.x, pt.y);
        ctx2.rotate(Math.sin(pt.life * 0.12) * 0.9);
        ctx2.beginPath();
        ctx2.ellipse(0, 0, pt.r * 1.2, pt.r * 0.55, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
      } else if (pt.kind === "glint") {
        ctx2.globalCompositeOperation = "lighter";
        const tw = Math.sin((1 - a) * Math.PI);
        ctx2.globalAlpha = tw * 0.9;
        ctx2.strokeStyle = pt.color;
        ctx2.lineWidth = 1.2;
        const rr = pt.r * (0.6 + tw);
        ctx2.beginPath();
        ctx2.moveTo(pt.x - rr, pt.y);
        ctx2.lineTo(pt.x + rr, pt.y);
        ctx2.moveTo(pt.x, pt.y - rr);
        ctx2.lineTo(pt.x, pt.y + rr);
        ctx2.stroke();
        ctx2.globalCompositeOperation = "source-over";
      } else if (pt.kind === "confetti") {
        ctx2.globalCompositeOperation = "source-over";
        ctx2.globalAlpha = a;
        ctx2.fillStyle = pt.color;
        ctx2.fillRect(pt.x - pt.r / 2, pt.y - pt.r / 2, pt.r, pt.r * 0.6);
      } else {
        ctx2.globalCompositeOperation = "lighter";
        ctx2.globalAlpha = a;
        ctx2.fillStyle = pt.color;
        ctx2.beginPath();
        ctx2.arc(pt.x, pt.y, pt.r * 0.9, 0, Math.PI * 2);
        ctx2.fill();
        if (hex) {
          ctx2.globalAlpha = a * 0.9;
          ctx2.fillStyle = shade(pt.color, 0.6);
          ctx2.beginPath();
          ctx2.arc(pt.x, pt.y, pt.r * 0.4, 0, Math.PI * 2);
          ctx2.fill();
        }
        ctx2.globalCompositeOperation = "source-over";
      }
    }
    ctx2.globalAlpha = 1;
    ctx2.globalCompositeOperation = "source-over";
    ctx2.restore();
  }

  // src/render/content-pack.js
  var avatarVariant2 = avatarVariant;
  (function installContentPack() {
    "use strict";
    const pack = { "n": 6e5, "s": "jIR./dV.1VH.ncL.xJy.0Ck.6CY.g==", "v": "5021b83998a0a77a", "k": { "d1470d0a492fd498c95101cdff67184094f3fc1f6200fc747a09e5f8f4ccfd6d": { "i": "Si3.vbO.yqw.6s6.fW2.w", "d": "/DH.loa.+gU.r/S.wuD.BLt.jtU.iEY.0pC.aok.3SX.JQ8.23C.LE4.7/+.2Ia.6hF.qg7.vNQ.7xC.jt7.2" }, "b92082e7051956697ec81b8a3a17bfab6f9b1354bf6d04a47c739cc1ff4d9d8b": { "i": "wWC.IXt.m1M.q6n.ymX.z", "d": "KZR.oha.X3C.LnR.wZr.p7E.hrP.1uH.uOS.LZz.OMY.n18.Vtq.6ZM.sxP.82H.Fdu.0PU.4Gy.JCX.HGn.4" }, "951db677fa9c2925b90f24eb24e0b6d5574db01f864f6a0b8d5d2ba76dbbc4a1": { "i": "INa.x19.COI.br3.AKJ.y", "d": "84A.m14.Hci.CP6.r9d.JaJ.kkH.+Dt.EAX.U8H.9wh.TcQ.89j.UiH.peX.Ute.kvQ.Jmn.rXp.uRS.NLU.k" }, "d8ee25f9097f54d4fc795758b616714e813bec43c53b7e422ea8a37b17777bba": { "i": "5QH.iXM.0+9.qGL.ANj.R", "d": "9S1.vSn.plO.HyI.Fef.4fA.ZgQ.lIF.oH1.vmu.dDk.Fq2.tcP.wPl.TLX.8bR.PE9.gzu.P6W.eDA.Fn1.Y" }, "71c9071a91990e888cfc467cbacbc676afbb4ee2d808190c8aed5af8d7cd64bc": { "i": "9h4.3Bl.bn2.rur.v0G./", "d": "hzD.Q3Y.yDe.VT2.ahj.DvE.mPC.qUz.TiP.jbv.FFw.giS.uLm.ovP.6L0.bn+.ek2.4Th.Stw.eiz./ha.K" }, "7feeb3462c1c66e68d7274d3e43a8dd9726be18859fe6fff869f735f14e1ec6b": { "i": "olQ.R3e.iYp.4mP.9qt.N", "d": "Wgi.NaY.SPW.ZSA.8LM.uge.WZ2.XKz.S4c.CgV.fgJ.qfB.Oek.B21.CQy.K4G.mAh.aK8.eFA.pFa.cQg.w" }, "fb9760e0ca0e30c5028f20e03fa70d1902b39482f12d5dc139b031d46f1b7ef2": { "i": "wri.Gk9.pS9.GoB.MZD.B", "d": "3Ay.FGG.zP1.aiA.qZd.dvc.nL+.kSy.8pS.aRm.8ny.ETg.gkg.dc3.6ph./UI.8bq.IH3.T0h.fHN.PFZ.e" }, "017e64001ebdc91215f39599fa8d16737a3e900a9e41647f3ad559644e49a10d": { "i": "PqL.b3/.35h.fUl.qtL.2", "d": "4Tp.XeA.TPJ.d73.HtF.jaS.c/P.peZ.dLT.kNw.82z.g5g.An4.ZMI.T5G.S6q.8J9.nKT.kYZ.Y9f.l8Y.o" }, "9ce9c6d7881f3e259af9f494d0e6ea27a080bb77a8b2b6f646c27f790a25e475": { "i": "FBx.7P5.Tbf.Gny.GJW.W", "d": "a5J.BmV.Lyo.ZDa.zIZ.SZx.7pX.LUi.owM.HQ7.aJA.JYG.RVC./8B.jOY.nUO.DfY.lul.1+a.nuE.38V.i" }, "9a009d44f7a51de11f717d7757bda6e9f430556482b47029f06312225e265218": { "i": "kBd.ajn.LD7.9Dh.63d.I", "d": "I/g.24c.Ul6.vVx.Xda.1u3.qXm.uaG.H1G.CoL.ept.4mi.tNs.7dD.mEA.up1.bMl.UHe.B1R.bAa.MOH.C" }, "ab4802fa0b68f2fbd06db51fbc508d276675676eafd440ebe90e6888266c96b3": { "i": "3AV.riR.92s.fEb.7Fk.g", "d": "NFO.hlr.1xy.j1U.KLi.kx9.YIr.PUb.HWk.lXZ.S0c.d2Q.5ey.Z+e.9Xc.8cq.QNZ.GAj.+Yy.n7G.bc0.N" }, "47bd8bc7c633e2b4aaecbfb515333b0d215a733cd42aa46d570e289e3f5fbb79": { "i": "kWG.vH3.agt.Agv.cU1.4", "d": "9lt.J+1.4p0.JMb.Gyh.Top.9Z7.rW6.bmD.wO7.rNu.iZf.hlP.WvB.SF9.Qwa.RPN.daB.TUs.FWI.I7G.n" }, "e35b00c48c581e253884fef782c541565b8f685509ca99830cd6c033c13ca4b5": { "i": "luS.rG7.feQ.DuS.bfQ.q", "d": "qI2.OZw.Wl0.+II.LxW.2QP.BMe.bh2.MTQ.bqq.gKq.Yp8.jHb.oiI.VBE.xMk.j3B.4I3.J1H.pOV.yX+.h" }, "70e985d3af9f774f542e2a2412d36d8a34f098879d813f56de123241824c6bef": { "i": "e+c.c5Z.uEw.bMp.SGz.b", "d": "ZiB.V0U.Rjw.03x.wGB.e9k.UZb.vYh.JDr.GXc.0E7.SjS.h9f.eio.QSi.CJK.4Uh.F4f.Soo.dBn.18p.m" }, "136601681123d4626e72860dc46cf45aee2a9eb536dcee3aa27df2332bb02ec8": { "i": "qfI.EIy.kxk.OH+.WsJ.x", "d": "7cW.GXc.Y8Z.wpw.TBT.rgK.Umn.uH2.+QW.98B.Fmf.4Wl.qpC.3sj.hbw.l3m.jvP.LZp.eFT.Fiv.JHQ.N" }, "6c90927bf1091befdc1bff013e5cb5df71b81636e675ce601fc4de063953b3a2": { "i": "nqt.hIU.wWh.kO9.+70.O", "d": "fbv.022.4Tq.Yxr.lxd.YHa.+RP.KfP.QzE.eHB.EZh.Z+Q.lD5.MES.7uK.jFZ.S35.fbN.J5r.WfE.7kM.6" }, "bc92428a54072f4ed5d608a333e5192659c2375d346b72ad3e2bd75a5ccf044b": { "i": "kIt.tM0.neo.0ui.tPL.t", "d": "FDw.Zu4.FpE.D2j.A3Z.HJf.eZl.DBl.mwc.9ZE.bpT.9FP.Vf4.1RE.vQR.Yoy.Xr4.Dd/.D79.JBx.tuy.K" }, "b2c617a951ad6220c252fe6206a93c4b4c4bee14bbae05d3405517536cecedb0": { "i": "skF.AMG.2W4.cv4.fn1.E", "d": "113.aHR.FBw.6Ji.d6I.op4.dfe.JdX.Uzl.JYR.5Ql.LZP.cTN.dJQ.R6V.PM7.14g.oqH.vTB.vXY.GRT.o" }, "cc40ebcb30f54b59f066d2e8df0802a303a75100ccad96eb81649c57c5a608ba": { "i": "hwU.aT+.CYf.VTY.6N8.v", "d": "8tH.ita.ndE.EN3.O6z.zgp.45h.fcS.Ar4.ltP.HVp.0on.CrF.LM1.bKv.jYx.6KU.MZV.nGy.UeG.xSA.C" }, "5b3cf4e4f298700c2d86e3600b359a80d61b4eca8272aba15e0726af6907d093": { "i": "ZCy.12O.l02.ZuM.C86./", "d": "spq.9yN.k/Q.C9G.bZL.JpD.Cm9.v/B.T8K.7j9.j8a.TjF.aDV.t1a.xgs.8oi.4R1.RML.lsw.xaw.EZt.J" }, "e424a5079e054f27ad96a531313def5958f3074a70f6f22e023f95cdefe5d827": { "i": "S//.YJN.Mg0.k1c.L4o.9", "d": "qq9.ODQ.dnI.Hqg.mS+.6K2.ZwG.Jv8.QYO.G0s.26Q.EdA.YAM.IjD.J6L.FGn.WIo.4fz.X5R.ENb.5T9.1" }, "cd6ecaaa1ab0c7305ab872071ed27bc5b83f6b76988280a851c0833bf1765580": { "i": "Y6L.z2f.C9d.cko.6bk.Z", "d": "B9s.Jxv.5cx.ybY.DLg.6ZN.dGo.z9o.edc.rih.8vn.+lk.kln.O3Q.1xv.cuR.B3S.ZFc.saj.H6+.I3I.6" }, "c1cb7c7a61f66d67d269bd81b230ebd33ca1a12289217b0f24609eabebb25940": { "i": "3ye.9gC.Ro0.EZz.Uyb.G", "d": "61M.VLt.V4C.uVu.AL+.14W.F80.Xks.LIr.oBr.TIQ.iMR.OJl.aqY.8q5.u2/.n/7.aBn.EFW.5m9.MEZ./" }, "d15dc386f08ab15c5aeb4914c66ea695920e17a8742a99de3700e4949ec5110b": { "i": "9g4.x8H.jJu.93O.JT9.O", "d": "wGh.vy5.2Ww.Eax.SHh.zw2.9fa.pBm.ZI+.2JH.I7A.mnF.VEW.kyC.TmT.GV6.p1n.+Bq.ORQ.MY/.HKC.1" }, "ad6161e85f580e6750aa86c5486ed0bac897ee6d1a9fb7445f5417674d6d4454": { "i": "FrX.aao.Ecc.kG4.t9a.R", "d": "lGC.wNB.y+5.EQg.ZIW.F+K.58O.Zvz.fDn.+Nb.86t.d/O.Gco.G7U.Ate.HxH.74D.N0T.kjq.YCN.Lzw.d" }, "020f7f801b1af2887d574822af586500e90a3d63079ddb3f55b4a5d036e7d8f5": { "i": "tbg.3G7.paD.uN4.+oo.b", "d": "INr.jVY.sfu.+Zg.Zq3.Pz3.I8C.9pN.0dJ.+9D.RqX.vXB.44f.sZK.4SV.eyj.0gE.lnz.878.Wst.Gah.d" }, "91bf3870a55298884b703452eb24e2128bd6414e478a63b1c0834bc0abaae5da": { "i": "BlA.nxP.wRk.2aF.zS0.l", "d": "goZ.QJ4.RUn.zrA.Rmt.7rA.Cjp.nVm.RuA.+jA.jD2.4wW.0YE.gvf.Lol.SXy.phV.MKC.mFI.PNJ.+Sq.x" }, "2fb863fedf9b13e8f82761fcccc03af8c03dde5fc371eca136308afbf86712ce": { "i": "FLK.u4d.zxb.+GJ.B/x.R", "d": "azu.yin.4j2.dK1.HbJ.pi0.DXY.6aT.zf2.LEV.VVp.YRe.LYa./qJ.Kxe.rx4.8R9.BOQ.0vh.Bd7.Gnl.b" }, "a384e9f0dbc8d05f7d23970406367fc7ccd94d6b5b80241c20ed812d18dbe557": { "i": "eCc.IQK.lGv.kAK.fbK.B", "d": "ly6.Wiu.ROr.VtO.hWH.UGw.WnX.s0a.vZo.O7m.qAy.CSo.U/T.d0W.nlh.p0r.sHB.6Xx.2Y1.sc5.kuI.Y" }, "a40589acfb19e3832ee8ee9c7207ba7407de1c78d9fac2923e6a870449207a55": { "i": "Os4.o2q.rtI.Wni.8cb.0", "d": "MOh.4wH.B6Q.Eta.kMS.H+X.EvZ.nxF.uSU.9Sm.X5J.5iW.TLj.nsi.F+i.kn5.in5.3Xk.5R2.uCP.RDD.m" }, "5321259dcd06afacb4c21a3dc833cdbfcc630645a681ee22eb3b657bf859d9cf": { "i": "Ryp.wm3.pXb.I1y.lEJ.8", "d": "tWV.bwt.5mn.fn9.5ac.W7C.lE5.9LS./SJ.rtP.ru/.nrA.bvN.FWy.0Wr.NRC.4H1.61k.sQd.tYj.LPr.f" }, "c98610b547fbd30fe48090820f393b1e4dafd2248783743688a69bafda85b710": { "i": "0ko.kTf.XgD.jYU.0w+.y", "d": "//d.iXQ.8NP.DTU.l8y.2TH.Vj4.Dco.0og.xW5./Nu.NJ8.o7Z.15e.o8k.L70.NjQ.7qi.fqR.fBX.hit.Y" }, "4860f63f35edc1387516c631d84685767cb569608a02dc95a4d5ea566778fa8e": { "i": "Go8.KNQ.Sze.mOc.yCU.x", "d": "c2t.Xbl.40E.s5t.oFa.ECv.Kh5.SbW.GNl.Qf0.lqD.XVE.m0+.iMQ.iEF.owk.FQS.d3L.n2k.STA.V/+.4" }, "feeaf2a4af7370f1637f7c1238b0d6ef8c7af92ccc8f3284f55ec32c9ec6e331": { "i": "mea.ebG.A+5.lcI.98n.g", "d": "mmf.1vp./FN.eMe.DkJ.nhV.LDc.2uz.PPp.r+Q.kwM.qRO.npF.ovt.Evf.CJJ.8P9.HwC.BG0.SXB.c77.5" }, "1dbc42eadc7481f2a6d9e369ad8cd1352edfaae5125c25a5c9fdbc1f721ace24": { "i": "IGG.Buf.ofO.50B.6tZ.i", "d": "PKk.IVu.+75.IoF.cZk.A+7.mF1.Lgf.tFp.dK3.5jx.98d.h+j.L72.P4K.MpA.HMn.60e.iTY.00a.Z1q.n" }, "0aae72582e3496af2487f976b703fd9aabab7b3a1e040a776c732b1ea3ba1139": { "i": "xBy.7k5./ib.dy8.WNW.T", "d": "CqT.orB.sgq.w/g.hYE.KWI.B1G.eun.2US.RvG.pQ5.UGk.ynq.HLT.KLG.TfH.11L.8b4.Wad.0J5.KAO.l" }, "1db180948250179db72e5fc091681ad8f42806295ee15afc0e4f0183c23d86dd": { "i": "Bwt.EGR.Mzh.WXd.ARM.J", "d": "3VP.JCS.55C.Rkr.3bR.1Fv.me4.7Av.DJg.boz.Usa.2+n.AZI.UCG.Kla.zvo.koW.+WG.onu.7Px.9aF.z" }, "5733092c643318b91b4b89afa5e4d84b4a0b6e2504e1d1d2bcdb9370debf45cc": { "i": "9ne.jSE.oWD.GyZ.Bqy.5", "d": "G2h.SMl.Tk5.3X6.tSk.nUY.xOG.x4W.deR.u4v.UdM.LjM.1oB.7zq.9pY.V8G.en0.Bdx./Ld.9QI.UFC.l" }, "0b43e85dfbb929d93d93f4876e6bc7817174a0244d86d7b095a2f6518b9265ab": { "i": "WnB.1aq.Wnw.RnM.owZ.N", "d": "q7F.caP.Csb.Ef8.reh.bg5.qGa.Qqi.d3P.nRb.+s1.a2w.Jl0.dts.o9H.E4b.sw6.cWh.PNK.GSA.mUT.7" }, "6a6b601a416e96d72bee262f4aff34124e45a9e54682c143df9ffd3be19d631d": { "i": "fHY.adK./7x.jrE.Fup.x", "d": "1kb.jK5.uaF.9VY.5sQ.q5k.Vgh.8E9.fgA.fgR.rol.RGN.wwG.DiV.9o4.DXE.Nkk.Nqt.3KO.spX.LLp.j" }, "080ce04b3ab1389863f39568058f84255091a285f414389d255ec420a8c2c9d0": { "i": "xC3.qVc.sKP.Mi7.W3j.Y", "d": "nPI.49a.7y5.44a.OfW.1IO.2Op.2KC./be.E9Q.KG5.Sf1.fwG.Nm+.+fB.TTu.IeP.3gb.l0F.p8p.Cj1.p" }, "d917abbcd449e93006dfba32c773d7b1242946ee0446d39e065dd50744569d2b": { "i": "7ij.NaH.Lt0.1ia.60N.K", "d": "2+k.EQE.Ozi.uBJ.XT+.ZnW.ubh.NxH.yum.rGP.QIZ.F+y.MIo.V+x.Puv.+pV.EdJ.HTE.rdA.kGC.CTV.x" }, "bb7d0295cabfa8121fcfb208c7a6fb73cdb52ef317fa22d12caa7e519dd0cff7": { "i": "rT0.Snn.8Yy.f0Z.9+D.U", "d": "9RG.6gt.EuN.Api.QYx.imU.NU1.tkb.uo0.Qnu.8yS.iQp.UnN.W38.8Qa.sEX.IKg.DuB.O/M.R9p.0k+.P" }, "beb241d96fe42c9b6bff65abb84345452ff9bffb2d98012ae883ab9a0279d9ac": { "i": "jh/.6Yj.e4q.8tD.MSJ.I", "d": "kGB.+7B.opY.Sdm.gTm.ZD6.zy6.+KV.01a.ijP.DcF.TuY.AaC.9ij.Okc.k8S.r2h.i8N.G7w.Rst.4Il.D" }, "9b62937390b50594579a0d41e07dc5f7d8ea6f56293cdb1dee65a733b01a1515": { "i": "7Hu./g8.uoK.chw.+tp.R", "d": "f1Y.wTT.z1o.Jzw.VZz.ezP.KM1.eV5.wPu.VBd.+pJ.JEC.OV0.8xk.zlR.fYc.s8T.vv9.cHF.8qL.54n.x" }, "bc200f27ebf3cac5fab9af94b298534bfc90872505a0ea61442ba80200366542": { "i": "tUk.+Lo.6u7.253.gwy./", "d": "80r.bO1.SYN.IJu./bf.Vuk.152.uya.0L0.uvF.tqu.n/j.EnH.wMU.euy.8x6.pKC.mlJ.wkv.e7+.Z7y.q" }, "6e1b28dfc8dd041ada13cdc5041d0a6bd11b0b9c010fbfafe70581b63735bf92": { "i": "1yi.9Nf.kcM.Gty.ldR.i", "d": "2hm.BE9.Fcd.idr.us5.MFZ.F5n.vel.Uq+.VGy.vqs.kfr.TtF.TzW.FU5.kZ7.sh3.qbr.Nwy.4IR.5E9.H" }, "bf0279e0486a4b3ece2f3cd49dd9876192047145fd6662ddc57fd71ab39a9287": { "i": "mwz.DDw.jRi.rjD.4Xp.A", "d": "I+a.svH.zFV.DCD.gsE.Iav.KrC.xtP./22.APW.r1j.+eQ.VD4.owR.7ii.IoQ.PKh.8rU.0LY.sqi.Pv2.x" }, "0cd9892c3c94fea0dc00c35730a78a11a8f6a82d6163d7bcf81d0906ca7e257a": { "i": "T1P.0jg.6Xs.WRM.MTO.C", "d": "93z.8yL.cB1.9oF.2ee.60U.vBY.7C/.dw7./N/.9K5.itB.dcn.FYG.ACt.ZMx.vLm.akD.7GS.xgw.Qch.S" }, "121058039e64068dadaf75f23eab23718848fa9571b3cc0e96678f23e478dfd6": { "i": "FS2.Al7.1KA.Vvw.Qcd.G", "d": "31g.DdA.yI7.1bY.O/E.FV9.SQt.Fg6.J+O.SlT.T/z.a97.pII.3ob.TWX.zm1.1o3.KQH.V46.jJW.eq6.e" }, "fc236af902efd4259965065e2f4229c256e77b867049b2a0ce2324d9a90c7956": { "i": "2pI.HPe.HV0.2n8.vaR.S", "d": "Y41.aKk.u8Y.Wbq.oTl.L/p.NDa.xrj.ELW.3KD.r+L.qVg.eAY.KtB.gQn.TQb.f5c.Pb/.GsJ.srX.yyQ.m" }, "53a9ad39d0a0b7eb6802d8d67f236ece46dd279b6487b05df1db42d556f46271": { "i": "BKN.z3L./vo.p6f.VWl.j", "d": "eaQ.5Ja.rYo.gO6.4tS.KVK.p05.JsS.TIW.xrz.zEb.YaN.Qit.nc0.V0q.Oqo.hgk.PnS.bvD.GkX.YjX.K" }, "c97fde13820fbbee85d7f7a374856cdb115693b2a4bd8ab6838c391c46cbdd1e": { "i": "5J4.IgE.qUJ.5Ay.5PH.u", "d": "PRm.A6X.ZX5.Llb.mGK.N4a.o2F.Lpi.cDC.TK4.Fav.P+G.cAw.qe4.B5Z.iTe.Naq.fW6.2PM.yFq.6ca.l" }, "ae25b73bf7f00c8737381d1ce9ab23f95a9ab016ea4866a36c96394251a5f48b": { "i": "3el.tBm.HWU.fm8.vuM.X", "d": "WVy.S92.IRU.CZu.2Qm.QoD.Pnu.NMn.MJS.sJP.ZUc.jKI.l0H.hch.rHC.Zum.es7.WpM.E2x.RZB.km3.K" }, "de91575a83b1be77044a5fcb71157dd2a22e3714d4bb1782bfbf5dcd322aa112": { "i": "7Ti.qwb.BYk.oby.S4Z.p", "d": "lrR.yvp.L+C.oUN.KQf.nTf.pN1.LxA.QeQ.70+.sJA.6cs.GUk.maq.7h9.qLr.flu.2PP.pMX.2Ki.044.9" }, "78b5d305a8e48c5c8ceccaadf38cb167c8651f842b581f1262bc4bd9d0cbc44e": { "i": "qOr.9QJ.s/w.Taw.sOH.H", "d": "nJR.mtK.UWl.P+L.2sZ.6BH.BUr./ES.Bga.hCN.YbM.g7/.I9h.BKN.vML.+A7.6kR.cRW.nqb.5/v./1N.7" }, "e0070bb12ac65e31f030b3951f0d2f9bbee4122cc6e4ec22fc2f8fd6767fe7be": { "i": "/3G.BSw./Ru.ZJE.6Bc.0", "d": "4Ns.tVQ.o51.qGr.ts3.DMc.qlE.VT3.nac.0XR.StZ.LOi.hVa.4Kv.IKC.R3t.eS7.qEk.joI.o9Y.oie.P" }, "3e5c3560c1005f4a17acff0863125de44761a4e8346a2f6218fb3ffeed84d390": { "i": "dgM.5C+.8Yb.BHB.P0A.A", "d": "jzZ.8Hl.rqj.A4S.O41.wRl.fFh.K+J.8Lc.aIF.xIc.Vxg.8Mf.PH2.Y/t.siu.bjF.CJU.UVV.23A.AmA.j" }, "cf0afe896f8e106dedbf41a78d9624dc3f97236ed44b542fc02862f57145b040": { "i": "X1B.CC0.bIk.nNd.Zqd.h", "d": "4yf.lgD.fOJ.jMk.puG.+gO.91Q.cg0.eb0.sPX.01T.l3Q.f+4.pe5.50S.6P5.I7X.Eux.FKq.KbJ.aC0.7" }, "18a93c45cd87ae7776ef8f7c7a5946caabced8b4138a18057c5e0d15689fd274": { "i": "cjn.ymK.g0D.K8U.v6u.z", "d": "op1.QD9.Pt5.ffi.cQL.TQE.O17.2y0.XD3.4D9.PmM.meM.R5Q.e0s.32X.XO/.Ddx.QPd.den.Bvx.X1J.1" }, "05dc575665c92cd588e3dbc3211ef4c81db018b134a0dfee87ce6b03e20370c7": { "i": "gNI.8rH.fUn.nzD.w+Y.J", "d": "+sf.rgP.4fQ.fYN.ERy.NIQ.uq9.mnS.eMQ.8wT.kIx.WfO.4ok.x+K.ZzM.go5.o6K.8kL.i3s.736.hb0.y" }, "cec770217f6fef59a4338d228271f55a94a2f750c90901e82b4b02024428bc2d": { "i": "Faa.rog.7Kr.7B4.Jcy.o", "d": "L5+.yAX.wmj.0BX.PvE.Ybc.UZY.Z5z.SbB.uM+.8D8.JJm.UMh.UGv.LCU.lTf.xu0.o72.WUt.dko.cxe.z" }, "49302bba0efecbc9e90f8231c7d00a0a3ec2508909e3a52f6bd57a5ced9ad4c4": { "i": "jNY.4sB.exu.iHD.8XJ.s", "d": "k7l.CbT.6T8.4Hi.mk7.Z8d.vhC.ENf.INy.eE+.ruf.AyH.ey4.IMm.8GK.+nm.27S.tEb.Qk4.LkU.Vyh.g" }, "0566b912618c4d7d8a4265c7d5763f749c2bd6af2a54ec125e8f3fd830e38d7c": { "i": "Tt4.jFx.+bX.5Ym.Dsg.G", "d": "NGd.1+9.FTg.kxE.ZBH.Ipk.YmS.A8Z.XUA.qWS.Zqf.yTg.opY.4Df.Pdc.9ET./Pg.gSU.csh.NgV.eSU.K" }, "fd1394439b0d20a27aeaf09420c9c96a19ab5bd96d809a9d79b2ae4168cc461c": { "i": "g+v.cJl.cvU.Yb3.qvq.D", "d": "dc2.NZ4.KZk.sQo.Z5T.r7v.9NO.hsV.TjU.IYV.y9w.Mws.2YF.zWd.NAd.cus.JA2.8Ns.uSw.jBx.53R.r" }, "6ab6891dc68414477513fb35abe9458041f51227671aba3b98e4b3f34d4b2e99": { "i": "tv8.DNU.roz./ye.Go3.Z", "d": "Mq0.s4w.OvG.vFE.uvq.vqW.Saw.4In./BA.s8r.2Ez.spD.cZ6.ucP.8gS.O/i.nW8.F+v.Mvu.6k/.2JD.z" }, "b2a1236f2912cc25fc07dce7c9d72da81d83155edb52bcee26df476412c7bbe2": { "i": "79N.sH7.qz1.6b/.ZrI.E", "d": "ZaR.VA6.Y2C.jF9.98F.s/f.xfb.fcu.rcb.m4G.pRT.Z7W.t97.cm/.ShV.Jbi.DsL.zuV.AAW.czu.tKf.Q" }, "84f65afde4d6c0191a787f1b3b5fc3a0a52efb49fbf2c14bde1f780759ea26ba": { "i": "QgO.ODz.EOc.BZh.ID+.P", "d": "2km.j9K.cgm.a3d.8qy.V5u.7gU.bW8.Nzm.bR9.M4z.w72.Hk4.Ycz.uZx.QTZ.LkA.5W9.LNU.HZy.6J+.B" }, "ea2f7e450af04fcf241ce26c208ff3d3c7fdebb7db437bf464a61ee14650cdad": { "i": "re/.0aG.sa9.8rp.3Tp.7", "d": "1QV.lCQ.bHD.3kF.WcS.lgP.qj+.hhL.e2l.KBX.vhh.1IJ.LWu.sLn.QkD.kOo.rZt.XbT.K5Y.rTv.T5e.j" }, "a7b45e817cf3b1121f9171b90a5ddf512823baa12040009602ba166279af8182": { "i": "kJb.OTi.5wD.y36.6Ar.y", "d": "iKX.2Wq.VXq.qKv.7TS.uMZ.QCL.fS4.Klx.CV+.w8v.2rx.++5.JGa.UQP.0iK.1Zx.pGO.G1S.k/G.UuA.z" }, "0b55cc7bfe69343cd300f463fee4279121657a5a1b0fa1a36b3017a0c8435cf9": { "i": "QsR.Bue.a3t.9H5.J77./", "d": "KVv.Agh.hCN.Mop.fqa.gpN.IJq.i/h.3Jw.4Mi.d6D.T/q.dGA.8Xu.ZYz.0aR.88Y.udw.wI6.Dgi.bs/.f" }, "cfb97151675fc7682d8c85639de3c1a0c43f815e9e92d544abcd454794db511f": { "i": "saj.EVf.36v.gBM.bT2.R", "d": "grl.MC1.grm.VJy.MkI.9LM.py6.HNa.4hb.Dlw.0sA.56Z.qgw.kAL.Dg5.M/W.ji9.yli.U/P.cLV.2/6.b" }, "90802705576e716c8c3dad24f75af700cef3f1229c9b54902c74f453740b8225": { "i": "0vn.pFP.Gna.3MJ.6oh.A", "d": "YOs.8oI.3ro.HQF.Xu0./nZ.Xc5.hBY.v5c.jal.pA8.ULz.dCS.T92.sWr.31C.Xbh.Mn3.vtE.nC6.wBR.3" }, "9df736d7f1df649ba1f34a46da32a6456039e5e84c117edc1c47fddfbb8c7189": { "i": "z8I.jsD.yvY.h88.yIn.B", "d": "QiG.uow.sMM.3hs.uxT.xRy.wJw.vZn.leE.u90.tcm.5HN.C7V.l0v.De+.HLX.pK/.G66.xX6.PFN.zg+.I" }, "7ef327a588f75cf2214dd59aec8d329eab52e93cf10d325adb06baf4ee8ec1c5": { "i": "+eL.akD.SuQ.REX.Enf.P", "d": "tl1.863.Hv1.uZD.F6A.6Kl.DA2.dY0.V6Y.mkO.Wvu.I5n.kFq.vP6.0/2.bQk.sf5.Txh.i15.YN7.QLg.Q" }, "e90de769f3f1f02e0b5ee3a10ad77da706a241c92b4ab447d9608a79054246c1": { "i": "hiT.R2N.1OT.Ucn.Xn3.b", "d": "H4J.2Yf.10q.bul.v5c.OPx.48L.bIk.7Lk.fsA.nK8.mr3.YF8.GFH.bcZ.nTN.j43.pDJ.L1R.EM1.Yun.z" }, "498ae937f235e889c98327c59694e59a296efe3db7c4f6b3721f20bef5988c52": { "i": "vU4.HOy.wiM.Lum.QGq.K", "d": "Izt.wib.h11.wUk.6Uk.RTg.76N.kCH.JFt.BVJ.vJc.7bv.eFa.qDV.0MT.viy.dEw.zZh.INk.6Rz.QUY.D" }, "a8dde176f5e8813be3deafb146fe33fc6462e870bb66738adb4438ef12ffe20b": { "i": "nUA.Iyg.hxd.9IN.qAk.I", "d": "/ep.WUD.ktu.J7F.sa6.Osh.W7s.a3Y.qx6.NM7.cEJ.FGm.HVW.Uwe.qMh.RFk.keL.J0v.P1s.a6n.p1l.B" }, "e982acda3e18d7f59f96804dcd22fa8f8b4a3c0624b1d5f6503068f8e181539a": { "i": "ydj.O2e.HFy.leo.PUl.m", "d": "RmW.9EC.i1K.Ev5.KYn.2Yp.3JB.mEh.uwZ.Ekv.gL3.PVx.c18.3IB.nB4.oVk.2yE.aAr.V/a.ggS.5kL.z" }, "8e24503353347c298c9298f04f9dc5fce562f24a68135e01784b8b214853ae17": { "i": "uUT.JXr.0Z4.hp8.966.W", "d": "F6A.V+1.7ZQ.Xdw.r+b.WZw.bzU.Iwx.dQJ.Z26.l7X.0QP.+kL.jmB.rfl.myp.8C4.92w.m4R.JLU.9Q5.e" }, "4e219981da360ba6db4b96e152e5f38af049b9a3981d84d127057e5708e11b8b": { "i": "ogc.nRZ.6ih.jW0.cRr.5", "d": "yMe.1yV.SU9.WQX.kdX.Vpm.I7b.Q4R.xJ1.sY6.IgU.O3Q.kiF.pU7.sBO.anB.1gd.hSi.nU5.NzB.353.0" }, "59d300b58ab626912a6c7411e8076a21fe9caeed56bd537260978a8535d9742a": { "i": "mQo.lGI.ixl.dcZ.sJr.b", "d": "unf.qN2.o9o.2Ie.WPG.nTK.AAr.JMt.AaK.gzP.6I1.scA.wkv.v4G.0+h.oXN.oNf.kGh.nQD.lTO.fkI.g" }, "a4b44204a2c454351e7476ab23d1d07fd715a113660dd9c693fe91da375b5185": { "i": "Mwg.5Ir.Ldb.Uah.+0H.M", "d": "d+H.tno.3g9.M2u.Qw8.6M0.FvL.LV4.NFU.4Ls.pfR.jJt.xlr.lAt.8Cb.ztd.1kY.MnB.nl3.6MP.trB.n" }, "5e601905f1902d7e952c4cc3abbaf0fcfd12b4ddd6f17384a71f64a4bbdc858a": { "i": "ek0.g1F.EFr.hVc.TVo.k", "d": "Dig.GYM.xO9.DpI.56Z.YVe.EwO.bV7.nbg.zAz.RFg.zUa.dby.pnm.909.cJA.NI9.zvn.WJh.NcQ.dZI.h" }, "288d3e7225bf3f9093fe998a1b688598ff96e161d3b332115ddca7823b7bf19c": { "i": "lEy.qg1.6Y0.Llc.XMP.J", "d": "dBC.sX8.mHq.ILd.ylU.U2N.C5o.VxD.RPK.VcI.+IF.hpB.pHl.u7W./dG.5HX.EPX.1/v.dhF.N1L.sMw.G" }, "2c9446dad9859fa28994ae2c1bf20c9326d4d6b31a3f2acd26a3551f121c63f0": { "i": "3uV.ydN.mI7.D4x.uTP.K", "d": "e7v.d7O.Cjj.ySW.3YP.Q50.P2/.UXP.KdL.vwz.LdP.nIz.u1S.hAX.XdV.Ezd.D0F.75+.Eru.YwP.Psm.M" }, "d73a92c46c9735cc76b2f2e80b8f7203cd708a4392eee13be83227d1867c3724": { "i": "ctP.G55.A/y.0wx.pMm.z", "d": "whQ.1/Y.ZmD.vPL.mKj.fJ7.CB6.vdn.CuA.5+z.3Al.Uxw.koO.OJu.qfw.stU.NH8.Ilo.0LR.aPM.nJL.m" }, "6a9f1874e834cf4f9bbb333dde9ba4370243d31083881f11d0693d6350aa5126": { "i": "m5D.tHn.E26.8dQ.TAO.e", "d": "rlT.Dwm.0bG.CWL.GSb.NLt.TMl.DDP.z73.XAp.kKZ.QJr.6FB.2+W.zVt.xVu.Ipk.U/A.QUn.YPf.xKl.p" }, "3d64678ec319c36d952d3e1f18d13c0e4e01ab9a510022b48443cee82e401efb": { "i": "TkG.1B0.7MR.TBm.DuZ.v", "d": "2tC.C+R.B91.36Z.wxN.N5V.Ab3.0fD.UnI.fiJ.nbe.4jy.aO4.YSy.BPX.eHU.ueS.LXV.qeN.4oP.li+.1" }, "b9f323cb5b6bce05510e71131a194720e5b584c5660a8131749cfc593df2cd3c": { "i": "z4p.P+/.lA0.GlC.MRH.7", "d": "Lnt.yZR.0f9.KIk.oL2.U03.yBn.eW/.t5Y.DHl.XkW.jDF.ShW.hs7.7nW.SSJ.mj4.ivi.ScY.Fg1.NKn.u" }, "d353a6d1d4c6e0e45a4d13b9b91e524c66567153f2fe3206226f0890acefb983": { "i": "zlp.d6P.SQF.sjY.Qlr.v", "d": "G9h.5ze.zjX.yxW.3A5.jiU./Fy.HT0.tWY.L1W.uZC.5ga.g7U.Vwq.0Tt.Ph2.SrX.91c.Xbx.gp8.Y6P.T" }, "a0e4e64dad59285364850887fed666f7f47acec97b39c4a95245a93fbd79c60a": { "i": "TRS.5Vz.IU1.rXX.5g6.W", "d": "jmd.R7U.iD+.RlV.JBh.9c/.XKJ.LNW.oZU.Sag.Mrx.c7e.u6X.oEB.+7p.6t+.ik3.3X1.m3X.XFb.kGI.N" }, "d1411eb0eec95762509d095a50084574a8666b6d6411849195b2f7d92a0899c6": { "i": "Hsn.etk.G2M.3Y/.p6v.B", "d": "c5z.WHD.ROO.H1l.zfT.ewu.Vl+.IKa.Z3y.sbB.TqX.6CT.vvh.2MT.kDl.DJp.et5.ohC.3tv.8Xi.zqN.M" }, "eaaccfb2eb681481c1b450c02701f96ee6e71f0a899ec896ff94519a70965860": { "i": "ES4.ZyN.bWU.Zw+.v0J.R", "d": "51a.KkV.9Fg.bqz.8aG.vm7.M0X.Zeo.ph9.DzE.t1D.YIe./ZL.ir+.468.UBp.ueK.Tko.NLe.Hwi.vgE.R" }, "eef818ec8da86e733448122b4ab98365d66126f0e0844e9d4d8a4347f81cf03d": { "i": "js3.aVR.4C8.8Fe.Ep1.H", "d": "u9f.VEW.ufE.s3K.wC9.C4w.69W.d44.FHT.lNh.b4g.Hwf.jq4.Get.cJe.Etd.dZa.Lve.M9v.Tec.Tzo.L" }, "959fdd6ced26d692d52223217a5a14ed5db98c9a26935473438a9321aa66a637": { "i": "CSW.8Hy.0uA.wAY.JaT.F", "d": "jh+.yyY.6ir.QEt.Zfv.XiQ.feV.pdF.HhL.iiN.Wm7.lei.lNC.xr8.8hR.D16.Iab.Qva.gYW.B1W.90r.A" }, "5b9832100b216c359c74ad6a649ee95d652a3fc32f8c22c20192ef584d298a6f": { "i": "Yk/.Bk8.0xT.G7i.7UX.c", "d": "iLr.Udw.DY9.GDq.D9q.vYu.Gbp.1Gg.PiG.CT7.9Am.zw9.F2y.Kj/.kHL.pxb.ajf.Kes.CPH.4E5.Shg.D" }, "9b7f38608917f4517c938a34236c5a8a4d56bab16ba5dc2ff555e9b53fb3df08": { "i": "roN.cBY.Wk0.NBC.MYJ.F", "d": "S1i.FyN.9z8.ROn.s1p.DEq.YeF.PEH.5V4.SMZ.cL8.WuD.pkg.74Z.NOS.myT.D4N.4iY.ftQ.Z6J.nH7.7" }, "a0763a45d2345a6e9ee70b5022e0fc6f0b949f15bc142d3d60ecace0741842bd": { "i": "RTz.rCv.GZh.7jF.WqL./", "d": "0WW.70r./9b.DKZ.6i2.Wmd.nkm.SXi.99U.q2T.7/b.Hjd.WNg.TGi.2Bt.8AL.maV.WSu.OIi.Twi.Y96.B" }, "2ea1e50bd59accfe452ec98703ef4578d8f79ed8e4203e2eff5b447b8467c4ef": { "i": "1JO.QVN.Ufd.gdX.3KO.S", "d": "HI1.cWb.xIh.EaG.lKq.nLX.GSy.XzT.1ov.2rw.G+y.2q0.Sno.uMD.5Bv.vFm.LXl.oKf.NBm.O9B.DbL.2" }, "c18da6f45e683b90f0dab0ca3e38305011f52bcab7031e6835caa15345dfe46f": { "i": "Xg6.PIi.MCD.ArG.9Nb.Z", "d": "GCN.UF4.qTc.Mz4.Xu5.AfJ.LHl.e3n.qZy.h7f.YyW.sdu.S/b.rZQ.oDQ.CRW.Gyo.tEJ.WfY.5rK.Z3I.u" }, "87d6782722475d216d23d52fc588305bc70d3f46d11d77630a8fd9f01ad97172": { "i": "agr.+Rw.QS7.Qju.qe2.3", "d": "ncB.twL.FWI.UR/.Xse.PrH.y9I.Sa7.Sm1./sy.28x.3q1.LFR.VkX.rpi.tB5.3BA.yoQ.pvn.kFK.zuE.r" }, "99c0d4b628328fd207ea7ca9cb8ecfefa406ef2f8da9fef963365bb0812b3385": { "i": "7j/.6Gp.+oy.1st.SG0.Y", "d": "33v.5wE.lQq.RIP.q4t.eww.p4G.nNx.R+j.NTl./Oi.8Q1.ePX.448.07P.P+n.+Gz.Jy1.wVj.aPH.cI4.b" }, "48e7b342980030bbf07c5bac3acfef5027b784d02d1ed666e5aa0824865fa9db": { "i": "vY9.XGH.bin.vbO.NsG.n", "d": "ZlX.2gS.pYQ.ndf.ou1.Ym3.dZd.bKu.2ZC.3OG.JSB.DDY.iYs.t8L.zvE.GjH.fBE.GKv.wfG.ffX.x0M.d" } } };
    const baseVariant = avatarVariant2;
    const attempts = /* @__PURE__ */ new Map();
    let installing = null;
    let payloadPromise = null;
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const norm = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
    const bytes = (v) => Uint8Array.from(atob(v.replace(/\./g, "")), (c) => c.charCodeAt(0));
    const hex = (v) => Array.from(new Uint8Array(v), (b) => b.toString(16).padStart(2, "0")).join("");
    const subtle = globalThis.crypto?.subtle;
    const payloadUrl = (() => {
      const here = typeof location !== "undefined" ? location.href : "http://localhost/";
      const base2 = typeof document !== "undefined" && document.currentScript?.src ? new URL("extra-content.pack.js", document.currentScript.src) : new URL("js/extra-content.pack.js", here);
      base2.searchParams.set("v", pack.v);
      return base2.href;
    })();
    function takePayload() {
      const value = globalThis.__hsPackData;
      delete globalThis.__hsPackData;
      return value?.v === pack.v ? value : null;
    }
    function loadPayload() {
      if (payloadPromise) return payloadPromise;
      const present = takePayload();
      if (present) return payloadPromise = Promise.resolve(present);
      if (typeof document === "undefined") return Promise.reject(new Error("Optional content payload is unavailable."));
      payloadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = payloadUrl;
        script.async = true;
        script.onload = () => {
          const value = takePayload();
          script.remove();
          value ? resolve(value) : reject(new Error("Optional content payload was empty."));
        };
        script.onerror = () => {
          script.remove();
          reject(new Error("Optional content payload could not be fetched."));
        };
        document.head.appendChild(script);
      }).catch((error) => {
        payloadPromise = null;
        throw error;
      });
      return payloadPromise;
    }
    async function open(record, wrapping) {
      const [rawKey, payload] = await Promise.all([subtle.decrypt({ name: "AES-GCM", iv: bytes(record.i) }, wrapping, bytes(record.d)), loadPayload()]);
      const contentKey = await subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
      const compressed = await subtle.decrypt({ name: "AES-GCM", iv: bytes(payload.iv) }, contentKey, bytes(payload.data));
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
      const plaintext = await new Response(stream).arrayBuffer();
      const code = dec.decode(plaintext);
      new Function(code)();
      try {
        globalThis.__hsContentSource = code;
        globalThis.__hsContentInstalled && globalThis.__hsContentInstalled(code);
      } catch (e) {
      }
    }
    async function probe(name) {
      if (!subtle || typeof DecompressionStream === "undefined") return;
      let active = null;
      try {
        const input = await subtle.importKey("raw", enc.encode(name), "PBKDF2", false, ["deriveBits"]);
        const rawMaterial = await subtle.deriveBits({ name: "PBKDF2", salt: bytes(pack.s), iterations: pack.n, hash: "SHA-256" }, input, 256);
        const material = await subtle.importKey("raw", rawMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const [rawFingerprint, rawWrapping] = await Promise.all([subtle.sign("HMAC", material, enc.encode("lookup")), subtle.sign("HMAC", material, enc.encode("wrap"))]);
        const fingerprint = hex(rawFingerprint);
        const record = pack.k[fingerprint];
        if (!record) return;
        const wrapping = await subtle.importKey("raw", rawWrapping, { name: "AES-GCM" }, false, ["decrypt"]);
        if (!installing) installing = open(record, wrapping);
        active = installing;
        await active;
      } catch (error) {
        attempts.delete(name);
        if (active && installing === active) {
          installing = null;
          payloadPromise = null;
          console.warn("Optional content could not be loaded.", error);
        } else if (!active) console.warn("Optional content lookup failed.", error);
      }
    }
    avatarVariant2 = function contentPackVariant(name) {
      const normalized = norm(name);
      if (normalized && !attempts.has(normalized)) {
        const attempt = Promise.resolve().then(() => probe(normalized));
        attempts.set(normalized, attempt);
      }
      return baseVariant(name);
    };
  })();
  setAvatarVariant(avatarVariant2);

  // src/render/canvas.js
  var canvas_exports = {};
  __export(canvas_exports, {
    RENDER_SCALE: () => RENDER_SCALE,
    canvas: () => canvas,
    ctx: () => ctx,
    drawBody: () => drawBody,
    fitCanvasToDisplay: () => fitCanvasToDisplay,
    initCanvas: () => initCanvas
  });
  var canvas = null;
  var ctx = null;
  var RENDER_SCALE = 1;
  var DESIGN_W = 1280;
  var DESIGN_H = 720;
  var MAX_SUPERSAMPLE = 2;
  function initCanvas(el) {
    canvas = el;
    ctx = el.getContext("2d", { alpha: false });
    fitCanvasToDisplay();
    if (typeof addEventListener === "function") addEventListener("resize", fitCanvasToDisplay);
    return ctx;
  }
  function fitCanvasToDisplay() {
    if (!canvas || !canvas.style || typeof canvas.getBoundingClientRect !== "function") return;
    const dpr = globalThis.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || DESIGN_W;
    const scale2 = Math.min(cssW * dpr / DESIGN_W, MAX_SUPERSAMPLE);
    const bw = Math.max(1, Math.round(DESIGN_W * scale2));
    RENDER_SCALE = bw / DESIGN_W;
    if (canvas.width === bw) return;
    canvas.width = bw;
    canvas.height = Math.max(1, Math.round(DESIGN_H * scale2));
    ctx.textAlign = "center";
  }
  function drawBody(body) {
    ctx.beginPath();
    const v = body.vertices;
    ctx.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
    ctx.closePath();
    ctx.fill();
  }

  // src/net/telemetry-post.js
  function postTelemetryHttp(rec) {
    try {
      if (!/^https?:$/.test(location.protocol)) return;
      fetch("/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rec),
        keepalive: true
        // survive a page unload mid-flush
      }).catch(() => {
      });
    } catch {
    }
  }

  // src/platform/input-keyboard.js
  var input_keyboard_exports = {};
  __export(input_keyboard_exports, {
    KEYMAPS: () => KEYMAPS,
    KeyboardController: () => KeyboardController,
    attachKeyboard: () => attachKeyboard,
    kbControllers: () => kbControllers,
    keys: () => keys,
    mouse: () => mouse,
    syncMouseWorld: () => syncMouseWorld
  });

  // src/render/audio.js
  var audio_exports = {};
  __export(audio_exports, {
    ensureAudio: () => ensureAudio,
    playSfx: () => playSfx,
    voiceKeys: () => voiceKeys
  });
  var audioCtx = null;
  var master = null;
  var echo = null;
  var noiseBuf = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      master = audioCtx.createGain();
      master.gain.value = 0.9;
      const comp = audioCtx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 5;
      comp.attack.value = 3e-3;
      comp.release.value = 0.2;
      master.connect(comp).connect(audioCtx.destination);
      echo = audioCtx.createGain();
      echo.gain.value = 0.9;
      const dly = audioCtx.createDelay(1);
      dly.delayTime.value = 0.16;
      const fb = audioCtx.createGain();
      fb.gain.value = 0.3;
      const damp = audioCtx.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 2200;
      echo.connect(dly);
      dly.connect(damp).connect(fb).connect(dly);
      dly.connect(master);
      const len = audioCtx.sampleRate * 2;
      noiseBuf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }
  var vary = (f, pct = 0.04) => f * (1 + (Math.random() * 2 - 1) * pct);
  var volScale = 1;
  var _plays = {};
  var GATES = {
    jump: { gap: 55, window: 320, free: 2, duck: 0.45 },
    cast: { gap: 40, window: 350, free: 3, duck: 0.55 },
    explosion: { gap: 60, window: 450, free: 2, duck: 0.5 },
    lightning: { gap: 70, window: 400, free: 2, duck: 0.5 },
    thud: { gap: 60, window: 400, free: 2, duck: 0.5 },
    squeak: { gap: 60, window: 400, free: 2, duck: 0.5 },
    pickup: { gap: 50, window: 400, free: 3, duck: 0.6 },
    default: { gap: 30, window: 400, free: 4, duck: 0.7 }
  };
  function gateScale(key) {
    const g = GATES[key] || GATES.default;
    const now = performance.now();
    const arr = _plays[key] ??= [];
    while (arr.length && now - arr[0] > g.window) arr.shift();
    if (arr.length && now - arr[arr.length - 1] < g.gap) return 0;
    arr.push(now);
    const over = arr.length - g.free;
    return over > 0 ? Math.pow(g.duck, over) : 1;
  }
  function voiceOut(g, { pan = 0, send = 0 }) {
    let node = g;
    if (pan && audioCtx.createStereoPanner) {
      const p = audioCtx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan + (Math.random() - 0.5) * 0.2));
      g.connect(p);
      node = p;
    }
    node.connect(master);
    if (send > 0) {
      const s = audioCtx.createGain();
      s.gain.value = send;
      node.connect(s).connect(echo);
    }
  }
  function tone({
    type = "sine",
    freq = 440,
    freqEnd,
    dur = 0.1,
    vol = 0.2,
    delay = 0,
    attack = 5e-3,
    detuneCents = 0,
    curve = "exp",
    pan = 0,
    send = 0
  }) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime + delay;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(1e-4, t0);
    g.gain.linearRampToValueAtTime(vol * volScale, t0 + attack);
    g.gain.exponentialRampToValueAtTime(1e-3, t0 + dur);
    voiceOut(g, { pan, send });
    const oscs = detuneCents ? [-detuneCents, detuneCents] : [0];
    for (const dt of oscs) {
      const osc = audioCtx.createOscillator();
      osc.type = type;
      osc.detune.value = dt;
      osc.frequency.setValueAtTime(Math.max(freq, 1), t0);
      if (freqEnd) {
        if (curve === "exp") osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
        else osc.frequency.linearRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
      }
      const og = audioCtx.createGain();
      og.gain.value = 1 / oscs.length;
      osc.connect(og).connect(g);
      osc.start(t0);
      osc.stop(t0 + dur + 0.06);
    }
  }
  function noise({
    dur = 0.3,
    vol = 0.3,
    delay = 0,
    type = "lowpass",
    from = 1e3,
    to,
    q = 0.8,
    attack = 4e-3,
    pan = 0,
    send = 0
  }) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime + delay;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = 2;
    const filt = audioCtx.createBiquadFilter();
    filt.type = type;
    filt.Q.value = q;
    filt.frequency.setValueAtTime(Math.max(from, 10), t0);
    if (to) filt.frequency.exponentialRampToValueAtTime(Math.max(to, 10), t0 + dur);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(1e-4, t0);
    g.gain.linearRampToValueAtTime(vol * volScale, t0 + attack);
    g.gain.exponentialRampToValueAtTime(1e-3, t0 + dur);
    src.connect(filt).connect(g);
    voiceOut(g, { pan, send });
    const off = Math.random() * 1.5;
    src.start(t0, off);
    src.stop(t0 + dur + 0.06);
  }
  var SFX_DEFS = {
    jump: () => {
      tone({ type: "sine", freq: vary(190), freqEnd: 330, dur: 0.09, vol: 0.09 });
      noise({ dur: 0.07, from: 600, to: 1400, type: "bandpass", vol: 0.05, q: 1.2 });
    },
    cast: () => {
      noise({ dur: 0.16, from: vary(500), to: 2600, type: "bandpass", vol: 0.14, q: 1.6 });
      tone({ type: "triangle", freq: vary(880), freqEnd: 1500, dur: 0.1, vol: 0.05, delay: 0.03, send: 0.3 });
    },
    explosion: () => {
      tone({ type: "sine", freq: vary(95), freqEnd: 30, dur: 0.5, vol: 0.5 });
      noise({ dur: 0.45, from: vary(1400), to: 70, vol: 0.42 });
      noise({ dur: 0.1, from: 4200, to: 900, type: "highpass", vol: 0.16, delay: 5e-3 });
    },
    lightning: () => {
      noise({ dur: 0.05, from: 5200, type: "highpass", vol: 0.42, attack: 1e-3 });
      noise({ dur: 0.28, from: 2600, to: 420, type: "bandpass", vol: 0.2, q: 1.1 });
      tone({ type: "sine", freq: 120, freqEnd: 55, dur: 0.18, vol: 0.18 });
    },
    death: () => {
      tone({ type: "sawtooth", freq: vary(290), freqEnd: 52, dur: 0.45, vol: 0.18, detuneCents: 12 });
      noise({ dur: 0.3, from: 900, to: 90, vol: 0.2, delay: 0.04 });
      tone({ type: "sine", freq: 75, freqEnd: 34, dur: 0.35, vol: 0.24, delay: 0.02 });
    },
    pickup: () => {
      tone({ type: "triangle", freq: 660, dur: 0.09, vol: 0.13, send: 0.25 });
      tone({ type: "triangle", freq: 990, dur: 0.12, vol: 0.13, delay: 0.07, send: 0.25 });
      tone({ type: "sine", freq: 1980, dur: 0.1, vol: 0.04, delay: 0.1, send: 0.4 });
    },
    blackhole: () => {
      tone({ type: "sine", freq: 220, freqEnd: 26, dur: 1.2, vol: 0.26, detuneCents: 9 });
      noise({ dur: 1.1, from: 300, to: 45, vol: 0.14, send: 0.3 });
    },
    freeze: () => {
      tone({ type: "triangle", freq: vary(1400), freqEnd: 480, dur: 0.22, vol: 0.12, send: 0.35 });
      noise({ dur: 0.3, from: 5e3, to: 2400, type: "highpass", vol: 0.06 });
      tone({ type: "sine", freq: 2093, dur: 0.12, vol: 0.05, delay: 0.05, send: 0.5 });
    },
    fight: () => {
      tone({ type: "square", freq: 392, freqEnd: 784, dur: 0.14, vol: 0.17, detuneCents: 8 });
      noise({ dur: 0.09, from: 1800, to: 500, type: "bandpass", vol: 0.12, q: 1 });
    },
    boing: () => {
      tone({ type: "sine", freq: vary(140), freqEnd: 900, dur: 0.2, vol: 0.17, curve: "exp" });
      tone({ type: "sine", freq: 900, freqEnd: 620, dur: 0.1, vol: 0.08, delay: 0.18 });
    },
    clang: () => {
      tone({ type: "square", freq: vary(880), dur: 0.2, vol: 0.1, attack: 1e-3 });
      tone({ type: "square", freq: vary(1244), dur: 0.13, vol: 0.07, attack: 1e-3 });
      noise({ dur: 0.08, from: 4500, to: 1500, type: "highpass", vol: 0.14, attack: 1e-3 });
    },
    squeak: () => {
      tone({ type: "sine", freq: vary(1200), freqEnd: 1900, dur: 0.11, vol: 0.14 });
      tone({ type: "sine", freq: 1700, freqEnd: 2100, dur: 0.07, vol: 0.07, delay: 0.09 });
    },
    oink: () => {
      tone({ type: "sawtooth", freq: vary(220), freqEnd: 380, dur: 0.09, vol: 0.15 });
      tone({ type: "sawtooth", freq: 380, freqEnd: 170, dur: 0.12, vol: 0.15, delay: 0.09 });
      noise({ dur: 0.1, from: 700, to: 350, type: "bandpass", vol: 0.07, q: 2, delay: 0.05 });
    },
    hyper: () => {
      [392, 523, 659, 784, 1047].forEach((f, i) => tone({ type: "square", freq: f, dur: 0.11, vol: 0.13, delay: i * 0.05, detuneCents: 7, send: 0.35 }));
      noise({ dur: 0.4, from: 250, to: 3200, type: "bandpass", vol: 0.16, q: 1.4 });
      tone({ type: "sine", freq: 98, freqEnd: 45, dur: 0.35, vol: 0.3, delay: 0.25 });
    },
    event: () => {
      tone({ type: "triangle", freq: 330, freqEnd: 660, dur: 0.2, vol: 0.18, detuneCents: 10, send: 0.5 });
      tone({ type: "triangle", freq: 660, freqEnd: 495, dur: 0.26, vol: 0.16, delay: 0.16, detuneCents: 10, send: 0.5 });
      noise({ dur: 0.5, from: 700, to: 3400, type: "bandpass", vol: 0.06, q: 1.5, send: 0.4 });
    },
    thud: () => {
      tone({ type: "sine", freq: vary(80), freqEnd: 36, dur: 0.16, vol: 0.28 });
      noise({ dur: 0.09, from: 380, to: 70, vol: 0.16 });
    },
    boss: () => {
      tone({ type: "sawtooth", freq: 92, freqEnd: 42, dur: 0.9, vol: 0.24, detuneCents: 14 });
      tone({ type: "sine", freq: 55, freqEnd: 30, dur: 1.1, vol: 0.32 });
      noise({ dur: 0.9, from: 500, to: 60, vol: 0.22 });
      noise({ dur: 0.7, from: 220, to: 110, type: "bandpass", vol: 0.14, q: 2, delay: 0.3, send: 0.4 });
    },
    roundWin: () => [523, 659, 784].forEach((f, i) => tone({ type: "triangle", freq: f, dur: 0.2, vol: 0.16, delay: i * 0.12, detuneCents: 6, send: 0.35 })),
    victory: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ type: "triangle", freq: f, dur: 0.28, vol: 0.17, delay: i * 0.15, detuneCents: 8, send: 0.45 }));
      noise({ dur: 0.8, from: 900, to: 4200, type: "bandpass", vol: 0.06, q: 1.2, delay: 0.45, send: 0.5 });
    }
  };
  var VOICES = {};
  for (const [key, fn] of Object.entries(SFX_DEFS)) {
    VOICES[key] = () => {
      if (!audioCtx) return;
      const s = gateScale(key);
      if (!s) return;
      volScale = s;
      try {
        fn();
      } finally {
        volScale = 1;
      }
    };
  }
  function playSfx(key) {
    VOICES[key]?.();
  }
  var voiceKeys = () => Object.keys(VOICES);

  // src/render/fx.js
  var fx_exports2 = {};
  __export(fx_exports2, {
    PARTICLE_CAP: () => PARTICLE_CAP,
    TEXT_CAP: () => TEXT_CAP,
    addShake: () => addShake2,
    applyEmitted: () => applyEmitted,
    clearParticles: () => clearParticles2,
    doFlash: () => doFlash2,
    drawParticles: () => drawParticles,
    flashAlpha: () => flashAlpha,
    flashColor: () => flashColor,
    fxPick: () => fxPick,
    fxRandom: () => fxRandom,
    fxRange: () => fxRange2,
    handledEmitNames: () => handledEmitNames,
    particleCount: () => particleCount,
    particles: () => particles,
    pumpEmitted: () => pumpEmitted,
    pushParticle: () => pushParticle,
    setFlashAlpha: () => setFlashAlpha,
    setShake: () => setShake,
    shake: () => shake,
    spawnBurst: () => spawnBurst2,
    spawnParticles: () => spawnParticles2,
    spawnRing: () => spawnRing2,
    spawnText: () => spawnText2,
    trimParticles: () => trimParticles,
    unhandledEmitted: () => unhandledEmitted,
    updateParticles: () => updateParticles
  });

  // src/render/effects.js
  var effects_exports = {};
  __export(effects_exports, {
    boltVisual: () => boltVisual2,
    clearFxEffects: () => clearFxEffects,
    drawFxEffects: () => drawFxEffects,
    drawVfx: () => drawVfx,
    fxEffects: () => fxEffects
  });
  var fxEffects = [];
  var fxRange = (a, b) => a + Math.random() * (b - a);
  function prune(now) {
    for (let i = fxEffects.length - 1; i >= 0; i--) if (now > fxEffects[i].until) fxEffects.splice(i, 1);
  }
  function boltVisual2(x0, y0, x1, y1, color = "#fff89e", width = 3, life = 130) {
    const now = simNow();
    prune(now);
    const pts = [{ x: x0, y: y0 }];
    const segs = 9;
    for (let i = 1; i <= segs; i++) {
      pts.push({
        x: x0 + (x1 - x0) * i / segs + (i < segs ? fxRange(-14, 14) : 0),
        y: y0 + (y1 - y0) * i / segs + (i < segs ? fxRange(-14, 14) : 0)
      });
    }
    fxEffects.push({ until: now + life, pts, color, width });
  }
  function clearFxEffects() {
    fxEffects.length = 0;
  }
  function drawFxEffects(now, ctx2) {
    prune(now);
    for (const e of fxEffects) {
      ctx2.strokeStyle = e.color;
      ctx2.lineWidth = e.width;
      ctx2.beginPath();
      ctx2.moveTo(e.pts[0].x, e.pts[0].y);
      for (const q of e.pts.slice(1)) ctx2.lineTo(q.x, q.y);
      ctx2.stroke();
    }
  }
  function drawVfx(e, now, ctx2) {
    const v = e.vfx;
    if (!v) return;
    switch (v.k) {
      case "sing": {
        ctx2.fillStyle = "#0a0510";
        ctx2.beginPath();
        ctx2.arc(v.x, v.y, 26, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.strokeStyle = "#a55eea";
        ctx2.lineWidth = 3;
        ctx2.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
        ctx2.beginPath();
        ctx2.arc(v.x, v.y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.globalAlpha = 1;
        break;
      }
      case "zone": {
        ctx2.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
        ctx2.fillStyle = v.c;
        ctx2.beginPath();
        ctx2.arc(v.x, v.y, v.r, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.globalAlpha = 1;
        break;
      }
      case "blizzard": {
        ctx2.globalAlpha = 0.14;
        ctx2.fillStyle = v.c;
        ctx2.beginPath();
        ctx2.arc(v.x, v.y, v.r, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.globalAlpha = 1;
        for (let i = 0; i < 3; i++) {
          pushParticle({ kind: "square", x: v.x + fxRange(-220, 220), y: v.y + fxRange(-200, 100), vx: fxRange(-1, 1), vy: fxRange(1, 3), life: 24, maxLife: 24, color: "#fff", r: 2 });
        }
        break;
      }
      // The air tornado. Untinted, always: the only sim descriptor of this kind
      // is spells/book.js's Tornado, and Firestorm's tinted funnel is `firetor`
      // below. The tint lives on the WIRE's `tor` payload instead — a LAN client
      // gets one descriptor for both funnels and draws them in
      // src/render/draw-snapshot.js's drawFxLite, which does read `c`.
      case "tor": {
        ctx2.strokeStyle = "rgba(207,232,232,0.55)";
        ctx2.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const yy = H - 80 - i * 90;
          const w = 26 + i * 22;
          ctx2.beginPath();
          ctx2.ellipse(e.x + Math.sin(now * 0.01 + i) * 8, yy, w, 12, 0, 0, Math.PI * 2);
          ctx2.stroke();
        }
        break;
      }
      // Firestorm's funnel: narrower rings, a per-ring heat gradient, faster sway
      case "firetor": {
        ctx2.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const yy = H - 80 - i * 90, w = 24 + i * 20;
          ctx2.strokeStyle = `rgba(255, ${100 + i * 26}, 60, 0.6)`;
          ctx2.beginPath();
          ctx2.ellipse(e.x + Math.sin(now * 0.013 + i) * 9, yy, w, 12, 0, 0, Math.PI * 2);
          ctx2.stroke();
        }
        break;
      }
      // an armed charge blinking between two colours: the sticky bomb (stuck to a
      // body, so it reads the body's position) and the booby trap (a fixed spot)
      case "blink": {
        const x = v.body ? v.body.position.x : v.x;
        const y = v.body ? v.body.position.y : v.y;
        ctx2.fillStyle = Math.sin(now * v.rate) > 0 ? v.a : v.b;
        ctx2.beginPath();
        ctx2.arc(x, y, v.r, 0, Math.PI * 2);
        ctx2.fill();
        break;
      }
      // the telegraph ring the smite falls into
      case "pulsering": {
        ctx2.strokeStyle = v.c;
        ctx2.lineWidth = v.lw;
        ctx2.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(now * 0.02));
        ctx2.beginPath();
        ctx2.arc(v.x, v.y, v.r, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.globalAlpha = 1;
        break;
      }
      // a ghost's haunt sigil — the one effect that needs an artkit primitive
      case "rune": {
        ctx2.globalAlpha = 0.75;
        runeRing(ctx2, v.x, v.y, v.r, v.c, now, { count: 6, lw: 1.2, alpha: 0.8, spin: 3e-3 });
        ctx2.globalAlpha = 1;
        break;
      }
      default:
        break;
    }
  }
  onWorldReset(clearFxEffects);

  // src/render/fx.js
  var particles = [];
  var shake = 0;
  var flashColor = "#fff";
  var flashAlpha = 0;
  function setShake(v) {
    shake = v;
  }
  function setFlashAlpha(v) {
    flashAlpha = v;
  }
  var fxRandom = () => Math.random();
  var fxRange2 = (a, b) => a + Math.random() * (b - a);
  var fxPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function addShake2(v) {
    shake = Math.min(shake + v, 26);
  }
  function doFlash2(color, alpha = 0.4) {
    flashColor = color;
    flashAlpha = Math.max(flashAlpha, alpha);
  }
  var PARTICLE_CAP = 300;
  var CORE_FRAC = 0.28;
  var TAIL_FRAC = 0.62;
  function _tier(core, life) {
    const ml = core ? life * 0.5 : life * 1.2;
    return {
      life: ml + fxRandom() * 20,
      maxLife: ml,
      dim: core ? 1 : 0.42,
      r: core ? 3.4 + fxRandom() * 2.2 : 1.3 + fxRandom() * 1.4
    };
  }
  function spawnParticles2(x, y, color, count, speed, life = 40) {
    const n = Math.max(1, Math.round(count * TAIL_FRAC));
    const cores = Math.max(1, Math.round(n * CORE_FRAC));
    for (let i = 0; i < n; i++) {
      const core = i < cores;
      const a = fxRandom() * Math.PI * 2, v = fxRandom() * speed * (core ? 1.15 : 0.8);
      particles.push({ kind: "square", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, color, ..._tier(core, life) });
    }
  }
  function spawnRing2(x, y, color) {
    particles.push({ kind: "ring", x, y, r: 12, life: 16, maxLife: 16, color });
  }
  function spawnBurst2(x, y, color, count = 12, o = {}) {
    const kind = o.kind || "square", speed = o.speed ?? 5, spread = o.spread ?? Math.PI * 2;
    const dir = o.dir ?? 0, up = o.up ?? 0, life = o.life ?? 40, g = o.g ?? 0.25, r = o.r ?? 3;
    const generic = kind === "square" || kind === "spark";
    const n = generic ? Math.max(1, Math.round(count * TAIL_FRAC)) : count;
    const cores = generic ? Math.max(1, Math.round(n * CORE_FRAC)) : n;
    for (let i = 0; i < n; i++) {
      const core = i < cores;
      const a = dir + (fxRandom() - 0.5) * spread;
      const v = speed * (0.4 + fxRandom() * 0.9) * (generic && !core ? 0.8 : 1);
      const t = _tier(core, life);
      particles.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - up,
        color,
        g,
        life: generic ? t.life : life + fxRandom() * 15,
        maxLife: generic ? t.maxLife : life,
        dim: generic ? t.dim : 1,
        r: generic ? r * (core ? 1.15 : 0.45) * (0.7 + fxRandom() * 0.6) : r * (0.6 + fxRandom() * 0.8)
      });
    }
  }
  var TEXT_CAP = 6;
  function spawnText2(x, y, str, color) {
    let live = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].kind !== "text") continue;
      if (++live >= TEXT_CAP) particles.splice(i, 1);
    }
    particles.push({ kind: "text", str, x, y, vx: 0, vy: -1.2, life: 50, maxLife: 50, color, r: 16 });
  }
  function trimParticles() {
    let over = particles.length - PARTICLE_CAP;
    if (over <= 0) return;
    for (let i = 0; i < particles.length && over > 0; i++) {
      const pt = particles[i];
      if (pt.kind === "text" || pt.kind === "ring" || (pt.dim ?? 1) >= 1) continue;
      particles.splice(i, 1);
      i--;
      over--;
    }
    while (over > 0) {
      const i = particles.findIndex((pt) => pt.kind !== "text" && pt.kind !== "ring");
      if (i < 0) return;
      particles.splice(i, 1);
      over--;
    }
  }
  var particleCount = () => particles.length;
  function pushParticle(spec) {
    particles.push({ ...spec });
  }
  function clearParticles2() {
    particles.length = 0;
  }
  function updateParticles(ts) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= ts;
      if (pt.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      if (pt.kind === "ring") {
        pt.r += 7 * ts;
        continue;
      }
      if (pt.kind === "text") {
        pt.y += pt.vy * ts;
        continue;
      }
      pt.x += pt.vx * ts;
      pt.y += pt.vy * ts;
      if (pt.kind === "confetti") {
        pt.vy += 0.06 * ts;
        pt.x += Math.sin(pt.life * 0.25) * 0.8;
      } else if (pt.kind === "leaf") {
        pt.vy = Math.min(pt.vy + 0.02 * ts, 1.1);
        pt.x += Math.sin(pt.life * 0.12) * 0.6;
      } else if (pt.kind === "bird") {
        pt.vx *= 1.008;
        pt.vy += (pt.g ?? -0.02) * ts;
      } else if (pt.kind === "glint") {
      } else pt.vy += (pt.g ?? 0.25) * ts;
    }
    trimParticles();
  }
  function drawParticles() {
    drawStoryParticles(ctx, particles);
  }
  var HANDLERS = {
    __proto__: null,
    spawnParticles: spawnParticles2,
    spawnRing: spawnRing2,
    spawnText: spawnText2,
    spawnBurst: spawnBurst2,
    doFlash: doFlash2,
    addShake: addShake2,
    boltVisual: boltVisual2,
    particle: pushParticle,
    clearParticles: clearParticles2,
    slowMo: () => {
    },
    setBanner: () => {
    },
    addKillFeed: () => {
    }
  };
  var unhandled = /* @__PURE__ */ new Set();
  var unhandledEmitted = () => [...unhandled];
  var handledEmitNames = () => ["sfx", ...Object.keys(HANDLERS)];
  function applyEmitted(events) {
    for (const e of events) {
      if (e.f === "sfx") {
        playSfx(e.a[0]);
        continue;
      }
      const h = HANDLERS[e.f];
      if (h) h(...e.a);
      else unhandled.add(e.f);
    }
  }
  function pumpEmitted() {
    applyEmitted(drainEmitted());
  }
  onWorldReset(() => {
    particles.length = 0;
    shake = 0;
    flashColor = "#fff";
    flashAlpha = 0;
  });

  // src/render/name-tags.js
  var _tagSlots = [];
  function resetNameTagSlots() {
    _tagSlots.length = 0;
  }
  function claimTagSlot(x, y, halfW) {
    const STEP = 13, LIMIT = 5;
    let ty = y;
    for (let i = 0; i <= LIMIT; i++) {
      const clash = _tagSlots.some((s) => Math.abs(s.y - ty) < STEP - 1 && Math.abs(s.x - x) < s.halfW + halfW + 4);
      if (!clash) break;
      ty -= STEP;
    }
    _tagSlots.push({ x, y: ty, halfW });
    return ty;
  }

  // src/render/camera.js
  var CAM_HOME = { x: W / 2, y: H / 2, zoom: 1, tx: W / 2, ty: H / 2, tzoom: 1, shakeX: 0, shakeY: 0, rot: 0 };
  var CAM2 = { ...CAM_HOME };
  var CAM_TUNE = {
    min: 1,
    // never zoom out past the arena — there's nothing out there
    max: 2.15,
    // past this, knockback outruns the camera and reads as teleporting
    padX: 170,
    // breathing room around the action box, world px
    padY: 105,
    headroom: 60,
    // extra above the box: spells arc, and you need to see them coming
    lerpIn: 0.035,
    // easing toward a tighter shot — slow, so it feels like a push-in
    lerpOut: 0.1,
    // easing wider — faster, because being off-screen is unfair
    panLerp: 0.06,
    maxTrauma: 26,
    // matches the old addShake ceiling
    shakePx: 22,
    // peak translation at full trauma
    shakeRot: 0.012
    // peak rotation (rad) at full trauma
  };
  var camEnabled = true;
  function setCameraEnabled(on) {
    camEnabled = !!on;
  }
  function cameraEnabled() {
    return camEnabled;
  }
  function cameraZoom() {
    return CAM2.zoom;
  }
  function resetCamera() {
    Object.assign(CAM2, CAM_HOME);
  }
  onWorldReset(resetCamera);
  function cameraPoints() {
    const pts = [];
    for (const p of players) {
      if (!p.alive || !p.body) continue;
      pts.push({ x: p.body.position.x, y: p.body.position.y, r: 26 * (p.sizeScale || 1) });
    }
    if (game.boss?.body) {
      const b = game.boss.body;
      const r = b.circleRadius || Math.max(b.bounds.max.x - b.bounds.min.x, b.bounds.max.y - b.bounds.min.y) / 2;
      pts.push({ x: b.position.x, y: b.position.y, r: r + 24 });
    }
    return pts;
  }
  function cameraTarget(pts) {
    if (!pts || !pts.length) {
      CAM2.tzoom = 1;
      CAM2.tx = W / 2;
      CAM2.ty = H / 2;
      return;
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      const r = p.r || 0;
      if (p.x - r < minX) minX = p.x - r;
      if (p.x + r > maxX) maxX = p.x + r;
      if (p.y - r < minY) minY = p.y - r;
      if (p.y + r > maxY) maxY = p.y + r;
    }
    if (!Number.isFinite(minX)) {
      CAM2.tzoom = 1;
      return;
    }
    const needW = maxX - minX + CAM_TUNE.padX * 2;
    const needH = maxY - minY + CAM_TUNE.padY * 2 + CAM_TUNE.headroom;
    const zoom = Math.max(CAM_TUNE.min, Math.min(CAM_TUNE.max, Math.min(W / needW, H / needH)));
    CAM2.tzoom = zoom;
    CAM2.tx = (minX + maxX) / 2;
    CAM2.ty = (minY + maxY) / 2 - CAM_TUNE.headroom * 0.35;
    clampCenterToWorld();
  }
  function clampCenterToWorld(zoom = CAM2.tzoom) {
    const halfW = W / (2 * zoom), halfH = H / (2 * zoom);
    CAM2.tx = Math.max(halfW, Math.min(W - halfW, CAM2.tx));
    CAM2.ty = Math.max(halfH, Math.min(H - halfH, CAM2.ty));
  }
  var _nz = (t, seed) => Math.sin(t * 0.043 + seed) * 0.62 + Math.sin(t * 0.0971 + seed * 2.7) * 0.38;
  function updateCameraShake(now) {
    const trauma = Math.max(0, Math.min(1, shake / CAM_TUNE.maxTrauma));
    const t2 = trauma * trauma;
    CAM2.shakeX = _nz(now, 1.7) * CAM_TUNE.shakePx * t2;
    CAM2.shakeY = _nz(now, 8.3) * CAM_TUNE.shakePx * t2;
    CAM2.rot = _nz(now, 4.1) * CAM_TUNE.shakeRot * t2;
    setShake(shake * 0.88);
  }
  function updateCamera(now, pts) {
    if (!camEnabled) {
      CAM2.x = W / 2;
      CAM2.y = H / 2;
      CAM2.zoom = 1;
      updateCameraShake(now);
      return;
    }
    cameraTarget(pts || cameraPoints());
    const zl = CAM2.tzoom < CAM2.zoom ? CAM_TUNE.lerpOut : CAM_TUNE.lerpIn;
    CAM2.zoom += (CAM2.tzoom - CAM2.zoom) * zl;
    CAM2.x += (CAM2.tx - CAM2.x) * CAM_TUNE.panLerp;
    CAM2.y += (CAM2.ty - CAM2.y) * CAM_TUNE.panLerp;
    const halfW = W / (2 * CAM2.zoom), halfH = H / (2 * CAM2.zoom);
    CAM2.x = Math.max(halfW, Math.min(W - halfW, CAM2.x));
    CAM2.y = Math.max(halfH, Math.min(H - halfH, CAM2.y));
    updateCameraShake(now);
  }
  function beginWorld() {
    resetNameTagSlots();
    const s = RENDER_SCALE * CAM2.zoom;
    ctx.setTransform(s, 0, 0, s, RENDER_SCALE * (W / 2), RENDER_SCALE * (H / 2));
    if (CAM2.rot) ctx.rotate(CAM2.rot);
    ctx.translate(-CAM2.x + CAM2.shakeX / CAM2.zoom, -CAM2.y + CAM2.shakeY / CAM2.zoom);
  }
  function endWorld() {
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  }
  function clearFrame(color) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color || "#16121c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    endWorld();
  }
  function cameraViewRect() {
    const halfW = W / (2 * CAM2.zoom), halfH = H / (2 * CAM2.zoom);
    return { x0: CAM2.x - halfW, y0: CAM2.y - halfH, x1: CAM2.x + halfW, y1: CAM2.y + halfH };
  }
  function screenToWorld(sx, sy) {
    const r = cameraViewRect();
    return { x: r.x0 + sx / W * (r.x1 - r.x0), y: r.y0 + sy / H * (r.y1 - r.y0) };
  }

  // src/platform/input-keyboard.js
  var keys = {};
  var KEYMAPS = [
    { left: "KeyA", right: "KeyD", jump: "KeyW", cast: "KeyE", cast2: "KeyQ", block: "KeyS", label: "E", label2: "Q" },
    { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", cast: "Enter", cast2: "ShiftRight", block: "ArrowDown", label: "ENTER", label2: "R-SHIFT" }
  ];
  var mouse = { x: W / 2, y: H / 2, sx: W / 2, sy: H / 2, down: false, rdown: false, mdown: false, present: false };
  function syncMouseWorld() {
    const w = screenToWorld(mouse.sx, mouse.sy);
    mouse.x = w.x;
    mouse.y = w.y;
  }
  var KeyboardController = class {
    constructor(map, useMouse = false) {
      this.map = map;
      this.useMouse = useMouse;
      this.prev = { jump: false, cast: false, cast2: false, block: false, start: false };
      this.assigned = false;
    }
    poll() {
      const m = this.map;
      const useM = this.useMouse && mouse.present;
      const jump = !!keys[m.jump] || this.useMouse && !!keys["Space"];
      const cast = !!keys[m.cast] || useM && mouse.down;
      const cast2 = !!keys[m.cast2] || useM && mouse.rdown;
      const block = !!keys[m.block] || useM && mouse.mdown;
      const start = !!keys["Space"];
      const s = {
        move: (keys[m.right] ? 1 : 0) - (keys[m.left] ? 1 : 0),
        jump,
        cast,
        cast2,
        block,
        jumpPressed: jump && !this.prev.jump,
        castPressed: cast && !this.prev.cast,
        cast2Pressed: cast2 && !this.prev.cast2,
        blockPressed: block && !this.prev.block,
        startPressed: start && !this.prev.start,
        aimPoint: useM ? { x: mouse.x, y: mouse.y } : null,
        aimVec: null
      };
      this.prev = { jump, cast, cast2, block, start };
      return s;
    }
  };
  var kbControllers = [];
  function attachKeyboard(canvas3) {
    addEventListener("keydown", (e) => {
      ensureAudio();
      keys[e.code] = true;
      if (e.code === "F9") setCameraEnabled(!cameraEnabled());
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Space"].includes(e.code)) e.preventDefault();
    });
    addEventListener("keyup", (e) => keys[e.code] = false);
    addEventListener("blur", () => {
      for (const k in keys) keys[k] = false;
    });
    if (canvas3 && typeof canvas3.addEventListener === "function") {
      canvas3.addEventListener("mousemove", (e) => {
        const r = canvas3.getBoundingClientRect();
        mouse.sx = (e.clientX - r.left) * (W / r.width);
        mouse.sy = (e.clientY - r.top) * (H / r.height);
        syncMouseWorld();
        mouse.present = true;
      });
      canvas3.addEventListener("mousedown", (e) => {
        ensureAudio();
        mouse.present = true;
        if (e.button === 0) mouse.down = true;
        if (e.button === 2) mouse.rdown = true;
        if (e.button === 1 || e.button === 3 || e.button === 4) {
          mouse.mdown = true;
          e.preventDefault();
        }
      });
      addEventListener("mouseup", (e) => {
        if (e.button === 0) mouse.down = false;
        if (e.button === 2) mouse.rdown = false;
        if (e.button === 1 || e.button === 3 || e.button === 4) mouse.mdown = false;
      });
      canvas3.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    if (!kbControllers.length) {
      kbControllers.push(new KeyboardController(KEYMAPS[0], true), new KeyboardController(KEYMAPS[1]));
    }
    return kbControllers;
  }

  // src/platform/join.js
  var join_exports = {};
  __export(join_exports, {
    assignedPads: () => assignedPads,
    attachLobbyKeys: () => attachLobbyKeys,
    beginNameEdit: () => beginNameEdit,
    beginPadNameEdit: () => beginPadNameEdit,
    fightSecretBoss: () => fightSecretBoss,
    padBtnPrev: () => padBtnPrev,
    padPrev: () => padPrev,
    padWheelInput: () => padWheelInput,
    scanJoins: () => scanJoins,
    scanLobbyPads: () => scanLobbyPads
  });

  // src/sim/lobby.js
  var lobby_exports = {};
  __export(lobby_exports, {
    PAD_ALPHABET: () => PAD_ALPHABET,
    cleanName: () => cleanName,
    nameEdit: () => nameEdit,
    nameEditEndAt: () => nameEditEndAt,
    readableColor: () => readableColor,
    setNameEdit: () => setNameEdit,
    setNameEditEndAt: () => setNameEditEndAt
  });
  var nameEdit = null;
  var nameEditEndAt = 0;
  function setNameEdit(v) {
    nameEdit = v;
  }
  function setNameEditEndAt(v) {
    nameEditEndAt = v;
  }
  function cleanName(s) {
    return String(s || "").replace(/[^\w \-'!.]/g, "").slice(0, 12);
  }
  function readableColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const MIN = 96;
    if (lum >= MIN) return hex;
    const t = (MIN - lum) / (255 - lum);
    const up = (c) => Math.round(c + (255 - c) * t).toString(16).padStart(2, "0");
    return `#${up(r)}${up(g)}${up(b)}`;
  }
  var PAD_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -!";

  // src/platform/input-gamepad.js
  var input_gamepad_exports = {};
  __export(input_gamepad_exports, {
    GamepadController: () => GamepadController
  });
  var GamepadController = class {
    constructor(index) {
      this.index = index;
      this.prev = { jump: false, cast: false, cast2: false, block: false, start: false };
    }
    poll() {
      const gp = navigator.getGamepads()[this.index];
      if (!gp) return { ...IDLE_INPUT };
      let move = Math.abs(gp.axes[0]) > 0.3 ? Math.sign(gp.axes[0]) : 0;
      if (gp.buttons[14]?.pressed) move = -1;
      if (gp.buttons[15]?.pressed) move = 1;
      const jump = !!(gp.buttons[0]?.pressed || gp.buttons[12]?.pressed);
      const cast = !!(gp.buttons[2]?.pressed || gp.buttons[7]?.pressed);
      const cast2 = !!(gp.buttons[1]?.pressed || gp.buttons[5]?.pressed);
      const block = !!(gp.buttons[4]?.pressed || gp.buttons[6]?.pressed);
      const start = !!gp.buttons[9]?.pressed;
      const ax = gp.axes[2] ?? 0, ay = gp.axes[3] ?? 0;
      const aimVec = Math.hypot(ax, ay) > 0.35 ? { x: ax, y: ay } : null;
      const s = {
        move,
        jump,
        cast,
        cast2,
        block,
        jumpPressed: jump && !this.prev.jump,
        castPressed: cast && !this.prev.cast,
        cast2Pressed: cast2 && !this.prev.cast2,
        blockPressed: block && !this.prev.block,
        startPressed: start && !this.prev.start,
        aimPoint: null,
        aimVec
      };
      this.prev = { jump, cast, cast2, block, start };
      return s;
    }
  };

  // src/platform/join.js
  var assignedPads = /* @__PURE__ */ new Set();
  var padPrev = {};
  var padBtnPrev = {};
  function beginNameEdit(p, storeKey) {
    const saved = cleanName(localStorage.getItem(storeKey) || "");
    if (storeKey === "hs-name-0" && globalThis.nameSetViaMenu) {
      if (saved) p.name = saved;
      return;
    }
    setNameEdit({ p, storeKey, buffer: saved });
    if (nameEdit.buffer) p.name = nameEdit.buffer;
  }
  function beginPadNameEdit(p, padIndex) {
    const storeKey = `hs-name-pad-${padIndex}`;
    const saved = cleanName(localStorage.getItem(storeKey) || "");
    setNameEdit({ p, storeKey, buffer: saved, pad: padIndex, letter: 0 });
  }
  function padWheelInput(edge) {
    if (edge(14)) nameEdit.letter = (nameEdit.letter + PAD_ALPHABET.length - 1) % PAD_ALPHABET.length;
    if (edge(15)) nameEdit.letter = (nameEdit.letter + 1) % PAD_ALPHABET.length;
    if (edge(0) && nameEdit.buffer.length < 12) nameEdit.buffer = cleanName(nameEdit.buffer + PAD_ALPHABET[nameEdit.letter]);
    if (edge(1)) nameEdit.buffer = nameEdit.buffer.slice(0, -1);
    if (edge(9) || edge(3)) {
      if (nameEdit.buffer) {
        nameEdit.p.name = nameEdit.buffer;
        localStorage.setItem(nameEdit.storeKey, nameEdit.buffer);
      }
      setNameEdit(null);
      setNameEditEndAt(simNow());
    }
  }
  function fightSecretBoss(id) {
    if (netMode === "online") return;
    setNameEdit(null);
    if (players.length === 0) {
      kbControllers[0].assigned = true;
      joinPlayer(kbControllers[0]);
    }
    game.mode = "versus";
    game.totalRounds = 0;
    clearReplay();
    resetMatchStats();
    resetMatchTelemetry();
    resetTelemetry();
    for (const p of players) p.roundWins = 0;
    let idx = 0, tries = 0;
    do {
      idx = Math.floor(Math.random() * MAPS.length);
    } while (MAPS[idx].cozy && ++tries < 60);
    loadMap(idx);
    for (const p of players) {
      clearSpells(p);
      despawnPlayer(p);
      spawnPlayer(p, spawnPointFor(p));
    }
    game.state = "PLAY";
    game.fightAt = simNow() + 900;
    game.fightShown = false;
    scheduleTomes(simNow());
    const bs = spawnBoss(simNow(), { bossId: id });
    setBanner("\u2694  " + (bs && bs.def ? bs.def.name : "SECRET BOSS") + "  \u2694", bs && bs.def ? bs.def.color : "#ffd166", 1500, true);
  }
  function scanJoins() {
    if (game.state === "VICTORY" || game.state === "RUN_OVER" || players.length >= MAX_PLAYERS) return;
    if (nameEdit || simNow() < nameEditEndAt + 350) return;
    for (const kc of kbControllers) {
      if (kc.assigned) continue;
      if (kc.poll().castPressed) {
        kc.assigned = true;
        joinPlayer(kc);
        if (game.state === "LOBBY") beginNameEdit(players[players.length - 1], `hs-name-${kc === kbControllers[0] ? 0 : 1}`);
      }
    }
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || assignedPads.has(pad.index)) continue;
      const pressed = pad.buttons.some((b) => b.pressed);
      const prev = padPrev[pad.index] || false;
      padPrev[pad.index] = pressed;
      if (pressed && !prev) {
        ensureAudio();
        assignedPads.add(pad.index);
        padBtnPrev[pad.index] = new Set(pad.buttons.flatMap((b, i) => b.pressed ? [i] : []));
        joinPlayer(new GamepadController(pad.index));
      }
    }
  }
  function scanLobbyPads() {
    if (game.state !== "LOBBY") return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || !assignedPads.has(pad.index)) continue;
      const prev = padBtnPrev[pad.index] || /* @__PURE__ */ new Set();
      const edge = (b) => !!pad.buttons[b]?.pressed && !prev.has(b);
      if (nameEdit && nameEdit.pad === pad.index) {
        padWheelInput(edge);
      } else if (!nameEdit) {
        const owner = players.find((p) => p.controller instanceof GamepadController && p.controller.index === pad.index);
        if (edge(3) && owner) beginPadNameEdit(owner, pad.index);
        if (edge(8)) addBot();
        if (edge(2)) toggleMode();
        if (edge(12)) setWins(game.winsNeeded + 1);
        if (edge(13)) setWins(game.winsNeeded - 1);
      }
      padBtnPrev[pad.index] = new Set(pad.buttons.flatMap((b, i) => b.pressed ? [i] : []));
    }
  }
  function attachLobbyKeys() {
    addEventListener("keydown", (e) => {
      if (!nameEdit) return;
      if (game.state !== "LOBBY") {
        setNameEdit(null);
        return;
      }
      e.preventDefault();
      if (e.code === "Enter" || e.code === "NumpadEnter") {
        if (nameEdit.buffer) {
          nameEdit.p.name = nameEdit.buffer;
          localStorage.setItem(nameEdit.storeKey, nameEdit.buffer);
        }
        setNameEdit(null);
        setNameEditEndAt(simNow());
      } else if (e.code === "Escape") {
        setNameEdit(null);
        setNameEditEndAt(simNow());
      } else if (e.code === "Backspace") {
        nameEdit.buffer = nameEdit.buffer.slice(0, -1);
      } else if (e.key.length === 1 && nameEdit.buffer.length < 12) {
        nameEdit.buffer = cleanName(nameEdit.buffer + e.key);
      }
    }, true);
    addEventListener("keydown", (e) => {
      if (netMode === "online" || nameEdit) return;
      if (e.code === "KeyT") {
        fightSecretBoss("rizard");
        return;
      }
      if (e.code === "KeyN") {
        fightSecretBoss("manu");
        return;
      }
      if (e.code === "Space" && game.state === "LOBBY" && players.length >= minPlayers()) beginFromLobby();
      if (e.code === "KeyB" && game.state === "LOBBY") addBot();
      if (e.code === "KeyM" && game.state === "LOBBY") toggleMode();
      if (e.code === "KeyR") resetMatch();
      if (game.state === "LOBBY" && /^Digit[1-9]$/.test(e.code)) setWins(+e.code.slice(5));
      if (game.state === "LOBBY" && (e.code === "Equal" || e.code === "Minus")) setWins(game.winsNeeded + (e.code === "Equal" ? 1 : -1));
    });
  }

  // src/render/bloom.js
  var enabled = true;
  var BLOOM = {
    div: 4,
    // buffer is 1/4 the device resolution per axis (1/16 the pixels)
    strength: 0.55,
    // final additive opacity
    blurPx: 7,
    // blur radius in BUFFER px, so ~28px at full res
    // Each pass squares the colour, so N passes leaves c^(2^N). Three passes
    // (c^8) is the point where lit-but-not-emissive surfaces — pale ice, snow
    // crust — stop blooming and only spell cores, embers and lava survive.
    passes: 3
  };
  var _bufA = null;
  var _bufB = null;
  var _bctxA = null;
  var _bctxB = null;
  var _bufW = 0;
  var _bufH = 0;
  function _ensureBloomBuffers() {
    if (!canvas) return false;
    const w = Math.max(1, Math.floor(canvas.width / BLOOM.div));
    const h = Math.max(1, Math.floor(canvas.height / BLOOM.div));
    if (_bufA && _bufW === w && _bufH === h) return true;
    if (typeof document === "undefined" || !document.createElement) return false;
    _bufA = document.createElement("canvas");
    _bufB = document.createElement("canvas");
    _bufA.width = _bufB.width = w;
    _bufA.height = _bufB.height = h;
    _bctxA = _bufA.getContext("2d");
    _bctxB = _bufB.getContext("2d");
    if (!_bctxA || !_bctxB) return false;
    _bufW = w;
    _bufH = h;
    return true;
  }
  function _blurBuffer() {
    if ("filter" in _bctxB) {
      _bctxB.setTransform(1, 0, 0, 1, 0, 0);
      _bctxB.clearRect(0, 0, _bufW, _bufH);
      _bctxB.filter = `blur(${BLOOM.blurPx}px)`;
      _bctxB.drawImage(_bufA, 0, 0);
      _bctxB.filter = "none";
    } else {
      _bctxB.setTransform(1, 0, 0, 1, 0, 0);
      _bctxB.clearRect(0, 0, _bufW, _bufH);
      _bctxB.globalAlpha = 0.25;
      const r = BLOOM.blurPx * 0.6;
      for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) _bctxB.drawImage(_bufA, dx, dy);
      _bctxB.globalAlpha = 1;
    }
  }
  function applyBloom(now) {
    if (!enabled || !ctx || !_ensureBloomBuffers()) return;
    _bctxA.setTransform(1, 0, 0, 1, 0, 0);
    _bctxA.globalCompositeOperation = "copy";
    _bctxA.drawImage(canvas, 0, 0, _bufW, _bufH);
    _bctxA.globalCompositeOperation = "multiply";
    for (let i = 0; i < BLOOM.passes; i++) _bctxA.drawImage(_bufA, 0, 0);
    _bctxA.globalCompositeOperation = "source-over";
    _blurBuffer();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = BLOOM.strength;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(_bufB, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // src/render/profiler.js
  var PERF_CAP = 240;
  var PERF_MAX_SLOTS = 32;
  var PERF_HITCH_MS = 22;
  var PERF_KEEP_HITCHES = 6;
  function _slots() {
    const ids = /* @__PURE__ */ new Map(), names = [];
    return {
      names,
      id(name) {
        let i = ids.get(name);
        if (i === void 0) {
          if (names.length >= PERF_MAX_SLOTS) return -1;
          i = names.length;
          ids.set(name, i);
          names.push(name);
        }
        return i;
      }
    };
  }
  var _phaseSlots = _slots();
  var _countSlots = _slots();
  function _mkFrame() {
    return {
      t: 0,
      interval: 0,
      work: 0,
      outside: 0,
      heap: 0,
      ph: new Float64Array(PERF_MAX_SLOTS),
      // top-level phases; these sum to ~work
      sub: new Float64Array(PERF_MAX_SLOTS),
      // nested phases; already inside a parent
      cn: new Float64Array(PERF_MAX_SLOTS)
      // counters (particle count, body count, …)
    };
  }
  var PERF = {
    on: false,
    buf: null,
    // allocated on first enable — the headless sim loads this file too
    head: 0,
    n: 0,
    cur: null,
    lastStart: 0,
    lastEnd: 0,
    hitches: [],
    // worst few of the session, newest-worst first
    hitchTimes: [],
    // timestamps of every hitch, for the "in the last 5s" rate
    heapDrops: 0
    // times the JS heap shrank — i.e. a GC ran
  };
  globalThis.PERF = PERF;
  var _stack = [];
  var _nestedPhase = new Uint8Array(PERF_MAX_SLOTS);
  function perfFrameStart() {
    if (!PERF.on) return;
    const t = performance.now();
    const f = PERF.buf[PERF.head];
    f.ph.fill(0);
    f.sub.fill(0);
    f.cn.fill(0);
    f.t = t;
    f.interval = PERF.lastStart ? t - PERF.lastStart : 0;
    f.outside = PERF.lastEnd ? t - PERF.lastEnd : 0;
    f.work = 0;
    const mem = performance.memory;
    f.heap = mem ? mem.usedJSHeapSize : 0;
    PERF.cur = f;
    PERF.lastStart = t;
    _stack.length = 0;
  }
  function perfFrameEnd() {
    if (!PERF.on || !PERF.cur) return;
    const t = performance.now();
    const f = PERF.cur;
    f.work = t - f.t;
    PERF.lastEnd = t;
    const prev = PERF.buf[(PERF.head + PERF_CAP - 1) % PERF_CAP];
    if (PERF.n > 0 && f.heap && prev.heap && f.heap < prev.heap - 65536) PERF.heapDrops++;
    if (PERF.n > 5 && f.interval > PERF_HITCH_MS) _recordHitch(f);
    PERF.head = (PERF.head + 1) % PERF_CAP;
    if (PERF.n < PERF_CAP) PERF.n++;
    PERF.cur = null;
  }
  function perfBegin(name) {
    if (!PERF.on) return;
    _stack.push(name, performance.now(), _stack.length > 0 ? 1 : 0);
  }
  function perfEnd() {
    if (!PERF.on || !_stack.length) return;
    const nested = _stack.pop(), t0 = _stack.pop(), name = _stack.pop();
    const f = PERF.cur;
    if (!f) return;
    const id = _phaseSlots.id(name);
    if (id < 0) return;
    if (nested) _nestedPhase[id] = 1;
    (nested ? f.sub : f.ph)[id] += performance.now() - t0;
  }
  function _recordHitch(f) {
    PERF.hitchTimes.push(f.t);
    if (PERF.hitchTimes.length > 600) PERF.hitchTimes.splice(0, 300);
    const snap = {
      t: f.t,
      interval: f.interval,
      work: f.work,
      outside: f.outside,
      ph: Array.from(f.ph),
      sub: Array.from(f.sub),
      cn: Array.from(f.cn)
    };
    PERF.hitches.push(snap);
    PERF.hitches.sort((a, b) => b.interval - a.interval);
    if (PERF.hitches.length > PERF_KEEP_HITCHES) PERF.hitches.length = PERF_KEEP_HITCHES;
  }
  var _scratch = new Float64Array(PERF_CAP);
  function _pct(pick2, p) {
    const n = PERF.n;
    if (!n) return 0;
    for (let i = 0; i < n; i++) _scratch[i] = pick2(PERF.buf[(PERF.head - n + i + PERF_CAP * 2) % PERF_CAP]);
    const view = _scratch.subarray(0, n);
    view.sort();
    return view[Math.min(n - 1, Math.floor(n * p))];
  }
  var _byInterval = (f) => f.interval;
  var _byWork = (f) => f.work;
  var _byOutside = (f) => f.outside;
  function _frameAt(back) {
    return PERF.buf[(PERF.head - 1 - back + PERF_CAP * 2) % PERF_CAP];
  }
  function _phaseP95(id) {
    return _pct((f) => f.ph[id] + f.sub[id], 0.95);
  }
  var PERF_PANEL_W = 268;
  var _fmt = (v) => v < 10 ? v.toFixed(1) : Math.round(v).toString();
  function drawPerfHud(now) {
    if (!PERF.on || !PERF.n || !ctx) return;
    perfBegin("perfhud");
    const s = RENDER_SCALE;
    ctx.save();
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.textAlign = "left";
    ctx.font = "11px Menlo, monospace";
    const x0 = W - PERF_PANEL_W - 8;
    const y0 = 76;
    const rows = _phaseSlots.names.length;
    const panelH = 96 + 64 + 26 + rows * 13 + (PERF.hitches.length ? 46 : 0);
    ctx.fillStyle = "rgba(10,6,16,0.82)";
    ctx.fillRect(x0, y0, PERF_PANEL_W, panelH);
    ctx.strokeStyle = "rgba(120,90,170,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, PERF_PANEL_W - 1, panelH - 1);
    let y = y0 + 16;
    const line = (txt, col) => {
      ctx.fillStyle = col || "#c8b8e8";
      ctx.fillText(txt, x0 + 10, y);
      y += 13;
    };
    const p50 = _pct(_byInterval, 0.5), p95 = _pct(_byInterval, 0.95), pmax = _pct(_byInterval, 0.999);
    const fps = p50 > 0 ? Math.round(1e3 / p50) : 0;
    ctx.font = "bold 11px Menlo, monospace";
    line(`PERF  F7  \xB7  ${fps} fps`, fps >= 58 ? "#7bd88f" : fps >= 45 ? "#ffd166" : "#ff6b81");
    ctx.font = "11px Menlo, monospace";
    line(`frame  p50 ${_fmt(p50)}  p95 ${_fmt(p95)}  max ${_fmt(pmax)} ms`);
    line(`work   p50 ${_fmt(_pct(_byWork, 0.5))}  p95 ${_fmt(_pct(_byWork, 0.95))} ms`, "#9ef0f0");
    line(`out    p50 ${_fmt(_pct(_byOutside, 0.5))}  p95 ${_fmt(_pct(_byOutside, 0.95))} ms`, "#b98cff");
    const cut = now - 5e3;
    let recent = 0;
    for (let i = PERF.hitchTimes.length - 1; i >= 0 && PERF.hitchTimes[i] >= cut; i--) recent++;
    line(
      `hitches >${PERF_HITCH_MS}ms: ${recent} in last 5s   GC: ${PERF.heapDrops}`,
      recent > 4 ? "#ff6b81" : recent ? "#ffd166" : "#675a7d"
    );
    const gx = x0 + 10, gy = y + 2, gw = PERF_CAP, gh = 56, full = 33.3;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(gx, gy, gw, gh);
    for (const ms of [16.7, 33.3]) {
      const ly = gy + gh - ms / full * gh;
      ctx.strokeStyle = ms < 20 ? "rgba(123,216,143,0.35)" : "rgba(255,209,102,0.3)";
      ctx.beginPath();
      ctx.moveTo(gx, ly + 0.5);
      ctx.lineTo(gx + gw, ly + 0.5);
      ctx.stroke();
    }
    for (let i = 0; i < PERF.n; i++) {
      const f = _frameAt(PERF.n - 1 - i);
      const cx = gx + gw - PERF.n + i;
      const wpx = Math.min(gh, f.work / full * gh);
      const opx = Math.min(gh - wpx, f.outside / full * gh);
      ctx.fillStyle = "#4ad2d2";
      ctx.fillRect(cx, gy + gh - wpx, 1, wpx);
      ctx.fillStyle = f.outside > PERF_HITCH_MS ? "#ff6b81" : "#6b4b9e";
      ctx.fillRect(cx, gy + gh - wpx - opx, 1, opx);
    }
    ctx.strokeStyle = "rgba(120,90,170,0.4)";
    ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
    y = gy + gh + 14;
    line("phase           last    p95", "#675a7d");
    const last2 = _frameAt(0);
    for (let id = 0; id < _phaseSlots.names.length; id++) {
      const name = _phaseSlots.names[id];
      const cur = last2.ph[id] + last2.sub[id];
      const hi = _phaseP95(id);
      line(
        `${(_nestedPhase[id] ? " \xB7" + name : name).padEnd(14)} ${_fmt(cur).padStart(5)}  ${_fmt(hi).padStart(5)}`,
        hi > 8 ? "#ff6b81" : hi > 4 ? "#ffd166" : "#9c8ab8"
      );
    }
    y += 3;
    let cline = "";
    for (let id = 0; id < _countSlots.names.length; id++) cline += `${_countSlots.names[id]} ${Math.round(last2.cn[id])}  `;
    if (cline) line(cline.trim(), "#8fa6d8");
    line(`buf ${canvas.width}x${canvas.height} @${(typeof RENDER_SCALE === "number" ? RENDER_SCALE : 1).toFixed(2)}  zoom ${(typeof CAM !== "undefined" ? CAM.zoom : 1).toFixed(2)}`, "#675a7d");
    const worst = PERF.hitches[0];
    if (worst) {
      y += 3;
      line(`worst ${_fmt(worst.interval)}ms  ${((now - worst.t) / 1e3).toFixed(0)}s ago`, "#ff6b81");
      const parts = [];
      for (let id = 0; id < _phaseSlots.names.length; id++) {
        const v = (worst.ph[id] || 0) + (worst.sub[id] || 0);
        if (v > 0.5) parts.push([_phaseSlots.names[id], v]);
      }
      parts.push(["outside", worst.outside]);
      parts.sort((a, b) => b[1] - a[1]);
      line("  " + parts.slice(0, 3).map(([n, v]) => `${n} ${_fmt(v)}`).join("  "), "#c8b8e8");
    }
    ctx.restore();
    perfEnd();
  }
  function perfDump() {
    const head = [
      "t",
      "interval",
      "work",
      "outside",
      "heapKB",
      ..._phaseSlots.names,
      ..._countSlots.names.map((n) => `#${n}`)
    ];
    const rows = [head.join(",")];
    for (let i = PERF.n - 1; i >= 0; i--) {
      const f = _frameAt(i);
      rows.push([
        f.t.toFixed(1),
        f.interval.toFixed(2),
        f.work.toFixed(2),
        f.outside.toFixed(2),
        Math.round(f.heap / 1024),
        ..._phaseSlots.names.map((_, id) => (f.ph[id] + f.sub[id]).toFixed(2)),
        ..._countSlots.names.map((_, id) => Math.round(f.cn[id]))
      ].join(","));
    }
    const csv = rows.join("\n");
    console.log(csv);
    console.log(`\u2014 ${PERF.n} frames, ${PERF.hitches.length} hitches kept, ${PERF.heapDrops} GC drops`);
    navigator.clipboard?.writeText(csv).then(
      () => console.log("(copied to clipboard)"),
      () => {
      }
    );
    return csv;
  }
  globalThis.perfDump = perfDump;
  function perfSetEnabled(on) {
    if (on && !PERF.buf) PERF.buf = Array.from({ length: PERF_CAP }, _mkFrame);
    PERF.on = on && !!PERF.buf;
    PERF.head = 0;
    PERF.n = 0;
    PERF.cur = null;
    PERF.lastStart = 0;
    PERF.lastEnd = 0;
    PERF.hitches.length = 0;
    PERF.hitchTimes.length = 0;
    PERF.heapDrops = 0;
    _stack.length = 0;
  }
  if (typeof addEventListener === "function") {
    addEventListener("keydown", (e) => {
      if (e.code !== "F7") return;
      e.preventDefault();
      if (e.shiftKey) perfDump();
      else perfSetEnabled(!PERF.on);
    });
    if (typeof location !== "undefined" && /(\?|&)perf=1/.test(location.search)) perfSetEnabled(true);
  }

  // src/net/fx-names.js
  var WIRE_FX = /* @__PURE__ */ new Set([
    "spawnParticles",
    "spawnRing",
    "spawnText",
    "doFlash",
    "addShake",
    "slowMo",
    "boltVisual",
    "setBanner",
    "addKillFeed",
    "spawnBurst"
  ]);

  // src/sim/tick-loop.js
  var STEP_EPS = 1e-9;
  function createTickLoop({ step, pace = paceScale }) {
    let accumulator = 0;
    return {
      pump(realDtMs) {
        accumulator += Math.min(realDtMs, 250) * pace();
        let steps = 0;
        while (accumulator >= TICK_MS - STEP_EPS && steps < MAX_CATCHUP) {
          step(TICK_MS);
          accumulator -= TICK_MS;
          steps++;
        }
        if (accumulator < 0) accumulator = 0;
        let dropped = 0;
        if (accumulator >= TICK_MS - STEP_EPS) {
          dropped = accumulator;
          accumulator = 0;
        }
        return { steps, alpha: accumulator / TICK_MS, dropped };
      }
    };
  }

  // src/render/draw-snapshot.js
  var draw_snapshot_exports = {};
  __export(draw_snapshot_exports, {
    cameraPointsFromSnapshot: () => cameraPointsFromSnapshot,
    drawFxLite: () => drawFxLite,
    drawGhostWizard: () => drawGhostWizard,
    drawSnapshotStatics: () => drawSnapshotStatics,
    drawSnapshotWorld: () => drawSnapshotWorld,
    ghostBody: () => ghostBody,
    ghostPlayer: () => ghostPlayer
  });

  // src/render/draw-env.js
  var draw_env_exports = {};
  __export(draw_env_exports, {
    drawEnvVisuals: () => drawEnvVisuals,
    drawEnvVisualsLive: () => drawEnvVisualsLive,
    drawNightfall: () => drawNightfall,
    drawVineAt: () => drawVineAt,
    envHash: () => envHash,
    envLightsFromSnap: () => envLightsFromSnap
  });
  function envHash(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function drawVineAt(x, yBase, h, now) {
    const seed = Math.round(x);
    const sway = Math.sin(now * 16e-4 + seed) * 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2f5e28";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, yBase);
    ctx.quadraticCurveTo(x - sway, yBase - h * 0.55, x + sway, yBase - h);
    ctx.stroke();
    ctx.strokeStyle = "#5aa246";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 1, yBase);
    ctx.quadraticCurveTo(x - sway + 1, yBase - h * 0.55, x + sway + 1, yBase - h);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const t = 0.18 + i * 0.18;
      const lx = x + Math.sin(now * 16e-4 + seed + i) * 4 * t + (i % 2 ? 8 : -8);
      const ly = yBase - h * t;
      const ang = (i % 2 ? 0.6 : -0.6) + sway * 0.05;
      const g = ctx.createLinearGradient(lx - 6, ly, lx + 6, ly);
      g.addColorStop(0, "#4f8a3d");
      g.addColorStop(1, "#8fe6a2");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 7, 3.8, ang, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(30,60,26,0.5)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(lx - Math.cos(ang) * 6, ly - Math.sin(ang) * 6);
      ctx.lineTo(lx + Math.cos(ang) * 6, ly + Math.sin(ang) * 6);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffd9ec";
    ctx.beginPath();
    ctx.arc(x + sway, yBase - h, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  var nightCanvas = null;
  var nightCtx = null;
  function drawNightfall(lights) {
    if (!nightCanvas) {
      nightCanvas = document.createElement("canvas");
      nightCanvas.width = W;
      nightCanvas.height = H;
      nightCtx = nightCanvas.getContext("2d");
    }
    nightCtx.globalCompositeOperation = "source-over";
    nightCtx.fillStyle = "rgba(8, 4, 20, 0.88)";
    nightCtx.clearRect(0, 0, W, H);
    nightCtx.fillRect(0, 0, W, H);
    nightCtx.globalCompositeOperation = "destination-out";
    for (const l of lights) {
      const g = nightCtx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, "rgba(0,0,0,0.95)");
      g.addColorStop(0.6, "rgba(0,0,0,0.55)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      nightCtx.fillStyle = g;
      nightCtx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.drawImage(nightCanvas, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const l of lights) {
      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.7);
      g.addColorStop(0, "rgba(255,196,120,0.14)");
      g.addColorStop(1, "rgba(255,196,120,0)");
      ctx.fillStyle = g;
      ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }
  function drawEnvVisuals(id, now, lights = []) {
    if (!id) return;
    if (id === "winter") {
      ctx.fillStyle = "rgba(190, 225, 255, 0.06)";
      ctx.fillRect(-30, -30, W + 60, H + 60);
      for (let i = 0; i < 80; i++) {
        const speed = 22 + envHash(i) * 46;
        const size = 1 + envHash(i + 400) * 2.6;
        const x = (envHash(i + 100) * (W + 40) + Math.sin(now * 8e-4 + i) * 34 + W) % (W + 40) - 20;
        const y = (envHash(i + 200) * H + now * 1e-3 * speed) % (H + 20) - 10;
        ctx.globalAlpha = 0.35 + envHash(i + 300) * 0.5;
        ctx.fillStyle = "#f4fbff";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        if (size > 2.6) {
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - size - 1, y);
          ctx.lineTo(x + size + 1, y);
          ctx.moveTo(x, y - size - 1);
          ctx.lineTo(x, y + size + 1);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    } else if (id === "tempest") {
      ctx.fillStyle = "rgba(20, 24, 44, 0.22)";
      ctx.fillRect(-30, -30, W + 60, H + 60);
      const wind = Math.sin(now / 1400) * 26;
      ctx.strokeStyle = "rgba(150, 178, 220, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < 70; i++) {
        const x = (envHash(i) * (W + 80) + now * 0.02 * (0.6 + envHash(i + 50)) * Math.sign(wind || 1) + W) % (W + 80) - 40;
        const y = (envHash(i + 100) * H + now * 0.5 * (0.7 + envHash(i + 150) * 0.6)) % (H + 30) - 15;
        ctx.moveTo(x, y);
        ctx.lineTo(x + wind * 0.5, y + 18);
      }
      ctx.stroke();
      const bucket = Math.floor(now / 2200), seed = envHash(bucket);
      if (seed < 0.4) {
        const t = now % 2200 / 2200;
        const flash = Math.max(0, 1 - t * 6);
        if (flash > 0.01) {
          ctx.fillStyle = `rgba(210, 224, 255, ${0.5 * flash})`;
          ctx.fillRect(-30, -30, W + 60, H + 60);
          const bx = envHash(bucket + 9) * W;
          ctx.strokeStyle = `rgba(230, 238, 255, ${flash})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#cfe0ff";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(bx, -10);
          for (let s = 1; s <= 6; s++) {
            ctx.lineTo(bx + (envHash(bucket * 7 + s) - 0.5) * 90, s / 6 * H * 0.7);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    } else if (id === "meteors") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = 0; i < 12; i++) {
        const span = H + 160;
        const prog = (now * 0.05 * (0.6 + envHash(i + 90)) + envHash(i + 60) * span) % span;
        const hx = envHash(i) * (W + 120) - 60 + prog * 0.5, hy = prog - 80;
        const len = 26 + envHash(i + 30) * 40;
        const g = ctx.createLinearGradient(hx, hy, hx - len * 0.5, hy - len);
        g.addColorStop(0, "rgba(255,220,150,0.95)");
        g.addColorStop(1, "rgba(255,120,60,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - len * 0.5, hy - len);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,240,200,0.95)";
        ctx.beginPath();
        ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (id === "moonshot") {
      const g = ctx.createRadialGradient(W * 0.82, 120, 10, W * 0.82, 120, 90);
      g.addColorStop(0, "rgba(232,213,255,0.5)");
      g.addColorStop(1, "rgba(232,213,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(W * 0.82 - 90, 30, 180, 180);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 22; i++) {
        const x = (envHash(i) * W + Math.sin(now * 8e-4 + i * 2) * 44 + W) % W;
        const y = H - (envHash(i + 40) * H + now * 0.012) % (H + 40);
        ctx.globalAlpha = 0.2 + 0.3 * Math.abs(Math.sin(now * 2e-3 + i));
        ctx.fillStyle = "#e8d5ff";
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    } else if (id === "surge") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 20; i++) {
        const x = (envHash(i) * W + Math.sin(now * 2e-3 + i * 3) * 20 + W) % W;
        const y = H - (envHash(i + 70) * H + now * 0.04) % (H + 30);
        ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(now * 4e-3 + i));
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + i % 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const y = H - (now * 0.02 + i * 260) % (H + 120);
        const x = envHash(i + 500) * W;
        ctx.globalAlpha = 0.3 * Math.min(1, (H - y) / 200);
        runeRing(ctx, x, y, 22, "rgba(255,224,120,1)", now, { count: 6, lw: 1, alpha: 1, spin: 2e-3 });
      }
      ctx.globalAlpha = 1;
    } else if (id === "nightfall") {
      drawNightfall(lights);
    }
  }
  function drawEnvVisualsLive(now) {
    const ev = game.envEvent;
    if (!ev || !ev.announced) return;
    let lights = [];
    if (ev.def.id === "nightfall") {
      for (const p of players) if (p.alive) lights.push({ x: p.body.position.x, y: p.body.position.y, r: 160 });
      for (const fb of projectiles) lights.push({ x: fb.position.x, y: fb.position.y, r: 90 });
      for (const t of tomes) lights.push({ x: t.position.x, y: t.position.y, r: 70 });
    }
    drawEnvVisuals(ev.def.id, now, lights);
  }
  function envLightsFromSnap(snap, ghosts) {
    const lights = [];
    for (const g of ghosts) if (g.alive) lights.push({ x: g._x, y: g._y, r: 160 });
    for (const e of snap.bodies || []) {
      if (e.l === "projectile") lights.push({ x: e.x, y: e.y, r: 90 });
      if (e.l === "tome") lights.push({ x: e.x, y: e.y, r: 70 });
    }
    return lights;
  }

  // src/render/draw-pickups.js
  var draw_pickups_exports = {};
  __export(draw_pickups_exports, {
    drawCatalystAt: () => drawCatalystAt,
    drawHatAt: () => drawHatAt,
    drawTomeAt: () => drawTomeAt,
    drawTomes: () => drawTomes
  });
  function drawTomeAt(x, y, angle, spellColor, now, tier) {
    const rank = TIER_RANK[tier] || 0;
    drawStoryTome(ctx, { x, y, angle, now, color: spellColor, rank, rarityColor: TIER_COLOR[tier] });
  }
  function drawCatalystAt(x, y, angle, now) {
    drawStoryCatalyst(ctx, { x, y, angle, now });
  }
  function drawHatAt(x, y, angle, now) {
    drawStoryHat(ctx, { x, y, angle, now });
  }
  function drawTomes(now) {
    for (const t of tomes) {
      if (t.catalyst) drawCatalystAt(t.position.x, t.position.y, t.angle, now);
      else drawTomeAt(t.position.x, t.position.y, t.angle, SPELLS[t.spell].color, now, spellTier(t.spell));
    }
    for (const h of hats) drawHatAt(h.position.x, h.position.y, h.angle, now);
  }

  // src/render/draw-wizard.js
  var draw_wizard_exports = {};
  __export(draw_wizard_exports, {
    drawGhostWisps: () => drawGhostWisps,
    drawNameTag: () => drawNameTag,
    drawOffscreenPointers: () => drawOffscreenPointers,
    drawWisp: () => drawWisp,
    drawWizard: () => drawWizard,
    drawWizardFigure: () => drawWizardFigure
  });
  function drawOffscreenPointers(list, now) {
    const v = cameraViewRect();
    const z = cameraZoom();
    const INSET = 22 / z, EDGE = 18 / z;
    for (const w of list) {
      if (w.x > v.x0 - EDGE && w.x < v.x1 + EDGE && w.y > v.y0 - EDGE && w.y < v.y1 + EDGE) continue;
      const ax = Math.max(v.x0 + INSET, Math.min(v.x1 - INSET, w.x));
      const ay = Math.max(v.y0 + INSET, Math.min(v.y1 - INSET, w.y));
      const speed = Math.hypot(w.vx || 0, w.vy || 0);
      const ang = speed > 0.8 ? Math.atan2(w.vy, w.vx) : Math.atan2(w.y - ay, w.x - ax);
      const dist = Math.hypot(w.x - ax, w.y - ay);
      const s = Math.max(9, 15 - dist * 0.012) / z * (1 + 0.12 * Math.sin(now * 0.012));
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = w.color;
      ctx.strokeStyle = "rgba(13,10,20,0.9)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.7, s * 0.62);
      ctx.lineTo(-s * 0.35, 0);
      ctx.lineTo(-s * 0.7, -s * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawWisp(name, color, x, y, now) {
    const seed = (name || "").length * 1.7;
    const bob = Math.sin(now * 35e-4 + seed) * 3;
    const yy = y + bob;
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = color;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(x - Math.sin(now * 35e-4 + seed - i * 0.9) * 4, yy + i * 7, 4 - i, 0, Math.PI * 2);
      ctx.fill();
    }
    const g = ctx.createRadialGradient(x, yy, 0, x, yy, 9);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.22 + 0.05 * Math.sin(now * 5e-3 + seed);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, yy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.font = "9px Georgia";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(name, x, yy - 13);
    ctx.globalAlpha = 1;
  }
  function drawGhostWisps(now) {
    if (game.state !== "PLAY" && game.state !== "ROUND_END") return;
    for (const p of players) {
      if (!p.alive && p.ghost) drawWisp(p.name, p.color, p.ghost.x, p.ghost.y, now);
    }
  }
  function drawWizardFigure(p, x, y, scale2, now, angle = 0) {
    const spell = p.spellId && SPELLS[p.spellId];
    const ready = spell && now - p.lastCast > effectiveCooldown(p.spellId);
    drawStoryWizard(ctx, {
      x,
      y,
      scale: scale2,
      angle,
      now,
      name: p.name,
      color: p.color,
      hat: p.hat,
      hp: (p.hp ?? MAX_HP) / MAX_HP * 100,
      facing: p.facing,
      walkPhase: p.walkPhase,
      vx: p.body.velocity.x,
      piggy: now < (p.pigUntil || 0),
      alive: p.alive !== 0 && p.alive !== false,
      spellReady: ready,
      spellColor: ready ? spell.color : "#fff",
      variant: avatarVariant(p.name)
    });
  }
  function drawNameTag(name, color, x, y) {
    const z = cameraZoom();
    ctx.save();
    ctx.font = `bold ${11 / z}px Georgia`;
    ctx.textAlign = "center";
    const halfW = ctx.measureText(name).width / 2;
    const ty = claimTagSlot(x, y, halfW);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "rgba(10, 6, 16, 0.85)";
    ctx.lineWidth = 3 / z;
    ctx.lineJoin = "round";
    ctx.strokeText(name, x, ty);
    ctx.fillStyle = color;
    ctx.fillText(name, x, ty);
    if (ty < y - 2) {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 / z;
      ctx.beginPath();
      ctx.moveTo(x, ty + 3 / z);
      ctx.lineTo(x, y + 2 / z);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function drawWizard(p, now) {
    const { x, y } = p.body.position;
    const s = p.sizeScale || 1;
    drawNameTag(p.name, p.color, x, y - 48 * s);
    if (s > 1.6) {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 18;
    }
    drawWizardFigure(p, x, y, s, now, p.body.angle * 0.35);
    ctx.shadowBlur = 0;
    if (now < (p.floatyUntil || 0)) {
      ctx.strokeStyle = "#ff6b81";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 26 * s);
      ctx.lineTo(x + 3, y - 44 * s);
      ctx.stroke();
      ctx.fillStyle = "#ff6b81";
      ctx.beginPath();
      ctx.arc(x + 3, y - 52 * s, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    if (now < (p.invulnUntil || 0) || now < (p.reflectUntil || 0)) {
      ctx.strokeStyle = now < (p.reflectUntil || 0) ? "#4ecdff" : "#ffd700";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
      ctx.beginPath();
      ctx.arc(x, y - 8 * s, 24 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (now < (p.hurtUntil || 0)) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y - 8 * s, 19 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (now < p.frozenUntil) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#9be7ff";
      ctx.fillRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#d8f4ff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
    }
  }

  // src/render/draw-world.js
  var draw_world_exports = {};
  __export(draw_world_exports, {
    bodyRadius: () => bodyRadius,
    draw: () => draw,
    drawBackdrop: () => drawBackdrop,
    drawBarrel: () => drawBarrel,
    drawBodyRounded: () => drawBodyRounded,
    drawBumperBody: () => drawBumperBody,
    drawCrate: () => drawCrate,
    drawDestructible: () => drawDestructible,
    drawDynamicBody: () => drawDynamicBody,
    drawEnemy: () => drawEnemy,
    drawGasVents: () => drawGasVents,
    drawGeysers: () => drawGeysers,
    drawGibs: () => drawGibs,
    drawHazardBody: () => drawHazardBody,
    drawIcicle: () => drawIcicle,
    drawLava: () => drawLava,
    drawMapBodies: () => drawMapBodies,
    drawPivotBolt: () => drawPivotBolt,
    drawProjectiles: () => drawProjectiles,
    drawReticle: () => drawReticle,
    drawRock: () => drawRock,
    drawRunOver: () => drawRunOver,
    drawSpikes: () => drawSpikes,
    drawSummons: () => drawSummons,
    drawTerrainBody: () => drawTerrainBody,
    drawVictory: () => drawVictory,
    drawWreckingBall: () => drawWreckingBall,
    getVignette: () => getVignette,
    mapCrustKind: () => mapCrustKind
  });

  // src/render/draw-boss.js
  var draw_boss_exports = {};
  __export(draw_boss_exports, {
    drawBossBar: () => drawBossBar,
    drawBossBody: () => drawBossBody
  });
  function drawBossBody(b, now) {
    const { x, y } = b.position;
    drawStoryBoss(ctx, {
      x,
      y,
      now,
      r: b.circleRadius || 46,
      type: b.bossType,
      color: b.color || "#e15d5d"
    });
  }
  function drawBossBar(name, color, hp, maxHp) {
    const w = 420, x = W / 2 - w / 2, y = 96;
    ctx.textAlign = "center";
    ctx.font = "bold 15px Georgia";
    ctx.fillStyle = color;
    ctx.fillText(name, W / 2, y - 6);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, hp / maxHp), 10);
    ctx.strokeStyle = "#e8d5ff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 10);
  }

  // src/render/hud.js
  var hud_exports = {};
  __export(hud_exports, {
    controllerHint: () => controllerHint,
    drawArcadeLogo: () => drawArcadeLogo,
    drawAwards: () => drawAwards,
    drawCooldownBar: () => drawCooldownBar,
    drawHUD: () => drawHUD,
    drawKillFeed: () => drawKillFeed,
    drawLobby: () => drawLobby,
    drawLobbyPanel: () => drawLobbyPanel,
    drawPlayerSpells: () => drawPlayerSpells,
    drawSpellReport: () => drawSpellReport,
    setDrawLobby: () => setDrawLobby
  });
  function drawKillFeed(now) {
    ctx.textAlign = "left";
    ctx.font = "bold 12px Georgia";
    let y = 96;
    for (const l of killFeedLines) {
      const age = now - l.at;
      if (age > 4500) continue;
      ctx.globalAlpha = Math.min(1, (4500 - age) / 800);
      let x = 16;
      const put = (txt, col) => {
        ctx.fillStyle = col;
        ctx.fillText(txt, x, y);
        x += ctx.measureText(txt).width + 5;
      };
      if (l.self) {
        put(l.a, l.ac);
        put("\u26A1 themself", "#9c8ab8");
      } else if (!l.a) {
        put("\u2620", "#9c8ab8");
        put(l.b, l.bc);
      } else {
        put(l.a, l.ac);
        put("\u26A1", "#ffd166");
        put(l.b, l.bc);
      }
      y += 17;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
  }
  function drawAwards(awards, now) {
    if (!awards || !awards.length) return;
    let y = 592;
    for (const a of awards) {
      ctx.font = "bold 13px Georgia";
      ctx.fillStyle = "#ffd166";
      ctx.textAlign = "right";
      ctx.fillText(`\u{1F3C6} ${a.t}`, W / 2 - 20, y);
      ctx.font = "14px Georgia";
      ctx.fillStyle = a.c;
      ctx.textAlign = "left";
      ctx.fillText(`${a.n} \u2014 ${a.v}`, W / 2 + 5, y);
      y += 22;
    }
    ctx.textAlign = "center";
  }
  function drawSpellReport(report, now) {
    if (!report || !report.length) return;
    const x = 60;
    let y = 356;
    ctx.textAlign = "left";
    ctx.font = "bold 15px Georgia";
    ctx.fillStyle = "#ffd166";
    ctx.fillText("\u{1F4D6} SPELLBOOK REPORT", x, y);
    y += 26;
    for (const r of report) {
      ctx.fillStyle = typeof TIER_COLOR !== "undefined" && TIER_COLOR[r.t] || "#c9c9d6";
      ctx.beginPath();
      ctx.arc(x + 5, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 14px Georgia";
      ctx.fillStyle = r.c;
      ctx.fillText(r.n, x + 16, y);
      ctx.font = "13px Georgia";
      ctx.fillStyle = "#c8bcd8";
      const parts = [];
      if (r.k) parts.push(`${r.k} KO`);
      if (r.d) parts.push(`${r.d} dmg`);
      parts.push(`${r.ca} cast${r.ca === 1 ? "" : "s"}`);
      ctx.fillText(parts.join(" \xB7 "), x + 16, y + 16);
      y += 38;
    }
    ctx.textAlign = "center";
  }
  function drawCooldownBar(x, y, spell, frac, megaCasts) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 22, y, 44, 4);
    ctx.fillStyle = frac >= 1 ? spell.color : "#675a7d";
    ctx.fillRect(x - 22, y, 44 * Math.max(0, frac), 4);
    if (megaCasts > 0) {
      ctx.font = "bold 11px Georgia";
      ctx.fillStyle = "#ffd700";
      ctx.fillText(`\u2605${megaCasts}`, x + 36, y + 5);
    }
  }
  function drawPlayerSpells(x, slots, cdf, megaCasts, charges) {
    ctx.textAlign = "center";
    for (let i = 0; i < 2; i++) {
      const y = 74 + i * 22;
      const def = slots[i] && SPELLS[slots[i]];
      ctx.font = "13px Georgia";
      ctx.fillStyle = def ? tierColor(slots[i]) || "#9c8ab8" : "#4a415c";
      const n = charges?.[i];
      ctx.fillText(def ? def.name + (n != null ? ` \xD7${n}` : "") : "\xB7 \xB7 \xB7", x, y);
      if (def) drawCooldownBar(x, y + 6, def, cdf[i], i === 0 ? megaCasts : 0);
    }
  }
  function drawHUD(now) {
    if (game.state === "LOBBY" || game.state === "VICTORY") return;
    ctx.textAlign = "center";
    ctx.font = "12px Georgia";
    ctx.fillStyle = "#675a7d";
    if (game.mode === "wave") {
      ctx.font = "bold 16px Georgia";
      ctx.fillStyle = "#ffd166";
      const left = enemies.size + (game.boss ? 1 : 0);
      ctx.fillText(game.waveState === "intermission" ? `WAVE ${game.wave} CLEARED \u2014 NEXT INCOMING` : `WAVE ${game.wave} \xB7 ${left} LEFT`, W / 2, 18);
    } else {
      ctx.fillText(`${currentMap.def.name} \xB7 ${game.mapIndex + 1}/${MAPS.length}`, W / 2, 18);
    }
    if (game.envEvent?.announced) {
      ctx.font = "bold 11px Georgia";
      ctx.fillStyle = game.envEvent.def.color;
      ctx.fillText(`\u26A0 ${game.envEvent.def.name}`, W / 2, H - 12);
    }
    if (game.boss?.announced) drawBossBar(game.boss.title || game.boss.def.name, game.boss.enraged ? "#ff4d4d" : game.boss.def.color, game.boss.hp, game.boss.maxHp);
    drawKillFeed(now);
    const spacing = Math.min(300, (W - 220) / Math.max(players.length - 1, 1));
    players.forEach((p, i) => {
      const x = players.length === 1 ? 150 : W / 2 + (i - (players.length - 1) / 2) * spacing;
      ctx.font = "bold 20px Georgia";
      ctx.fillStyle = p.color;
      ctx.fillText(p.name, x, 38);
      ctx.strokeStyle = p.color;
      if (game.mode === "wave") {
        if (p.alive) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(x - 30, 48, 60, 6);
          ctx.fillStyle = p.hp > MAX_HP * 0.3 ? "#7bd88f" : "#ff5e57";
          ctx.fillRect(x - 30, 48, 60 * Math.max(0, p.hp / MAX_HP), 6);
        } else {
          ctx.font = "bold 13px Georgia";
          ctx.fillStyle = "#675a7d";
          ctx.fillText("DOWN", x, 54);
        }
      } else if (game.winsNeeded <= 9) {
        const pipStart = x - (game.winsNeeded - 1) * 9;
        for (let w = 0; w < game.winsNeeded; w++) {
          ctx.beginPath();
          ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
          if (w < p.roundWins) ctx.fill();
          else {
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      } else {
        ctx.font = "bold 15px Georgia";
        ctx.fillText(`${p.roundWins} / ${game.winsNeeded}`, x, 58);
      }
      const cdf = [0, 1].map((s) => p.slots[s] ? Math.min(1, (now - p.casts[s]) / effectiveCooldown(p.slots[s])) : 0);
      drawPlayerSpells(x, p.slots, cdf, p.megaCasts, p.slotCharges);
    });
    if (now < bannerUntil) {
      if (bannerHyper) {
        const pulse = 1 + 0.12 * Math.sin(now * 0.03);
        ctx.save();
        ctx.translate(W / 2, 160);
        ctx.scale(pulse, pulse);
        ctx.font = "bold 78px Georgia";
        ctx.shadowColor = "#a55eea";
        ctx.shadowBlur = 34;
        ctx.fillStyle = `hsl(${now * 0.4 % 360}, 90%, 78%)`;
        ctx.fillText(banner, 0, 0);
        ctx.restore();
        ctx.shadowBlur = 0;
      } else {
        ctx.font = "bold 52px Georgia";
        ctx.fillStyle = bannerColor;
        ctx.fillText(banner, W / 2, 150);
      }
    }
  }
  function controllerHint(p) {
    if (p.controller instanceof BotController) return "BOT";
    if (p.controller instanceof GamepadController) return `GAMEPAD ${p.controller.index + 1}`;
    if (p.controller instanceof KeyboardController) return p.controller.map === KEYMAPS[0] ? "WASD + MOUSE" : "\u2190 \u2192 \u2191 + ENTER";
    return "ONLINE";
  }
  function drawArcadeLogo(cx, cy, px, now, text = "HYPERSPELL") {
    ctx.save();
    ctx.font = `italic 900 ${px}px Georgia, serif`;
    ctx.textAlign = "left";
    const widths = [...text].map((ch) => ctx.measureText(ch).width);
    const spacing = px * 0.05;
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
    const left = cx - total / 2;
    const sweep = left + now * 0.28 % (total * 2.2) - total * 0.6;
    let x = left;
    for (let i = 0; i < text.length; i++) {
      const yy = cy + Math.sin(now * 28e-4 + i * 0.55) * px * 0.07;
      const g = ctx.createLinearGradient(0, yy - px * 0.8, 0, yy + px * 0.18);
      g.addColorStop(0, "#bfe8ff");
      g.addColorStop(0.44, "#e8d5ff");
      g.addColorStop(0.5, "#5d3a8f");
      g.addColorStop(0.56, "#ff6b81");
      g.addColorStop(1, "#ffd166");
      ctx.shadowColor = "#a55eea";
      ctx.shadowBlur = 16 + 9 * Math.sin(now * 45e-4);
      ctx.fillStyle = g;
      ctx.fillText(text[i], x, yy);
      ctx.shadowBlur = 0;
      const d = Math.abs(x + widths[i] / 2 - sweep);
      if (d < px * 1.1) {
        ctx.globalAlpha = Math.max(0, 1 - d / (px * 1.1)) * 0.75;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text[i], x, yy);
        ctx.globalAlpha = 1;
      }
      x += widths[i] + spacing;
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const tw = Math.max(0, Math.sin(now * 4e-3 + i * 2.1));
      if (tw < 0.05) continue;
      ctx.globalAlpha = tw * 0.9;
      const sx = left + envHash(i + 4) * total;
      const sy = cy - px * (0.15 + 0.6 * envHash(i + 11));
      const r = px * (0.06 + 0.05 * tw);
      ctx.beginPath();
      ctx.moveTo(sx - r, sy);
      ctx.lineTo(sx + r, sy);
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx, sy + r);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
  }
  function drawLobbyPanel(view) {
    ctx.fillStyle = "rgba(12,8,18,0.72)";
    ctx.fillRect(W / 2 - 430, 55, 860, 265);
    ctx.textAlign = "center";
    drawArcadeLogo(W / 2, 132, 60, performance.now());
    ctx.font = "16px Georgia";
    ctx.fillStyle = "#9c8ab8";
    ctx.fillText(view.joinLine, W / 2, 162);
    const slots = view.slots;
    const slotW = Math.min(200, 840 / slots.length);
    for (let i = 0; i < slots.length; i++) {
      const x = W / 2 + (i - (slots.length - 1) / 2) * slotW;
      const s = slots[i];
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - slotW / 2 + 6, 185, slotW - 12, 60);
      ctx.font = "bold 20px Georgia";
      ctx.fillStyle = s.color;
      ctx.fillText(s.label, x, 218);
      ctx.font = "11px Georgia";
      ctx.fillStyle = s.hintBright ? "#e8d5ff" : "#675a7d";
      ctx.fillText(s.hint, x, 238);
    }
    ctx.font = "bold 20px Georgia";
    ctx.fillStyle = view.readyColor;
    ctx.fillText(view.readyLine, W / 2, 288);
    ctx.font = "13px Georgia";
    ctx.fillStyle = "#675a7d";
    ctx.fillText(view.controlsLine, W / 2, 310);
  }
  function baseDrawLobby() {
    const count = Math.max(4, Math.min(MAX_PLAYERS, players.length + 1));
    const slots = [];
    for (let i = 0; i < count; i++) {
      const p = players[i];
      const editing = nameEdit && p && nameEdit.p === p;
      const padEditing = editing && nameEdit.pad != null;
      let label;
      if (padEditing) {
        const blink = Math.floor(performance.now() / 350) % 2;
        label = `${nameEdit.buffer}${blink ? `[${PAD_ALPHABET[nameEdit.letter]}]` : "   "}`;
      } else if (editing) {
        label = (nameEdit.buffer || "") + (Math.floor(performance.now() / 400) % 2 ? "_" : " ");
      } else {
        label = p ? p.name + " \u2726" : "JOIN";
      }
      slots.push({
        label,
        color: p ? p.color : "#4a3f5e",
        hintBright: !!editing,
        hint: padEditing ? "\u25C0\u25B6 letter \xB7 A add \xB7 B del \xB7 START \u2713" : editing ? "TYPE NAME \xB7 ENTER \u2713" : p ? controllerHint(p) : "E \xB7 ENTER \xB7 PAD"
      });
    }
    const wave = game.mode === "wave";
    const ready = players.length >= minPlayers();
    drawLobbyPanel({
      joinLine: "press E \xB7 ENTER \xB7 or any gamepad button to join \u2014 B / BACK adds a bot",
      slots,
      readyColor: ready ? wave ? "#ffd166" : "#7bd88f" : "#675a7d",
      readyLine: !ready ? wave ? "NEED AT LEAST 1 WIZARD" : "NEED AT LEAST 2 WIZARDS" : wave ? `SPACE / START \u2014 WAVE SURVIVAL${game.bestWave ? `  (BEST: WAVE ${game.bestWave})` : ""}` : `SPACE / START TO FIGHT \u2014 FIRST TO ${game.winsNeeded} WINS`,
      controlsLine: wave ? "M / pad-X switches back to VERSUS \xB7 co-op: everyone fights the waves together \xB7 Y names your wizard" : `M / pad-X = WAVE SURVIVAL \xB7 1\u20139 or d-pad \u2191\u2193 sets win target (${game.winsNeeded}) \xB7 Y names your wizard`
    });
  }
  var drawLobby = baseDrawLobby;
  function setDrawLobby(fn) {
    drawLobby = fn || baseDrawLobby;
  }

  // src/render/replay.js
  var replay_exports2 = {};
  __export(replay_exports2, {
    drawReplay: () => drawReplay,
    drawReplayOverlay: () => drawReplayOverlay,
    replayCameraPoints: () => replayCameraPoints
  });
  function replayCameraPoints() {
    const f = replayFrameAt();
    if (!f) return null;
    return f.snap.ps.filter((gp) => gp.al).map((gp) => ({ x: gp.x, y: gp.y, r: 26 }));
  }
  function drawReplayOverlay(now) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, 54);
    ctx.fillRect(0, H - 54, W, 54);
    ctx.fillStyle = "#ff5e57";
    ctx.beginPath();
    ctx.arc(30, 30, 6 + 1.5 * Math.sin(now * 0.01), 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 16px Georgia";
    ctx.textAlign = "left";
    ctx.fillText("REPLAY", 46, 36);
    ctx.textAlign = "center";
  }
  function drawReplay(now) {
    const f = replayFrameAt();
    if (!f) return;
    drawSnapshotWorld(f.snap, f.prev, f.alpha, now);
    if (f.done) game.replay = null;
  }

  // src/render/draw-world.js
  function drawBodyRounded(b, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    const v = b.vertices;
    ctx.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  function drawCrate(b) {
    drawStoryCrate(ctx, { vertices: b.vertices, x: b.position.x, y: b.position.y, angle: b.angle });
  }
  function bodyRadius(b, fallback = 14) {
    if (b.circleRadius) return b.circleRadius;
    if (b.vertices && b.vertices.length) {
      return Math.hypot(b.vertices[0].x - b.position.x, b.vertices[0].y - b.position.y);
    }
    return fallback;
  }
  function drawIcicle(b, now) {
    const r = bodyRadius(b, 24);
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    const g = ctx.createLinearGradient(-r * 0.5, 0, r, 0);
    g.addColorStop(0, "#eaf9ff");
    g.addColorStop(0.55, "#bfe8ff");
    g.addColorStop(1, "#6fb6e0");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.6);
    ctx.lineTo(r * 1.08, 0);
    ctx.lineTo(-r * 0.5, r * 0.6);
    ctx.lineTo(-r * 0.28, r * 0.32);
    ctx.lineTo(-r * 0.52, r * 0.14);
    ctx.lineTo(-r * 0.3, -r * 0.04);
    ctx.lineTo(-r * 0.52, -r * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d8f4ff";
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, -r * 0.52);
    ctx.lineTo(r * 0.42, -r * 0.34);
    ctx.lineTo(r * 0.05, -r * 0.2);
    ctx.moveTo(-r * 0.1, r * 0.52);
    ctx.lineTo(r * 0.42, r * 0.34);
    ctx.lineTo(r * 0.05, r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.16);
    ctx.lineTo(r * 0.72, -r * 0.04);
    ctx.stroke();
    ctx.restore();
  }
  function drawBarrel(b) {
    const r = bodyRadius(b);
    const { x, y } = b.position;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
    g.addColorStop(0, "#a37ec9");
    g.addColorStop(0.7, "#7d5a9e");
    g.addColorStop(1, "#4e3766");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.angle);
    ctx.strokeStyle = "rgba(30,18,44,0.55)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
      ctx.lineTo(-Math.cos(a) * r * 0.85, -Math.sin(a) * r * 0.85);
      ctx.stroke();
    }
    ctx.strokeStyle = "#c9a86a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#e0c185";
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawBumperBody(b, now) {
    const r = bodyRadius(b, 22);
    const { x, y } = b.position;
    const pulse = 1 + 0.05 * Math.sin(now * 6e-3 + x * 0.05);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * pulse);
    g.addColorStop(0, "#ffe1ef");
    g.addColorStop(0.55, "#ff8fc7");
    g.addColorStop(1, "#d4569a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffd3e8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r * pulse * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawWreckingBall(b) {
    const r = bodyRadius(b, 40);
    const { x, y } = b.position;
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, "#4e4a5e");
    g.addColorStop(0.5, "#211c30");
    g.addColorStop(1, "#0b0812");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.angle);
    ctx.fillStyle = "#5d5870";
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.max(1.6, r * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.2, r * 0.11, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawRock(b, col) {
    drawBodyRounded(b, col || "#5a5245");
    const r = bodyRadius(b, 20);
    const snow = col === "#f4fbff";
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    ctx.fillStyle = snow ? "rgba(120,160,190,0.18)" : "rgba(0,0,0,0.28)";
    for (const [dx, dy, cr] of [[-0.35, -0.15, 0.16], [0.25, 0.2, 0.22], [0.1, -0.4, 0.12]]) {
      ctx.beginPath();
      ctx.ellipse(dx * r, dy * r, cr * r, cr * r * 0.75, dx, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = snow ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.35, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawPivotBolt(b) {
    ctx.fillStyle = "#0d0a14";
    ctx.beginPath();
    ctx.arc(b.position.x, b.position.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6a6280";
    ctx.beginPath();
    ctx.arc(b.position.x, b.position.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawHazardBody(b, now) {
    const col = b.render && b.render.fillStyle || b.color;
    if (b.label === "icicle") {
      drawIcicle(b, now);
      return true;
    }
    if (b.label === "barrel") {
      drawBarrel(b);
      return true;
    }
    if (b.label === "bouncy") {
      drawBumperBody(b, now);
      return true;
    }
    if (b.label === "ball") {
      if (col === "#100c18") drawWreckingBall(b);
      else drawRock(b, col);
      return true;
    }
    return false;
  }
  function drawGeysers(now) {
    for (const g of currentMap.data.geysers || []) {
      ctx.fillStyle = "#3a3040";
      ctx.beginPath();
      ctx.ellipse(g.x - 14, g.y + 8, 16, 9, 0.15, 0, Math.PI * 2);
      ctx.ellipse(g.x + 14, g.y + 8, 16, 9, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1524";
      ctx.beginPath();
      ctx.ellipse(g.x, g.y + 4, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      const soon = g.nextAt && g.nextAt - now < 700;
      if (soon || Math.random() < 0.08) {
        particles.push({ kind: "square", x: g.x + fxRange2(-8, 8), y: g.y + 2, vx: 0, vy: soon ? fxRange2(-4, -2) : -1, life: 18, maxLife: 18, color: soon ? "#ffb347" : "#8a7f9e", r: soon ? 3 : 2 });
      }
    }
  }
  function drawGasVents(now) {
    for (const v of currentMap.data.vents || []) {
      ctx.fillStyle = "#25331f";
      ctx.beginPath();
      ctx.ellipse(v.x - 13, v.y + 8, 15, 8, 0.12, 0, Math.PI * 2);
      ctx.ellipse(v.x + 13, v.y + 8, 15, 8, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#141d10";
      ctx.beginPath();
      ctx.ellipse(v.x, v.y + 4, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(now / 300 + v.x);
      ctx.fillStyle = "#aef05a";
      ctx.beginPath();
      ctx.ellipse(v.x, v.y + 3, 6, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 10; i++) {
        const ph = envHash(Math.round(v.x) + i * 31);
        const yy = v.y - (now * (0.045 + ph * 0.03) + ph * 500) % 260;
        const t = (v.y - yy) / 260;
        const sway = Math.sin(now * 3e-3 + i * 2.1 + v.x) * (8 + ph * 10) * t;
        ctx.globalAlpha = 0.3 * (1 - t);
        ctx.fillStyle = i % 3 ? "#aef05a" : "#7bd88f";
        ctx.beginPath();
        ctx.arc(v.x + sway, yy, 2 + ph * 2.5 + t * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  function drawSpikes(b) {
    drawStorySpikes(ctx, {
      x: b.position.x,
      y: b.position.y,
      angle: b.angle,
      w: b.w || 100,
      h: b.h || 20,
      color: b.render.fillStyle || "#8a2f3d"
    });
  }
  function drawDestructible(b, now = performance.now()) {
    const frac = Math.max(0, (b.hp ?? b.maxHp) / (b.maxHp || 1));
    drawStoryDestructible(ctx, {
      x: b.position.x,
      y: b.position.y,
      w: b.w || 40,
      h: b.h || 40,
      angle: b.angle || 0,
      kind: b.kind || "wood",
      frac,
      color: b.dcolor || "#6b4a2a",
      now
    });
    const { x, y } = b.position;
    const w = b.w || 40, h = b.h || 40;
    const k = b.kind;
    if (k === "ice") {
      if (Math.random() < 6e-3) particles.push({ kind: "glint", x: x + fxRange2(-w / 2, w / 2), y: y + fxRange2(-h / 2, h / 2), vx: 0, vy: 0, life: 34, maxLife: 34, color: "#eaffff", r: 3 });
      if (Math.random() < 3e-3) particles.push({ kind: "square", x: x + fxRange2(-w / 2, w / 2), y: y - h / 2, vx: fxRange2(-0.3, 0.3), vy: 0.4, life: 40, maxLife: 40, color: "#ffffff", r: 1.5, g: 0.02 });
    } else if (k === "obsidian") {
      if (Math.random() < 0.01) particles.push({ x: x + fxRange2(-w / 2, w / 2), y: y - h / 2, vx: fxRange2(-0.2, 0.2), vy: -fxRange2(0.4, 1), life: 36, maxLife: 36, color: "#ff7043", r: 1.6, g: -0.02 });
    } else if (k === "wood" && isLeafy(b.dcolor)) {
      if (Math.random() < 4e-3) particles.push({ kind: "leaf", x: x + fxRange2(-w / 2, w / 2), y: y + h / 2 - 4, vx: fxRange2(-0.4, 0.4), vy: 0.3, life: 70, maxLife: 70, color: b.dcolor, r: 2.6 });
    } else if (k === "stone") {
      if (Math.random() < 15e-4) particles.push({ kind: "square", x: x + fxRange2(-w / 2, w / 2), y: y + fxRange2(0, h / 2), vx: 0, vy: 0.5, life: 26, maxLife: 26, color: "#9a8f7a", r: 1.3, g: 0.04 });
    }
  }
  function mapCrustKind() {
    const d = currentMap.data, def = currentMap.def;
    if (def.icy || d.eventIcy) return "snow";
    if (d.lavaY != null || d.acid) return "char";
    if (d.starfield || d.voidTop) return "crystal";
    return "grass";
  }
  function drawTerrainBody(b, now) {
    if (b.isStatic || b.kinematic || b.spin) {
      drawStoryTerrain(ctx, {
        vertices: b.vertices,
        bounds: b.bounds,
        angle: b.angle,
        now,
        color: b.render.fillStyle || "#2a2336",
        crust: mapCrustKind(),
        flip: gravityY() < 0
      });
    } else {
      drawBodyRounded(b, b.render.fillStyle || "#171221");
    }
  }
  function drawMapBodies(now) {
    for (const b of allBodies(currentMap.composite)) {
      if (b.label === "lava") continue;
      if (b.phantom) ctx.globalAlpha = b.phantomSolid === false ? 0.18 : 0.85;
      if (b.label === "crate") drawCrate(b);
      else if (b.label === "destructible") drawDestructible(b, now);
      else if (b.label === "spikes") drawSpikes(b);
      else if (b.label === "vine") drawVineAt(b.position.x, b.bounds.max.y, Math.min(48, (now - (b.bornAt || now)) * 0.04 + 10), now);
      else if (drawHazardBody(b, now)) {
      } else {
        drawTerrainBody(b, now);
        if (b.spin) drawPivotBolt(b);
      }
      ctx.globalAlpha = 1;
    }
    for (const c of allJoints(currentMap.composite)) {
      if (c.label !== "breakable" && c.label !== "chain") continue;
      const [a, b] = jointEnds(c);
      if (c.label === "chain") {
        ctx.strokeStyle = "#0d0a14";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        ctx.fillStyle = "#2c2438";
        for (let t = 12; t < d; t += 26) {
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * t / d, a.y + (b.y - a.y) * t / d, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = "#5d4a33";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  function drawLava(now) {
    const y = currentMap.data.lavaY;
    if (y == null) return;
    const acid = currentMap.data.acid;
    const cTop = acid ? "#9be15d" : "#ff5e57";
    const cBot = acid ? "#39702e" : "#a8262a";
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, cTop);
    g.addColorStop(1, cBot);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-10, H + 10);
    ctx.lineTo(-10, y + 8);
    for (let x = 0; x <= W + 32; x += 32) {
      ctx.lineTo(x, y + 6 + Math.sin(now * 2e-3 + x * 0.02) * 5);
    }
    ctx.lineTo(W + 10, H + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = acid ? "rgba(220,255,160,0.5)" : "rgba(255,180,120,0.5)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= W + 32; x += 32) {
      const yy = y + 6 + Math.sin(now * 2e-3 + x * 0.02) * 5;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
    if (Math.random() < 0.3) {
      particles.push({ kind: "square", x: fxRange2(0, W), y: y + 8, vx: 0, vy: fxRange2(-1.5, -0.5), life: 30, maxLife: 30, color: acid ? "#c5f97d" : "#ff8c5a", r: 3 });
    }
  }
  function drawGibs() {
    for (const gib of gibs) drawBodyRounded(gib, gib.color);
  }
  function drawEnemy(b, now) {
    const e = b.enemy;
    if (!e) {
      drawBodyRounded(b, b.color || "#c98a4a");
      return;
    }
    const x = b.position.x, y = b.position.y;
    const dir = Math.abs(b.velocity.x) > 0.2 ? Math.sign(b.velocity.x) : b._face || 1;
    b._face = dir;
    const hurt = now - (e.hurtAt || 0) < 110;
    if (e.type !== "swordsman") drawBodyRounded(b, hurt ? "#ffffff" : e.color);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (e.type === "swordsman") {
      const cloak = hurt ? "#ffffff" : e.color;
      const bob = Math.sin(now * 8e-3 + x * 0.05) * 1.2;
      ctx.fillStyle = hurt ? "#ffffff" : shade(cloak, -0.28);
      ctx.beginPath();
      ctx.moveTo(-9, -8);
      ctx.quadraticCurveTo(-15, 8, -13, 21);
      ctx.lineTo(-8, 17);
      ctx.lineTo(-3, 22);
      ctx.lineTo(3, 17);
      ctx.lineTo(9, 22);
      ctx.lineTo(12, 15);
      ctx.quadraticCurveTo(11, 0, 6, -9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = hurt ? "#ffffff" : cloak;
      ctx.beginPath();
      ctx.moveTo(6, -9);
      ctx.quadraticCurveTo(10, 4, 9, 20);
      ctx.lineTo(3, 17);
      ctx.lineTo(0, 21);
      ctx.quadraticCurveTo(2, 4, 2, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = hurt ? "#ffffff" : shade(cloak, -0.42);
      ctx.beginPath();
      ctx.moveTo(-8, -6 + bob);
      ctx.quadraticCurveTo(-7, -22 + bob, 7, -22 + bob);
      ctx.quadraticCurveTo(13, -18 + bob, 12, -6 + bob);
      ctx.quadraticCurveTo(2, -3 + bob, -8, -6 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(8,6,14,0.92)";
      ctx.beginPath();
      ctx.ellipse(4, -11 + bob, 6, 4.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      if (!hurt) {
        ctx.fillStyle = "#bfe8ff";
        ctx.beginPath();
        ctx.arc(5, -11 + bob, 1.5, 0, Math.PI * 2);
        ctx.arc(9, -11.5 + bob, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(9, 9);
      ctx.rotate(0.5);
      ctx.strokeStyle = "#3a2c1c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-3, -4);
      ctx.lineTo(1, 3);
      ctx.stroke();
      ctx.strokeStyle = "#8a6a3a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4, 1);
      ctx.lineTo(4, -1);
      ctx.stroke();
      ctx.fillStyle = hurt ? "#ffffff" : "#cfd8e8";
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(3, 2);
      ctx.lineTo(13, 6);
      ctx.lineTo(3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -0.5);
      ctx.lineTo(12, 5.5);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      if (e.hp < e.maxHp) {
        const w = Math.max(20, b.bounds.max.x - b.bounds.min.x);
        const top = b.bounds.min.y - 8;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x - w / 2, top, w, 4);
        ctx.fillStyle = "#ff5e57";
        ctx.fillRect(x - w / 2, top, w * Math.max(0, e.hp / e.maxHp), 4);
      }
      return;
    } else if (e.type === "archer") {
      ctx.strokeStyle = "#5a3d22";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 0, 14, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12 + 14 * Math.cos(-1.1), 14 * Math.sin(-1.1));
      ctx.lineTo(12 + 14 * Math.cos(1.1), 14 * Math.sin(1.1));
      ctx.stroke();
    } else if (e.type === "bug") {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) for (const o of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(s * 6, o);
        ctx.lineTo(s * 13, o + Math.sin(now * 0.02 + o) * 3);
        ctx.stroke();
      }
    } else if (e.type === "ogre") {
      ctx.fillStyle = "#7a5a33";
      ctx.save();
      ctx.translate(20, -6);
      ctx.rotate(-0.5);
      ctx.fillRect(-4, -4, 8, 34);
      ctx.beginPath();
      ctx.arc(0, 30, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = e.type === "ogre" ? "#ff5555" : "#fff";
    const ey = e.type === "bug" ? -3 : -6, er = e.type === "ogre" ? 3 : 2;
    ctx.beginPath();
    ctx.arc(3, ey, er, 0, Math.PI * 2);
    ctx.arc(9, ey, er, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (e.hp < e.maxHp) {
      const w = Math.max(20, b.bounds.max.x - b.bounds.min.x);
      const top = b.bounds.min.y - 8;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x - w / 2, top, w, 4);
      ctx.fillStyle = "#ff5e57";
      ctx.fillRect(x - w / 2, top, w * Math.max(0, e.hp / e.maxHp), 4);
    }
  }
  function drawDynamicBody(b, now) {
    const col = b.render && b.render.fillStyle || b.color || "#c0c0cc";
    if (b.label === "projectile") {
      const r = b.circleRadius || 7;
      ctx.shadowColor = b.color || "#ffb347";
      ctx.shadowBlur = 12;
      ctx.fillStyle = b.color || "#ffb347";
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (b.label === "crate") {
      drawCrate(b);
      return;
    }
    if (b.label === "boss") {
      drawBossBody(b, now);
      return;
    }
    if (b.label === "vine") {
      const ys = b.vertices ? b.vertices.map((v) => v.y) : [b.position.y - 24, b.position.y + 24];
      drawVineAt(b.position.x, Math.max(...ys), Math.max(...ys) - Math.min(...ys), now);
      return;
    }
    if (b.label === "critter") {
      drawBodyRounded(b, col);
      const dir = b.critter ? b.critter.dir : 1;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.position.x + dir * 4, b.position.y - 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(b.position.x + dir * 4.8, b.position.y - 3, 1, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (b.label === "enemy") {
      drawEnemy(b, now);
      return;
    }
    if (b.label === "decoy") {
      const p = b.decoyOf;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y - 4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.hat;
      ctx.beginPath();
      ctx.moveTo(b.position.x - 9, b.position.y - 10);
      ctx.lineTo(b.position.x + 9, b.position.y - 10);
      ctx.lineTo(b.position.x + 2, b.position.y - 26);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    if (b.label === "saw") {
      drawBodyRounded(b, col);
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.strokeStyle = "#7a7a8c";
      ctx.lineWidth = 2;
      const r = (b.circleRadius || 15) + 3;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (b.label === "mine") {
      drawBodyRounded(b, col);
      ctx.fillStyle = Math.sin(now * 8e-3) > 0 ? "#ff4444" : "#661111";
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (b.label === "anvil") {
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = "#4a4a55";
      ctx.fillRect(-22, -13, 34, 10);
      ctx.beginPath();
      ctx.moveTo(12, -13);
      ctx.lineTo(25, -8);
      ctx.lineTo(12, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#3d3d47";
      ctx.fillRect(-6, -3, 12, 6);
      ctx.beginPath();
      ctx.moveTo(-16, 14);
      ctx.lineTo(16, 14);
      ctx.lineTo(10, 3);
      ctx.lineTo(-10, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#26262e";
      ctx.lineWidth = 1.3;
      ctx.strokeRect(-22, -13, 34, 10);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(-22, -13, 34, 2.5);
      ctx.restore();
      return;
    }
    if (b.label === "boulderS") {
      const r = b.circleRadius || 26;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = "#6b6357";
      ctx.beginPath();
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const rr = r * (0.8 + i * 41 % 13 / 40);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3f3a32";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = "#524b40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.4);
      ctx.lineTo(r * 0.05, 0);
      ctx.lineTo(-r * 0.25, r * 0.45);
      ctx.moveTo(r * 0.05, 0);
      ctx.lineTo(r * 0.5, -r * 0.15);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.35, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (b.label === "piano") {
      drawBodyRounded(b, col);
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(-34, 4, 68, 10);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1;
      for (let i = -30; i <= 30; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 4);
        ctx.lineTo(i, 14);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (drawHazardBody(b, now)) return;
    drawBodyRounded(b, col);
    if (b.spin) drawPivotBolt(b);
  }
  function drawProjectiles(now) {
    for (const fb of projectiles) drawDynamicBody(fb, now);
  }
  function drawSummons(now) {
    for (const b of summons) drawDynamicBody(b, now);
  }
  function drawReticle(now) {
    if (!mouse.present) return;
    const p = players.find((q) => q.controller === kbControllers[0]);
    if (!p || !p.alive) return;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (const [dx, dy] of [[12, 0], [-12, 0], [0, 12], [0, -12]]) {
      ctx.moveTo(mouse.x + dx * 0.5, mouse.y + dy * 0.5);
      ctx.lineTo(mouse.x + dx, mouse.y + dy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  var vignetteCache = null;
  function getVignette() {
    if (!vignetteCache) {
      vignetteCache = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
      vignetteCache.addColorStop(0, "rgba(0,0,0,0)");
      vignetteCache.addColorStop(1, "rgba(0,0,0,0.38)");
    }
    return vignetteCache;
  }
  function drawBackdrop(now) {
    drawStoryBackdrop(ctx, {
      bg: currentMap.def.bg || "#241d2e",
      W,
      H,
      now,
      stars: currentMap.data.starfield,
      voidTop: currentMap.data.voidTop,
      icy: currentMap.def.icy || currentMap.data.eventIcy,
      acid: currentMap.data.acid,
      lavaY: currentMap.data.lavaY
    });
  }
  function drawVictory(now) {
    ctx.fillStyle = "rgba(10,6,16,0.6)";
    ctx.fillRect(0, 0, W, H);
    const p = game.winner;
    drawWizardFigure(p, W / 2, 400, 4.5, now);
    ctx.textAlign = "center";
    ctx.font = "bold 58px Georgia";
    ctx.fillStyle = p.color;
    ctx.fillText(`${p.name} WINS THE MATCH`, W / 2, 180);
    ctx.font = "20px Georgia";
    ctx.fillStyle = "#e8d5ff";
    ctx.fillText("press CAST for a rematch", W / 2, 550);
    drawAwards(game.awards, now);
    drawSpellReport(game.spellReport, now);
    if (Math.random() < 0.6) {
      particles.push({ kind: "confetti", x: fxRange2(0, W), y: -10, vx: fxRange2(-1, 1), vy: fxRange2(1, 3), life: 120, maxLife: 120, color: fxPick(["#4ecdc4", "#ff6b81", "#ffd166", "#a55eea", "#e8d5ff"]), r: 4 });
    }
  }
  function draw(now) {
    if (game.replay) {
      setFlashAlpha(flashAlpha * 0.86);
      updateCamera(now, replayCameraPoints());
      syncMouseWorld();
      clearFrame(currentMap?.def?.bg);
      beginWorld();
      drawReplay(now);
      endWorld();
      ctx.fillStyle = getVignette();
      ctx.fillRect(0, 0, W, H);
      drawReplayOverlay(now);
      drawHUD(now);
      return;
    }
    updateCamera(now, cameraPoints());
    syncMouseWorld();
    clearFrame(currentMap?.def?.bg);
    perfBegin("world");
    beginWorld();
    drawBackdrop(now);
    drawMapBodies(now);
    drawLava(now);
    drawGeysers(now);
    drawGasVents(now);
    drawTomes(now);
    drawSummons(now);
    drawGibs();
    drawProjectiles(now);
    for (const e of activeEffects) drawVfx(e, now, ctx);
    drawFxEffects(now, ctx);
    drawParticles();
    for (const p of players) if (p.alive) drawWizard(p, now);
    drawOffscreenPointers(players.filter((p) => p.alive).map((p) => ({
      x: p.body.position.x,
      y: p.body.position.y,
      vx: p.body.velocity.x,
      vy: p.body.velocity.y,
      color: p.color
    })), now);
    drawGhostWisps(now);
    drawEnvVisualsLive(now);
    drawReticle(now);
    endWorld();
    perfEnd();
    perfBegin("bloom");
    applyBloom(now);
    perfEnd();
    perfBegin("hud");
    ctx.fillStyle = getVignette();
    ctx.fillRect(0, 0, W, H);
    if (flashAlpha > 0.01) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    setFlashAlpha(flashAlpha * 0.86);
    drawHUD(now);
    if (game.state === "LOBBY") drawLobby();
    if (game.state === "VICTORY") drawVictory(now);
    if (game.state === "RUN_OVER") drawRunOver(now);
    perfEnd();
    globalThis.drawNetStats?.(now);
  }
  function drawRunOver(now) {
    ctx.fillStyle = "rgba(10,6,16,0.68)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.font = "bold 54px Georgia";
    ctx.fillStyle = "#ff6b6b";
    ctx.fillText("OVERRUN", W / 2, 210);
    ctx.font = "bold 40px Georgia";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(`REACHED WAVE ${game.runScore || game.wave}`, W / 2, 290);
    ctx.font = "22px Georgia";
    ctx.fillStyle = "#e8d5ff";
    const best = game.bestWave || 0;
    const isBest = (game.runScore || game.wave) >= best && best > 0;
    ctx.fillText(isBest ? "\u2605 NEW BEST \u2605" : `best: wave ${best}`, W / 2, 340);
    ctx.font = "20px Georgia";
    ctx.fillStyle = "#9c8ab8";
    ctx.fillText("press CAST for the lobby", W / 2, 430);
  }

  // src/render/draw-snapshot.js
  function ghostBody(e, ep, alpha) {
    const lerp = (a, b) => a + (b - a) * alpha;
    const x = ep ? lerp(ep.x, e.x) : e.x;
    const y = ep ? lerp(ep.y, e.y) : e.y;
    const angle = ep ? lerp(ep.a, e.a) : e.a;
    let vertices;
    if (e.n && e.r) {
      vertices = [];
      for (let i = 0; i < e.n; i++) {
        const a = angle + i / e.n * Math.PI * 2;
        vertices.push({ x: x + Math.cos(a) * e.r, y: y + Math.sin(a) * e.r });
      }
    } else if (e.r) {
      vertices = [];
      for (let i = 0; i < 10; i++) {
        const a = angle + i * Math.PI / 5;
        vertices.push({ x: x + Math.cos(a) * e.r, y: y + Math.sin(a) * e.r });
      }
    } else if (e.w != null) {
      const c = Math.cos(angle), s = Math.sin(angle), hw = e.w / 2, hh = e.h / 2;
      vertices = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([px, py]) => ({ x: x + px * c - py * s, y: y + px * s + py * c }));
    } else if (e.v) {
      vertices = [];
      for (let i = 0; i < e.v.length; i += 2) {
        vertices.push({
          x: ep && ep.v && ep.v.length === e.v.length ? lerp(ep.v[i], e.v[i]) : e.v[i],
          y: ep && ep.v && ep.v.length === e.v.length ? lerp(ep.v[i + 1], e.v[i + 1]) : e.v[i + 1]
        });
      }
    }
    const fake = {
      position: { x, y },
      angle,
      vertices,
      circleRadius: e.n ? null : e.r,
      label: e.l,
      color: e.c,
      render: { fillStyle: e.c }
    };
    if (e.cd != null) fake.critter = { dir: e.cd };
    if (e.dc) fake.decoyOf = { color: e.dc[0], hat: e.dc[1] };
    if (e.bt) fake.bossType = e.bt;
    if (e.spn) fake.spin = 1;
    return fake;
  }
  function ghostPlayer(gp, gpPrev, alpha, now) {
    const lerp = (a, b) => a + (b - a) * alpha;
    const x = gpPrev ? lerp(gpPrev.x, gp.x) : gp.x;
    const y = gpPrev ? lerp(gpPrev.y, gp.y) : gp.y;
    return {
      name: gp.n,
      color: gp.c,
      hat: gp.h,
      slot: gp.s,
      facing: gp.f,
      walkPhase: gp.wp,
      spellId: gp.sp,
      lastCast: gp.rd ? -1e9 : now,
      pigUntil: gp.pg ? now + 1e3 : 0,
      body: { position: { x, y }, velocity: { x: gp.vx, y: gp.vy ?? 0 } },
      _x: x,
      _y: y,
      _an: gp.an,
      hp: gp.hp,
      alive: gp.al,
      sizeScale: gp.sc,
      frozen: gp.fz,
      floaty: gp.fl,
      invuln: gp.iv,
      reflect: gp.rf,
      hurt: gp.hu,
      roundWins: gp.w
    };
  }
  function drawGhostWizard(g, now) {
    const s = g.sizeScale || 1;
    drawNameTag(g.name, g.color, g._x, g._y - 48 * s);
    if (s > 1.6) {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 18;
    }
    drawWizardFigure(g, g._x, g._y, s, now, g._an);
    ctx.shadowBlur = 0;
    const x = g._x, y = g._y;
    if (g.floaty) {
      ctx.strokeStyle = "#ff6b81";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 26 * s);
      ctx.lineTo(x + 3, y - 44 * s);
      ctx.stroke();
      ctx.fillStyle = "#ff6b81";
      ctx.beginPath();
      ctx.arc(x + 3, y - 52 * s, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    if (g.invuln || g.reflect) {
      ctx.strokeStyle = g.reflect ? "#4ecdff" : "#ffd700";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
      ctx.beginPath();
      ctx.arc(x, y - 8 * s, 24 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (g.hurt) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y - 8 * s, 19 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (g.frozen) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#9be7ff";
      ctx.fillRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#d8f4ff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
    }
  }
  function drawFxLite(fxLite, now) {
    for (const e of fxLite || []) {
      if (e.k === "sing") {
        ctx.fillStyle = "#0a0510";
        ctx.beginPath();
        ctx.arc(e.x, e.y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#a55eea";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
        ctx.beginPath();
        ctx.arc(e.x, e.y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.k === "zone") {
        ctx.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
        ctx.fillStyle = e.c;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.k === "tor") {
        ctx.strokeStyle = e.c ? rgba(e.c, 0.6) : "rgba(207,232,232,0.55)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const yy = H - 80 - i * 90;
          const w = 26 + i * 22;
          ctx.beginPath();
          ctx.ellipse(e.x + Math.sin(now * 0.01 + i) * 8, yy, w, 12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
  function drawSnapshotStatics(now) {
    for (const b of allBodies(currentMap.composite)) {
      if (b.label === "lava") continue;
      if (!b.isStatic || b.spin || b.phantom || b.kinematic) continue;
      if (b.label === "crate") drawCrate(b);
      else if (b.label === "destructible") drawDestructible(b, now || performance.now());
      else if (b.label === "spikes") drawSpikes(b);
      else drawTerrainBody(b, now || performance.now());
    }
  }
  function cameraPointsFromSnapshot(snap, snapPrev, alpha = 1) {
    const pts = [];
    const prevById = /* @__PURE__ */ new Map();
    for (const gp of snapPrev?.ps || []) prevById.set(gp.s, gp);
    for (const gp of snap?.ps || []) {
      if (!gp.al) continue;
      const p = prevById.get(gp.s);
      pts.push({
        x: p ? p.x + (gp.x - p.x) * alpha : gp.x,
        y: p ? p.y + (gp.y - p.y) * alpha : gp.y,
        r: 26 * (gp.sc || 1)
      });
    }
    for (const e of snap?.bodies || []) {
      if (e.l !== "boss") continue;
      const r = e.r || Math.max(e.w || 0, e.h || 0) / 2 || 42;
      pts.push({ x: e.x, y: e.y, r: r + 24 });
    }
    return pts;
  }
  function drawSnapshotWorld(snap, snapPrev, alpha, now, includeLocalFx = false) {
    currentMap.data.lavaY = snap.lv;
    const prevById = {};
    if (snapPrev) for (const e of snapPrev.bodies) prevById[e.id] = e;
    const prevPs = {};
    if (snapPrev) for (const q of snapPrev.ps) prevPs[q.s] = q;
    drawBackdrop(now);
    drawSnapshotStatics(now);
    drawLava(now);
    drawGeysers(now);
    drawGasVents(now);
    for (const [type, x0, y0, x1, y1] of snap.segs || []) {
      if (type === 1) {
        ctx.strokeStyle = "#0d0a14";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const d = Math.hypot(x1 - x0, y1 - y0);
        ctx.fillStyle = "#2c2438";
        for (let t = 12; t < d; t += 26) {
          ctx.beginPath();
          ctx.arc(x0 + (x1 - x0) * t / d, y0 + (y1 - y0) * t / d, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = "#5d4a33";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    for (const e of snap.bodies) {
      if (e.l === "tome") {
        drawTomeAt(e.x, e.y, e.a, SPELLS[e.sp]?.color || "#e8d5ff", now);
        continue;
      }
      if (e.l === "hat") {
        drawHatAt(e.x, e.y, e.a, now);
        continue;
      }
      const fake = ghostBody(e, prevById[e.id], alpha);
      if (e.ph === 0) ctx.globalAlpha = 0.18;
      drawDynamicBody(fake, now);
      ctx.globalAlpha = 1;
    }
    drawFxLite(snap.fxLite, now);
    if (includeLocalFx) {
      for (const eff of activeEffects) drawVfx(eff, now, ctx);
      drawFxEffects(now, ctx);
      for (let i = activeEffects.length - 1; i >= 0; i--) if (simNow() > activeEffects[i].until) activeEffects.splice(i, 1);
      drawParticles();
    }
    const ghosts = snap.ps.map((gp) => ghostPlayer(gp, prevPs[gp.s], alpha, now));
    for (const g of ghosts) if (g.alive) drawGhostWizard(g, now);
    drawOffscreenPointers(ghosts.filter((g) => g.alive).map((g) => ({
      x: g._x,
      y: g._y,
      vx: g.body.velocity.x,
      vy: g.body.velocity.y,
      color: g.color
    })), now);
    for (const gp of snap.ps) {
      if (gp.al || gp.gx == null) continue;
      const prev = prevPs[gp.s];
      const wx = prev && prev.gx != null ? prev.gx + (gp.gx - prev.gx) * alpha : gp.gx;
      const wy = prev && prev.gy != null ? prev.gy + (gp.gy - prev.gy) * alpha : gp.gy;
      drawWisp(gp.n, gp.c, wx, wy, now);
    }
    if (snap.ev) drawEnvVisuals(snap.ev, now, envLightsFromSnap(snap, ghosts));
    return ghosts;
  }

  // src/net/client.js
  var ws = null;
  var mySlot = null;
  var joined = false;
  var joinDeniedMsg = null;
  var serverWorld = null;
  var packChunks = null;
  var packInstalled = false;
  var hooks = { status() {
  }, welcome() {
  } };
  function netMode2() {
    return netMode;
  }
  var netStats = { on: false, lastBytes: 0, bytes: 0, snaps: 0, at: 0, rate: 0, kbs: 0, delay: 0 };
  if (typeof location !== "undefined" && location.protocol.startsWith("http")) {
    addEventListener("keydown", (e) => {
      if (e.code === "F8") netStats.on = !netStats.on;
    });
  }
  function statTick(bytes, now) {
    netStats.lastBytes = bytes;
    netStats.bytes += bytes;
    netStats.snaps++;
    if (now - netStats.at > 1e3) {
      netStats.rate = netStats.snaps;
      netStats.kbs = Math.round(netStats.bytes / 1024);
      netStats.snaps = 0;
      netStats.bytes = 0;
      netStats.at = now;
    }
  }
  globalThis.drawNetStats = function drawNetStats2(now) {
    if (!netStats.on) return;
    const line = `NET \xB7 snap ${netStats.lastBytes}B \xB7 ${netStats.rate}/s \xB7 ${netStats.kbs}KB/s in \xB7 tick ${Math.round(snapPeriodMs)}ms \xB7 jitter ${Math.round(snapJitterMs)}ms \xB7 lag ${Math.round(netStats.delay)}ms \xB7 held ${interpHeld}`;
    ctx.save();
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.font = "12px Menlo, monospace";
    ctx.textAlign = "left";
    const w = ctx.measureText(line).width + 16;
    ctx.fillStyle = "rgba(10,6,16,0.75)";
    ctx.fillRect(8, H - 34, w, 22);
    ctx.fillStyle = "#9ef0f0";
    ctx.fillText(line, 16, H - 19);
    ctx.restore();
  };
  function emit2(msg) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(msg));
  }
  function myName() {
    return cleanName(localStorage.getItem("hs-name-0") || "") || "WIZARD";
  }
  function connect(h) {
    hooks = h || hooks;
    hooks.status("connecting\u2026");
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => emit2({ t: "hello", v: GAME_VERSION, name: myName(), np: canDecryptLocally() ? 0 : 1 });
    ws.onerror = () => hooks.status("connection failed \u2014 is the server running?");
    ws.onclose = () => {
      if (netMode === "online") setBanner("CONNECTION LOST \u2014 refresh", "#ff6b81", 6e4);
    };
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.t === "snap") statTick(ev.data.length, performance.now());
      handleMessage(msg);
    };
  }
  function handleMessage(msg) {
    switch (msg.t) {
      case "welcome":
        if (msg.v !== GAME_VERSION) {
          hooks.status("GAME UPDATED \u2014 hard-refresh this page (\u2318\u21E7R) and try again");
          ws.close();
          return;
        }
        setNetMode("online");
        hooks.welcome();
        emit2({ t: "join", name: myName() });
        break;
      case "badVersion":
        setBanner("GAME UPDATED \u2014 REFRESH THE PAGE", "#ff6b81", 6e4);
        break;
      case "you":
        mySlot = msg.slot;
        joined = true;
        joinDeniedMsg = null;
        break;
      case "world":
        serverWorld = msg;
        break;
      case "joinDenied":
        joinDeniedMsg = msg.reason === "full" ? "match is full (8 wizards) \u2014 spectating" : "join refused \u2014 spectating";
        break;
      case "snap":
        pushSnapshot(msg);
        break;
      case "fx":
        applyFx(msg);
        break;
      case "pack":
        receivePackChunk(msg);
        break;
    }
  }
  var canDecryptLocally = () => !!(globalThis.crypto && globalThis.crypto.subtle);
  function receivePackChunk(msg) {
    if (packInstalled) return;
    if (typeof msg.s !== "string" || !(msg.n > 0) || !(msg.i >= 0 && msg.i < msg.n)) return;
    if (!packChunks || packChunks.length !== msg.n) packChunks = new Array(msg.n).fill(null);
    packChunks[msg.i] = msg.s;
    if (packChunks.every((c) => c !== null)) {
      const src = packChunks.join("");
      packChunks = null;
      installPack(src);
    }
  }
  function installPack(src) {
    if (packInstalled || typeof src !== "string") return;
    packInstalled = true;
    try {
      new Function(src)();
    } catch (e) {
      packInstalled = false;
      console.warn("Optional content could not be installed.", e);
    }
  }
  var snapCur = null;
  var clientMap = null;
  var snapBuf = [];
  var SNAP_BUF_MAX = 16;
  var playT = 0;
  var playInit = false;
  var playRate = 1;
  var snapPeriodMs = 33.3;
  var snapJitterMs = 0;
  var lastNetNow = 0;
  var interpHeld = 0;
  function pushSnapshot(snap, arrivedAt) {
    const at = arrivedAt ?? performance.now();
    const sv = typeof snap.sv === "number" ? snap.sv : at;
    const prev = snapBuf[snapBuf.length - 1];
    const cut = prev && (snap.rn !== prev.s.rn || snap.mi !== prev.s.mi || sv < prev.sv);
    if (cut) {
      snapBuf.length = 0;
      playInit = false;
    }
    if (prev && !cut) {
      const svGap = sv - prev.sv;
      if (svGap > 0 && svGap < 400) snapPeriodMs += (svGap - snapPeriodMs) * 0.1;
      snapJitterMs += (Math.min(Math.abs(at - prev.at - svGap), 200) - snapJitterMs) * 0.1;
    }
    snapBuf.push({ s: snap, sv, at });
    while (snapBuf.length > SNAP_BUF_MAX) snapBuf.shift();
    snapCur = snap;
    if (!clientMap || clientMap.index !== snap.mi || snap.msd != null && clientMap.data.seed !== snap.msd) clientLoadMap(snap.mi, snap.msd);
    applyBrokenDestructibles(snap.bd);
  }
  function interpDelay() {
    return Math.min(240, Math.max(45, snapPeriodMs * 1.5 + snapJitterMs * 2));
  }
  function advancePlayout(now) {
    const dt = lastNetNow ? Math.min(now - lastNetNow, 100) : 16.7;
    lastNetNow = now;
    if (snapBuf.length < 2) return null;
    const newest = snapBuf[snapBuf.length - 1];
    const target = newest.sv - interpDelay();
    if (!playInit) {
      playT = target;
      playInit = true;
      playRate = 1;
    } else {
      playT += dt * playRate;
      const err = target - playT;
      if (Math.abs(err) > 400) {
        playT = target;
        playRate = 1;
      } else playRate = 1 + Math.max(-0.1, Math.min(0.1, err * 25e-4));
    }
    const oldest = snapBuf[0];
    if (playT < oldest.sv) playT = oldest.sv;
    if (playT > newest.sv) {
      playT = newest.sv;
      interpHeld++;
    }
    for (let i = snapBuf.length - 1; i > 0; i--) {
      const a2 = snapBuf[i - 1], b2 = snapBuf[i];
      if (playT >= a2.sv && playT <= b2.sv) {
        const span = Math.max(b2.sv - a2.sv, 1);
        return { a: a2, b: b2, alpha: Math.max(0, Math.min(1, (playT - a2.sv) / span)) };
      }
    }
    const a = snapBuf[snapBuf.length - 2], b = newest;
    return { a, b, alpha: 1 };
  }
  function applyBrokenDestructibles(bd) {
    if (!bd || !clientMap) return;
    const applied = clientMap.data._bdApplied || 0;
    if (bd.length <= applied) return;
    const dests = allBodies(clientMap.composite).filter((b) => b.label === "destructible");
    for (let i = applied; i < bd.length; i++) {
      const [bx, by] = bd[i];
      let best = null, bdst = 3600;
      for (const d of dests) {
        const dd = (d.position.x - bx) ** 2 + (d.position.y - by) ** 2;
        if (dd < bdst) {
          bdst = dd;
          best = d;
        }
      }
      if (best) {
        spawnParticles2(best.position.x, best.position.y, best.dcolor || "#6b4a2a", 14, 6, 40);
        removeFrom(clientMap.composite, best);
      }
    }
    clientMap.data._bdApplied = bd.length;
  }
  function clientLoadMap(index, seed) {
    const def = MAPS[index];
    const m = { def, composite: createComposite(), data: {} };
    def.build(m);
    if (seed != null) {
      m.data.seed = seed;
      buildMapExtras(m, seed);
    }
    for (const b of [...allBodies(m.composite)]) {
      if (!b.isStatic || b.spin || b.phantom || b.kinematic || b.label === "lava") removeFrom(m.composite, b);
    }
    for (const c of [...allJoints(m.composite)]) removeFrom(m.composite, c);
    if (def.stars) {
      m.data.starfield = Array.from({ length: 70 }, () => ({ x: fxRange2(0, W), y: fxRange2(0, H - 160), r: fxRange2(0.5, 1.8), tw: fxRange2(0, 6.28) }));
    }
    m.index = index;
    clientMap = m;
    setCurrentMap(m);
    particles.length = 0;
    activeEffects.length = 0;
  }
  var LOCAL_FX = { __proto__: null, setBanner, addKillFeed, slowMo };
  function applyFx(msg) {
    if (msg.f !== "sfx" && !WIRE_FX.has(msg.f)) return;
    const local = LOCAL_FX[msg.f];
    if (local) {
      local(...msg.a);
      return;
    }
    applyEmitted([msg]);
  }
  function sendInput(now) {
    const jump = !!keys["KeyW"] || !!keys["Space"] || !!keys["ArrowUp"];
    const cast = !!keys["KeyE"] || !!keys["Enter"] || mouse.down;
    const cast2 = !!keys["KeyQ"] || !!keys["ShiftRight"] || mouse.rdown;
    const block = !!keys["KeyS"] || !!keys["ArrowDown"] || mouse.mdown;
    const move = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
    let aim = null;
    if (mouse.present && snapCur && mySlot != null) {
      const me = snapCur.ps.find((q) => q.s === mySlot);
      if (me) aim = Math.atan2(mouse.y - me.y, mouse.x - me.x);
    }
    if (!joined && (cast || mouse.down)) emit2({ t: "join", name: myName() });
    if (joined) emit2({ t: "input", m: move, j: jump ? 1 : 0, c: cast ? 1 : 0, c2: cast2 ? 1 : 0, b: block ? 1 : 0, a: aim });
    const edge = (code, fn) => {
      if (keys[code] && !this[`_${code}`]) fn();
      this[`_${code}`] = !!keys[code];
    };
    edge("Space", () => emit2({ t: "start" }));
    edge("KeyB", () => emit2({ t: "bot", op: "add" }));
    edge("KeyM", () => emit2({ t: "mode" }));
    edge("KeyR", () => emit2({ t: "reset" }));
    for (let d = 1; d <= 9; d++) edge(`Digit${d}`, () => emit2({ t: "wins", n: d }));
    edge("Equal", () => emit2({ t: "wins", d: 1 }));
    edge("Minus", () => emit2({ t: "wins", d: -1 }));
  }
  function drawOnlineLobby(snap, now) {
    const mode = snap.md || "versus";
    const wave = mode === "wave";
    const count = Math.max(4, Math.min(MAX_PLAYERS, snap.ps.length + 1));
    const slots = [];
    for (let i = 0; i < count; i++) {
      const gp = snap.ps[i];
      slots.push({
        label: gp ? gp.n + (gp.s === mySlot ? " \u2726" : "") : "JOIN",
        color: gp ? gp.c : "#4a3f5e",
        hint: !gp ? "OPEN SEAT" : gp.b ? "BOT" : gp.off ? "(connection lost)" : gp.s === mySlot ? "YOU \u2014 WASD + MOUSE" : "ONLINE"
      });
    }
    const min = wave ? 1 : 2;
    const ready = snap.ps.length >= min;
    drawLobbyPanel({
      joinLine: joinDeniedMsg || (joined ? `you are in as P${(mySlot ?? 0) + 1} \u2014 WASD move \xB7 SPACE/W jump \xB7 aim & fire with the mouse` : "CLICK or press E to join"),
      slots,
      readyColor: ready ? wave ? "#ffd166" : "#7bd88f" : "#675a7d",
      readyLine: !ready ? wave ? "NEED AT LEAST 1 WIZARD" : "NEED AT LEAST 2 WIZARDS" : wave ? `SPACE \u2014 WAVE SURVIVAL${snap.bw ? `  (BEST: WAVE ${snap.bw})` : ""}` : `SPACE TO FIGHT \u2014 FIRST TO ${snap.wn} WINS`,
      controlsLine: wave ? "M switches back to VERSUS \xB7 co-op: everyone fights the waves together \xB7 B adds a bot" : `M = WAVE SURVIVAL \xB7 1\u20139 sets win target (${snap.wn}) \xB7 B adds a bot \xB7 R resets`
    });
  }
  var fxLoop = createTickLoop({ step: () => {
    updatePace();
    pumpEmitted();
    updateParticles(1);
    advanceTick();
  } });
  var lastFxAt = null;
  function netClientFrame(now) {
    sendInput.call(sendInput, now);
    if (lastFxAt === null || now - lastFxAt > 250) lastFxAt = now;
    fxLoop.pump(now - lastFxAt);
    lastFxAt = now;
    endWorld();
    if (!snapCur || !clientMap) {
      ctx.fillStyle = "#16121c";
      ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.fillStyle = "#9c8ab8";
      ctx.font = "22px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("connecting to the match\u2026", W / 2, H / 2);
      return;
    }
    const snap = snapCur;
    if (snap.v !== GAME_VERSION) {
      ctx.fillStyle = "#16121c";
      ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.fillStyle = "#ff6b81";
      ctx.font = "bold 34px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("GAME UPDATED \u2014 REFRESH THE PAGE", W / 2, H / 2);
      return;
    }
    const rp = advancePlayout(now);
    netStats.delay = interpDelay();
    const [wa, wb, walpha] = rp ? [rp.a.s, rp.b.s, rp.alpha] : [null, snap, 1];
    updateCamera(now, cameraPointsFromSnapshot(wb, wa, walpha));
    clearFrame(clientMap?.def?.bg);
    perfBegin("world");
    beginWorld();
    const ghosts = drawSnapshotWorld(wb, wa, walpha, now, true);
    if (mouse.present) {
      const mine = ghosts.find((g) => g.slot === mySlot);
      ctx.strokeStyle = mine ? mine.color : "#9c8ab8";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    endWorld();
    perfEnd();
    perfBegin("bloom");
    applyBloom(now);
    perfEnd();
    ctx.fillStyle = getVignette();
    ctx.fillRect(0, 0, W, H);
    if (flashAlpha > 0.01) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = flashColor;
      ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.globalAlpha = 1;
    }
    setFlashAlpha(flashAlpha * 0.86);
    if (snap.rp) drawReplayOverlay(now);
    ctx.textAlign = "center";
    ctx.font = "12px Georgia";
    ctx.fillStyle = "#675a7d";
    ctx.fillText(`${clientMap.def.name} \xB7 ${snap.mi + 1}/${MAPS.length}`, W / 2, 18);
    if (snap.ev) {
      const evDef = envEventById(snap.ev);
      if (evDef) {
        ctx.font = "bold 11px Georgia";
        ctx.fillStyle = evDef.color;
        ctx.fillText(`\u26A0 ${evDef.name}`, W / 2, H - 12);
        ctx.font = "12px Georgia";
      }
    }
    if (snap.bs) drawBossBar(snap.bs.n, snap.bs.c, snap.bs.hp, snap.bs.mhp);
    drawKillFeed(simNow());
    const spacing = Math.min(300, (W - 220) / Math.max(snap.ps.length - 1, 1));
    snap.ps.forEach((gp, i) => {
      const x = snap.ps.length === 1 ? 150 : W / 2 + (i - (snap.ps.length - 1) / 2) * spacing;
      ctx.font = "bold 20px Georgia";
      ctx.fillStyle = gp.c;
      ctx.fillText(gp.n + (gp.s === mySlot ? " \u25C2you" : "") + (gp.off ? " \u2301" : ""), x, 38);
      ctx.strokeStyle = gp.c;
      if (snap.wn <= 9) {
        const pipStart = x - (snap.wn - 1) * 9;
        for (let w = 0; w < snap.wn; w++) {
          ctx.beginPath();
          ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
          if (w < gp.w) ctx.fill();
          else {
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      } else {
        ctx.font = "bold 15px Georgia";
        ctx.fillText(`${gp.w} / ${snap.wn}`, x, 58);
      }
      drawPlayerSpells(x, [gp.s0 ?? null, gp.s1 ?? null], [gp.c0 || 0, gp.c1 || 0], gp.mc || 0, [gp.h0 ?? null, gp.h1 ?? null]);
    });
    if (simNow() < bannerUntil) {
      if (bannerHyper) {
        const pulse = 1 + 0.12 * Math.sin(now * 0.03);
        ctx.save();
        ctx.translate(W / 2, 160);
        ctx.scale(pulse, pulse);
        ctx.font = "bold 78px Georgia";
        ctx.shadowColor = "#a55eea";
        ctx.shadowBlur = 34;
        ctx.fillStyle = `hsl(${now * 0.4 % 360}, 90%, 78%)`;
        ctx.fillText(banner, 0, 0);
        ctx.restore();
        ctx.shadowBlur = 0;
      } else {
        ctx.font = "bold 52px Georgia";
        ctx.fillStyle = bannerColor;
        ctx.fillText(banner, W / 2, 150);
      }
    }
    if (snap.st === "LOBBY") drawOnlineLobby(snap, now);
    if (snap.st === "VICTORY" && snap.wr != null) {
      const gw = snap.ps.find((q) => q.s === snap.wr);
      if (gw) {
        ctx.fillStyle = "rgba(10,6,16,0.6)";
        ctx.fillRect(0, 0, W, H);
        const g = ghostPlayer(gw, null, 1, now);
        g._x = W / 2;
        g._y = 400;
        g.body.position = { x: W / 2, y: 400 };
        drawWizardFigure(g, W / 2, 400, 4.5, now);
        ctx.font = "bold 58px Georgia";
        ctx.fillStyle = gw.c;
        ctx.textAlign = "center";
        ctx.fillText(`${gw.n} WINS THE MATCH`, W / 2, 180);
        drawAwards(snap.aw, now);
        drawSpellReport(snap.sr, now);
        if (Math.random() < 0.6) {
          particles.push({ kind: "confetti", x: fxRange2(0, W), y: -10, vx: fxRange2(-1, 1), vy: fxRange2(1, 3), life: 120, maxLife: 120, color: fxPick(["#4ecdc4", "#ff6b81", "#ffd166", "#a55eea", "#e8d5ff"]), r: 4 });
        }
      }
    }
    drawNetStats(now);
  }

  // src/platform/menu.js
  function btnCss(color) {
    return `min-width:420px;padding:14px 26px;font-family:Georgia,serif;font-size:18px;cursor:pointer;background:transparent;border:2px solid ${color};color:${color};border-radius:8px;`;
  }
  function mountMenu() {
    if (typeof location === "undefined" || !location.protocol.startsWith("http")) return;
    if (typeof document === "undefined" || typeof document.createElement !== "function") return;
    const menu = document.createElement("div");
    menu.id = "netmenu";
    menu.style.cssText = "position:fixed;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(13,10,20,0.92);z-index:10;font-family:Georgia,serif;";
    const logoLetters = [..."HYPERSPELL"].map((ch, i) => `<span style="animation-delay:${(i * 0.13).toFixed(2)}s">${ch}</span>`).join("");
    menu.innerHTML = `
    <style>
      #hslogo { display:flex; font: italic 900 64px Georgia, serif; letter-spacing:.05em;
        filter: drop-shadow(0 0 18px rgba(165,94,234,.8)); animation: hsglow 2.4s ease-in-out infinite; }
      #hslogo span {
        background: linear-gradient(180deg, #bfe8ff 0%, #e8d5ff 44%, #5d3a8f 50%, #ff6b81 56%, #ffd166 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: hsfloat 2.6s ease-in-out infinite;
      }
      @keyframes hsfloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
      @keyframes hsglow {
        0%,100% { filter: drop-shadow(0 0 12px rgba(165,94,234,.55)) }
        50% { filter: drop-shadow(0 0 26px rgba(165,94,234,.95)) }
      }
      #hstag { color:#9ef0f0; font-size:15px; letter-spacing:.3em; margin-bottom:12px;
        text-shadow: 0 0 10px rgba(158,240,240,.8); animation: hsflicker 3.7s linear infinite; }
      @keyframes hsflicker {
        0%,7%,9%,53%,56%,100% { opacity: 1 } 8%, 54.5% { opacity: .35 }
      }
    </style>
    <div id="hslogo">${logoLetters}</div>
    <div id="hstag">WIZARDS \xB7 PHYSICS \xB7 VIOLENCE</div>
    <input id="netname" maxlength="12" placeholder="YOUR WIZARD NAME" autocomplete="off"
      style="min-width:380px;padding:12px 20px;font-family:Georgia,serif;font-size:17px;text-align:center;background:transparent;border:2px solid #675a7d;color:#e8d5ff;border-radius:8px;text-transform:uppercase;outline:none;">
    <button data-mode="couch" style="${btnCss("#4ecdc4")}">COUCH \u2014 everyone on this computer</button>
    <button data-mode="online" style="${btnCss("#ffd166")}">PLAY ONLINE \u2014 join the match on this server</button>
    <div id="netstatus" style="color:#675a7d;font-size:13px;margin-top:10px"></div>`;
    document.body.appendChild(menu);
    const statusEl = () => document.getElementById("netstatus");
    const nameInput = menu.querySelector("#netname");
    nameInput.value = localStorage.getItem("hs-name-0") || "";
    for (const ev of ["keydown", "keyup"]) nameInput.addEventListener(ev, (e) => e.stopPropagation());
    menu.addEventListener("click", (e) => {
      const mode = e.target?.dataset?.mode;
      if (!mode) return;
      const typed = cleanName(nameInput.value);
      if (typed) localStorage.setItem("hs-name-0", typed);
      globalThis.nameSetViaMenu = true;
      ensureAudio();
      if (mode === "couch") {
        menu.remove();
        return;
      }
      connect({
        status(text) {
          const el = statusEl();
          if (el) el.textContent = text;
        },
        welcome() {
          menu.remove();
        }
      });
    });
  }

  // src/sim/tick.js
  var tick_exports = {};
  __export(tick_exports, {
    postPhysics: () => postPhysics,
    stepSim: () => stepSim,
    wrapBody: () => wrapBody
  });

  // src/sim/player/ghost.js
  var ghost_exports = {};
  __export(ghost_exports, {
    GHOST_CARRY: () => GHOST_CARRY,
    ghostGust: () => ghostGust,
    ghostMark: () => ghostMark,
    ghostWail: () => ghostWail,
    updateGhosts: () => updateGhosts
  });
  var GHOST_CARRY = /* @__PURE__ */ new Set(["crate", "barrel", "ball", "plank"]);
  function updateGhosts(now) {
    if (game.state !== "PLAY") return;
    for (const p of players) {
      if (p.alive || !p.ghost) continue;
      const c = p.input, g = p.ghost;
      g.x = Math.max(20, Math.min(W - 20, g.x + (c.move || 0) * 3.2));
      g.y = Math.max(30, Math.min(H - 40, g.y + (c.jump ? -2.6 : 1)));
      if (g.hold) {
        const held = g.hold;
        const gone = !bodyById(held.id);
        const far = !gone && Math.hypot(held.position.x - g.x, held.position.y - g.y - 26) > 140;
        if (!c.cast || gone || far) {
          if (!gone) setVelocity(held, { x: (c.move || 0) * 5, y: -2 });
          g.hold = null;
        } else {
          setVelocity(held, {
            x: Math.max(-6, Math.min(6, (g.x - held.position.x) * 0.18)),
            y: Math.max(-6, Math.min(6, (g.y + 26 - held.position.y) * 0.18))
          });
          setAngularVelocity(held, held.angularVelocity * 0.9);
          if (simRandom() < 0.2) spawnParticle({ kind: "spark", x: held.position.x + rand(-8, 8), y: held.position.y + rand(-8, 8), vx: 0, vy: -0.6, life: 14, maxLife: 14, color: "#e8d5ff", r: 1.5 });
        }
      } else if (c.cast) {
        let best = null, bd = 1e9;
        for (const b of queryRadius(g, 70, { filter: (b2) => loose(b2) && GHOST_CARRY.has(b2.label) && b2.mass <= 8 })) {
          const d = Math.hypot(b.position.x - g.x, b.position.y - g.y);
          if (d < bd) {
            bd = d;
            best = b;
          }
        }
        if (best) {
          g.hold = best;
          spawnRing(g.x, g.y, "#e8d5ff");
        } else if (now > g.nextGust) {
          g.nextGust = now + 2800;
          ghostGust(g);
        }
      }
      if (c.cast2Pressed && now > (g.nextMark || 0)) {
        g.nextMark = now + 6e3;
        ghostMark(p, g, now);
      }
      if (c.blockPressed && now > (g.nextWail || 0)) {
        g.nextWail = now + 5e3;
        ghostWail(p, g, now);
      }
      for (const q of players) {
        if (!q.alive) continue;
        if (Math.hypot(q.body.position.x - g.x, q.body.position.y - g.y) > 30) continue;
        if (now < (q.ghostChillUntil || 0)) continue;
        q.ghostChillUntil = now + 1600;
        q.vineSlowUntil = Math.max(q.vineSlowUntil || 0, now + 550);
        spawnParticles(q.body.position.x, q.body.position.y - 20, "#bfe8ff", 6, 2, 24);
        sfx.freeze?.();
      }
    }
  }
  function ghostMark(p, g, now) {
    const mx = g.x, my = g.y;
    sfx.cast();
    spawnRing(mx, my, p.color);
    activeEffects.push({
      until: now + 4e3,
      net: { k: "zone", x: mx, y: my, r: 30, c: p.color },
      // LAN clients see the pulse
      // locally it is the artkit rune ring rather than the wire's plain disc —
      // src/render/effects.js owns the primitive, the sim just names the look
      vfx: { k: "rune", x: mx, y: my, r: 24, c: p.color }
    });
  }
  function ghostWail(p, g, now) {
    sfx.blackhole?.();
    spawnRing(g.x, g.y, "#e8d5ff");
    spawnBurst(g.x, g.y, "#e8d5ff", 14, { speed: 3.5, g: -0.04, life: 40, r: 2.5 });
    for (const q of players) {
      if (!q.alive) continue;
      if (Math.hypot(q.body.position.x - g.x, q.body.position.y - g.y) > 170) continue;
      q.vineSlowUntil = Math.max(q.vineSlowUntil || 0, now + 450);
      q.spookedUntil = now + 900;
      spawnParticles(q.body.position.x, q.body.position.y - 24, "#e8d5ff", 5, 2, 20);
    }
  }
  function ghostGust(g) {
    spawnRing(g.x, g.y, "rgba(232,213,255,0.6)");
    sfx.cast();
    for (const b of queryRadius(g, 110, { filter: (b2) => loose(b2) && b2.label !== "boss" })) {
      const dx = b.position.x - g.x, dy = b.position.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      const s = (1 - d / 110) * 4.5;
      setVelocity(b, { x: b.velocity.x + dx / d * s, y: b.velocity.y + dy / d * s - 1.2 * (1 - d / 110) });
    }
  }

  // src/sim/collision.js
  var ANY = "*";
  var registered = [];
  var resolved = /* @__PURE__ */ new Map();
  function rule(labelA, labelB, fn) {
    registered.push({ labelA, labelB, fn });
    resolved.clear();
  }
  function rulesFor(a, b) {
    const key = `${a}|${b}`;
    let list = resolved.get(key);
    if (!list) {
      list = Object.freeze(registered.filter((r) => (r.labelA === ANY || r.labelA === a) && (r.labelB === ANY || r.labelB === b)).map((r) => r.fn));
      resolved.set(key, list);
    }
    return list;
  }
  function applyRules(a, b) {
    const fns = rulesFor(a.label, b.label);
    for (let i = 0; i < fns.length; i++) fns[i](a, b);
  }
  function dispatchContact(bodyA, bodyB) {
    applyRules(bodyA, bodyB);
    applyRules(bodyB, bodyA);
  }
  rule("projectile", ANY, function projectileHit(a, b) {
    if (b.label === "lava" || !projectiles.has(a)) return;
    if (b.label === "vine") killVine(b);
    if (b.label === "boss" && a.owner) damageBoss(22, a.position, a.owner);
    if (b.label === "enemy" && a.owner && a.owner !== "boss") damageEnemy(b.enemy, 22, a.position, a.owner);
    if (b.label === "decoy") {
      spawnParticles(b.position.x, b.position.y, "#e8d5ff", 16, 5);
      removeSummon(b);
    }
    if (b.label === "destructible") damageDestructible(b, 12);
    if (b.label === "player" && simNow() < (b.player.reflectUntil || 0)) {
      setVelocity(a, { x: -a.velocity.x * 1.1, y: -Math.abs(a.velocity.y) * 0.5 - 2 });
      setFilter(a, { group: b.player.group });
      a.owner = b.player;
      spawnParticles(a.position.x, a.position.y, "#4ecdff", 8, 4);
    } else if (!a.noContactBoom) {
      if (!a.keepOnHit) projectiles.delete(a);
      a.onHit?.(a, b);
      if (!a.keepOnHit) removeBody(a);
    }
  });
  rule(ANY, "player", function contactDamage(a, b) {
    if (!a.contactDamage || b.player === a.owner) return;
    const relSpeed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
    if (relSpeed > 3 && pairCooldown.readySelf(a, 400, "contact-damage")) {
      damagePlayer(b.player, a.contactDamage * Math.min(1, relSpeed / 10), a.owner);
    }
  });
  rule(ANY, "player", function contactExplode(a, b) {
    if (!a.contactExplode || b.player === a.owner) return;
    const ce = a.contactExplode;
    const pos = { ...a.position };
    removeSummon(a);
    projectiles.delete(a);
    explode(pos.x, pos.y, ce.radius, ce.power, ce.dmg, a.owner);
  });
  rule("banana", "player", function bananaSlip(a, b) {
    const now = simNow();
    if (!summons.has(a) || now <= (a.armAt || 0)) return;
    const q = b.player;
    statFor(q).slips++;
    q.slipUntil = now + 1e3;
    setAngularVelocity(q.body, pick([-1, 1]) * 0.8);
    setVelocity(q.body, { x: q.body.velocity.x * 1.5, y: q.body.velocity.y - 4 });
    spawnText(q.body.position.x, q.body.position.y - 40, "SLIP!", "#ffe135");
    removeSummon(a);
    sfx.squeak();
  });
  rule("player", "player", function stomp(a, b) {
    const big = a.player, small = b.player;
    if ((big.sizeScale || 1) >= 1.6 && (big.sizeScale || 1) > (small.sizeScale || 1) + 0.3 && big.body.position.y < small.body.position.y - 6 && big.body.velocity.y > 2 && small.alive && pairCooldown.readySelf(small.body, 600, "stomp")) {
      damagePlayer(small, 12 + Math.round(((big.sizeScale || 1) - 1) * 22), big);
      setVelocity(small.body, { x: small.body.velocity.x, y: 7 });
      setVelocity(big.body, { x: big.body.velocity.x, y: -9 });
      addShake(6);
      sfx.thud?.();
      spawnParticles(small.body.position.x, small.body.position.y - 10, "#a7e88f", 14, 6);
      spawnText(small.body.position.x, small.body.position.y - 44, "STOMP!", "#a7e88f");
    }
  });
  rule("tramp", "player", function trampoline(a, b) {
    setVelocity(b, { x: b.velocity.x, y: -20 });
    b.player.airJumps = 1;
    spawnParticles(b.position.x, b.position.y + 14, "#ff8fc7", 10, 5);
    addShake(3);
    sfx.boing?.();
  });
  rule("tome", "player", function tomePickup(a, b) {
    pickupTome(a, b.player);
  });
  rule("hat", "player", function hatPickup(a, b) {
    pickupHat(a, b.player);
  });
  rule("icicle", "player", function icicleFall(a, b) {
    if (a.isStatic || a.dmgDone) return;
    a.dmgDone = true;
    damagePlayer(b.player, 60);
    addShake(6);
  });
  rule("spikes", "player", function spikes(a, b) {
    const q = b.player;
    if (pairCooldown.readySelf(q.body, 600, "spikes")) {
      damagePlayer(q, 20);
      setVelocity(q.body, { x: q.body.velocity.x, y: -9 });
    }
  });
  rule(ANY, "lava", function lava(a, b) {
    if (a.label === "player") killPlayer(a.player);
    else if (a.label === "boss") {
      if (!a.isStatic) setVelocity(a, { x: a.velocity.x, y: -14 });
    } else if (!a.isStatic) {
      spawnParticles(a.position.x, a.position.y, currentMap.data.acid ? "#9be15d" : "#ff5e57", 8, 4);
      projectiles.delete(a);
      tomes.delete(a);
      hats.delete(a);
      gibs.delete(a);
      summons.delete(a);
      removeBody(a, true);
    }
  });
  onWorldReset(() => {
    onContact((pairs2) => {
      for (const { bodyA, bodyB } of pairs2) dispatchContact(bodyA, bodyB);
    });
  });

  // src/sim/tick.js
  function wrapBody(b) {
    if (b.position.x < -20) setPosition(b, { x: W + 15, y: b.position.y });
    if (b.position.x > W + 20) setPosition(b, { x: -15, y: b.position.y });
  }
  function postPhysics(now) {
    const wrap = currentMap.def.wrap;
    for (const fb of [...projectiles]) {
      fb.update?.(fb, now);
      if (simRandom() < 0.7) {
        spawnParticle({ kind: "square", x: fb.position.x, y: fb.position.y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 14, maxLife: 14, color: fb.color || "#ffb347", r: 2.5 });
      }
      if (fb.expireAt && now > fb.expireAt) {
        projectiles.delete(fb);
        fb.onHit?.(fb, null);
        removeBody(fb);
        continue;
      }
      if (wrap) wrapBody(fb);
      const { x, y } = fb.position;
      if (y > H + 100 || !wrap && (x < -100 || x > W + 100)) removeProjectile(fb);
    }
    for (const b of [...summons]) {
      if (b.label !== "boss" && (now > b.dieAt || b.position.y > H + 140)) {
        removeSummon(b);
        continue;
      }
      if (wrap) wrapBody(b);
      if (b.critter && now > b.critter.hopAt && Math.abs(b.velocity.y) < 1) {
        b.critter.hopAt = now + rand(400, 800);
        if (b.position.x < 70) b.critter.dir = 1;
        if (b.position.x > W - 70) b.critter.dir = -1;
        setVelocity(b, { x: b.critter.dir * rand(2, b.critter.speed), y: -b.critter.hop });
      }
      if (b.label === "saw") {
        if (b.position.x < 40) b.sawDir = 1;
        if (b.position.x > W - 40) b.sawDir = -1;
        setVelocity(b, { x: (b.sawDir || 1) * 9, y: b.velocity.y });
        setAngularVelocity(b, (b.sawDir || 1) * 0.9);
      }
      if (b.label === "mine" && b.mineBlast) {
        if (!b.armAt) b.armAt = now + 1e3;
        else if (now > b.armAt) {
          for (const q of players) {
            if (!q.alive) continue;
            if (q === b.owner && now < b.armAt + 2500) continue;
            if (Math.hypot(q.body.position.x - b.position.x, q.body.position.y - b.position.y) < 50) {
              const mb = b.mineBlast;
              const pos = { ...b.position };
              removeSummon(b);
              explode(pos.x, pos.y, mb.radius, mb.power, mb.dmg, b.owner);
              break;
            }
          }
        }
      }
    }
    for (const gib of [...gibs]) {
      if (now > gib.dieAt || gib.position.y > H + 100) {
        gibs.delete(gib);
        removeBody(gib);
      }
    }
  }
  function stepSim() {
    drainScheduled(currentTick());
    updatePace();
    const now = simNow();
    const dt = TICK_MS;
    for (const p of players) p.input = p.controller.poll();
    if (game.state === "LOBBY" && players.length >= minPlayers() && !nameEdit && now > nameEditEndAt + 350 && players.some((p) => p.input.startPressed)) beginFromLobby();
    if ((game.state === "VICTORY" || game.state === "RUN_OVER") && players.some((p) => p.input.castPressed)) resetMatch();
    if (game.state === "PLAY" && !game.fightShown && now > game.fightAt) {
      game.fightShown = true;
      setBanner("FIGHT!", "#7bd88f", 700);
      sfx.fight();
    }
    updatePlayers(now);
    updateGhosts(now);
    if (game.state === "PLAY" || game.state === "LOBBY") updateTomes(now);
    updateEffects(now);
    currentMap.def.update?.(currentMap, now, dt);
    updateEnvEvent(now);
    updateBoss(now);
    updateEnemies(now);
    updateWaveMode(now);
    for (const b of allBodies(currentMap.composite)) {
      if (b.spin) setAngle(b, b.angle + b.spin * (dt / 16.7));
      if (b.phantom) {
        const solid = Math.sin(now * b.phantom.speed + b.phantom.offset) > -0.2;
        if (solid !== b.phantomSolid) {
          b.phantomSolid = solid;
          setFilter(b, { mask: solid ? 4294967295 : 0 });
        }
      }
    }
    for (const fb of projectiles) {
      if (fb.gravityScale < 1) {
        applyForce(fb, fb.position, { x: 0, y: -gravityY() * worldGravityScale() * fb.mass * (1 - fb.gravityScale) });
      }
    }
    physStep(Math.max(dt, 0.5));
    postPhysics(now);
    replayRecord(now);
    advanceTick();
  }

  // src/platform/debug-globals.js
  var MODULES = [
    // time is published for the same reason the rest is: since simNow() became
    // the sim's only clock, a harness page that wants to move the game forward
    // has to advance the TICK. Mocking globalThis.performance.now no longer does
    // anything to sim state (wave-test.html and wave-play.html still do, and are
    // stale for it).
    world_exports,
    time_exports,
    rng_exports,
    fx_exports,
    emit_exports,
    fx_exports2,
    effects_exports,
    pace_exports,
    sfx_exports,
    lobby_exports,
    awards_exports,
    telemetry_exports,
    match_exports,
    tick_exports,
    snapshot_exports,
    replay_exports,
    events_exports,
    waves_exports,
    pickups_exports,
    storage_exports,
    lifecycle_exports,
    combat_exports,
    status_exports,
    controller_exports,
    ghost_exports,
    core_exports,
    registry_exports,
    tiers_exports,
    fusion_exports,
    builders_exports,
    extras_exports,
    boss_exports,
    enemies_exports,
    bot_exports,
    artkit_exports,
    canvas_exports,
    draw_world_exports,
    hud_exports,
    draw_wizard_exports,
    draw_pickups_exports,
    draw_env_exports,
    draw_boss_exports,
    draw_snapshot_exports,
    replay_exports2,
    audio_exports,
    input_keyboard_exports,
    input_gamepad_exports,
    join_exports
  ];
  function installDebugGlobals() {
    const HS = {};
    for (const mod of MODULES) {
      for (const key of Object.keys(mod)) {
        Object.defineProperty(HS, key, { get: () => mod[key], configurable: true, enumerable: true });
        if (!(key in globalThis)) {
          Object.defineProperty(globalThis, key, { get: () => mod[key], configurable: true });
        }
      }
    }
    globalThis.HS = HS;
  }

  // src/platform/browser.js
  var canvas2 = document.getElementById("game");
  initCanvas(canvas2);
  createWorld();
  setStorage(globalThis.localStorage);
  setPostTelemetry(postTelemetryHttp);
  attachKeyboard(canvas2);
  attachLobbyKeys();
  var bundleSrc = document.currentScript?.src || "";
  var harness = /[?&]nomenu\b/.test(bundleSrc) || /[?&]nomenu\b/.test(location.search);
  if (harness) installDebugGlobals();
  else mountMenu();
  loadMap(0);
  var loop = createTickLoop({
    step: () => {
      perfBegin("sim");
      stepSim();
      perfEnd();
      perfBegin("fx");
      pumpEmitted();
      updateParticles(1);
      perfEnd();
    }
  });
  var last = performance.now();
  function frame(now) {
    perfFrameStart();
    if (netMode2() === "online") {
      last = now;
      perfBegin("net");
      netClientFrame(now);
      perfEnd();
      drawPerfHud(now);
      perfFrameEnd();
      requestAnimationFrame(frame);
      return;
    }
    scanJoins();
    scanLobbyPads();
    loop.pump(now - last);
    last = now;
    perfBegin("draw");
    draw(simNow());
    perfEnd();
    drawPerfHud(now);
    perfFrameEnd();
    requestAnimationFrame(frame);
  }
  if (harness) globalThis.frame = frame;
  requestAnimationFrame(frame);
})();
/*! Bundled license information:

matter-js/build/matter.js:
  (*!
   * matter-js 0.19.0 by @liabru
   * http://brm.io/matter-js/
   * License MIT
   * 
   * The MIT License (MIT)
   * 
   * Copyright (c) Liam Brummitt and contributors.
   * 
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   * 
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   * 
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   *)
*/
