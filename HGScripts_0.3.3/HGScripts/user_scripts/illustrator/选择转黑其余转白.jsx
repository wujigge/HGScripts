#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectionBlackOthersWhite

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_selection_black_others_white";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSelectionBlackOthersWhite", logName)) return;

    HGColorTools.applySelectionMask(doc, HGColorTools.makeRGB(0, 0, 0), HGColorTools.makeRGB(255, 255, 255));
    HGColorTools.log(logName, "jsx done");
})();

function HGColorTools_load() {
    var root = new File($.fileName).parent;
    $.evalFile(new File(root.fsName + "/lib/HGRuntimeLog.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGCppBridge.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorText.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorCore.jsx"));
}


