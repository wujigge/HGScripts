#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a Illustrator \u6587\u6863");
        return;
    }

    var doc = app.activeDocument;
    var selectedSwatches = doc.swatches.getSelected();
    if (!selectedSwatches || selectedSwatches.length === 0) {
        alert("\u8bf7\u5148\u5728\u8272\u677f\u9762\u677f\u4e2d\u9009\u4e2d\u4e00\u4e2a\u8272\u677f");
        return;
    }

    var sampleKey = colorToKey(selectedSwatches[0].color);
    if (!sampleKey) {
        alert("\u5f53\u524d\u8272\u677f\u989c\u8272\u4e0d\u652f\u6301\u4f5c\u4e3a\u9009\u62e9\u6761\u4ef6");
        return;
    }

    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artRect = artboard.artboardRect;
    var matches = [];
    var seen = {};

    doc.selection = null;

    for (var i = 0; i < doc.pageItems.length; i++) {
        collectSameColorItems(doc.pageItems[i], artRect, sampleKey, matches, seen);
    }

    for (var j = 0; j < matches.length; j++) {
        try {
            matches[j].selected = true;
        } catch (e) {}
    }
})();

function collectSameColorItems(item, artRect, sampleKey, matches, seen) {
    if (!isProcessable(item)) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            collectSameColorItems(item.pageItems[i], artRect, sampleKey, matches, seen);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            collectSameColorItems(item.pathItems[j], artRect, sampleKey, matches, seen);
        }
        return;
    }

    if (!isItemCenterInArtboard(item, artRect)) return;
    if (!itemHasColor(item, sampleKey)) return;

    var key = getItemKey(item);
    if (seen[key]) return;
    seen[key] = true;
    matches.push(item);
}

function itemHasColor(item, sampleKey) {
    if (item.typename === "TextFrame") {
        return textHasColor(item, sampleKey);
    }

    try {
        if (item.filled && colorToKey(item.fillColor) === sampleKey) return true;
    } catch (e1) {}

    try {
        if (item.stroked && colorToKey(item.strokeColor) === sampleKey) return true;
    } catch (e2) {}

    return false;
}

function textHasColor(textFrame, sampleKey) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        if (attrs.fillColor && colorToKey(attrs.fillColor) === sampleKey) return true;
        if (attrs.strokeColor && colorToKey(attrs.strokeColor) === sampleKey) return true;
    } catch (e) {}

    return false;
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

    return null;
}

function roundColor(value) {
    return Math.round(Number(value) * 1000) / 1000;
}

function isProcessable(item) {
    if (!item || item.locked || item.hidden) return false;
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

function getItemKey(item) {
    try {
        return item.uuid || item.name + "|" + item.typename + "|" + item.geometricBounds.join(",");
    } catch (e) {
        return String(item);
    }
}
