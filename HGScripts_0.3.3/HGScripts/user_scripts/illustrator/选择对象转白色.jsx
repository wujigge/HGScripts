#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectedToWhite

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_selected_to_white";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSelectedToWhite", logName)) return;

    var white = HGColorTools.makeRGB(255, 255, 255);
    for (var i = 0; i < doc.selection.length; i++) {
        HGColorTools.applyColor(doc.selection[i], white);
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


