#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGSingleColorToCustomColor

(function () {
    HGColorTools_load();
    var HGColorTools = $.global.HGColorTools;
    var logName = "color_single_color_to_custom";
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;
    if (HGColorTools.tryCppCommand("HGSingleColorToCustomColor", logName)) return;

    var sampleKey = HGColorTools.getSingleColorSampleKey(HGColorTools.findFirstPaintSignature(doc.selection[0]));
    if (!sampleKey) {
        HGColorTools.log(logName, "skip: sample is not single color");
        return;
    }
    var color = HGColorTools.pickCustomColor();
    if (!color) {
        HGColorTools.log(logName, "skip: color picker cancelled or unavailable");
        return;
    }
    var matches = [];
    HGColorTools.collectSingleColorMatches(doc.pageItems, sampleKey, matches, {}, {});
    for (var i = 0; i < matches.length; i++) {
        HGColorTools.applyColor(matches[i], color);
    }
    HGColorTools.log(logName, "jsx matches=" + matches.length);
})();

function HGColorTools_load() {
    var root = new File($.fileName).parent;
    $.evalFile(new File(root.fsName + "/lib/HGRuntimeLog.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGCppBridge.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorText.jsx"));
    $.evalFile(new File(root.fsName + "/lib/HGColorCore.jsx"));
}


