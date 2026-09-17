import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

export interface GithubRelease {
    tag_name: string;
    assets: {
        browser_download_url: string;
        name: string;
        content_type: string;
    }[];
    html_url: string;
    body: string; // Release notes
}

const GITHUB_REPO = "GloriousApps/Construction-Calc";

/**
 * Checks for updates and returns release info if a newer version exists.
 * Returns null if up to date or error.
 */
export const checkForUpdate = async (): Promise<GithubRelease | null> => {
    if (!Capacitor.isNativePlatform()) return null;

    try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        console.log(`Current Version: ${currentVersion}`);

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) throw new Error('GitHub API Error');

        const latestRelease: GithubRelease = await response.json();
        const latestTag = latestRelease.tag_name;

        const cleanCurrent = cleanVersion(currentVersion);
        const cleanLatest = cleanVersion(latestTag);

        if (isNewer(cleanLatest, cleanCurrent)) {
            return latestRelease;
        }
    } catch (error) {
        console.error("Update check failed:", error);
    }
    return null;
};

/**
 * Downloads the APK natively into the app cache.
 * Keeping this work in the native Filesystem plugin avoids loading the APK
 * into the browser/WebView memory, which can stall large GitHub downloads.
 * Returns the file path of the downloaded APK.
 */
export const downloadUpdate = async (
    release: GithubRelease,
    onProgress: (progress: number) => void
): Promise<string> => {
    const apkAsset = release.assets.find(a => a.name.endsWith('.apk'));
    if (!apkAsset) throw new Error("No APK found in release");

    const downloadUrl = apkAsset.browser_download_url;
    const fileName = apkAsset.name;
    // Native Android downloadFile does not create nested cache folders,
    // even when recursive is set. Keep the update at the cache root.
    const path = fileName;

    const progressListener = await Filesystem.addListener('progress', ({ bytes, contentLength }) => {
        if (contentLength > 0) {
            onProgress(Math.min((bytes / contentLength) * 100, 100));
        }
    });

    try {
        const downloadedFile = await Filesystem.downloadFile({
            url: downloadUrl,
            path,
            directory: Directory.Cache,
            recursive: true,
            progress: true,
        });
        if (!downloadedFile.path) throw new Error('APK dosyası kaydedilemedi.');
        onProgress(100);
        return downloadedFile.path;
    } finally {
        await progressListener.remove();
    }
};

export const installAPK = async (fileUri: string) => {
    try {
        await FileOpener.open({
            filePath: fileUri,
            contentType: 'application/vnd.android.package-archive'
        });
    } catch (e) {
        console.error("File Open Error:", e);
        throw e;
    }
};

function cleanVersion(ver: string): string {
    return ver.replace(/^v/, '').trim();
}

function isNewer(v1: string, v2: string): boolean {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); ++i) {
        const p1 = v1Parts[i] || 0;
        const p2 = v2Parts[i] || 0;
        if (p1 > p2) return true;
        if (p1 < p2) return false;
    }
    return false;
}
