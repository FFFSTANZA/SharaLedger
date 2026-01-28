import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Sequence,
	Audio,
} from 'remotion';
import React from 'react';
import { useMemo } from 'react';

const COLORS = {
	primary: '#6366f1',
	secondary: '#8b5cf6',
	accent: '#f59e0b',
	dark: '#0f172a',
	light: '#f8fafc',
	success: '#10b981',
	warning: '#f59e0b',
	info: '#3b82f6',
};

// Particle component for visual effects
const ParticleField: React.FC<{ seed: number }> = ({ seed }) => {
	const { width, height } = useVideoConfig();
	const particles = useMemo(() => {
		return Array.from({ length: 50 }, (_, i) => ({
			x: Math.random() * width,
			y: Math.random() * height,
			size: Math.random() * 4 + 2,
			speed: Math.random() * 0.5 + 0.2,
			delay: i * 2,
		}));
	}, [width, height]);

	return (
		<AbsoluteFill style={{ overflow: 'hidden' }}>
			{particles.map((p, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: p.x,
						top: p.y,
						width: p.size,
						height: p.size,
						borderRadius: '50%',
						background: `rgba(99, 102, 241, ${0.3 + (i % 3) * 0.2})`,
						filter: 'blur(1px)',
					}}
				/>
			))}
		</AbsoluteFill>
	);
};

// Animated gradient background
const AnimatedBackground: React.FC<{ intensity: number }> = ({ intensity }) => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	const hue = (frame * 0.5) % 360;
	const gradientAngle = (frame * 0.3) % 360;

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(${gradientAngle}deg,
					hsl(${hue}, 70%, 8%),
					hsl(${hue + 40}, 60%, 12%),
					hsl(${hue + 80}, 70%, 8%)
				)`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					background: `radial-gradient(circle at 50% 50%,
						hsla(${hue + 20}, 80%, 60%, ${intensity * 0.1}),
						transparent 60%
					)`,
					animation: 'pulse 4s ease-in-out infinite',
				}}
			/>
		</AbsoluteFill>
	);
};

// Cinematic title component
const CinematicTitle: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const titleScale = spring({
		frame,
		fps,
		config: { mass: 2, damping: 20, stiffness: 80 },
		delay: 30,
	});

	const titleOpacity = Math.min(1, Math.max(0, (frame - 20) / 20));
	const subtitleOpacity = Math.min(1, Math.max(0, (frame - 50) / 20));

	const scaleValue = 0.8 + titleScale * 0.2;

	return (
		<div
			style={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: `translate(-50%, -50%) scale(${scaleValue})`,
				textAlign: 'center',
				opacity: titleOpacity,
			}}
		>
			<h1
				style={{
					fontSize: '120px',
					fontWeight: 900,
					color: 'white',
					margin: 0,
					textShadow: `
						0 0 80px rgba(99, 102, 241, 0.8),
						0 0 40px rgba(139, 92, 246, 0.6),
						0 0 20px rgba(99, 102, 241, 0.4)
					`,
					letterSpacing: '-0.02em',
					lineHeight: 1.1,
				}}
			>
				VERSOLL
			</h1>
			<h1
				style={{
					fontSize: '120px',
					fontWeight: 900,
					background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.accent})`,
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text',
					margin: 0,
					letterSpacing: '-0.02em',
					lineHeight: 1.1,
				}}
			>
				BOOKS
			</h1>

			<div
				style={{
					marginTop: 40,
					opacity: subtitleOpacity,
				}}
			>
				<p
					style={{
						fontSize: '32px',
						color: 'white',
						margin: 0,
						fontWeight: 300,
						letterSpacing: '0.1em',
						textTransform: 'uppercase',
					}}
				>
					The Future of Accounting
				</p>
				<div
					style={{
						width: '200px',
						height: '4px',
						background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
						margin: '30px auto',
						borderRadius: 2,
						boxShadow: `0 0 20px ${COLORS.primary}`,
					}}
				/>
			</div>
		</div>
	);
};

