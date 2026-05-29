#target illustrator
// hgscripts-badge: cpp
// hgscripts-cpp-plugin: HGColorTools.aip
// hgscripts-cpp-command: HGBasisScaleToWidth

(function () {
    var SCRIPT_NAME = "手选基准缩放";
    var DEFAULT_TARGET_WIDTH = "1024";
    var EPSILON = 0.01;

    if (!app.documents.length) {
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length !== 1) {
        return;
    }

    var selectionSnapshot = captureSelection(doc.selection);
    var basisItem = selectionSnapshot.length ? selectionSnapshot[0].item : doc.selection[0];
    if (!basisItem) {
        return;
    }

    var targetInput = prompt("输入基准对象的目标宽度：", getTargetInput(), SCRIPT_NAME);
    if (targetInput === null) {
        return;
    }

    var targetWidth = parseLengthToPoints(targetInput);
    if (!(targetWidth > EPSILON)) {
        return;
    }

    if (writeBasisScaleTargetWidth(targetWidth) && tryRunCppPlugin()) {
        return;
    }

    var currentWidth = getItemWidth(basisItem);
    if (!(currentWidth > EPSILON)) {
        return;
    }

    var scaleTarget = getTopmostParentGroup(basisItem);
    if (!scaleTarget) {
        scaleTarget = basisItem;
    }

    if (!canEdit(scaleTarget)) {
        return;
    }

    var scalePercent = targetWidth / currentWidth * 100;

    if (!resizeWholeTarget(doc, selectionSnapshot, scaleTarget, scalePercent)) {
        return;
    }


    function resizeWholeTarget(doc, selectionSnapshot, item, scalePercent) {
        if (scaleByNativeAction(doc, selectionSnapshot, item, scalePercent)) {
            return true;
        }

        try {
            item.resize(
                scalePercent,
                scalePercent,
                true,
                true,
                true,
                true,
                scalePercent,
                Transformation.CENTER
            );
            restoreSelection(doc, selectionSnapshot);
            return true;
        } catch (e1) {
            try {
                item.resize(scalePercent, scalePercent);
                restoreSelection(doc, selectionSnapshot);
                return true;
            } catch (e2) {
                return false;
            }
        }
    }

    function scaleByNativeAction(doc, selectionSnapshot, item, scalePercent) {
        var oldInteractionLevel = null;
        var changedInteractionLevel = false;

        try {
            oldInteractionLevel = app.userInteractionLevel;
            app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
            changedInteractionLevel = true;

            doc.selection = null;
            item.selected = true;

            var actionSetName = "HGBasisScaleTempSet";
            var actionName = "HGBasisScale";
            runScaleAction(actionSetName, actionName, scalePercent);

            restoreSelection(doc, selectionSnapshot);

            return true;
        } catch (e) {
            try {
                restoreSelection(doc, selectionSnapshot);
            } catch (restoreError) {}
            return false;
        } finally {
            if (changedInteractionLevel) {
                try {
                    app.userInteractionLevel = oldInteractionLevel;
                } catch (interactionError) {}
            }
        }
    }

    function runScaleAction(actionSetName, actionName, scalePercent) {
        var actionFile = null;
        try {
            try {
                app.unloadAction(actionSetName, "");
            } catch (unloadBeforeError) {}

            actionFile = File(Folder.temp + "/HGBasisScaleTempAction.aia");
            actionFile.encoding = "UTF-8";
            if (!actionFile.open("w")) {
                throw new Error("cannot open temp action file");
            }
            actionFile.write(buildScaleActionText(actionSetName, actionName, scalePercent));
            actionFile.close();

            app.loadAction(actionFile);
            app.doScript(actionName, actionSetName);
        } finally {
            try {
                app.unloadAction(actionSetName, "");
            } catch (unloadAfterError) {}

            if (actionFile) {
                try {
                    if (actionFile.exists) actionFile.remove();
                } catch (removeError) {}
            }
        }
    }

    function buildScaleActionText(actionSetName, actionName, scalePercent) {
        var percentText = actionNumber(scalePercent);
        return [
            "/version 3",
            "/name [ " + actionSetName.length,
            "\t" + asciiHex(actionSetName),
            "]",
            "/isOpen 0",
            "/actionCount 1",
            "/action-1 {",
            "\t/name [ " + actionName.length,
            "\t\t" + asciiHex(actionName),
            "\t]",
            "\t/keyIndex 0",
            "\t/colorIndex 0",
            "\t/isOpen 0",
            "\t/eventCount 1",
            "\t/event-1 {",
            "\t\t/useRulersIn1stQuadrant 0",
            "\t\t/internalName (adobe_scale)",
            "\t\t/localizedName [ 5",
            "\t\t\t5363616c65",
            "\t\t]",
            "\t\t/isOpen 0",
            "\t\t/isOn 1",
            "\t\t/hasDialog 1",
            "\t\t/showDialog 0",
            "\t\t/parameterCount 5",
            "\t\t/parameter-1 {",
            "\t\t\t/key 1970169453",
            "\t\t\t/showInPalette -1",
            "\t\t\t/type (boolean)",
            "\t\t\t/value 0",
            "\t\t}",
            "\t\t/parameter-2 {",
            "\t\t\t/key 1818848869",
            "\t\t\t/showInPalette -1",
            "\t\t\t/type (boolean)",
            "\t\t\t/value 1",
            "\t\t}",
            "\t\t/parameter-3 {",
            "\t\t\t/key 1752136302",
            "\t\t\t/showInPalette -1",
            "\t\t\t/type (unit real)",
            "\t\t\t/value " + percentText,
            "\t\t\t/unit 592474723",
            "\t\t}",
            "\t\t/parameter-4 {",
            "\t\t\t/key 1987339116",
            "\t\t\t/showInPalette -1",
            "\t\t\t/type (unit real)",
            "\t\t\t/value " + percentText,
            "\t\t\t/unit 592474723",
            "\t\t}",
            "\t\t/parameter-5 {",
            "\t\t\t/key 1668247673",
            "\t\t\t/showInPalette -1",
            "\t\t\t/type (boolean)",
            "\t\t\t/value 0",
            "\t\t}",
            "\t}",
            "}"
        ].join("\n");
    }

    function selectionToArray(selection) {
        var result = [];
        try {
            if (!selection) return result;
            for (var i = 0; i < selection.length; i++) {
                result.push(selection[i]);
            }
        } catch (e) {}
        return result;
    }

    function captureSelection(selection) {
        var items = selectionToArray(selection);
        var result = [];
        for (var i = 0; i < items.length; i++) {
            result.push({
                item: items[i],
                uuid: getItemUuid(items[i])
            });
        }
        return result;
    }

    function getItemUuid(item) {
        try {
            if (item.uuid) return String(item.uuid);
        } catch (e) {}
        return "";
    }

    function resolveSelectionItems(doc, snapshot) {
        var result = [];
        for (var i = 0; i < snapshot.length; i++) {
            var item = null;
            var uuid = snapshot[i].uuid;

            if (uuid) {
                try {
                    if (doc.getPageItemFromUuid) {
                        item = doc.getPageItemFromUuid(uuid);
                    }
                } catch (uuidError) {
                    item = null;
                }
            }

            if (!item) {
                item = snapshot[i].item;
            }

            if (isLiveItem(item)) {
                result.push(item);
            }
        }
        return result;
    }

    function isLiveItem(item) {
        try {
            if (!item || !item.typename) return false;
            var b = item.geometricBounds;
            return !!b;
        } catch (e) {
            return false;
        }
    }

    function restoreSelection(doc, snapshot) {
        try {
            app.redraw();
        } catch (redrawError) {}

        var items = resolveSelectionItems(doc, snapshot);
        if (!items.length) return;

        try {
            doc.selection = null;
            doc.selection = items;
            if (doc.selection && doc.selection.length === items.length) return;
        } catch (setSelectionError) {
        }

        try {
            doc.selection = null;
            for (var i = 0; i < items.length; i++) {
                try {
                    items[i].selected = true;
                } catch (e) {}
            }
        } catch (fallbackError) {
        }
    }

    function asciiHex(text) {
        var result = "";
        for (var i = 0; i < text.length; i++) {
            var hex = text.charCodeAt(i).toString(16);
            if (hex.length < 2) hex = "0" + hex;
            result += hex;
        }
        return result;
    }

    function actionNumber(value) {
        var n = Number(value);
        if (isNaN(n)) return "100";
        return String(Math.round(n * 1000000) / 1000000);
    }

    function getTopmostParentGroup(item) {
        try {
            if (item.typename === "GroupItem") return item;

            var parent = item.parent;
            var topGroup = null;

            while (parent && parent !== app) {
                if (parent.typename === "GroupItem") {
                    topGroup = parent;
                }

                if (parent.typename === "Layer" || parent.typename === "Document") {
                    break;
                }

                parent = parent.parent;
            }

            return topGroup;
        } catch (e) {
            return null;
        }
    }

    function getItemWidth(item) {
        var bounds = getItemBounds(item);
        if (!bounds) return 0;
        return Math.abs(bounds.right - bounds.left);
    }

    function getItemBounds(item) {
        try {
            var b = usePreviewBounds() ? item.visibleBounds : item.geometricBounds;
            return {
                left: Number(b[0]),
                top: Number(b[1]),
                right: Number(b[2]),
                bottom: Number(b[3])
            };
        } catch (e1) {
            try {
                var b2 = item.visibleBounds;
                return {
                    left: Number(b2[0]),
                    top: Number(b2[1]),
                    right: Number(b2[2]),
                    bottom: Number(b2[3])
                };
            } catch (e2) {
                return null;
            }
        }
    }

    function usePreviewBounds() {
        try {
            return app.preferences.getBooleanPreference("includeStrokeInBounds") === true;
        } catch (e) {
            return false;
        }
    }

    function canEdit(item) {
        try {
            if (!item || item.locked || item.hidden) return false;

            var parent = item.parent;
            while (parent && parent !== app && parent.typename !== "Document") {
                if (parent.locked === true || parent.hidden === true) return false;
                if (parent.typename === "Layer" && (parent.locked || !parent.visible)) return false;
                parent = parent.parent;
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    function getTargetInput() {
        try {
            if (typeof HGBASIS_SCALE_TARGET_WIDTH !== "undefined") {
                return String(HGBASIS_SCALE_TARGET_WIDTH);
            }
        } catch (e) {}

        return DEFAULT_TARGET_WIDTH;
    }

    function tryRunCppPlugin() {
        var mode = getHGScriptsCppMode();
        if (mode === "jsx") {
            return false;
        }

        try {
            app.executeMenuCommand("HGBasisScaleToWidth");
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

    function writeBasisScaleTargetWidth(targetWidth) {
        try {
            var file = new File(Folder.temp + "/HGBasisScaleTargetWidth.txt");
            file.encoding = "UTF-8";
            if (!file.open("w")) {
                return false;
            }
            file.write(String(targetWidth));
            file.close();
            return true;
        } catch (e) {
            return false;
        }
    }

    function parseLengthToPoints(input) {
        var text = trim(String(input));
        var match = text.match(/^([0-9]+(?:\.[0-9]+)?)\s*(px|pt|mm|毫米|cm|厘米|in|inch|英寸)?$/i);
        if (!match) return NaN;

        var value = parseFloat(match[1]);
        var unit = match[2] ? String(match[2]).toLowerCase() : "px";

        if (unit === "px" || unit === "pt") return value;
        if (unit === "mm" || unit === "毫米") return value * 72 / 25.4;
        if (unit === "cm" || unit === "厘米") return value * 72 / 2.54;
        if (unit === "in" || unit === "inch" || unit === "英寸") return value * 72;

        return NaN;
    }

    function describeItem(item) {
        if (!item) return "null";
        return getType(item) +
            "(name=" + safeProp(item, "name") +
            ", clipped=" + safeProp(item, "clipped") +
            ", clipping=" + safeProp(item, "clipping") +
            ", bounds=" + boundsToText(getItemBounds(item)) +
            ")";
    }

    function getParentChain(item) {
        var chain = [];
        try {
            var current = item;
            var guard = 0;
            while (current && current !== app && guard < 30) {
                chain.push(getType(current) + "(" + safeProp(current, "name") + ")");
                if (current.typename === "Document") break;
                current = current.parent;
                guard++;
            }
        } catch (e) {
            chain.push("error=" + e);
        }
        return chain.join(" > ");
    }

    function boundsToText(bounds) {
        if (!bounds) return "null";
        return "[l=" + fmt(bounds.left) + ",t=" + fmt(bounds.top) + ",r=" + fmt(bounds.right) + ",b=" + fmt(bounds.bottom) + ",w=" + fmt(Math.abs(bounds.right - bounds.left)) + ",h=" + fmt(Math.abs(bounds.top - bounds.bottom)) + "]";
    }

    function getType(item) {
        try {
            return item && item.typename ? item.typename : String(item);
        } catch (e) {
            return "Unknown";
        }
    }

    function safeProp(item, propName) {
        try {
            var value = item[propName];
            if (value === undefined) return "undefined";
            if (value === null) return "null";
            return String(value);
        } catch (e) {
            return "ERR";
        }
    }

    function fmt(value) {
        var n = Number(value);
        if (isNaN(n)) return String(value);
        return String(Math.round(n * 1000) / 1000);
    }

    function trim(value) {
        return String(value).replace(/^\s+|\s+$/g, "");
    }
})();
