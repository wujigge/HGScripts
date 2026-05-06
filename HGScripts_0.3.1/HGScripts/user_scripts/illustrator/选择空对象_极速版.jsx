#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGSelectNoPaintObjectsNoSave.aip
// hgscripts-cpp-command: HGSelectNoPaintObjectsNoSave

(function () {
    var SCRIPT_NAME = "\u9009\u62e9\u7a7a\u5bf9\u8c61_\u6781\u901f\u7248";

    if (!app.documents.length) {
        writeLog("skip: no document");
        return;
    }

    writeLog("start");

    if (tryRunCppPlugin()) {
        writeLog("finish: cpp plugin success");
        return;
    }

    writeLog("cpp plugin unavailable, fallback to jsx");
    runJsxFallback();

    function tryRunCppPlugin() {
        var command = "HGSelectNoPaintObjectsNoSave";
        var mode = getHGScriptsCppMode();

        if (mode === "jsx") {
            writeLog("cpp skipped by HGScripts mode: jsx");
            return false;
        }

        try {
            app.executeMenuCommand(command);
            writeLog("cpp command success: " + command);
            return true;
        } catch (err) {
            writeLog("cpp command failed: " + command + " / " + err);
        }

        writeLog("cpp plugin failed");
        return false;
    }

    function getHGScriptsCppMode() {
        try {
            if (typeof HGSCRIPTS_CPP_MODE !== "undefined") {
                var mode = String(HGSCRIPTS_CPP_MODE).toLowerCase();
                if (mode === "cpp" || mode === "jsx") return mode;
            }
        } catch (e) {}
        return "auto";
    }

    function runJsxFallback() {
        var doc = app.activeDocument;
        var emptyPaths = [];

        collectEmptyPaths(doc.pageItems, emptyPaths);
        clearSelection(doc);

        if (emptyPaths.length) {
            selectItems(doc, emptyPaths);
        }

        writeLog("finish: jsx fallback selected " + emptyPaths.length);
    }

    function collectEmptyPaths(items, result) {
        if (!items) {
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (shouldSkip(item)) {
                continue;
            }

            if (item.typename === "GroupItem") {
                collectEmptyPaths(item.pageItems, result);
            } else if (item.typename === "CompoundPathItem") {
                collectEmptyPaths(item.pathItems, result);
                if (isEmptyCompoundPath(item)) {
                    result.push(item);
                }
            } else if (item.typename === "PathItem" && isEmptyPath(item)) {
                result.push(item);
            }
        }
    }

    function shouldSkip(item) {
        try {
            if (!item || item.locked || item.hidden) {
                return true;
            }

            if (item.layer && (item.layer.locked || !item.layer.visible)) {
                return true;
            }

            var parent = item.parent;
            while (parent && parent !== app && parent.typename !== "Document") {
                if ((parent.locked === true) || (parent.hidden === true)) {
                    return true;
                }
                if (parent.typename === "Layer" && (parent.locked || !parent.visible)) {
                    return true;
                }
                parent = parent.parent;
            }

            return false;
        } catch (e) {
            return true;
        }
    }

    function isEmptyPath(item) {
        try {
            return item.filled === false && item.stroked === false;
        } catch (e) {
            return false;
        }
    }

    function isEmptyCompoundPath(item) {
        try {
            if (!item.pathItems || item.pathItems.length === 0) {
                return false;
            }

            for (var i = 0; i < item.pathItems.length; i++) {
                if (!isEmptyPath(item.pathItems[i])) {
                    return false;
                }
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    function clearSelection(targetDoc) {
        try {
            targetDoc.selection = null;
        } catch (e) {
            writeLog("clear selection failed: " + e);
        }
    }

    function selectItems(targetDoc, items) {
        try {
            targetDoc.selection = items;
        } catch (e) {
            writeLog("batch selection failed: " + e);
            selectItemsOneByOne(items);
        }
    }

    function selectItemsOneByOne(items) {
        for (var i = 0; i < items.length; i++) {
            try {
                items[i].selected = true;
            } catch (e) {
                writeLog("select item failed: " + e);
            }
        }
    }

    function writeLog(message) {
        try {
            var logFile = getLogFile();
            if (!logFile) {
                return;
            }

            logFile.encoding = "UTF-8";
            if (logFile.open("a")) {
                logFile.writeln(getTimestamp() + "\t" + SCRIPT_NAME + "\t" + message);
                logFile.close();
            }
        } catch (e) {
        }
    }

    function getLogFile() {
        try {
            var scriptFile = new File($.fileName);
            var folder = scriptFile.parent;

            while (folder && folder.exists) {
                if (folder.name === "HGScripts_dev" || folder.name === "HGScripts") {
                    var runtimeFolder = new Folder(folder.fsName + "/data/runtime");
                    if (!runtimeFolder.exists) {
                        runtimeFolder.create();
                    }
                    return new File(runtimeFolder.fsName + "/select_empty_objects_fast.log");
                }
                folder = folder.parent;
            }
        } catch (e) {
        }

        return null;
    }

    function getTimestamp() {
        var now = new Date();
        return now.getFullYear() + "-" +
            pad2(now.getMonth() + 1) + "-" +
            pad2(now.getDate()) + " " +
            pad2(now.getHours()) + ":" +
            pad2(now.getMinutes()) + ":" +
            pad2(now.getSeconds());
    }

    function pad2(value) {
        return value < 10 ? "0" + value : String(value);
    }
})();