// Feature card component
const FeatureCard: React.FC<{
	title: string;
	description: string;
	icon: string;
	index: number;
	delay: number;
	color: string;
}> = ({ title, description, icon, index, delay, color }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const cardDelay = delay + index * 15;
	const cardScale = spring({
		frame,
		fps,
		config: { mass: 1.5, damping: 20, stiffness: 100 },
		delay: cardDelay,
	});

	const cardOpacity = Math.min(1, Math.max(0, (frame - cardDelay) / 15));
	const iconRotation = spring({
		frame,
		fps,
		config: { mass: 2, damping: 15, stiffness: 80 },
		delay: cardDelay + 10,
	});

	return (
		<div
			style={{
				transform: `scale(${cardScale})`,
				opacity: cardOpacity,
				height: '100%',
			}}
		>
			<div
				style={{
					height: '100%',
					background: 'rgba(15, 23, 42, 0.8)',
					backdropFilter: 'blur(20px)',
					borderRadius: 24,
					padding: 40,
					border: `2px solid ${color}30`,
					boxShadow: `
						0 20px 60px rgba(0, 0, 0, 0.5),
						0 0 40px ${color}20,
						inset 0 1px 0 rgba(255, 255, 255, 0.1)
					`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					textAlign: 'center',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '4px',
						background: `linear-gradient(90deg, ${color}, ${color}80, ${color})`,
					}}
				/>
				<div
					style={{
						fontSize: '64px',
						marginBottom: 20,
						transform: `rotate(${iconRotation * 360}deg)`,
						filter: `drop-shadow(0 0 20px ${color})`,
					}}
				>
					{icon}
				</div>
				<h3
					style={{
						fontSize: '28px',
						fontWeight: 700,
						color: 'white',
						margin: '0 0 12px 0',
					}}
				>
					{title}
				</h3>
				<p
					style={{
						fontSize: '16px',
						color: 'rgba(255, 255, 255, 0.7)',
						margin: 0,
						lineHeight: 1.6,
					}}
				>
					{description}
				</p>
			</div>
		</div>
	);
};

// Features grid section
const FeaturesSection: React.FC = () => {
	const frame = useCurrentFrame();

	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				padding: '60px 100px',
			}}
		>
			<div style={{ marginBottom: 40 }}>
				<h2
					style={{
						fontSize: '48px',
						fontWeight: 800,
						color: 'white',
						margin: '0 0 16px 0',
						textShadow: '0 0 40px rgba(99, 102, 241, 0.5)',
					}}
				>
					Powerful Features
				</h2>
				<p
					style={{
						fontSize: '18px',
						color: 'rgba(255, 255, 255, 0.6)',
						margin: 0,
					}}
				>
					Built for modern Indian businesses
				</p>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, 1fr)',
					gap: 30,
					flex: 1,
				}}
			>
				<FeatureCard
					title="TDS Calculation"
					description="Automated tax deduction with complex threshold handling and comprehensive reporting"
					icon="🧮"
					index={0}
					delay={0}
					color={COLORS.primary}
				/>
				<FeatureCard
					title="E-Way Bills"
					description="Seamless GST-compliant logistics with real-time tracking and validation"
					icon="🚚"
					index={1}
					delay={0}
					color={COLORS.success}
				/>
				<FeatureCard
					title="Banking Reconciliation"
					description="Smart AI-powered transaction categorization with 90%+ accuracy"
					icon="🏦"
					index={2}
					delay={0}
					color={COLORS.info}
				/>
				<FeatureCard
					title="Point of Sale"
					description="Complete retail management with inventory tracking and analytics"
					icon="🛒"
					index={0}
					delay={15}
					color={COLORS.accent}
				/>
				<FeatureCard
					title="GST Reports"
					description="Comprehensive GSTR-1, GSTR-2, and GSTR-3B generation with export options"
					icon="📊"
					index={1}
					delay={15}
					color={COLORS.secondary}
				/>
				<FeatureCard
					title="Business Events"
					description="Real-time event logging and insights for informed decision-making"
					icon="📈"
					index={2}
					delay={15}
					color={COLORS.warning}
				/>
			</div>
		</div>
	);
};

