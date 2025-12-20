if (app.documents.length > 0) {
    var doc = app.activeDocument;
    var nullObjects = [];

    // Recursive function to check all objects
    function checkObjects(items) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            
            if (item.pageItems && item.pageItems.length > 0) {
                checkObjects(item.pageItems);
            }
            
            if (item.typename === "PathItem" || item.typename === "CompoundPathItem") {
                if (item.filled === false && item.stroked === false) {
                    nullObjects.push(item);
                }
            }
        }
    }

    // Check all top level objects
    checkObjects(doc.pageItems);

    // Select found objects
    if (nullObjects.length > 0) {
        doc.selection = nullObjects;
    }
} else {
    // Do nothing if no document is open
}
