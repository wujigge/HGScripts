# 海哥的Adobe脚本管理器 / HGScripts

当前版本：`v0.3.1`

HGScripts 是一个面向 Adobe Illustrator 的 CEP 脚本管理器，用来集中管理、搜索、收藏、编辑和运行 `.jsx` / `.js` 脚本。

## v0.3.1 更新重点

- 兼容 Illustrator 2023、2024、2025、2026 的面板显示；旧版 Illustrator 使用 legacy 入口，避免空白面板。
- Windows Illustrator C++ 加速插件按 2023 / 2024 / 2025 / 2026 分版本打包，避免不同 SDK 编译产物混用。
- 面板里的 C++ 闪电标识只判断正式安装位置，未安装 `.aip` 时不会误显示加速标记。
- 旧版 CEP 下 SVG 图标改为更稳定的内联显示方案，减少闪烁和加载差异。
- 正式包清理了开发机路径、运行记录、收藏和面板尺寸等个人状态。
- Windows 安装器默认勾选开启 CEP 支持、安装 C++ 加速插件、创建桌面安装帮助快捷方式。

## 支持的软件

- 主线支持：Adobe Illustrator
- 基础支持：Adobe Photoshop、Adobe InDesign

当前功能和内置脚本以 Illustrator 为主。Photoshop / InDesign 可以打开面板、隔离脚本目录并运行对应测试脚本，但实用脚本和 C++ 加速目前主要服务 Illustrator。

## 主要功能

- 扫描和管理 JSX / JS 脚本
- 按宿主隔离自带脚本目录：Illustrator / Photoshop / InDesign
- 支持添加多个外部脚本目录
- 支持搜索、收藏、排序和运行脚本
- 支持查看和编辑同名 Markdown 说明文件
- 支持在面板内编辑脚本代码
- 支持打开脚本所在目录和当前 Adobe 文档所在目录
- 支持 Windows Illustrator C++ 加速插件和 JSX 回退模式
- 支持设置界面和关于界面

## Windows 安装方法

推荐下载发布包里的 Windows 安装器：

```text
安装-海哥的Adobe脚本管理器v0.3.1.exe
```

如果使用手动安装包：

1. 解压 `HGScripts_0.3.1_手动安装包.zip`。
2. 双击运行 `安装.bat`。
3. 如果面板菜单没有出现，再双击运行 `Enable_CEP_Debug_Mode.bat`。
4. 重新打开 Illustrator。
5. 在 Illustrator 中打开：

```text
窗口 > 扩展 > 海哥的Adobe脚本管理器
Window > Extensions > 海哥的Adobe脚本管理器
```

如果你使用 Windows 版 Illustrator，并希望启用 C++ 加速插件，可以在解压后的发布包里右键以管理员身份运行：

```text
安装Illustrator加速插件.bat
```

该脚本会按 Illustrator 年份复制 `IllustratorPlugins_win` 里的对应 `.aip` 插件。详细说明见 `C++加速插件安装说明.md`。

## 安装位置

```text
%APPDATA%\Adobe\CEP\extensions\HGScripts
```

## 脚本目录

插件自带脚本按宿主分开放置：

```text
HGScripts\user_scripts\illustrator
HGScripts\user_scripts\photoshop
HGScripts\user_scripts\indesign
```

你自己的 `.jsx` 或 `.js` 脚本也可以放入对应宿主目录，然后在面板里点击“刷新”。

## 设置和数据

```text
HGScripts\data\settings.json
```

不同宿主会使用不同设置：

```text
hgscripts.illustrator.*
hgscripts.photoshop.*
hgscripts.indesign.*
```

## 更新方法

更新时，关闭 Illustrator，运行新版安装器，或解压新版手动安装包并重新运行 `安装.bat` 即可。

## 开源和参考

本插件免费开源发布。HGScripts 面板源码开放；Windows Illustrator C++ 加速插件以编译后的 `.aip` 形式随包发布。

参考项目：

- LAScripts
- ScripshonTrees

GitHub: https://github.com/wujigge/HGScripts

## 联系方式

- Email: haigeplay3d@gmail.com
- WeChat: haigeplay3d

欢迎反馈 bug、提出功能建议，也接受 Illustrator 脚本定制。
