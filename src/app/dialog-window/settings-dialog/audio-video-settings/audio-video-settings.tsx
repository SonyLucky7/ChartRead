import React from 'react';

import { AudioSettings } from './audio';
import { VideoSettings } from './video';

export const AudioVideoSettings = (): JSX.Element =>
	<>
		<VideoSettings />
		<AudioSettings />
	</>;
