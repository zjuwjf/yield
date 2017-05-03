const { create, all, race } = require('./trigger.js')
const Coroutine = require('./coroutine.js')
const y = {}

function isGenerator(obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw
}

function isGeneratorFunction(obj) {
    const constructor = obj.constructor
    if (!constructor) return false
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true
    return isGenerator(constructor.prototype)
}

/**
 * cast a generator to an normal function
 * @param {generator|function} genOrFunc generator or function
 * @param {object} options {isLazy, callback}
 * @param {function} callback callback when the generator-function is finished
 * @return {function} Normal function
 */
y.cast = function cast(genOrFunc, options, callback) {
    return isGeneratorFunction(genOrFunc)
        ? function f(...args) {
            return new Coroutine(genOrFunc, options, this, ...args).resume('next', undefined, callback)
        }
        : genOrFunc
}

/**
 * cb(err, value)
 * @param {string} name The installing api name
 * @param {function} fn Fn is a function which takes callback as it's first argument. 
 *                      Callback takes 2 parameters, err and value, err is the first.
 * @return {function} The api
 */
y.install = function (name, fn) {
    y[name] = function () {
        const arr = [].slice.call(arguments)
        return create()
            .async((v, cb) => {
                fn.apply(this, [cb].concat(arr))
            })
    }
    return y
}

y.install('cor', function (cb, generator, options, this_, ...args) {
    y.cast(generator, options, cb).apply(this_, args)
})

y.install('all', function (cb, ...triggers) {
    all(...triggers).invoke(undefined, cb)
})

y.install('race', function (cb, ...triggers) {
    race(...triggers).invoke(undefined, cb)
})

y.install('just', function (cb, value) {
    cb(undefined, value)
})

y.install('wait', function (cb, mills) {
    setTimeout(() => cb(undefined, true), mills)
})

module.exports = y
