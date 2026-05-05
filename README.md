# 海哥的Adobe脚本管理器 / HGScripts

当前版本：`v0.3.0`

HGScripts 是一个面向 Adobe 软件的 CEP 脚本管理器，用来集中管理、搜索、收藏、编辑和运行 `.jsx` / `.js` 脚本。

## v0.3.0 更新重点

- Windows 版开始加入 Illustrator C++ 加速插件，部分颜色处理、同色选择、空对象选择等脚本可以通过 `.aip` 插件执行。
- 面板新增 C++ / JSX 运行模式切换：自动模式会优先尝试 C++，失败后回退 JSX；也可以手动切到 JSX 模式。
- 脚本列表的闪电标记现在会检测对应 `.aip` 是否存在；没有安装加速插件时，不会误显示闪电。
- 正式包新增 `IllustratorPlugins_win`、`安装Illustrator加速插件.bat` 和 `C++加速插件安装说明.md`，方便 Windows 用户安装 Illustrator 加速插件。
- Mac 版目前仍可使用 CEP 面板和 JSX 脚本，但这次暂未提供 Mac 版 C++ 加速插件。

## 支持的软件

- Adobe Illustrator
- Adobe Photoshop
- Adobe InDesign

当前 Illustrator 是主线；Photoshop / InDesign 已加入基础支持，可以打开面板、按宿主隔离脚本目录，并运行对应测试脚本。后续会逐步增加 Photoshop / InDesign 的实用脚本。

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

## 安装方法

1. 解压 `HGScripts_0.3.0.zip`。
2. 双击运行 `安装.bat`。
3. 如果面板菜单没有出现，再双击运行 `Enable_CEP_Debug_Mode.bat`。
4. 重启 Illustrator / Photoshop / InDesign。
5. 在对应 Adobe 软件中打开：

```text
窗口 > 扩展 > HGScripts
Window > Extensions > HGScripts
```

如果你使用 Windows 版 Illustrator，并希望启用 C++ 加速插件，可以在解压后的发布包里右键以管理员身份运行：

```text
安装Illustrator加速插件.bat
```

该脚本会把 `IllustratorPlugins_win` 里的 `.aip` 插件复制到本机已安装 Illustrator 的 `Plug-ins\HGScripts` 目录。详细说明见 `C++加速插件安装说明.md`。

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

更新时，解压新版发布包并重新运行 `安装.bat` 即可。建议更新前先关闭 Illustrator / Photoshop / InDesign。

## 开源和参考

本插件免费开源发布。

参考项目：

- LAScripts
- ScripshonTrees

GitHub: https://github.com/wujigge/HGScripts

## 联系方式

- Email: haigeplay3d@gmail.com
- WeChat: haigeplay3d

欢迎反馈 bug、提出功能建议，也接受 Illustrator / Photoshop / InDesign 脚本定制。
