import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import React from 'react';
import { Rect } from '@remotion/shapes';

export const EWayBillAnimation: React.FC<{
	scale?: number;
}> = ({ scale = 1 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const rotate = spring({
		frame,
		fps,
		config: {
			stiffness: 100,
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
				transform: `rotate(${rotate * 360}deg)`,
			}}
		>
			<Rect
				width={80 * scale}
				height={60 * scale}
				fill="#3b82f6"
				stroke="#1e40af"
				strokeWidth={2 * scale}
				radius={8 * scale}
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
					fontSize: `${14 * scale}px`,
					fontWeight: 'bold',
					textAlign: 'center',
					lineHeight: 1.2,
				}}
			>
				E-Way
				<br />
				Bill
			</div>
			<div
				style={{
					position: 'absolute',
					top: -5 * scale,
					right: -5 * scale,
					background: '#f59e0b',
					color: 'white',
					borderRadius: '50%',
					width: `${20 * scale}px`,
					height: `${20 * scale}px`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: `${10 * scale}px`,
				}}
			>
				🚚
			</div>
		</div>
	);
};