var assert = require("assert");
var parseApk = require("..");

describe("APK 0x10 not raw type", function () {
    var output = null;

    before(function (done) {
        parseApk(__dirname + "/samples/test_0x10.apk", 1024 * 1024 * 5, function (err, out) {
            if (err) {
                return done(err);
            }
            output = out;
            done();
        });
    });

    it("Parses correctly", function () {
        assert.notEqual(null, output);
    });

    it("Starts with a manifest tag", function () {
        assert.equal(output.manifest.length, 1);
    });

    it("Has a package name", function () {
        assert.equal(output.manifest[0]["@package"], "com.google.android.webview");
    });

    it("Has a package version", function () {
        assert.equal(output.manifest[0]["@platformBuildVersionCode"], "27");
    });

    it("Has an application tag", function () {
        var manifest = output.manifest[0];
        assert.equal(manifest.application.length, 1);
    });
});
