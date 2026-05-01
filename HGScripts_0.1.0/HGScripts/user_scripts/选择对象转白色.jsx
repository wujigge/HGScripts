#target illustrator

(function () {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    var white = makeRGB(255, 255, 255);

    for (var i = 0; i < doc.selection.length; i++) {
        applyWhite(doc.selection[i], white);
    }
})();

function applyWhite(item, white) {
    if (!item || item.locked || item.hidden) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            applyWhite(item.pageItems[i], white);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            applyWhite(item.pathItems[j], white);
        }
        return;
    }

    if (item.typename === "TextFrame") {
        applyWhiteToText(item, white);
        return;
    }

    applyWhiteToPageItem(item, white);
}

function applyWhiteToPageItem(item, white) {
    try {
        if (item.filled) {
            item.fillColor = white;
        }
    } catch (e1) {}

    try {
        if (item.stroked) {
            item.strokeColor = white;
        }
    } catch (e2) {}
}

function applyWhiteToText(textFrame, white) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        if (attrs.fillColor && attrs.fillColor.typename !== "NoColor") {
            attrs.fillColor = white;
        }
        if (attrs.strokeColor && attrs.strokeColor.typename !== "NoColor") {
            attrs.strokeColor = white;
        }
    } catch (e) {}
}

function makeRGB(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}
