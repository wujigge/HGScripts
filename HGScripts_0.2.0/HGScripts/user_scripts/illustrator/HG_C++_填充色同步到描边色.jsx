#target illustrator

(function () {
    runHGCommand(["HG_FillToStroke", "HG Fill To Stroke"]);
})();

function runHGCommand(commands) {
    if (app.documents.length === 0) {
        alert("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a Illustrator \u6587\u6863\u3002");
        return;
    }

    var lastError = null;
    for (var i = 0; i < commands.length; i++) {
        try {
            app.executeMenuCommand(commands[i]);
            return;
        } catch (err) {
            lastError = err;
        }
    }

    alert("\u6ca1\u6709\u6210\u529f\u8c03\u7528 HGIllustratorTools C++ \u63d2\u4ef6\u547d\u4ee4\u3002\n\n\u8bf7\u786e\u8ba4 HGIllustratorTools.aip \u5df2\u52a0\u8f7d\uff0c\u5e76\u91cd\u542f Illustrator\u3002\n\n" + lastError);
}
