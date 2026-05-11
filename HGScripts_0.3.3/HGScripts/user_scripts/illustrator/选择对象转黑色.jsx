#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectedToBlack

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_selected_to_black";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSelectedToBlack", logName)) return;

    var black = HGColorTools.makeRGB(0, 0, 0);
    for (var i = 0; i < doc.selection.length; i++) {
        HGColorTools.applyColor(doc.selection[i], black);
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


