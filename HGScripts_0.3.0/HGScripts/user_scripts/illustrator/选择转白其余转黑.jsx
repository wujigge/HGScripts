#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectionWhiteOthersBlack

(function () {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    if (tryRunCppPlugin()) {
        return;
    }

    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artRect = artboard.artboardRect;
    var white = makeRGB(255, 255, 255);
    var black = makeRGB(0, 0, 0);

    var selectedItems = [];
    collectSelectableItems(doc.selection, selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
        applyColor(selectedItems[i], white);
    }

    var selectedMap = {};
    for (var j = 0; j < selectedItems.length; j++) {
        selectedMap[getItemKey(selectedItems[j])] = true;
    }

    for (var k = 0; k < doc.pageItems.length; k++) {
        applyBlackToUnselectedInArtboard(doc.pageItems[k], artRect, selectedMap, black);
    }
})();

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSelectionWhiteOthersBlack");
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

function applyBlackToUnselectedInArtboard(item, artRect, selectedMap, black) {
    if (!isProcessable(item)) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            applyBlackToUnselectedInArtboard(item.pageItems[i], artRect, selectedMap, black);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            applyBlackToUnselectedInArtboard(item.pathItems[j], artRect, selectedMap, black);
        }
        return;
    }

    if (selectedMap[getItemKey(item)]) return;
    if (!isItemCenterInArtboard(item, artRect)) return;

    applyColor(item, black);
}

function collectSelectableItems(items, out) {
    for (var i = 0; i < items.length; i++) {
        collectItem(items[i], out);
    }
}

function collectItem(item, out) {
    if (!isProcessable(item)) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            collectItem(item.pageItems[i], out);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            collectItem(item.pathItems[j], out);
        }
        return;
    }

    out.push(item);
}

function applyColor(item, color) {
    if (!isProcessable(item)) return;

    if (item.typename === "TextFrame") {
        applyColorToText(item, color);
        return;
    }

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

function makeRGB(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}
