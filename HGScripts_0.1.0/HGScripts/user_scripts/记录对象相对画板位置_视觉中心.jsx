#target illustrator

(function () {
    var BOUNDS_KIND = "visibleBounds";
    var MEMORY_FILE_NAME = "position_memory_visual.json";

    if (!app.documents.length) {
        return;
    }

    var doc = app.activeDocument;
    var selection = doc.selection;
    if (!selection || !selection.length) {
        return;
    }

    var bounds = getSelectionBounds(selection, BOUNDS_KIND);
    if (!bounds) {
        return;
    }

    var center = getBoundsCenter(bounds);
    var artboardIndex = findArtboardIndexByPoint(doc, center.x, center.y);
    var artboardRect = doc.artboards[artboardIndex].artboardRect;

    writeMemory({
        version: 2,
        anchor: "center",
        bounds: BOUNDS_KIND,
        relativeX: center.x - artboardRect[0],
        relativeY: artboardRect[1] - center.y,
        sourceArtboardIndex: artboardIndex,
        sourceCenterX: center.x,
        sourceCenterY: center.y,
        savedAt: new Date().getTime()
    });

    function getSelectionBounds(items, boundsKind) {
        var result = null;
        for (var i = 0; i < items.length; i++) {
            var itemBounds = getItemBounds(items[i], boundsKind);
            if (!itemBounds) {
                continue;
            }
            result = result ? unionBounds(result, itemBounds) : itemBounds;
        }
        return result;
    }

    function getItemBounds(item, boundsKind) {
        try {
            if (item.locked || item.hidden) {
                return null;
            }
        } catch (e) {}

        try {
            if (item.typename === "GroupItem" && item.pageItems && item.pageItems.length) {
                return getSelectionBounds(item.pageItems, boundsKind);
            }
            if (item.typename === "CompoundPathItem" && item.pathItems && item.pathItems.length) {
                return getSelectionBounds(item.pathItems, boundsKind);
            }
            if (item[boundsKind]) {
                return [
                    item[boundsKind][0],
                    item[boundsKind][1],
                    item[boundsKind][2],
                    item[boundsKind][3]
                ];
            }
        } catch (err) {}

        return null;
    }

    function unionBounds(a, b) {
        return [
            Math.min(a[0], b[0]),
            Math.max(a[1], b[1]),
            Math.max(a[2], b[2]),
            Math.min(a[3], b[3])
        ];
    }

    function getBoundsCenter(bounds) {
        return {
            x: (bounds[0] + bounds[2]) / 2,
            y: (bounds[1] + bounds[3]) / 2
        };
    }

    function findArtboardIndexByPoint(doc, x, y) {
        var nearestIndex = 0;
        var nearestDistance = Number.MAX_VALUE;

        for (var i = 0; i < doc.artboards.length; i++) {
            var rect = doc.artboards[i].artboardRect;
            if (x >= rect[0] && x <= rect[2] && y <= rect[1] && y >= rect[3]) {
                return i;
            }

            var centerX = (rect[0] + rect[2]) / 2;
            var centerY = (rect[1] + rect[3]) / 2;
            var dx = x - centerX;
            var dy = y - centerY;
            var distance = dx * dx + dy * dy;
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    function writeMemory(memory) {
        var file = getMemoryFile();
        var folder = file.parent;
        if (!folder.exists) {
            folder.create();
        }
        file.encoding = "UTF-8";
        file.open("w");
        file.write(toJson(memory));
        file.close();
    }

    function getMemoryFile() {
        var root = getExtensionRoot();
        return new File(root.fsName + "/data/" + MEMORY_FILE_NAME);
    }

    function getExtensionRoot() {
        var folder = new File($.fileName).parent;
        while (folder && folder.exists) {
            if ((folder.name === "HGScripts_dev" || folder.name === "HGScripts")) {
                return folder;
            }
            folder = folder.parent;
        }
        return new File($.fileName).parent.parent;
    }

    function toJson(data) {
        var parts = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                parts.push("\"" + key + "\":" + jsonValue(data[key]));
            }
        }
        return "{" + parts.join(",") + "}";
    }

    function jsonValue(value) {
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }
        return "\"" + String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
    }
})();
