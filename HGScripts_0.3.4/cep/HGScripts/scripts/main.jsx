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

HGScripts.writeRunJson = function (filePath, payload) {
    try {
        if (!filePath) {
            return;
        }
        var file = new File(filePath);
        var folder = file.parent;
        if (folder && !folder.exists) {
            folder.create();
        }
        file.encoding = "UTF-8";
        if (!file.open("w")) {
            return;
        }
        var json = "";
        if (typeof JSON !== "undefined" && JSON.stringify) {
            json = JSON.stringify(payload);
        } else {
            function esc(value) {
                return String(value || "")
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, "\\\"")
                    .replace(/\r/g, "\\r")
                    .replace(/\n/g, "\\n");
            }
            json = "{\"runId\":\"" + esc(payload.runId) +
                "\",\"state\":\"" + esc(payload.state) +
                "\",\"command\":\"" + esc(payload.command) +
                "\",\"scriptName\":\"" + esc(payload.scriptName) +
                "\",\"scriptPath\":\"" + esc(payload.scriptPath) +
                "\",\"source\":\"" + esc(payload.source) +
                "\",\"message\":\"" + esc(payload.message) +
                "\",\"updatedAt\":" + String(payload.updatedAt || 0) + "}";
        }
        file.write(json);
        file.close();
    } catch (err) {}
};

HGScripts.runScript = function (scriptPath, cppMode, runId, statusPath, requestPath) {
    try {
        if (!scriptPath) {
            return HGScripts.result(false, "脚本路径为空");
        }

        var file = new File(scriptPath);
        if (!file.exists) {
            return HGScripts.result(false, "找不到脚本: " + scriptPath, scriptPath);
        }

        $.global.HGSCRIPTS_CPP_MODE = HGScripts.normalizeCppMode(cppMode);
        $.global.HGSCRIPTS_RUN_ID = runId || "";
        HGScripts.writeRunJson(requestPath, {
            runId: runId || "",
            state: "running",
            command: "",
            scriptName: decodeURI(file.name),
            scriptPath: file.fsName,
            source: "jsx",
            message: "running",
            updatedAt: new Date().getTime()
        });
        HGScripts.writeRunJson(statusPath, {
            runId: runId || "",
            state: "running",
            command: "",
            scriptName: decodeURI(file.name),
            scriptPath: file.fsName,
            source: "jsx",
            message: "running",
            updatedAt: new Date().getTime()
        });
        $.evalFile(file);
        HGScripts.writeRunJson(statusPath, {
            runId: runId || "",
            state: "done",
            command: "",
            scriptName: decodeURI(file.name),
            scriptPath: file.fsName,
            source: "jsx",
            message: "已执行 " + decodeURI(file.name),
            updatedAt: new Date().getTime()
        });
        return HGScripts.result(true, "已执行 " + decodeURI(file.name), file.fsName);
    } catch (err) {
        var message = err && err.message ? err.message : String(err);
        var line = err && err.line ? err.line : "";
        var number = err && err.number ? err.number : "";
        var errorFile = err && err.fileName ? err.fileName : scriptPath;
        var context = HGScripts.readContext(scriptPath, line, 2);
        HGScripts.writeRunJson(statusPath, {
            runId: runId || "",
            state: "error",
            command: "",
            scriptName: scriptPath ? decodeURI(new File(scriptPath).name) : "",
            scriptPath: scriptPath || "",
            source: "jsx",
            message: message,
            errorCode: number,
            updatedAt: new Date().getTime()
        });
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

HGScripts.normalizeCppMode = function (mode) {
    mode = String(mode || "auto").toLowerCase();
    if (mode === "cpp" || mode === "jsx") {
        return mode;
    }
    return "auto";
};
