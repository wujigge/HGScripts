/*
Run_SelectNoPaintObjects.jsx

Calls the already-loaded SelectNoPaintObjects C++ plug-in from Illustrator JSX.
The .aip plug-in must be loaded when Illustrator starts.
*/

(function () {
    if (app.documents.length === 0) {
        alert("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a Illustrator \u6587\u6863\u3002");
        return;
    }

    var commands = [
        "SelectNoPaintObjects",
        "Select No Paint Objects"
    ];

    var lastError = null;

    for (var i = 0; i < commands.length; i++) {
        try {
            app.executeMenuCommand(commands[i]);
            return;
        } catch (err) {
            lastError = err;
        }
    }

    alert(
        "\u6ca1\u6709\u6210\u529f\u8c03\u7528 SelectNoPaintObjects \u63d2\u4ef6\u3002\n\n" +
        "\u8bf7\u786e\u8ba4\uff1a\n" +
        "1. SelectNoPaintObjects.aip \u5df2\u653e\u5728 Illustrator \u4f1a\u626b\u63cf\u7684\u63d2\u4ef6\u76ee\u5f55\u3002\n" +
        "2. Illustrator \u5df2\u7ecf\u91cd\u542f\u5e76\u52a0\u8f7d\u8be5\u63d2\u4ef6\u3002\n" +
        "3. \u83dc\u5355\u91cc\u80fd\u770b\u5230 Window > Select No Paint Objects\u3002\n\n" +
        "\u6700\u540e\u9519\u8bef\uff1a\n" + lastError
    );
})();
