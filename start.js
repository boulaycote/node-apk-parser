const parseApk = require('./lib')

parseApk(
  __dirname + '/test/samples/test_new.apk',
  1024 * 1024 * 5,
  function(err, out) {
    if (err) {
      console.error(err)
    } else {
      console.log(out)
    }
  }
)
