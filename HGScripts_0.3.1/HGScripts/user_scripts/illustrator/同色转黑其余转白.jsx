#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSameBW

var DEBUG_SAMPLE_LINES = [];
var DEBUG_APPLY_LINE_COUNT = 0;
var DEBUG_APPLY_LINE_LIMIT = 500;

(function () {
    if (app.documents.length === 0) {
        alert("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a Illustrator \u6587\u6863");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) {
        alert("\u8bf7\u5148\u9009\u4e2d\u4e00\u4e2a\u5355\u8272\u5bf9\u8c61\u6216\u5355\u8272\u7ec4");
        return;
    }

    if (tryRunCppPlugin()) {
        return;
    }

    var sample = getSingleColorSample(doc.selection[0]);
    if (!sample.ok) {
        alert(sample.message);
        return;
    }

    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artRect = artboard.artboardRect;
    var white = makeRGB(255, 255, 255);
    var black = makeRGB(0, 0, 0);

    applyMaskColorToDocument(doc, artRect, sample.key, black, white);
    flushSampleDebugLog();
})();

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSameBW");
}

function tryRunHGScriptsCppCommand(command) {
    var mode = getHGScriptsCppMode();
    if (mode === "jsx") return false;
    try {
        app.executeMenuCommand(command);
        return true;
    } catch (e) {
        return false;
    }
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

function getSingleColorSample(item) {
    resetSampleDebugLog("\u540c\u8272\u8f6c\u9ed1\u5176\u4f59\u8f6c\u767d.jsx");
    var key = findFirstPreferredColorSample(item);
    if (!key) {
        addSampleDebugLine("FINAL_SAMPLE=null");
        flushSampleDebugLog();
        return {
            ok: false,
            message: "\u9009\u4e2d\u5185\u5bb9\u4e2d\u6ca1\u6709\u53ef\u7528\u7684\u586b\u5145\u6216\u63cf\u8fb9\u989c\u8272"
        };
    }

    addSampleDebugLine("FINAL_SAMPLE=" + key);
    flushSampleDebugLog();

    return {
        ok: true,
        key: key
    };
}

function findFirstPreferredColorSample(item) {
    if (!isProcessable(item)) return null;
    logSampleCandidate("VISIT", item, null);

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            var childKey = findFirstPreferredColorSample(item.pageItems[i]);
            if (childKey) return childKey;
        }
        return null;
    }

    if (item.typename === "CompoundPathItem") {
        var compoundKey = getPreferredObjectColorKey(item);
        if (compoundKey) return compoundKey;

        for (var j = 0; j < item.pathItems.length; j++) {
            var pathKey = findFirstPreferredColorSample(item.pathItems[j]);
            if (pathKey) return pathKey;
        }
        return null;
    }

    if (item.typename === "TextFrame") {
        return getPreferredTextColorKey(item);
    }

    return getPreferredObjectColorKey(item);
}

function collectTextColorKeys(textFrame, keys) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        pushColorKey(attrs.fillColor, keys, false);
        pushColorKey(attrs.strokeColor, keys, false);
    } catch (e) {}
}

function getPreferredTextColorKey(textFrame) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        var fillKey = colorToKey(attrs.fillColor);
        if (fillKey) {
            logSampleCandidate("USE_TEXT_FILL", textFrame, fillKey);
            return fillKey;
        }

        var strokeKey = colorToKey(attrs.strokeColor);
        if (strokeKey) {
            logSampleCandidate("USE_TEXT_STROKE", textFrame, strokeKey);
            return strokeKey;
        }
    } catch (e) {}

    return null;
}

function getPreferredObjectColorKey(item) {
    try {
        if (item.filled) {
            var fillKey = colorToKey(item.fillColor);
            if (fillKey) {
                logSampleCandidate("USE_FILL", item, fillKey);
                return fillKey;
            }
        }
    } catch (e1) {}

    try {
        if (item.stroked) {
            var strokeKey = colorToKey(item.strokeColor);
            if (strokeKey) {
                logSampleCandidate("USE_STROKE", item, strokeKey);
                return strokeKey;
            }
        }
    } catch (e2) {}

    return null;
}

