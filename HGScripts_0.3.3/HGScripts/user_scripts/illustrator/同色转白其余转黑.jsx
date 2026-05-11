#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSameWB

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_same_white_others_black";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSameWB", logName)) return;

    var sampleKey = HGColorTools.getSingleColorSampleKey(HGColorTools.findFirstPaintSignature(doc.selection[0]));
    if (!sampleKey) {
        HGColorTools.log(logName, "skip: sample is not single color");
        return;
    }
    HGColorTools.applySameMask(doc, sampleKey, HGColorTools.makeRGB(255, 255, 255), HGColorTools.makeRGB(0, 0, 0));
    HGColorTools.log(logName, "jsx done");
})();

function HGColorTools_load() {
    var root = new File($.fileName).parent;
    $.evalFile(new File(root.fsName + "/lib/HGRuntimeLog.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGCppBridge.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorText.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorCore.jsx"));
}


