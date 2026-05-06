(function () {
    var fs = null;
    var path = null;
    var cs = null;
    var root = "";
    var scripts = [];
    var filtered = [];
    var selectedIndex = -1;
    var lastResult = "";

    function byId(id) {
        return document.getElementById(id);
    }

    function nowText() {
        var d = new Date();
        function pad(n) {
            return n < 10 ? "0" + n : String(n);
        }
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
            pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }

    function writeLog(message) {
        try {
            if (!fs || !path || !root) {
                return;
            }
            var dir = path.join(root, "data", "runtime");
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            fs.appendFileSync(path.join(dir, "panel_2023_safe.log"), "[" + nowText() + "] " + message + "\r\n", "utf8");
        } catch (err) {}
    }

    function setStatus(message) {
        byId("status").innerHTML = escapeHtml(message);
        writeLog("status: " + message);
    }

    function setOutput(message) {
        lastResult = String(message || "");
        byId("output").innerHTML = escapeHtml(lastResult);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function jsxString(value) {
        return "\"" + String(value || "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\\"")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n") + "\"";
    }

    function readJsonFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (err) {
            writeLog("read json failed: " + filePath + " / " + err);
            return null;
        }
    }

    function getSources() {
        var fallback = [{
            name: "默认脚本",
            folder: path.join(root, "user_scripts", "illustrator"),
            enabled: true
        }];
        var settings = readJsonFile(path.join(root, "data", "settings.json"));
        var raw = settings && settings.storage ? settings.storage["hgscripts.illustrator.sources"] : "";
        if (!raw) {
            return fallback;
        }
        try {
            var parsed = JSON.parse(raw);
            var result = [];
            for (var i = 0; i < parsed.length; i++) {
                if (parsed[i] && parsed[i].enabled !== false && parsed[i].folder) {
                    result.push({
                        name: parsed[i].name || "脚本来源",
                        folder: parsed[i].folder,
                        enabled: true
                    });
                }
            }
            return result.length ? result : fallback;
        } catch (err) {
            writeLog("parse sources failed: " + err);
            return fallback;
        }
    }

    function isIgnoredDir(name) {
        var lower = String(name || "").toLowerCase();
        return lower === "node_modules" || lower === ".git" || lower === ".svn" || lower === ".hg";
    }

    function walk(dir, sourceName, depth) {
        var names;
        if (depth < 0 || !fs.existsSync(dir)) {
            return;
        }
        try {
            names = fs.readdirSync(dir);
        } catch (err) {
            writeLog("readdir failed: " + dir + " / " + err);
            return;
        }
        names.sort(function (a, b) {
            return String(a).localeCompare(String(b));
        });
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var full = path.join(dir, name);
            var stat = null;
            try {
                stat = fs.statSync(full);
            } catch (errStat) {
                continue;
            }
            if (stat.isDirectory()) {
                if (!isIgnoredDir(name)) {
                    walk(full, sourceName, depth - 1);
                }
                continue;
            }
            if (/\.jsx?$/i.test(name)) {
                scripts.push({
                    name: name,
                    source: sourceName,
                    fullPath: full
                });
            }
        }
    }

    function scanScripts() {
        scripts = [];
        selectedIndex = -1;
        var sources = getSources();
        for (var i = 0; i < sources.length; i++) {
            walk(sources[i].folder, sources[i].name, 5);
        }
        applyFilter();
        setStatus("已加载 " + scripts.length + " 个 Illustrator 脚本");
    }

    function applyFilter() {
        var q = String(byId("search").value || "").toLowerCase();
        filtered = [];
        for (var i = 0; i < scripts.length; i++) {
            var hay = (scripts[i].name + " " + scripts[i].fullPath + " " + scripts[i].source).toLowerCase();
            if (!q || hay.indexOf(q) >= 0) {
                filtered.push(scripts[i]);
            }
        }
        renderList();
    }

    function renderList() {
        var list = byId("list");
        var html = "";
        if (!filtered.length) {
            list.innerHTML = '<div style="padding:12px;color:#aeb7bd;">没有找到脚本</div>';
            return;
        }
        for (var i = 0; i < filtered.length; i++) {
            var cls = "item" + (i === selectedIndex ? " selected" : "");
            html += '<button class="' + cls + '" data-index="' + i + '">' +
                '<span class="name">' + escapeHtml(filtered[i].name) + '</span>' +
                '<span class="path">' + escapeHtml(filtered[i].source + " - " + filtered[i].fullPath) + '</span>' +
                '</button>';
        }
        list.innerHTML = html;
        var buttons = list.getElementsByTagName("button");
        for (var b = 0; b < buttons.length; b++) {
            buttons[b].onclick = function () {
                selectedIndex = parseInt(this.getAttribute("data-index"), 10);
                renderList();
                setStatus("已选中: " + filtered[selectedIndex].name);
            };
            buttons[b].ondblclick = function () {
                selectedIndex = parseInt(this.getAttribute("data-index"), 10);
                runSelected();
            };
        }
    }

    function parseResult(raw) {
        try {
            var obj = JSON.parse(raw);
            var text = obj.message || raw;
            if (!obj.ok) {
                if (obj.file) {
                    text += "\n文件: " + obj.file;
                }
                if (obj.line) {
                    text += "\n行号: " + obj.line;
                }
            }
            return text;
        } catch (err) {
            return raw;
        }
    }

    function runSelected() {
        if (selectedIndex < 0 || !filtered[selectedIndex]) {
            setStatus("请先选择一个脚本");
            return;
        }
        var item = filtered[selectedIndex];
        setStatus("正在运行: " + item.name);
        setOutput("运行中...\n" + item.fullPath);
        writeLog("run: " + item.fullPath);
        try {
            cs.evalScript("HGScripts.runScript(" + jsxString(item.fullPath) + ", \"auto\")", function (result) {
                var text = parseResult(result);
                setOutput(text);
                setStatus("运行完成: " + item.name);
                writeLog("result: " + result);
            });
        } catch (err) {
            setOutput("运行失败: " + err);
            setStatus("运行失败: " + item.name);
            writeLog("run failed: " + err);
        }
    }

    function copyResult() {
        try {
            var text = lastResult || "";
            var ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setStatus("结果已复制");
        } catch (err) {
            setStatus("复制失败: " + err);
        }
    }

    function boot() {
        try {
            cs = new CSInterface();
            fs = require("fs");
            path = require("path");
            root = cs.getSystemPath(SystemPath.EXTENSION);
            writeLog("boot begin, root=" + root);
            byId("refreshBtn").onclick = scanScripts;
            byId("runBtn").onclick = runSelected;
            byId("copyBtn").onclick = copyResult;
            byId("search").oninput = applyFilter;
            scanScripts();
            setOutput("安全面板已启动。双击脚本也可以运行。");
            writeLog("boot done");
        } catch (err) {
            setStatus("安全面板启动失败");
            setOutput(String(err && err.stack ? err.stack : err));
            try {
                if (fs && path && root) {
                    writeLog("boot failed: " + err);
                }
            } catch (errLog) {}
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
