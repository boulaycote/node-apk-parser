var http = require("http");
var fs = require("fs");
var os = require("os");
var path = require("path");
var exec = require("child_process").exec;
var decompress = require("decompress");

var targetDir = __dirname + "/tools/";
try {
    fs.statSync(targetDir);
} catch (e) {
    fs.mkdirSync(targetDir);
}

function attemptDownload(attemptsLeft, platform) {
    var url = "http://dl-ssl.google.com/android/repository/platform-tools_r16-" + platform + ".zip";
    var tempFile = "/tmp/platform-tools-" + (new Date().getTime()) + platform + ".zip";
    var dir = "tools/aapt-" + platform;
    var file = fs.createWriteStream(tempFile);
    var request = http.get(url, function (response) {
        response.pipe(file);
        response.on("end", function () {
            decompress(tempFile, dir, {
                filter: function (file) { return path.basename(file.path) === "aapt"; },
                map: function (file) { file.path = path.basename(file.path); return file; }
            }).then(function (files) {
                fs.chmodSync(dir + "/aapt", "755");
                fs.unlinkSync(tempFile);
            }).catch(function (err) {
                console.error(err);
                if (attemptsLeft === 0) {
                    throw err;
                } else {
                    return attemptDownload(attemptsLeft - 1, platform);
                }
            });
        });
    });
}

attemptDownload(3, "linux");
attemptDownload(3, "macosx");
