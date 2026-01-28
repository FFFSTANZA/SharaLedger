import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import React from 'react';
import { Rect } from '@remotion/shapes';

export const POSAnimation: React.FC<{
	scale?: number;
}> = ({ scale = 1 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const slide = spring({
		frame: frame % 60,
		fps,
		config: {
			stiffness: 200,
			mass: 1,
			damping: 15,
		},
	});

	return (
		<div
			style={{
				position: 'relative',
				width: `${100 * scale}px`,
				height: `${100 * scale}px`,
			}}
		>
			{/* POS Screen */}
			<Rect
				width={70 * scale}
				height={50 * scale}
				fill="#1f2937"
				radius={4 * scale}
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			/>
			
			{/* Screen Content */}
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: `${60 * scale}px`,
					height: `${35 * scale}px`,
					background: '#10b981',
					opacity: 0.8,
					borderRadius: '2px',
				}}
			/>
			
			{/* Receipt */}
			<Rect
				width={25 * scale}
				height={40 * scale}
				fill="#f3f4f6"
				radius={2 * scale}
				style={{
					position: 'absolute',
					left: `${50 + slide * 20 * scale}px`,
					top: `${35 * scale}px`,
					transform: 'rotate(10deg)',
				}}
			/>
			
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					color: 'white',
					fontSize: `${12 * scale}px`,
					fontWeight: 'bold',
				}}
			>
				POS
			</div>
		</div>
	);
};