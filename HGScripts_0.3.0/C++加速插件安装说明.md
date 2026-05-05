# Illustrator 加速插件安装说明

这个文件夹里放的是 HGScripts 给 Illustrator 用的加速插件。

```text
IllustratorPlugins_win
```

当前包含：

```text
HGColorTools.aip
HGSelectNoPaintObjectsNoSave.aip
```

## 推荐安装方法

1. 关闭 Illustrator。
2. 右键 `安装Illustrator加速插件.bat`。
3. 选择“以管理员身份运行”。
4. 等待出现 `Installation completed.`。
5. 重新打开 Illustrator。

## 它会做什么

安装脚本会寻找电脑里的 Illustrator，例如：

```text
Adobe Illustrator 2026
Adobe Illustrator 2025
```

然后把加速插件复制到每个 Illustrator 的插件文件夹里。

## 没装会怎样

不安装加速插件也能使用 HGScripts。  
部分脚本会自动走普通 JSX 方式，只是速度可能慢一些。

## 注意

如果你以前手动设置过 Illustrator 的“其它增效工具文件夹”，并且里面也放了同名 `.aip`，测试正式版时请先禁用那条额外路径，避免同一个插件被加载两次。
