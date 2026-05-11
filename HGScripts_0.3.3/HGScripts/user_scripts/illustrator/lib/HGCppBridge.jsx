#target illustrator

$.global.HGColorTools = $.global.HGColorTools || {};
var HGColorTools = $.global.HGColorTools;

HGColorTools.getCppMode = function () {
    try {
        if (typeof HGSCRIPTS_CPP_MODE !== "undefined") {
            var mode = String(HGSCRIPTS_CPP_MODE).toLowerCase();
            if (mode === "cpp" || mode === "jsx") return mode;
        }
    } catch (e) {}
    return "auto";
};

HGColorTools.tryCppCommand = function (command, logName) {
    if (HGColorTools.getCppMode() === "jsx") {
        HGColorTools.log(logName || "color_tools", "cpp skipped by mode: jsx");
        return false;
    }

    try {
        app.executeMenuCommand(command);
        HGColorTools.log(logName || "color_tools", "cpp command success: " + command);
        return true;
    } catch (e) {
        HGColorTools.log(logName || "color_tools", "cpp command failed: " + command + " / " + e);
        return false;
    }
};

