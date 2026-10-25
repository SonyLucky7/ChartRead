import { dialog, Notification, session as electronSession, systemPreferences, WebContents } from 'electron';
import i18next from 'i18next';

import { loggerService } from '../logger';
import { logCall, logCallName } from '../logger/log-decorator';
import { shortifyUrl } from '../logger/log-formatter';
import { getMessageOfError } from '../tvd-runtime/core';
import { isDarwin, isLinux, isWin32 } from './helpers';
import { LinuxSnap, LINUXSNAP_CAMERA_INTERFACE, LINUXSNAP_PULSEAUDIO_INTERFACE, LINUXSNAP_SNAP, Win32SettingKind, Win32Utils } from './os-utils';
import { isLocalURI, isTVHostedUrl } from '.';

// eslint-disable-next-line @typescript-eslint/ban-types
type PermissionRequestHandler = NonNullable<Parameters<typeof electronSession.defaultSession.setPermissionRequestHandler>[0]>;

// constantly receiving accessibility-events checks from macOS but they are not documented in Electron API
type Permission = Parameters<PermissionRequestHandler>[1] | 'accessibility-events' | 'window-placement' | 'sensors' | 'background-sync' |
'idle-detection' | 'periodic-background-sync' | 'screen-wake-lock';
type PermissionRequestHandlerCallback = Parameters<PermissionRequestHandler>[2];
type PermissionRequestHandlerDetails = Parameters<PermissionRequestHandler>[3];

type MediaAccessType = Parameters<typeof Electron.systemPreferences.getMediaAccessStatus>[0];

const ALWAYS_ALLOWED: Permission[] = [
	'fullscreen',
	'clipboard-read',
	'clipboard-sanitized-write',
	'openExternal',
	'accessibility-events',
	'window-placement',
	'sensors',
	'background-sync',
	'periodic-background-sync',
	'idle-detection',
	'screen-wake-lock',
	'media',
];

const ALWAYS_DECLINED: Permission[] = [
	'notifications',
];

const ALWAYS_DECLINED_PERMISSIONS_FOR_BROKERS: string[] = [
	'geolocation',
	'midi',
	'speaker-selection',
	'persistent-storage',
	'clipboard-sanitized-write',
	'payment-handler',
	'background-fetch',
	'display-capture',
	'window-management',
	'storage-access',
];

type MediaKind = 'audio' | 'video';

export type DisplayMediaRequest = Pick<Electron.DisplayMediaRequestHandlerHandlerRequest, 'frame' | 'securityOrigin' | 'videoRequested' | 'audioRequested'>;

export function resolveDisplayMediaRequest(request: DisplayMediaRequest): Electron.Streams {
	const { frame, securityOrigin, videoRequested, audioRequested } = request;

	if (frame === null || !isTVHostedUrl(securityOrigin)) {
		loggerService().info(`Display media request declined for (${ shortifyUrl(securityOrigin) })`);
		return {};
	}

	// audio capture has no use case in TV pages yet; so we decline it for now to be more restrictive
	if (!videoRequested || audioRequested) {
		loggerService().info(`Display media request declined: audio-only capture is not supported (${ shortifyUrl(securityOrigin) })`);
		return {};
	}

	loggerService().info(`Display media request: capturing own frame for (${ shortifyUrl(securityOrigin) })`);

	return { video: frame };
}

function isAlwaysAllowedPermission(permission: string): boolean {
	return (ALWAYS_ALLOWED as string[]).includes(permission);
}

function isAlwaysDeclinedPermission(permission: string): boolean {
	return (ALWAYS_DECLINED as string[]).includes(permission);
}

const enum PermissionPolicy {
	Allow = 'allow',
	Decline = 'decline',
	Ask = 'ask',
}

function getPermissionForUrl(permission: string, url: string): PermissionPolicy {
	if (isLocalURI(url) || isTVHostedUrl(url)) {
		return PermissionPolicy.Allow;
	}

	if (ALWAYS_DECLINED_PERMISSIONS_FOR_BROKERS.includes(permission)) {
		return PermissionPolicy.Decline;
	}

	return PermissionPolicy.Ask;
}

function isMediaAccessPermissionRequest(req: PermissionRequestHandlerDetails): req is Electron.MediaAccessPermissionRequest {
	return 'mediaTypes' in req;
}

