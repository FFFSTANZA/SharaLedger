import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { linear } from 'remotion';
import React from 'react';

export const WipeTransition: React.FC<{
	children: React.ReactNode;
	startFrame: number;
	duration?: number;
}> = ({ children, startFrame, duration = 30 }) => {
	const frame = useCurrentFrame();
	const { width } = useVideoConfig();

	const progress = linear(
		(frame - startFrame) / duration,
		0,
		1
	);

	const clipPath = `polygon(0 0, ${progress * 100}% 0, ${progress * 100}% 100%, 0 100%)`;

	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				overflow: 'hidden',
			}}
		>
			<div style={{ clipPath, width: '100%', height: '100%' }}>
				{children}
			</div>
		</div>
	);
};

export const ZoomInTransition: React.FC<{
	children: React.ReactNode;
	startFrame: number;
	duration?: number;
}> = ({ children, startFrame, duration = 60 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const scale = spring({
		frame: frame - startFrame,
		fps,
		config: {
			stiffness: 100,
			mass: 1,
			damping: 15,
		},
	});

	const opacity = Math.min(1, (frame - startFrame) / 10);

	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				transform: `scale(${0.8 + scale * 0.2})`,
				opacity,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{children}
		</div>
	);
};