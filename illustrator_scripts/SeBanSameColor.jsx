// Adobe Illustrator Script

function selectSameColor() {
    if (app.documents.length === 0) {
        alert("No document open.");
        return;
    }

    var doc = app.activeDocument;
    var selectedSwatch = doc.swatches.getSelected();

    if (selectedSwatch.length === 0) {
        alert("No swatch selected.");
        return;
    }

    var selectedColor = selectedSwatch[0].color;
    var items = doc.pageItems;
    var sameColorItems = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.filled && compareColors(item.fillColor, selectedColor)) {
            sameColorItems.push(item);
        }
        if (item.stroked && compareColors(item.strokeColor, selectedColor)) {
            sameColorItems.push(item);
        }
    }

    for (var j = 0; j < sameColorItems.length; j++) {
        sameColorItems[j].selected = true;
    }

    alert(sameColorItems.length + " items selected with the same color.");

    function compareColors(color1, color2) {
        if (color1.typename !== color2.typename) return false;

        switch (color1.typename) {
            case "RGBColor":
                return color1.red === color2.red && color1.green === color2.green && color1.blue === color2.blue;
            case "CMYKColor":
                return color1.cyan === color2.cyan && color1.magenta === color2.magenta && color1.yellow === color2.yellow && color1.black === color2.black;
            case "SpotColor":
                return color1.spot.name === color2.spot.name;
            case "GrayColor":
                return color1.gray === color2.gray;
            default:
                return false;
        }
    }
}

selectSameColor();