@logCallName('PermissionsHandler')
export class PermissionsHandler {
	private linuxSnapMediaNotificationShown = false;

	@logCall
	initialize(): void {
		const session = electronSession.defaultSession;

		session.setPermissionCheckHandler((webContents: WebContents | null, permission: string, origin: string,
			details: Electron.PermissionCheckHandlerHandlerDetails): boolean => {
			if (isAlwaysAllowedPermission(permission)) {
				return true;
			}

			if (isAlwaysDeclinedPermission(permission)) {
				return false;
			}

			const requestingUrl = webContents?.getURL();
			if (!requestingUrl) {
				return false;
			}

			loggerService().info(`Check permission (${ permission }) on (${ shortifyUrl(requestingUrl) })`);

			if (requestingUrl && permission === 'media' && isLocalURI(requestingUrl)) {
				if (isDarwin() && details.mediaType) {
					if (details.mediaType !== 'unknown') {
						this.checkOsMediaPermissionsDarwin(details.mediaType)
							.catch(error => {
								loggerService().warn(`Error while checking permission (${ permission }): ${ getMessageOfError(error) }`);
							});
					}
				}

				return true;
			}

			return getPermissionForUrl(permission, requestingUrl) === PermissionPolicy.Allow;
		});

		session.setDisplayMediaRequestHandler((request: DisplayMediaRequest, callback: (streams: Electron.Streams) => void): void => {
			callback(resolveDisplayMediaRequest(request));
		});

		session.setPermissionRequestHandler((webContents: WebContents, permission: Permission, callback: PermissionRequestHandlerCallback,
			details: PermissionRequestHandlerDetails): void => {
			if (isAlwaysAllowedPermission(permission)) {
				callback(true);
				return;
			}

			loggerService().info(`Request permission (${ permission }) on (${ shortifyUrl(webContents.getURL()) })`);

			this.grantAccessPermission(permission, details)
				.then((allow: boolean): void => {
					callback(allow);
				})
				.catch((error: unknown) => {
					loggerService().warn(`Error while requesting permission (${ permission }): ${ getMessageOfError(error) }`);
					callback(false);
				});
		});
	}

	private async grantAccessPermission(permission: Permission, details: PermissionRequestHandlerDetails): Promise<boolean> {
		if (isAlwaysDeclinedPermission(permission)) {
			return false;
		}

		const requestingUrl = details.requestingUrl;
		if (!requestingUrl) {
			return false;
		}

		const urlPermissionPolicy = getPermissionForUrl(permission, requestingUrl);

		switch (urlPermissionPolicy) {
			case PermissionPolicy.Allow: {
				if (isMediaAccessPermissionRequest(details)) {
					return await this.checkMediaPermissions(details);
				}

				return true;
			}

			case PermissionPolicy.Ask: {
				let permissionTranslated = permission;

				if (permission === 'media') {
					permissionTranslated = i18next.t('media');
				}
				else if (permission === 'display-capture') {
					permissionTranslated = i18next.t('display capture');
				}

				const accessGranted = dialog.showMessageBoxSync({
					message: i18next.t('Application requests permission to {{permission}}', { permission: permissionTranslated }),
					buttons: [i18next.t('Allow'), i18next.t('Decline')],
				});

				return accessGranted === 0;
			}

			case PermissionPolicy.Decline:
			default: {
				return false;
			}
		}
	}

	private async checkMediaPermissions(details: Electron.MediaAccessPermissionRequest): Promise<boolean> {
		await this.showLinuxSnapMediaPermissions();

		const requestedMedia = details.mediaTypes;
		if (requestedMedia === undefined || requestedMedia.length === 0) {
			return true;
		}

		let allow = true;

		for (const mediaKind of requestedMedia) {
			loggerService().info(`Requesting media access (${ mediaKind })`);

			let checked = true;
			if (isDarwin()) {
				checked = await this.checkOsMediaPermissionsDarwin(mediaKind);
			}
			else if (isLinux()) {
				checked = await this.checkOsMediaPermissionsLinux(mediaKind);
			}
			else if (isWin32()) {
				checked = this.checkOsMediaPermissionsWindows(mediaKind);
			}

			if (allow) {
				allow = checked;
			}
		}

		return allow;
	}

