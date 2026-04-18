'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ConnectButton } from './ConnectButton'

export function Navbar() {
	return (
		<nav className="flex items-center justify-between px-6 border-b border-[#AFA9EC]/20 bg-[#26215C]">
		<Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
			<div style={{ width: '140px', height: '140px', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
				<Image
					src="/logo.png"
					alt="ThothOrigin"
					fill
					style={{ objectFit: 'contain', transform: 'scale(1.25)', transformOrigin: 'center' }}
				/>
			</div>
			<div>
				<div className="text-white font-medium text-sm">ThothOrigin</div>
				<div className="text-[#BA7517] text-xs">Blockchain proof of anteriority</div>
			</div>
		</Link>
			<div className="flex items-center gap-6">
				<Link href="/deposit" className="text-[#CECBF6] text-sm hover:text-white transition-colors">
					Deposit
				</Link>
				<Link href="/verify" className="text-[#CECBF6] text-sm hover:text-white transition-colors">
					Verify
				</Link>
				<Link href="/dashboard" className="text-[#CECBF6] text-sm hover:text-white transition-colors">
					My manuscripts
				</Link>
				<ConnectButton />
			</div>
		</nav>
	)
}