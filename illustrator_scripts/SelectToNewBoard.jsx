#target illustrator

function main() {
    // 若没有打开的文档，则结束
    if (app.documents.length === 0) {
        alert("请先打开一个文档。");
        return;
    }

    var doc = app.activeDocument;

    // 若选中对象数量不为1，也不继续
    if (doc.selection.length !== 1) {
        alert("请选择并仅选择一个对象后再运行脚本。");
        return;
    }

    // 获取当前画板及其区域
    var oldIndex = doc.artboards.getActiveArtboardIndex();
    var oldArtboard = doc.artboards[oldIndex];
    var oldRect = oldArtboard.artboardRect; // [left, top, right, bottom]

    // 计算新画板区域，默认向右偏移 20 像素
    var width = oldRect[2] - oldRect[0];
    var newLeft = oldRect[0] + width + 20;
    var newRight = newLeft + width;
    var newRect = [newLeft, oldRect[1], newRight, oldRect[3]];

    // 复制已选对象
    app.copy();

    // 新建画板
    doc.artboards.add(newRect);
    var newIndex = doc.artboards.length - 1;

    // 切换到新画板
    doc.artboards.setActiveArtboardIndex(newIndex);

    // 在新画板以“就地粘贴”方式粘贴对象
    app.executeMenuCommand("pasteInPlace");
}

// 运行脚本
main();