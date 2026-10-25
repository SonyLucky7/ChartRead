export interface Sound {
	name: string;
	duration: number;
	volume: number;
}

export interface ISoundPlayer {
	playSound(sound: Sound): void;
	stopSound(): void;
}

export const SOUND_PLAYER_CONTRACT = 'tvd:sound-player-contract';
