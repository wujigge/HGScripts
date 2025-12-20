// @target illustrator

/*
Script Name: ResizeAndCenterArtboard.jsx

Description:
This script adjusts the size of the current artboard and all objects on the artboard, and centers the objects on the artboard. The specific functions are as follows:
1. Detect and adjust the width and height of the artboard, making the larger dimension 1024.
2. Select all objects and group them, then adjust the width and height of the group, making the larger dimension 1024.
3. Center the adjusted group of objects on the artboard.

Usage:
1. Open Adobe Illustrator and load a document.
2. Run this script, and it will automatically adjust the size of the artboard and objects, and center the objects on the artboard.

脚本名称: ResizeAndCenterArtboard.jsx

简介:
该脚本用于调整当前画板和画板上所有对象的大小，并将对象居中到画板。具体功能如下：
1. 检测并调整画板的宽高，使较大者为1024。
2. 选中所有对象并编组，调整编组后的宽高，使较大者为1024。
3. 将调整后的编组对象居中到画板。

使用方法:
1. 打开Adobe Illustrator并加载一个文档。
2. 运行此脚本，脚本将自动调整画板和对象的大小，并将对象居中到画板。

*/


function main() {
    if (app.documents.length === 0) {
        alert("No document open");
        return;
    }

    var doc = app.activeDocument;
    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artboardRect = artboard.artboardRect;
    var artboardWidth = artboardRect[2] - artboardRect[0];
    var artboardHeight = artboardRect[1] - artboardRect[3];
    var x = Math.max(artboardWidth, artboardHeight);

    if (x !== 1024) {
        var scaleFactor = 1024 / x;
        artboardRect[2] = artboardRect[0] + artboardWidth * scaleFactor;
        artboardRect[1] = artboardRect[3] + artboardHeight * scaleFactor;
        artboard.artboardRect = artboardRect;
    }

    doc.selection = null;
    doc.selectObjectsOnActiveArtboard();
    var selection = doc.selection;

    if (selection.length > 0) {
        var group = doc.groupItems.add();
        for (var i = 0; i < selection.length; i++) {
            selection[i].moveToBeginning(group);
        }

        var groupWidth = group.width;
        var groupHeight = group.height;
        var y = Math.max(groupWidth, groupHeight);

        if (y !== 1024) {
            var groupScaleFactor = 1024 / y;
            group.resize(groupScaleFactor * 100, groupScaleFactor * 100);
        }

        var artboardCenterX = (artboardRect[0] + artboardRect[2]) / 2;
        var artboardCenterY = (artboardRect[1] + artboardRect[3]) / 2;
        group.position = [artboardCenterX - group.width / 2, artboardCenterY + group.height / 2];
    }
}

main();