// Call to action section
const CallToAction: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const ctaScale = spring({
		frame,
		fps,
		config: { mass: 2, damping: 15, stiffness: 60 },
		delay: 0,
	});

	const ctaOpacity = Math.min(1, Math.max(0, (frame - 0) / 20));
	const pulseOpacity = 0.7 + Math.sin(frame * 0.1) * 0.3;

	return (
		<div
			style={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: `translate(-50%, -50%) scale(${ctaScale})`,
				opacity: ctaOpacity,
				textAlign: 'center',
				width: '100%',
			}}
		>
			<div
				style={{
					fontSize: '16px',
					color: COLORS.primary,
					fontWeight: 600,
					letterSpacing: '0.2em',
					textTransform: 'uppercase',
					marginBottom: 30,
				}}
			>
				Ready to Transform Your Business?
			</div>

			<h1
				style={{
					fontSize: '72px',
					fontWeight: 900,
					color: 'white',
					margin: '0 0 20px 0',
					textShadow: '0 0 60px rgba(99, 102, 241, 0.6)',
				}}
			>
				Start Your Journey Today
			</h1>

			<p
				style={{
					fontSize: '24px',
					color: 'rgba(255, 255, 255, 0.7)',
					margin: '0 0 60px 0',
					maxWidth: 600,
					marginLeft: 'auto',
					marginRight: 'auto',
				}}
			>
				Join thousands of businesses already using Versoll Books
			</p>

			<div
				style={{
					display: 'inline-block',
					padding: '20px 60px',
					background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
					borderRadius: 60,
					fontSize: '28px',
					fontWeight: 700,
					color: 'white',
					boxShadow: `
						0 20px 40px rgba(99, 102, 241, 0.4),
						0 0 60px ${COLORS.primary}80
					`,
					opacity: pulseOpacity,
					transition: 'all 0.3s ease',
				}}
			>
				Get Started Free
			</div>

			<div
				style={{
					marginTop: 60,
					display: 'flex',
					gap: 60,
					justifyContent: 'center',
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<div
						style={{
							fontSize: '48px',
							fontWeight: 800,
							color: 'white',
							marginBottom: 8,
						}}
					>
						50K+
					</div>
					<div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
						Active Users
					</div>
				</div>
				<div style={{ textAlign: 'center' }}>
					<div
						style={{
							fontSize: '48px',
							fontWeight: 800,
							color: 'white',
							marginBottom: 8,
						}}
					>
						99.9%
					</div>
					<div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
						Uptime
					</div>
				</div>
				<div style={{ textAlign: 'center' }}>
					<div
						style={{
							fontSize: '48px',
							fontWeight: 800,
							color: 'white',
							marginBottom: 8,
						}}
					>
						24/7
					</div>
					<div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
						Support
					</div>
				</div>
			</div>
		</div>
	);
};

// Main video component
export const VideoReveal: React.FC = () => {
	const { width, height } = useVideoConfig();

	return (
		<AbsoluteFill style={{ width, height, background: COLORS.dark }}>
			{/* Intro Section */}
			<Sequence from={0} durationInFrames={90}>
				<AnimatedBackground intensity={1} />
				<ParticleField seed={42} />
				<CinematicTitle />
			</Sequence>

			{/* Features Section */}
			<Sequence from={90} durationInFrames={150}>
				<AnimatedBackground intensity={0.6} />
				<ParticleField seed={123} />
				<FeaturesSection />
			</Sequence>

			{/* Call to Action Section */}
			<Sequence from={240} durationInFrames={60}>
				<AnimatedBackground intensity={1} />
				<ParticleField seed={789} />
				<CallToAction />
			</Sequence>
		</AbsoluteFill>
	);
};

export default VideoReveal;
