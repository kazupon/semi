var linter = require('eslint').linter
var Emitter = require('events').EventEmitter
var api = module.exports = new Emitter
var offsets
var lines

// define our custom rule
linter.defineRule('autosemi', require('./rule'))

/**
 * Process a file buffer with given options.
 *
 * @param {String} file - file to process
 * @param {Object} options - ESLint options
 * @return {String}
 */

function process (file, options) {
  lines = file.split('\n')
  offsets = {}
  linter.verify(file, options).forEach(patch)
  return lines.join('\n')
}

/**
 * Patch current lines buffer based on a single operation.
 *
 * @param {Object} op
 */

function patch (op) {
  if (op.message === 'ADD') {
    add(op.line, op.column)
  } else if (op.message === 'REMOVE') {
    remove(op.line, op.column)
  } else if (op.severity) {
    api.emit('error', op)
  }
}

/**
 * Add a semicolon at given line and column
 *
 * @param {Number} n - line number
 * @param {Number} col - column number
 */

function add (n, col) {
  n--
  if (offsets[n]) col += offsets[n]
  var line = lines[n]
  lines[n] = line.slice(0, col) + ';' + line.slice(col)
  offset(n, 1)
}

/**
 * Remove a semicolon at given line and column
 *
 * @param {Number} n - line number
 * @param {Number} col - column number
 */

function remove (n, col) {
  n--
  col--
  if (offsets[n]) col += offsets[n]
  var line = lines[n]
  lines[n] = line.slice(0, col) + line.slice(col + 1)
  offset(n, -1)
}

/**
 * Record line offsets resulted from applied patches
 *
 * @param {Number} n - line number
 * @param {Number} inc - offset amount
 */

function offset (n, inc) {
  if (!offsets[n]) {
    offsets[n] = 0 + inc
  } else {
    offsets[n] += inc
  }
}

/**
 * Add semicolons to a file and return the processed file.
 *
 * @param {String} file
 * @return {String}
 */

api.add = function (file, options) {
  var leading = options && options.leading
    ? 'leading'
    : null
  return process(file, {
    parser: 'babel-eslint',
    rules: {
      autosemi: [2, 'always', leading]
    },
    plugins: ['eslint-plugin-autosemi']
  })
}

/**
 * Remove semicolons from a file and return the processed file.
 *
 * @param {String} file
 * @return {String}
 */

api.remove = function (file, options) {
  var leading = options && options.leading
    ? 'leading'
    : null
  return process(file, {
    parser: 'babel-eslint',
    rules: {
      autosemi: [2, 'never', leading]
    },
    plugins: ['eslint-plugin-autosemi']
  })
}
