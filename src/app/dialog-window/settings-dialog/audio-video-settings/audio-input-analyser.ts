import { BehaviorSubject, Observable } from 'rxjs';

import { logCall, logCallName } from '../../../../logger/log-decorator';
import { Disposable } from '../../../../tvd-runtime/core';
import { ignorePromise } from '../../../../utils';

export interface IAudioInputAnalyser {
	level: Observable<number>;
	setInput(stream: MediaStream): void;
}

@logCallName('AudioInputAnalyser')
export class AudioInputAnalyser implements IAudioInputAnalyser, Disposable {
	level = new BehaviorSubject<number>(0);

	private readonly sampleRate = 100;

	private stream: MediaStream;
	private context: AudioContext;
	private analyser: AnalyserNode;

	private input?: MediaStreamAudioSourceNode;

	private invHandler?: number;

	constructor(stream: MediaStream) {
		this.stream = stream;
		this.context = new AudioContext();
		this.analyser = this.context.createAnalyser();

		this.connectInput();
	}

	setInput(stream: MediaStream): void {
		if (this.input) {
			this.input.disconnect();
		}

		this.stream = stream;

		this.input = this.context.createMediaStreamSource(this.stream);
		this.input.connect(this.analyser);
	}

	private connectInput(): void {
		this.input = this.context.createMediaStreamSource(this.stream);

		this.analyser.fftSize = 512;
		this.analyser.smoothingTimeConstant = 0.6;

		this.input.connect(this.analyser);

		this.startAnalysing();
	}

	private startAnalysing(): void {
		const levelData = new Uint8Array(this.analyser.frequencyBinCount);

		const levelAnalyser = (): void => {
			this.analyser.getByteFrequencyData(levelData);

			const avgVol = levelData.reduce((prev, curr) => prev + curr) / levelData.length;
			this.level.next(Math.round(avgVol));
		};

		this.invHandler = setInterval(() => levelAnalyser(),
			this.sampleRate) as unknown as number;
	}

	@logCall
	dispose(): void {
		clearInterval(this.invHandler);

		if (this.input) {
			this.input.disconnect();
		}

		this.analyser.disconnect();
		ignorePromise(this.context.close());
	}
}
