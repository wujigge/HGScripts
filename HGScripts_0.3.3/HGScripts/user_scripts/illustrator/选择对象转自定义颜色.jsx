#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectedToCustomColor

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_selected_to_custom";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSelectedToCustomColor", logName)) return;

    var color = HGColorTools.pickCustomColor();
    if (!color) {
        HGColorTools.log(logName, "skip: color picker cancelled or unavailable");
        return;
    }
    for (var i = 0; i < doc.selection.length; i++) {
        HGColorTools.applyColor(doc.selection[i], color);
    }
    HGColorTools.log(logName, "jsx done");
})();

function HGColorTools_load() {
    var root = new File($.fileName).parent;
    $.evalFile(new File(root.fsName + "/lib/HGRuntimeLog.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGCppBridge.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorText.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorCore.jsx"));
}


