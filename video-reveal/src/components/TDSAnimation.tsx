import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import React from 'react';
import { Circle } from '@remotion/shapes';

export const TDSAnimation: React.FC<{
	scale?: number;
}> = ({ scale = 1 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const pulse = spring({
		frame,
		fps,
		config: {
			stiffness: 200,
			mass: 1,
			damping: 10,
		},
	});

	const iconScale = 0.5 + pulse * 0.5;

	return (
		<div
			style={{
				position: 'relative',
				width: `${100 * scale}px`,
				height: `${100 * scale}px`,
				transform: `scale(${iconScale})`,
			}}
		>
			<Circle
				radius={45 * scale}
				fill="#10b981"
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					color: 'white',
					fontSize: `${24 * scale}px`,
					fontWeight: 'bold',
				}}
			>
				TDS
			</div>
			<div
				style={{
					position: 'absolute',
					top: '-10px',
					right: '-10px',
					background: '#ef4444',
					color: 'white',
					borderRadius: '50%',
					width: `${30 * scale}px`,
					height: `${30 * scale}px`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: `${12 * scale}px`,
					fontWeight: 'bold',
				}}
			>
				✓
			</div>
		</div>
	);
};