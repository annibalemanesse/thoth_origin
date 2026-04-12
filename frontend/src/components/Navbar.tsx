'use client'

import Link from 'next/link'
import { ConnectButton } from './ConnectButton'

export function Navbar() {
	return (
		<nav className="flex items-center justify-between px-6 py-4 border-b border-[#AFA9EC]/20 bg-[#26215C]">
			<Link href="/" className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-lg bg-[#26215C] border border-[#BA7517] flex items-center justify-center text-sm">
					𓅭
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