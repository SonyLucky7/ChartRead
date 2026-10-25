import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { ISoundPlayer, SOUND_PLAYER_CONTRACT } from './ibrowser-api-services';

export function soundPlayerService(): ISoundPlayer {
	return IpcServices.provide<ISoundPlayer>(SOUND_PLAYER_CONTRACT);
}

export function soundPlayerServiceProxy(): Promisify<ISoundPlayer> {
	return IpcServices.provideProxy<ISoundPlayer>(SOUND_PLAYER_CONTRACT);
}
