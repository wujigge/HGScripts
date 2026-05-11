#target illustrator

$.global.HGColorTools = $.global.HGColorTools || {};
var HGColorTools = $.global.HGColorTools;

HGColorTools.makeRGB = function (r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
};

HGColorTools.makeRGBFromNumber = function (value) {
    return HGColorTools.makeRGB((value >> 16) & 255, (value >> 8) & 255, value & 255);
};

HGColorTools.pickCustomColor = function () {
    if (typeof $ !== "undefined" && typeof $.colorPicker === "function") {
        var picked = $.colorPicker();
        if (picked === -1) return null;
        return HGColorTools.makeRGBFromNumber(picked);
    }
    return null;
};

HGColorTools.roundColor = function (value) {
    return Math.round(Number(value) * 1000) / 1000;
};

HGColorTools.colorToKey = function (color) {
    if (!color || !color.typename || color.typename === "NoColor") return null;
    if (color.typename === "RGBColor") {
        return "RGB|" + HGColorTools.roundColor(color.red) + "|" + HGColorTools.roundColor(color.green) + "|" + HGColorTools.roundColor(color.blue);
    }
    if (color.typename === "CMYKColor") {
        return "CMYK|" + HGColorTools.roundColor(color.cyan) + "|" + HGColorTools.roundColor(color.magenta) + "|" +
            HGColorTools.roundColor(color.yellow) + "|" + HGColorTools.roundColor(color.black);
    }
    if (color.typename === "GrayColor") {
        return "GRAY|" + HGColorTools.roundColor(color.gray);
    }
    if (color.typename === "SpotColor") {
        var spotName = color.spot ? color.spot.name : "";
        return "SPOT|" + spotName + "|" + HGColorTools.roundColor(color.tint);
    }
    if (color.typename === "GradientColor") {
        var gradientName = color.gradient ? color.gradient.name : "";
        return "GRADIENT|" + gradientName;
    }
    if (color.typename === "PatternColor") {
        var patternName = color.pattern ? color.pattern.name : "";
        return "PATTERN|" + patternName;
    }
    return null;
};

HGColorTools.makeEmptySignature = function () {
    return {
        empty: true,
        hasFill: false,
        fillKey: null,
        hasStroke: false,
        strokeKey: null
    };
};

HGColorTools.shouldSkip = function (item) {
    try {
        if (!item || item.locked || item.hidden) return true;
        if (item.typename === "PlacedItem" || item.typename === "RasterItem" || item.typename === "SymbolItem") return true;

        var parent = item.parent;
        while (parent && parent !== app && parent.typename !== "Document") {
            if (parent.locked || parent.hidden) return true;
            if (parent.typename === "Layer" && (parent.locked || !parent.visible)) return true;
            parent = parent.parent;
        }
    } catch (e) {
        return true;
    }
    return false;
};

HGColorTools.getPathPaintSignature = function (item) {
    try {
        var fillKey = null;
        var strokeKey = null;
        if (item.filled && item.fillColor && item.fillColor.typename !== "NoColor") {
            fillKey = HGColorTools.colorToKey(item.fillColor);
        }
        if (item.stroked && item.strokeColor && item.strokeColor.typename !== "NoColor") {
            strokeKey = HGColorTools.colorToKey(item.strokeColor);
        }
        if (!fillKey && !strokeKey) return HGColorTools.makeEmptySignature();
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
};

HGColorTools.findFirstPaintSignature = function (item) {
    if (HGColorTools.shouldSkip(item)) return null;
    try {
        if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) {
                var groupSignature = HGColorTools.findFirstPaintSignature(item.pageItems[i]);
                if (groupSignature) return groupSignature;
            }
            return null;
        }
        if (item.typename === "CompoundPathItem") {
            for (var j = 0; j < item.pathItems.length; j++) {
                var compoundSignature = HGColorTools.getPathPaintSignature(item.pathItems[j]);
                if (compoundSignature) return compoundSignature;
            }
            return null;
        }
        if (item.typename === "TextFrame") return HGColorTools.getTextPaintSignature(item);
        if (item.typename === "PathItem") return HGColorTools.getPathPaintSignature(item);
    } catch (e) {}
    return null;
};

HGColorTools.getSingleColorSampleKey = function (signature) {
    if (!signature || signature.empty) return null;
    if (signature.hasFill && signature.hasStroke) {
        return signature.fillKey === signature.strokeKey ? signature.fillKey : null;
    }
    return signature.fillKey || signature.strokeKey;
};