	/**
	 * There is ability only check the media access status on Windows.
	 * And if access is not granted for requested media we can only always returns false and show notification to user (that media access not allowed).
	 */
	private checkOsMediaPermissionsWindows(mediaKind: MediaKind): boolean {
		const mediaType: MediaAccessType = mediaKind === 'video' ? 'camera' : 'microphone';
		const currentStatus = systemPreferences.getMediaAccessStatus(mediaType);

		if (currentStatus === 'granted') {
			return true;
		}

		const title = mediaType === 'microphone' ? i18next.t('App\'s not allowed to access to your microphone') : i18next.t('App\'s not allowed to access to your webcam');
		const body = mediaType === 'microphone' ? i18next.t('Allow access to the microphone on this device') : i18next.t('Allow access to the camera on this device');

		const notify = new Notification({
			title,
			body,
		});

		const settingKind: Win32SettingKind = mediaType === 'microphone' ? 'privacy-microphone' : 'privacy-webcam';
		notify.on('click', () => {
			Win32Utils.displaySettingsPanel(settingKind);
		});
		notify.show();

		return false;
	}

	private async checkOsMediaPermissionsDarwin(mediaKind: MediaKind): Promise<boolean> {
		const mediaType: MediaAccessType = mediaKind === 'video' ? 'camera' : 'microphone';
		const currentStatus = systemPreferences.getMediaAccessStatus(mediaType);

		if (currentStatus === 'granted') {
			return true;
		}

		// needed to check that systemPreferences.askForMediaAccess() somehow notifies the user at all when currentStatus is not 'not-determined'.
		// If askForMediaAccess does not showing 'request-access-settings-page' then we must do it by it self.
		return await systemPreferences.askForMediaAccess(mediaType);
	}

	private async checkOsMediaPermissionsLinux(mediaKind: MediaKind): Promise<boolean> {
		if (!LinuxSnap.isSnap) {
			loggerService().info('Allow media access automatically, because this is not SNAP context');
			return true;
		}

		const deviceInterface = mediaKind === 'video' ? LINUXSNAP_CAMERA_INTERFACE : LINUXSNAP_PULSEAUDIO_INTERFACE;

		try {
			loggerService().info(`Will checks snap itf connection: ${ deviceInterface }`);

			if (!await LinuxSnap.checkIsConnected(deviceInterface)) {
				return false;
			}
		}
		catch (error: unknown) {
			loggerService().error(`Error while checking snap interface (${ deviceInterface }):${ getMessageOfError(error) }`);
		}

		return true;
	}

	/**
	 * There is strange (or buggy) behavior when running as snap:
	 * browser will not permissions request for webcam  when user attempts to enable it.
	 * So any checks what is actually allowed by security settings need perform on first time media accesss request.
	 *
	 * If any (camera or audio) is disabled info dialog should be showed.
	 *
	 * snap, interface management: https://snapcraft.io/docs/interface-management
	 */
	private async showLinuxSnapMediaPermissions(): Promise<void> {
		if (!isLinux() || this.linuxSnapMediaNotificationShown || !LinuxSnap.isSnap) {
			return;
		}
		this.linuxSnapMediaNotificationShown = true;

		try {
			const audioAllowed = await LinuxSnap.checkIsConnected(LINUXSNAP_PULSEAUDIO_INTERFACE);
			const cameraAllowed = await LinuxSnap.checkIsConnected(LINUXSNAP_CAMERA_INTERFACE);

			if (audioAllowed && cameraAllowed) {
				return;
			}

			let message =
				i18next.t('To enable access to the microphone and webcam, please open your software center and give the appropriate permissions to TradingView.') + '\n\n' +
				i18next.t('Microphone') + (audioAllowed ? ' (+)' : ' (-)') + '\n' +
				i18next.t('Camera') + (cameraAllowed ? ' (+)' : ' (-)') + '\n\n' +
				i18next.t('As an alternative you can enter the following commands in a terminal window:');

			if (!audioAllowed) {
				message = message + `\nsudo snap connect ${ LINUXSNAP_SNAP }:pulseaudio :pulseaudio`;
			}

			if (!cameraAllowed) {
				message = message + `\nsudo snap connect ${ LINUXSNAP_SNAP }:camera :camera`;
			}

			dialog.showMessageBoxSync({
				message,
				type: 'info',
			});
		}
		catch (error: unknown) {
			loggerService().warn(`Error while showLinuxSnapMediaPermissions: ${ getMessageOfError(error) }`);
		}
	}
}
