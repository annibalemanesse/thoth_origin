'use client'

import Link from 'next/link'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/constants'

export default function Home() {
	const { data: totalSupply } = useReadContract({
		address: CONTRACT_ADDRESS,
		abi: CONTRACT_ABI,
		functionName: 'totalSupply',
	})
	return (
		<div className="min-h-screen bg-[#1a1730]">

			{/* Hero */}
			<section className="px-6 py-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
				<div>
					<div className="inline-block px-3 py-1 rounded-full bg-[#FAEEDA] text-[#633806] text-xs font-medium mb-6">
						Powered by Ethereum · Sepolia testnet
					</div>
					<h1 className="text-4xl font-semibold text-white leading-tight mb-4">
						Protect your works with an unforgeable proof
					</h1>
					<p className="text-[#CECBF6] text-base leading-relaxed mb-8">
						ThothOrigin timestamps your manuscript on the blockchain and delivers an NFT certificate of anteriority. No notary, no intermediary, in the tradition of Thoth, scribe of the gods.
					</p>
					<div className="flex gap-4 flex-wrap">
						<Link
							href="/deposit"
							className="px-6 py-3 rounded-lg bg-[#BA7517] text-white font-medium text-sm hover:bg-[#EF9F27] transition-colors"
						>
							Deposit a manuscript
						</Link>
						<Link
							href="/verify"
							className="px-6 py-3 rounded-lg border border-[#AFA9EC]/40 text-[#CECBF6] text-sm hover:border-[#AFA9EC] transition-colors"
						>
							Verify a hash
						</Link>
					</div>
				</div>

				{/* Cartouche */}
				<div className="flex flex-col items-center gap-4">
					<svg width="200" height="240" viewBox="0 0 200 240" fill="none">
						<rect x="60" y="1" width="80" height="10" rx="5" fill="#BA7517"/>
						<rect x="60" y="229" width="80" height="10" rx="5" fill="#BA7517"/>
						<rect x="1" y="10" width="198" height="220" rx="99" fill="none" stroke="#BA7517" strokeWidth="2"/>
						<rect x="7" y="16" width="186" height="208" rx="93" fill="none" stroke="#EF9F27" strokeWidth="0.8"/>
						<text x="100" y="52" textAnchor="middle" fontSize="28" fill="#BA7517">𓅭</text>
						<line x1="60" y1="66" x2="140" y2="66" stroke="#EF9F27" strokeWidth="0.5" opacity="0.6"/>
						<text x="72" y="98" textAnchor="middle" fontSize="22" fill="#EF9F27">𓅱</text>
						<text x="100" y="98" textAnchor="middle" fontSize="22" fill="#EF9F27">𓇋</text>
						<text x="128" y="98" textAnchor="middle" fontSize="22" fill="#EF9F27">𓏏</text>
						<text x="72" y="130" textAnchor="middle" fontSize="22" fill="#EF9F27">𓅭</text>
						<text x="100" y="130" textAnchor="middle" fontSize="22" fill="#EF9F27">𓏏</text>
						<text x="128" y="130" textAnchor="middle" fontSize="22" fill="#EF9F27">𓈖</text>
						<line x1="60" y1="144" x2="140" y2="144" stroke="#EF9F27" strokeWidth="0.5" opacity="0.6"/>
						<text x="100" y="163" textAnchor="middle" fontSize="11" fill="#BA7517" fontStyle="italic">THOT</text>
						<text x="100" y="212" textAnchor="middle" fontSize="9" fill="#534AB7" opacity="0.6" letterSpacing="2">· BLOCKCHAIN ·</text>
					</svg>
					<div className="text-center">
						<div className="text-[#BA7517] text-sm tracking-widest">𓅱𓇋𓏏𓅭𓏏𓈖</div>
						<div className="text-[#CECBF6]/60 text-xs italic mt-1">Djéhouty · scribe of the gods</div>
					</div>
				</div>
			</section>

			{/* Quote */}
			<section className="px-6 py-10 border-y border-[#AFA9EC]/10 bg-[#26215C]/30">
				<div className="max-w-3xl mx-auto flex gap-5 items-start">
					<div className="w-1 min-h-12 rounded-full bg-[#BA7517] flex-shrink-0 mt-1"/>
					<div>
						<p className="text-[#CECBF6] text-sm italic leading-relaxed">
							"Thoth was the scribe of the gods, guardian of the celestial archives. The one who recorded every act, every word, every work for eternity. ThothOrigin carries on this legacy on the blockchain."
						</p>
						<p className="text-[#BA7517] text-xs mt-2">Ancient Egyptian mythology · Pyramid Texts</p>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="px-6 py-16 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-[#26215C]/40 border border-[#AFA9EC]/10 rounded-xl p-6">
					<div className="w-9 h-9 rounded-lg bg-[#EEEDFE]/10 flex items-center justify-center mb-4 text-base">📄</div>
					<h3 className="text-white font-medium text-sm mb-2">Deposit in 3 clicks</h3>
					<p className="text-[#CECBF6]/70 text-sm leading-relaxed">Your file never leaves your browser. Only its cryptographic fingerprint is recorded on-chain.</p>
				</div>
				<div className="bg-[#26215C]/40 border border-[#AFA9EC]/10 rounded-xl p-6">
					<div className="w-9 h-9 rounded-lg bg-[#FAEEDA]/10 flex items-center justify-center mb-4 text-base">⭐</div>
					<h3 className="text-white font-medium text-sm mb-2">Certified NFT</h3>
					<p className="text-[#CECBF6]/70 text-sm leading-relaxed">Each deposit generates a unique ERC-721 NFT: your inalterable digital proof of ownership. Soulbound: non-transferable by design.</p>
				</div>
				<div className="bg-[#26215C]/40 border border-[#AFA9EC]/10 rounded-xl p-6">
					<div className="w-9 h-9 rounded-lg bg-[#E1F5EE]/10 flex items-center justify-center mb-4 text-base">✅</div>
					<h3 className="text-white font-medium text-sm mb-2">Public verification</h3>
					<p className="text-[#CECBF6]/70 text-sm leading-relaxed">Anyone can verify the authenticity of a hash, no wallet required. The proof is open and transparent.</p>
				</div>
			</section>

			{/* Stats */}
			<section className="px-6 pb-16 max-w-6xl mx-auto grid grid-cols-3 gap-6">
				<div className="bg-[#26215C]/20 rounded-lg p-5 text-center">
					<div className="text-2xl font-medium text-[#534AB7]">{totalSupply != null ? totalSupply.toString() : '—'}</div>
					<div className="text-[#CECBF6]/60 text-xs mt-1">Manuscripts deposited</div>
				</div>
				<div className="bg-[#26215C]/20 rounded-lg p-5 text-center">
					<div className="text-2xl font-medium text-[#BA7517]">~6€</div>
					<div className="text-[#CECBF6]/60 text-xs mt-1">Per certificate</div>
				</div>
				<div className="bg-[#26215C]/20 rounded-lg p-5 text-center">
					<div className="text-2xl font-medium text-[#534AB7]">100%</div>
					<div className="text-[#CECBF6]/60 text-xs mt-1">Decentralized</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-[#AFA9EC]/10 py-6 flex items-center justify-center gap-4">
				<div className="text-[#BA7517] text-sm tracking-widest opacity-50">𓅱𓇋𓏏𓅭𓏏𓈖</div>
				<div className="text-[#CECBF6]/40 text-xs italic">Djéhouty · scribe of the gods · guardian of writings</div>
				<div className="text-[#CECBF6]/40 text-xs">Ethereum Sepolia · ERC-721</div>
			</footer>

		</div>
	)
}