HGColorTools.isSamePaintSignature = function (a, b) {
    if (!a || !b) return false;
    if (a.empty || b.empty) return a.empty === b.empty;
    return a.hasFill === b.hasFill && a.fillKey === b.fillKey &&
        a.hasStroke === b.hasStroke && a.strokeKey === b.strokeKey;
};

HGColorTools.isLoosePaintSignatureMatch = function (target, sample) {
    if (!target || !sample) return false;
    if (sample.empty) return target.empty;
    if (sample.hasFill && sample.hasStroke && sample.fillKey !== sample.strokeKey) {
        return HGColorTools.isSamePaintSignature(target, sample);
    }
    return HGColorTools.targetHasOnlySampleColor(target, sample.fillKey || sample.strokeKey);
};

HGColorTools.targetHasOnlySampleColor = function (signature, sampleKey) {
    if (!signature || signature.empty || !sampleKey) return false;
    if (signature.hasFill && signature.fillKey !== sampleKey) return false;
    if (signature.hasStroke && signature.strokeKey !== sampleKey) return false;
    return signature.hasFill || signature.hasStroke;
};

HGColorTools.applyColor = function (item, color) {
    if (HGColorTools.shouldSkip(item)) return;
    try {
        if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) HGColorTools.applyColor(item.pageItems[i], color);
            return;
        }
        if (item.typename === "CompoundPathItem") {
            for (var j = 0; j < item.pathItems.length; j++) HGColorTools.applyColor(item.pathItems[j], color);
            return;
        }
        if (item.typename === "TextFrame") {
            HGColorTools.applyColorToText(item, color);
            return;
        }
        if (item.filled && item.fillColor && item.fillColor.typename !== "NoColor") item.fillColor = color;
        if (item.stroked && item.strokeColor && item.strokeColor.typename !== "NoColor") item.strokeColor = color;
    } catch (e) {}
};

HGColorTools.applyMatchedColor = function (item, sampleKey, matchedColor, otherColor) {
    if (HGColorTools.shouldSkip(item)) return;
    try {
        if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) HGColorTools.applyMatchedColor(item.pageItems[i], sampleKey, matchedColor, otherColor);
            return;
        }
        if (item.typename === "CompoundPathItem") {
            for (var j = 0; j < item.pathItems.length; j++) HGColorTools.applyMatchedColor(item.pathItems[j], sampleKey, matchedColor, otherColor);
            return;
        }
        if (item.typename === "TextFrame") {
            HGColorTools.applyMatchedColorToText(item, sampleKey, matchedColor, otherColor);
            return;
        }
        if (item.filled && item.fillColor && item.fillColor.typename !== "NoColor") {
            item.fillColor = HGColorTools.colorToKey(item.fillColor) === sampleKey ? matchedColor : otherColor;
        }
        if (item.stroked && item.strokeColor && item.strokeColor.typename !== "NoColor") {
            item.strokeColor = HGColorTools.colorToKey(item.strokeColor) === sampleKey ? matchedColor : otherColor;
        }
    } catch (e) {}
};

HGColorTools.collectMatches = function (items, sample, mode, matches, seen, visited) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (HGColorTools.shouldSkip(item) || HGColorTools.markVisited(item, visited)) continue;
        try {
            if (item.typename === "GroupItem") {
                HGColorTools.collectMatches(item.pageItems, sample, mode, matches, seen, visited);
            } else if (item.typename === "CompoundPathItem") {
                HGColorTools.collectMatches(item.pathItems, sample, mode, matches, seen, visited);
            } else {
                var signature = item.typename === "TextFrame" ? HGColorTools.getTextPaintSignature(item) : HGColorTools.getPathPaintSignature(item);
                var ok = mode === "loose" ? HGColorTools.isLoosePaintSignatureMatch(signature, sample) : HGColorTools.isSamePaintSignature(signature, sample);
                if (ok) HGColorTools.pushUnique(item, matches, seen);
            }
        } catch (e) {}
    }
};

HGColorTools.collectSingleColorMatches = function (items, sampleKey, matches, seen, visited) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (HGColorTools.shouldSkip(item) || HGColorTools.markVisited(item, visited)) continue;
        try {
            if (item.typename === "GroupItem") {
                HGColorTools.collectSingleColorMatches(item.pageItems, sampleKey, matches, seen, visited);
            } else if (item.typename === "CompoundPathItem") {
                HGColorTools.collectSingleColorMatches(item.pathItems, sampleKey, matches, seen, visited);
            } else {
                var signature = item.typename === "TextFrame" ? HGColorTools.getTextPaintSignature(item) : HGColorTools.getPathPaintSignature(item);
                if (HGColorTools.targetHasOnlySampleColor(signature, sampleKey)) HGColorTools.pushUnique(item, matches, seen);
            }
        } catch (e) {}
    }
};

