import React, { useRef, useState } from 'react';
import {
	ButtonSize,
	ButtonVariant,
	SquareButton,
} from '@tradingview/ui-lib/buttons/square-button';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconcrossWebSize18pxStroke1 as crossSvgIcon } from '@tradingview/ui-lib/icons/monochrome/cross-web/size_18px__stroke_1.5px';
import {
	svgIconmediaControlPauseSize18pxStroke1 as pauseSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/media-control-pause/size_18px__stroke_1.5px__usage_media-control';
import {
	svgIconmediaControlPlaySize18pxFilledOnTypeDefaulUsageMediaControl as playSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/media-control-play/size_18px__filled_on__type_defaul__usage_media-control';

import { loggerServiceProxy } from '../../../../../logger';
import { MenuCloseEventSource } from '../../../../../services/window/window-api';
import { getWindowControl } from '../../../../common/app-common';
import { useObservable } from '../../../../components-ui/hooks';
import { ModalWindow } from '../../../../components-ui/modal-window';

import './modal-window-with-video.css';

interface ModalWindowWithVideoProps {
	onCancel(): void;
	videoSource?: string;
	children?: React.ReactNode;
}

export const ModalWindowWithVideo = ({ videoSource, onCancel, children }: ModalWindowWithVideoProps): JSX.Element => {
	const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

	const videoRef = useRef<HTMLVideoElement>(null);

	const menuCloseEventHandler = (source: MenuCloseEventSource | null): void => {
		if (source === null || ['hotkey-fired', 'tab-panel-click'].includes(source)) {
			return;
		}

		onCancel();
	};

	useObservable<MenuCloseEventSource | null>(getWindowControl().menuCloseEvent, menuCloseEventHandler);

	const handlePlayPauseClick = (): void => {
		if (!videoRef.current) {
			return;
		}

		if (isVideoPlaying) {
			videoRef.current.pause();
			setIsVideoPlaying(false);
		}
		else {
			videoRef.current.play()
				.then(() => { setIsVideoPlaying(true); })
				.catch((error) => {
					loggerServiceProxy().error(
						'<ModalWindowWithVideo>.handlePlayPauseClick: videoRef.current.play() error ',
						error
					);
				});
		}
	};

	return (
		<ModalWindow onCancel={ onCancel } className='modal-window-with-video' isClosable={ false }>
			<div className='modal-window-with-video-video-container'>
				<video
					src={ videoSource }
					className='modal-window-with-video-video'
					ref={ videoRef }
					autoPlay
					loop
					muted
				/>
				<div className='modal-window-with-video-control close'>
					<SquareButton
						className='control-button'
						onClick={ onCancel }
						size={ ButtonSize.XSmall }
						variant={ ButtonVariant.Primary }
						iconOnly
						startSlot={ <BlockIcon icon={ crossSvgIcon } /> }
					/>
				</div>
				<div className='modal-window-with-video-control pause'>
					<SquareButton
						className='control-button'
						onClick={ handlePlayPauseClick }
						size={ ButtonSize.XSmall }
						variant={ ButtonVariant.Primary }
						iconOnly
						startSlot={ <BlockIcon icon={ isVideoPlaying ? pauseSvgIcon : playSvgIcon } /> }
					/>
				</div>
			</div>

			{ children }
		</ModalWindow>
	);
};
