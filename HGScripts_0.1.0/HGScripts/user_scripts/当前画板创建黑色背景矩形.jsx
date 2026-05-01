#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a Illustrator \u6587\u6863");
        return;
    }

    var doc = app.activeDocument;
    var artboardIndex = doc.artboards.getActiveArtboardIndex();
    var artboard = doc.artboards[artboardIndex];
    var rect = artboard.artboardRect; // [left, top, right, bottom]

    var left = rect[0];
    var top = rect[1];
    var width = rect[2] - rect[0];
    var height = rect[1] - rect[3];

    var black = new RGBColor();
    black.red = 0;
    black.green = 0;
    black.blue = 0;

    var bg = doc.pathItems.rectangle(top, left, width, height);
    bg.name = "\u5f53\u524d\u753b\u677f\u9ed1\u8272\u80cc\u666f\u77e9\u5f62";
    bg.filled = true;
    bg.fillColor = black;
    bg.stroked = false;
    bg.zOrder(ZOrderMethod.SENDTOBACK);
})();
