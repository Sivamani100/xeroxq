import React from 'react';
import { cn } from '@/lib/utils';
import {
	LucideIcon,
	PlusIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

type ContactInfoProps = React.ComponentProps<'div'> & {
	icon: LucideIcon;
	label: string;
	value: string;
};

type ContactCardProps = React.ComponentProps<'div'> & {
	// Content props
	title?: string;
	description?: string;
	contactInfo?: ContactInfoProps[];
	formSectionClassName?: string;
};

export function ContactCard({
	title = 'Contact Us',
	description = 'Reach out to us for any help or to add your xerox shop to our network in Andhra Pradesh. We are here to help you.',
	contactInfo,
	className,
	formSectionClassName,
	children,
	...props
}: ContactCardProps) {
	return (
		<motion.div
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={{
				visible: {
					transition: {
						staggerChildren: 0.1
					}
				}
			}}
			className={cn(
				'bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] relative grid h-full w-full md:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-visible',
				className,
			)}
		>
			<PlusIcon className="absolute -top-3 -left-3 h-5 w-5 text-[#171717] dark:text-[#EDEDED] hover:text-[#FB432C] transition-colors cursor-default" strokeWidth={2.5} />
			<PlusIcon className="absolute -top-3 -right-3 h-5 w-5 text-[#171717] dark:text-[#EDEDED] hover:text-[#FB432C] transition-colors cursor-default" strokeWidth={2.5} />
			<PlusIcon className="absolute -bottom-3 -left-3 h-5 w-5 text-[#171717] dark:text-[#EDEDED] hover:text-[#FB432C] transition-colors cursor-default" strokeWidth={2.5} />
			<PlusIcon className="absolute -right-3 -bottom-3 h-5 w-5 text-[#171717] dark:text-[#EDEDED] hover:text-[#FB432C] transition-colors cursor-default" strokeWidth={2.5} />

			<div className="flex flex-col justify-between lg:col-span-2">
				<div className="relative h-full space-y-6 px-6 py-10 md:p-12">
					<motion.div
						variants={{
							hidden: { opacity: 0, y: 20 },
							visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
						}}
						className="space-y-4"
					>
						<h1 className="text-3xl font-semibold md:text-5xl text-[#171717] dark:text-[#EDEDED] tracking-tight leading-tight">
							{title}
						</h1>
						<p className="text-[#525252] dark:text-[#A1A1A6] max-w-xl text-sm md:text-base font-normal leading-relaxed">
							{description}
						</p>
					</motion.div>

					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4 md:pt-8">
						{contactInfo?.map((info, index) => (
							<motion.div
								key={index}
								variants={{
									hidden: { opacity: 0, scale: 0.95, y: 10 },
									visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0.3 } }
								}}
							>
								<ContactInfo {...info} />
							</motion.div>
						))}
					</div>
				</div>
			</div>

			<motion.div
				variants={{
					hidden: { opacity: 0, x: 20 },
					visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
				}}
				className={cn(
					'bg-[#F4F4F5] dark:bg-[#232325] flex h-full w-full items-center border-t border-[#171717]/[0.08] dark:border-white/[0.08] p-6 md:p-10 md:col-span-1 md:border-t-0 md:border-l rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none',
					formSectionClassName,
				)}
			>
				{children}
			</motion.div>
		</motion.div>
	);
}

function ContactInfo({
	icon: Icon,
	label,
	value,
	className,
	...props
}: ContactInfoProps) {
	return (
		<div className={cn('flex items-start gap-3.5 py-2 group', className)} {...props}>
			<div className="bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] rounded-lg p-3 group-hover:bg-[#FB432C] group-hover:text-white transition-colors">
				<Icon className="h-5 w-5" />
			</div>
			<div className="space-y-0.5">
				<p className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] uppercase tracking-wider">{label}</p>
				<p className="text-sm font-normal text-[#525252] dark:text-[#A1A1A6] tracking-tight">{value}</p>
			</div>
		</div>
	);
}
