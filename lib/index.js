var os = require("os");
var exec = require("child_process").execFile;

var VERSION_NAME_TAG = '(0x0101021c)'

function extractRaw(string) {
    var sep = "\" (Raw: \"";
    var parts = string.split(sep);
    var value = parts.slice(0, parts.length / 2).join(sep);
    return value.substring(1);
}

function extractRawType(string) {
    var matches = string.match(/\(Raw:\s\"(.+)\"\)/);

    if (matches && matches.length > 1) {
        return matches[1];
    }
    return null;
}

function extractHex(string) {
    // =(type 0x10)0x1b
    var matches = string.match(/(0x[a-z0-9]{1,})$/);
    var value = null;

    if (matches) {
        try {
            value = parseInt(matches[1]);
        } catch (e) {
            // ignore
        }
    }

    return value;
}

function maybeExtractSpecResource(line) {
    var matches = line.match(/\bspec resource\b\s(0x[0-9a-z]+)\s(.+):/);
    var parsedSpecResource = null;

    if (matches) {
        var id = parseInt(matches[1]);

        matches = matches[2].match(/\/(.+)/);
        if (matches) {
            parsedSpecResource = {
                id: id,
                key: matches[1]
            };
        }
    }
    return parsedSpecResource;
}

function matchResource(resources, string) {
    var id = extractHex(string);
    var resource = resources[id];

    return resource;
}

function typeMatch(line) {
    var matches = line.match(/^\s+([A-Z]):/);
    if (!matches) {
        return false;
    }
    var type = matches[1];
    return type === "A" || type === "E";
}

function parseOutput(text, cb) {
    if (!text) {
        return cb(new Error("No input!"));
    }
    var lines = text.split("\n");
    var result = {};
    var stack = [result];
    var inManifest = false;
    var namespaces = 0;
    var resources = {};

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var parsedSpecResource = maybeExtractSpecResource(line);

        if (parsedSpecResource) {
            resources[parsedSpecResource.id] = parsedSpecResource.key;
            continue;
        }

        // Skip until we find the manifest
        if (line.trim() === "Android manifest:") {
            inManifest = true;
            continue;
        }
        if (!inManifest) {
            continue;
        }

        // Skip whitespace
        if (line.trim() === "") {
            continue;
        }

        // Match the first part of the line
        if (line.match(/^( +)?N:/)) {
            namespaces += 1;
            continue;
        }
        if (!typeMatch(line)) {
            continue;
        }
        var matches = line.match(/^( +)(A|E): ([\w:\-]+)(.*)$/);
        if (!matches) {
            return cb(new Error("Parse failure: " + line));
        }
        var input = matches[0];
        var indent = matches[1];
        var indentLength = indent.length;
        var type = matches[2];
        var name = matches[3];
        var rest = matches[4];
        if (namespaces > 1) {
            indentLength -= namespaces;
        }
        var depth = indentLength / 2;
        var parent = stack[depth - 1];
        if (type === "E") {
            var element = {};

            // Fix stack
            while (stack.length > depth) {
                stack.pop();
            }
            if (depth === stack.length) {
                stack.push(element);
            }

            if (!parent[name]) {
                parent[name] = [];
            }
            parent[name].push(element);
        } else if (type === "A") {
            var value = null;
            if (rest.substring(0, 2) === "=\"") {
                // Embedded string
                value = extractRaw(rest.substring(1));
            } else if (rest.substring(0, 12) === "=(type 0x12)") {
                // Boolean
                value = rest[14] === "1";
            } else if (rest.substring(0, 12) === "=(type 0x10)") {
                // Raw
                value = extractRawType(rest);
                if (!value) {
                    value = extractHex(rest);
                }
                if (!value) {
                    return cb(new Error("Cannot parse value: " + rest));
                }
            } else if (rest.substring(0, 11) === "=(type 0x4)") {
                value = extractRawType(rest);
            } else if (rest.substring(0, 11) === "=(type 0x7)") {
                value = matchResource(resources, rest);
            } else if (rest.substring(0, 12) === VERSION_NAME_TAG) {
                name = 'android:versionName'
                value = extractRawType(rest)
            } else {
                var parts = rest.match(/^\(0x[0-9a-f]+\)\=(.*)$/);
                if (!parts) {
                    return cb(new Error("Cannot parse value: " + rest));
                }

                if (parts[1][0] === "\"") {
                    // Linked string
                    value = extractRaw(parts[1]);
                } else {
                    // No idea, get the raw hex value
                    if (parts[1].substring(0, 11) === "(type 0x10)") {
                        value = parseInt(parts[1].substring(13), 16);
                    } else if (parts[1][0] === "@" || parts[1].substring(0, 10) === "(type 0x7)") {
                        value = matchResource(resources, rest);
                    } else {
                        value = parts[1];
                    }
                }
            }
            parent["@" + name] = value;
        } else {
            return cb(new Error("Unknown type: " + type));
        }
    }
    cb(null, result);
}

function getPlatform() {
    if (os.type() === "Darwin") {
        return "macosx";
    } else if (os.type() === "Linux") {
        return "linux";
    } else {
        throw new Error("OS not supported.");
    }
}

function parseApk(filename, maxBuffer, cb) {
    if (typeof(maxBuffer) === "function") {
        cb = maxBuffer;
        maxBuffer = 1024 * 1024;
    }
    var platform = getPlatform();

    exec(__dirname + "/../tools/aapt-" + platform + "/aapt", ["l", "-a", filename], {
        maxBuffer: 1024 * 1024 * 50,
    }, function (err, out) {
        if (err) {
            return cb(err);
        }
        parseOutput(out, cb);
    });
}

parseApk.parseOutput = parseOutput;

module.exports = parseApk;
