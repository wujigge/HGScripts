# 海哥的Adobe脚本管理器 / HGScripts

HGScripts 是一个面向 Adobe Illustrator 的 CEP 脚本管理器，用来集中管理、搜索、收藏、编辑和运行 `.jsx` / `.js` 脚本。

当前版本：`v0.1.0`

## 适用环境

- Windows
- Adobe Illustrator 2025 / 2026
- CEP 扩展面板

本项目当前主要面向 Illustrator。Photoshop、InDesign 等其它 Adobe 软件暂未作为主要目标。

## 主要功能

- 扫描和管理 Illustrator JSX / JS 脚本
- 支持插件自带脚本目录 `user_scripts`
- 支持添加多个外部脚本目录
- 支持按脚本名和说明内容搜索
- 支持收藏脚本
- 支持按最近使用、名称等方式排序
- 支持查看和编辑同名 Markdown 说明文件
- 支持在面板内编辑脚本代码
- 支持运行脚本并在底部控制台显示结果
- 支持打开脚本所在目录
- 支持设置界面和关于界面
- GitHub 地址可点击打开

## 安装方法

下载发布包后：

1. 解压 `HGScripts_0.1.0.zip`。
2. 双击运行 `安装.bat`。
3. 安装完成后，重启 Illustrator。
4. 在 Illustrator 中打开：

```text
窗口 > 扩展 > HGScripts / Haige Adobe Script Manager
```

如果 Illustrator 里没有显示扩展菜单，可以重新运行一次 `安装.bat`，它会自动写入 CEP 未签名扩展所需的 `PlayerDebugMode` 注册表项。

## 安装位置

`安装.bat` 会把正式版插件复制到：

```text
%APPDATA%\Adobe\CEP\extensions\HGScripts
```

通常对应：

```text
C:\Users\你的用户名\AppData\Roaming\Adobe\CEP\extensions\HGScripts
```

开发版目录是：

```text
C:\Users\Admin\AppData\Roaming\Adobe\CEP\extensions\HGScripts_dev
```

开发版和正式版使用不同的 CEP 注册号，可以同时存在，互不冲突。

## 脚本目录

插件自带脚本位于：

```text
HGScripts\user_scripts
```

安装后的常见路径是：

```text
%APPDATA%\Adobe\CEP\extensions\HGScripts\user_scripts
```

你可以把自己的 `.jsx` 或 `.js` 脚本放入这个目录，然后在面板里点击“刷新”。

每个脚本也可以搭配一个同名 Markdown 说明文件：

```text
脚本名.jsx
脚本名.md
```

面板会读取同名 `.md` 作为脚本说明。

## 设置和数据

插件设置保存在：

```text
HGScripts\data\settings.json
```

一般不需要手动修改。如果设置异常，可以先关闭 Illustrator，再备份或删除这个文件，插件会在下次启动时重建默认设置。

## 更新方法

更新时，解压新版发布包并重新运行 `安装.bat` 即可。

安装脚本会覆盖插件主体文件，但会尽量保留用户已有的：

- `data/settings.json`
- `user_scripts` 里的个人脚本

建议更新前先关闭 Illustrator。

## 开源和参考

本插件免费开源发布。

参考项目：

- LAScripts
- ScripshonTrees

GitHub:

```text
https://github.com/wujigge/HGScripts
```

## 联系方式

- Email: haigeplay3d@gmail.com
- WeChat: haigeplay3d

欢迎反馈 bug、提出功能建议，也接受 Illustrator 脚本定制。