function resetSampleDebugLog(scriptName) {
    DEBUG_SAMPLE_LINES = [];
    DEBUG_APPLY_LINE_COUNT = 0;
    addSampleDebugLine("SCRIPT=" + scriptName);
    try {
        addSampleDebugLine("TIME=" + (new Date()).toString());
    } catch (e) {}
}

function addSampleDebugLine(line) {
    try {
        DEBUG_SAMPLE_LINES.push(String(line));
    } catch (e) {}
}

function addApplyDebugLine(line) {
    DEBUG_APPLY_LINE_COUNT++;
    if (DEBUG_APPLY_LINE_COUNT <= DEBUG_APPLY_LINE_LIMIT) {
        addSampleDebugLine(line);
    } else if (DEBUG_APPLY_LINE_COUNT === DEBUG_APPLY_LINE_LIMIT + 1) {
        addSampleDebugLine("APPLY_LOG_TRUNCATED limit=" + DEBUG_APPLY_LINE_LIMIT);
    }
}

function getHGScriptsRuntimeFolder() {
    try {
        var current = new File($.fileName).parent;
        while (current) {
            if (current.name === "HGScripts_dev" || current.name === "HGScripts") {
                var dataFolder = new Folder(current.fsName + "/data");
                if (!dataFolder.exists) dataFolder.create();
                var runtimeFolder = new Folder(dataFolder.fsName + "/runtime");
                if (!runtimeFolder.exists) runtimeFolder.create();
                return runtimeFolder;
            }
            current = current.parent;
        }
    } catch (e) {}
    var fallback = new Folder(Folder.userData + "/HGScripts");
    if (!fallback.exists) fallback.create();
    return fallback;
}

function flushSampleDebugLog() {
    try {
        if (DEBUG_APPLY_LINE_COUNT > 0) {
            addSampleDebugLine("APPLY_TOTAL=" + DEBUG_APPLY_LINE_COUNT);
        }
        var folder = getHGScriptsRuntimeFolder();
        var file = new File(folder.fsName + "/same_color_sample_debug.log");
        file.encoding = "UTF-8";
        file.open("w");
        file.write(DEBUG_SAMPLE_LINES.join("\n"));
        file.close();
    } catch (e) {}
}

function logSampleCandidate(label, item, key) {
    try {
        var clipping = false;
        try { clipping = !!item.clipping; } catch (e0) {}

        var fillKey = null;
        var strokeKey = null;
        try {
            if (item.filled) fillKey = colorToKey(item.fillColor);
        } catch (e1) {}
        try {
            if (item.stroked) strokeKey = colorToKey(item.strokeColor);
        } catch (e2) {}

        addSampleDebugLine(
            label +
            " type=" + item.typename +
            " name=" + safeDebugName(item.name) +
            " clipping=" + clipping +
            " fill=" + fillKey +
            " stroke=" + strokeKey +
            (key ? " key=" + key : "")
        );
    } catch (e) {}
}

function safeDebugName(name) {
    if (name === undefined || name === null || name === "") return "(none)";
    return String(name).replace(/\r|\n/g, " ");
}

function pushColorKey(color, keys, allowUnsupported) {
    var key = colorToKey(color);
    if (key) {
        keys.push(key);
    } else if (allowUnsupported && color && color.typename && color.typename !== "NoColor") {
        keys.push("UNSUPPORTED|" + color.typename);
    }
}

function applyMaskColorToDocument(doc, artRect, sampleKey, matchedColor, otherColor) {
    for (var i = 0; i < doc.pageItems.length; i++) {
        var item = doc.pageItems[i];
        if (isTopLevelPageItem(item)) {
            applyMaskColor(item, artRect, sampleKey, matchedColor, otherColor);
        }
    }
}

function isTopLevelPageItem(item) {
    try {
        return item.parent && item.parent.typename === "Layer";
    } catch (e) {
        return false;
    }
}

function applyMaskColor(item, artRect, sampleKey, matchedColor, otherColor) {
    if (!isProcessable(item)) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            applyMaskColor(item.pageItems[i], artRect, sampleKey, matchedColor, otherColor);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            applyMaskColor(item.pathItems[j], artRect, sampleKey, matchedColor, otherColor);
        }
        return;
    }

    if (!isItemCenterInArtboard(item, artRect)) return;

    if (item.typename === "TextFrame") {
        applyMaskColorToText(item, sampleKey, matchedColor, otherColor);
        return;
    }

    applyMaskColorToDirectObject(item, sampleKey, matchedColor, otherColor);
}

