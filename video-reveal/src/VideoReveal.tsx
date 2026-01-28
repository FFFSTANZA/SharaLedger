import { AbsoluteFill, useVideoConfig } from 'remotion';
import React from 'react';

export const VideoReveal = () => {
	const { width, height } = useVideoConfig();

	return (
		<AbsoluteFill style={{ width, height, background: 'white' }}>
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					fontFamily: 'Inter, sans-serif',
				}}
			>
				<div style={{ flex: 1, display: 'flex' }}>
					<div
						style={{
							flex: 1,
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							borderRadius: 30,
							margin: 40,
							boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								textAlign: 'center',
								color: 'white',
								padding: 40,
							}}
						>
							<h1 style={{ fontSize: '4em', margin: 0, fontWeight: 700 }}>
								Versoll Books
							</h1>
							<p style={{ fontSize: '1.5em', margin: '20px 0 0 0', opacity: 0.9 }}>
								The Complete Accounting Solution
							</p>
							<p style={{ fontSize: '1.2em', margin: '10px 0 0 0', opacity: 0.8 }}>
								Powerful • Elegant • Built for Indian Businesses
							</p>
						</div>
					</div>
				</div>

				<div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
					<div
						style={{
							flex: 1,
							background: 'white',
							display: 'flex',
							flexDirection: 'column',
							padding: 20,
						}}
					>
						<div
							style={{
								height: 250,
								marginBottom: 20,
								background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
								borderRadius: 20,
								boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									textAlign: 'center',
									color: 'white',
									zIndex: 2,
								}}
							>
								<h3 style={{ fontSize: '2em', margin: '0 0 10px 0', fontWeight: 700 }}>TDS Calculation</h3>
								<p style={{ fontSize: '1.1em', margin: 0 }}>Automated Tax Deduction</p>
							</div>
						</div>

						<div
							style={{
								height: 250,
								background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
								borderRadius: 20,
								boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									textAlign: 'center',
									color: 'white',
									zIndex: 2,
								}}
							>
								<h3 style={{ fontSize: '2em', margin: '0 0 10px 0', fontWeight: 700 }}>E-Way Bills</h3>
								<p style={{ fontSize: '1.1em', margin: 0 }}>GST Compliant Logistics</p>
							</div>
						</div>
					</div>

					<div
						style={{
							flex: 1,
							background: 'white',
							display: 'flex',
							flexDirection: 'column',
							padding: 20,
						}}
					>
						<div
							style={{
								height: 250,
								marginBottom: 20,
								background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
								borderRadius: 20,
								boxShadow: '0 10px 30px rgba(250, 112, 154, 0.3)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									textAlign: 'center',
									color: 'white',
									zIndex: 2,
								}}
							>
								<h3 style={{ fontSize: '2em', margin: '0 0 10px 0', fontWeight: 700 }}>Point of Sale</h3>
								<p style={{ fontSize: '1.1em', margin: 0 }}>Seamless Retail Experience</p>
							</div>
						</div>

						<div
							style={{
								height: 250,
								background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
								borderRadius: 20,
								boxShadow: '0 10px 30px rgba(168, 237, 234, 0.3)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									textAlign: 'center',
									color: '#1f2937',
									zIndex: 2,
								}}
							>
								<h3 style={{ fontSize: '2em', margin: '0 0 10px 0', fontWeight: 700 }}>Business Events</h3>
								<p style={{ fontSize: '1.1em', margin: 0 }}>Real-time Insights</p>
							</div>
						</div>
					</div>
				</div>

				<div style={{ flex: 1, display: 'flex' }}>
					<div
						style={{
							flex: 1,
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							borderRadius: 30,
							margin: 40,
							boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'column',
						}}
					>
						<h2 style={{ fontSize: '2.5em', color: 'white', textAlign: 'center', marginBottom: 20 }}>
							More Powerful Features
						</h2>
						<div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '3em', marginBottom: 10 }}>🏦</div>
								<p style={{ color: 'white', fontSize: '1.2em' }}>Smart Banking Reconciliation</p>
							</div>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '3em', marginBottom: 10 }}>📊</div>
								<p style={{ color: 'white', fontSize: '1.2em' }}>GST Reports</p>
							</div>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '3em', marginBottom: 10 }}>📱</div>
								<p style={{ color: 'white', fontSize: '1.2em' }}>Cloud Access</p>
							</div>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '3em', marginBottom: 10 }}>🔒</div>
								<p style={{ color: 'white', fontSize: '1.2em' }}>Enterprise Security</p>
							</div>
						</div>
						
						<p style={{ color: '#fbbf24', fontSize: '1.3em', marginTop: 40, textAlign: 'center', fontWeight: 600 }}>
							Streamlined Perfection • Built for Indian Businesses • Start Your Journey Today
						</p>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export default VideoReveal;