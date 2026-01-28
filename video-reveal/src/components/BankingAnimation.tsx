import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import React from 'react';
import { Rect } from '@remotion/shapes';

export const BankingAnimation: React.FC<{
	scale?: number;
}> = ({ scale = 1 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bounce = spring({
		frame: frame % 90,
		fps,
		config: {
			stiffness: 200,
			mass: 1,
			damping: 10,
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
			{/* Bank Building */}
			<Rect
				width={60 * scale}
				height={70 * scale}
				fill="#3b82f6"
				radius={4 * scale}
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			/>
			
			{/* Columns */}
			<div
				style={{
					position: 'absolute',
					top: `${25 * scale}px`,
					left: `${50 - 20 * scale}px`,
					width: `${10 * scale}px`,
					height: `${35 * scale}px`,
					background: '#1e40af',
					borderRadius: '2px',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: `${25 * scale}px`,
					right: `${50 - 20 * scale}px`,
					width: `${10 * scale}px`,
					height: `${35 * scale}px`,
					background: '#1e40af',
					borderRadius: '2px',
				}}
			/>
			
			{/* Dollar Sign */}
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: `translate(-50%, -50%) scale(${1 + bounce * 0.2})`,
					color: 'white',
					fontSize: `${24 * scale}px`,
					fontWeight: 'bold',
				}}
			>
				$
			</div>
			
			{/* Bank Text */}
			<div
				style={{
					position: 'absolute',
					bottom: `${15 * scale}px`,
					left: '50%',
					transform: 'translateX(-50%)',
					color: 'white',
					fontSize: `${10 * scale}px`,
					fontWeight: 'bold',
				}}
			>
				BANK
			</div>
		</div>
	);
};