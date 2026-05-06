#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectSameColorObjectsLoose

(function () {
    if (!app.documents.length) {
        alert("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a Illustrator \u6587\u6863");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) {
        alert("\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u53d6\u6837\u5bf9\u8c61");
        return;
    }

    if (tryRunCppPlugin()) {
        return;
    }

    var sample = findFirstPaintSignature(doc.selection[0]);
    if (!sample) {
        alert("\u7b2c\u4e00\u4e2a\u9009\u62e9\u5bf9\u8c61\u4e0d\u652f\u6301\u4f5c\u4e3a\u53d6\u6837\u5bf9\u8c61");
        return;
    }

    var matches = [];
    var seen = {};
    var visited = {};

    if (sample.empty) {
        collectEmptyItems(doc.pageItems, matches, seen, visited);
    } else {
        collectMatchingItems(doc.pageItems, sample, matches, seen, visited);
    }

    clearSelection(doc);
    selectItems(doc, matches);
})();

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
        if (isEmptyCompoundPath(item)) {
            return makeEmptySignature();
        }
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

function collectMatchingItems(items, sample, matches, seen, visited) {
    if (!items) {
        return;
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!markVisited(item, visited) || shouldSkip(item)) {
            continue;
        }

        if (item.typename === "GroupItem") {
            collectMatchingItems(item.pageItems, sample, matches, seen, visited);
            continue;
        }

        if (item.typename === "CompoundPathItem") {
            collectMatchingItems(item.pathItems, sample, matches, seen, visited);
            continue;
        }

        var signature = null;
        if (item.typename === "PathItem") {
            signature = getPathPaintSignature(item);
        } else if (item.typename === "TextFrame") {
            signature = getTextPaintSignature(item);
        }

        if (!signature || !isLoosePaintSignatureMatch(signature, sample)) {
            continue;
        }

        pushUnique(item, matches, seen);
    }
}

function collectEmptyItems(items, matches, seen, visited) {
    if (!items) {
        return;
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!markVisited(item, visited) || shouldSkip(item)) {
            continue;
        }

        if (item.typename === "GroupItem") {
            collectEmptyItems(item.pageItems, matches, seen, visited);
        } else if (item.typename === "CompoundPathItem") {
            collectEmptyItems(item.pathItems, matches, seen, visited);
            if (isEmptyCompoundPath(item)) {
                pushUnique(item, matches, seen);
            }
        } else if (item.typename === "PathItem" && isEmptyPath(item)) {
            pushUnique(item, matches, seen);
        }
    }
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

function isSamePaintSignature(a, b) {
    return a.empty === b.empty &&
        a.hasFill === b.hasFill &&
        a.fillKey === b.fillKey &&
        a.hasStroke === b.hasStroke &&
        a.strokeKey === b.strokeKey;
}

function isLoosePaintSignatureMatch(target, sample) {
    if (sample.empty) {
        return target.empty === true;
    }

    if (sample.hasFill && sample.hasStroke) {
        if (sample.fillKey === sample.strokeKey) {
            return targetHasOnlySampleColor(target, sample.fillKey);
        }

        return target.empty === false &&
            target.hasFill === true &&
            target.hasStroke === true &&
            target.fillKey === sample.fillKey &&
            target.strokeKey === sample.strokeKey;
    }

    var sampleKey = sample.hasFill ? sample.fillKey : sample.strokeKey;
    return targetHasOnlySampleColor(target, sampleKey);
}

function targetHasOnlySampleColor(target, sampleKey) {
    if (!sampleKey || target.empty || (!target.hasFill && !target.hasStroke)) {
        return false;
    }

    if (target.hasFill && target.fillKey !== sampleKey) {
        return false;
    }
    if (target.hasStroke && target.strokeKey !== sampleKey) {
        return false;
    }

    return true;
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

function isEmptyPath(item) {
    try {
        return item.typename === "PathItem" && item.filled === false && item.stroked === false;
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

function clearSelection(targetDoc) {
    try {
        targetDoc.selection = null;
    } catch (e) {}
}

function selectItems(targetDoc, items) {
    try {
        targetDoc.selection = items;
    } catch (e) {
        for (var i = 0; i < items.length; i++) {
            try {
                items[i].selected = true;
            } catch (e2) {}
        }
    }
}

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSelectSameColorObjectsLoose");
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
