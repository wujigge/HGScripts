# 海哥的Adobe脚本管理器 / HGScripts

当前版本：`v0.3.0`

HGScripts 是一个面向 Adobe 软件的 CEP 脚本管理器，用来集中管理、搜索、收藏、编辑和运行 `.jsx` / `.js` 脚本。

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
