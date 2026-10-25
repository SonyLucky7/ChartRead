import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loggerServiceProxy } from '../../../../../logger';
import { settingsProviderProxy } from '../../../../../services/settings';
import { MediaDevice } from '../../../../../services/settings/media';
import { useObservable } from '../../../../components-ui/hooks';
import ComboboxComponent from '../../../controls/combobox';
import { ProgressBar } from '../../../controls/progressbar';
import { SettingsSection } from '../../settings-section';
import { AudioInputAnalyser } from '../audio-input-analyser';

export const AudioSettings = (): JSX.Element => {
	const { t } = useTranslation();
	const [audioSources, setAudioSources] = useState<MediaDevice[]>([]);
	const [currentAudioDeviceId, setCurrentAudioDeviceId] = useState<string>();
	const [audioLevel, setAudioLevel] = useState<number>(0);
	const [audioAnalyser, setAudioAnalyser] = useState<AudioInputAnalyser>();
	const [hasDevices, setHasDevices] = useState<boolean>(true);

	const getAudioDevices = useCallback(
		async(mediaDevices: MediaDevices): Promise<void> => {
			const devices = await mediaDevices.enumerateDevices();

			const audioTracks = devices
				.filter(d => d.kind === 'audioinput' && d.deviceId !== 'default' && d.deviceId !== 'communications')
				.map(({ deviceId, label }) => ({ id: deviceId, label }));

			if (audioSources.length !== audioTracks.length) {
				setAudioSources(audioTracks);
			}

			setHasDevices(audioTracks.length > 0);
		},
		[audioSources.length]
	);

	useLayoutEffect(() => {
		loggerServiceProxy().debug('<AudioSettings>: Initialized');

		getAudioDevices(navigator.mediaDevices)
			.catch(error => {
				loggerServiceProxy().error('<AudioSettings>: Initialized', error);
			});
	}, [getAudioDevices]);

	useLayoutEffect(() => {
		if (audioSources.length === 0) {
			return;
		}

		const changeDevicesHandler = function(this: MediaDevices): void {
			loggerServiceProxy().debug('<AudioSettings>: change MediaDevices');

			getAudioDevices(this)
				.catch((error) => {
					loggerServiceProxy().error('<AudioSettings>: getAudioDevices', error);
				});
		};

		navigator.mediaDevices.addEventListener('devicechange', changeDevicesHandler);

		return () => {
			navigator.mediaDevices.removeEventListener('devicechange', changeDevicesHandler);
		};
	}, [audioSources, getAudioDevices]);

	const onAudioSourceChange = useCallback(
		async(id: string, label: string): Promise<void> => {
			let audioSource: MediaStream | null = null;

			try {
				audioSource = await getAudioSource(id);
			}
			catch (err) {
				loggerServiceProxy().error(`<AudioSettings>.onAudioSourceChange: Microphone id ${ id } label ${ label } could not be obtained`);
			}

			if (!audioSource) {
				loggerServiceProxy().error(`<AudioSettings>.onAudioSourceChange(): Could not find device with id ${ id } label ${ label }`);
				return;
			}

			if (audioAnalyser) {
				audioAnalyser.setInput(audioSource);
			}
			else {
				setAudioAnalyser(new AudioInputAnalyser(audioSource));
			}

			settingsProviderProxy().appAudioInputChange.next({ id, label });
		}, [audioAnalyser]);

	useEffect(() => {
		const getAudio = async(): Promise<void> => {
			if (audioSources.length === 0) {
				return;
			}

			let audioDevice = await settingsProviderProxy().getMicrophone();
			if (!audioDevice) {
				audioDevice = audioSources[0];
			}

			setCurrentAudioDeviceId(audioDevice.id);
			await onAudioSourceChange(audioDevice.id, audioDevice.label);
		};

		getAudio()
			.catch((error) => {
				loggerServiceProxy().error('<AudioSettings>: getAudio() in useEffect', error);
			});
	}, [audioSources, onAudioSourceChange]);

	useObservable<number>(audioAnalyser?.level, setAudioLevel, [audioAnalyser]);

	const getAudioSource = (id: string): Promise<MediaStream> => {
		return navigator.mediaDevices.getUserMedia({ audio: { deviceId: id } });
	};

	const onChangeHandler = (id: string, label: string): void => {
		loggerServiceProxy().info(`Selected audio device "${ label }"`);

		setCurrentAudioDeviceId(id);
		onAudioSourceChange(id, label)
			.catch((error) => {
				loggerServiceProxy().error(`<AudioSettings>.onChangeHandler: onAudioSourceChange(id: ${ id }, label: ${ label }) `, error);
			});
	};

	const labelNoAvailableDevices = hasDevices ? '' : ` (${ t('no available devices') })`;

	return (
		<>
			<SettingsSection label={ `${ t('MICROPHONE') }${ labelNoAvailableDevices }` } className='audio'>
				<ComboboxComponent
					tabIndex={ 1 }
					hasKeyboardNavigation={ true }
					defaultSelectedId={ currentAudioDeviceId }
					items={ audioSources }
					onChange={ onChangeHandler }
					isDisabled={ !hasDevices }
				/>
			</SettingsSection>

			<SettingsSection label={ t('Input level') }>
				<ProgressBar level={ audioLevel } precision={ 20 } />
			</SettingsSection>
		</>
	);
};
