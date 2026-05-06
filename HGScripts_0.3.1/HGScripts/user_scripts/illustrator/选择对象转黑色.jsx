#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectedToBlack

(function () {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    if (tryRunCppPlugin()) {
        return;
    }

    var black = makeRGB(0, 0, 0);

    for (var i = 0; i < doc.selection.length; i++) {
        applyBlack(doc.selection[i], black);
    }
})();

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSelectedToBlack");
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
