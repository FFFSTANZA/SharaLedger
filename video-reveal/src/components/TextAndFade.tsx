import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import React from 'react';

const { fontFamily } = loadFont();

export const TextAndFade: React.FC<{
	children: React.ReactNode;
	startFrame: number;
	color: string;
	isBold?: boolean;
}> = ({ children, startFrame, color, isBold }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const value = spring({
		frame: frame - startFrame,
		fps,
		config: {
			stiffness: 100,
			mass: 1,
			damping: 15,
		},
	});

	const opacity = value;
	const translate = 10 - value * 10;

	return (
		<div
			style={{
				color,
				fontSize: '4em',
				fontWeight: isBold ? 700 : 400,
				fontFamily,
				transform: `translateY(${translate}px)`,
				opacity: opacity,
			}}
		>
			{children}
		</div>
	);
};