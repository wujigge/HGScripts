#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectedToWhite

(function () {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    if (tryRunCppPlugin()) {
        return;
    }

    var white = makeRGB(255, 255, 255);

    for (var i = 0; i < doc.selection.length; i++) {
        applyWhite(doc.selection[i], white);
    }
})();

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSelectedToWhite");
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
