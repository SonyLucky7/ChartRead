import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loggerServiceProxy } from '../../../../../logger';
import { settingsProviderProxy } from '../../../../../services/settings';
import { MediaDevice } from '../../../../../services/settings/media';
import ComboboxComponent from '../../../controls/combobox';
import { SettingsSection } from '../../settings-section';

import './video.css';

function isMediaStream(obj: MediaProvider): obj is MediaStream {
	return Boolean(obj) && 'getTracks' in obj;
}

export const VideoSettings = (): JSX.Element => {
	const { t } = useTranslation();
	const [videoSources, setVideoSources] = useState<MediaDevice[]>([]);
	const [currentVideoDeviceId, setCurrentVideoDeviceId] = useState<string>();
	const [hasDevices, setHasDevices] = useState<boolean>(true);
	const refVideoElement = useRef<HTMLVideoElement>(null);

	const getVideoDevices = useCallback(
		async(mediaDevices: MediaDevices): Promise<void> => {
			const devices = await mediaDevices.enumerateDevices();

			const videoTracks = devices
				.filter(d => d.kind === 'videoinput' && d.deviceId !== 'default')
				.map(({ deviceId, label }) => ({ id: deviceId, label }));

			if (videoSources.length !== videoTracks.length) {
				setVideoSources(videoTracks);
			}

			setHasDevices(videoTracks.length > 0);
		},
		[videoSources.length]
	);

	useLayoutEffect(() => {
		loggerServiceProxy().debug('<VideoSettings>: Initialized');

		getVideoDevices(navigator.mediaDevices)
			.catch(error => {
				loggerServiceProxy().error('<VideoSettings>: Initialized', error);
			});
	}, [getVideoDevices]);

	useLayoutEffect(() => {
		if (videoSources.length === 0) {
			return;
		}

		const changeDevicesHandler = function(this: MediaDevices): void {
			loggerServiceProxy().debug('<VideoSettings>: change MediaDevices');

			getVideoDevices(this)
				.catch((error) => {
					loggerServiceProxy().error('<VideoSettings>: getVideoDevices', error);
				});
		};

		navigator.mediaDevices.addEventListener('devicechange', changeDevicesHandler);

		return () => {
			navigator.mediaDevices.removeEventListener('devicechange', changeDevicesHandler);
		};
	}, [getVideoDevices, videoSources]);

	const onVideoSourceChange = useCallback(
		async(id: string, label: string): Promise<void> => {
			if (!refVideoElement?.current || !id) {
				return;
			}

			let videoSource: MediaStream | null = null;

			try {
				videoSource = await getVideoSource(id);
			}
			catch (err) {
				loggerServiceProxy().error(`<VideoSettings>.onVideoSourceChange: Camera id ${ label } could not be obtained`);
			}

			refVideoElement.current.srcObject = videoSource;

			if (videoSource) {
				await refVideoElement.current.play();
				settingsProviderProxy().appCameraChange.next({ id, label });
			}
		}, []);

	useEffect(() => {
		if (videoSources.length === 0) {
			return;
		}

		settingsProviderProxy().getCamera()
			.then(camera => {
				const { id, label } = camera ?? videoSources[0];

				setCurrentVideoDeviceId(id);
				onVideoSourceChange(id, label)
					.catch(error => {
						loggerServiceProxy().error('<VideoSettings>.useEffect(): onVideoSourceChange()', error);
					});
			})
			.catch(error => {
				loggerServiceProxy().error('<VideoSettings>.useEffect(): settingsProviderProxy().getCamera()', error);
			});

		return () => {
			if (!refVideoElement?.current) {
				return;
			}

			const stream: MediaProvider | null = refVideoElement.current?.srcObject;

			if (!stream || !isMediaStream(stream)) {
				return;
			}

			const tracks = stream.getTracks();

			tracks.forEach((track) => {
				track.stop();
			});

			refVideoElement.current.srcObject = null;
		};
	}, [videoSources, refVideoElement, onVideoSourceChange]);

	const getCurrentVideoSource = (): string | undefined => {
		return currentVideoDeviceId ?? videoSources[0]?.id;
	};

	const getVideoSource = (id: string): Promise<MediaStream> => {
		return navigator.mediaDevices.getUserMedia({ video: { deviceId: id } });
	};

	const onChangeHandler = (id: string, label: string): void => {
		loggerServiceProxy().info(`Selected video device '${ label }'`);

		onVideoSourceChange(id, label)
			.catch(error => {
				loggerServiceProxy().error('<VideoSettings>: video onChangeHandler ', error);
			});
	};

	const labelNoAvailableDevices = hasDevices ? '' : ` (${ t('no available devices') })`;

	return (
		<SettingsSection label={ `${ t('CAMERA') }${ labelNoAvailableDevices }` }>
			<ComboboxComponent
				tabIndex={ 1 }
				hasKeyboardNavigation={ true }
				items={ videoSources }
				defaultSelectedId={ getCurrentVideoSource() }
				onChange={ onChangeHandler }
				isDisabled={ !hasDevices }
			/>
			<video
				height={ 220 }
				width={ 392 }
				tabIndex={ -1 }
				className='camera-source'
				ref={ refVideoElement }
				controls={ false }
			/>
		</SettingsSection>
	);
};
