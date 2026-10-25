import React, { Component } from 'react';

import './progressbar.css';

interface ProgressBarProps {
	level: number;
	precision: number;
}

const DEFAULT_POINT_VALUE = 10;
const MAX_SCALE = 100;

export class ProgressBar extends Component<ProgressBarProps> {
	private pointValue = DEFAULT_POINT_VALUE;

	override componentDidMount(): void {
		this.pointValue = MAX_SCALE / this.props.precision;
	}

	override render(): React.ReactNode {
		return (
			<div className='progressbar'>
				{ this.renderPoints() }
			</div>
		);
	}

	renderPoints(): React.ReactNode[] {
		const points: React.ReactNode[] = [];

		const colorToIndex = this.getLevelPointIndex(this.props.level);

		for (let i = 0; i < this.props.precision; i++) {
			points.push(
				<span
					key={ i }
					className={ `progressbar-point ${ i <= colorToIndex ? 'active' : '' }` }
				/>
			);
		}

		return points;
	}

	private getLevelPointIndex(lvl: number): number {
		const actualLevel = Math.min(lvl, MAX_SCALE);
		return Math.round(actualLevel / this.pointValue) - 1;
	}
}
