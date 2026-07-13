'use strict';

const path = require('path');

const PUBLIC_DIRS = new Set(['assets', 'css', 'js']);
const PUBLIC_TOP_LEVEL_EXTENSIONS = new Set([
  '.css', '.html', '.ico', '.jpeg', '.jpg', '.js', '.png', '.svg', '.webp',
]);

function isInside(root, file) {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function isPublicSegments(segments) {
  if (!segments.length || segments.some(segment => segment.startsWith('.'))) return false;
  const publicTopLevel = segments.length === 1 && PUBLIC_TOP_LEVEL_EXTENSIONS.has(path.extname(segments[0]).toLowerCase());
  const publicDirectory = segments.length > 1 && PUBLIC_DIRS.has(segments[0]);
  return publicTopLevel || publicDirectory;
}

function isPublicRealPath(root, file) {
  if (!isInside(root, file)) return false;
  return isPublicSegments(path.relative(root, file).split(path.sep).filter(Boolean));
}

function resolveStaticPath(root, rawUrl) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(String(rawUrl || '').split('?')[0]);
  } catch {
    return { status: 400 };
  }

  // Normalize URL separators before validating so the same rules hold when the
  // LAN server runs on Windows. No dot-prefixed path is public: this protects
  // private authoring data, Git metadata, and editor/config files.
  urlPath = urlPath.replace(/\\/g, '/');
  if (urlPath.includes('\0')) return { status: 400 };
  if (urlPath === '/') urlPath = '/index.html';
  const segments = urlPath.split('/').filter(Boolean);
  if (!isPublicSegments(segments)) return { status: 403 };

  const file = path.resolve(root, '.' + (urlPath.startsWith('/') ? urlPath : '/' + urlPath));
  if (!isInside(root, file)) return { status: 403 };
  return { status: 200, file };
}

module.exports = { isPublicRealPath, resolveStaticPath };
