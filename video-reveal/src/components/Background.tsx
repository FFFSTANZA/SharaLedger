import { useVideoConfig } from 'remotion';
import React from 'react';

export const Background: React.FC = () => {
	const { width, height } = useVideoConfig();

	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width,
				height,
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			}}
		>
			<div
				style={{
					position: 'absolute',
					width,
					height,
					background:
						'radial-gradient(circle at 20% 50%, transparent 20%, rgba(255,255,255,.08) 21%, rgba(255,255,255,.08) 34%, transparent 35%, transparent)',
					backgroundSize: '5rem 5rem',
					opacity: 0.5,
				}}
			/>
		</div>
	);
};