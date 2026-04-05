"use client";

import { cn } from '@/lib/utils';
import React from 'react';

type FeatureType = {
	title: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	description: string;
};

type FeatureCardProps = React.ComponentProps<'div'> & {
	feature: FeatureType;
};

export function FeatureCard({ feature, className, ...props }: FeatureCardProps) {
	// Generate random pattern for the grid highlights only on the client to avoid hydration mismatch
	const [p, setP] = React.useState<number[][]>([]);

	React.useEffect(() => {
		setP(genRandomPattern());
	}, []);

	return (
		<div className={cn('relative overflow-hidden p-8 group transition-all duration-500 bg-white hover:bg-black group', className)} {...props}>
			{/* Grid Pattern Overlay */}
			<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)] group-hover:opacity-20 transition-opacity duration-500">
				<div className="from-black/5 to-black/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
					<GridPattern
						width={20}
						height={20}
						x="-12"
						y="4"
						squares={p}
						className="fill-black/5 stroke-black/10 absolute inset-0 h-full w-full mix-blend-overlay group-hover:fill-white/10 group-hover:stroke-white/20"
					/>
				</div>
			</div>
			
			<div className="relative z-10">
				<feature.icon className="text-brand-primary group-hover:text-white size-6 transition-colors duration-500" strokeWidth={1.5} aria-hidden />
				<h3 className="mt-12 text-sm md:text-[15px] font-bold tracking-tight text-black group-hover:text-white transition-colors duration-500 uppercase">{feature.title}</h3>
				<p className="text-gray-500 group-hover:text-gray-400 relative z-20 mt-3 text-[13px] font-medium leading-relaxed transition-colors duration-500 tracking-tight">{feature.description}</p>
			</div>

			{/* Corner Accent Decor */}
			<div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/[0.03] to-transparent pointer-events-none group-hover:from-white/5" />
		</div>
	);
}

function GridPattern({
	width,
	height,
	x,
	y,
	squares,
	...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
	const patternId = React.useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
			{squares && (
				<svg x={x} y={y} className="overflow-visible">
					{squares.map(([x, y], index) => (
						<rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
					))}
				</svg>
			)}
		</svg>
	);
}

function genRandomPattern(length?: number): number[][] {
	length = length ?? 5;
	return Array.from({ length }, () => [
		Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
		Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
	]);
}
