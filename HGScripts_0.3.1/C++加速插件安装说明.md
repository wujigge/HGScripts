# Illustrator 加速插件安装说明

这个文件夹里放的是 HGScripts 给 Illustrator 用的加速插件。

```text
IllustratorPlugins_win
├─ 2023
├─ 2024
├─ 2025
└─ 2026
```

当前包含：

```text
HGColorTools.aip
HGSelectNoPaintObjectsNoSave.aip
```

每个年份文件夹里都有一套对应 Illustrator 版本编译的 `.aip`。不要手动把 2026 文件夹里的 `.aip` 复制给 2023/2024/2025 使用。

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
Adobe Illustrator 2024
Adobe Illustrator 2023
```

然后按版本把对应年份文件夹里的加速插件复制到每个 Illustrator 的插件文件夹里。

## 没装会怎样

不安装加速插件也能使用 HGScripts。  
部分脚本会自动走普通 JSX 方式，只是速度可能慢一些。

## 注意

如果你以前手动设置过 Illustrator 的“其它增效工具文件夹”，并且里面也放了同名 `.aip`，测试正式版时请先禁用那条额外路径，避免同一个插件被加载两次。
