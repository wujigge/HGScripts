#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSelectSameColorObjects

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_select_same_strict";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSelectSameColorObjects", logName)) return;

    var sample = HGColorTools.findFirstPaintSignature(doc.selection[0]);
    if (!sample) {
        HGColorTools.log(logName, "skip: invalid sample");
        return;
    }
    var matches = [];
    HGColorTools.collectMatches(doc.pageItems, sample, "strict", matches, {}, {});
    HGColorTools.selectItems(doc, matches);
    HGColorTools.log(logName, "jsx selected=" + matches.length);
})();

function HGColorTools_load() {
    var root = new File($.fileName).parent;
    $.evalFile(new File(root.fsName + "/lib/HGRuntimeLog.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGCppBridge.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorText.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorCore.jsx"));
}


