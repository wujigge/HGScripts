#target illustrator

$.global.HGColorTools = $.global.HGColorTools || {};
var HGColorTools = $.global.HGColorTools;

HGColorTools.getExtensionRoot = function () {
    try {
        var current = new File($.fileName).parent;
        while (current && current.exists) {
            if (current.name === "HGScripts") return current;
            current = current.parent;
        }
    } catch (e) {}
    return null;
};

HGColorTools.getRuntimeFolder = function () {
    try {
        var root = HGColorTools.getExtensionRoot();
        if (root) {
            var dataFolder = new Folder(root.fsName + "/data");
            if (!dataFolder.exists) dataFolder.create();
            var runtimeFolder = new Folder(dataFolder.fsName + "/runtime");
            if (!runtimeFolder.exists) runtimeFolder.create();
            return runtimeFolder;
        }
    } catch (e) {}

    var fallback = new Folder(Folder.userData + "/HGScripts/color_tools");
    if (!fallback.exists) fallback.create();
    return fallback;
};

HGColorTools.log = function (name, message) {
    try {
        var folder = HGColorTools.getRuntimeFolder();
        var file = new File(folder.fsName + "/" + name + ".log");
        file.encoding = "UTF-8";
        file.open("a");
        file.writeln("[" + HGColorTools.timestamp() + "] " + message);
        file.close();
    } catch (e) {}
};

HGColorTools.timestamp = function () {
    var d = new Date();
    function pad(value) {
        return value < 10 ? "0" + value : String(value);
    }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
        " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
};


