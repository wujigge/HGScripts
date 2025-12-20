function main() {
    if (app.documents.length === 0) {
        alert("No document open.");
        return;
    }

    var doc = app.activeDocument;
    var selectedItems = doc.selection;

    if (selectedItems.length === 0) {
        alert("No items selected.");
        return;
    }

    var targetColor = getFillColor(selectedItems[0]);

    if (!targetColor) {
        alert("Selected item has no fill color.");
        return;
    }

    for (var i = 0; i < doc.pageItems.length; i++) {
        var item = doc.pageItems[i];
        if (item.filled && colorsMatch(item.fillColor, targetColor)) {
            item.fillColor = new RGBColor();
            item.fillColor.red = 255;
            item.fillColor.green = 255;
            item.fillColor.blue = 255;
        } else if (item.filled || item.stroked) {
            item.fillColor = new RGBColor();
            item.fillColor.red = 0;
            item.fillColor.green = 0;
            item.fillColor.blue = 0;
        }
    }
}

function getFillColor(item) {
    if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            var color = getFillColor(item.pageItems[i]);
            if (color) return color;
        }
    } else if (item.typename === "CompoundPathItem") {
        return getFillColor(item.pathItems[0]);
    } else if (item.filled) {
        return item.fillColor;
    }
    return null;
}

function colorsMatch(color1, color2) {
    return color1.red === color2.red && color1.green === color2.green && color1.blue === color2.blue;
}

main();