HGColorTools.collectProcessable = function (item, out) {
    if (HGColorTools.shouldSkip(item)) return;
    try {
        if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) HGColorTools.collectProcessable(item.pageItems[i], out);
            return;
        }
        if (item.typename === "CompoundPathItem") {
            for (var j = 0; j < item.pathItems.length; j++) HGColorTools.collectProcessable(item.pathItems[j], out);
            return;
        }
        if (item.typename === "TextFrame" || item.typename === "PathItem") out.push(item);
    } catch (e) {}
};

HGColorTools.applySelectionMask = function (doc, selectedColor, otherColor) {
    var selectedItems = [];
    for (var i = 0; i < doc.selection.length; i++) HGColorTools.collectProcessable(doc.selection[i], selectedItems);
    var selectedMap = {};
    for (var j = 0; j < selectedItems.length; j++) selectedMap[HGColorTools.getItemKey(selectedItems[j])] = true;

    var artRect = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
    for (var k = 0; k < doc.pageItems.length; k++) {
        HGColorTools.applyOtherColorInArtboard(doc.pageItems[k], artRect, selectedMap, otherColor);
    }
    for (var n = 0; n < selectedItems.length; n++) HGColorTools.applyColor(selectedItems[n], selectedColor);
};

HGColorTools.applyOtherColorInArtboard = function (item, artRect, selectedMap, otherColor) {
    if (HGColorTools.shouldSkip(item)) return;
    try {
        if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) HGColorTools.applyOtherColorInArtboard(item.pageItems[i], artRect, selectedMap, otherColor);
            return;
        }
        if (item.typename === "CompoundPathItem") {
            for (var j = 0; j < item.pathItems.length; j++) HGColorTools.applyOtherColorInArtboard(item.pathItems[j], artRect, selectedMap, otherColor);
            return;
        }
        if (!HGColorTools.isItemCenterInArtboard(item, artRect)) return;
        if (selectedMap[HGColorTools.getItemKey(item)]) return;
        HGColorTools.applyColor(item, otherColor);
    } catch (e) {}
};

HGColorTools.applySameMask = function (doc, sampleKey, matchedColor, otherColor) {
    var artRect = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
    for (var i = 0; i < doc.pageItems.length; i++) {
        HGColorTools.applySameMaskInArtboard(doc.pageItems[i], artRect, sampleKey, matchedColor, otherColor);
    }
};

HGColorTools.applySameMaskInArtboard = function (item, artRect, sampleKey, matchedColor, otherColor) {
    if (HGColorTools.shouldSkip(item)) return;
    try {
        if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) HGColorTools.applySameMaskInArtboard(item.pageItems[i], artRect, sampleKey, matchedColor, otherColor);
            return;
        }
        if (item.typename === "CompoundPathItem") {
            for (var j = 0; j < item.pathItems.length; j++) HGColorTools.applySameMaskInArtboard(item.pathItems[j], artRect, sampleKey, matchedColor, otherColor);
            return;
        }
        if (!HGColorTools.isItemCenterInArtboard(item, artRect)) return;
        HGColorTools.applyMatchedColor(item, sampleKey, matchedColor, otherColor);
    } catch (e) {}
};

HGColorTools.isItemCenterInArtboard = function (item, artRect) {
    try {
        var bounds = item.visibleBounds || item.geometricBounds;
        var cx = (bounds[0] + bounds[2]) / 2;
        var cy = (bounds[1] + bounds[3]) / 2;
        return cx >= artRect[0] && cx <= artRect[2] && cy <= artRect[1] && cy >= artRect[3];
    } catch (e) {
        return false;
    }
};

HGColorTools.markVisited = function (item, visited) {
    var key = HGColorTools.getItemKey(item);
    if (visited[key]) return true;
    visited[key] = true;
    return false;
};

HGColorTools.pushUnique = function (item, list, seen) {
    var key = HGColorTools.getItemKey(item);
    if (seen[key]) return;
    seen[key] = true;
    list.push(item);
};

HGColorTools.getItemKey = function (item) {
    try {
        return item.uuid || item.typename + "|" + item.name + "|" + item.geometricBounds.join(",");
    } catch (e) {
        return String(new Date().getTime()) + "|" + Math.random();
    }
};

HGColorTools.selectItems = function (doc, items) {
    try {
        doc.selection = null;
        doc.selection = items;
    } catch (e) {
        doc.selection = null;
        for (var i = 0; i < items.length; i++) {
            try {
                items[i].selected = true;
            } catch (inner) {}
        }
    }
};

