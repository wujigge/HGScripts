#target illustrator

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

    var sample = getSingleColorSample(doc.selection[0]);
    if (!sample.ok) {
        alert(sample.message);
        return;
    }

    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artRect = artboard.artboardRect;
    var white = makeRGB(255, 255, 255);
    var black = makeRGB(0, 0, 0);

    for (var i = 0; i < doc.pageItems.length; i++) {
        applyMaskColor(doc.pageItems[i], artRect, sample.key, black, white);
    }
})();

function getSingleColorSample(item) {
    var keys = [];
    collectColorKeys(item, keys, true);

    if (keys.length === 0) {
        return {
            ok: false,
            message: "\u9009\u4e2d\u5bf9\u8c61\u6ca1\u6709\u53ef\u7528\u7684\u586b\u5145\u6216\u63cf\u8fb9\u989c\u8272"
        };
    }

    var firstKey = keys[0];
    for (var i = 1; i < keys.length; i++) {
        if (keys[i] !== firstKey) {
            return {
                ok: false,
                message: "\u8bf7\u9009\u62e9\u5355\u8272\u5bf9\u8c61\u6216\u5355\u8272\u7ec4\uff1a\u5f53\u524d\u9009\u4e2d\u5185\u5bb9\u5305\u542b\u591a\u79cd\u586b\u5145\u6216\u63cf\u8fb9\u989c\u8272"
            };
        }
    }

    return {
        ok: true,
        key: firstKey
    };
}

function collectColorKeys(item, keys, allowAlertUnsupported) {
    if (!isProcessable(item)) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            collectColorKeys(item.pageItems[i], keys, allowAlertUnsupported);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            collectColorKeys(item.pathItems[j], keys, allowAlertUnsupported);
        }
        return;
    }

    if (item.typename === "TextFrame") {
        collectTextColorKeys(item, keys);
        return;
    }

    try {
        if (item.filled) pushColorKey(item.fillColor, keys, allowAlertUnsupported);
    } catch (e1) {}

    try {
        if (item.stroked) pushColorKey(item.strokeColor, keys, allowAlertUnsupported);
    } catch (e2) {}
}

function collectTextColorKeys(textFrame, keys) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        pushColorKey(attrs.fillColor, keys, false);
        pushColorKey(attrs.strokeColor, keys, false);
    } catch (e) {}
}

function pushColorKey(color, keys, allowUnsupported) {
    var key = colorToKey(color);
    if (key) {
        keys.push(key);
    } else if (allowUnsupported && color && color.typename && color.typename !== "NoColor") {
        keys.push("UNSUPPORTED|" + color.typename);
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

    try {
        if (item.filled) {
            item.fillColor = colorToKey(item.fillColor) === sampleKey ? matchedColor : otherColor;
        }
    } catch (e1) {}

    try {
        if (item.stroked) {
            item.strokeColor = colorToKey(item.strokeColor) === sampleKey ? matchedColor : otherColor;
        }
    } catch (e2) {}
}

function applyMaskColorToText(textFrame, sampleKey, matchedColor, otherColor) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        if (attrs.fillColor && attrs.fillColor.typename !== "NoColor") {
            attrs.fillColor = colorToKey(attrs.fillColor) === sampleKey ? matchedColor : otherColor;
        }
        if (attrs.strokeColor && attrs.strokeColor.typename !== "NoColor") {
            attrs.strokeColor = colorToKey(attrs.strokeColor) === sampleKey ? matchedColor : otherColor;
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

function makeRGB(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}
