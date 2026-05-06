#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSingleColorToCustomColor

(function () {
    writeLog("start");

    if (!app.documents.length) {
        writeLog("skip: no document");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) {
        writeLog("skip: no selection");
        return;
    }

    if (tryRunCppPlugin()) {
        writeLog("done: cpp command");
        return;
    }

    var sampleSignature = findFirstPaintSignature(doc.selection[0]);
    var sampleKey = getSingleColorSampleKey(sampleSignature);
    if (!sampleKey) {
        writeLog("skip: sample is not single color");
        return;
    }

    var color = pickCustomColor();
    if (!color) {
        writeLog("skip: color picker cancelled or unavailable");
        return;
    }

    var matches = [];
    var seen = {};
    var visited = {};
    collectSingleColorMatches(doc.pageItems, sampleKey, matches, seen, visited);

    for (var i = 0; i < matches.length; i++) {
        applyColor(matches[i], color);
    }

    writeLog("done: matches=" + matches.length);
})();

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSingleColorToCustomColor");
}

function tryRunHGScriptsCppCommand(command) {
    var mode = getHGScriptsCppMode();
    if (mode === "jsx") return false;

    try {
        app.executeMenuCommand(command);
        return true;
    } catch (e) {
        writeLog("cpp failed: " + e);
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

function findFirstPaintSignature(item) {
    if (shouldSkip(item)) {
        return null;
    }

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            var groupSample = findFirstPaintSignature(item.pageItems[i]);
            if (groupSample) {
                return groupSample;
            }
        }
        return null;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            var compoundSample = findFirstPaintSignature(item.pathItems[j]);
            if (compoundSample) {
                return compoundSample;
            }
        }
        return null;
    }

    if (item.typename === "PathItem") {
        return getPathPaintSignature(item);
    }

    if (item.typename === "TextFrame") {
        return getTextPaintSignature(item);
    }

    return null;
}

function getSingleColorSampleKey(signature) {
    if (!signature || signature.empty) {
        return null;
    }

    if (signature.hasFill && signature.hasStroke) {
        return signature.fillKey === signature.strokeKey ? signature.fillKey : null;
    }

    return signature.hasFill ? signature.fillKey : signature.strokeKey;
}

function collectSingleColorMatches(items, sampleKey, matches, seen, visited) {
    if (!items) {
        return;
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!markVisited(item, visited) || shouldSkip(item)) {
            continue;
        }

        if (item.typename === "GroupItem") {
            collectSingleColorMatches(item.pageItems, sampleKey, matches, seen, visited);
            continue;
        }

        if (item.typename === "CompoundPathItem") {
            collectSingleColorMatches(item.pathItems, sampleKey, matches, seen, visited);
            continue;
        }

        var signature = null;
        if (item.typename === "PathItem") {
            signature = getPathPaintSignature(item);
        } else if (item.typename === "TextFrame") {
            signature = getTextPaintSignature(item);
        }

        if (targetHasOnlySampleColor(signature, sampleKey)) {
            pushUnique(item, matches, seen);
        }
    }
}

function targetHasOnlySampleColor(signature, sampleKey) {
    if (!signature || !sampleKey || signature.empty || (!signature.hasFill && !signature.hasStroke)) {
        return false;
    }

    if (signature.hasFill && signature.fillKey !== sampleKey) {
        return false;
    }

    if (signature.hasStroke && signature.strokeKey !== sampleKey) {
        return false;
    }

    return true;
}

function getPathPaintSignature(item) {
    try {
        var fillKey = null;
        var strokeKey = null;

        if (item.filled) {
            fillKey = colorToKey(item.fillColor);
            if (!fillKey) {
                return null;
            }
        }

        if (item.stroked) {
            strokeKey = colorToKey(item.strokeColor);
            if (!strokeKey) {
                return null;
            }
        }

        if (!fillKey && !strokeKey) {
            return makeEmptySignature();
        }

        return {
            empty: false,
            hasFill: !!fillKey,
            fillKey: fillKey,
            hasStroke: !!strokeKey,
            strokeKey: strokeKey
        };
    } catch (e) {
        return null;
    }
}

function getTextPaintSignature(textFrame) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        var fillKey = colorToKey(attrs.fillColor);
        var strokeKey = colorToKey(attrs.strokeColor);

        if (!fillKey && !strokeKey) {
            return makeEmptySignature();
        }

        return {
            empty: false,
            hasFill: !!fillKey,
            fillKey: fillKey,
            hasStroke: !!strokeKey,
            strokeKey: strokeKey
        };
    } catch (e) {
        return null;
    }
}

function makeEmptySignature() {
    return {
        empty: true,
        hasFill: false,
        fillKey: null,
        hasStroke: false,
        strokeKey: null
    };
}

function pickCustomColor() {
    if (typeof $ !== "undefined" && typeof $.colorPicker === "function") {
        var picked = $.colorPicker();
        if (picked < 0) {
            return null;
        }
        return makeRGBFromNumber(picked);
    }

    return null;
}

function applyColor(item, color) {
    if (!item || shouldSkip(item)) {
        return;
    }

    if (item.typename === "TextFrame") {
        applyColorToText(item, color);
        return;
    }

    applyColorToPageItem(item, color);
}

function applyColorToPageItem(item, color) {
    try {
        if (item.filled) {
            item.fillColor = color;
        }
    } catch (e1) {}

    try {
        if (item.stroked) {
            item.strokeColor = color;
        }
    } catch (e2) {}
}

function applyColorToText(textFrame, color) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        if (attrs.fillColor && attrs.fillColor.typename !== "NoColor") {
            attrs.fillColor = color;
        }
        if (attrs.strokeColor && attrs.strokeColor.typename !== "NoColor") {
            attrs.strokeColor = color;
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

function makeRGBFromNumber(value) {
    value = Number(value);
    return makeRGB(
        (value >> 16) & 255,
        (value >> 8) & 255,
        value & 255
    );
}

function makeRGB(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

function shouldSkip(item) {
    try {
        if (!item || item.locked || item.hidden) {
            return true;
        }

        if (item.layer && (item.layer.locked || !item.layer.visible)) {
            return true;
        }

        if (item.typename === "PlacedItem" || item.typename === "RasterItem" || item.typename === "SymbolItem") {
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

function markVisited(item, visited) {
    var key = getItemKey(item);
    if (visited[key]) {
        return false;
    }
    visited[key] = true;
    return true;
}

function pushUnique(item, matches, seen) {
    var key = getItemKey(item);
    if (seen[key]) {
        return;
    }
    seen[key] = true;
    matches.push(item);
}

function getItemKey(item) {
    try {
        if (item.uuid) {
            return item.uuid;
        }
    } catch (e1) {}

    try {
        return item.typename + "|" + item.name + "|" + item.geometricBounds.join(",");
    } catch (e2) {
        return String(item);
    }
}

function writeLog(message) {
    try {
        var scriptFile = new File($.fileName);
        var extensionDir = scriptFile.parent.parent.parent;
        var runtimeDir = new Folder(extensionDir.fsName + "/data/runtime");
        if (!runtimeDir.exists) {
            runtimeDir.create();
        }

        var logFile = new File(runtimeDir.fsName + "/single_color_to_custom.log");
        logFile.open("a");
        logFile.writeln("[" + new Date().toString() + "] " + message);
        logFile.close();
    } catch (e) {}
}
