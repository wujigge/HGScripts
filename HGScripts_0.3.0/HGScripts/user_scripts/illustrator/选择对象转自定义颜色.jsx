#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectedToCustomColor

(function () {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    if (tryRunCppPlugin()) {
        return;
    }

    if (!hasProcessableSelection(doc.selection)) {
        return;
    }

    var color = pickCustomColor();
    if (!color) {
        return;
    }

    for (var i = 0; i < doc.selection.length; i++) {
        applyColor(doc.selection[i], color);
    }
})();

function tryRunCppPlugin() {
    return tryRunHGScriptsCppCommand("HGSelectedToCustomColor");
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

function hasProcessableSelection(selection) {
    for (var i = 0; i < selection.length; i++) {
        if (canApplyColor(selection[i])) {
            return true;
        }
    }
    return false;
}

function canApplyColor(item) {
    if (!item || item.locked || item.hidden) return false;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            if (canApplyColor(item.pageItems[i])) {
                return true;
            }
        }
        return false;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            if (canApplyColor(item.pathItems[j])) {
                return true;
            }
        }
        return false;
    }

    if (item.typename === "TextFrame") {
        try {
            var attrs = item.textRange.characterAttributes;
            return (attrs.fillColor && attrs.fillColor.typename !== "NoColor") ||
                (attrs.strokeColor && attrs.strokeColor.typename !== "NoColor");
        } catch (e1) {
            return false;
        }
    }

    try {
        if (item.filled || item.stroked) {
            return true;
        }
    } catch (e2) {}

    return false;
}

function applyColor(item, color) {
    if (!item || item.locked || item.hidden) return;

    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            applyColor(item.pageItems[i], color);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            applyColor(item.pathItems[j], color);
        }
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
