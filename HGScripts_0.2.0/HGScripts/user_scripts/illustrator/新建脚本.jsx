#target illustrator

function main() {
    if (app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档");
        return;
    }

    var doc = app.activeDocument;
}

main();
