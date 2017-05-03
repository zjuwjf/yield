const { Trigger } = require('./trigger.js')

function Coroutine(generator, options, this_, ...args) {
    this._class = generator
    this._instance = generator.apply(this_, args)
    this._currentTrigger = undefined
    if (options && options.isLazy) {
        if (this._class['@lazy']) {
            this._class['@lazy'].dispose()
        }
        this._class['@lazy'] = this
    } else if (options && options.isSingleton) {
        if (this._class['@singleton']) {
            this.dispose()
        } else {
            this._class['@singleton'] = this
        }
    }
}

Coroutine.prototype.dispose = function (err, data, callback) {
    if (this._class['@lazy'] === this) {
        this._class['@lazy'] = undefined
    }
    if (this._class['@singleton'] === this) {
        this._class['@singleton'] = undefined
    }
    if (this._currentTrigger) {
        this._currentTrigger.dispose()
        this._currentTrigger = undefined
    }
    this._instance = undefined
    if (callback) { callback(err, data) }
    else if (err) { throw err }
}

Coroutine.prototype.resume = function (action, value, callback) {
    if (this._instance) {
        this._currentTrigger = undefined
        let iter
        try {
            iter = this._instance[action](value) //action {next|throw}
        } catch (e) {
            return this.dispose(e, undefined, callback)
        }
        if (iter.done) {
            this.dispose(undefined, iter.value, callback)
        } else {
            if (iter.value instanceof Trigger) {
                this._currentTrigger = iter.value
                iter.value.invoke(undefined, (err, data) => {
                    if (err) { this.resume('throw', err, callback) }
                    else { this.resume('next', data, callback) }
                })
            } else {
                this.dispose(new TypeError(`Unsupported for yield ${iter.value}`), undefined, callback)
            }
        }
    }
}

module.exports = Coroutine
