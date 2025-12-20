// 获取当前文档
var doc = app.activeDocument;

// 检查是否有选中的对象
if (doc.selection.length > 0) {
    // 初始化边界值
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // 遍历所有选中的对象，计算整体的边界
    for (var i = 0; i < doc.selection.length; i++) {
        var selectedObject = doc.selection[i];

        var objMinX = selectedObject.position[0];
        var objMaxX = selectedObject.position[0] + selectedObject.width;
        var objMinY = selectedObject.position[1] - selectedObject.height;
        var objMaxY = selectedObject.position[1];

        if (objMinX < minX) minX = objMinX;
        if (objMaxX > maxX) maxX = objMaxX;
        if (objMinY < minY) minY = objMinY;
        if (objMaxY > maxY) maxY = objMaxY;
    }

    // 计算整体的宽度和高度
    var width = maxX - minX;
    var height = maxY - minY;

    // 计算整体的中心点
    var centerX = minX + width / 2;
    var centerY = maxY - height / 2;

    // 创建一个新的矩形
    var rect = doc.pathItems.rectangle(centerY + height / 2, centerX - width / 2, width, height);

    // 设置矩形的填充为空
    rect.filled = false;

    // 设置矩形的描边为白色
    rect.stroked = true;
    rect.strokeColor = new RGBColor();
    rect.strokeColor.red = 255;
    rect.strokeColor.green = 255;
    rect.strokeColor.blue = 255;

    // 取消所有对象的选择状态
    for (var j = 0; j < doc.selection.length; j++) {
        doc.selection[j].selected = false;
    }

    // 选择新绘制的矩形
    rect.selected = true;
}