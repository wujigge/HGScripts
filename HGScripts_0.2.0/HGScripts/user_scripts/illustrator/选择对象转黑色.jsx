#target illustrator

(function () {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    var black = makeRGB(0, 0, 0);

    for (var i = 0; i < doc.selection.length; i++) {
        applyBlack(doc.selection[i], black);
    }
})();

function applyBlack(item, black) {
    if (!item || item.locked || item.hidden) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            applyBlack(item.pageItems[i], black);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            applyBlack(item.pathItems[j], black);
        }
        return;
    }

    if (item.typename === "TextFrame") {
        applyBlackToText(item, black);
        return;
    }

    applyBlackToPageItem(item, black);
}

function applyBlackToPageItem(item, black) {
    try {
        if (item.filled) {
            item.fillColor = black;
        }
    } catch (e1) {}

    try {
        if (item.stroked) {
            item.strokeColor = black;
        }
    } catch (e2) {}
}

function applyBlackToText(textFrame, black) {
    try {
        var attrs = textFrame.textRange.characterAttributes;
        if (attrs.fillColor && attrs.fillColor.typename !== "NoColor") {
            attrs.fillColor = black;
        }
        if (attrs.strokeColor && attrs.strokeColor.typename !== "NoColor") {
            attrs.strokeColor = black;
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