function applyMaskColorToDirectObject(item, sampleKey, matchedColor, otherColor) {
    var changed = false;

    try {
        if (item.filled) {
            var fillKey = colorToKey(item.fillColor);
            var fillMatched = fillKey === sampleKey;
            addApplyDebugLine("APPLY_FILL type=" + item.typename + " name=" + safeDebugName(item.name) + " from=" + fillKey + " matched=" + fillMatched + " to=" + (fillMatched ? "matched" : "other"));
            item.fillColor = fillMatched ? matchedColor : otherColor;
            changed = true;
        }
    } catch (e1) {}

    try {
        if (item.stroked) {
            var strokeKey = colorToKey(item.strokeColor);
            var strokeMatched = strokeKey === sampleKey;
            addApplyDebugLine("APPLY_STROKE type=" + item.typename + " name=" + safeDebugName(item.name) + " from=" + strokeKey + " matched=" + strokeMatched + " to=" + (strokeMatched ? "matched" : "other"));
            item.strokeColor = strokeMatched ? matchedColor : otherColor;
            changed = true;
        }
    } catch (e2) {}

    return changed;
}

function applyMaskColorToText(textFrame, sampleKey, matchedColor, otherColor) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        if (attrs.fillColor && attrs.fillColor.typename !== "NoColor") {
            var fillKey = colorToKey(attrs.fillColor);
            var fillMatched = fillKey === sampleKey;
            addApplyDebugLine("APPLY_TEXT_FILL name=" + safeDebugName(textFrame.name) + " from=" + fillKey + " matched=" + fillMatched + " to=" + (fillMatched ? "matched" : "other"));
            attrs.fillColor = fillMatched ? matchedColor : otherColor;
        }
        if (attrs.strokeColor && attrs.strokeColor.typename !== "NoColor") {
            var strokeKey = colorToKey(attrs.strokeColor);
            var strokeMatched = strokeKey === sampleKey;
            addApplyDebugLine("APPLY_TEXT_STROKE name=" + safeDebugName(textFrame.name) + " from=" + strokeKey + " matched=" + strokeMatched + " to=" + (strokeMatched ? "matched" : "other"));
            attrs.strokeColor = strokeMatched ? matchedColor : otherColor;
        }
    } catch (e) {}
}

function colorToKey(color) {
    if (!color || !color.typename || color.typename === "NoColor") return null;

    if (color.typename === "RGBColor") {
        return "RGB|" + roundColor(color.red) + "|" + roundColor(color.green) + "|" + roundColor(color.blue);
    }

    if (color.typename === "CMYKColor") {
        return "CMYK|" + roundColor(color.cyan) + "|" + roundColor(color.magenta) + "|" + roundColor(color.yellow) + "|" + roundColor(color.black);
    }

    if (color.typename === "GrayColor") {
        return "GRAY|" + roundColor(color.gray);
    }

    if (color.typename === "SpotColor") {
        try {
            return "SPOT|" + color.spot.name + "|" + roundColor(color.tint);
        } catch (e1) {
            return null;
        }
    }

    if (color.typename === "GradientColor") {
        try {
            return "GRADIENT|" + color.gradient.name;
        } catch (e2) {
            return null;
        }
    }

    if (color.typename === "PatternColor") {
        try {
            return "PATTERN|" + color.pattern.name;
        } catch (e3) {
            return null;
        }
    }

    return null;
}

function roundColor(value) {
    return Math.round(Number(value) * 1000) / 1000;
}

function isProcessable(item) {
    if (!item || item.locked || item.hidden) return false;
    try {
        if (item.clipping) return false;
    } catch (e) {}
    if (item.typename === "PlacedItem" || item.typename === "RasterItem" || item.typename === "SymbolItem") return false;
    return true;
}

function isItemCenterInArtboard(item, artRect) {
    try {
        var bounds = item.geometricBounds;
        var cx = (bounds[0] + bounds[2]) / 2;
        var cy = (bounds[1] + bounds[3]) / 2;

        return cx >= artRect[0] &&
            cx <= artRect[2] &&
            cy <= artRect[1] &&
            cy >= artRect[3];
    } catch (e) {
        return false;
    }
}

function makeRGB(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}
