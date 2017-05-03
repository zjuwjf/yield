####Yield is a powerful coroutine library.
Based on an extremely refined trigger.js, not Promise, to achieve the purpose of automatic operation of the process.

##Example

	const request = require('request')
	const cheerio = require('cheerio')
	const y = require('./../')
	const log = console.log.bind(console)

	y.install('ajax', function (callback, url) {
	    request.get(url, { timeout: 30000 }, (error, response, body) => {
	        callback(undefined, { error, response, body })
	    })
	})
	
	function* fecth() {
	    const rspArray = yield y.all(y.ajax('https://www.zhihu.com'), y.ajax('http://www.taobao.com'), y.ajax('https://github.com'))
	    rspArray.forEach(function (rsp) {
	        log(cheerio.load(rsp.body)('title').text())
	    })
	    return 'fecth finished'
	}
	
	function* tick10() {
	    for (let i = 0; i < 10; i++) {
	        yield y.wait(1000)
	        log(new Date().toTimeString())
	    }
	    return 'tick finished'
	}
	
	function* main() {
	    log(yield y.cor(fecth))
	    log(yield y.cor(tick10))
	    log('<<<<<<<<<<')
	}
	
	log('>>>>>>>>>>')
	y.cast(main)()
	log('yield test has started.')




#License

MIT