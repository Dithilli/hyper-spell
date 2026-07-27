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
      (function webpackUniversalModuleDefinition(root, factory) {
        if (typeof exports === "object" && typeof module === "object")
          module.exports = factory();
        else if (typeof define === "function" && define.amd)
          define("Matter", [], factory);
        else if (typeof exports === "object")
          exports["Matter"] = factory();
        else
          root["Matter"] = factory();
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
                  var keys = [];
                  for (var key in obj)
                    keys.push(key);
                  return keys;
                };
                Common2.values = function(obj) {
                  var values = [];
                  if (Object.keys) {
                    var keys = Object.keys(obj);
                    for (var i = 0; i < keys.length; i++) {
                      values.push(obj[keys[i]]);
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
                Common2.chainPathBefore = function(base, path, func) {
                  return Common2.set(base, path, Common2.chain(
                    func,
                    Common2.get(base, path)
                  ));
                };
                Common2.chainPathAfter = function(base, path, func) {
                  return Common2.set(base, path, Common2.chain(
                    Common2.get(base, path),
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
              var Bounds = {};
              module2.exports = Bounds;
              (function() {
                Bounds.create = function(vertices) {
                  var bounds = {
                    min: { x: 0, y: 0 },
                    max: { x: 0, y: 0 }
                  };
                  if (vertices)
                    Bounds.update(bounds, vertices);
                  return bounds;
                };
                Bounds.update = function(bounds, vertices, velocity) {
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
                Bounds.contains = function(bounds, point) {
                  return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
                };
                Bounds.overlaps = function(boundsA, boundsB) {
                  return boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y;
                };
                Bounds.translate = function(bounds, vector) {
                  bounds.min.x += vector.x;
                  bounds.max.x += vector.x;
                  bounds.min.y += vector.y;
                  bounds.max.y += vector.y;
                };
                Bounds.shift = function(bounds, position) {
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
              var Vertices = {};
              module2.exports = Vertices;
              var Vector2 = __webpack_require__(2);
              var Common2 = __webpack_require__(0);
              (function() {
                Vertices.create = function(points, body) {
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
                Vertices.fromPath = function(path, body) {
                  var pathPattern = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/ig, points = [];
                  path.replace(pathPattern, function(match, x, y) {
                    points.push({ x: parseFloat(x), y: parseFloat(y) });
                  });
                  return Vertices.create(points, body);
                };
                Vertices.centre = function(vertices) {
                  var area = Vertices.area(vertices, true), centre = { x: 0, y: 0 }, cross, temp, j;
                  for (var i = 0; i < vertices.length; i++) {
                    j = (i + 1) % vertices.length;
                    cross = Vector2.cross(vertices[i], vertices[j]);
                    temp = Vector2.mult(Vector2.add(vertices[i], vertices[j]), cross);
                    centre = Vector2.add(centre, temp);
                  }
                  return Vector2.div(centre, 6 * area);
                };
                Vertices.mean = function(vertices) {
                  var average = { x: 0, y: 0 };
                  for (var i = 0; i < vertices.length; i++) {
                    average.x += vertices[i].x;
                    average.y += vertices[i].y;
                  }
                  return Vector2.div(average, vertices.length);
                };
                Vertices.area = function(vertices, signed) {
                  var area = 0, j = vertices.length - 1;
                  for (var i = 0; i < vertices.length; i++) {
                    area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
                    j = i;
                  }
                  if (signed)
                    return area / 2;
                  return Math.abs(area) / 2;
                };
                Vertices.inertia = function(vertices, mass) {
                  var numerator = 0, denominator = 0, v = vertices, cross, j;
                  for (var n = 0; n < v.length; n++) {
                    j = (n + 1) % v.length;
                    cross = Math.abs(Vector2.cross(v[j], v[n]));
                    numerator += cross * (Vector2.dot(v[j], v[j]) + Vector2.dot(v[j], v[n]) + Vector2.dot(v[n], v[n]));
                    denominator += cross;
                  }
                  return mass / 6 * (numerator / denominator);
                };
                Vertices.translate = function(vertices, vector, scalar) {
                  scalar = typeof scalar !== "undefined" ? scalar : 1;
                  var verticesLength = vertices.length, translateX = vector.x * scalar, translateY = vector.y * scalar, i;
                  for (i = 0; i < verticesLength; i++) {
                    vertices[i].x += translateX;
                    vertices[i].y += translateY;
                  }
                  return vertices;
                };
                Vertices.rotate = function(vertices, angle, point) {
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
                Vertices.contains = function(vertices, point) {
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
                Vertices.scale = function(vertices, scaleX, scaleY, point) {
                  if (scaleX === 1 && scaleY === 1)
                    return vertices;
                  point = point || Vertices.centre(vertices);
                  var vertex, delta;
                  for (var i = 0; i < vertices.length; i++) {
                    vertex = vertices[i];
                    delta = Vector2.sub(vertex, point);
                    vertices[i].x = point.x + delta.x * scaleX;
                    vertices[i].y = point.y + delta.y * scaleY;
                  }
                  return vertices;
                };
                Vertices.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
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
                Vertices.clockwiseSort = function(vertices) {
                  var centre = Vertices.mean(vertices);
                  vertices.sort(function(vertexA, vertexB) {
                    return Vector2.angle(centre, vertexA) - Vector2.angle(centre, vertexB);
                  });
                  return vertices;
                };
                Vertices.isConvex = function(vertices) {
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
                Vertices.hull = function(vertices) {
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
              var Vertices = __webpack_require__(3);
              var Vector2 = __webpack_require__(2);
              var Sleeping = __webpack_require__(7);
              var Common2 = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
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
                    vertices: Vertices.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),
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
                    bounds: body.bounds || Bounds.create(body.vertices),
                    positionPrev: body.positionPrev || Vector2.clone(body.position),
                    anglePrev: body.anglePrev || body.angle,
                    vertices: body.vertices,
                    parts: body.parts || [body],
                    isStatic: body.isStatic,
                    isSleeping: body.isSleeping,
                    parent: body.parent || body
                  });
                  Vertices.rotate(body.vertices, body.angle, body.position);
                  Axes.rotate(body.axes, body.angle);
                  Bounds.update(body.bounds, body.vertices, body.velocity);
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
                    body.vertices = Vertices.create(vertices, body);
                  }
                  body.axes = Axes.fromVertices(body.vertices);
                  body.area = Vertices.area(body.vertices);
                  Body2.setMass(body, body.density * body.area);
                  var centre = Vertices.centre(body.vertices);
                  Vertices.translate(body.vertices, centre, -1);
                  Body2.setInertia(body, Body2._inertiaScale * Vertices.inertia(body.vertices, body.mass));
                  Vertices.translate(body.vertices, body.position);
                  Bounds.update(body.bounds, body.vertices, body.velocity);
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
                    Vertices.clockwiseSort(vertices);
                    var hull = Vertices.hull(vertices), hullCentre = Vertices.centre(hull);
                    Body2.setVertices(body, hull);
                    Vertices.translate(body.vertices, hullCentre);
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
                    Vertices.translate(part.vertices, delta);
                    Bounds.update(part.bounds, part.vertices, body.velocity);
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
                    Vertices.rotate(part.vertices, delta, body.position);
                    Axes.rotate(part.axes, delta);
                    Bounds.update(part.bounds, part.vertices, body.velocity);
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
                    Vertices.scale(part.vertices, scaleX, scaleY, point);
                    part.axes = Axes.fromVertices(part.vertices);
                    part.area = Vertices.area(part.vertices);
                    Body2.setMass(part, body.density * part.area);
                    Vertices.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
                    Body2.setInertia(part, Body2._inertiaScale * Vertices.inertia(part.vertices, part.mass));
                    Vertices.translate(part.vertices, { x: part.position.x, y: part.position.y });
                    if (i > 0) {
                      totalArea += part.area;
                      totalInertia += part.inertia;
                    }
                    part.position.x = point.x + (part.position.x - point.x) * scaleX;
                    part.position.y = point.y + (part.position.y - point.y) * scaleY;
                    Bounds.update(part.bounds, part.vertices, body.velocity);
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
                    Vertices.translate(part.vertices, body.velocity);
                    if (i > 0) {
                      part.position.x += body.velocity.x;
                      part.position.y += body.velocity.y;
                    }
                    if (body.angularVelocity !== 0) {
                      Vertices.rotate(part.vertices, body.angularVelocity, body.position);
                      Axes.rotate(part.axes, body.angularVelocity);
                      if (i > 0) {
                        Vector2.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
                      }
                    }
                    Bounds.update(part.bounds, part.vertices, body.velocity);
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
              var Bounds = __webpack_require__(1);
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
                  return Bounds.create(vertices);
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
                Sleeping.afterCollisions = function(pairs) {
                  var motionSleepThreshold = Sleeping._motionSleepThreshold;
                  for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i];
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
              var Vertices = __webpack_require__(3);
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
                Collision.collides = function(bodyA, bodyB, pairs) {
                  Collision._overlapAxes(_overlapAB, bodyA.vertices, bodyB.vertices, bodyA.axes);
                  if (_overlapAB.overlap <= 0) {
                    return null;
                  }
                  Collision._overlapAxes(_overlapBA, bodyB.vertices, bodyA.vertices, bodyB.axes);
                  if (_overlapBA.overlap <= 0) {
                    return null;
                  }
                  var pair = pairs && pairs.table[Pair.id(bodyA, bodyB)], collision;
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
                  if (Vertices.contains(bodyA.vertices, supportsB[0])) {
                    supports[supportCount++] = supportsB[0];
                  }
                  if (Vertices.contains(bodyA.vertices, supportsB[1])) {
                    supports[supportCount++] = supportsB[1];
                  }
                  if (supportCount < 2) {
                    var supportsA = Collision._findSupports(bodyB, bodyA, normal, -1);
                    if (Vertices.contains(bodyB.vertices, supportsA[0])) {
                      supports[supportCount++] = supportsA[0];
                    }
                    if (supportCount < 2 && Vertices.contains(bodyB.vertices, supportsA[1])) {
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
              var Vertices = __webpack_require__(3);
              var Vector2 = __webpack_require__(2);
              var Sleeping = __webpack_require__(7);
              var Bounds = __webpack_require__(1);
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
                      Vertices.translate(part.vertices, impulse);
                      if (j > 0) {
                        part.position.x += impulse.x;
                        part.position.y += impulse.y;
                      }
                      if (impulse.angle !== 0) {
                        Vertices.rotate(part.vertices, impulse.angle, body.position);
                        Axes.rotate(part.axes, impulse.angle);
                        if (j > 0) {
                          Vector2.rotateAbout(part.position, impulse.angle, body.position, part.position);
                        }
                      }
                      Bounds.update(part.bounds, part.vertices, body.velocity);
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
              var Vertices = __webpack_require__(3);
              var Common2 = __webpack_require__(0);
              var Body2 = __webpack_require__(4);
              var Bounds = __webpack_require__(1);
              var Vector2 = __webpack_require__(2);
              (function() {
                Bodies2.rectangle = function(x, y, width, height, options) {
                  options = options || {};
                  var rectangle = {
                    label: "Rectangle Body",
                    position: { x, y },
                    vertices: Vertices.fromPath("L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    rectangle.vertices = Vertices.chamfer(
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
                    vertices: Vertices.fromPath(verticesPath)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    trapezoid.vertices = Vertices.chamfer(
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
                    vertices: Vertices.fromPath(path)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    polygon.vertices = Vertices.chamfer(
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
                    isConvex = Vertices.isConvex(vertices);
                    isConcave = !isConvex;
                    if (isConcave && !canDecomp) {
                      Common2.warnOnce(
                        "Bodies.fromVertices: Install the 'poly-decomp' library and use Common.setDecomp or provide 'decomp' as a global to decompose concave vertices."
                      );
                    }
                    if (isConvex || !canDecomp) {
                      if (isConvex) {
                        vertices = Vertices.clockwiseSort(vertices);
                      } else {
                        vertices = Vertices.hull(vertices);
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
                        if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea)
                          continue;
                        parts.push({
                          position: Vertices.centre(chunkVertices),
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
                        if (Bounds.overlaps(partA.bounds, partB.bounds)) {
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
                  var collisions = [], pairs = detector.pairs, bodies = detector.bodies, bodiesLength = bodies.length, canCollide = Detector.canCollide, collides = Collision.collides, i, j;
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
                        var collision = collides(bodyA, bodyB, pairs);
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
                            var collision = collides(partA, partB, pairs);
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
                  var mouse = {};
                  if (!element) {
                    Common2.log("Mouse.create: element was undefined, defaulting to document.body", "warn");
                  }
                  mouse.element = element || document.body;
                  mouse.absolute = { x: 0, y: 0 };
                  mouse.position = { x: 0, y: 0 };
                  mouse.mousedownPosition = { x: 0, y: 0 };
                  mouse.mouseupPosition = { x: 0, y: 0 };
                  mouse.offset = { x: 0, y: 0 };
                  mouse.scale = { x: 1, y: 1 };
                  mouse.wheelDelta = 0;
                  mouse.button = -1;
                  mouse.pixelRatio = parseInt(mouse.element.getAttribute("data-pixel-ratio"), 10) || 1;
                  mouse.sourceEvents = {
                    mousemove: null,
                    mousedown: null,
                    mouseup: null,
                    mousewheel: null
                  };
                  mouse.mousemove = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      mouse.button = 0;
                      event.preventDefault();
                    }
                    mouse.absolute.x = position.x;
                    mouse.absolute.y = position.y;
                    mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                    mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                    mouse.sourceEvents.mousemove = event;
                  };
                  mouse.mousedown = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      mouse.button = 0;
                      event.preventDefault();
                    } else {
                      mouse.button = event.button;
                    }
                    mouse.absolute.x = position.x;
                    mouse.absolute.y = position.y;
                    mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                    mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                    mouse.mousedownPosition.x = mouse.position.x;
                    mouse.mousedownPosition.y = mouse.position.y;
                    mouse.sourceEvents.mousedown = event;
                  };
                  mouse.mouseup = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      event.preventDefault();
                    }
                    mouse.button = -1;
                    mouse.absolute.x = position.x;
                    mouse.absolute.y = position.y;
                    mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                    mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                    mouse.mouseupPosition.x = mouse.position.x;
                    mouse.mouseupPosition.y = mouse.position.y;
                    mouse.sourceEvents.mouseup = event;
                  };
                  mouse.mousewheel = function(event) {
                    mouse.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
                    event.preventDefault();
                  };
                  Mouse.setElement(mouse, mouse.element);
                  return mouse;
                };
                Mouse.setElement = function(mouse, element) {
                  mouse.element = element;
                  element.addEventListener("mousemove", mouse.mousemove);
                  element.addEventListener("mousedown", mouse.mousedown);
                  element.addEventListener("mouseup", mouse.mouseup);
                  element.addEventListener("mousewheel", mouse.mousewheel);
                  element.addEventListener("DOMMouseScroll", mouse.mousewheel);
                  element.addEventListener("touchmove", mouse.mousemove);
                  element.addEventListener("touchstart", mouse.mousedown);
                  element.addEventListener("touchend", mouse.mouseup);
                };
                Mouse.clearSourceEvents = function(mouse) {
                  mouse.sourceEvents.mousemove = null;
                  mouse.sourceEvents.mousedown = null;
                  mouse.sourceEvents.mouseup = null;
                  mouse.sourceEvents.mousewheel = null;
                  mouse.wheelDelta = 0;
                };
                Mouse.setOffset = function(mouse, offset) {
                  mouse.offset.x = offset.x;
                  mouse.offset.y = offset.y;
                  mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                  mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                };
                Mouse.setScale = function(mouse, scale2) {
                  mouse.scale.x = scale2.x;
                  mouse.scale.y = scale2.y;
                  mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                  mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
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
                    var registered = Plugin._registry[plugin.name], pluginVersion = Plugin.versionParse(plugin.version).number, registeredVersion = Plugin.versionParse(registered.version).number;
                    if (pluginVersion > registeredVersion) {
                      Common2.warn("Plugin.register:", Plugin.toString(registered), "was upgraded to", Plugin.toString(plugin));
                      Plugin._registry[plugin.name] = plugin;
                    } else if (pluginVersion < registeredVersion) {
                      Common2.warn("Plugin.register:", Plugin.toString(registered), "can not be downgraded to", Plugin.toString(plugin));
                    } else if (plugin !== registered) {
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
                    var parsed = Plugin.dependencyParse(dependency), resolved = Plugin.resolve(dependency);
                    if (resolved && !Plugin.versionSatisfies(resolved.version, parsed.range)) {
                      Common2.warn(
                        "Plugin.dependencies:",
                        Plugin.toString(resolved),
                        "does not satisfy",
                        Plugin.toString(parsed),
                        "used by",
                        Plugin.toString(parsedBase) + "."
                      );
                      resolved._warned = true;
                      module3._warned = true;
                    } else if (!resolved) {
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
                  var world2 = engine2.world, detector = engine2.detector, pairs = engine2.pairs, timing = engine2.timing, timestamp = timing.timestamp, i;
                  delta = typeof delta !== "undefined" ? delta : Common2._baseDelta;
                  delta *= timing.timeScale;
                  timing.timestamp += delta;
                  timing.lastDelta = delta;
                  var event = {
                    timestamp: timing.timestamp,
                    delta
                  };
                  Events2.trigger(engine2, "beforeUpdate", event);
                  var allBodies = Composite2.allBodies(world2), allConstraints = Composite2.allConstraints(world2);
                  if (world2.isModified) {
                    Detector.setBodies(detector, allBodies);
                    Composite2.setModified(world2, false, false, true);
                  }
                  if (engine2.enableSleeping)
                    Sleeping.update(allBodies, delta);
                  Engine2._bodiesApplyGravity(allBodies, engine2.gravity);
                  if (delta > 0) {
                    Engine2._bodiesUpdate(allBodies, delta);
                  }
                  Constraint2.preSolveAll(allBodies);
                  for (i = 0; i < engine2.constraintIterations; i++) {
                    Constraint2.solveAll(allConstraints, delta);
                  }
                  Constraint2.postSolveAll(allBodies);
                  detector.pairs = engine2.pairs;
                  var collisions = Detector.collisions(detector);
                  Pairs.update(pairs, collisions, timestamp);
                  if (engine2.enableSleeping)
                    Sleeping.afterCollisions(pairs.list);
                  if (pairs.collisionStart.length > 0)
                    Events2.trigger(engine2, "collisionStart", { pairs: pairs.collisionStart });
                  var positionDamping = Common2.clamp(20 / engine2.positionIterations, 0, 1);
                  Resolver.preSolvePosition(pairs.list);
                  for (i = 0; i < engine2.positionIterations; i++) {
                    Resolver.solvePosition(pairs.list, delta, positionDamping);
                  }
                  Resolver.postSolvePosition(allBodies);
                  Constraint2.preSolveAll(allBodies);
                  for (i = 0; i < engine2.constraintIterations; i++) {
                    Constraint2.solveAll(allConstraints, delta);
                  }
                  Constraint2.postSolveAll(allBodies);
                  Resolver.preSolveVelocity(pairs.list);
                  for (i = 0; i < engine2.velocityIterations; i++) {
                    Resolver.solveVelocity(pairs.list, delta);
                  }
                  Engine2._bodiesUpdateVelocities(allBodies);
                  if (pairs.collisionActive.length > 0)
                    Events2.trigger(engine2, "collisionActive", { pairs: pairs.collisionActive });
                  if (pairs.collisionEnd.length > 0)
                    Events2.trigger(engine2, "collisionEnd", { pairs: pairs.collisionEnd });
                  Engine2._bodiesClearForces(allBodies);
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
              var Vertices = __webpack_require__(3);
              var Common2 = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
              (function() {
                Resolver._restingThresh = 2;
                Resolver._restingThreshTangent = Math.sqrt(6);
                Resolver._positionDampen = 0.9;
                Resolver._positionWarming = 0.8;
                Resolver._frictionNormalMultiplier = 5;
                Resolver._frictionMaxStatic = Number.MAX_VALUE;
                Resolver.preSolvePosition = function(pairs) {
                  var i, pair, activeCount, pairsLength = pairs.length;
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs[i];
                    if (!pair.isActive)
                      continue;
                    activeCount = pair.activeContacts.length;
                    pair.collision.parentA.totalContacts += activeCount;
                    pair.collision.parentB.totalContacts += activeCount;
                  }
                };
                Resolver.solvePosition = function(pairs, delta, damping) {
                  var i, pair, collision, bodyA, bodyB, normal, contactShare, positionImpulse, positionDampen = Resolver._positionDampen * (damping || 1), slopDampen = Common2.clamp(delta / Common2._baseDelta, 0, 1), pairsLength = pairs.length;
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.parentA;
                    bodyB = collision.parentB;
                    normal = collision.normal;
                    pair.separation = normal.x * (bodyB.positionImpulse.x + collision.penetration.x - bodyA.positionImpulse.x) + normal.y * (bodyB.positionImpulse.y + collision.penetration.y - bodyA.positionImpulse.y);
                  }
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs[i];
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
                  var positionWarming = Resolver._positionWarming, bodiesLength = bodies.length, verticesTranslate = Vertices.translate, boundsUpdate = Bounds.update;
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
                Resolver.preSolveVelocity = function(pairs) {
                  var pairsLength = pairs.length, i, j;
                  for (i = 0; i < pairsLength; i++) {
                    var pair = pairs[i];
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
                Resolver.solveVelocity = function(pairs, delta) {
                  var timeScale = delta / Common2._baseDelta, timeScaleSquared = timeScale * timeScale, timeScaleCubed = timeScaleSquared * timeScale, restingThresh = -Resolver._restingThresh * timeScale, restingThreshTangent = Resolver._restingThreshTangent, frictionNormalMultiplier = Resolver._frictionNormalMultiplier * timeScale, frictionMaxStatic = Resolver._frictionMaxStatic, pairsLength = pairs.length, tangentImpulse, maxFriction, i, j;
                  for (i = 0; i < pairsLength; i++) {
                    var pair = pairs[i];
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
                Pairs.update = function(pairs, collisions, timestamp) {
                  var pairsList = pairs.list, pairsListLength = pairsList.length, pairsTable = pairs.table, collisionsLength = collisions.length, collisionStart = pairs.collisionStart, collisionEnd = pairs.collisionEnd, collisionActive = pairs.collisionActive, collision, pairIndex, pair, i;
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
                Pairs.clear = function(pairs) {
                  pairs.table = {};
                  pairs.list.length = 0;
                  pairs.collisionStart.length = 0;
                  pairs.collisionActive.length = 0;
                  pairs.collisionEnd.length = 0;
                  return pairs;
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
                    for (var column = 0; column < columns; column++) {
                      var body = callback(x, y, column, row, lastBody, i);
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
                  return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row, lastBody, i) {
                    var actualRows = Math.min(rows, Math.ceil(columns / 2)), lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
                    if (row > actualRows)
                      return;
                    row = actualRows - row;
                    var start = row, end = columns - 1 - row;
                    if (column < start || column > end)
                      return;
                    if (i === 1) {
                      Body2.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
                    }
                    var xOffset = lastBody ? column * lastBodyWidth : 0;
                    return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
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
                  var i, col, row, world2 = engine2.world, buckets = grid.buckets, bucket, bucketId, gridChanged = false;
                  for (i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (body.isSleeping && !forceUpdate)
                      continue;
                    if (world2.bounds && (body.bounds.max.x < world2.bounds.min.x || body.bounds.min.x > world2.bounds.max.x || body.bounds.max.y < world2.bounds.min.y || body.bounds.min.y > world2.bounds.max.y))
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
                Grid._getBucketId = function(column, row) {
                  return "C" + column + "R" + row;
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
                  var pair, gridPairs = grid.pairs, pairKeys = Common2.keys(gridPairs), pairKeysLength = pairKeys.length, pairs = [], k;
                  for (k = 0; k < pairKeysLength; k++) {
                    pair = gridPairs[pairKeys[k]];
                    if (pair[2] > 0) {
                      pairs.push(pair);
                    } else {
                      delete gridPairs[pairKeys[k]];
                    }
                  }
                  return pairs;
                };
              })();
            }),
            /* 24 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var MouseConstraint = {};
              module2.exports = MouseConstraint;
              var Vertices = __webpack_require__(3);
              var Sleeping = __webpack_require__(7);
              var Mouse = __webpack_require__(14);
              var Events2 = __webpack_require__(5);
              var Detector = __webpack_require__(13);
              var Constraint2 = __webpack_require__(10);
              var Composite2 = __webpack_require__(6);
              var Common2 = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
              (function() {
                MouseConstraint.create = function(engine2, options) {
                  var mouse = (engine2 ? engine2.mouse : null) || (options ? options.mouse : null);
                  if (!mouse) {
                    if (engine2 && engine2.render && engine2.render.canvas) {
                      mouse = Mouse.create(engine2.render.canvas);
                    } else if (options && options.element) {
                      mouse = Mouse.create(options.element);
                    } else {
                      mouse = Mouse.create();
                      Common2.warn("MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected");
                    }
                  }
                  var constraint = Constraint2.create({
                    label: "Mouse Constraint",
                    pointA: mouse.position,
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
                    mouse,
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
                    var allBodies = Composite2.allBodies(engine2.world);
                    MouseConstraint.update(mouseConstraint, allBodies);
                    MouseConstraint._triggerEvents(mouseConstraint);
                  });
                  return mouseConstraint;
                };
                MouseConstraint.update = function(mouseConstraint, bodies) {
                  var mouse = mouseConstraint.mouse, constraint = mouseConstraint.constraint, body = mouseConstraint.body;
                  if (mouse.button === 0) {
                    if (!constraint.bodyB) {
                      for (var i = 0; i < bodies.length; i++) {
                        body = bodies[i];
                        if (Bounds.contains(body.bounds, mouse.position) && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                          for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.position)) {
                              constraint.pointA = mouse.position;
                              constraint.bodyB = mouseConstraint.body = body;
                              constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                              constraint.angleB = body.angle;
                              Sleeping.set(body, false);
                              Events2.trigger(mouseConstraint, "startdrag", { mouse, body });
                              break;
                            }
                          }
                        }
                      }
                    } else {
                      Sleeping.set(constraint.bodyB, false);
                      constraint.pointA = mouse.position;
                    }
                  } else {
                    constraint.bodyB = mouseConstraint.body = null;
                    constraint.pointB = null;
                    if (body)
                      Events2.trigger(mouseConstraint, "enddrag", { mouse, body });
                  }
                };
                MouseConstraint._triggerEvents = function(mouseConstraint) {
                  var mouse = mouseConstraint.mouse, mouseEvents = mouse.sourceEvents;
                  if (mouseEvents.mousemove)
                    Events2.trigger(mouseConstraint, "mousemove", { mouse });
                  if (mouseEvents.mousedown)
                    Events2.trigger(mouseConstraint, "mousedown", { mouse });
                  if (mouseEvents.mouseup)
                    Events2.trigger(mouseConstraint, "mouseup", { mouse });
                  Mouse.clearSourceEvents(mouse);
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
              var Bounds = __webpack_require__(1);
              var Bodies2 = __webpack_require__(12);
              var Vertices = __webpack_require__(3);
              (function() {
                Query2.collides = function(body, bodies) {
                  var collisions = [], bodiesLength = bodies.length, bounds = body.bounds, collides = Collision.collides, overlaps = Bounds.overlaps;
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
                    var body = bodies[i], overlaps = Bounds.overlaps(body.bounds, bounds);
                    if (overlaps && !outside || !overlaps && outside)
                      result.push(body);
                  }
                  return result;
                };
                Query2.point = function(bodies, point) {
                  var result = [];
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (Bounds.contains(body.bounds, point)) {
                      for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                        var part = body.parts[j];
                        if (Bounds.contains(part.bounds, point) && Vertices.contains(part.vertices, point)) {
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
              var Bounds = __webpack_require__(1);
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
                  (function loop(time) {
                    render.frameRequestId = _requestAnimationFrame(loop);
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
                  var options = render.options, canvas = render.canvas;
                  if (pixelRatio === "auto") {
                    pixelRatio = _getPixelRatio(canvas);
                  }
                  options.pixelRatio = pixelRatio;
                  canvas.setAttribute("data-pixel-ratio", pixelRatio);
                  canvas.width = options.width * pixelRatio;
                  canvas.height = options.height * pixelRatio;
                  canvas.style.width = options.width + "px";
                  canvas.style.height = options.height + "px";
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
                  var startTime = Common2.now(), engine2 = render.engine, world2 = engine2.world, canvas = render.canvas, context = render.context, options = render.options, timing = render.timing;
                  var allBodies = Composite2.allBodies(world2), allConstraints = Composite2.allConstraints(world2), background = options.wireframes ? options.wireframeBackground : options.background, bodies = [], constraints = [], i;
                  var event = {
                    timestamp: engine2.timing.timestamp
                  };
                  Events2.trigger(render, "beforeRender", event);
                  if (render.currentBackground !== background)
                    _applyBackground(render, background);
                  context.globalCompositeOperation = "source-in";
                  context.fillStyle = "transparent";
                  context.fillRect(0, 0, canvas.width, canvas.height);
                  context.globalCompositeOperation = "source-over";
                  if (options.hasBounds) {
                    for (i = 0; i < allBodies.length; i++) {
                      var body = allBodies[i];
                      if (Bounds.overlaps(body.bounds, render.bounds))
                        bodies.push(body);
                    }
                    for (i = 0; i < allConstraints.length; i++) {
                      var constraint = allConstraints[i], bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointAWorld = constraint.pointA, pointBWorld = constraint.pointB;
                      if (bodyA) pointAWorld = Vector2.add(bodyA.position, constraint.pointA);
                      if (bodyB) pointBWorld = Vector2.add(bodyB.position, constraint.pointB);
                      if (!pointAWorld || !pointBWorld)
                        continue;
                      if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
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
                    bodies = allBodies;
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
                  var engine2 = render.engine, world2 = engine2.world, bodies = Composite2.allBodies(world2), parts = 0, width = 55, height = 44, x = 0, y = 0;
                  for (var i = 0; i < bodies.length; i += 1) {
                    parts += bodies[i].parts.length;
                  }
                  var sections = {
                    "Part": parts,
                    "Body": bodies.length,
                    "Cons": Composite2.allConstraints(world2).length,
                    "Comp": Composite2.allComposites(world2).length,
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
                Render.mousePosition = function(render, mouse, context) {
                  var c = context;
                  c.fillStyle = "rgba(255,255,255,0.8)";
                  c.fillText(mouse.position.x + "  " + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
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
                Render.collisions = function(render, pairs, context) {
                  var c = context, options = render.options, pair, collision, corrected, bodyA, bodyB, i, j;
                  c.beginPath();
                  for (i = 0; i < pairs.length; i++) {
                    pair = pairs[i];
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
                  for (i = 0; i < pairs.length; i++) {
                    pair = pairs[i];
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
                Render.separations = function(render, pairs, context) {
                  var c = context, options = render.options, pair, collision, corrected, bodyA, bodyB, i, j;
                  c.beginPath();
                  for (i = 0; i < pairs.length; i++) {
                    pair = pairs[i];
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
                  var canvas = document.createElement("canvas");
                  canvas.width = width;
                  canvas.height = height;
                  canvas.oncontextmenu = function() {
                    return false;
                  };
                  canvas.onselectstart = function() {
                    return false;
                  };
                  return canvas;
                };
                var _getPixelRatio = function(canvas) {
                  var context = canvas.getContext("2d"), devicePixelRatio = window.devicePixelRatio || 1, backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
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
              var Bounds = __webpack_require__(1);
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
  var SPELLS = {};

  // src/sim/world.js
  var import_matter_js = __toESM(require_matter(), 1);
  var { Common, Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector } = import_matter_js.default;
  var W = 1280;
  var H = 720;
  var engine = null;
  var world = null;
  var resetHooks = [];
  function onWorldReset(fn) {
    resetHooks.push(fn);
  }

  // src/sim/time.js
  var TICK_HZ = 60;
  var TICK_MS = 1e3 / TICK_HZ;
  var tick = 0;
  var currentTick = () => tick;
  var simNow = () => tick * TICK_MS;
  var ticks = (ms) => Math.round(ms / TICK_MS);

  // src/sim/rng.js
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
  var particles = [];
  var shake = 0;
  var flashColor = "#fff";
  var flashAlpha = 0;
  function baseAddShake(v) {
    shake = Math.min(shake + v, 26);
  }
  function baseDoFlash(color, alpha = 0.4) {
    flashColor = color;
    flashAlpha = Math.max(flashAlpha, alpha);
  }
  function baseSpawnParticles(x, y, color, count, speed, life = 40) {
    for (let i = 0; i < count; i++) {
      const a = simRandom() * Math.PI * 2, v = simRandom() * speed;
      particles.push({ kind: "square", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: life + simRandom() * 20, maxLife: life, color, r: 2 + simRandom() * 3 });
    }
  }
  function baseSpawnRing(x, y, color) {
    particles.push({ kind: "ring", x, y, r: 12, life: 16, maxLife: 16, color });
  }
  function baseSpawnBurst(x, y, color, count = 12, o = {}) {
    const kind = o.kind || "square", speed = o.speed ?? 5, spread = o.spread ?? Math.PI * 2;
    const dir = o.dir ?? 0, up = o.up ?? 0, life = o.life ?? 40, g = o.g ?? 0.25, r = o.r ?? 3;
    for (let i = 0; i < count; i++) {
      const a = dir + (simRandom() - 0.5) * spread;
      const v = speed * (0.4 + simRandom() * 0.9);
      particles.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: life + simRandom() * 15, maxLife: life, color, r: r * (0.6 + simRandom() * 0.8), g });
    }
  }
  function baseSpawnText(x, y, str, color) {
    particles.push({ kind: "text", str, x, y, vx: 0, vy: -1.2, life: 50, maxLife: 50, color, r: 16 });
  }
  var addShake = baseAddShake;
  var doFlash = baseDoFlash;
  var spawnParticles = baseSpawnParticles;
  var spawnRing = baseSpawnRing;
  var spawnBurst = baseSpawnBurst;
  var spawnText = baseSpawnText;
  onWorldReset(() => {
    particles.length = 0;
    shake = 0;
    flashColor = "#fff";
    flashAlpha = 0;
  });

  // src/sim/env.js
  var performance = globalThis.performance;

  // src/sim/pace.js
  var BASE_PACE = 0.85;
  var MIN_PACE = 0.05;
  var scale = BASE_PACE;
  var slowUntil = 0;
  function baseSlowMo(s, ms) {
    scale = Math.max(MIN_PACE, s);
    slowUntil = performance.now() + ms;
  }
  var slowMo = baseSlowMo;
  onWorldReset(() => {
    scale = BASE_PACE;
    slowUntil = 0;
  });

  // src/sim/sfx.js
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
  for (const key of SFX_KEYS) sfx[key] = () => {
  };

  // src/sim/schedule.js
  var seq = 0;
  var entries = [];
  var running = null;
  function scheduleAt(at, fn, tag = null) {
    const id = ++seq;
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
  onWorldReset(() => {
    entries = [];
    running = null;
  });

  // src/version.js
  var GAME_VERSION = 9;

  // src/sim/net-mode.js
  var netMode = "couch";

  // src/sim/spells/tiers.js
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
    const fb = Bodies.circle(from.x + Math.cos(a) * off, from.y + Math.sin(a) * off, r, { density: 4e-3, frictionAir: 0, label: "projectile" });
    fb.owner = null;
    fb.color = color;
    fb.gravityScale = 0.25;
    fb.expireAt = simNow() + 5e3;
    const dm = game.boss?.dmgMult || 1;
    fb.onHit = (self) => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2] * dm, "boss");
    Body.setVelocity(fb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
    projectiles.add(fb);
    Composite.add(world, fb);
    return fb;
  }
  var bcd = (bs, min, max) => rand(min, max) / (bs.rate || 1);
  function bossTouchAll(bs, now, dmg, pad = 8) {
    const bb = bs.body.bounds;
    for (const p of players) {
      if (!p.alive || now < (p._bossHurtAt || 0)) continue;
      const q = p.body.position;
      if (q.x > bb.min.x - pad && q.x < bb.max.x + pad && q.y > bb.min.y - pad && q.y < bb.max.y + pad) {
        p._bossHurtAt = now + 700;
        damagePlayer(p, dmg * (bs.dmgMult || 1));
        const away = Math.sign(q.x - bs.body.position.x) || pick([-1, 1]);
        Body.setVelocity(p.body, { x: away * 8, y: -6 });
      }
    }
  }
  var BOSSES = [
    {
      id: "dragon",
      name: "THE DRAGON",
      color: "#e15d5d",
      make() {
        return Bodies.circle(W / 2, 140, 42, { density: 0.012, frictionAir: 0.06, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
        if (!bs.wp || Math.hypot(bs.wp.x - b.position.x, bs.wp.y - b.position.y) < 70) {
          bs.wp = { x: rand(150, W - 150), y: rand(90, 320) };
        }
        const dx = bs.wp.x - b.position.x, dy = bs.wp.y - b.position.y, d = Math.hypot(dx, dy) || 1;
        Body.setVelocity(b, { x: b.velocity.x * 0.92 + dx / d * 1.1, y: b.velocity.y * 0.92 + dy / d * 1.1 });
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
        bossTouchAll(bs, now, 10);
      }
    },
    {
      id: "lich",
      name: "THE LICH",
      color: "#c084fc",
      make() {
        return Bodies.circle(W / 2, 160, 30, { density: 0.01, frictionAir: 0.12, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
        Body.setVelocity(b, { x: b.velocity.x * 0.9, y: b.velocity.y * 0.9 + Math.sin(now * 3e-3) * 0.25 });
        if (now > (bs.nextBlink || (bs.nextBlink = now + 3e3))) {
          bs.nextBlink = now + bcd(bs, 3200, 4400);
          spawnParticles(b.position.x, b.position.y, "#c084fc", 16, 5);
          Body.setPosition(b, { x: rand(140, W - 140), y: rand(100, 340) });
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
            const sk = Bodies.circle(b.position.x + side * 30, b.position.y + 20, 9, { density: 2e-3, friction: 0.5, restitution: 0.4, label: "critter" });
            sk.critter = { hopAt: 0, dir: side, hop: 6, speed: 4 };
            summon(sk, { life: 16e3, color: "#e8e8dc", contactDamage: 6 * bs.dmgMult });
          }
          spawnText(b.position.x, b.position.y - 50, "RISE!", "#c084fc");
        }
        bossTouchAll(bs, now, 8);
      }
    },
    {
      id: "golem",
      name: "THE GOLEM",
      color: "#b08948",
      make() {
        return Bodies.rectangle(W / 2, 60, 74, 92, { density: 0.02, friction: 0.8, restitution: 0, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        Body.setAngle(b, b.angle * 0.8);
        Body.setAngularVelocity(b, 0);
        if (b.position.y > H - 20) {
          Body.setPosition(b, { x: W / 2, y: 40 });
          Body.setVelocity(b, { x: 0, y: 0 });
          addShake(6);
        }
        const t = bossAliveTarget(b.position);
        if (t && !bs.airborne) {
          const dir = Math.sign(t.body.position.x - b.position.x);
          Body.setVelocity(b, { x: b.velocity.x * 0.8 + dir * 0.9, y: b.velocity.y });
        }
        if (t && now > (bs.nextLeap || (bs.nextLeap = now + 3500)) && Math.abs(b.velocity.y) < 1) {
          bs.nextLeap = now + bcd(bs, 4500, 6500);
          bs.airborne = true;
          const dir = Math.sign(t.body.position.x - b.position.x) || 1;
          Body.setVelocity(b, { x: dir * rand(6, 10), y: -16 });
          sfx.boing();
        }
        if (bs.airborne && b.velocity.y >= 0 && Math.abs(b.velocity.y) < 0.8) {
          bs.airborne = false;
          explode(b.position.x, b.position.y + 30, 140, 20, 16 * bs.dmgMult, "boss");
          addShake(14);
        }
        bossTouchAll(bs, now, 12);
      }
    },
    {
      id: "kraken",
      name: "THE KRAKEN",
      color: "#3d6a8a",
      make() {
        return Bodies.circle(W / 2, H - 95, 42, { isStatic: true, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        Body.setPosition(b, { x: W / 2 + Math.sin(now / 3200) * 200, y: H - 95 + Math.sin(now / 900) * 12 });
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
            const tb = Bodies.rectangle(w.x, H + 120, 26, 240, { isStatic: true, label: "tentacle" });
            summon(tb, { life: 3e3, color: "#3d6a8a" });
            bs.tentacles.push({ b: tb, t0: now, x: w.x, hit: /* @__PURE__ */ new Set() });
            sfx.squeak();
          }
        }
        bs.pending = bs.pending.filter((w) => now <= w.at);
        for (const tn of [...bs.tentacles]) {
          const age = now - tn.t0;
          const rise = age < 450 ? age / 450 : age < 1400 ? 1 : Math.max(0, 1 - (age - 1400) / 700);
          Body.setPosition(tn.b, { x: tn.x, y: H + 120 - rise * 260 });
          for (const p of players) {
            if (!p.alive || tn.hit.has(p)) continue;
            const q = p.body.position;
            if (Math.abs(q.x - tn.x) < 26 && q.y > tn.b.bounds.min.y - 12) {
              tn.hit.add(p);
              damagePlayer(p, 14 * bs.dmgMult);
              Body.setVelocity(p.body, { x: Math.sign(q.x - tn.x || 1) * 7, y: -13 });
            }
          }
          if (age > 2100) {
            removeSummon(tn.b);
            bs.tentacles.splice(bs.tentacles.indexOf(tn), 1);
          }
        }
        bossTouchAll(bs, now, 10);
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
        return Bodies.circle(W / 2, 150, 34, { density: 0.011, frictionAir: 0.1, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
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
          Body.setVelocity(b, { x: b.velocity.x * 0.9 + dx / d * 1, y: b.velocity.y * 0.9 + dy / d * 1 });
          if (now > (bs.nextCharm || (bs.nextCharm = now + 3200))) {
            bs.nextCharm = now + bcd(bs, 3600, 5e3);
            spawnRing(b.position.x, b.position.y, "#ff9ecb");
            setBanner(pick(["LFG!", "W RIZZ", "UNMATCHED RIZZ", "IT'S GIVING UNICORN", "HAVE YOU SEEN OUR SERIES A?", "LET ME PITCH YOU"]), "#ffd166", 1100);
            for (const p of players) {
              if (!p.alive) continue;
              if (Math.hypot(p.body.position.x - b.position.x, p.body.position.y - b.position.y) < 440) {
                p.reversedUntil = now + 2600;
                const pull = Math.sign(b.position.x - p.body.position.x) || 1;
                Body.setVelocity(p.body, { x: p.body.velocity.x + pull * 5, y: -4 });
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
          Body.setVelocity(b, { x: b.velocity.x * 0.85 + fdx / fd * 0.9, y: b.velocity.y * 0.85 + fdy / fd * 0.9 });
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
        bossTouchAll(bs, now, rizz ? 10 : 12);
      }
    },
    {
      // Manu, CTO — lives between Germany and Mexico. Flips German <-> Mexican mode.
      id: "manu",
      name: "MANU",
      color: "#b39ddb",
      secret: true,
      make() {
        return Bodies.circle(W / 2, 150, 32, { density: 0.011, frictionAir: 0.1, label: "boss" });
      },
      update(bs, now) {
        const b = bs.body;
        Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
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
        Body.setVelocity(b, { x: b.velocity.x * 0.92 + Math.sin(now * 1e-3) * 0.8, y: b.velocity.y * 0.9 + Math.sin(now * 3e-3) * 0.3 });
        if (b.position.y < 90) Body.setVelocity(b, { x: b.velocity.x, y: 1.5 });
        if (b.position.y > 340) Body.setVelocity(b, { x: b.velocity.x, y: -1.5 });
        if (de) {
          if (now > (bs.nextDe || (bs.nextDe = now + 1500))) {
            bs.nextDe = now + bcd(bs, 1500, 1500);
            const t = bossAliveTarget(b.position);
            if (t) bossBolt(b.position, t, { speed: 13, r: 7, color: "#9ec9ff", boom: [55, 8, 12] });
            if (simRandom() < 0.4) {
              const q = bossAliveTarget(null);
              if (q) {
                q.frozenUntil = now + 700;
                q.body.frictionAir = 1e-3;
              }
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
        bossTouchAll(bs, now, de ? 9 : 12);
      }
    }
  ];
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
    if (!bs || game.state !== "PLAY" || !bs.announced || bs.hp <= 0) return;
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

  // src/sim/ai/enemies.js
  var enemies = /* @__PURE__ */ new Set();
  onWorldReset(() => enemies.clear());
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

  // src/sim/events.js
  var ENV_EVENT_CHANCE = 0.2;
  function platformSpots(m, n, rng) {
    const rr = rng ? (a, b) => a + rng() * (b - a) : rand;
    const solids = Composite.allBodies(m.composite).filter((b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 && b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
    const spots = [];
    for (let tries = 0; tries < n * 10 && spots.length < n; tries++) {
      const x = rr(90, W - 90);
      const col = solids.filter((b) => x > b.bounds.min.x + 8 && x < b.bounds.max.x - 8);
      if (!col.length) continue;
      const tops = col.map((b) => b.bounds.min.y).filter((y2) => y2 > 150 && y2 < H - 60);
      if (!tops.length) continue;
      const y = Math.min(...tops);
      if (spots.some((s) => Math.abs(s.x - x) < 70 && Math.abs(s.y - y) < 60)) continue;
      spots.push({ x, y });
    }
    return spots;
  }
  var ENV_EVENTS = [
    {
      id: "overgrowth",
      name: "OVERGROWTH",
      color: "#7bd88f",
      start(m, now) {
        m.data.vines = [];
        for (const s of platformSpots(m, 12)) {
          const v = Bodies.rectangle(s.x, s.y - 24, 22, 48, { isStatic: true, isSensor: true, label: "vine" });
          v.render.fillStyle = "#4f8a3d";
          v.kinematic = true;
          v.bornAt = now;
          Composite.add(m.composite, v);
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
        for (const b of Composite.allBodies(m.composite)) {
          if (b.isStatic && !b.isSensor) b.friction = 0.01;
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
        game.baseGravity *= 0.45;
        engine.gravity.y *= 0.45;
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
            for (const b of Composite.allBodies(world)) {
              if (b.isStatic || b.isSensor) continue;
              Body.setVelocity(b, { x: b.velocity.x + rand(-1.6, 1.6), y: b.velocity.y - rand(0, 1.2) });
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
        for (const b of Composite.allBodies(m.composite)) {
          if (b.isStatic && !b.isSensor) b.restitution = 0.9;
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
            const b = Bodies.circle(side < 0 ? -14 : W + 14, rand(80, 300), 9, { density: 2e-3, friction: 0.5, restitution: 0.4, label: "critter" });
            b.critter = { hopAt: 0, dir: -side, hop: 6, speed: 4 };
            summon(b, { life: 22e3, color: pick(["#9be15d", "#e15d5d", "#c084fc"]), contactDamage: 6 });
            Body.setVelocity(b, { x: -side * 4, y: 0 });
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
  function rollEnvEvent(now) {
    game.envEvent = null;
    if (simRandom() >= ENV_EVENT_CHANCE) return;
    const def = pick(ENV_EVENTS);
    game.envEvent = { def, announced: false };
    def.start?.(currentMap, now);
  }

  // src/sim/maps/builders.js
  var MAPS = [];
  function defineMap(def) {
    MAPS.push(def);
  }
  function addBody(m, body, color) {
    if (color) body.render.fillStyle = color;
    Composite.add(m.composite, body);
    return body;
  }
  function addStatic(m, x, y, w, h, opts = {}) {
    const b = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      friction: opts.friction ?? 0.6,
      restitution: opts.restitution ?? 0,
      angle: opts.angle ?? 0,
      label: opts.label || "terrain"
    });
    b.w = w;
    b.h = h;
    return addBody(m, b, opts.color || "#171221");
  }
  function addDestructible(m, x, y, w, h, opts = {}) {
    const b = Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.6, restitution: opts.rest ?? 0, angle: opts.angle ?? 0, label: "destructible" });
    b.w = w;
    b.h = h;
    b.maxHp = opts.hp ?? 45;
    b.hp = b.maxHp;
    b.dcolor = opts.color || "#6b4a2a";
    b.debrisN = opts.debris ?? 4;
    b.kind = opts.kind || "wood";
    return addBody(m, b, b.dcolor);
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
    Composite.remove(currentMap.composite, b);
    (currentMap.data.broken ||= []).push([Math.round(x), Math.round(y)]);
    spawnParticles(x, y, b.dcolor, 16, 6, 40);
    for (let i = 0; i < (b.debrisN || 4); i++) {
      const g = Bodies.rectangle(x + rand(-b.w / 3, b.w / 3), y + rand(-b.h / 3, b.h / 3), rand(6, 13), rand(6, 13), { density: 1e-3, frictionAir: 0.02, label: "gib" });
      g.color = b.dcolor;
      g.dieAt = simNow() + 2600;
      Body.setVelocity(g, { x: rand(-6, 6), y: rand(-9, -2) });
      Body.setAngularVelocity(g, rand(-0.5, 0.5));
      gibs.add(g);
      Composite.add(world, g);
    }
    explode(x, y, 80, 10, 9, null);
    if (b.kind === "ice") {
      const now = simNow();
      for (const q of players) {
        if (!q.alive) continue;
        if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 100) {
          q.frozenUntil = Math.max(q.frozenUntil || 0, now + 450);
          q.body.frictionAir = 1e-3;
        }
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
    m.data.lavaBody = Bodies.rectangle(W / 2, y + 30, W * 2, 60, { isStatic: true, isSensor: true, label: "lava" });
    Composite.add(m.composite, m.data.lavaBody);
  }
  function buildCrateStack(m, cx, bottomY, cols, rows) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const crate = Bodies.rectangle(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody(m, crate, "#b08948");
      }
    }
  }
  function buildCratePyramid(m, cx, bottomY, baseCols) {
    for (let row = 0; row < baseCols; row++) {
      const cols = baseCols - row;
      for (let col = 0; col < cols; col++) {
        const crate = Bodies.rectangle(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody(m, crate, "#b08948");
      }
    }
  }
  function buildBridge(m, x0, x1, y) {
    const n = 9, step = (x1 - x0) / n;
    let prev = null;
    for (let i = 0; i < n; i++) {
      const plank = Bodies.rectangle(x0 + step * (i + 0.5), y, Math.abs(step) - 4, 10, { density: 2e-3, friction: 0.5, label: "plank" });
      addBody(m, plank, "#8a6f4d");
      const link = prev ? Constraint.create({ bodyA: prev, bodyB: plank, pointA: { x: step / 2, y: 0 }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 }) : Constraint.create({ bodyB: plank, pointA: { x: x0, y }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 });
      link.label = "breakable";
      Composite.add(m.composite, link);
      prev = plank;
    }
    const end = Constraint.create({ bodyA: prev, pointA: { x: step / 2, y: 0 }, pointB: { x: x1, y }, stiffness: 0.9, length: 4 });
    end.label = "breakable";
    Composite.add(m.composite, end);
  }
  function addSeesaw(m, x, y, w = 220) {
    const plank = Bodies.rectangle(x, y, w, 12, { density: 4e-3, friction: 0.6, label: "plank" });
    plank.w = w;
    plank.h = 12;
    addBody(m, plank, "#8a6f4d");
    const pivot = Constraint.create({ pointA: { x, y }, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0 });
    pivot.label = "pivot";
    Composite.add(m.composite, pivot);
    addStatic(m, x, y + 34, 14, 44);
  }
  function addChandelier(m, x, topY, dropLen, r = 26) {
    const ball = Bodies.circle(x, topY + dropLen, r, { density: 8e-3, friction: 0.4, label: "ball" });
    addBody(m, ball, "#100c18");
    const rope = Constraint.create({ pointA: { x, y: topY }, bodyB: ball, stiffness: 0.95, length: dropLen });
    rope.label = "breakable";
    Composite.add(m.composite, rope);
  }
  function addHangingPlatform(m, x, topY, dropLen, w = 150) {
    const plat = Bodies.rectangle(x, topY + dropLen, w, 14, { density: 3e-3, friction: 0.6, label: "plank" });
    plat.w = w;
    plat.h = 14;
    addBody(m, plat, "#8a6f4d");
    for (const side of [-1, 1]) {
      const rope = Constraint.create({
        pointA: { x: x + side * (w / 2 - 10), y: topY },
        bodyB: plat,
        pointB: { x: side * (w / 2 - 10), y: 0 },
        stiffness: 0.9,
        length: dropLen
      });
      rope.label = "breakable";
      Composite.add(m.composite, rope);
    }
  }
  function addBarrels(m, xs, y) {
    for (const x of xs) {
      const b = Bodies.circle(x, y, 14, { density: 2e-3, friction: 0.3, restitution: 0.3, label: "barrel" });
      addBody(m, b, "#7d5a9e");
    }
  }
  function addPendulumBall(m, x, topY, len, r = 45, shove = 14) {
    const ball = Bodies.circle(x, topY + len, r, { density: 0.01, friction: 0.3, restitution: 0.4, label: "ball" });
    addBody(m, ball, "#100c18");
    const chain = Constraint.create({ pointA: { x, y: topY }, bodyB: ball, stiffness: 1, length: len });
    chain.label = "chain";
    Composite.add(m.composite, chain);
    Body.setVelocity(ball, { x: shove, y: 0 });
    (m.data.pendulums ??= []).push(ball);
    return ball;
  }
  function keepPendulumsSwinging(m) {
    for (const b of m.data.pendulums || []) {
      if (Math.hypot(b.velocity.x, b.velocity.y) < 2.5) {
        Body.setVelocity(b, { x: b.velocity.x + (b.position.x < W / 2 ? 1.5 : -1.5), y: b.velocity.y });
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
      Body.setPosition(mv.b, { x: mv.x, y: mv.y + Math.sin(now / mv.period * Math.PI * 2 + mv.phase) * mv.ay });
    }
  }
  function addBumper(m, x, y, r = 22) {
    const b = Bodies.circle(x, y, r, { isStatic: true, restitution: 1.4, label: "bouncy" });
    return addBody(m, b, "#ff8fc7");
  }
  function addIcicles(m, xs, y = 80) {
    m.data.icicles = [];
    for (const x of xs) {
      const ice = Bodies.polygon(x, y, 3, 24, { isStatic: true, density: 8e-3, angle: Math.PI / 2, label: "icicle" });
      addBody(m, ice, "#bfe8ff");
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
        Body.setStatic(ic.body, false);
        Body.setVelocity(ic.body, { x: 0, y: 2 });
      } else if (simRandom() < 0.3) {
        particles.push({ kind: "square", x: ix + rand(-8, 8), y: ic.body.position.y + 20, vx: 0, vy: 1, life: 20, maxLife: 20, color: "#bfe8ff", r: 2 });
      }
    }
  }
  function applyWind(fx) {
    for (const b of Composite.allBodies(world)) {
      if (b.isStatic || b.isSensor) continue;
      Body.setVelocity(b, { x: b.velocity.x + fx, y: b.velocity.y });
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
        const crate = Bodies.rectangle(rand(100, W - 100), -40, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody(m, crate, "#b08948");
      }
    }
  }
  function updateBoulders(m, now, interval = 5e3) {
    if (now > (m.data.nextBoulder || (m.data.nextBoulder = now + 2500))) {
      m.data.nextBoulder = now + interval;
      const side = pick([-1, 1]);
      const rock = Bodies.circle(side < 0 ? -20 : W + 20, m.data.boulderY ?? 100, 24, { density: 0.01, friction: 0.4, restitution: 0.2, label: "ball" });
      addBody(m, rock, "#5a5245");
      Body.setVelocity(rock, { x: -side * rand(8, 14), y: 0 });
    }
  }
  function isLeafy(hex) {
    if (typeof hex !== "string" || hex[0] !== "#") return false;
    return parseInt(hex.slice(3, 5), 16) > parseInt(hex.slice(1, 3), 16) + 20;
  }

  // src/sim/player/status.js
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

  // src/sim/player/controller.js
  function gravDirFor(p) {
    if (p && simNow() < (p.gravityLockUntil || 0)) return p.gravityLockDir;
    return engine.gravity.y < 0 ? -1 : 1;
  }
  function grounded(p) {
    const { x, y } = p.body.position;
    const s = p.sizeScale || 1;
    const dir = gravDirFor(p);
    const y0 = y + 14 * s * dir, y1 = y + 22 * s * dir;
    const below = Query.region(Composite.allBodies(world), {
      min: { x: x - 11 * s, y: Math.min(y0, y1) },
      max: { x: x + 11 * s, y: Math.max(y0, y1) }
    });
    return below.some((b) => b !== p.body && b.label !== "projectile" && b.label !== "lava" && b.label !== "gib" && b.collisionFilter.mask !== 0);
  }

  // src/sim/spells/core.js
  var projectiles = /* @__PURE__ */ new Set();
  var activeEffects = [];
  var summons = /* @__PURE__ */ new Set();
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
    const fb = Bodies.circle(x + dir.x * 28, y - 6 + dir.y * 16, r, {
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
    Body.setVelocity(fb, { x: dir.x * spd, y: dir.y * spd });
    projectiles.add(fb);
    Composite.add(world, fb);
    return fb;
  }
  function dropProjectile(p, x, y, { r = 10, vx = 0, vy = 12, color, density = 4e-3, expireMs = 6e3 }) {
    if (engine.gravity.y < 0) {
      y = H - y;
      vy = -vy;
    }
    const fb = Bodies.circle(x, y, r, { density, frictionAir: 0, label: "projectile" });
    fb.owner = p;
    fb.color = color;
    fb.gravityScale = 1;
    fb.expireAt = simNow() + expireMs;
    Body.setVelocity(fb, { x: vx, y: vy });
    projectiles.add(fb);
    Composite.add(world, fb);
    return fb;
  }
  function removeProjectile(fb) {
    projectiles.delete(fb);
    Composite.remove(world, fb);
  }
  function summon(body, { life = 5e3, color, ...flags } = {}) {
    if (color) body.render.fillStyle = color;
    Object.assign(body, flags);
    body.dieAt = simNow() + life;
    summons.add(body);
    Composite.add(world, body);
    return body;
  }
  function removeSummon(b) {
    if (!summons.has(b)) return;
    summons.delete(b);
    spawnParticles(b.position.x, b.position.y, b.render.fillStyle || "#e8d5ff", 6, 3, 20);
    Composite.remove(world, b);
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
    for (const body of Composite.allBodies(world)) {
      const dx = body.position.x - x, dy = body.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d > radius || d === 0) continue;
      if (body.label === "boss" && damage && owner !== "boss") {
        damageBoss(damage * (1 - d / (radius * 1.15)) * 1.2, body.position, owner);
      }
      if (body.isStatic) {
        if (body.label === "icicle") body._blast = true;
        if (body.label === "destructible" && damage) damageDestructible(body, damage * (1 - d / (radius * 1.1)));
        continue;
      }
      const s = 1 - d / radius;
      Body.setVelocity(body, {
        x: body.velocity.x + dx / d * power * s,
        y: body.velocity.y + dy / d * power * s - 4 * s
      });
      Body.setAngularVelocity(body, body.angularVelocity + (simRandom() - 0.5) * 0.4);
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
    for (const c of Composite.allConstraints(currentMap.composite)) {
      if (c.label !== "breakable") continue;
      const pos = (c.bodyA || c.bodyB).position;
      if (Math.hypot(pos.x - x, pos.y - y) < radius * 0.75) Composite.remove(currentMap.composite, c);
    }
  }
  function raycastHit(p, angOff = 0) {
    let dir = aimDir(p, 1, 0);
    if (angOff) {
      const a = Math.atan2(dir.y, dir.x) + angOff;
      dir = { x: Math.cos(a), y: Math.sin(a) };
    }
    const from = { x: p.body.position.x + dir.x * 22, y: p.body.position.y - 6 + dir.y * 14 };
    const candidates = Composite.allBodies(world).filter((b) => b !== p.body && !b.isSensor && b.label !== "gib" && b.label !== "projectile" && b.collisionFilter.mask !== 0);
    for (let d = 0; d < 1400; d += 10) {
      const pt = { x: from.x + dir.x * d, y: from.y + dir.y * d };
      if (pt.x < -40 || pt.x > W + 40 || pt.y < -60 || pt.y > H + 40) break;
      const hit = Query.point(candidates, pt)[0];
      if (hit) return { hit, pt, from, dir };
    }
    return { hit: null, pt: { x: from.x + dir.x * 1400, y: from.y + dir.y * 1400 }, from, dir };
  }
  function baseBoltVisual(x0, y0, x1, y1, color = "#fff89e", width = 3, life = 130) {
    const pts = [{ x: x0, y: y0 }];
    const segs = 9;
    for (let i = 1; i <= segs; i++) {
      pts.push({
        x: x0 + (x1 - x0) * i / segs + (i < segs ? rand(-14, 14) : 0),
        y: y0 + (y1 - y0) * i / segs + (i < segs ? rand(-14, 14) : 0)
      });
    }
    activeEffects.push({
      until: simNow() + life,
      draw(now, ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    });
  }
  function groundYAt(x) {
    const candidates = Composite.allBodies(world).filter((b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0);
    for (let y = 0; y < H; y += 12) {
      if (Query.point(candidates, { x, y })[0]) return y;
    }
    return H - 30;
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
      update() {
        const R = 350 * (1 + (m - 1) * 0.5);
        for (const b of Composite.allBodies(world)) {
          if (b.isStatic || b.isSensor) continue;
          const dx = x - b.position.x, dy = y - b.position.y;
          const d = Math.hypot(dx, dy);
          if (d > R || d === 0) continue;
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
              Composite.remove(world, b, true);
            }
            continue;
          }
          const s = 1 - d / R;
          const pull = 0.9 * s, tang = 0.35 * s;
          Body.setVelocity(b, {
            x: b.velocity.x + dx / d * pull + -dy / d * tang,
            y: b.velocity.y + dy / d * pull + dx / d * tang
          });
        }
        for (const c of Composite.allConstraints(currentMap.composite)) {
          if (c.label !== "breakable") continue;
          const pos = (c.bodyA || c.bodyB).position;
          if (Math.hypot(pos.x - x, pos.y - y) < 140) Composite.remove(currentMap.composite, c);
        }
        if (simRandom() < 0.6) {
          const a = rand(0, Math.PI * 2), dd = rand(60, 180);
          particles.push({ kind: "square", x: x + Math.cos(a) * dd, y: y + Math.sin(a) * dd, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4, life: 16, maxLife: 16, color: "#a55eea", r: 2.5 });
        }
      },
      draw(now, ctx) {
        ctx.fillStyle = "#0a0510";
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#a55eea";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
        ctx.beginPath();
        ctx.arc(x, y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      },
      onEnd() {
        explode(x, y, 160, 18, 25, owner, opts);
      }
    });
  }
  function makeZone({ x, y, r, life, color, tick: tick2, tickBody, draw, onEnd }) {
    activeEffects.push({
      until: simNow() + life,
      x,
      y,
      r,
      net: { k: "zone", x, y, r, c: color },
      update(now) {
        if (tick2) {
          for (const q of players) {
            if (!q.alive) continue;
            if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < r) tick2(q, now);
          }
        }
        if (tickBody) {
          for (const b of Composite.allBodies(world)) {
            if (b.isStatic || b.isSensor) continue;
            if (Math.hypot(b.position.x - x, b.position.y - y) < r) tickBody(b, now);
          }
        }
      },
      draw(now, ctx) {
        if (draw) {
          draw(now, ctx);
          return;
        }
        ctx.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      },
      onEnd
    });
  }
  var CAST_FLOOR = 480;
  var boltVisual = baseBoltVisual;
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
  function boomBolt(p, o = {}) {
    const m = p.mega || 1;
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
  function statusBolt(p, o, apply) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: (o.r ?? 6) * m, speed: o.speed ?? 18, vy: o.vy ?? -5, color: o.color, gravityScale: o.g ?? 0.5 });
    fb.onHit = (self, other) => {
      spawnParticles(self.position.x, self.position.y, o.color, 10, 4);
      if (o.dmg && other && other.label === "player") damagePlayer(other.player, o.dmg * m, p);
      if (other && other.label === "player" && other.player.alive) apply(other.player, m);
    };
    return fb;
  }
  function zapRay(p, dmg, imp, width = 3, angOff = 0) {
    const m = p.mega || 1;
    const { hit, pt, from, dir } = raycastHit(p, angOff);
    boltVisual(from.x, from.y, pt.x, pt.y, "#fff89e", width * m);
    spawnParticles(pt.x, pt.y, "#fff89e", 10, 5);
    if (hit && !hit.isStatic) {
      Body.setVelocity(hit, { x: hit.velocity.x + dir.x * imp * m, y: hit.velocity.y + dir.y * imp * m - imp * 0.2 * m });
      if (hit.label === "player") zapHit(hit.player, dmg * m, p);
    }
    return { hit, pt };
  }
  function summonCritter(p, o = {}) {
    const b = Bodies.circle(
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
        Body.setVelocity(self, {
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
          Body.setVelocity(self, { x: -self.velocity.x, y: self.velocity.y - 2 });
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
      fb.update = (self, now) => Body.setVelocity(self, { x: self.velocity.x, y: Math.sin(now * 0.02) * 6 });
    }
  });
  regSpell("landmine", {
    name: "Landmine",
    color: "#b8b8b8",
    cooldown: 2e3,
    cast(p) {
      const m = p.mega || 1;
      const b = Bodies.rectangle(p.body.position.x + p.facing * 30, p.body.position.y + 8, 16, 8, { density: 3e-3, friction: 0.9, label: "mine" });
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
        Body.setStatic(fb, true);
        activeEffects.push({
          until: simNow() + 900,
          draw(now, ctx) {
            ctx.fillStyle = Math.sin(now * 0.03) > 0 ? "#aef05a" : "#fff";
            ctx.beginPath();
            ctx.arc(fb.position.x, fb.position.y, 4, 0, Math.PI * 2);
            ctx.fill();
          },
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
      let i = 0;
      activeEffects.push({
        until: t0 + 720,
        update(now) {
          if (now > t0 + i * 120 && i < 6 && p.alive) {
            i++;
            boomBolt(p, { color: "#ff5e3a", r: 4, speed: rand(19, 25), vy: rand(-4, 0), g: 0.3, radius: 65, power: 9, dmg: 9 });
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
      Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 5, y: p.body.velocity.y });
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
        Body.setVelocity(best.body, { x: best.body.velocity.x + rand(-6, 6), y: best.body.velocity.y - 8 });
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
        draw(now, ctx) {
          ctx.strokeStyle = "#fff89e";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(now * 0.02));
          ctx.beginPath();
          ctx.arc(x, gy - 8, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        },
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
      for (const b of [...Composite.allBodies(world)]) {
        if (b.isStatic || b.isSensor || b === p.body) continue;
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
        Composite.remove(world, b, true);
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
      Body.setVelocity(p.body, { x: p.body.velocity.x - dir.x * 8, y: p.body.velocity.y - dir.y * 5 });
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor || b === p.body) continue;
        const rx = b.position.x - x, ry = b.position.y - (y - 6);
        const t = rx * dir.x + ry * dir.y;
        if (t < 0 || t > 1500) continue;
        if (Math.abs(rx * dir.y - ry * dir.x) > 28) continue;
        Body.setVelocity(b, { x: b.velocity.x + dir.x * 30 * m, y: b.velocity.y + dir.y * 30 * m - 4 });
        if (b.label === "player") damagePlayer(b.player, 40 * m);
      }
    }
  });
  regSpell("shove", { name: "Shove", color: "#f0e6d2", cooldown: 500, cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p, 130);
    if (t) {
      Body.setVelocity(t.body, { x: t.body.velocity.x + p.facing * 26 * m, y: t.body.velocity.y - 6 });
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor || b === p.body) continue;
        const dx = b.position.x - x, dy = b.position.y - y;
        const d = Math.hypot(dx, dy);
        if (d > 220 * m || d === 0) continue;
        const s = (1 - d / (220 * m)) * 20 * m;
        Body.setVelocity(b, { x: b.velocity.x + dx / d * s, y: b.velocity.y + dy / d * s - 4 });
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor || b === p.body) continue;
        const dx = x - b.position.x, dy = y - b.position.y;
        const d = Math.hypot(dx, dy);
        if (d > 260 * m || d === 0) continue;
        const s = (1 - d / (260 * m)) * 16 * m;
        Body.setVelocity(b, { x: b.velocity.x + dx / d * s, y: b.velocity.y + dy / d * s - 2 });
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        if (Math.abs(b.position.x - x) > 130 * m) continue;
        Body.setVelocity(b, { x: b.velocity.x, y: b.velocity.y - 18 * m });
      }
      for (let i = 0; i < 16; i++) particles.push({ kind: "spark", x: x + rand(-100, 100), y: rand(100, H - 60), vx: 0, vy: -rand(8, 14), life: 20, maxLife: 20, color: "#e0ffff", r: 2 });
    }
  });
  regSpell("slam", {
    name: "Seismic Slam",
    color: "#d1a054",
    cooldown: 2200,
    cast(p) {
      const m = p.mega || 1;
      Body.setVelocity(p.body, { x: p.body.velocity.x, y: 30 });
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
          Body.setVelocity(q.body, { x: q.body.velocity.x + dx / d * 2.4, y: q.body.velocity.y + dy / d * 1.2 });
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
      Body.setVelocity(t.body, { x: dx / d * 18, y: dy / d * 18 - 3 });
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
          for (const b of Composite.allBodies(world)) {
            if (b.isStatic || b.isSensor) continue;
            const dx = b.position.x - e.x;
            if (Math.abs(dx) > 120 * m) continue;
            Body.setVelocity(b, { x: b.velocity.x - Math.sign(dx) * 0.9 + rand(-0.5, 0.5), y: b.velocity.y - 1.5 * m });
          }
        },
        draw(now, ctx) {
          ctx.strokeStyle = "rgba(207,232,232,0.55)";
          ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) {
            const yy = H - 80 - i * 90;
            const w = 26 + i * 22;
            ctx.beginPath();
            ctx.ellipse(e.x + Math.sin(now * 0.01 + i) * 8, yy, w, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      };
      activeEffects.push(e);
    }
  });
  regSpell("iceshard", { name: "Ice Shard", color: "#bfe8ff", cooldown: 400, cast(p) {
    statusBolt(p, { color: "#bfe8ff", r: 4, speed: 23, vy: -2, dmg: 12 }, (q) => {
      q.frozenUntil = simNow() + 450;
    });
  } });
  regSpell("glacier", {
    name: "Glacier",
    color: "#9be7ff",
    cooldown: 2600,
    cast(p) {
      const m = p.mega || 1;
      const pos = frontPos(p, 70);
      const wall = Bodies.rectangle(pos.x, pos.y - 30, 26 * m, 120 * m, { isStatic: true, friction: 0.01, label: "wall" });
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
          q.frozenUntil = Math.max(q.frozenUntil, now + 200);
          if (simRandom() < 0.02) damagePlayer(q, 3);
        },
        draw(now, ctx) {
          ctx.globalAlpha = 0.14;
          ctx.fillStyle = "#d8f4ff";
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 240 * m, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          for (let i = 0; i < 3; i++) particles.push({ kind: "square", x: pos.x + rand(-220, 220), y: pos.y + rand(-200, 100), vx: rand(-1, 1), vy: rand(1, 3), life: 24, maxLife: 24, color: "#fff", r: 2 });
        }
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
    for (const q of enemiesOf(p)) {
      q.frozenUntil = simNow() + 800 * m;
      q.body.frictionAir = 1e-3;
    }
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
          q.frozenUntil = simNow() + 1200 * m;
          q.body.frictionAir = 1e-3;
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
        const ice = Bodies.polygon(q.body.position.x + rand(-20, 20), Math.max(30, q.body.position.y - 260), 3, 16 * m, { angle: Math.PI / 2, density: 6e-3, label: "critter" });
        summon(ice, { life: 3e3, color: "#bfe8ff", contactDamage: 25 * m });
        Body.setVelocity(ice, { x: 0, y: 6 });
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
        q.frozenUntil = simNow() + 1e3 * m;
        q.body.frictionAir = 1e-3;
        sfx.freeze();
      });
    }
  });
  regSpell("permafrost", { name: "Permafrost", color: "#7fd4ff", cooldown: 2800, cast(p) {
    statusBolt(p, { color: "#7fd4ff", r: 9, speed: 10, vy: -3, dmg: 20 }, (q, m) => {
      q.frozenUntil = simNow() + 2600 * m;
      q.body.frictionAir = 1e-3;
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
      Body.setVelocity(p.body, { x: dir.x * 25, y: dir.y * 25 - 2 });
      p.invulnUntil = simNow() + 600;
      for (let i = 0; i < 20; i++) particles.push({ kind: "spark", x: p.body.position.x - dir.x * i * 4, y: p.body.position.y - dir.y * i * 4 + rand(-8, 8), vx: -dir.x * rand(2, 6), vy: rand(-2, 2), life: 22, maxLife: 22, color: "#ffb347", r: 2.5 });
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
          Body.setVelocity(self, { x: self.velocity.x * 0.92 + dx / d * 1.6, y: self.velocity.y * 0.92 + dy / d * 1.6 });
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
      Body.setPosition(p.body, { x: nx, y: ny });
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
      Body.setVelocity(p.body, { x: p.body.velocity.x, y: -26 });
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
      Body.setPosition(p.body, b);
      Body.setPosition(t.body, a);
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
      Body.setPosition(p.body, { x: nx, y: p.body.position.y - 10 });
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
        const crate = Bodies.rectangle(pos.x + (i - 1) * 34, -40 - i * 30, 26, 26, { density: 3e-3, friction: 0.4, label: "crate" });
        crate.owner = p;
        summon(crate, { life: 9e3, contactDamage: 14 });
        Body.setVelocity(crate, { x: 0, y: 9 });
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
      const anvil = Bodies.rectangle(x, -40, 44 * m, 26 * m, { density: 0.02, friction: 0.8, label: "anvil" });
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
      const piano = Bodies.rectangle(x, -60, 84 * m, 44 * m, { density: 0.018, friction: 0.8, label: "piano" });
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
        const ball = Bodies.circle(p.body.position.x + p.facing * (50 + i * 30), p.body.position.y - 40 - i * 20, 14, { density: 1e-3, restitution: 1.35, friction: 0.01, label: "bouncy" });
        ball.owner = p;
        summon(ball, { life: 6e3, color: "#ffb3de", contactDamage: 13 });
        Body.setVelocity(ball, { x: p.facing * rand(6, 12), y: -rand(3, 9) });
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
      const wall = Bodies.rectangle(pos.x, pos.y - 30, 30 * m, 130 * m, { isStatic: true, friction: 0.6, label: "wall" });
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
      const tramp = Bodies.rectangle(pos.x, gy - 8, 100, 14, { isStatic: true, restitution: 0.4, friction: 0.1, label: "tramp" });
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
        const d = Bodies.circle(p.body.position.x + dir * 40, p.body.position.y - 10, 15, { density: 4e-3, friction: 0.05, restitution: 0.2, label: "decoy" });
        d.decoyOf = p;
        summon(d, { life: 5e3 });
        Body.setVelocity(d, { x: dir * rand(3, 7), y: -5 });
      }
    }
  });
  regSpell("beehive", {
    name: "Beehive",
    color: "#e8b647",
    cooldown: 4200,
    cast(p) {
      const pos = frontPos(p, 120);
      const hive = Bodies.rectangle(pos.x, pos.y - 20, 22, 26, { density: 2e-3, friction: 0.6, label: "hive" });
      summon(hive, { life: 3e3, color: "#e8b647" });
      const t0 = simNow();
      let i = 0;
      activeEffects.push({
        until: t0 + 2200,
        update(now) {
          if (now > t0 + i * 260 && i < 8) {
            i++;
            const bee = shoot(p, { r: 2.5, speed: rand(4, 7), vy: rand(-6, -2), color: "#ffe066", gravityScale: 0, expireMs: 3e3 });
            Body.setPosition(bee, { x: hive.position.x, y: hive.position.y - 10 });
            bee.onHit = (self, other) => {
              if (other && other.label === "player") damagePlayer(other.player, 7, p);
            };
            bee.update = (self) => {
              const t = nearestEnemy(p, 1e9, self.position);
              if (!t) return;
              const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
              const d = Math.hypot(dx, dy) || 1;
              Body.setVelocity(self, { x: self.velocity.x * 0.9 + dx / d * 1.8, y: self.velocity.y * 0.9 + dy / d * 1.8 });
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
      const rock = Bodies.circle(x, -50, 26 * m, { density: 0.012, friction: 0.4, restitution: 0.2, label: "boulderS" });
      summon(rock, { life: 6e3, color: "#5a5245", contactDamage: 35 * m });
    }
  });
  regSpell("sawblade", {
    name: "Sawblade",
    color: "#c0c0cc",
    cooldown: 2400,
    cast(p) {
      const m = p.mega || 1;
      const saw = Bodies.circle(p.body.position.x + p.facing * 36, p.body.position.y, 15 * m, { density: 4e-3, friction: 0.9, restitution: 0.4, label: "saw" });
      saw.owner = p;
      saw.sawDir = p.facing;
      summon(saw, { life: 3500, color: "#c0c0cc", contactDamage: 18 * m });
      Body.setVelocity(saw, { x: p.facing * 13, y: -2 });
      Body.setAngularVelocity(saw, p.facing * 0.9);
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
      p.gravityLockDir = engine.gravity.y < 0 ? -1 : 1;
      p.gravityLockUntil = simNow() + 2500;
      engine.gravity.y = -game.baseGravity;
      doFlash("#c084fc", 0.3);
      setBanner("GRAVITY!", "#c084fc", 1e3);
      activeEffects.push({ until: simNow() + 2500, onEnd() {
        engine.gravity.y = game.baseGravity;
      } });
    }
  });
  regSpell("moongrav", {
    name: "Moon Gravity",
    color: "#d8d8f0",
    cooldown: 6e3,
    cast() {
      engine.gravity.y = game.baseGravity * 0.3;
      setBanner("LOW GRAVITY", "#d8d8f0", 1e3);
      activeEffects.push({ until: simNow() + 4e3, onEnd() {
        engine.gravity.y = game.baseGravity;
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        Body.setVelocity(b, { x: b.velocity.x + rand(-8, 8), y: b.velocity.y - rand(2, 10) });
      }
    }
  });
  regSpell("poltergeist", {
    name: "Poltergeist",
    color: "#b39ddb",
    cooldown: 3600,
    cast(p) {
      const m = p.mega || 1;
      let loose = Composite.allBodies(world).filter((b) => !b.isStatic && !b.isSensor && b.label !== "player" && b.label !== "boss" && Math.hypot(b.position.x - p.body.position.x, b.position.y - p.body.position.y) < 520);
      if (loose.length < 5) {
        for (let i = 0; i < 6; i++) {
          const junk = Bodies.polygon(p.body.position.x + rand(-70, 70), p.body.position.y - rand(20, 90), pick([3, 4, 5, 6]), rand(9, 16), { density: 25e-4, frictionAir: 0.01, label: "ball" });
          junk.color = "#b39ddb";
          junk.owner = p;
          summon(junk, { life: 4e3, color: "#b39ddb", contactDamage: 12 * m });
          loose.push(junk);
        }
      }
      spawnRing(p.body.position.x, p.body.position.y, "#b39ddb");
      for (const b of loose) {
        const t = nearestEnemy(p, 1e9, b.position);
        if (!t) break;
        const dx = t.body.position.x - b.position.x, dy = t.body.position.y - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        Body.setVelocity(b, { x: dx / d * 18, y: dy / d * 18 - 3 });
        if (simRandom() < 0.5) spawnParticles(b.position.x, b.position.y, "#b39ddb", 3, 2, 16);
      }
    }
  });
  regSpell("disarm", { name: "Butterfingers", color: "#f5deb3", cooldown: 4500, cast(p) {
    for (const q of enemiesOf(p)) {
      q.spellId = null;
      spawnText(q.body.position.x, q.body.position.y - 44, "DISARMED", "#f5deb3");
    }
  } });
  regSpell("roulette", {
    name: "Roulette",
    color: "#ff6b81",
    cooldown: 1e3,
    cast(p) {
      const keys = Object.keys(SPELLS).filter((k2) => k2 !== "roulette" && k2 !== "mirrorcast");
      const k = pick(keys);
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
        Body.setPosition(q.body, { x: rand(100, W - 100), y: rand(80, 300) });
        Body.setVelocity(q.body, { x: 0, y: 0 });
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
        particles.push({ kind: "confetti", x: p.body.position.x + p.facing * 20, y: p.body.position.y - 8, vx: p.facing * rand(4, 14), vy: rand(-8, 2), life: 60, maxLife: 60, color: pick(["#4ecdc4", "#ff6b81", "#ffd166", "#a55eea", "#e8d5ff"]), r: 4 });
      }
      const t = nearestEnemy(p, 200 * m);
      if (t && Math.sign(t.body.position.x - p.body.position.x) === p.facing) {
        Body.setVelocity(t.body, { x: t.body.velocity.x + p.facing * 14 * m, y: t.body.velocity.y - 5 });
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
      t.frozenUntil = now + dur;
      t.heavyUntil = now + dur;
      t.body.frictionAir = 1e-3;
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
      const peel = Bodies.rectangle(pos.x, pos.y, 16, 6, { density: 1e-3, friction: 0.05, label: "banana" });
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
        Body.setVelocity(target, { x: dx / d * 20, y: dy / d * 20 - 2 });
        boltVisual(p.body.position.x, p.body.position.y, target.position.x, target.position.y, "#7ae7c7", 2, 100);
        spawnText(p.body.position.x, p.body.position.y - 44, "YOINK!", "#7ae7c7");
      } else {
        const t = nearestEnemy(p, 500);
        if (t) {
          const dx = p.body.position.x - t.body.position.x, dy = p.body.position.y - t.body.position.y;
          const d = Math.hypot(dx, dy) || 1;
          Body.setVelocity(t.body, { x: dx / d * 16, y: dy / d * 16 - 3 });
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
        Body.setVelocity(q.body, { x: q.body.velocity.x, y: -7 });
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
        Body.setVelocity(q.body, { x: q.body.velocity.x, y: 11 });
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
      const id = t && t.spellId && t.spellId !== "mirrorcast" && t.spellId !== "roulette" ? t.spellId : null;
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
      const rod = Bodies.rectangle(pos.x, gy - 40, 8, 80, { isStatic: true, label: "wall" });
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
      const coil = Bodies.rectangle(pos.x, gy - 25, 14, 50, { isStatic: true, label: "wall" });
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
      Body.setAngularVelocity(fb, p.facing * 0.5);
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
        q.frozenUntil = simNow() + 1400 * m;
        q.body.frictionAir = 1e-3;
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
      const d = aimDir(p, 1, 0), base = Math.atan2(d.y, d.x);
      for (let i = 0; i < 18; i++) spawnBurst(p.body.position.x, p.body.position.y - 6, i % 2 ? "#fffacd" : "#ffffff", 2, { kind: "spark", dir: base + rand(-0.35, 0.35), spread: 0.1, speed: 11, r: 2 });
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
      const base = fb.onHit;
      fb.onHit = (self, other) => {
        base?.(self, other);
        if (other?.label === "player" && other.player.alive) {
          other.player.frozenUntil = simNow() + 700 * m;
          other.player.body.frictionAir = 1e-3;
        }
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
        hit.player.frozenUntil = simNow() + 1e3 * m;
        hit.player.body.frictionAir = 1e-3;
      }
      const d = aimDir(p, 1, 0);
      const px = Math.max(30, Math.min(W - 30, pt.x - d.x * 16));
      const pillar = Bodies.rectangle(px, pt.y - 42, 26 * Math.min(m, 1.5), 110 * Math.min(m, 1.5), { isStatic: true, friction: 0.01, label: "wall" });
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
          for (const b of Composite.allBodies(world)) {
            if (b.isStatic || b.isSensor) continue;
            if (b.label === "player" && b.player === p) continue;
            const dx = b.position.x - e.x;
            if (Math.abs(dx) > 110 * m) continue;
            Body.setVelocity(b, { x: b.velocity.x - Math.sign(dx || 1) * 0.8 + rand(-0.5, 0.5), y: b.velocity.y - 1.6 * m });
            if (b.label === "player" && b.player.alive) b.player.burnUntil = Math.max(b.player.burnUntil || 0, now + 900 * m);
          }
        },
        draw(now, ctx) {
          ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) {
            const yy = H - 80 - i * 90, w = 24 + i * 20;
            ctx.strokeStyle = `rgba(255, ${100 + i * 26}, 60, 0.6)`;
            ctx.beginPath();
            ctx.ellipse(e.x + Math.sin(now * 0.013 + i) * 9, yy, w, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
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
          q.frozenUntil = simNow() + 800 * m;
          q.body.frictionAir = 1e-3;
          Body.setVelocity(q.body, { x: q.body.velocity.x + p.facing * 6, y: q.body.velocity.y });
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
      const base = fb.onHit;
      fb.onHit = (self, other) => {
        base?.(self, other);
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
              for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - chunk.position.x, q.body.position.y - chunk.position.y) < 120) {
                q.frozenUntil = Math.max(q.frozenUntil || 0, nw + 700 * m);
                q.body.frictionAir = 1e-3;
              }
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
      Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 8, y: p.body.velocity.y - 4 });
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
        Body.setVelocity(q.body, { x: q.body.velocity.x + dx / d * 9, y: -6 + dy / d * 4 });
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
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 320) {
        q.frozenUntil = simNow() + 1100 * m;
        q.body.frictionAir = 1e-3;
      }
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
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 260) {
        q.frozenUntil = now + 900 * m;
        q.body.frictionAir = 1e-3;
      }
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
        Body.setVelocity(q.body, { x: q.body.velocity.x + p.facing * 7, y: q.body.velocity.y - 2 });
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
      for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 240) Body.setVelocity(q.body, { x: (q.body.position.x - p.body.position.x) * 0.05 + Math.sign(q.body.position.x - p.body.position.x) * 8, y: -7 });
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
          Body.setVelocity(q.body, { x: q.body.velocity.x + dx / d * 10, y: q.body.velocity.y + dy / d * 6 });
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
        if (roll === 0) q.frozenUntil = now + 1e3 * m;
        else if (roll === 1) q.reversedUntil = now + 2500 * m;
        else if (roll === 2) q.shrinkUntil = now + 3500 * m;
        else if (roll === 3) {
          q.floatyUntil = now + 2500 * m;
          Body.setVelocity(q.body, { x: q.body.velocity.x, y: -9 });
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
        q.frozenUntil = now + 700 * m;
        q.reversedUntil = now + 3e3 * m;
        q.body.frictionAir = 1e-3;
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
        Body.setVelocity(q.body, { x: Math.cos(ang) * 10, y: -8 });
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
        draw(now, ctx) {
          ctx.fillStyle = Math.sin(now * 0.025) > 0 ? "#d8b26a" : "#ff5e57";
          ctx.beginPath();
          ctx.arc(cx, gy - 10, 7, 0, Math.PI * 2);
          ctx.fill();
        },
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
        Body.setPosition(q.body, { x: rand(120, W - 120), y: rand(120, 360) });
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
  function scheduleTomes(now) {
    nextTomeAt = now + rand(1200, 2500);
    firstDrop = true;
  }
  function tomeDropSpot() {
    const g = engine.gravity.y;
    const solids = Composite.allBodies(world).filter((b) => (b.isStatic || b.label === "plank") && !b.isSensor && b.collisionFilter.mask !== 0 && b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
    for (let tries = 0; tries < 24; tries++) {
      const x = rand(90, W - 90);
      const col = solids.filter((b) => x > b.bounds.min.x + 6 && x < b.bounds.max.x - 6);
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
    const tome = Bodies.rectangle(spot.x, spot.y, 20, 24, { density: 1e-3, frictionAir: 0.05, label: "tome" });
    tome.spell = spell;
    tome.bornAt = now;
    tomes.add(tome);
    Composite.add(world, tome);
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
      chaos: false
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
      chaos: false
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
      chaos: false
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
      chaos: false
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
      chaos: true
    }
  };
  var PERSONA_ORDER = ["berserker", "skirmisher", "alchemist", "trickster", "balanced"];
  var nextPersona = 0;
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
    // lookahead scales with current speed — a sprinting bot needs to brake sooner
    fallDanger(me, dir, vx = 0) {
      const aheadX = Math.max(20, Math.min(W - 20, me.x + dir * (42 + Math.abs(vx) * 10)));
      const gAhead = groundYAt(aheadX);
      const lava = currentMap.data.lavaY;
      if (lava != null && gAhead > lava - 24) return true;
      if (gAhead >= H - 31) return true;
      return gAhead - me.y > 300;
    }
    // nearest direction with real footing within reach (used mid-air over death)
    safeGroundDir(me, lavaY) {
      for (let d = 60; d <= 380; d += 64) {
        for (const dir of [-1, 1]) {
          const x = me.x + dir * d;
          if (x < 30 || x > W - 30) continue;
          const g = groundYAt(x);
          if (g < H - 31 && (lavaY == null || g < lavaY - 24) && g - me.y < 300) return dir;
        }
      }
      return 0;
    }
    think(p, now) {
      const me = p.body.position;
      const lavaY = currentMap.data.lavaY;
      if (now - (p.lastGround || 0) >= 220) {
        const gBelow = groundYAt(me.x);
        if (lavaY != null && gBelow > lavaY - 24 || gBelow >= H - 31) {
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
      const fleeing = m.fleeHp && p.hp < m.fleeHp && goal === tpos && tpos;
      let move = 0;
      if (goal) {
        const dx = goal.x - me.x;
        const d = goal === tpos ? Math.hypot(tpos.x - me.x, tpos.y - me.y) : 1e9;
        if (fleeing) move = -Math.sign(dx || 1);
        else if (goal === tpos && m.standoff && d < m.standoff - 60) move = -Math.sign(dx || 1);
        else if (Math.abs(dx) > 46 && !(goal === tpos && m.standoff && d < m.standoff + 60)) move = Math.sign(dx);
        else if (goal === tpos && simRandom() < m.keepDist) move = -Math.sign(dx || 1);
      } else if (simRandom() < 0.12) {
        move = pick([-1, 0, 1]);
      }
      if (m.chaos && simRandom() < 0.2) move = pick([-1, 0, 1]);
      if (me.x < 80) move = 1;
      if (me.x > W - 80) move = -1;
      const grounded2 = now - (p.lastGround || 0) < 220;
      let jump = false;
      if (currentMap.data.lavaY != null && me.y > currentMap.data.lavaY - 60) jump = true;
      if (move && this.fallDanger(me, move, p.body.velocity.x)) {
        const landX = Math.max(24, Math.min(W - 24, me.x + move * 135));
        const gLand = groundYAt(landX);
        const lava = currentMap.data.lavaY;
        const safeLanding = (lava == null || gLand < lava - 24) && gLand - me.y < 240 && gLand - me.y > -140;
        if (safeLanding && grounded2) jump = true;
        else move = 0;
      }
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
  onWorldReset(() => {
    for (const k of Object.keys(spellTally)) delete spellTally[k];
    for (const k of Object.keys(matchSpellTally)) delete matchSpellTally[k];
  });

  // src/sim/maps/extras.js
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
        const big = Bodies.rectangle(s.x, s.y - 24, 42, 42, { density: 4e-3, friction: 0.6, label: "crate" });
        addBody(m, big, "#9a7440");
      }
    }
  }
  var GAP_MAX = 190;
  var GAP_STEP = 165;
  function ensureTraversable(m, rng) {
    if ((m.def.gravity ?? 2) < 0) return;
    const rr = (a, b) => a + rng() * (b - a);
    const walkable = Composite.allBodies(m.composite).filter((b) => !b.isSensor && b.label !== "spikes" && b.collisionFilter.mask !== 0 && (b.isStatic || b.label === "plank") && b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
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
    const have = Composite.allBodies(m.composite).filter((b) => b.label === "destructible").length;
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

  // src/sim/storage.js
  var NO_STORAGE = { getItem: () => null, setItem() {
  }, removeItem() {
  } };
  var storage = NO_STORAGE;

  // src/sim/waves.js
  var pendingSpawns = [];
  function clearEnemies() {
    for (const b of [...enemies]) removeSummon(b);
    enemies.clear();
    pendingSpawns = [];
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
  var currentMap = null;
  var banner = "";
  var bannerColor = "#fff";
  var bannerUntil = 0;
  var bannerHyper = false;
  function baseSetBanner(text, color, ms = 1400, hyper = false) {
    banner = text;
    bannerColor = color;
    bannerUntil = simNow() + ms;
    bannerHyper = hyper;
  }
  function loadMap(index) {
    for (const fb of projectiles) Composite.remove(world, fb);
    projectiles.clear();
    for (const g of gibs) Composite.remove(world, g);
    gibs.clear();
    for (const t of tomes) Composite.remove(world, t);
    tomes.clear();
    for (const h of hats) Composite.remove(world, h);
    hats.clear();
    for (const s of summons) Composite.remove(world, s);
    summons.clear();
    activeEffects.length = 0;
    particles.length = 0;
    if (currentMap) Composite.remove(world, currentMap.composite);
    const def = MAPS[index];
    const m = { def, composite: Composite.create(), data: {} };
    for (const x of [-30, W + 30]) {
      const wall = Bodies.rectangle(x, H / 2, 60, H * 3, { isStatic: true });
      wall.render.fillStyle = "#171221";
      Composite.add(m.composite, wall);
    }
    def.build(m);
    game.mapSeed = simRandom() * 4294967295 >>> 0;
    m.data.seed = game.mapSeed;
    buildMapExtras(m, game.mapSeed);
    reseed(game.mapSeed ^ 2654435769);
    if (def.stars) {
      m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
    }
    Composite.add(world, m.composite);
    currentMap = m;
    game.mapIndex = index;
    game.baseGravity = def.gravity ?? 2;
    engine.gravity.y = game.baseGravity;
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
      spawnPlayer(p, spawnPointFor(p));
    }
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
  var setBanner = baseSetBanner;
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

  // src/sim/player/lifecycle.js
  function groundInColumn(x) {
    return Composite.allBodies(currentMap.composite).some((b) => b.isStatic && !b.isSensor && b.label !== "lava" && b.collisionFilter.mask !== 0 && x > b.bounds.min.x + 6 && x < b.bounds.max.x - 6 && b.bounds.min.y > 100);
  }
  function spawnPointFor(p) {
    const spawns = currentMap.def.spawns;
    const base = spawns[p.slot % spawns.length];
    const jitter = p.slot >= spawns.length ? (p.slot - spawns.length + 1) * 26 * (p.slot % 2 ? 1 : -1) : 0;
    if (!groundInColumn(base.x + jitter)) {
      const spot = platformSpots(currentMap, 3).find((s) => groundInColumn(s.x));
      if (spot) return { x: spot.x, y: Math.max(80, spot.y - 150) };
    }
    return { x: Math.max(40, Math.min(W - 40, base.x + jitter)), y: base.y };
  }
  var players = [];
  var gibs = /* @__PURE__ */ new Set();
  var MAX_HP = 150;
  function setPlayerScale(p, target) {
    const ratio = target / p.sizeScale;
    if (Math.abs(ratio - 1) < 0.01) return;
    Body.scale(p.body, ratio, ratio);
    p.sizeScale = target;
    spawnParticles(p.body.position.x, p.body.position.y, "#e8d5ff", 6, 3);
  }
  function spawnPlayer(p, pos) {
    if (!p.alive) Composite.add(world, p.body);
    p.alive = true;
    p.hp = MAX_HP;
    p.airJumps = 1;
    p.fallPeak = 0;
    p.gravityLockUntil = 0;
    p.ghost = null;
    p.lastHitBy = null;
    clearStatuses(p);
    setPlayerScale(p, 1);
    p.body.frictionAir = 0.02;
    Body.setPosition(p.body, pos);
    Body.setVelocity(p.body, { x: 0, y: 0 });
    Body.setAngularVelocity(p.body, 0);
    Body.setAngle(p.body, 0);
    spawnParticles(pos.x, pos.y, "#e8d5ff", 12, 5);
  }
  function despawnPlayer(p) {
    if (!p.alive) return;
    Composite.remove(world, p.body);
    p.alive = false;
  }
  function healPlayer(p, amt) {
    if (!p.alive) return;
    p.hp = Math.min(MAX_HP, p.hp + amt);
    spawnText(p.body.position.x, p.body.position.y - 34, `+${Math.round(amt)}`, "#7bd88f");
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
  function baseAddKillFeed(aName, aColor, bName, bColor, self, aSlot, bSlot) {
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
  var addKillFeed = baseAddKillFeed;
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
    const hat = Bodies.polygon(x, y - 22 * s, 3, 8, { density: 8e-4, frictionAir: 0.02, angle: -Math.PI / 2, label: "gib" });
    hat.color = p.hat;
    hat.dieAt = simNow() + 3500;
    Body.setVelocity(hat, { x: p.body.velocity.x * 0.5 + rand(-3, 3), y: -7 * (engine.gravity.y < 0 ? -1 : 1) });
    Body.setAngularVelocity(hat, rand(-0.4, 0.4));
    gibs.add(hat);
    Composite.add(world, hat);
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
      const gib = Bodies.rectangle(x, y, 14, 4, { density: 1e-3, frictionAir: 0.01, label: "gib" });
      gib.color = p.color;
      gib.dieAt = simNow() + 3e3;
      Body.setVelocity(gib, { x: (simRandom() - 0.5) * 16, y: -6 - simRandom() * 8 });
      Body.setAngularVelocity(gib, (simRandom() - 0.5) * 0.6);
      gibs.add(gib);
      Composite.add(world, gib);
    }
    Composite.remove(world, p.body);
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
        Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 2, y: p.body.velocity.y });
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
        for (const b of Composite.allBodies(world)) {
          if (b.isStatic || b === p.body || b.isSensor) continue;
          const dx = b.position.x - x, dy = b.position.y - y;
          const d = Math.hypot(dx, dy);
          if (d > range || d === 0) continue;
          if ((dx * dir.x + dy * dir.y) / d < 0.55) continue;
          const s = 1 - d / range;
          if (b.label === "projectile") {
            const spd = Math.hypot(b.velocity.x, b.velocity.y);
            Body.setVelocity(b, { x: dir.x * spd, y: dir.y * spd });
            continue;
          }
          Body.setVelocity(b, { x: b.velocity.x + dir.x * 18 * m * s, y: b.velocity.y + dir.y * 18 * m * s - 3 * s });
        }
        Body.setVelocity(p.body, { x: p.body.velocity.x - dir.x * 7, y: p.body.velocity.y - dir.y * 4 - 2 });
        for (let i = 0; i < 14; i++) {
          particles.push({ kind: "spark", x: x + dir.x * 20, y: y - 6 + dir.y * 20 + rand(-10, 10), vx: dir.x * rand(6, 14), vy: dir.y * rand(6, 14) + rand(-1, 1), life: 18, maxLife: 18, color: "#d7f5ef", r: 2 });
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
          Body.setVelocity(hit, { x: hit.velocity.x + dir.x * 28 * m, y: hit.velocity.y + dir.y * 28 * m - 8 * m });
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
            other.player.frozenUntil = simNow() + 1500 * m;
            other.frictionAir = 1e-3;
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
        const c = Bodies.rectangle(400 + i * 55, 528, 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody(m, c, "#b08948");
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
        const c = Bodies.rectangle(rand(300, W - 300), rand(350, 600), 26, 26, { density: 15e-4, friction: 0.4, label: "crate" });
        addBody(m, c, "#b08948");
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
      Body.setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
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
      Body.setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
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
        const chunk = Bodies.polygon(rand(120, W - 120), -30, pick([3, 4, 5]), rand(12, 22), { density: 4e-3, label: "ball" });
        addBody(m, chunk, "#bfe8ff");
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
      if (simRandom() < 0.3) particles.push({ kind: "square", x: rand(0, W), y: rand(0, H - 100), vx: Math.sin(now / 1800) * 6, vy: 1, life: 20, maxLife: 20, color: "#fff", r: 2 });
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
          const ball = Bodies.circle(x, 590 - i * 38, 22 - i * 5, { density: 1e-3, friction: 0.3, label: "ball" });
          addBody(m, ball, "#f4fbff");
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        if (Math.abs(b.position.x - W / 2) < 110) Body.setVelocity(b, { x: b.velocity.x, y: b.velocity.y - 0.9 });
      }
      if (simRandom() < 0.4) particles.push({ kind: "spark", x: W / 2 + rand(-100, 100), y: rand(300, H), vx: 0, vy: -9, life: 18, maxLife: 18, color: "#e0ffff", r: 2 });
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
      for (const belt of m.data.belts) for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        if (b.position.x > belt.x0 && b.position.x < belt.x1 && Math.abs(b.position.y - belt.y + 20) < 34) Body.setVelocity(b, { x: Math.max(-9, Math.min(9, b.velocity.x + belt.dir * 0.25)), y: b.velocity.y });
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
      for (const belt of m.data.belts) for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        if (b.position.x > belt.x0 && b.position.x < belt.x1 && Math.abs(b.position.y - belt.y + 20) < 34) Body.setVelocity(b, { x: Math.max(-9, Math.min(9, b.velocity.x + belt.dir * 0.25)), y: b.velocity.y });
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
      Body.setAngle(cross, Math.PI / 2);
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
      for (const belt of m.data.belts) for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        if (b.position.x > belt.x0 && b.position.x < belt.x1 && Math.abs(b.position.y - belt.y + 20) < 34) Body.setVelocity(b, { x: Math.max(-9, Math.min(9, b.velocity.x + belt.dir * 0.25)), y: b.velocity.y });
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
          for (const b of Composite.allBodies(world)) {
            if (b.isStatic || b.isSensor) continue;
            if (Math.abs(b.position.x - v.x) < 60) Body.setVelocity(b, { x: b.velocity.x, y: b.velocity.y - 1.4 });
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
      Body.setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
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
        const rock = Bodies.polygon(rand(100, W - 100), rand(150, 450), pick([5, 6, 7]), rand(14, 30), { density: 3e-3, frictionAir: 0.02, label: "ball" });
        addBody(m, rock, "#4a4a5f");
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        const dx = W / 2 - b.position.x, dy = 360 - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 420) Body.setVelocity(b, { x: b.velocity.x + dx / d * 0.35, y: b.velocity.y + dy / d * 0.35 });
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
        const junk = Bodies.rectangle(rand(150, W - 150), rand(150, 480), rand(16, 42), rand(10, 22), { density: 2e-3, frictionAir: 0.015, label: "crate" });
        addBody(m, junk, "#5a5a6f");
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
      if (engine.gravity.y !== want) {
        engine.gravity.y = want;
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
        const rock = Bodies.polygon(rand(100, W - 100), rand(120, 320), 6, rand(12, 20), { density: 3e-3, frictionAir: 0.02, label: "ball" });
        addBody(m, rock, "#4a4a5f");
      }
    }, s: [{ x: 300, y: 120 }, { x: W - 300, y: 120 }, { x: W / 2 - 60, y: 120 }, { x: W / 2 + 60, y: 120 }] }
  ]);
  theme("Ancient Ruins", { bg: "#26221c", cover: "pillar" }, [
    { n: "Pillar Hall", b(m) {
      addStatic(m, W / 2, 650, W - 80, 44, { color: "#3a3226" });
      for (const x of [280, 560, 840, 1060]) {
        for (let i = 0; i < 4; i++) {
          const seg = Bodies.rectangle(x, 596 - i * 66, 36, 62, { density: 4e-3, friction: 0.6, label: "crate" });
          addBody(m, seg, "#8a7a5c");
        }
      }
      addLava(m, H - 10);
    } },
    { n: "Collapsing Temple", b(m) {
      addStatic(m, 200, 620, 340, 40, { color: "#3a3226" });
      addStatic(m, W - 200, 620, 340, 40, { color: "#3a3226" });
      const roof = Bodies.rectangle(W / 2, 260, 460, 26, { density: 6e-3, label: "plank" });
      roof.w = 460;
      roof.h = 26;
      addBody(m, roof, "#8a7a5c");
      for (const side of [-1, 1]) {
        const rope = Constraint.create({ pointA: { x: W / 2 + side * 210, y: 40 }, bodyB: roof, pointB: { x: side * 210, y: 0 }, stiffness: 0.9, length: 200 });
        rope.label = "breakable";
        Composite.add(m.composite, rope);
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
        const ob = Bodies.rectangle(x, 540, 30, 180, { density: 5e-3, label: "crate" });
        addBody(m, ob, "#8a7a5c");
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
      for (let i = 0; i < 3; i++) particles.push({ kind: "spark", x: rand(0, W), y: rand(0, H - 120), vx: -1, vy: 11, life: 12, maxLife: 12, color: "#6a86b8", r: 1.5 });
    } },
    { n: "Eye of the Storm", b(m) {
      addStatic(m, W / 2, 580, 340, 36, { color: "#2a3242" });
      addStatic(m, 150, 500, 220, 28, { color: "#2a3242" });
      addStatic(m, W - 150, 500, 220, 28, { color: "#2a3242" });
      addLava(m);
    }, u(m, now) {
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        const off = b.position.x - W / 2;
        if (Math.abs(off) > 240) Body.setVelocity(b, { x: b.velocity.x - Math.sign(off) * 0.3, y: b.velocity.y });
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
      for (let i = 0; i < 2; i++) particles.push({ kind: "spark", x: rand(0, W), y: rand(0, H - 120), vx: 0, vy: 12, life: 10, maxLife: 10, color: "#6a86b8", r: 1.5 });
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        const dx = W / 2 - b.position.x, dy = 430 - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 60 && d < 500) Body.setVelocity(b, { x: b.velocity.x + dx / d * 0.25, y: b.velocity.y + dy / d * 0.25 });
      }
    }, s: [{ x: 280, y: 120 }, { x: W - 280, y: 120 }, { x: 380, y: 120 }, { x: W - 380, y: 120 }] },
    { n: "Antigrav", gravity: -1.4, b(m) {
      addStatic(m, W / 2, 100, W - 200, 36, { color: "#1f1830" });
      addStatic(m, 260, 260, 240, 26, { color: "#1f1830" });
      addStatic(m, W - 260, 260, 240, 26, { color: "#1f1830" });
      const top = Bodies.rectangle(W / 2, -40, W * 2, 60, { isStatic: true, isSensor: true, label: "lava" });
      Composite.add(m.composite, top);
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
      if (engine.gravity.y !== want) {
        engine.gravity.y = want;
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        const dx = W / 2 - b.position.x, dy = 720 - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 480) Body.setVelocity(b, { x: b.velocity.x + dx / d * 0.3, y: b.velocity.y + dy / d * 0.3 });
      }
      if (simRandom() < 0.4) particles.push({ kind: "square", x: W / 2 + rand(-160, 160), y: H - rand(10, 60), vx: 0, vy: 2, life: 18, maxLife: 18, color: "#a55eea", r: 2.5 });
    }, s: [{ x: 200, y: 120 }, { x: W - 200, y: 120 }, { x: 340, y: 120 }, { x: W - 340, y: 120 }] },
    { n: "Glitch", wrap: true, b(m) {
      const xs = [[260, 560], [640, 470], [1020, 560], [W / 2, 300]];
      xs.forEach(([x, y], i) => {
        const b = addStatic(m, x, y, 220, 24, { color: "#3d2f5c" });
        b.phantom = { speed: 18e-4, offset: i * 2.3 };
      });
      addStatic(m, W / 2, 680, 400, 24, { color: "#1f1830" });
    }, u(m, now) {
      engine.gravity.y = game.baseGravity * (1 + Math.sin(now / 2600) * 0.5);
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
      Body.setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
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
      Body.setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
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

  // src/platform/spell-guide.js
  Object.assign(globalThis, {
    SPELLS,
    CAST_FLOOR,
    SPELL_TIERS,
    TIER_COLOR,
    TIER_RANK,
    TIER_WEIGHT,
    spellTier,
    FUSIONS,
    F_FIRE,
    F_ICE,
    F_ZAP,
    F_AIR,
    F_EARTH,
    F_VOID,
    F_LIFE,
    F_TRICK
  });
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
