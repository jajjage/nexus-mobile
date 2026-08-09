export interface AppVersionInfo {
  latestVersion: string;
  minVersion: string;
  title: string;
  subtitle: string;
  releaseNotes: string;
  iosUrl: string;
  androidUrl: string;
  updatedAt?: string;
}

export interface VersionCheckState {
  visible: boolean;
  isMandatory: boolean;
  versionInfo: AppVersionInfo | null;
  currentVersion: string;
  isChecked: boolean;
}
