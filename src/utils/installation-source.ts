const knownInstallationSources = ['win32_ms_store', 'win32_msix', 'linux_snap', 'linux_deb', 'linux_rpm', 'darwin_dmg'] as const;

type KnownInstallationSource = typeof knownInstallationSources[number];

export type InstallationSource = KnownInstallationSource | 'unknown';

function toInstallationSource(value: string): InstallationSource {
	if (knownInstallationSources.includes(value as KnownInstallationSource)) {
		return value as KnownInstallationSource;
	}
	else {
		return 'unknown';
	}
}

export function getInstallationSource(): InstallationSource {
	/* eslint-disable @typescript-eslint/ban-ts-comment */

	let packageType;
	packageType = 'msix';
	/* eslint-enable @typescript-eslint/ban-ts-comment */

	const os = process.platform;

	return toInstallationSource(`${ os }_${ packageType }`);
}
