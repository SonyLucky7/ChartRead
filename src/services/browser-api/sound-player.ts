import { join as pathJoin } from 'path';
import { app } from '@electron/remote';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { ISoundPlayer, Sound, SOUND_PLAYER_CONTRACT } from './ibrowser-api-services';

@ExposeSingletonService(SOUND_PLAYER_CONTRACT, IpcServices.getProvider())
export class SoundPlayer implements ISoundPlayer {
	private audio: HTMLAudioElement | null = null;
	private playTimeout: NodeJS.Timeout | null = null;
	private stopLoopedPlayingTimeout: NodeJS.Timeout | null = null;

	private triggerAudioOnce = (): void => {
		if (this.audio !== null) {
			this.audio.play();
		}
	};

	private triggerAudioPlayback(sound: Sound): void {
		if (this.audio === null) {
			return;
		}

		this.triggerAudioOnce();

		if (sound.duration === 0) {
			this.stopSound();
			return;
		}

		// loop playing sound
		this.audio.addEventListener('ended', this.triggerAudioOnce);

		if (this.stopLoopedPlayingTimeout) {
			clearTimeout(this.stopLoopedPlayingTimeout);
			this.stopLoopedPlayingTimeout = null;
		}
		const oneSec = 1000;
		const durationMs = sound.duration * oneSec;
		// timeout to stop playing looped sound
		this.stopLoopedPlayingTimeout = setTimeout(() => {
			this.stopSound();
		}, durationMs);
	}

	public playSound(sound: Sound): void {
		if (this.audio !== null) {
			return;
		}

		this.audio = new Audio(
			pathJoin(
				app.getAppPath(),
				`/resources/sounds/${ sound.name }.mp3`
			)
		);
		this.audio.volume = sound.volume / 100;

		const soundPlaybackDelay = 500;
		this.playTimeout = setTimeout(this.triggerAudioPlayback.bind(this, sound), soundPlaybackDelay);
	}

	public stopSound(): void {
		if (this.playTimeout) {
			clearTimeout(this.playTimeout);
			this.playTimeout = null;
		}

		if (this.stopLoopedPlayingTimeout) {
			clearTimeout(this.stopLoopedPlayingTimeout);
			this.stopLoopedPlayingTimeout = null;
		}

		if (this.audio !== null) {
			this.audio.removeEventListener('ended', this.triggerAudioOnce);
			this.audio = null;
		}
	}
}
