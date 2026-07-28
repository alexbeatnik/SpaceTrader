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
  !define MUI_WELCOMEPAGE_TITLE "Install or update Space Trader"
  !define MUI_WELCOMEPAGE_TEXT "Setup will install Space Trader ${VERSION} on your computer.$\r$\n$\r$\nUPDATING FROM AN OLDER VERSION?$\r$\nJust continue. The version you already have is removed automatically as part of this install - do not uninstall it first.$\r$\n$\r$\nYOUR SAVED GAMES ARE KEPT.$\r$\nThey are stored with your user profile, not in the program folder. Updating never touches them, and uninstalling leaves them in place too.$\r$\n$\r$\nClose Space Trader if it is running, then click Next."
  !insertmacro MUI_PAGE_WELCOME
!macroend
