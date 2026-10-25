import React, { useEffect, useRef } from 'react';
import { ensureNotNull } from '@tradingview/core/assertions';
import { Typography } from '@tradingview/ui-lib/typography';

import { OnboardingContentType, OnboardingStageData } from './onboarding-dialog';

import './onboarding-content.css';

interface OnboardingContentProps extends OnboardingStageData {}

const videoProps = {
	width: 700,
	height: 278,
};

export const OnboardingContent = ({ title, subtitle, content }: OnboardingContentProps): JSX.Element => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (content.type === OnboardingContentType.Custom) {
			return;
		}

		const videoElement = ensureNotNull(videoRef.current);

		videoElement.currentTime = 0;

		if (!content.video.autoplay) {
			videoElement.pause();
			return;
		}

		videoElement.play();
	}, [content]);

	return (
		<div className='onboarding-content'>
			<Typography tag='h1' name='typography-accent-28px-bold' className='onboarding-content-title'>{ title }</Typography>
			<Typography tag='p' name='typography-regular-16px' className='onboarding-content-subtitle'>{ subtitle }</Typography>
			<div className='onboarding-content-content'>
				{ content.type === OnboardingContentType.Video
					? <video
						src={ content.video.source }
						width={ videoProps.width }
						height={ videoProps.height }
						ref={ videoRef }
						loop
					/>
					: content.element
				}
			</div>
		</div>
	);
};
