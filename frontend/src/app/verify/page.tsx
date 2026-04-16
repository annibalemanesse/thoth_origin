'use client'

import { useState, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/constants'
import { generateCertificate } from '@/utils/certificate'

type Tab = 'file' | 'hash' | 'tokenId'

type Manuscript = {
	author: string
	archived: boolean
	hasParent: boolean
	timestamp: bigint
	tokenId: bigint
	hash: string
	previousTokenId: bigint
	title: string
}

export default function VerifyPage() {
	const [tab, setTab] = useState<Tab>('file')
	const [hashInput, setHashInput] = useState('')
	const [tokenIdInput, setTokenIdInput] = useState('')
	const [computedHash, setComputedHash] = useState<`0x${string}` | null>(null)
	const [isHashing, setIsHashing] = useState(false)
	const [fileName, setFileName] = useState('')
	const [searchHash, setSearchHash] = useState<`0x${string}` | null>(null)
	const [searchTokenId, setSearchTokenId] = useState<bigint | null>(null)

	const { data: manuscriptByHash, isError: isHashError } = useReadContract({
		address: CONTRACT_ADDRESS,
		abi: CONTRACT_ABI,
		functionName: 'getManuscriptByHash',
		args: [searchHash!],
		query: { enabled: !!searchHash }
	})

	const { data: manuscriptByTokenId, isError: isTokenIdError } = useReadContract({
		address: CONTRACT_ADDRESS,
		abi: CONTRACT_ABI,
		functionName: 'getManuscriptByTokenId',
		args: [searchTokenId!],
		query: { enabled: searchTokenId !== null }
	})

	const manuscript = (searchHash ? manuscriptByHash : manuscriptByTokenId) as Manuscript | undefined
	const isError = searchHash ? isHashError : isTokenIdError
	const hasSearched = searchHash !== null || searchTokenId !== null

	const computeHash = async (f: File): Promise<`0x${string}`> => {
		const buffer = await f.arrayBuffer()
		const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		return ('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`
	}

	const handleFile = useCallback(async (f: File) => {
		setIsHashing(true)
		setFileName(f.name)
		const h = await computeHash(f)
		setComputedHash(h)
		setIsHashing(false)
		setSearchHash(h)
		setSearchTokenId(null)
	}, [])

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		const f = e.dataTransfer.files[0]
		if (f) handleFile(f)
	}, [handleFile])

	const handleHashSearch = () => {
		if (!hashInput) return
		setSearchHash(hashInput as `0x${string}`)
		setSearchTokenId(null)
	}

	const handleTokenIdSearch = () => {
		if (!tokenIdInput) return
		setSearchTokenId(BigInt(tokenIdInput))
		setSearchHash(null)
	}

	const formatDate = (timestamp: bigint) =>
		new Date(Number(timestamp) * 1000).toLocaleDateString('en-GB', {
			day: '2-digit', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		})

	const tabs: { key: Tab, label: string }[] = [
		{ key: 'file', label: 'By file' },
		{ key: 'hash', label: 'By hash' },
		{ key: 'tokenId', label: 'By token ID' },
	]

	return (
		<div className="min-h-screen bg-[#1a1730] py-12 px-6">
			<div className="max-w-xl mx-auto">
				<h1 className="text-2xl font-medium text-white mb-2">Verify a manuscript</h1>
				<p className="text-[#CECBF6]/60 text-sm mb-8">
					Check if a manuscript has been registered on the blockchain. No wallet required.
				</p>

				{/* Tabs */}
				<div className="flex gap-1 bg-[#26215C]/40 rounded-lg p-1 mb-6">
					{tabs.map(t => (
						<button
							key={t.key}
							onClick={() => {
								setTab(t.key)
								setSearchHash(null)
								setSearchTokenId(null)
								setComputedHash(null)
								setFileName('')
							}}
							className={`flex-1 py-2 rounded-md text-sm transition-colors cursor-pointer
								${tab === t.key
									? 'bg-[#26215C] text-white font-medium'
									: 'text-[#CECBF6]/50 hover:text-[#CECBF6]'
								}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Tab: File */}
				{tab === 'file' && (
					<div
						onDrop={handleDrop}
						onDragOver={e => e.preventDefault()}
						className="border-2 border-dashed border-[#AFA9EC]/30 hover:border-[#AFA9EC]/60 rounded-xl p-10 text-center transition-colors"
					>
						<label className="cursor-pointer block">
							<div className="text-3xl mb-3">📄</div>
							<div className="text-white font-medium text-sm mb-1">
								{isHashing ? 'Computing SHA-256...' : fileName ? fileName : 'Drop your file here'}
							</div>
							<div className="text-[#CECBF6]/50 text-xs mb-4">or click to browse · any format</div>
							<input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
							{!isHashing && (
								<span className="px-4 py-2 rounded-lg bg-[#26215C] text-[#CECBF6] text-xs">Browse files</span>
							)}
						</label>
						{computedHash && (
							<div className="mt-4 text-left bg-[#26215C]/40 rounded-lg p-3">
								<div className="text-[#CECBF6]/50 text-xs mb-1">Computed hash</div>
								<div className="font-mono text-xs text-[#AFA9EC] break-all">{computedHash.slice(0, 42)}...</div>
							</div>
						)}
					</div>
				)}

				{/* Tab: Hash */}
				{tab === 'hash' && (
					<div className="space-y-3">
						<input
							type="text"
							value={hashInput}
							onChange={e => setHashInput(e.target.value)}
							placeholder="0x..."
							className="w-full bg-[#26215C]/40 border border-[#AFA9EC]/20 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-[#CECBF6]/30 focus:outline-none focus:border-[#AFA9EC]/60"
						/>
						<button
							onClick={handleHashSearch}
							disabled={!hashInput}
							className="w-full py-3 rounded-lg bg-[#BA7517] text-white font-medium text-sm hover:bg-[#EF9F27] transition-colors cursor-pointer disabled:opacity-50"
						>
							Verify
						</button>
					</div>
				)}

				{/* Tab: Token ID */}
				{tab === 'tokenId' && (
					<div className="space-y-3">
						<input
							type="text"
							inputMode="numeric"
							value={tokenIdInput}
							onChange={e => {
								const val = e.target.value
								if (val === '' || /^\d+$/.test(val)) setTokenIdInput(val)
							}}
							placeholder="Token ID (e.g. 1)"
							className="w-full bg-[#26215C]/40 border border-[#AFA9EC]/20 rounded-lg px-4 py-3 text-white text-sm placeholder-[#CECBF6]/30 focus:outline-none focus:border-[#AFA9EC]/60"
						/>
						<button
							onClick={handleTokenIdSearch}
							disabled={!tokenIdInput}
							className="w-full py-3 rounded-lg bg-[#BA7517] text-white font-medium text-sm hover:bg-[#EF9F27] transition-colors cursor-pointer disabled:opacity-50"
						>
							Verify
						</button>
					</div>
				)}

				{/* Result */}
				{hasSearched && (
					<div className="mt-6">
						{isError || !manuscript ? (
							<div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
								<div className="text-2xl mb-2">✗</div>
								<p className="text-red-400 font-medium text-sm mb-1">Not registered</p>
								<p className="text-[#CECBF6]/50 text-xs">This manuscript has not been found on the blockchain.</p>
							</div>
						) : (
							<div className="bg-[#E1F5EE]/10 border border-[#1D9E75]/30 rounded-xl p-6">
								<div className="flex items-center gap-2 mb-4">
									<div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs">✓</div>
									<p className="text-[#1D9E75] font-medium text-sm">Registered on the blockchain</p>
								</div>
								<div className="space-y-3">
									<div>
										<div className="text-[#CECBF6]/50 text-xs mb-1">Title</div>
										<div className="text-white text-sm font-medium">{manuscript.title}</div>
									</div>
									<div>
										<div className="text-[#CECBF6]/50 text-xs mb-1">Author</div>
										<div className="font-mono text-xs text-[#AFA9EC]">{manuscript.author}</div>
									</div>
									<div>
										<div className="text-[#CECBF6]/50 text-xs mb-1">Registration date</div>
										<div className="text-white text-sm">{formatDate(manuscript.timestamp)}</div>
									</div>
									<div>
										<div className="text-[#CECBF6]/50 text-xs mb-1">Token ID</div>
										<div className="text-white text-sm">#{manuscript.tokenId.toString()}</div>
									</div>
									<div>
										<div className="text-[#CECBF6]/50 text-xs mb-1">Hash</div>
										<div className="font-mono text-xs text-[#AFA9EC] break-all">{manuscript.hash}</div>
									</div>
									{manuscript.hasParent && (
										<div>
											<div className="text-[#CECBF6]/50 text-xs mb-1">Previous version</div>
											<div className="text-white text-sm">#{manuscript.previousTokenId.toString()}</div>
										</div>
									)}
									<div>
										<div className="text-[#CECBF6]/50 text-xs mb-1">Status</div>
										{manuscript.archived ? (
											<span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1EFE8', color: '#444441' }}>Archived</span>
										) : (
											<span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#0F6E56' }}>Active</span>
										)}
									</div>
								</div>
								<button onClick={() => generateCertificate(manuscript)} className="...">
									Download certificate
								</button>
							</div>
						)}
					</div>
				)}

				<div className="mt-12 flex items-center justify-center gap-3 opacity-40">
					<span className="text-[#BA7517] text-xs tracking-widest">𓅱𓇋𓏏𓅭𓏏𓈖</span>
					<span className="text-[#CECBF6] text-xs italic">Djéhouty · guardian of writings</span>
				</div>
			</div>
		</div>
	)
}