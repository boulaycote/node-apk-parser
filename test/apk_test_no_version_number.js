var assert = require('assert')
var parseApk = require('..')

describe('APK No @android:versionName', function() {
  var output = null

  before(function(done) {
    parseApk(
      __dirname + '/samples/test_no_version_number.apk',
      1024 * 1024 * 5,
      function(err, out) {
        if (err) {
          return done(err)
        }
        output = out
        done()
      }
    )
  })

  it('Parses correctly', function() {
    assert.notEqual(null, output)
  })

  it('Starts with a manifest tag', function() {
    assert.equal(output.manifest.length, 1)
  })

  it('Has a version number', function() {
    assert.equal(output.manifest[0]["@android:versionName"], "7.2.1 build 3351");
  })
})
