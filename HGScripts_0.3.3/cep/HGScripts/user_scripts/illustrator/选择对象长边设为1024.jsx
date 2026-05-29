#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGLongEdge1024

(function () {
    if (!app.documents.length) return;
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) return;

    try {
        app.executeMenuCommand("HGLongEdge1024");
    } catch (e) {}
})();
