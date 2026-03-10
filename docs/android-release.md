# Webory Android Release

Webory now includes a Capacitor Android shell in `/android` with app ID `app.webory.app`.

## Prerequisites

- Java 21 or the JDK version required by the installed Android Gradle plugin
- Android Studio
- Android SDK command-line tools
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` configured
- A Play Console account
- A release keystore for signing

## Commands

```sh
npm install
npm run android:sync
npm run android:debug
npm run android:bundle
```

`android:bundle` creates the Play upload artifact:

- `android/app/build/outputs/bundle/release/app-release.aab`

## Before the first store upload

- Replace launcher icons in the Android project with final Webory branding.
- Create a release keystore and configure signing in `android/app/build.gradle` or `~/.gradle/gradle.properties`.
- Open the Android project in Android Studio and confirm the target SDK required by Google Play at submission time.
- Install the debug build on a real device and verify:
  - cold start
  - offline launch
  - persistence after force close
  - export/import backup flow
  - uninstall/reinstall behavior

## Known product behavior to verify

- Writing data is stored locally on-device.
- Exported JSON is the backup path.
- Clearing storage or uninstalling the app can remove local data.
- The app does not include login, sync, collaboration, ads, or subscriptions in v1.
