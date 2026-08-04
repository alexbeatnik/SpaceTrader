# Custom NSIS additions for the Space Trader installer.
#
# electron-builder prepends this file to its own installer script, so the macro
# below is picked up by the !ifmacrodef hook in app-builder-lib's
# assistedInstaller.nsh.
#
# Why it exists: the assisted installer has no welcome page of its own, so
# somebody running a newer setup.exe had no way of knowing whether the old
# version must be uninstalled first. It must not be — NSIS finds the previous
# install through the app's registry key and replaces it in place — and saves
# live in %APPDATA%, which neither an update nor an uninstall touches (see
# "deleteAppDataOnUninstall": false in package.json). This page says all that
# at the one moment the question comes up.

!macro customWelcomePage
  # ...and only at that moment. A self-update runs this same installer with
  # --updated, where every word above is answering a question nobody asked: the
  # updater has already closed the game and the previous version is replaced
  # without anyone choosing anything. Left showing, the page turned an invisible
  # update into a wizard whose opening screen told the player to close a game
  # that was no longer running — reported, reasonably, as "it says the
  # application is open". Skipping it here is the belt to the braces of
  # installing silently (src/main/updater.ts); either alone would do, and an
  # installer that can be launched by hand deserves both.
  Function skipWelcomePageWhenUpdating
    ${if} ${isUpdated}
      Abort
    ${endif}
  FunctionEnd
  !define MUI_PAGE_CUSTOMFUNCTION_PRE skipWelcomePageWhenUpdating

  !define MUI_WELCOMEPAGE_TITLE "Install or update Space Trader"
  !define MUI_WELCOMEPAGE_TEXT "Setup will install Space Trader ${VERSION} on your computer.$\r$\n$\r$\nUPDATING FROM AN OLDER VERSION?$\r$\nJust continue. The version you already have is removed automatically as part of this install - do not uninstall it first.$\r$\n$\r$\nYOUR SAVED GAMES ARE KEPT.$\r$\nThey are stored with your user profile, not in the program folder. Updating never touches them, and uninstalling leaves them in place too.$\r$\n$\r$\nIf Space Trader is open, Setup closes it for you before it starts."
  !insertmacro MUI_PAGE_WELCOME
!macroend
