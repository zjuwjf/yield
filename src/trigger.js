function defaultExecuter(v, cb) { cb(undefined, v) }
function defaultCatcher(e) { throw e }
const hole = (a1, a2) => (self, err, v, cb) => a1(self, err, v, (nself, nerr, nv) => a2(nself, nerr, nv, cb))
const noop = () => { }
const identity = (self, err, v, cb) => cb(self, err, v)

function Trigger(method) {
    this._method = method || identity
    this._disposed = false
}

Trigger.prototype.dispose = function () {
    this._disposed = true
}
//executer(v, (nerr, nv)=>{})
Trigger.prototype.async = function (executer, catcher) {
    executer = executer || defaultExecuter
    catcher = catcher || defaultCatcher
    const f = (self, err, v, cb) => {
        if (self._disposed) return
        try {
            if (err) { catcher(err) }
            else { executer(v, (nerr, nv) => { cb(self, nerr, nv) }) }
        } catch (e) {
            cb(self, e)
        }
    }
    this._method = hole(this._method, f)
    return this
}
//map(a) => b
Trigger.prototype.sync = function (map, catcher) {
    return this.async((value, cb) => cb(undefined, map(value)), catcher)
}

Trigger.prototype.catch = function (catcher) {
    return this.async(undefined, catcher)
}

Trigger.prototype.invoke = function (v, cb) {
    this._method(this, undefined, v, cb ? (unused_self, err, data) => cb(err, data) : noop)
}

function merge(recevie, triggers) {
    if (!triggers || !triggers.length) { return undefined }
    return (self, err, data, cb) => {
        const context = {}
        triggers.forEach((trigger, index) => {
            if (!(trigger instanceof Trigger)) { trigger = just(trigger) }
            trigger.invoke(data, (nerr, ndata) => {
                if (!context.triggered) {
                    if (nerr) {
                        context.triggered = true
                        cb(self, nerr)
                    } else {
                        recevie(self, context, ndata, index, cb)
                    }
                }
            })
        })
    }
}

function all(...triggers) {
    return new Trigger(merge((self, context, value, index, cb) => {
        context.arrived = context.arrived || 0
        context.arrived++
        context.values = context.values || []
        context.values[index] = value
        if (context.arrived === triggers.length) {
            context.triggered = true
            cb(self, undefined, context.values)
        }
    }, triggers))
}

function race(...triggers) {
    return new Trigger(merge((self, context, value, index, cb) => {
        context.triggered = true
        cb(self, undefined, { index, value })
    }, triggers))
}

function just(value) {
    return new Trigger((self, err, v, cb) => cb(self, undefined, value))
}

function create(method) {
    return new Trigger(method)
}

module.exports = {
    create, all, race, just, Trigger
}
