(function () {
  "use strict";

  var fs = null;
  var path = null;
  var childProcess = null;
  var cs = null;
  var bootLogPath = "";

  function writeBootStatus(message, level) {
    var elBoot = document.getElementById("bootStatus");
    if (!elBoot) {
      return;
    }
    elBoot.style.display = "block";
    elBoot.style.color = level === "error" ? "#ffd7d7" : "#ececec";
    elBoot.style.background = level === "error" ? "#6b3333" : "#535353";
    elBoot.textContent = message;
  }

  function writeBootLog(message) {
    try {
      if (!fs || !path) {
        return;
      }
      if (!bootLogPath) {
        var root = "";
        try {
          if (cs && typeof SystemPath !== "undefined" && cs.getSystemPath) {
            root = cs.getSystemPath(SystemPath.EXTENSION);
          }
        } catch (errRoot) {}
        if (!root && typeof __dirname !== "undefined") {
          root = path.resolve(__dirname, "..", "..");
        }
        bootLogPath = path.join(root, "data", "runtime", "panel_boot.log");
        ensureBootFolder(path.dirname(bootLogPath));
      }
      fs.appendFileSync(bootLogPath, "[" + new Date().toISOString() + "] " + message + "\r\n", "utf8");
    } catch (err) {}
  }

  function ensureBootFolder(folderPath) {
    try {
      if (fs && !fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    } catch (err) {}
  }

  function failBoot(message, err) {
    var detail = err && err.stack ? err.stack : (err && err.message ? err.message : String(err || ""));
    writeBootLog("FATAL " + message + (detail ? ": " + detail : ""));
    writeBootStatus(message + (detail ? "：" + detail : ""), "error");
  }

  function hideBootStatusIfUiPainted() {
    var bootStatus = document.getElementById("bootStatus");
    if (!bootStatus) {
      return;
    }
    if (HOST_PROFILE.year === "2023" && !LEGACY_COMPAT_MODE) {
      writeBootStatus("HGScripts v" + state.appVersion + " 已在 Illustrator 2023 启动。若下方仍是空白，请继续让 Codex 读取日志。", "warn");
      writeBootLog("boot status kept visible for Illustrator 2023");
      return;
    }
    var shell = document.querySelector(".shell");
    var topbar = document.querySelector(".topbar");
    var shellHeight = shell ? shell.offsetHeight : 0;
    var topbarHeight = topbar ? topbar.offsetHeight : 0;
    if (shellHeight > 40 && topbarHeight > 0) {
      bootStatus.style.display = "none";
      writeBootLog("boot status hidden after UI paint: shell=" + shellHeight + ", topbar=" + topbarHeight);
      return;
    }
    writeBootStatus("HGScripts 已启动，但旧版 Illustrator 面板高度异常。请拖大面板或重开面板。", "warn");
    writeBootLog("UI paint check failed: shell=" + shellHeight + ", topbar=" + topbarHeight);
  }

  try {
    writeBootStatus("正在加载 HGScripts 运行环境...");
    fs = require("fs");
    path = require("path");
    childProcess = require("child_process");
  } catch (errRequire) {
    failBoot("HGScripts 无法启用 CEP Node.js 环境", errRequire);
    return;
  }

  try {
    cs = new CSInterface();
    writeBootLog("CSInterface initialized");
  } catch (errCs) {
    failBoot("HGScripts 无法初始化 CSInterface", errCs);
    return;
  }

  var EXTENSION_ROOT = getExtensionRoot();
  var CEP_ROOT = path.resolve(EXTENSION_ROOT, "..", "..");
  var HOST_PROFILE = detectHostProfile();
  var USER_SCRIPTS_ROOT = path.join(EXTENSION_ROOT, "user_scripts");
  var LEGACY_DEFAULT_FOLDER = "X:\\luhaijustwork\\BaiduSyncdisk\\UPzhu-HaigeC4D\\sport\\jsx";
  var DEFAULT_FOLDER = path.join(USER_SCRIPTS_ROOT, HOST_PROFILE.folder);
  var LEGACY_FLAT_USER_SCRIPTS_FOLDER = USER_SCRIPTS_ROOT;
  var EXTERNAL_DEFAULT_FOLDER = path.join(CEP_ROOT, "user_scripts", HOST_PROFILE.folder);
  var EXTERNAL_DATA_FOLDER = path.join(CEP_ROOT, "data");
  var STORAGE_PREFIX = "hgscripts." + HOST_PROFILE.key + ".";
  var LEGACY_FOLDER_KEY = "hgscripts.folder";
  var LEGACY_SOURCES_KEY = "hgscripts.sources";
  var LEGACY_ACTIVE_SOURCE_KEY = "hgscripts.activeSource";
  var LEGACY_FAVORITES_KEY = "hgscripts.favorites";
  var LEGACY_RUN_STATS_KEY = "hgscripts.runStats";
  var LEGACY_RECENT_SOURCES_KEY = "hgscripts.recentSources";
  var LEGACY_CONSOLE_HEIGHT_KEY = "hgscripts.consoleHeight";
  var LEGACY_PANEL_SIZES_KEY = "hgscripts.panelSizes";
  var SOURCES_KEY = STORAGE_PREFIX + "sources";
  var ACTIVE_SOURCE_KEY = STORAGE_PREFIX + "activeSource";
  var STATE_KEY = STORAGE_PREFIX + "lastState";
  var FAVORITES_KEY = STORAGE_PREFIX + "favorites";
  var RUN_STATS_KEY = STORAGE_PREFIX + "runStats";
  var RECENT_SOURCES_KEY = STORAGE_PREFIX + "recentSources";
  var CONSOLE_HEIGHT_KEY = STORAGE_PREFIX + "consoleHeight";
  var PANEL_SIZES_KEY = STORAGE_PREFIX + "panelSizes";
  var CPP_MODE_KEY = STORAGE_PREFIX + "cppMode";
  var PANEL_MENU_SETTINGS_ID = "openSettings";
  var PANEL_MENU_ABOUT_ID = "openAbout";
  // Auto refresh is intentionally paused for now. Keep the watcher/polling
  // code below so it can be re-enabled later without rebuilding the feature.
  var AUTO_REFRESH_ENABLED = false;
  var REFRESH_INTERVAL_MS = 1500;
  var LEGACY_COMPAT_MODE = /\blegacy=1\b/.test(String(window.location.search || ""));
  var SETTINGS_PATH = path.join(EXTENSION_ROOT, "data", "settings.json");
  var SCRIPT_ICONS_PATH = path.join(EXTENSION_ROOT, "data", "script_icons.json");
  var RUNTIME_FOLDER = path.join(EXTENSION_ROOT, "data", "runtime");
  var DEFAULT_SCRIPT_ICON = "assets/icons/script.svg";
  var SCRIPT_EXTENSIONS = { ".jsx": true, ".js": true };
  var MIN_PANEL_WIDTH = 300;
  var MIN_PANEL_HEIGHT = 300;
  var FIRST_RUN_PANEL_WIDTH = 300;
  var FIRST_RUN_PANEL_HEIGHT = 320;
  var NARROW_PANEL_WIDTH = 420;
  var NARROW_PANEL_HEIGHT = 560;
  var WIDE_PANEL_WIDTH = 1000;
  var WIDE_PANEL_HEIGHT = 780;
  var WIDE_LAYOUT_THRESHOLD = 720;
  var DEFAULT_SETTINGS = {
    scanDepth: 5,
    ignoredDirs: ["node_modules", ".git", ".svn", ".hg"],
    languageMode: "auto"
  };
  var settings = loadSettings();
  migrateSettingsStorage();
  var hostLanguage = detectHostLanguage();
  var effectiveLanguage = resolveEffectiveLanguage(settings.languageMode, hostLanguage);

  var storedPanelSizes = loadJson(PANEL_SIZES_KEY, null);
  var state = {
    sources: loadSources(),
    activeSourceId: getStoredValue(ACTIVE_SOURCE_KEY, "all"),
    files: [],
    filtered: [],
    selectedPath: "",
    watchers: [],
    lastSignature: "",
    refreshTimer: null,
    debounceTimer: null,
    favorites: loadJson(FAVORITES_KEY, {}),
    runStats: loadJson(RUN_STATS_KEY, {}),
    editorPath: "",
    editorDirty: false,
    editorLoading: false,
    docDirty: false,
    docLoading: false,
    docPath: "",
    ace: null,
    editorMarker: null,
    latestErrorText: "",
    running: false,
    runningPath: "",
    scriptIcons: loadScriptIcons(),
    cppMode: normalizeCppMode(getStoredValue(CPP_MODE_KEY, "auto")),
    panelMode: "narrow",
    panelSizes: storedPanelSizes || {
      narrow: { width: FIRST_RUN_PANEL_WIDTH, height: FIRST_RUN_PANEL_HEIGHT },
      wide: { width: WIDE_PANEL_WIDTH, height: WIDE_PANEL_HEIGHT }
    },
    pendingSwitchPath: "",
    pendingSwitchCallback: null,
    pendingSwitchKind: "code",
    appVersion: "0.3.1"
  };

  var el = {
    shell: document.querySelector(".shell"),
    hostBadge: document.getElementById("hostBadge"),
    cppModeSelect: document.getElementById("cppModeSelect"),
    folderHint: document.getElementById("folderHint"),
    appVersion: document.getElementById("appVersion"),
    quickCreateScriptBtn: document.getElementById("quickCreateScriptBtn"),
    sourcebar: document.getElementById("sourcebar"),
    sourceTabs: document.getElementById("sourceTabs"),
    sourceModal: document.getElementById("sourceModal"),
    createModal: document.getElementById("createModal"),
    switchModal: document.getElementById("switchModal"),
    settingsView: document.getElementById("settingsView"),
    aboutView: document.getElementById("aboutView"),
    sourceNameInput: document.getElementById("sourceNameInput"),
    folderInput: document.getElementById("folderInput"),
    chooseBtn: document.getElementById("chooseBtn"),
    chooseScriptBtn: document.getElementById("chooseScriptBtn"),
    currentDocBtn: document.getElementById("currentDocBtn"),
    addSourceBtn: document.getElementById("addSourceBtn"),
    saveSourceBtn: document.getElementById("saveSourceBtn"),
    removeSourceBtn: document.getElementById("removeSourceBtn"),
    closeSourcesBtn: document.getElementById("closeSourcesBtn"),
    closeCreateBtn: document.getElementById("closeCreateBtn"),
    closeSettingsViewBtn: document.getElementById("closeSettingsViewBtn"),
    closeAboutViewBtn: document.getElementById("closeAboutViewBtn"),
    newScriptNameInput: document.getElementById("newScriptNameInput"),
    newScriptDocInput: document.getElementById("newScriptDocInput"),
    createScriptBtn: document.getElementById("createScriptBtn"),
    switchTitle: document.getElementById("switchTitle"),
    switchSaveBtn: document.getElementById("switchSaveBtn"),
    switchDiscardBtn: document.getElementById("switchDiscardBtn"),
    switchCancelBtn: document.getElementById("switchCancelBtn"),
    recentSourceSelect: document.getElementById("recentSourceSelect"),
    scanDepthInput: document.getElementById("scanDepthInput"),
    ignoredDirsInput: document.getElementById("ignoredDirsInput"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
    languageSelect: document.getElementById("languageSelect"),
    languageHint: document.getElementById("languageHint"),
    saveLanguageBtn: document.getElementById("saveLanguageBtn"),
    aboutVersion: document.getElementById("aboutVersion"),
    githubLink: document.getElementById("githubLink"),
    refreshBtn: document.getElementById("refreshBtn"),
    panelSizeBtn: document.getElementById("panelSizeBtn"),
    toggleSourcesBtn: document.getElementById("toggleSourcesBtn"),
    searchInput: document.getElementById("searchInput"),
    favoriteOnlyInput: document.getElementById("favoriteOnlyInput"),
    sortSelect: document.getElementById("sortSelect"),
    countLabel: document.getElementById("countLabel"),
    watchLabel: document.getElementById("watchLabel"),
    contentPanel: document.getElementById("contentPanel"),
    scriptList: document.getElementById("scriptList"),
    detailTitle: document.getElementById("detailTitle"),
    detailMeta: document.getElementById("detailMeta"),
    renameInput: document.getElementById("renameInput"),
    renameBtn: document.getElementById("renameBtn"),
    favoriteBtn: document.getElementById("favoriteBtn"),
    detailDoc: document.getElementById("detailDoc"),
    saveDocBtn: document.getElementById("saveDocBtn"),
    runBtn: document.getElementById("runBtn"),
    openBtn: document.getElementById("openBtn"),
    revealBtn: document.getElementById("revealBtn"),
    codeEditor: document.getElementById("codeEditor"),
    editorTitle: document.getElementById("editorTitle"),
    editorTitleInput: document.getElementById("editorTitleInput"),
    editorPath: document.getElementById("editorPath"),
    closeEditorBtn: document.getElementById("closeEditorBtn"),
    saveCodeBtn: document.getElementById("saveCodeBtn"),
    runCodeBtn: document.getElementById("runCodeBtn"),
    saveRunCodeBtn: document.getElementById("saveRunCodeBtn"),
    reloadCodeBtn: document.getElementById("reloadCodeBtn"),
    duplicateCodeBtn: document.getElementById("duplicateCodeBtn"),
    openDocFolderBtn: document.getElementById("openDocFolderBtn"),
    editorState: document.getElementById("editorState"),
    aceEditor: document.getElementById("aceEditor"),
    consoleResizer: document.getElementById("consoleResizer"),
    consoleOutput: document.getElementById("consoleOutput"),
    clearConsoleBtn: document.getElementById("clearConsoleBtn"),
    copyConsoleBtn: document.getElementById("copyConsoleBtn"),
    copyErrorConsoleBtn: document.getElementById("copyErrorConsoleBtn"),
    contextMenu: document.getElementById("contextMenu"),
    selectedMetaBar: document.getElementById("selectedMetaBar"),
    toast: document.getElementById("toast")
  };

  function init() {
    writeBootStatus("正在初始化 HGScripts...");
    writeBootLog("init begin");
    if (LEGACY_COMPAT_MODE && document.body) {
      document.body.className += (document.body.className ? " " : "") + "legacy-compat";
    }
    ensureFolder(USER_SCRIPTS_ROOT);
    ensureFolder(DEFAULT_FOLDER);
    migrateFlatUserScriptsToIllustrator();
    ensureFolder(RUNTIME_FOLDER);
    saveSettings();
    renderHostProfile();
    renderCppMode();
    renderAppVersion();
    migrateDefaultSource();
    ensureActiveSource();
    if (LEGACY_COMPAT_MODE) {
      initLegacyTextEditor();
    } else {
      initAceEditor();
    }
    setupPanelMenu();
    bindEvents();
    renderSources();
    renderRecentSources();
    renderSettings();
    applyLanguageMode(false);
    applyConsoleHeight();
    restoreStartupPanelSize();
    render();
    writeBootLog("init UI ready");
    setTimeout(function () {
      try {
        writeBootLog("startup refresh begin");
        refresh("\u542F\u52A8\u626B\u63CF");
        hideBootStatusIfUiPainted();
        writeBootLog("startup refresh done");
      } catch (errRefresh) {
        failBoot("HGScripts 启动扫描失败", errRefresh);
      }
    }, 0);
    startPolling();
    startWatchers();
    if (LEGACY_COMPAT_MODE) {
      setTimeout(tryUpgradeLegacyAceEditor, 900);
    }
  }

  function setupPanelMenu() {
    try {
      cs.setPanelFlyoutMenu("<Menu><MenuItem Id=\"" + PANEL_MENU_SETTINGS_ID + "\" Label=\"&#35774;&#32622;\" Enabled=\"true\" Checked=\"false\"/><MenuItem Id=\"" + PANEL_MENU_ABOUT_ID + "\" Label=\"&#20851;&#20110;\" Enabled=\"true\" Checked=\"false\"/></Menu>");
      cs.addEventListener("com.adobe.csxs.events.flyoutMenuClicked", function (event) {
        var data = event && event.data ? event.data : {};
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (err) {
            data = { menuId: data };
          }
        }
        if (data.menuId === PANEL_MENU_SETTINGS_ID || data.menuName === "\u8BBE\u7F6E") {
          openSettingsView();
        } else if (data.menuId === PANEL_MENU_ABOUT_ID || data.menuName === "\u5173\u4E8E") {
          openAboutView();
        }
      });
    } catch (err) {}
  }

  function renderHostProfile() {
    document.body.setAttribute("data-host", HOST_PROFILE.key);
    if (el.hostBadge) {
      el.hostBadge.textContent = HOST_PROFILE.shortLabel;
      el.hostBadge.title = "\u5F53\u524D\u5BBF\u4E3B: " + HOST_PROFILE.label;
    }
    if (el.openDocFolderBtn) {
      el.openDocFolderBtn.title = "\u6253\u5F00\u5F53\u524D " + HOST_PROFILE.label + " \u6587\u6863\u6240\u5728\u6587\u4EF6\u5939";
    }
  }

  function renderAppVersion() {
    var version = "0.3.1";
    try {
      var manifestPath = path.join(EXTENSION_ROOT, "CSXS", "manifest.xml");
      var manifest = fs.readFileSync(manifestPath, "utf8");
      var match = manifest.match(/ExtensionBundleVersion="([^"]+)"/) || manifest.match(/<Extension[^>]+Version="([^"]+)"/);
      if (match && match[1]) {
        version = match[1];
      }
    } catch (err) {
      version = "0.3.1";
    }
    document.title = "\\u6D77\\u54E5\\u7684Adobe\\u811A\\u672C\\u7BA1\\u7406\\u5668 v" + version;
    if (el.appVersion) {
      el.appVersion.textContent = "v" + version;
    }
    if (el.aboutVersion) {
      el.aboutVersion.textContent = "v" + version;
    }
    state.appVersion = version;
  }

  function applyPanelMode(mode) {
    state.panelMode = mode === "wide" ? "wide" : "narrow";
    if (el.shell) {
      el.shell.classList.toggle("panel-wide", state.panelMode === "wide");
      el.shell.classList.toggle("panel-narrow", state.panelMode === "narrow");
    }
    if (el.panelSizeBtn) {
      el.panelSizeBtn.textContent = state.panelMode === "wide" ? "\u6536\u8D77" : "\u5C55\u5F00";
      el.panelSizeBtn.title = state.panelMode === "wide" ? "\u5207\u6362\u5230\u5C0F\u9762\u677F" : "\u5207\u6362\u5230\u5927\u9762\u677F";
    }
    if (state.ace) {
      setTimeout(function () {
        state.ace.resize(true);
      }, 0);
    }
  }

  function syncPanelModeFromWidth() {
    var width = document.documentElement.clientWidth || document.body.clientWidth || 0;
    var nextMode = width >= WIDE_LAYOUT_THRESHOLD ? "wide" : "narrow";
    if (nextMode === state.panelMode) {
      rememberPanelSize(state.panelMode);
    } else {
      applyPanelMode(nextMode);
      rememberPanelSize(nextMode);
    }
  }

  function resizePanel(mode, silent) {
    rememberPanelSize(state.panelMode);
    applyPanelMode(mode);
    var size = getRememberedPanelSize(mode);
    try {
      setPanelContentSize(size);
      if (!silent) {
        setToast(mode === "wide" ? "\u5DF2\u5207\u6362\u5230\u5927\u9762\u677F" : "\u5DF2\u5207\u6362\u5230\u5C0F\u9762\u677F", "ok");
      }
      setTimeout(function () {
        if (state.ace) {
          state.ace.resize(true);
        }
      }, 120);
    } catch (err) {
      if (!silent) {
        setToast("\u9762\u677F\u5C3A\u5BF8\u5207\u6362\u5931\u8D25: " + err.message, "error");
      }
    }
  }

  function restoreStartupPanelSize() {
    applyPanelMode("narrow");
    var size = getRememberedPanelSize("narrow");
    try {
      setPanelContentSize(size);
    } catch (err) {}
  }

  function setPanelContentSize(size) {
    if (cs && typeof cs.resizeContent === "function") {
      cs.resizeContent(size.width, size.height);
    } else if (window.__adobe_cep__ && window.__adobe_cep__.resizeContent) {
      window.__adobe_cep__.resizeContent(size.width, size.height);
    }
  }

  function getPanelClientSize() {
    var width = document.documentElement.clientWidth || document.body.clientWidth || 0;
    var height = document.documentElement.clientHeight || document.body.clientHeight || 0;
    return { width: width, height: height };
  }

  function getRememberedPanelSize(mode) {
    var fallback = mode === "wide"
      ? { width: WIDE_PANEL_WIDTH, height: WIDE_PANEL_HEIGHT }
      : { width: NARROW_PANEL_WIDTH, height: NARROW_PANEL_HEIGHT };
    var saved = state.panelSizes && state.panelSizes[mode];
    return normalizePanelSize(saved, fallback);
  }

  function rememberPanelSize(mode) {
    if (mode !== "wide" && mode !== "narrow") {
      return;
    }
    var size = getPanelClientSize();
    var fallback = getRememberedPanelSize(mode);
    var normalized = normalizePanelSize(size, fallback);
    state.panelSizes = state.panelSizes || {};
    state.panelSizes[mode] = normalized;
    setStoredValue(PANEL_SIZES_KEY, state.panelSizes);
  }

  function normalizePanelSize(size, fallback) {
    var next = {
      width: parseInt(size && size.width, 10),
      height: parseInt(size && size.height, 10)
    };
    if (!next.width || next.width < MIN_PANEL_WIDTH) {
      next.width = fallback.width;
    }
    if (!next.height || next.height < MIN_PANEL_HEIGHT) {
      next.height = fallback.height;
    }
    next.width = Math.max(MIN_PANEL_WIDTH, Math.min(1400, next.width));
    next.height = Math.max(MIN_PANEL_HEIGHT, Math.min(1800, next.height));
    return next;
  }

  function bindEvents() {
    el.refreshBtn.addEventListener("click", function () {
      refresh("\u624B\u52A8\u5237\u65B0");
    });

    if (el.panelSizeBtn) {
      el.panelSizeBtn.addEventListener("click", function () {
        resizePanel(state.panelMode === "wide" ? "narrow" : "wide");
      });
    }

    el.toggleSourcesBtn.addEventListener("click", function () {
      openSourceModal();
    });

    el.addSourceBtn.addEventListener("click", addSourceFromInput);
    el.saveSourceBtn.addEventListener("click", saveActiveSourceFromInput);
    el.removeSourceBtn.addEventListener("click", removeActiveSource);
    el.quickCreateScriptBtn.addEventListener("click", quickCreateScript);
    el.createScriptBtn.addEventListener("click", createNewScript);
    el.newScriptNameInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        createNewScript();
      }
    });
    el.closeSourcesBtn.addEventListener("click", closeSourceModal);
    el.closeCreateBtn.addEventListener("click", closeCreateModal);
    el.sourceModal.addEventListener("click", function (event) {
      if (event.target === el.sourceModal) {
        closeSourceModal();
      }
    });
    el.createModal.addEventListener("click", function (event) {
      if (event.target === el.createModal) {
        closeCreateModal();
      }
    });
    el.switchSaveBtn.addEventListener("click", function () {
      resolvePendingSwitch("save");
    });
    el.switchDiscardBtn.addEventListener("click", function () {
      resolvePendingSwitch("discard");
    });
    el.switchCancelBtn.addEventListener("click", function () {
      resolvePendingSwitch("cancel");
    });
    el.chooseBtn.addEventListener("click", chooseScriptWithWindowsDialog);
    el.chooseScriptBtn.addEventListener("click", chooseFolderWithWindowsDialog);
    if (el.currentDocBtn) {
      el.currentDocBtn.addEventListener("click", chooseCurrentDocumentFolder);
    }
    el.saveSettingsBtn.addEventListener("click", saveSettingsFromForm);
    el.closeSettingsViewBtn.addEventListener("click", closeUtilityViews);
    el.closeAboutViewBtn.addEventListener("click", closeUtilityViews);
    el.saveLanguageBtn.addEventListener("click", saveLanguageFromForm);
    el.githubLink.addEventListener("click", function (event) {
      event.preventDefault();
      openExternal("https://github.com/wujigge/HGScripts");
    });
    el.folderInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        addSourceFromInput();
      }
    });
    el.folderInput.addEventListener("input", function () {
      var value = normalizeInputPath(el.folderInput.value);
      if (value && !el.sourceNameInput.value.trim()) {
        el.sourceNameInput.value = inferSourceName(value);
      }
    });
    el.recentSourceSelect.addEventListener("change", function () {
      if (el.recentSourceSelect.value) {
        el.folderInput.value = el.recentSourceSelect.value;
        el.sourceNameInput.value = inferSourceName(el.recentSourceSelect.value);
      }
    });
    bindSearchInput();
    if (el.favoriteOnlyInput) {
      el.favoriteOnlyInput.addEventListener("change", render);
    }
    el.sortSelect.addEventListener("change", render);
    if (el.cppModeSelect) {
      el.cppModeSelect.addEventListener("change", function () {
        state.cppMode = normalizeCppMode(el.cppModeSelect.value);
        setStoredValue(CPP_MODE_KEY, state.cppMode);
        renderCppMode();
        render();
        setToast("运行模式: " + getCppModeHint(state.cppMode), "ok");
      });
    }

    if (el.favoriteBtn) {
      el.favoriteBtn.addEventListener("click", toggleFavorite);
    }
    el.renameBtn.addEventListener("click", renameSelected);
    el.detailDoc.addEventListener("input", function () {
      if (state.docLoading || el.detailDoc.disabled || !state.selectedPath) {
        return;
      }
      state.docDirty = true;
      state.docPath = state.selectedPath;
    });
    el.saveDocBtn.addEventListener("click", saveSelectedDoc);
    el.runBtn.addEventListener("click", runSelected);
    el.openBtn.addEventListener("click", function () {
      if (state.selectedPath) {
        openExternal(state.selectedPath);
      }
    });
    el.revealBtn.addEventListener("click", function () {
      if (state.selectedPath) {
        childProcess.execFile("explorer.exe", ["/select," + state.selectedPath]);
      }
    });

    el.contextMenu.addEventListener("click", function (event) {
      var button = event.target;
      if (!button || !button.getAttribute) {
        return;
      }
      var action = button.getAttribute("data-action");
      if (!action) {
        return;
      }
      hideContextMenu();
      runContextAction(action);
    });

    document.addEventListener("click", hideContextMenu);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        hideContextMenu();
        closeSourceModal();
        closeCreateModal();
        closeUtilityViews();
        resolvePendingSwitch("cancel");
      }
    });
    window.addEventListener("resize", function () {
      hideContextMenu();
      syncPanelModeFromWidth();
    });

    el.closeEditorBtn.addEventListener("click", closeCodeEditor);
    el.saveCodeBtn.addEventListener("click", saveCodeEditor);
    el.runCodeBtn.addEventListener("click", runFromEditor);
    el.saveRunCodeBtn.addEventListener("click", function () {
      saveCodeEditor(function (ok) {
        if (ok) {
          runSelected();
        }
      });
    });
    el.reloadCodeBtn.addEventListener("click", function () {
      if (state.editorPath) {
        openCodeEditor(state.editorPath, true);
      }
    });
    el.duplicateCodeBtn.addEventListener("click", duplicateSelectedScript);
    el.openDocFolderBtn.addEventListener("click", openCurrentDocumentFolder);
    bindEditorTitleInput();
    el.clearConsoleBtn.addEventListener("click", function () {
      el.consoleOutput.textContent = "控制台已清空。";
    });
    el.copyConsoleBtn.addEventListener("click", copyConsole);
    el.copyErrorConsoleBtn.addEventListener("click", copyLatestError);
    el.consoleOutput.addEventListener("click", function (event) {
      var target = event.target;
      if (target && target.getAttribute && target.getAttribute("data-line")) {
        jumpToLine(parseInt(target.getAttribute("data-line"), 10));
      }
    });
    bindConsoleResizer();
  }

  function bindSearchInput() {
    var composing = false;
    el.searchInput.addEventListener("compositionstart", function () {
      composing = true;
    });
    el.searchInput.addEventListener("compositionend", function () {
      composing = false;
      render();
    });
    el.searchInput.addEventListener("input", function () {
      if (!composing) {
        render();
      }
    });
    el.searchInput.addEventListener("keyup", function () {
      if (!composing) {
        render();
      }
    });
    el.searchInput.addEventListener("change", render);
  }

  function bindEditorTitleInput() {
    el.editorTitleInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        renameFromEditorTitle();
      } else if (event.key === "Escape") {
        event.preventDefault();
        restoreEditorTitleInput();
      }
    });
    el.editorTitleInput.addEventListener("blur", renameFromEditorTitle);
  }

  function initAceEditor() {
    if (!window.ace || !el.aceEditor) {
      setToast("Ace editor failed to load", "warn");
      return;
    }

    el.aceEditor.innerHTML = "";
    window.ace.config.set("basePath", "assets/js/ace");
    state.ace = window.ace.edit(el.aceEditor);
    state.ace.setTheme("ace/theme/tomorrow_night_eighties");
    state.ace.session.setMode("ace/mode/javascript");
    state.ace.session.setUseWorker(false);
    state.ace.setOptions({
      fontSize: "12px",
      showPrintMargin: false,
      tabSize: 4,
      useSoftTabs: true,
      wrap: false
    });
    state.ace.setReadOnly(true);
    state.ace.session.on("change", function () {
      if (state.editorLoading || !state.editorPath) {
        return;
      }
      state.editorDirty = true;
      clearEditorError();
      updateEditorState();
    });
    state.ace.commands.addCommand({
      name: "saveCode",
      bindKey: { win: "Ctrl-S", mac: "Command-S" },
      exec: function () {
        saveCodeEditor();
      }
    });
    state.ace.commands.addCommand({
      name: "runCode",
      bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
      exec: function () {
      runFromEditor();
    }
  });
  }

  function initLegacyTextEditor() {
    if (!el.aceEditor) {
      writeBootLog("legacy text editor skipped: editor host missing");
      return;
    }

    writeBootLog("legacy compat mode enabled; textarea editor initialized");
    el.aceEditor.innerHTML = "";
    var textarea = document.createElement("textarea");
    textarea.className = "legacy-text-editor";
    textarea.spellcheck = false;
    textarea.readOnly = true;
    el.aceEditor.appendChild(textarea);

    state.ace = {
      session: {
        setMode: function () {},
        setUseWorker: function () {},
        on: function (eventName, callback) {
          if (eventName === "change") {
            textarea.addEventListener("input", callback);
          }
        },
        clearAnnotations: function () {
          textarea.removeAttribute("data-error-line");
        },
        removeMarker: function () {},
        setAnnotations: function (annotations) {
          if (annotations && annotations.length && annotations[0].row != null) {
            textarea.setAttribute("data-error-line", String(annotations[0].row + 1));
          }
        },
        addMarker: function () {
          return 1;
        }
      },
      commands: {
        addCommand: function () {}
      },
      setTheme: function () {},
      setOptions: function () {},
      setReadOnly: function (value) {
        textarea.readOnly = !!value;
      },
      setValue: function (value) {
        textarea.value = value || "";
      },
      getValue: function () {
        return textarea.value;
      },
      resize: function () {},
      focus: function () {
        textarea.focus();
      },
      gotoLine: function (lineNumber) {
        var lines = textarea.value.split(/\r\n|\r|\n/);
        var target = Math.max(1, parseInt(lineNumber, 10) || 1);
        var pos = 0;
        for (var i = 0; i < target - 1 && i < lines.length; i++) {
          pos += lines[i].length + 1;
        }
        try {
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        } catch (err) {}
      }
    };

    state.ace.session.on("change", function () {
      if (state.editorLoading || !state.editorPath) {
        return;
      }
      state.editorDirty = true;
      updateEditorState();
    });
  }

  function loadScriptOnce(src, callback) {
    var existing = document.querySelector("script[data-dynamic-src='" + src + "']");
    if (existing && existing.getAttribute("data-loaded") === "1") {
      callback(true);
      return;
    }

    var script = existing || document.createElement("script");
    script.setAttribute("data-dynamic-src", src);
    script.onload = function () {
      script.setAttribute("data-loaded", "1");
      callback(true);
    };
    script.onerror = function () {
      callback(false);
    };
    if (!existing) {
      script.src = src;
      document.body.appendChild(script);
    }
  }

  function tryUpgradeLegacyAceEditor() {
    if (!LEGACY_COMPAT_MODE) {
      return;
    }
    writeBootLog("legacy Ace lazy load begin");
    loadScriptOnce("assets/js/ace/ace.js", function (okAce) {
      if (!okAce || !window.ace) {
        writeBootLog("legacy Ace lazy load failed: ace.js");
        appendConsole("旧版模式: Ace 加载失败，继续使用兼容编辑器。");
        return;
      }
      loadScriptOnce("assets/js/ace/mode-javascript.js", function (okMode) {
        loadScriptOnce("assets/js/ace/theme-tomorrow_night_eighties.js", function (okTheme) {
          try {
            state.ace = null;
            initAceEditor();
            if (state.editorPath) {
              state.editorLoading = true;
              state.ace.setValue(fs.readFileSync(state.editorPath, "utf8"), -1);
              state.ace.setReadOnly(false);
              state.editorLoading = false;
            }
            writeBootLog("legacy Ace lazy load done: mode=" + okMode + ", theme=" + okTheme);
            appendConsole("旧版模式: Ace 编辑器已延迟加载。");
          } catch (errAce) {
            writeBootLog("legacy Ace init failed: " + (errAce && errAce.stack ? errAce.stack : errAce));
            appendConsole("旧版模式: Ace 初始化失败，继续使用兼容编辑器。");
            initLegacyTextEditor();
          }
        });
      });
    });
  }

  function loadSources() {
    var saved = loadJson(SOURCES_KEY, null);
    if (saved && saved.length) {
      return normalizeSources(saved);
    }

    return [{
      id: makeId(),
      name: "\u9ED8\u8BA4\u811A\u672C",
      folder: DEFAULT_FOLDER,
      enabled: true
    }];
  }

  function normalizeSources(sources) {
    var result = [];
    for (var i = 0; i < sources.length; i++) {
      if (!sources[i] || !sources[i].folder) {
        continue;
      }
      result.push({
        id: sources[i].id || makeId(),
        name: isDefaultSource(sources[i]) ? "\u9ED8\u8BA4\u811A\u672C" : (sources[i].name || inferSourceName(sources[i].folder)),
        folder: normalizeDefaultSourceFolder(sources[i]),
        enabled: sources[i].enabled !== false
      });
    }
    return result.length ? result : [{
      id: makeId(),
      name: "\u9ED8\u8BA4\u811A\u672C",
      folder: DEFAULT_FOLDER,
      enabled: true
    }];
  }

  function normalizeDefaultSourceFolder(source) {
    var folder = source.folder;
    if (isDefaultSource(source)) {
      return DEFAULT_FOLDER;
    }
    return folder;
  }

  function isDefaultSource(source) {
    if (!source) {
      return false;
    }
    var folder = normalizeFsPath(source.folder || "");
    return source.name === "\u9ED8\u8BA4\u811A\u672C" ||
      source.id === "src_1777185389413_60603" ||
      samePath(folder, DEFAULT_FOLDER) ||
      samePath(folder, LEGACY_FLAT_USER_SCRIPTS_FOLDER) ||
      samePath(folder, EXTERNAL_DEFAULT_FOLDER);
  }

  function migrateDefaultSource() {
    var changed = false;
    for (var i = 0; i < state.sources.length; i++) {
      if (state.sources[i].name === "\u9ED8\u8BA4\u811A\u672C" && makeFileKey(state.sources[i].folder) !== makeFileKey(DEFAULT_FOLDER)) {
        state.sources[i].folder = DEFAULT_FOLDER;
        changed = true;
      }
    }
    if (changed) {
      saveSources();
    }
  }

  function migrateFlatUserScriptsToIllustrator() {
    if (HOST_PROFILE.key !== "illustrator") {
      return;
    }
    try {
      if (!fs.existsSync(LEGACY_FLAT_USER_SCRIPTS_FOLDER)) {
        return;
      }
      ensureFolder(DEFAULT_FOLDER);
      var names = fs.readdirSync(LEGACY_FLAT_USER_SCRIPTS_FOLDER);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (name === "illustrator" || name === "photoshop" || name === "indesign") {
          continue;
        }
        var fromPath = path.join(LEGACY_FLAT_USER_SCRIPTS_FOLDER, name);
        var toPath = path.join(DEFAULT_FOLDER, name);
        if (!fs.existsSync(toPath)) {
          fs.renameSync(fromPath, toPath);
        }
      }
    } catch (err) {
      setToast("\u65E7\u811A\u672C\u76EE\u5F55\u8FC1\u79FB\u5931\u8D25: " + err.message, "warn");
    }
  }

  function saveSources() {
    setStoredValue(SOURCES_KEY, state.sources);
    setStoredValue(ACTIVE_SOURCE_KEY, state.activeSourceId);
  }

  function ensureActiveSource() {
    if (state.activeSourceId === "all" || state.activeSourceId === "favorites" || findSource(state.activeSourceId)) {
      return;
    }
    state.activeSourceId = "all";
  }

  function renderSources() {
    var activeSource = getActiveSource();
    el.sourceTabs.innerHTML = "";
    addSourceTab("all", "\u5168\u90E8", state.activeSourceId === "all");
    addSourceTab("favorites", "\u6536\u85CF", state.activeSourceId === "favorites");

    for (var i = 0; i < state.sources.length; i++) {
      addSourceTab(state.sources[i].id, state.sources[i].name, state.sources[i].id === state.activeSourceId);
    }

    if (activeSource) {
      el.sourceNameInput.value = activeSource.name;
      el.folderInput.value = activeSource.folder;
      el.saveSourceBtn.disabled = false;
      el.removeSourceBtn.disabled = state.sources.length <= 1;
    } else {
      el.sourceNameInput.value = "";
      el.folderInput.value = "";
      el.saveSourceBtn.disabled = true;
      el.removeSourceBtn.disabled = true;
    }
  }

  function openSourceModal() {
    renderSources();
    renderRecentSources();
    el.sourceModal.classList.add("open");
    el.folderInput.focus();
  }

  function closeSourceModal() {
    el.sourceModal.classList.remove("open");
  }

  function openCreateModal(defaultName, defaultSubdir) {
    el.newScriptNameInput.value = defaultName || uniqueScriptBase((getActiveSource() || getDefaultSource() || state.sources[0]).folder, "\u65B0\u5EFA\u811A\u672C");
    el.newScriptDocInput.checked = true;
    el.createModal.classList.add("open");
    el.newScriptNameInput.focus();
    el.newScriptNameInput.select();
  }

  function closeCreateModal() {
    el.createModal.classList.remove("open");
  }

  function openSettingsView() {
    renderSettings();
    closeUtilityViews();
    el.shell.classList.add("settings-view-open");
    el.languageSelect.focus();
  }

  function openAboutView() {
    closeUtilityViews();
    if (el.aboutVersion) {
      el.aboutVersion.textContent = "v" + state.appVersion;
    }
    el.shell.classList.add("about-view-open");
  }

  function closeUtilityViews() {
    if (!el.shell) {
      return;
    }
    el.shell.classList.remove("settings-view-open");
    el.shell.classList.remove("about-view-open");
  }

  function renderRecentSources() {
    var recent = loadJson(RECENT_SOURCES_KEY, []);
    el.recentSourceSelect.innerHTML = "<option value=\"\">\u6700\u8FD1\u76EE\u5F55</option>";
    for (var i = 0; i < recent.length; i++) {
      var option = document.createElement("option");
      option.value = recent[i];
      option.textContent = inferSourceName(recent[i]) + " - " + recent[i];
      el.recentSourceSelect.appendChild(option);
    }
  }

  function renderSettings() {
    el.scanDepthInput.value = String(settings.scanDepth);
    el.ignoredDirsInput.value = (settings.ignoredDirs || []).join(",");
    el.languageSelect.value = normalizeLanguageMode(settings.languageMode);
    renderLanguageHint();
  }

  function saveSettingsFromForm() {
    settings.scanDepth = clampNumber(parseInt(el.scanDepthInput.value, 10), 0, 10, 5);
    settings.ignoredDirs = parseIgnoredDirs(el.ignoredDirsInput.value);
    saveSettings();
    refresh("设置已保存");
    startWatchers();
  }

  function saveLanguageFromForm() {
    settings.languageMode = normalizeLanguageMode(el.languageSelect.value);
    effectiveLanguage = resolveEffectiveLanguage(settings.languageMode, hostLanguage);
    saveSettings();
    applyLanguageMode(true);
  }

  function applyLanguageMode(showNotice) {
    settings.languageMode = normalizeLanguageMode(settings.languageMode);
    effectiveLanguage = resolveEffectiveLanguage(settings.languageMode, hostLanguage);
    if (el.languageSelect) {
      el.languageSelect.value = settings.languageMode;
    }
    renderLanguageHint();
    if (showNotice) {
      if (settings.languageMode === "zh-CN") {
        setToast("\u8BED\u8A00\u5DF2\u4FDD\u5B58\uFF1A\u4E2D\u6587", "ok");
      } else {
        setToast("\u5F53\u524D\u53EA\u6709\u4E2D\u6587\u754C\u9762\uFF0C\u5176\u5B83\u8BED\u8A00\u7B49\u5F85\u5F00\u53D1\u3002", "warn");
      }
    }
  }

  function renderLanguageHint() {
    if (!el.languageHint) {
      return;
    }
    var hostText = hostLanguage === "zh-CN" ? "\u4E2D\u6587" : "English";
    var modeText = settings.languageMode === "auto" ? "\u81EA\u52A8" : (settings.languageMode === "zh-CN" ? "\u4E2D\u6587" : "English");
    var effectiveText = effectiveLanguage === "zh-CN" ? "\u4E2D\u6587" : "English";
    el.languageHint.textContent = "\u5F53\u524D\u4EC5\u63D0\u4F9B\u4E2D\u6587\u754C\u9762\u3002\u9009\u9879\uFF1A" + modeText + "\uFF0CIllustrator/CEP\uFF1A" + hostText + "\uFF0C\u9884\u8BA1\u8BED\u8A00\uFF1A" + effectiveText + "\u3002";
  }

  function addSourceTab(id, label, active) {
    var button = document.createElement("button");
    button.className = "source-tab" + (active ? " active" : "");
    button.textContent = label;
    button.title = id === "all" ? "显示所有脚本目录" : (id === "favorites" ? "只显示收藏脚本" : label);
    button.addEventListener("click", function () {
      state.activeSourceId = id;
      saveSources();
      renderSources();
      render();
    });
    el.sourceTabs.appendChild(button);
  }

  function chooseFolderWithWindowsDialog() {
    try {
      var picked = openWindowsFolderDialog(getDialogStartPath(), "选择脚本文件夹");
      if (picked) {
        setFolderInput(picked);
      }
    } catch (err) {
      setToast("\u6253\u5F00\u76EE\u5F55\u9009\u62E9\u7A97\u53E3\u5931\u8D25: " + err.message, "error");
    }
  }

  function chooseScriptWithWindowsDialog() {
    try {
      var picked = openWindowsFileDialog(getDialogStartPath(), "\u9009\u62E9\u4E00\u4E2A JSX \u811A\u672C", "JSX \u811A\u672C (*.jsx)|*.jsx|\u6240\u6709\u6587\u4EF6 (*.*)|*.*");
      if (picked) {
        setFolderInput(path.dirname(picked));
      }
    } catch (err) {
      setToast("\u6253\u5F00 JSX \u9009\u62E9\u7A97\u53E3\u5931\u8D25: " + err.message, "error");
    }
  }

  function chooseCurrentDocumentFolder() {
    cs.evalScript("HGScripts.getActiveDocumentFolder()", function (resultPath) {
      if (!resultPath || String(resultPath).indexOf("ERROR:") === 0) {
        setToast(resultPath || "\u5F53\u524D\u6587\u6863\u6CA1\u6709\u53EF\u7528\u76EE\u5F55", "warn");
        return;
      }
      setFolderInput(resultPath);
    });
  }

  function setFolderInput(folderPath) {
    var normalized = normalizeInputPath(folderPath);
    el.folderInput.value = normalized;
    el.sourceNameInput.value = inferSourceName(normalized);
    addRecentSource(normalized);
    renderRecentSources();
  }

  function bindDropZone() {
    var stop = function (event) {
      event.preventDefault();
      event.stopPropagation();
    };
    el.dropZone.addEventListener("dragover", function (event) {
      stop(event);
      el.dropZone.classList.add("dragging");
    });
    el.dropZone.addEventListener("dragleave", function (event) {
      stop(event);
      el.dropZone.classList.remove("dragging");
    });
    el.dropZone.addEventListener("drop", function (event) {
      stop(event);
      el.dropZone.classList.remove("dragging");
      var files = event.dataTransfer && event.dataTransfer.files;
      if (!files || !files.length) {
        return;
      }
      for (var i = 0; i < files.length; i++) {
        var droppedPath = files[i].path;
        if (!droppedPath) {
          continue;
        }
        addSourceFromPath(resolveDroppedSourcePath(droppedPath));
      }
    });
  }

  function resolveDroppedSourcePath(droppedPath) {
    try {
      var stat = fs.statSync(droppedPath);
      if (stat.isDirectory()) {
        return droppedPath;
      }
      if (stat.isFile() && SCRIPT_EXTENSIONS[path.extname(droppedPath).toLowerCase()]) {
        return path.dirname(droppedPath);
      }
    } catch (err) {}
    return "";
  }

  function addSourceFromInput() {
    var folder = normalizeInputPath(el.folderInput.value);
    addSourceFromPath(folder);
  }

  function addSourceFromPath(folder) {
    if (!folder) {
      setToast("\u811A\u672C\u76EE\u5F55\u4E0D\u80FD\u4E3A\u7A7A", "warn");
      return;
    }
    if (!fs.existsSync(folder)) {
      setToast("\u76EE\u5F55\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u786E\u8BA4\u8DEF\u5F84", "error");
      return;
    }
    for (var i = 0; i < state.sources.length; i++) {
      if (makeFileKey(state.sources[i].folder) === makeFileKey(folder)) {
        state.activeSourceId = state.sources[i].id;
        setFolderInput(folder);
        saveSources();
        renderSources();
        render();
        setToast("\u76EE\u5F55\u5DF2\u5B58\u5728\uFF0C\u5DF2\u5207\u6362\u5230\u8BE5\u76EE\u5F55\u6E90", "");
        return;
      }
    }

    var source = {
      id: makeId(),
      name: el.sourceNameInput.value.trim() || inferSourceName(folder),
      folder: folder,
      enabled: true
    };
    state.sources.push(source);
    state.activeSourceId = source.id;
    addRecentSource(folder);
    saveSources();
    renderSources();
    renderRecentSources();
    refresh("\u6DFB\u52A0\u76EE\u5F55");
    startWatchers();
  }

  function saveActiveSourceFromInput() {
    var source = getActiveSource();
    if (!source) {
      setToast("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u5177\u4F53\u76EE\u5F55\u6E90", "warn");
      return;
    }

    var folder = normalizeInputPath(el.folderInput.value);
    if (!folder) {
      setToast("\u811A\u672C\u76EE\u5F55\u4E0D\u80FD\u4E3A\u7A7A", "warn");
      return;
    }
    source.name = el.sourceNameInput.value.trim() || inferSourceName(folder);
    source.folder = folder;
    addRecentSource(folder);
    saveSources();
    renderSources();
    renderRecentSources();
    refresh("目录已保存");
    startWatchers();
  }

  function removeActiveSource() {
    var source = getActiveSource();
    if (!source || state.sources.length <= 1) {
      setToast("至少保留一个脚本目录", "warn");
      return;
    }

    if (!window.confirm("移除目录源「" + source.name + "」？不会删除磁盘文件。")) {
      return;
    }

    for (var i = state.sources.length - 1; i >= 0; i--) {
      if (state.sources[i].id === source.id) {
        state.sources.splice(i, 1);
        break;
      }
    }
    state.activeSourceId = "all";
    state.selectedPath = "";
    saveSources();
    renderSources();
    refresh("\u79FB\u9664\u76EE\u5F55");
    startWatchers();
  }

  function createNewScript() {
    var source = getActiveSource();
    if (!source) {
      source = getDefaultSource() || state.sources[0];
    }

    var base = sanitizeBaseName(el.newScriptNameInput.value);
    if (!base) {
      setToast("\u65B0\u811A\u672C\u540D\u4E0D\u80FD\u4E3A\u7A7A", "warn");
      el.newScriptNameInput.focus();
      return;
    }

    var targetFolder = source.folder;
    var scriptPath = path.join(targetFolder, base + ".jsx");
    var docPath = path.join(targetFolder, base + ".md");

    if (fs.existsSync(scriptPath)) {
      setToast("\u5DF2\u5B58\u5728\u540C\u540D JSX\uFF0C\u65B0\u5EFA\u5DF2\u53D6\u6D88", "error");
      return;
    }

    try {
      ensureFolder(targetFolder);
      fs.writeFileSync(scriptPath, getNewScriptTemplate(base), "utf8");
      if (el.newScriptDocInput.checked && !fs.existsSync(docPath)) {
        fs.writeFileSync(docPath, getDefaultDocTemplate({ base: base }), "utf8");
      }
      el.newScriptNameInput.value = "";
      closeCreateModal();
      setToast("\u5DF2\u65B0\u5EFA\u811A\u672C: " + base + ".jsx", "ok");
      refresh("\u65B0\u5EFA\u811A\u672C");
      selectItem(scriptPath);
      openCodeEditor(scriptPath);
    } catch (err) {
      setToast("\u65B0\u5EFA\u811A\u672C\u5931\u8D25: " + err.message, "error");
    }
  }

  function quickCreateScript() {
    var source = getActiveSource() || getDefaultSource() || state.sources[0];
    if (!source) {
      setToast("没有可用目录源", "warn");
      return;
    }
    openCreateModal(uniqueScriptBase(source.folder, "\u65B0\u5EFA\u811A\u672C"), "");
  }

  function uniqueScriptBase(folder, base) {
    var candidate = sanitizeBaseName(base) || "\u65B0\u5EFA\u811A\u672C";
    var index = 1;
    var next = candidate;
    while (fs.existsSync(path.join(folder, next + ".jsx"))) {
      index++;
      next = candidate + index;
    }
    return next;
  }

  function ensureFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  function sanitizeRelativeFolder(value) {
    var text = normalizeInputPath(value).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (!text) {
      return "";
    }
    var parts = text.split("/");
    var safe = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim().replace(/[\\/:*?"<>|]/g, "");
      if (part && part !== "." && part !== "..") {
        safe.push(part);
      }
    }
    return safe.join(path.sep);
  }

  function getNewScriptTemplate(name) {
    return "#target illustrator\n\n" +
      "function main() {\n" +
      "    if (app.documents.length === 0) {\n" +
      "        alert(\"\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Illustrator \u6587\u6863\");\n" +
      "        return;\n" +
      "    }\n\n" +
      "    var doc = app.activeDocument;\n" +
      "}\n\n" +
      "main();\n";
  }

  function addRecentSource(folder) {
    var normalized = normalizeInputPath(folder);
    if (!normalized) {
      return;
    }
    var recent = loadJson(RECENT_SOURCES_KEY, []);
    var next = [normalized];
    for (var i = 0; i < recent.length; i++) {
      if (makeFileKey(recent[i]) !== makeFileKey(normalized)) {
        next.push(recent[i]);
      }
      if (next.length >= 8) {
        break;
      }
    }
    setStoredValue(RECENT_SOURCES_KEY, next);
  }

  function refresh(reason) {
    var previous = loadPreviousState();
    state.scriptIcons = loadScriptIcons();
    var result = scanSources();
    state.files = result.files;
    state.lastSignature = result.signature;
    saveCurrentState(result.snapshot);
    render();
    updateChangeStatus(previous, result.snapshot, reason);
  }

  function scanSources() {
    var files = [];
    var snapshot = {};
    var existingCount = 0;
    var missing = [];

    for (var i = 0; i < state.sources.length; i++) {
      var source = state.sources[i];
      if (source.enabled === false) {
        continue;
      }
      if (!fs.existsSync(source.folder)) {
        missing.push(source.name);
        continue;
      }
      existingCount++;
      scanFolder(source, files, snapshot);
    }

    if (!existingCount) {
      el.folderHint.textContent = HOST_PROFILE.label + " / 没有可读取的脚本目录";
      setToast("目录不存在，请重新选择", "error");
    } else {
      el.folderHint.textContent = HOST_PROFILE.label + " / " + state.sources.length + " 个目录源，" + files.length + " 个脚本" +
        (missing.length ? "，失效 " + missing.length + " 个" : "");
    }

    files.sort(compareByMtimeDesc);
    return {
      files: files,
      snapshot: snapshot,
      signature: JSON.stringify(snapshot)
    };
  }

  function buildSnapshotFromFiles(files) {
    var snapshot = {};
    for (var i = 0; i < files.length; i++) {
      snapshot[files[i].key] = {
        name: files[i].name,
        sourceName: files[i].sourceName,
        mtimeMs: files[i].mtimeMs,
        size: files[i].size
      };
    }
    return snapshot;
  }

  function scanFolder(source, files, snapshot) {
    scanDirectory(source, source.folder, 0, files, snapshot);
  }

  function scanDirectory(source, folder, depth, files, snapshot) {
    var names;
    try {
      names = fs.readdirSync(folder);
    } catch (err) {
      return;
    }

    names.forEach(function (name) {
      var fullPath = path.join(folder, name);
      var stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (errStat) {
        return;
      }

      if (stat.isDirectory()) {
        if (depth < settings.scanDepth && !isIgnoredFolder(name)) {
          scanDirectory(source, fullPath, depth + 1, files, snapshot);
        }
        return;
      }

      var rawExt = path.extname(name);
      var ext = rawExt.toLowerCase();
      if (!stat.isFile() || !SCRIPT_EXTENSIONS[ext]) {
        return;
      }

      var base = name.slice(0, name.length - rawExt.length);
      var scriptFolder = path.dirname(fullPath);
      var relativePath = path.relative(source.folder, fullPath);
      var relativeDir = path.dirname(relativePath);
      if (relativeDir === ".") {
        relativeDir = "";
      }
      var docPath = path.join(scriptFolder, base + ".md");
      var doc = "";
      var hasDoc = fs.existsSync(docPath);
      var scriptMeta = readScriptMeta(fullPath);

      if (hasDoc) {
        try {
          doc = fs.readFileSync(docPath, "utf8");
        } catch (errDoc) {
          doc = "\u8BF4\u660E\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25: " + errDoc.message;
        }
      }
      var item = {
        sourceId: source.id,
        sourceName: source.name,
        sourceFolder: source.folder,
        scriptFolder: scriptFolder,
        relativePath: relativePath,
        relativeDir: relativeDir,
        name: name,
        base: base,
        ext: ext,
        fullPath: fullPath,
        docPath: docPath,
        hasDoc: hasDoc,
        doc: doc,
        badges: scriptMeta.badges,
        cppPlugins: scriptMeta.cppPlugins,
        cppCommands: scriptMeta.cppCommands,
        mtimeMs: stat.mtime.getTime(),
        mtimeText: formatTime(stat.mtime),
        size: stat.size,
        key: makeFileKey(fullPath)
      };

      files.push(item);
      snapshot[item.key] = {
        name: item.name,
        sourceName: item.sourceName,
        mtimeMs: item.mtimeMs,
        size: item.size
      };
    });
  }

  function isIgnoredFolder(name) {
    var lower = String(name || "").toLowerCase();
    var ignored = settings.ignoredDirs || DEFAULT_SETTINGS.ignoredDirs;
    for (var i = 0; i < ignored.length; i++) {
      if (lower === String(ignored[i]).toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  function render() {
    var query = el.searchInput.value.trim().toLowerCase();
    var activeSourceId = state.activeSourceId;
    var list = state.files.filter(function (item) {
      if (activeSourceId === "favorites" && !state.favorites[item.key]) {
        return false;
      }
      if (activeSourceId !== "all" && activeSourceId !== "favorites" && item.sourceId !== activeSourceId) {
        return false;
      }
      if (el.favoriteOnlyInput && el.favoriteOnlyInput.checked && !state.favorites[item.key]) {
        return false;
      }
      if (!query) {
        return true;
      }
      return item.name.toLowerCase().indexOf(query) >= 0 ||
        item.relativePath.toLowerCase().indexOf(query) >= 0 ||
        item.sourceName.toLowerCase().indexOf(query) >= 0 ||
        item.doc.toLowerCase().indexOf(query) >= 0;
    });

    sortList(list);
    state.filtered = list;
    el.countLabel.textContent = list.length + " / " + state.files.length + " 个脚本";
    el.scriptList.innerHTML = "";
    el.scriptList.classList.toggle("has-running", !!state.running);

    list.forEach(function (item, index) {
      var row = document.createElement("div");
      var isRunningItem = state.running && state.runningPath && makeFileKey(item.fullPath) === makeFileKey(state.runningPath);
      row.className = "script-item" +
        (item.fullPath === state.selectedPath ? " active" : "") +
        (isRunningItem ? " running-item" : "") +
        (state.running && !isRunningItem ? " running-dim" : "");
      row.title = item.fullPath;
      row.innerHTML =
        "<div class=\"script-index\"></div>" +
        "<span class=\"script-icon-wrap\"><img class=\"script-icon\" alt=\"\" draggable=\"false\"></span>" +
        "<div class=\"script-main\">" +
          "<div class=\"script-title\"></div>" +
        "</div>" +
        "<div class=\"script-tags\">" +
          "<button class=\"star\" title=\"收藏脚本\"></button>" +
          "<button class=\"badge\" title=\"编辑说明\"></button>" +
        "</div>";
      row.querySelector(".script-index").textContent = index + 1;
      row.querySelector(".script-title").textContent = item.name;
      var icon = row.querySelector(".script-icon");
      if (LEGACY_COMPAT_MODE) {
        renderLegacyInlineScriptIcon(icon);
      } else {
        icon.src = getScriptIconSrc(item);
        icon.addEventListener("error", function () {
          if (this.getAttribute("data-fallback-used") === "1") {
            this.style.display = "none";
            return;
          }
          this.setAttribute("data-fallback-used", "1");
          this.src = DEFAULT_SCRIPT_ICON;
        });
      }
      if (shouldShowScriptBoostBadge(item)) {
        row.className += " script-accelerated";
        var iconWrap = row.querySelector(".script-icon-wrap");
        var boost = document.createElement("span");
        boost.className = "script-boost-badge boost-" + normalizeCppMode(state.cppMode);
        boost.textContent = "\u26A1";
        boost.title = getCppBoostBadgeTitle();
        iconWrap.appendChild(boost);
      }
      var star = row.querySelector(".star");
      var favorited = !!state.favorites[item.key];
      star.textContent = favorited ? "★" : "☆";
      star.className = "star" + (favorited ? " favorited" : "");
      star.title = favorited ? "取消收藏" : "收藏脚本";
      star.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleFavoriteByPath(item.fullPath);
      });
      var badge = row.querySelector(".badge");
      badge.textContent = item.hasDoc ? "说明" : "无";
      badge.className = "badge" + (item.hasDoc ? "" : " no-doc");
      badge.title = item.hasDoc ? "编辑说明" : "新建并编辑说明";
      badge.addEventListener("click", function (event) {
        event.stopPropagation();
        if (selectItem(item.fullPath)) {
          editSelectedDoc(item);
        }
      });
      row.addEventListener("click", function () {
        hideContextMenu();
        selectItem(item.fullPath);
      });
      row.addEventListener("dblclick", function () {
        if (selectItem(item.fullPath)) {
          runSelected();
        }
      });
      row.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        if (selectItem(item.fullPath)) {
          showContextMenu(event.clientX, event.clientY, item);
        }
      });
      el.scriptList.appendChild(row);
    });

    if (state.selectedPath) {
      var stillExists = findByPath(state.selectedPath);
      if (stillExists) {
        showDetail(stillExists);
      } else {
        clearDetail("脚本已被移动或删除");
      }
    } else {
      clearDetail();
    }
  }

  function sortList(list) {
    if (el.sortSelect.value === "nameAsc") {
      list.sort(function (a, b) { return a.name.localeCompare(b.name, "zh-Hans-CN"); });
    } else if (el.sortSelect.value === "nameDesc") {
      list.sort(function (a, b) { return b.name.localeCompare(a.name, "zh-Hans-CN"); });
    } else if (el.sortSelect.value === "initialAsc") {
      list.sort(function (a, b) { return compareByInitial(a, b); });
    } else if (el.sortSelect.value === "initialDesc") {
      list.sort(function (a, b) { return compareByInitial(b, a); });
    } else if (el.sortSelect.value === "lastRunDesc") {
      list.sort(function (a, b) {
        return getRunStat(b.key).lastRun - getRunStat(a.key).lastRun || compareByMtimeDesc(a, b);
      });
    } else {
      list.sort(compareByMtimeDesc);
    }
  }

  function selectItem(fullPath, options) {
    options = options || {};
    if (!options.force && shouldAskBeforeEditorSwitch(fullPath)) {
      openSwitchModal(fullPath, null, "code");
      return false;
    }
    if (!options.force && shouldAskBeforeDocSwitch(fullPath)) {
      openSwitchModal(fullPath, null, "doc");
      return false;
    }
    state.selectedPath = fullPath;
    var item = findByPath(fullPath);
    if (item) {
      showDetail(item);
      renderListActiveOnly();
      if (shouldFollowSelectionInEditor(fullPath)) {
        openCodeEditor(fullPath, true);
      }
      return true;
    }
    return false;
  }

  function renderListActiveOnly() {
    var rows = el.scriptList.querySelectorAll(".script-item");
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("active", rows[i].title === state.selectedPath);
      var isRunningRow = !!state.running && !!state.runningPath && makeFileKey(rows[i].title) === makeFileKey(state.runningPath);
      rows[i].classList.toggle("running-item", isRunningRow);
      rows[i].classList.toggle("running-dim", !!state.running && !isRunningRow);
    }
    el.scriptList.classList.toggle("has-running", !!state.running);
  }

  function shouldAskBeforeEditorSwitch(fullPath) {
    return isEditorOpen() &&
      state.editorDirty &&
      state.editorPath &&
      fullPath &&
      makeFileKey(state.editorPath) !== makeFileKey(fullPath);
  }

  function shouldAskBeforeDocSwitch(fullPath) {
    return state.docDirty &&
      state.docPath &&
      fullPath &&
      makeFileKey(state.docPath) !== makeFileKey(fullPath);
  }

  function shouldFollowSelectionInEditor(fullPath) {
    return isEditorOpen() &&
      state.editorPath &&
      fullPath &&
      makeFileKey(state.editorPath) !== makeFileKey(fullPath);
  }

  function isEditorOpen() {
    return !!(el.codeEditor && el.codeEditor.classList.contains("open"));
  }

  function openSwitchModal(fullPath, callback, kind) {
    state.pendingSwitchPath = fullPath;
    state.pendingSwitchCallback = callback || null;
    state.pendingSwitchKind = kind === "doc" ? "doc" : "code";
    if (el.switchTitle) {
      el.switchTitle.textContent = state.pendingSwitchKind === "doc" ? "\u5F53\u524D\u8BF4\u660E\u672A\u4FDD\u5B58" : "\u5F53\u524D\u811A\u672C\u672A\u4FDD\u5B58";
    }
    el.switchModal.classList.add("open");
  }

  function closeSwitchModal() {
    el.switchModal.classList.remove("open");
    state.pendingSwitchPath = "";
    state.pendingSwitchCallback = null;
    state.pendingSwitchKind = "code";
  }

  function resolvePendingSwitch(action) {
    var fullPath = state.pendingSwitchPath;
    var callback = state.pendingSwitchCallback;
    if (!fullPath) {
      closeSwitchModal();
      return;
    }
    if (action === "cancel") {
      closeSwitchModal();
      setToast("\u5DF2\u53D6\u6D88\u5207\u6362", "");
      return;
    }
    if (action === "save") {
      var saveFn = state.pendingSwitchKind === "doc" ? saveSelectedDoc : saveCodeEditor;
      saveFn(function (ok) {
        if (ok) {
          closeSwitchModal();
          selectItem(fullPath, { force: true });
          if (callback) {
            callback();
          }
        }
      });
      return;
    }
    if (state.pendingSwitchKind === "doc") {
      state.docDirty = false;
      state.docPath = "";
    }
    closeSwitchModal();
    selectItem(fullPath, { force: true });
    if (callback) {
      callback();
    }
  }

  function updateSelectedMeta(item, runText) {
    if (!el.selectedMetaBar) {
      return;
    }
    if (!item) {
      el.selectedMetaBar.textContent = "\u672A\u9009\u62E9\u811A\u672C";
      return;
    }
    var folderText = item.relativeDir ? item.sourceName + " / " + item.relativeDir : item.sourceName;
    el.selectedMetaBar.textContent = folderText + " / " + item.mtimeText + " / " + formatSize(item.size) + (runText || "");
    el.selectedMetaBar.title = item.fullPath;
  }

  function getRunText(item) {
    var stat = getRunStat(item.key);
    return stat.lastRun ? " / 上次运行 " + formatTime(new Date(stat.lastRun)) + " / 运行 " + stat.count + " 次" : "";
  }

  function showDetail(item) {
    var runText = getRunText(item);
    el.detailTitle.textContent = item.name;
    el.detailMeta.textContent = item.fullPath;
    updateSelectedMeta(item, runText);
    el.renameInput.value = item.name;
    el.renameInput.disabled = false;
    el.renameBtn.disabled = false;
    if (el.favoriteBtn) {
      el.favoriteBtn.disabled = false;
      el.favoriteBtn.textContent = state.favorites[item.key] ? "★" : "☆";
    }
    state.docLoading = true;
    if (!(state.docDirty && state.docPath && makeFileKey(state.docPath) === makeFileKey(item.fullPath))) {
      el.detailDoc.value = item.doc || getDefaultDocTemplate(item);
      state.docDirty = false;
    }
    state.docPath = item.fullPath;
    state.docLoading = false;
    el.detailDoc.disabled = false;
    el.saveDocBtn.disabled = false;
    el.runBtn.disabled = false;
    el.openBtn.disabled = false;
    el.revealBtn.disabled = false;
  }

  function clearDetail(message) {
    state.selectedPath = "";
    el.detailTitle.textContent = message || "选择一个脚本";
    el.detailMeta.textContent = "";
    updateSelectedMeta(null);
    el.renameInput.value = "";
    el.renameInput.disabled = true;
    el.renameBtn.disabled = true;
    if (el.favoriteBtn) {
      el.favoriteBtn.disabled = true;
      el.favoriteBtn.textContent = "☆";
    }
    state.docLoading = true;
    el.detailDoc.value = "同名 .md 会显示在这里。";
    state.docLoading = false;
    state.docDirty = false;
    state.docPath = "";
    el.detailDoc.disabled = true;
    el.saveDocBtn.disabled = true;
    el.runBtn.disabled = true;
    el.openBtn.disabled = true;
    el.revealBtn.disabled = true;
  }

  function toggleFavorite() {
    var item = findByPath(state.selectedPath);
    if (!item) {
      return;
    }
    setFavoriteForItem(item);
  }

  function toggleFavoriteByPath(fullPath) {
    state.selectedPath = fullPath;
    var item = findByPath(fullPath);
    if (!item) {
      return;
    }
    setFavoriteForItem(item);
  }

  function setFavoriteForItem(item) {
    if (state.favorites[item.key]) {
      delete state.favorites[item.key];
      setToast("\u5DF2\u53D6\u6D88\u6536\u85CF: " + item.name, "");
    } else {
      state.favorites[item.key] = {
        name: item.name,
        sourceName: item.sourceName,
        time: Date.now()
      };
      setToast("\u5DF2\u6536\u85CF: " + item.name, "ok");
    }
    setStoredValue(FAVORITES_KEY, state.favorites);
    showDetail(item);
    render();
  }

  function saveSelectedDoc(callback) {
    var item = findByPath(state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      if (callback) {
        callback(false);
      }
      return;
    }

    try {
      fs.writeFileSync(item.docPath, el.detailDoc.value, "utf8");
      state.docDirty = false;
      state.docPath = item.fullPath;
      setToast("\u8BF4\u660E\u5DF2\u4FDD\u5B58: " + path.basename(item.docPath), "ok");
      refresh("\u4FDD\u5B58\u8BF4\u660E");
      selectItem(item.fullPath, { force: true });
      if (callback) {
        callback(true);
      }
    } catch (err) {
      setToast("\u8BF4\u660E\u4FDD\u5B58\u5931\u8D25: " + err.message, "error");
      if (callback) {
        callback(false);
      }
    }
  }

  function renameSelected() {
    var item = findByPath(state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }

    var nextName = sanitizeScriptFileName(el.renameInput.value, item.ext);
    if (!nextName.base) {
      setToast("脚本名不能为空", "warn");
      return;
    }
    if (nextName.name === item.name) {
      setToast("脚本名没有变化", "");
      return;
    }

    var targetFolder = item.scriptFolder || item.sourceFolder;
    var nextScriptPath = path.join(targetFolder, nextName.name);
    var nextDocPath = path.join(targetFolder, nextName.base + ".md");
    if (fs.existsSync(nextScriptPath)) {
      setToast("已存在同名脚本，重命名已取消", "error");
      return;
    }
    if (item.hasDoc && fs.existsSync(nextDocPath)) {
      setToast("\u5DF2\u5B58\u5728\u540C\u540D\u8BF4\u660E\u6587\u4EF6\uFF0C\u91CD\u547D\u540D\u5DF2\u53D6\u6D88", "error");
      return;
    }

    try {
      fs.renameSync(item.fullPath, nextScriptPath);
      if (item.hasDoc) {
        fs.renameSync(item.docPath, nextDocPath);
      } else if (el.detailDoc.value.trim() && el.detailDoc.value !== getDefaultDocTemplate(item)) {
        fs.writeFileSync(nextDocPath, el.detailDoc.value, "utf8");
      }
      moveMetadata(item.key, makeFileKey(nextScriptPath), nextName.name, item.sourceName);
      state.selectedPath = nextScriptPath;
      if (state.editorPath && makeFileKey(state.editorPath) === item.key) {
        state.editorPath = nextScriptPath;
        el.editorPath.textContent = nextScriptPath;
        el.editorTitleInput.value = nextName.name;
      }
      setToast("\u5DF2\u91CD\u547D\u540D\u4E3A: " + nextName.name, "ok");
      refresh("重命名脚本");
      selectItem(nextScriptPath);
    } catch (err) {
      setToast("\u91CD\u547D\u540D\u5931\u8D25: " + err.message, "error");
    }
  }

  function renameFromEditorTitle() {
    var item = findByPath(state.editorPath || state.selectedPath);
    if (!item || !el.editorTitleInput) {
      return;
    }
    var nextName = sanitizeScriptFileName(el.editorTitleInput.value, item.ext);
    if (!nextName.base || nextName.name === item.name) {
      restoreEditorTitleInput();
      return;
    }
    el.renameInput.value = nextName.name;
    renameSelected();
  }

  function restoreEditorTitleInput() {
    var item = findByPath(state.editorPath || state.selectedPath);
    if (item && el.editorTitleInput) {
      el.editorTitleInput.value = item.name;
    }
  }

  function duplicateSelectedScript() {
    var item = findByPath(state.editorPath || state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }

    if (state.editorDirty) {
      if (!window.confirm("\u5F53\u524D\u4EE3\u7801\u5C1A\u672A\u4FDD\u5B58\u3002\u662F\u5426\u5148\u4FDD\u5B58\u518D\u521B\u5EFA\u526F\u672C\uFF1F")) {
        return;
      }
      saveCodeEditor(function (ok) {
        if (ok) {
          duplicateSelectedScript();
        }
      });
      return;
    }

    var folder = item.scriptFolder || item.sourceFolder;
    var nextBase = getCopyBaseName(folder, item.base, item.ext);
    var nextScriptPath = path.join(folder, nextBase + item.ext);
    var nextDocPath = path.join(folder, nextBase + ".md");

    try {
      fs.copyFileSync(item.fullPath, nextScriptPath);
      if (item.hasDoc && fs.existsSync(item.docPath)) {
        fs.copyFileSync(item.docPath, nextDocPath);
      }
      setToast("\u5DF2\u521B\u5EFA\u526F\u672C: " + nextBase + item.ext, "ok");
      refresh("\u521B\u5EFA\u526F\u672C");
      selectItem(nextScriptPath);
      openCodeEditor(nextScriptPath, true);
    } catch (err) {
      setToast("\u521B\u5EFA\u526F\u672C\u5931\u8D25: " + err.message, "error");
    }
  }

  function getCopyBaseName(folder, base, ext) {
    var suffix = "_copy";
    var next = base + suffix;
    var index = 2;
    while (fs.existsSync(path.join(folder, next + ext))) {
      next = base + suffix + index;
      index++;
    }
    return next;
  }

  function renameSelectedWithPrompt() {
    var item = findByPath(state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }
    var nextBase = window.prompt("重命名脚本", item.name);
    if (nextBase === null) {
      return;
    }
    el.renameInput.value = nextBase;
    renameSelected();
  }

  function showContextMenu(x, y, item) {
    el.contextMenu.classList.add("open");
    el.contextMenu.style.left = "0px";
    el.contextMenu.style.top = "0px";

    var menuWidth = el.contextMenu.offsetWidth || 180;
    var menuHeight = el.contextMenu.offsetHeight || 240;
    var left = Math.min(x, window.innerWidth - menuWidth - 8);
    var top = Math.min(y, window.innerHeight - menuHeight - 8);

    el.contextMenu.style.left = Math.max(8, left) + "px";
    el.contextMenu.style.top = Math.max(8, top) + "px";
  }

  function hideContextMenu() {
    el.contextMenu.classList.remove("open");
  }

  function moveToRecycleBin(filePath) {
    childProcess.execFileSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "$shell=New-Object -ComObject Shell.Application; $item=Get-Item -LiteralPath " + psString(filePath) + "; $shell.Namespace(10).MoveHere($item.FullName)"
    ], { windowsHide: true });
  }

  function runContextAction(action) {
    var item = findByPath(state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }

    if (action === "run") {
      runSelected();
    } else if (action === "internalEdit") {
      editSelectedScript(item);
    } else if (action === "editDoc") {
      editSelectedDoc(item);
    } else if (action === "reveal") {
      childProcess.execFile("explorer.exe", ["/select," + item.fullPath]);
    } else if (action === "delete") {
      deleteSelectedScript();
    }
  }

  function editSelectedScript(item) {
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }
    var openScriptEditor = function () {
      if (state.panelMode === "narrow") {
        resizePanel("wide", true);
      }
      openCodeEditor(item.fullPath, true);
    };

    if (shouldAskBeforeEditorSwitch(item.fullPath)) {
      openSwitchModal(item.fullPath, openScriptEditor, "code");
      return;
    }
    openScriptEditor();
  }

  function editSelectedDoc(item) {
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }
    var openDocEditor = function () {
      selectItem(item.fullPath, { force: true });
      if (state.panelMode === "narrow") {
        resizePanel("wide", true);
      }
      el.codeEditor.classList.remove("open");
      el.contentPanel.classList.remove("editor-open");
      showDetail(item);
      el.detailDoc.disabled = false;
      el.saveDocBtn.disabled = false;
      setToast("\u6B63\u5728\u7F16\u8F91\u8BF4\u660E: " + item.name, "");
    };

    if (state.editorDirty) {
      openSwitchModal(item.fullPath, openDocEditor, "code");
      return;
    }
    openDocEditor();
  }

  function deleteSelectedScript() {
    var item = findByPath(state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }
    try {
      var hadDoc = item.hasDoc && fs.existsSync(item.docPath);
      moveToRecycleBin(item.fullPath);
      if (hadDoc) {
        moveToRecycleBin(item.docPath);
      }
      state.selectedPath = "";
      setToast((hadDoc ? "脚本和说明" : "脚本") + "已移到回收站: " + item.name, "ok");
      refresh("\u5220\u9664\u811A\u672C");
      clearDetail();
    } catch (err) {
      setToast(friendlyError("\u5220\u9664\u5931\u8D25", err), "error");
    }
  }

  function runSelected() {
    if (state.running) {
      setToast("\u811A\u672C\u6B63\u5728\u8FD0\u884C\uFF0C\u8BF7\u7A0D\u7B49", "warn");
      return;
    }
    var item = findByPath(state.selectedPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }

    runScriptForItem(item, item.fullPath, item.fullPath);
  }

  function runScriptForItem(item, scriptPath, displayPath) {
    var startedAt = Date.now();
    state.runningPath = item.fullPath;
    setRunning(true);
    setToast("\u6B63\u5728\u8FD0\u884C: " + item.name, "running");
    renderListActiveOnly();
    appendConsole("\u25B6 \u8FD0\u884C " + item.name + "\n" + displayPath);
    var script = "HGScripts.runScript(" + jsxString(scriptPath) + ", " + jsxString(state.cppMode) + ")";
    cs.evalScript(script, function (result) {
      setRunning(false);
      state.runningPath = "";
      recordRun(item, result);
      var parsed = parseRunResult(result);
      parsed.elapsedMs = Date.now() - startedAt;
      if (displayPath && scriptPath !== displayPath && parsed.file && makeFileKey(parsed.file) === makeFileKey(scriptPath)) {
        parsed.file = displayPath;
      }
      if (displayPath && scriptPath !== displayPath && parsed.ok) {
        parsed.message = "\u5DF2\u6267\u884C " + item.name;
      }
      appendConsole(formatRunResult(parsed), true);
      if (parsed.ok) {
        clearEditorError();
        setToast(parsed.message, "ok");
      } else {
        state.latestErrorText = formatRunResultPlain(parsed);
        if (state.editorPath && makeFileKey(state.editorPath) === makeFileKey(item.fullPath)) {
          markEditorError(parseInt(parsed.line, 10), parsed.message);
        }
        setToast(parsed.message || "\u811A\u672C\u6267\u884C\u5931\u8D25", "error");
      }
      render();
      selectItem(item.fullPath);
    });
  }

  function runFromEditor() {
    if (state.running) {
      setToast("\u811A\u672C\u6B63\u5728\u8FD0\u884C\uFF0C\u8BF7\u7A0D\u7B49", "warn");
      return;
    }
    var item = findByPath(state.editorPath || state.selectedPath);
    if (!item || !state.editorPath) {
      setToast("请先打开一个脚本", "warn");
      return;
    }

    try {
      if (!state.editorDirty && state.editorPath && state.ace) {
        try {
          state.editorLoading = true;
          state.ace.setValue(fs.readFileSync(state.editorPath, "utf8"), -1);
        } finally {
          state.editorLoading = false;
        }
      }
      var tempPath = makeRuntimeScriptPath(item);
      fs.writeFileSync(tempPath, getEditorValue(), "utf8");
      runScriptForItem(item, tempPath, state.editorPath);
    } catch (err) {
      var message = friendlyError("\u4E34\u65F6\u8FD0\u884C\u5931\u8D25", err);
      appendConsole("ERROR: " + message);
      setToast(message, "error");
    }
  }

  function recordRun(item, result) {
    var stat = getRunStat(item.key);
    stat.name = item.name;
    stat.sourceName = item.sourceName;
    stat.count = (stat.count || 0) + 1;
    stat.lastRun = Date.now();
    stat.lastResult = String(result || "");
    state.runStats[item.key] = stat;
    setStoredValue(RUN_STATS_KEY, state.runStats);
  }

  function openCodeEditor(fullPath, force) {
    var item = findByPath(fullPath);
    if (!item) {
      setToast("找不到要编辑的脚本", "warn");
      return;
    }
    if (state.editorDirty && !force && state.editorPath && state.editorPath !== fullPath) {
      openSwitchModal(fullPath, null, "code");
      return;
    }

    try {
      state.editorLoading = true;
      state.editorPath = fullPath;
      state.editorDirty = false;
      if (!state.ace) {
        throw new Error("Ace editor is not ready.");
      }
      state.ace.setValue(fs.readFileSync(fullPath, "utf8"), -1);
      updateSavedScriptMetadata(fullPath, { render: false });
      item = findByPath(fullPath) || item;
      updateSelectedMeta(item, getRunText(item));
      clearEditorError();
      if (el.editorTitle) {
        el.editorTitle.textContent = item.name;
      }
      el.editorTitleInput.value = item.name;
      el.editorTitleInput.disabled = false;
      el.editorPath.textContent = fullPath;
      state.ace.setReadOnly(false);
      el.saveCodeBtn.disabled = false;
      el.runCodeBtn.disabled = false;
      el.saveRunCodeBtn.disabled = false;
      el.reloadCodeBtn.disabled = false;
      el.duplicateCodeBtn.disabled = false;
      el.codeEditor.classList.add("open");
      el.contentPanel.classList.add("editor-open");
      updateEditorState();
      appendConsole("\u5DF2\u6253\u5F00\u7F16\u8F91\u811A\u672C: " + item.name);
      setToast("\u5DF2\u6253\u5F00\u7F16\u8F91\u811A\u672C: " + item.name, "ok");
      setTimeout(function () {
        state.ace.resize(true);
        state.ace.focus();
        state.editorLoading = false;
      }, 0);
    } catch (err) {
      state.editorLoading = false;
      var readMessage = friendlyError("\u8BFB\u53D6\u811A\u672C\u5931\u8D25", err);
      setToast(readMessage, "error");
      appendConsole("ERROR: " + readMessage);
    }
  }

  function closeCodeEditor() {
    if (state.editorDirty && !window.confirm("当前代码尚未保存，确定关闭编辑器？")) {
      return;
    }
    state.editorPath = "";
    state.editorDirty = false;
    if (state.ace) {
      state.ace.setValue("", -1);
      state.ace.setReadOnly(true);
    }
    clearEditorError();
    el.saveCodeBtn.disabled = true;
    el.runCodeBtn.disabled = true;
    el.saveRunCodeBtn.disabled = true;
    el.reloadCodeBtn.disabled = true;
    el.duplicateCodeBtn.disabled = true;
    if (el.editorTitle) {
      el.editorTitle.textContent = "脚本编辑器";
    }
    el.editorTitleInput.value = "";
    el.editorTitleInput.disabled = true;
    el.editorPath.textContent = "";
    el.codeEditor.classList.remove("open");
    el.contentPanel.classList.remove("editor-open");
    updateEditorState();
  }

  function saveCodeEditor(callback) {
    if (!state.editorPath) {
      setToast("没有打开的脚本", "warn");
      if (callback) {
        callback(false);
      }
      return;
    }

    try {
      fs.writeFileSync(state.editorPath, getEditorValue(), "utf8");
      state.editorDirty = false;
      clearEditorError();
      updateEditorState();
      appendConsole("\u5DF2\u4FDD\u5B58: " + state.editorPath);
      setToast("代码已保存", "ok");
      updateSavedScriptMetadata(state.editorPath);
      selectItem(state.editorPath);
      if (callback) {
        callback(true);
      }
    } catch (err) {
      var saveMessage = friendlyError("\u4EE3\u7801\u4FDD\u5B58\u5931\u8D25", err);
      appendConsole("ERROR: " + saveMessage);
      setToast(saveMessage, "error");
      if (callback) {
        callback(false);
      }
    }
  }

  function updateSavedScriptMetadata(fullPath, options) {
    var item = findByPath(fullPath);
    if (!item) {
      return;
    }
    try {
      var stat = fs.statSync(fullPath);
      item.mtimeMs = stat.mtime.getTime();
      item.mtimeText = formatTime(stat.mtime);
      item.size = stat.size;
      saveCurrentState(buildSnapshotFromFiles(state.files));
      if (!options || options.render !== false) {
        render();
      }
      if (makeFileKey(state.selectedPath) === makeFileKey(fullPath)) {
        updateSelectedMeta(item, getRunText(item));
      }
    } catch (err) {}
  }

  function setRunning(isRunning) {
    state.running = !!isRunning;
    setButtonRunning(el.runBtn, isRunning);
    setButtonRunning(el.runCodeBtn, isRunning);
    setButtonRunning(el.saveRunCodeBtn, isRunning);
  }

  function normalizeCppMode(mode) {
    mode = String(mode || "auto").toLowerCase();
    return mode === "cpp" || mode === "jsx" ? mode : "auto";
  }

  function getCppModeLabel(mode) {
    if (mode === "cpp") return "仅 C++";
    if (mode === "jsx") return "强制 JSX";
    return "自动";
  }

  function getCppModeHint(mode) {
    if (mode === "cpp") return "仅C++, 更快, 失败后回退jsx";
    if (mode === "jsx") return "强制JSX, 不调用C++";
    return "自动, 优先C++更快, 失败后回退jsx";
  }

  function renderCppMode() {
    if (!el.cppModeSelect) {
      return;
    }
    var mode = normalizeCppMode(state.cppMode);
    el.cppModeSelect.value = mode;
    el.cppModeSelect.className = "cpp-mode-select mode-" + mode;
    el.cppModeSelect.title = "C++ / JSX 运行模式: " + getCppModeHint(mode);
  }

  function setButtonRunning(button, isRunning) {
    if (!button) {
      return;
    }
    if (isRunning) {
      if (!button.getAttribute("data-normal-text")) {
        button.setAttribute("data-normal-text", button.textContent);
      }
      button.textContent = "\u8FD0\u884C\u4E2D...";
      button.classList.add("running");
      button.disabled = true;
      return;
    }
    button.classList.remove("running");
    var normalText = button.getAttribute("data-normal-text");
    if (normalText) {
      button.textContent = normalText;
      button.removeAttribute("data-normal-text");
    }
    if (button === el.runBtn) {
      button.disabled = !state.selectedPath;
    } else {
      button.disabled = !state.editorPath;
    }
  }

  function makeRuntimeScriptPath(item) {
    ensureFolder(RUNTIME_FOLDER);
    var safeBase = sanitizeBaseName(item.base || "runtime") || "runtime";
    return path.join(RUNTIME_FOLDER, safeBase + "_current.jsx");
  }

  function updateEditorState() {
    if (!state.editorPath) {
      el.editorState.textContent = "未打开脚本";
      return;
    }
    el.editorState.textContent = state.editorDirty ? "未保存" : "已保存";
    el.editorState.className = state.editorDirty ? "dirty" : "";
  }

  function getEditorValue() {
    return state.ace ? state.ace.getValue() : "";
  }

  function clearEditorError() {
    if (!state.ace) {
      return;
    }
    state.ace.session.clearAnnotations();
    if (state.editorMarker !== null) {
      state.ace.session.removeMarker(state.editorMarker);
      state.editorMarker = null;
    }
  }

  function markEditorError(lineNumber, message) {
    if (!state.ace || !lineNumber || lineNumber < 1) {
      return;
    }
    clearEditorError();
    var row = Math.max(0, lineNumber - 1);
    state.ace.session.setAnnotations([{
      row: row,
      column: 0,
      text: message || "Script error",
      type: "error"
    }]);
    if (window.ace && window.ace.require) {
      var Range = window.ace.require("ace/range").Range;
      state.editorMarker = state.ace.session.addMarker(
        new Range(row, 0, row, 1),
        "ace-error-line",
        "fullLine"
      );
    }
  }

  function appendConsole(message, trustedHtml) {
    var time = formatTime(new Date());
    var entry = document.createElement("div");
    entry.className = "console-entry";
    var decoded = decodeText(message);
    entry.innerHTML = trustedHtml
      ? escapeHtml("[" + time + "] ") + decoded.replace(/\n/g, "<br>")
      : escapeHtml("[" + time + "] " + decoded).replace(/\n/g, "<br>");
    if (el.consoleOutput.textContent === "等待运行结果。" || el.consoleOutput.textContent === "控制台已清空。") {
      el.consoleOutput.innerHTML = "";
    }
    el.consoleOutput.insertBefore(entry, el.consoleOutput.firstChild);
  }

  function parseRunResult(result) {
    try {
      var parsed = JSON.parse(result || "{}");
      return {
        ok: !!parsed.ok,
        message: decodeText(parsed.message || ""),
        file: decodeText(parsed.file || ""),
        line: parsed.line || "",
        number: parsed.number || "",
        context: normalizeErrorContext(parsed.context),
        raw: result || ""
      };
    } catch (err) {
      var text = String(result || "");
      return {
        ok: text.indexOf("OK:") === 0,
        message: decodeText(text || "\u811A\u672C\u6267\u884C\u7ED3\u675F\uFF0C\u4F46\u6CA1\u6709\u8FD4\u56DE\u7ED3\u679C"),
        file: "",
        line: "",
        number: "",
        context: [],
        raw: text
      };
    }
  }

  function formatRunResult(result) {
    var lines = [];
    var title = result.ok ? "OK: " : "ERROR" + (result.number ? " " + escapeHtml(result.number) : "") + ": ";
    lines.push(title + escapeHtml(result.message));
    if (!result.ok) {
      var hint = getRunErrorHint(result);
      if (hint) {
        lines.push("\u63D0\u793A: " + escapeHtml(hint));
      }
    }
    if (result.file) {
      lines.push("\u6587\u4EF6: " + escapeHtml(result.file));
    }
    if (result.line) {
      lines.push("\u884C\u53F7: " + result.line);
    }
    if (result.context && result.context.length) {
      lines.push("<pre class=\"console-code\">" + formatErrorContext(result.context) + "</pre>");
    }
    if (result.line) {
      lines.push("<button class=\"console-line-link\" data-line=\"" + result.line + "\">\u8DF3\u5230\u7B2C " + result.line + " \u884C</button>");
    }
    if (result.number) {
      lines.push("\u9519\u8BEF\u7801: " + result.number);
    }
    if (typeof result.elapsedMs === "number") {
      lines.push("\u8017\u65F6: " + formatDuration(result.elapsedMs));
    }
    return lines.join("\n");
  }

  function formatRunResultPlain(result) {
    var lines = [];
    var title = result.ok ? "OK: " : "ERROR" + (result.number ? " " + result.number : "") + ": ";
    lines.push(title + result.message);
    if (!result.ok) {
      var hint = getRunErrorHint(result);
      if (hint) {
        lines.push("\u63D0\u793A: " + hint);
      }
    }
    if (result.file) {
      lines.push("\u6587\u4EF6: " + result.file);
    }
    if (result.line) {
      lines.push("\u884C\u53F7: " + result.line);
    }
    if (result.context && result.context.length) {
      lines.push("");
      lines.push(formatErrorContextPlain(result.context));
    }
    if (result.number) {
      lines.push("\u9519\u8BEF\u7801: " + result.number);
    }
    if (typeof result.elapsedMs === "number") {
      lines.push("\u8017\u65F6: " + formatDuration(result.elapsedMs));
    }
    return lines.join("\n");
  }

  function getRunErrorHint(result) {
    var message = String(result.message || "");
    var number = String(result.number || "");
    if (number === "25" || /\u5E94\u4E3A|Expected|SyntaxError/i.test(message)) {
      return "这是语法错误，优先检查标出的行附近是否少了括号、引号、分号，或函数名被写断。";
    }
    if (/undefined|is not defined/i.test(message)) {
      return "有变量或函数未定义，检查名称拼写、作用域，或相关函数是否在运行前声明。";
    }
    if (/No such file|not found|does not exist/i.test(message)) {
      return "脚本引用的文件或目录不存在，检查路径、文件名和磁盘是否可访问。";
    }
    if (/permission|access|denied/i.test(message)) {
      return "当前路径可能没有读写权限，可以换到普通工作目录后重试。";
    }
    return result.line ? "查看行号和上下文，通常问题就在标出的行或上一两行。" : "";
  }

  function normalizeErrorContext(context) {
    var rows = [];
    if (!context || !context.length) {
      return rows;
    }
    for (var i = 0; i < context.length; i++) {
      rows.push({
        line: parseInt(context[i].line, 10) || "",
        text: decodeText(context[i].text || ""),
        error: !!context[i].error
      });
    }
    return rows;
  }

  function formatErrorContext(context) {
    var width = 1;
    for (var i = 0; i < context.length; i++) {
      width = Math.max(width, String(context[i].line).length);
    }
    var rows = [];
    for (var j = 0; j < context.length; j++) {
      var mark = context[j].error ? "> " : "  ";
      rows.push("<span class=\"console-code-line\" data-line=\"" + context[j].line + "\">" +
        mark + padLeft(context[j].line, width) + " | " + escapeHtml(context[j].text) + "</span>");
    }
    return rows.join("\n");
  }

  function formatErrorContextPlain(context) {
    var width = 1;
    for (var i = 0; i < context.length; i++) {
      width = Math.max(width, String(context[i].line).length);
    }
    var rows = [];
    for (var j = 0; j < context.length; j++) {
      var mark = context[j].error ? "> " : "  ";
      rows.push(mark + padLeft(context[j].line, width) + " | " + context[j].text);
    }
    return rows.join("\n");
  }

  function padLeft(value, width) {
    var text = String(value || "");
    while (text.length < width) {
      text = " " + text;
    }
    return text;
  }

  function copyConsole() {
    var text = el.consoleOutput.innerText || el.consoleOutput.textContent || "";
    copyTextToClipboard(text, "\u63A7\u5236\u53F0\u5185\u5BB9\u5DF2\u590D\u5236", "\u63A7\u5236\u53F0\u6CA1\u6709\u53EF\u590D\u5236\u5185\u5BB9");
  }

  function copyLatestError() {
    copyTextToClipboard(state.latestErrorText, "\u6700\u65B0\u62A5\u9519\u5DF2\u590D\u5236", "\u5F53\u524D\u6CA1\u6709\u53EF\u590D\u5236\u7684\u62A5\u9519");
  }

  function copyTextToClipboard(text, okMessage, emptyMessage) {
    if (!text.trim()) {
      setToast(emptyMessage, "warn");
      return;
    }

    if (copyTextWithTextarea(text)) {
      setToast(okMessage, "ok");
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setToast(okMessage, "ok");
      }).catch(function () {
        setToast("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u5185\u5BB9\u590D\u5236", "error");
      });
      return;
    }

    setToast("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u5185\u5BB9\u590D\u5236", "error");
  }

  function copyTextWithTextarea(text) {
    var temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "readonly");
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    temp.style.top = "0";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(temp);
    return ok;
  }

  function decodeText(value) {
    var text = String(value || "");
    try {
      return decodeURIComponent(text);
    } catch (err) {
      try {
        return decodeURI(text);
      } catch (errUri) {
        return text;
      }
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function insertAtCursor(input, text) {
    var start = input.selectionStart;
    var end = input.selectionEnd;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
  }

  function jumpToLine(lineNumber) {
    if (!lineNumber || lineNumber < 1 || !state.editorPath) {
      return;
    }
    if (state.ace) {
      state.ace.gotoLine(lineNumber, 0, true);
      state.ace.focus();
    }
  }

  function applyConsoleHeight() {
    var height = parseInt(getStoredValue(CONSOLE_HEIGHT_KEY, "0"), 10);
    if (height) {
      setConsoleHeight(height);
    }
  }

  function bindConsoleResizer() {
    var dragging = false;
    var startY = 0;
    var startHeight = 0;

    el.consoleResizer.addEventListener("mousedown", function (event) {
      dragging = true;
      startY = event.clientY;
      startHeight = el.consoleOutput.parentNode.offsetHeight || 160;
      document.body.classList.add("resizing-console");
      event.preventDefault();
    });

    document.addEventListener("mousemove", function (event) {
      if (!dragging) {
        return;
      }
      var nextHeight = startHeight - (event.clientY - startY);
      setConsoleHeight(nextHeight);
    });

    document.addEventListener("mouseup", function () {
      if (!dragging) {
        return;
      }
      dragging = false;
      document.body.classList.remove("resizing-console");
      setStoredValue(CONSOLE_HEIGHT_KEY, String(el.consoleOutput.parentNode.offsetHeight || 160));
    });
  }

  function setConsoleHeight(height) {
    var editorHeight = el.codeEditor.offsetHeight || 600;
    var minHeight = 80;
    var maxHeight = Math.max(minHeight, editorHeight - 220);
    var next = Math.max(minHeight, Math.min(maxHeight, height));
    el.codeEditor.style.gridTemplateRows = "auto auto minmax(160px, 1fr) 7px " + next + "px";
  }

  function startWatchers() {
    closeWatchers();
    if (!AUTO_REFRESH_ENABLED) {
      el.watchLabel.textContent = "自动刷新已暂停";
      return;
    }
    var activeCount = 0;
    var watchedCount = 0;

    for (var i = 0; i < state.sources.length; i++) {
      var source = state.sources[i];
      if (source.enabled === false || !fs.existsSync(source.folder)) {
        continue;
      }
      activeCount++;
      try {
        state.watchers.push(fs.watch(source.folder, { persistent: true }, function () {
          debounceRefresh("\u68C0\u6D4B\u5230\u5916\u90E8\u4FEE\u6539");
        }));
        watchedCount++;
      } catch (errWatch) {}
    }

    if (!activeCount) {
      el.watchLabel.textContent = "监听未启动";
    } else if (watchedCount === activeCount) {
      el.watchLabel.textContent = "自动监听中";
    } else {
      el.watchLabel.textContent = "部分目录监听受限，使用轮询";
    }
  }

  function closeWatchers() {
    for (var i = 0; i < state.watchers.length; i++) {
      try {
        state.watchers[i].close();
      } catch (err) {}
    }
    state.watchers = [];
  }

  function startPolling() {
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
    }
    if (!AUTO_REFRESH_ENABLED) {
      state.refreshTimer = null;
      return;
    }

    state.refreshTimer = setInterval(function () {
      var previous = loadPreviousState();
      var result = scanSources();
      if (result.signature !== state.lastSignature) {
        state.files = result.files;
        state.lastSignature = result.signature;
        saveCurrentState(result.snapshot);
        render();
        updateChangeStatus(previous, result.snapshot, "\u8F6E\u8BE2\u5237\u65B0");
      }
    }, REFRESH_INTERVAL_MS);
  }

  function debounceRefresh(reason) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(function () {
      refresh(reason);
    }, 250);
  }

  function updateChangeStatus(previous, current, reason) {
    var added = 0;
    var changed = 0;
    var removed = 0;
    var key;

    for (key in current) {
      if (!previous[key]) {
        added++;
      } else if (previous[key].mtimeMs !== current[key].mtimeMs || previous[key].size !== current[key].size) {
        changed++;
      }
    }

    for (key in previous) {
      if (!current[key]) {
        removed++;
      }
    }

    if (added || changed || removed) {
      setToast(reason + ": \u65B0\u589E " + added + "\uFF0C\u4FEE\u6539 " + changed + "\uFF0C\u5220\u9664 " + removed, "ok");
    } else {
      setToast(reason + ": 已是最新", "");
    }
  }

  function getActiveSource() {
    return state.activeSourceId === "all" || state.activeSourceId === "favorites" ? null : findSource(state.activeSourceId);
  }

  function getDefaultSource() {
    for (var i = 0; i < state.sources.length; i++) {
      if (state.sources[i].name === "\u9ED8\u8BA4\u811A\u672C") {
        return state.sources[i];
      }
    }
    return null;
  }

  function findSource(id) {
    for (var i = 0; i < state.sources.length; i++) {
      if (state.sources[i].id === id) {
        return state.sources[i];
      }
    }
    return null;
  }

  function findByPath(fullPath) {
    for (var i = 0; i < state.files.length; i++) {
      if (state.files[i].fullPath === fullPath) {
        return state.files[i];
      }
    }
    return null;
  }

  function moveMetadata(oldKey, newKey, name, sourceName) {
    if (state.favorites[oldKey]) {
      state.favorites[newKey] = {
        name: name,
        sourceName: sourceName,
        time: state.favorites[oldKey].time || Date.now()
      };
      delete state.favorites[oldKey];
      setStoredValue(FAVORITES_KEY, state.favorites);
    }
    if (state.runStats[oldKey]) {
      state.runStats[newKey] = state.runStats[oldKey];
      state.runStats[newKey].name = name;
      state.runStats[newKey].sourceName = sourceName;
      delete state.runStats[oldKey];
      setStoredValue(RUN_STATS_KEY, state.runStats);
    }
  }

  function getRunStat(key) {
    return state.runStats[key] || { count: 0, lastRun: 0, lastResult: "" };
  }

  function getDefaultDocTemplate(item) {
    return "## \u7528\u9014\n\n\n## \u4F7F\u7528\u6D41\u7A0B\n1. \n2. \n3. \n\n## \u6CE8\u610F\u4E8B\u9879\n- ";
  }

  function loadScriptIcons() {
    try {
      if (!fs.existsSync(SCRIPT_ICONS_PATH)) {
        return {};
      }
      var icons = JSON.parse(fs.readFileSync(SCRIPT_ICONS_PATH, "utf8"));
      return icons && typeof icons === "object" ? icons : {};
    } catch (err) {
      return {};
    }
  }

  function getScriptIconSrc(item) {
    var icons = state.scriptIcons || {};
    var iconConfig = icons[item.name] || icons[item.base] || icons[item.ext] || "";
    var defaultIcon = DEFAULT_SCRIPT_ICON;
    var iconName = "";

    if (iconConfig && typeof iconConfig === "object") {
      defaultIcon = resolveIconPath(iconConfig.default || "script.svg");
      iconName = iconConfig.icon || "";
    } else {
      iconName = iconConfig;
    }

    if (!iconName) {
      return defaultIcon;
    }

    var resolvedIcon = resolveIconPath(iconName);
    if (iconFileExists(resolvedIcon)) {
      return resolvedIcon;
    }
    return defaultIcon;
  }

  function renderLegacyInlineScriptIcon(imgEl) {
    var wrap = imgEl && imgEl.parentNode ? imgEl.parentNode : null;
    if (!wrap) {
      return;
    }
    imgEl.style.display = "none";
    var existing = wrap.querySelector(".script-icon-inline");
    if (existing) {
      return;
    }
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "script-icon-inline");
    svg.setAttribute("width", "17");
    svg.setAttribute("height", "17");
    svg.setAttribute("viewBox", "0 0 17 17");
    svg.setAttribute("aria-hidden", "true");

    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "1");
    rect.setAttribute("y", "1");
    rect.setAttribute("width", "15");
    rect.setAttribute("height", "15");
    rect.setAttribute("rx", "2");
    rect.setAttribute("fill", "#17c46b");

    var mark = document.createElementNS("http://www.w3.org/2000/svg", "path");
    mark.setAttribute("d", "M6.25 5.4 4.15 8.5l2.1 3.1M10.75 5.4l2.1 3.1-2.1 3.1M9.45 4.45 7.55 12.55");
    mark.setAttribute("fill", "none");
    mark.setAttribute("stroke", "#0e5638");
    mark.setAttribute("stroke-width", "1.35");
    mark.setAttribute("stroke-linecap", "round");
    mark.setAttribute("stroke-linejoin", "round");

    svg.appendChild(rect);
    svg.appendChild(mark);
    wrap.insertBefore(svg, imgEl);
  }

  function getScriptIconConfig(item) {
    var icons = state.scriptIcons || {};
    return icons[item.name] || icons[item.base] || icons[item.ext] || "";
  }

  function readScriptMeta(fullPath) {
    var meta = { badges: [], cppPlugins: [], cppCommands: [] };
    try {
      var text = fs.readFileSync(fullPath, "utf8");
      var lines = text.split(/\r?\n/).slice(0, 40);
      for (var i = 0; i < lines.length; i++) {
        var badgeMatch = lines[i].match(/^\s*\/\/\s*hgscripts-badge:\s*([A-Za-z0-9_-]+)\s*$/);
        if (badgeMatch && meta.badges.indexOf(badgeMatch[1]) < 0) {
          meta.badges.push(badgeMatch[1]);
        }
        var pluginMatch = lines[i].match(/^\s*\/\/\s*hgscripts-cpp-plugin:\s*([A-Za-z0-9_.-]+)\s*$/);
        if (pluginMatch) {
          var pluginName = normalizeCppPluginName(pluginMatch[1]);
          if (pluginName && meta.cppPlugins.indexOf(pluginName) < 0) {
            meta.cppPlugins.push(pluginName);
          }
        }
        var commandMatch = lines[i].match(/^\s*\/\/\s*hgscripts-cpp-command:\s*([A-Za-z0-9_.-]+)\s*$/);
        if (commandMatch && meta.cppCommands.indexOf(commandMatch[1]) < 0) {
          meta.cppCommands.push(commandMatch[1]);
        }
      }
    } catch (err) {
    }
    return meta;
  }

  function hasScriptBadge(item, badge) {
    return !!(item && item.badges && item.badges.indexOf(badge) >= 0);
  }

  function shouldShowScriptBoostBadge(item) {
    if (!hasScriptBadge(item, "cpp")) {
      return false;
    }
    if (normalizeCppMode(state.cppMode) === "jsx") {
      return false;
    }
    if (typeof process === "undefined" || process.platform !== "win32") {
      return false;
    }
    return hasAvailableCppPlugin(item);
  }

  function getCppBoostBadgeTitle() {
    var mode = normalizeCppMode(state.cppMode);
    var availableText = "已检测到 Illustrator 加速插件";
    if (mode === "cpp") {
      return "C++模式: " + availableText + ", 失败后回退jsx";
    }
    if (mode === "jsx") {
      return "强制JSX: 当前不调用C++";
    }
    return "自动模式: " + availableText + ", 失败后回退jsx";
  }

  function hasAvailableCppPlugin(item) {
    if (!item || !item.cppPlugins || !item.cppPlugins.length) {
      return false;
    }
    for (var i = 0; i < item.cppPlugins.length; i++) {
      if (isCppPluginInstalled(item.cppPlugins[i])) {
        return true;
      }
    }
    return false;
  }

  function normalizeCppPluginName(value) {
    var name = String(value || "").trim();
    if (!name) {
      return "";
    }
    return /\.aip$/i.test(name) ? name : name + ".aip";
  }

  function isDevExtensionRoot() {
    return false;
  }

  function getDevCppPluginRoots() {
    return [];
  }
  function isCppPluginInstalled(pluginName) {
    pluginName = normalizeCppPluginName(pluginName);
    if (!pluginName || typeof process === "undefined" || process.platform !== "win32") {
      return false;
    }
    var found = false;
    try {
      var roots = [];
      if (process.env.ProgramFiles) {
        roots.push(path.join(process.env.ProgramFiles, "Adobe"));
      }
      if (process.env["ProgramFiles(x86)"]) {
        roots.push(path.join(process.env["ProgramFiles(x86)"], "Adobe"));
      }
      for (var i = 0; i < roots.length && !found; i++) {
        var adobeRoot = roots[i];
        if (!fs.existsSync(adobeRoot)) {
          continue;
        }
        var apps = fs.readdirSync(adobeRoot);
        for (var j = 0; j < apps.length && !found; j++) {
          if (!/^Adobe Illustrator /i.test(apps[j])) {
            continue;
          }
          if (HOST_PROFILE.year && apps[j].indexOf(HOST_PROFILE.year) < 0) {
            continue;
          }
          var plugIns = path.join(adobeRoot, apps[j], "Plug-ins");
          found = fs.existsSync(path.join(plugIns, "HGScripts", pluginName));
        }
      }
    } catch (err) {
      found = false;
    }
    return found;
  }

  function resolveIconPath(iconName) {
    iconName = String(iconName || "").replace(/\\/g, "/");
    if (/^(file|https?):\/\//i.test(iconName)) {
      return iconName;
    }
    if (iconName.indexOf("/") >= 0) {
      return iconName;
    }
    return "assets/icons/" + iconName;
  }

  function iconFileExists(iconSrc) {
    if (/^https?:\/\//i.test(iconSrc)) {
      return true;
    }
    if (/^file:\/\//i.test(iconSrc)) {
      return fs.existsSync(iconSrc.replace(/^file:\/\//i, ""));
    }
    try {
      return fs.existsSync(path.join(EXTENSION_ROOT, iconSrc));
    } catch (err) {
      return false;
    }
  }

  function loadPreviousState() {
    return loadJson(STATE_KEY, {});
  }

  function saveCurrentState(snapshot) {
    setStoredValue(STATE_KEY, snapshot || {}, true);
  }

  function loadJson(key, fallback) {
    try {
      var value = getStoredValue(key, null, key === STATE_KEY);
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function getStoredValue(key, fallback, sessionOnly) {
    if (sessionOnly) {
      var sessionRaw = sessionStorage.getItem(key);
      return sessionRaw !== null && sessionRaw !== undefined ? sessionRaw : fallback;
    }
    if (!sessionOnly && settings.storage && settings.storage.hasOwnProperty(key)) {
      return settings.storage[key];
    }
    return fallback;
  }

  function setStoredValue(key, value, sessionOnly) {
    var serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (sessionOnly) {
      sessionStorage.setItem(key, serialized);
      return;
    }
    settings.storage = settings.storage || {};
    settings.storage[key] = serialized;
    saveSettings();
  }

  function loadSettings() {
    var next = cloneSettings(DEFAULT_SETTINGS);
    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        var saved = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
        mergeSettings(next, saved);
      }
    } catch (err) {}
    next.scanDepth = clampNumber(parseInt(next.scanDepth, 10), 0, 10, DEFAULT_SETTINGS.scanDepth);
    next.ignoredDirs = parseIgnoredDirs((next.ignoredDirs || DEFAULT_SETTINGS.ignoredDirs).join(","));
    next.languageMode = normalizeLanguageMode(next.languageMode);
    next.storage = next.storage || {};
    return next;
  }

  function detectHostLanguage() {
    try {
      var host = cs.getHostEnvironment ? cs.getHostEnvironment() : cs.hostEnvironment;
      var raw = String((host && (host.appUILocale || host.appLocale)) || navigator.language || "");
      return /^zh/i.test(raw) ? "zh-CN" : "en-US";
    } catch (err) {
      return /^zh/i.test(String(navigator.language || "")) ? "zh-CN" : "en-US";
    }
  }

  function detectHostProfile() {
    var appName = "";
    var appId = "";
    var appVersion = "";
    try {
      var host = cs.getHostEnvironment ? cs.getHostEnvironment() : cs.hostEnvironment;
      appName = String((host && host.appName) || "");
      appId = String((host && host.appId) || "");
      appVersion = String((host && host.appVersion) || "");
    } catch (err) {}
    var raw = (appName + " " + appId).toLowerCase();
    var versionMajor = parseInt((appVersion.match(/^(\d+)/) || [])[1], 10);
    var illustratorYear = "";
    if (versionMajor >= 27 && versionMajor <= 30) {
      illustratorYear = String(1996 + versionMajor);
    }
    if (raw.indexOf("photoshop") >= 0 || raw.indexOf("phxs") >= 0 || raw.indexOf("phsp") >= 0) {
      return {
        key: "photoshop",
        folder: "photoshop",
        label: "Photoshop",
        shortLabel: "Ps",
        version: appVersion,
        year: ""
      };
    }
    if (raw.indexOf("indesign") >= 0 || raw.indexOf("idsn") >= 0) {
      return {
        key: "indesign",
        folder: "indesign",
        label: "InDesign",
        shortLabel: "Id",
        version: appVersion,
        year: ""
      };
    }
    return {
      key: "illustrator",
      folder: "illustrator",
      label: "Illustrator",
      shortLabel: "Ai",
      version: appVersion,
      year: illustratorYear
    };
  }

  function normalizeLanguageMode(value) {
    value = String(value || "auto");
    if (value === "zh-CN" || value === "en-US" || value === "auto") {
      return value;
    }
    return "auto";
  }

  function resolveEffectiveLanguage(mode, detected) {
    mode = normalizeLanguageMode(mode);
    if (mode === "auto") {
      return detected === "zh-CN" ? "zh-CN" : "en-US";
    }
    return mode;
  }

  function saveSettings() {
    try {
      ensureFolder(path.dirname(SETTINGS_PATH));
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
    } catch (err) {
      setToast("\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25: " + err.message, "error");
    }
  }

  function migrateSettingsStorage() {
    settings.storage = settings.storage || {};
    var changed = false;

    if (HOST_PROFILE.key === "illustrator") {
      changed = migrateLegacyHostStorage() || changed;
    }

    if (settings.storage.hasOwnProperty(LEGACY_FOLDER_KEY)) {
      delete settings.storage[LEGACY_FOLDER_KEY];
      changed = true;
    }

    changed = migrateStoredSources() || changed;
    changed = migrateStoredRecentSources() || changed;
    changed = migrateStoredRunStats() || changed;
    clearLegacyLocalStorage();

    if (changed) {
      saveSettings();
    }
  }

  function migrateLegacyHostStorage() {
    var changed = false;
    var pairs = [
      [LEGACY_SOURCES_KEY, SOURCES_KEY],
      [LEGACY_ACTIVE_SOURCE_KEY, ACTIVE_SOURCE_KEY],
      [LEGACY_FAVORITES_KEY, FAVORITES_KEY],
      [LEGACY_RUN_STATS_KEY, RUN_STATS_KEY],
      [LEGACY_RECENT_SOURCES_KEY, RECENT_SOURCES_KEY],
      [LEGACY_CONSOLE_HEIGHT_KEY, CONSOLE_HEIGHT_KEY],
      [LEGACY_PANEL_SIZES_KEY, PANEL_SIZES_KEY]
    ];
    for (var i = 0; i < pairs.length; i++) {
      if (!settings.storage.hasOwnProperty(pairs[i][1]) && settings.storage.hasOwnProperty(pairs[i][0])) {
        settings.storage[pairs[i][1]] = settings.storage[pairs[i][0]];
        changed = true;
      }
    }
    return changed;
  }

  function migrateStoredSources() {
    var raw = settings.storage[SOURCES_KEY];
    var sources = [];
    var changed = false;

    if (raw) {
      try {
        sources = JSON.parse(raw) || [];
      } catch (err) {
        sources = [];
        changed = true;
      }
    }

    if (!sources.length) {
      sources = [{
        id: makeId(),
        name: "\u9ED8\u8BA4\u811A\u672C",
        folder: DEFAULT_FOLDER,
        enabled: true
      }];
      changed = true;
    }

    var normalized = normalizeSources(sources);
    if (JSON.stringify(sources) !== JSON.stringify(normalized)) {
      changed = true;
    }
    settings.storage[SOURCES_KEY] = JSON.stringify(normalized);
    return changed;
  }

  function migrateStoredRecentSources() {
    var raw = settings.storage[RECENT_SOURCES_KEY];
    if (!raw) {
      return false;
    }
    try {
      var list = JSON.parse(raw) || [];
      var next = [];
      var changed = false;
      for (var i = 0; i < list.length; i++) {
        var item = normalizeFsPath(list[i] || "");
        if (!item || samePath(item, EXTERNAL_DEFAULT_FOLDER) || isUnderPath(item, EXTERNAL_DATA_FOLDER)) {
          changed = true;
          continue;
        }
        next.push(item);
      }
      if (changed || JSON.stringify(list) !== JSON.stringify(next)) {
        settings.storage[RECENT_SOURCES_KEY] = JSON.stringify(next);
        return true;
      }
    } catch (err) {
      settings.storage[RECENT_SOURCES_KEY] = "[]";
      return true;
    }
    return false;
  }

  function migrateStoredRunStats() {
    var raw = settings.storage[RUN_STATS_KEY];
    if (!raw) {
      return false;
    }
    try {
      var stats = JSON.parse(raw) || {};
      var next = {};
      var changed = false;
      for (var key in stats) {
        if (!stats.hasOwnProperty(key)) {
          continue;
        }
        if (isExternalManagedPath(key) || String(stats[key].lastResult || "").indexOf(EXTERNAL_DATA_FOLDER) !== -1) {
          changed = true;
          continue;
        }
        next[key] = stats[key];
      }
      if (changed) {
        settings.storage[RUN_STATS_KEY] = JSON.stringify(next);
        return true;
      }
    } catch (err) {
      settings.storage[RUN_STATS_KEY] = "{}";
      return true;
    }
    return false;
  }

  function clearLegacyLocalStorage() {
    var keys = [
      LEGACY_FOLDER_KEY,
      LEGACY_SOURCES_KEY,
      LEGACY_ACTIVE_SOURCE_KEY,
      LEGACY_FAVORITES_KEY,
      LEGACY_RUN_STATS_KEY,
      LEGACY_RECENT_SOURCES_KEY,
      LEGACY_CONSOLE_HEIGHT_KEY,
      LEGACY_PANEL_SIZES_KEY,
      SOURCES_KEY,
      ACTIVE_SOURCE_KEY,
      FAVORITES_KEY,
      RUN_STATS_KEY,
      RECENT_SOURCES_KEY,
      CONSOLE_HEIGHT_KEY,
      PANEL_SIZES_KEY
    ];
    try {
      for (var i = 0; i < keys.length; i++) {
        localStorage.removeItem(keys[i]);
      }
    } catch (err) {}
  }

  function cloneSettings(source) {
    return JSON.parse(JSON.stringify(source));
  }

  function mergeSettings(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }

  function parseIgnoredDirs(value) {
    var raw = Array.isArray(value) ? value : String(value || "").split(",");
    var result = [];
    for (var i = 0; i < raw.length; i++) {
      var item = String(raw[i] || "").trim();
      if (item) {
        result.push(item);
      }
    }
    return result.length ? result : DEFAULT_SETTINGS.ignoredDirs.slice();
  }

  function clampNumber(value, min, max, fallback) {
    if (isNaN(value)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, value));
  }

  function openExternal(filePath) {
    childProcess.execFile("cmd.exe", ["/c", "start", "", filePath], { windowsHide: true });
  }

  function openFolder(folderPath) {
    var normalized = normalizeFsPath(folderPath);
    if (!normalized) {
      setToast("文件夹路径为空", "warn");
      return;
    }
    if (!fs.existsSync(normalized)) {
      setToast("\u6587\u4EF6\u5939\u4E0D\u5B58\u5728: " + normalized, "warn");
      return;
    }
    childProcess.execFile("cmd.exe", ["/c", "start", "", normalized], { windowsHide: true }, function (err) {
      if (err) {
        setToast(friendlyError("打开文件夹失败", err), "error");
      }
    });
  }

  function openCurrentScriptFolder() {
    var scriptPath = state.editorPath || state.selectedPath;
    var item = findByPath(scriptPath);
    if (!item) {
      setToast("请先选择一个脚本", "warn");
      return;
    }
    openFolder(item.scriptFolder || path.dirname(item.fullPath));
  }

  function openCurrentDocumentFolder() {
    cs.evalScript("HGScripts.getActiveDocumentFolder()", function (resultPath) {
      var folderPath = normalizeFsPath(decodeText(resultPath || ""));
      if (!folderPath || folderPath.indexOf("ERROR:") === 0) {
        setToast(folderPath || "\u5F53\u524D\u6587\u6863\u6CA1\u6709\u53EF\u7528\u76EE\u5F55", "warn");
        return;
      }
      openFolder(folderPath);
    });
  }

  function getDialogStartPath() {
    var startPath = normalizeInputPath(el.folderInput.value) || DEFAULT_FOLDER;
    try {
      if (fs.existsSync(startPath) && fs.statSync(startPath).isFile()) {
        return path.dirname(startPath);
      }
    } catch (err) {}
    return startPath;
  }

  function openWindowsFileDialog(startPath, title, filter) {
    var script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "[System.Windows.Forms.Application]::EnableVisualStyles()",
      "[Console]::OutputEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false",
      "$dlg = New-Object System.Windows.Forms.OpenFileDialog",
      "$dlg.Title = " + psString(title),
      "$dlg.Filter = " + psString(filter),
      "$dlg.Multiselect = $false",
      setPowerShellInitialDirectory(startPath),
      "if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Write($dlg.FileName) }"
    ].join("\n");
    return runPowerShellDialog(script);
  }

  function openWindowsFolderDialog(startPath, title) {
    var script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "[System.Windows.Forms.Application]::EnableVisualStyles()",
      "[Console]::OutputEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false",
      "$dlg = New-Object System.Windows.Forms.OpenFileDialog",
      "$dlg.Title = " + psString(title),
      "$dlg.CheckFileExists = $false",
      "$dlg.ValidateNames = $false",
      "$dlg.FileName = " + psString("\u9009\u62E9\u6B64\u6587\u4EF6\u5939"),
      "$dlg.Filter = " + psString("\u6587\u4EF6\u5939|*.folder"),
      setPowerShellInitialDirectory(startPath),
      "if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Write([System.IO.Path]::GetDirectoryName($dlg.FileName)) }"
    ].join("\n");
    return runPowerShellDialog(script);
  }

  function setPowerShellInitialDirectory(startPath) {
    return [
      "$start = " + psString(startPath || DEFAULT_FOLDER),
      "if ([System.IO.Directory]::Exists($start)) {",
      "  $dlg.InitialDirectory = $start",
      "} elseif ([System.IO.File]::Exists($start)) {",
      "  $dlg.InitialDirectory = [System.IO.Path]::GetDirectoryName($start)",
      "} elseif ([System.IO.Directory]::Exists(" + psString(DEFAULT_FOLDER) + ")) {",
      "  $dlg.InitialDirectory = " + psString(DEFAULT_FOLDER),
      "}"
    ].join("\n");
  }

  function runPowerShellDialog(script) {
    var result = childProcess.execFileSync("powershell.exe", [
      "-NoProfile",
      "-STA",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script
    ], {
      encoding: "utf8",
      windowsHide: true
    });
    return normalizeInputPath(result);
  }

  function compareByMtimeDesc(a, b) {
    return b.mtimeMs - a.mtimeMs || a.name.localeCompare(b.name, "zh-Hans-CN");
  }

  function compareByInitial(a, b) {
    var collator = getPinyinCollator();
    var result = collator
      ? collator.compare(getSortName(a), getSortName(b))
      : getSortName(a).localeCompare(getSortName(b), "zh-Hans-CN");
    return result || compareByMtimeDesc(a, b);
  }

  function getPinyinCollator() {
    if (typeof Intl === "undefined" || !Intl.Collator) {
      return null;
    }
    try {
      return new Intl.Collator("zh-Hans-CN-u-co-pinyin", {
        numeric: true,
        sensitivity: "base"
      });
    } catch (err) {
      return new Intl.Collator("zh-Hans-CN", {
        numeric: true,
        sensitivity: "base"
      });
    }
  }

  function getSortName(item) {
    return (item.base || item.name || "").replace(/^\s+/, "");
  }

  function normalizeInputPath(value) {
    return (value || "").trim().replace(/^"|"$/g, "");
  }

  function normalizeFsPath(value) {
    var normalized = normalizeInputPath(value);
    var isWindows = typeof process !== "undefined" && process.platform === "win32";
    if (isWindows) {
      normalized = normalized.replace(/\//g, "\\");
      var match = normalized.match(/^\\([a-zA-Z]):\\(.*)$/);
      if (match) {
        normalized = match[1].toUpperCase() + ":\\" + match[2];
      }
      match = normalized.match(/^\\([a-zA-Z])\\(.*)$/);
      if (match) {
        normalized = match[1].toUpperCase() + ":\\" + match[2];
      }
      return normalized;
    }
    return normalized.replace(/\\/g, "/");
  }

  function getExtensionRoot() {
    try {
      if (typeof SystemPath !== "undefined" && cs && cs.getSystemPath) {
        var extensionPath = normalizeFsPath(cs.getSystemPath(SystemPath.EXTENSION));
        if (extensionPath) {
          return path.resolve(extensionPath);
        }
      }
    } catch (err) {}
    return path.resolve(__dirname, "..", "..");
  }

  function samePath(a, b) {
    return makeFileKey(normalizeFsPath(a || "")) === makeFileKey(normalizeFsPath(b || ""));
  }

  function isUnderPath(child, parent) {
    var childKey = makeFileKey(normalizeFsPath(child || ""));
    var parentKey = makeFileKey(normalizeFsPath(parent || ""));
    return childKey === parentKey || childKey.indexOf(parentKey + path.sep) === 0;
  }

  function isExternalManagedPath(value) {
    return isUnderPath(value, EXTERNAL_DEFAULT_FOLDER) || isUnderPath(value, EXTERNAL_DATA_FOLDER);
  }

  function inferSourceName(folder) {
    var normalized = normalizeInputPath(folder);
    return path.basename(normalized) || "\u811A\u672C\u76EE\u5F55";
  }

  function sanitizeBaseName(value) {
    return (value || "").trim().replace(/\.(jsx|js)$/i, "").replace(/[\\/:*?"<>|]/g, "");
  }

  function sanitizeScriptFileName(value, fallbackExt) {
    var raw = (value || "").trim().replace(/[\\/:*?"<>|]/g, "");
    var ext = path.extname(raw).toLowerCase();
    if (!SCRIPT_EXTENSIONS[ext]) {
      ext = SCRIPT_EXTENSIONS[fallbackExt] ? fallbackExt : ".jsx";
      raw = raw.replace(/\.[^.]*$/, "");
    } else {
      raw = raw.slice(0, raw.length - ext.length);
    }
    var base = sanitizeBaseName(raw);
    return {
      base: base,
      ext: ext,
      name: base ? base + ext : ""
    };
  }

  function makeFileKey(filePath) {
    return path.normalize(filePath).toLowerCase();
  }

  function makeId() {
    return "src_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  }

  function jsxString(value) {
    return JSON.stringify(String(value)).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }

  function psString(value) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  function formatTime(date) {
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    return date.getFullYear() + "-" +
      pad(date.getMonth() + 1) + "-" +
      pad(date.getDate()) + " " +
      pad(date.getHours()) + ":" +
      pad(date.getMinutes());
  }

  function formatDuration(ms) {
    if (ms < 1000) {
      return ms + " ms";
    }
    return Math.round(ms / 100) / 10 + " 秒";
  }

  function formatSize(bytes) {
    if (bytes < 1024) {
      return bytes + " B";
    }
    return Math.round(bytes / 102.4) / 10 + " KB";
  }

  function setToast(message, level) {
    el.toast.textContent = message;
    el.toast.className = "toast" + (level ? " " + level : "");
  }

  function friendlyError(prefix, err) {
    var code = err && err.code ? String(err.code) : "";
    var raw = err && err.message ? String(err.message) : String(err || "");
    var detail = raw;
    if (code === "ENOENT") {
      detail = "\u8DEF\u5F84\u4E0D\u5B58\u5728\u6216\u6587\u4EF6\u5DF2\u88AB\u79FB\u52A8";
    } else if (code === "EACCES" || code === "EPERM") {
      detail = "\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u8BE5\u8DEF\u5F84\uFF0C\u6216\u6587\u4EF6\u6B63\u5728\u88AB\u5360\u7528";
    } else if (code === "EBUSY") {
      detail = "文件正在被其它程序占用";
    }
    return prefix + (detail ? ": " + detail : "");
  }

  setTimeout(function () {
    try {
      init();
    } catch (errInit) {
      failBoot("HGScripts 初始化失败", errInit);
    }
  }, 0);
})();


