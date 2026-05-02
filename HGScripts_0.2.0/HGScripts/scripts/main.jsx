var HGScripts = HGScripts || {};

HGScripts.getHostName = function () {
    try {
        if (app && app.name) {
            return String(app.name);
        }
    } catch (err) {}
    return "";
};

HGScripts.getHostKey = function () {
    var name = HGScripts.getHostName().toLowerCase();
    if (name.indexOf("photoshop") >= 0) {
        return "photoshop";
    }
    if (name.indexOf("indesign") >= 0) {
        return "indesign";
    }
    return "illustrator";
};

HGScripts.readContext = function (scriptPath, lineNumber, radius) {
    var line = parseInt(lineNumber, 10);
    if (!scriptPath || !line || line < 1) {
        return [];
    }

    var file = new File(scriptPath);
    if (!file.exists || !file.open("r")) {
        return [];
    }

    var start = Math.max(1, line - (radius || 2));
    var end = line + (radius || 2);
    var rows = [];
    var current = 0;

    try {
        while (!file.eof) {
            current++;
            var text = file.readln();
            if (current >= start && current <= end) {
                rows.push({
                    line: current,
                    text: text,
                    error: current === line
                });
            }
            if (current > end) {
                break;
            }
        }
    } catch (err) {
    } finally {
        file.close();
    }

    return rows;
};

HGScripts.result = function (ok, message, file, line, number, context) {
    var payload = {
        ok: ok,
        message: message || "",
        file: file || "",
        line: line || "",
        number: number || "",
        context: context || []
    };

    if (typeof JSON !== "undefined" && JSON.stringify) {
        return JSON.stringify(payload);
    }

    function esc(value) {
        return String(value)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\\"")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n");
    }

    var contextJson = [];
    for (var i = 0; i < payload.context.length; i++) {
        contextJson.push("{\"line\":" + payload.context[i].line +
            ",\"text\":\"" + esc(payload.context[i].text) +
            "\",\"error\":" + (payload.context[i].error ? "true" : "false") + "}");
    }

    return "{\"ok\":" + (ok ? "true" : "false") +
        ",\"message\":\"" + esc(payload.message) +
        "\",\"file\":\"" + esc(payload.file) +
        "\",\"line\":\"" + esc(payload.line) +
        "\",\"number\":\"" + esc(payload.number) +
        "\",\"context\":[" + contextJson.join(",") + "]}";
};

HGScripts.runScript = function (scriptPath) {
    try {
        if (!scriptPath) {
            return HGScripts.result(false, "脚本路径为空");
        }

        var file = new File(scriptPath);
        if (!file.exists) {
            return HGScripts.result(false, "找不到脚本: " + scriptPath, scriptPath);
        }

        $.evalFile(file);
        return HGScripts.result(true, "已执行 " + decodeURI(file.name), file.fsName);
    } catch (err) {
        var message = err && err.message ? err.message : String(err);
        var line = err && err.line ? err.line : "";
        var number = err && err.number ? err.number : "";
        var errorFile = err && err.fileName ? err.fileName : scriptPath;
        var context = HGScripts.readContext(scriptPath, line, 2);
        return HGScripts.result(false, message, errorFile, line, number, context);
    }
};

HGScripts.getActiveDocumentFolder = function () {
    try {
        if (!app.documents.length) {
            return "ERROR: 当前没有打开的文档";
        }
        var doc = app.activeDocument;
        var fullName = null;
        try {
            fullName = doc.fullName;
        } catch (errFullName) {}
        if (!fullName) {
            return "ERROR: 当前文档尚未保存，无法获取所在文件夹";
        }
        return fullName.parent.fsName;
    } catch (err) {
        return "ERROR: " + (err && err.message ? err.message : String(err));
    }
};
