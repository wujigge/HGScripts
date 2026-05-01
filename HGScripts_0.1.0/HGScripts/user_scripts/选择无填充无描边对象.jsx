#target illustrator

(function () {
    if (!app.documents.length) {
        return;
    }

    var doc = app.activeDocument;
    var emptyPaths = [];

    collectEmptyPaths(doc.pageItems, emptyPaths);

    doc.selection = null;
    if (emptyPaths.length) {
        doc.selection = emptyPaths;
    }

    function collectEmptyPaths(items, result) {
        if (!items) {
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (shouldSkip(item)) {
                continue;
            }

            if (item.typename === "GroupItem") {
                collectEmptyPaths(item.pageItems, result);
            } else if (item.typename === "CompoundPathItem") {
                collectEmptyPaths(item.pathItems, result);
            } else if (item.typename === "PathItem" && isEmptyPath(item)) {
                result.push(item);
            }
        }
    }

    function shouldSkip(item) {
        try {
            return item.locked || item.hidden;
        } catch (e) {
            return false;
        }
    }

    function isEmptyPath(item) {
        try {
            return item.filled === false && item.stroked === false;
        } catch (e) {
            return false;
        }
    }
})();
