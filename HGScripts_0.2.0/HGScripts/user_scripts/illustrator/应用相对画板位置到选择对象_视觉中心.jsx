#target illustrator

(function () {
    var BOUNDS_KIND = "visibleBounds";
    var MEMORY_FILE_NAME = "position_memory_visual.json";
    var MOVE_EPSILON_PT = 0.01;

    if (!app.documents.length) {
        return;
    }

    var doc = app.activeDocument;
    var selection = doc.selection;
    if (!selection || !selection.length) {
        return;
    }

    var memory = readMemory();
    if (!memory) {
        return;
    }

    var bounds = getSelectionBounds(selection, BOUNDS_KIND);
    if (!bounds) {
        return;
    }

    var center = getBoundsCenter(bounds);
    var artboardIndex = findArtboardIndexByPoint(doc, center.x, center.y);
    var artboardRect = doc.artboards[artboardIndex].artboardRect;
    var targetCenterX = artboardRect[0] + memory.relativeX;
    var targetCenterY = artboardRect[1] - memory.relativeY;
    var dx = targetCenterX - center.x;
    var dy = targetCenterY - center.y;

    if (Math.abs(dx) < MOVE_EPSILON_PT) {
        dx = 0;
    }
    if (Math.abs(dy) < MOVE_EPSILON_PT) {
        dy = 0;
    }
    if (dx === 0 && dy === 0) {
        return;
    }

    for (var i = 0; i < selection.length; i++) {
        moveItem(selection[i], dx, dy);
    }

    function moveItem(item, dx, dy) {
        try {
            if (item.locked || item.hidden) {
                return;
            }
            item.translate(dx, dy);
        } catch (e) {}
    }

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
            var offsetX = x - centerX;
            var offsetY = y - centerY;
            var distance = offsetX * offsetX + offsetY * offsetY;
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    function readMemory() {
        var file = getMemoryFile();
        if (!file.exists) {
            return null;
        }

        file.encoding = "UTF-8";
        file.open("r");
        var text = file.read();
        file.close();

        var relativeX = readNumber(text, "relativeX");
        var relativeY = readNumber(text, "relativeY");
        if (isNaN(relativeX) || isNaN(relativeY)) {
            return null;
        }

        return {
            relativeX: relativeX,
            relativeY: relativeY
        };
    }

    function readNumber(text, key) {
        var match = text.match(new RegExp("\"" + key + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)"));
        return match ? parseFloat(match[1]) : NaN;
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
})();
