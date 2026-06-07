# HGScripts v0.3.4

HGScripts public export folder and Windows release package.

This folder contains the Windows installer, install note, CEP panel, user docs, and Windows Illustrator .aip acceleration plugin binaries.

## Recommended Install

For normal Windows installation, use:

```text
安装-海哥的Adobe脚本管理器v0.3.4.exe
海哥的Adobe脚本管理器v0.3.4-安装说明.txt
```

macOS is not supported for this release. HGScripts no longer publishes a separate Windows manual-package zip.

## Layout

安装-海哥的Adobe脚本管理器v0.3.4.exe   Windows installer
海哥的Adobe脚本管理器v0.3.4-安装说明.txt  Windows install note
cep/HGScripts/                 CEP panel
plugins/illustrator-win/       Windows Illustrator .aip binaries
docs/                          User docs
tools/windows/                 Windows helper scripts

## Manual Review Or Copy

- CEP panel: cep/HGScripts
- Windows .aip binaries: plugins/illustrator-win, grouped by Illustrator year.
- Windows helper scripts: tools/windows

## Public Boundary

This public export must not contain C++ source, Adobe SDK files, Visual Studio projects, debug symbols, runtime data, memory data, backups, local state, or personal data.
