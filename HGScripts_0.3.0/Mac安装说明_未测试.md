# Mac 安装说明（未测试）

版本：v0.3.0
更新日期：2026-05-05

## 重要说明

我目前没有 Mac 设备，所以这套安装方法还没有实机验证。

HGScripts 是 CEP 面板，理论上可以在 macOS 的 Illustrator / Photoshop / InDesign 中手动安装。但不同 Adobe 版本、macOS 权限和 CEP 环境可能会有差异。

如果你愿意测试，欢迎把结果反馈给我，我后续会整理成正式 Mac 安装方案。

## 支持的软件

理论上支持：

- Adobe Illustrator
- Adobe Photoshop
- Adobe InDesign

当前 Illustrator 是主线；Photoshop / InDesign 已加入基础支持。

## 方法一：一键安装（未测试）

解压后，先尝试双击运行：

```text
Install_macOS.command
```

如果面板菜单没有出现，再双击运行：

```text
Enable_CEP_Debug_Mode_macOS.command
```

然后完全退出并重新打开 Illustrator / Photoshop / InDesign。

### 如果 `.command` 无法双击运行

macOS 可能会因为权限或安全设置阻止 `.command` 文件运行。

可以打开“终端”，进入解压后的 `HGScripts_0.3.0` 文件夹，执行：

```bash
chmod +x Install_macOS.command
chmod +x Enable_CEP_Debug_Mode_macOS.command
```

然后再双击运行，或在终端中执行：

```bash
./Install_macOS.command
./Enable_CEP_Debug_Mode_macOS.command
```

## 方法二：手动安装

### 1. 解压插件包

下载并解压 `HGScripts_0.3.0.zip`。

找到解压后的插件文件夹：

```text
HGScripts_0.3.0/HGScripts
```

### 2. 打开 CEP 扩展目录

打开 Finder，按：

```text
Command + Shift + G
```

输入：

```text
~/Library/Application Support/Adobe/CEP/extensions
```

如果没有 `CEP` 或 `extensions` 文件夹，可以手动新建。

### 3. 复制插件

把解压后的 `HGScripts` 文件夹复制到：

```text
~/Library/Application Support/Adobe/CEP/extensions
```

复制完成后，`HGScripts` 文件夹内应该能直接看到：

```text
CSXS
assets
scripts
user_scripts
index.html
```

## 开启 CEP 未签名扩展

因为这是未签名 CEP 扩展，需要开启 `PlayerDebugMode`。

打开“终端”，执行下面命令：

```bash
defaults write com.adobe.CSXS.7 PlayerDebugMode 1
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
```

通常只需要当前 Adobe 版本对应的 CSXS 版本；如果不确定，可以都执行。

## 打开插件

完全退出并重新打开 Illustrator / Photoshop / InDesign。

然后在菜单中打开：

```text
窗口 > 扩展 > HGScripts
```

英文界面一般是：

```text
Window > Extensions > HGScripts
```

## 脚本目录

插件自带脚本按宿主分开放置：

```text
HGScripts/user_scripts/illustrator
HGScripts/user_scripts/photoshop
HGScripts/user_scripts/indesign
```

你自己的 `.jsx` 或 `.js` 脚本也可以放到对应目录，然后在面板里点击刷新。

## 如果菜单没有出现

可以检查：

1. 插件是否放到了 `~/Library/Application Support/Adobe/CEP/extensions/HGScripts`。
2. `HGScripts` 文件夹内是否能直接看到 `CSXS/manifest.xml`。
3. 是否执行了 `defaults write ... PlayerDebugMode 1`。
4. 是否完全退出并重新打开 Adobe 软件。
5. 当前 Adobe 版本是否还支持 CEP 扩展。

## 反馈方式

- Email: haigeplay3d@gmail.com
- WeChat: haigeplay3d
- GitHub: https://github.com/wujigge/HGScripts

如果你测试成功或失败，都欢迎反馈具体系统版本、Adobe 软件版本和现象。
