var http = require("http");
var fs = require("fs");
var os = require("os");
var exec = require("child_process").exec;

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
            exec("unzip -j -o " + tempFile + " platform-tools/aapt -d " + dir, function (err) {
                if (err) {
                    if (attemptsLeft === 0) {
                        throw err;
                    } else {
                        return attemptDownload(attemptsLeft - 1, platform);
                    }
                }
                fs.chmodSync(dir + "/aapt", "755");
                fs.unlinkSync(tempFile);
            });
        });
    });
}

attemptDownload(3, "linux");
attemptDownload(3, "macosx");
