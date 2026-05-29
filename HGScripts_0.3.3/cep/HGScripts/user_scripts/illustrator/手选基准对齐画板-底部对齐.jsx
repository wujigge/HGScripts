#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGBasisAlignArtboardBottom

(function () {
    var ENTRY_MODE = "bottom";
    var ENTRY_CPP_COMMAND = "HGBasisAlignArtboardBottom";
    var ENTRY_VERSION = "2026-05-15-1750-cpp";

    var coreFile = new File(new File($.fileName).parent.fsName + "/../../assets/jsx/illustrator_lib/HGBasisArtboardAlignCore.jsx");

    if (tryRunCppPlugin(ENTRY_CPP_COMMAND)) {
        return;
    }

    if (!coreFile.exists) {
        return;
    }

    try {
        $.evalFile(coreFile);
        $.global.HGBasisArtboardAlignCore.run(ENTRY_MODE);
    } catch (e) {
    }

    function tryRunCppPlugin(command) {
        var mode = getHGScriptsCppMode();
        if (mode === "jsx") {
            return false;
        }

        try {
            app.executeMenuCommand(command);
            return true;
        } catch (e) {
            return false;
        }
    }

    function getHGScriptsCppMode() {
        try {
            if (typeof HGSCRIPTS_CPP_MODE !== "undefined") {
                var mode = String(HGSCRIPTS_CPP_MODE).toLowerCase();
                if (mode === "cpp" || mode === "jsx") return mode;
            }
        } catch (e) {}
        return "auto";
    }
})();

