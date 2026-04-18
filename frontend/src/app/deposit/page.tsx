'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useConnection, useWriteContract, useWaitForTransactionReceipt, useChainId, useBlock } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/constants'
import { generateCertificate } from '@/utils/certificate'

type Step = 'file' | 'info' | 'confirm'

export default function DepositPage() {
	const ACCEPTED_FORMATS = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'text/plain',
		'application/epub+zip',
		'image/jpeg',
		'image/png',
		'image/tiff',
	]
	const MANUSCRIPT_REGISTERED_TOPIC = '0x78d2183b21e05f7a2f19af32e667731390e06ac07000c78cfc5b879407b962aa'
	const chainId = useChainId()
	const { address, isConnected } = useConnection()
	const [step, setStep] = useState<Step>('file')
	const [file, setFile] = useState<File | null>(null)
	const [hash, setHash] = useState<`0x${string}` | null>(null)
	const [title, setTitle] = useState('')
	const [previousTokenId, setPreviousTokenId] = useState('')
	const [isHashing, setIsHashing] = useState(false)
	const [dragOver, setDragOver] = useState(false)
	const [hasError, setHasError] = useState(false)
	const { mutate, data: txHash, isPending, error, reset } = useWriteContract()
	const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash })
	const { data: block } = useBlock({ blockNumber: receipt?.blockNumber, query: { enabled: !!receipt?.blockNumber } })
	const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null)
	const [blockTimestamp, setBlockTimestamp] = useState<bigint | null>(null)

	useEffect(() => {
		if (block?.timestamp) setBlockTimestamp(block.timestamp)
	}, [block?.timestamp])

	useEffect(() => {
		if (isSuccess && receipt) {
			setStep('confirm')
			const MANUSCRIPT_REGISTERED_TOPIC = '0x78d2183b21e05f7a2f19af32e667731390e06ac07000c78cfc5b879407b962aa'
			const log = receipt.logs.find(l =>
				l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
				l.topics[0].toLowerCase() === MANUSCRIPT_REGISTERED_TOPIC
			)
			if (log && log.topics[1]) {
				setMintedTokenId(BigInt(log.topics[1]))
			}
		}
	}, [isSuccess, receipt])

	useEffect(() => {
		if (error) setHasError(true)
	}, [error])

	const computeHash = async (f: File): Promise<`0x${string}`> => {
		const buffer = await f.arrayBuffer()
		const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
		return hashHex as `0x${string}`
	}

	const handleFile = useCallback(async (f: File) => {
		if (f.size > 50 * 1024 * 1024) {
			alert('File too large. Maximum size is 50 MB.')
			return
		}
		if (!ACCEPTED_FORMATS.includes(f.type)) {
			alert('Format not supported. Please upload a PDF, Word, TXT, EPUB or image file.')
			return
		}
		setFile(f)
		setIsHashing(true)
		const h = await computeHash(f)
		setHash(h)
		setIsHashing(false)
		setStep('info')
	}, [])

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setDragOver(false)
		const f = e.dataTransfer.files[0]
		if (f) handleFile(f)
	}, [handleFile])

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0]
		if (f) handleFile(f)
	}

	const handleSubmit = async () => {
		if (!hash || !title) return
		if (previousTokenId) {
			mutate({
				address: CONTRACT_ADDRESS,
				abi: CONTRACT_ABI,
				functionName: 'registerNewVersion',
				args: [hash as `0x${string}`, title, BigInt(previousTokenId)],
				gas: BigInt(500000),
			})
		} else {
			mutate({
				address: CONTRACT_ADDRESS,
				abi: CONTRACT_ABI,
				functionName: 'registerManuscript',
				args: [hash as `0x${string}`, title],
				gas: BigInt(500000),
			})
		}
	}

	const getErrorMessage = (error: unknown): string => {
		if (!error) return ''
		const message = (error as Error).message ?? ''

		const errors: Record<string, string> = {
			'OriginManuscriptNotFound': 'The previous version token ID does not exist.',
			'OriginManuscriptAlreadyArchived': 'The previous version is archived and cannot be versioned.',
			'Unauthorized': 'You are not the owner of this token.',
			'ManuscriptAlreadyExists': 'This file has already been registered on the blockchain.',
			'TitleEmpty': 'The title cannot be empty.',
			'TitleTooLong': 'The title exceeds 100 characters.',
			'Internal error': 'The previous version token ID does not exist or is invalid.',
		}

		console.log(error);
		const key = Object.keys(errors).find(k => message.includes(k))
		return key ? errors[key] : 'An error occurred. Please try again.'
	}

	if (!isConnected) {
		return (
			<div className="min-h-screen bg-[#1a1730] flex items-center justify-center">
				<div className="text-center">
					<div className="text-4xl mb-4">𓅭</div>
					<h2 className="text-white font-medium text-lg mb-2">Connect your wallet</h2>
					<p className="text-[#CECBF6]/60 text-sm">You need to connect your wallet to deposit a manuscript.</p>
					<div className="mt-6" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
						<appkit-button />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#1a1730] py-12 px-6 ">
			<div className="max-w-xl mx-auto px-4">
				<h1 className="text-2xl font-medium text-white mb-2">Deposit a manuscript</h1>
				<p className="text-[#CECBF6]/60 text-sm mb-8">Your file never leaves your browser — only its fingerprint is recorded on-chain.</p>

				{/* Steps */}
				<div className="flex items-center gap-2 mb-8">
					{(['file', 'info', 'confirm'] as Step[]).map((s, i) => (
						<div key={s} className="flex items-center gap-2">
							<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
								${step === s ? 'bg-[#26215C] text-[#CECBF6]' :
								(['file', 'info', 'confirm'].indexOf(step) > i) ? 'bg-[#1D9E75] text-white' :
								'bg-[#26215C]/40 text-[#CECBF6]/40'}`}>
								{(['file', 'info', 'confirm'].indexOf(step) > i) ? '✓' : i + 1}
							</div>
							<span className={`text-xs ${step === s ? 'text-white font-medium' : 'text-[#CECBF6]/40'}`}>
								{s === 'file' ? 'File' : s === 'info' ? 'Information' : 'Confirmation'}
							</span>
							{i < 2 && <div className="w-8 h-px bg-[#AFA9EC]/20 mx-1" />}
						</div>
					))}
				</div>

				{/* Step 1 — File */}
				{step === 'file' && (
					<div
						onDrop={handleDrop}
						onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
						onDragLeave={() => setDragOver(false)}
						className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
							${dragOver ? 'border-[#BA7517] bg-[#FAEEDA]/5' : 'border-[#AFA9EC]/30 hover:border-[#AFA9EC]/60'}`}
					>
						<label className="cursor-pointer block">
							<div className="text-3xl mb-3">📄</div>
							<div className="text-white font-medium text-sm mb-1">
								{isHashing ? 'Computing SHA-256...' : 'Drop your file here'}
							</div>
							<div className="text-[#CECBF6]/50 text-xs mb-4">or click to browse · PDF, Word, TXT, EPUB, images · max 50 MB</div>
							<input type="file" className="hidden" onChange={handleFileInput} accept=".pdf,.doc,.docx,.txt,.epub,.jpg,.jpeg,.png,.tiff"/>
							{!isHashing && (
								<span className="px-4 py-2 rounded-lg bg-[#26215C] text-[#CECBF6] text-xs">
									Browse files
								</span>
							)}
						</label>
					</div>
				)}

				{/* Step 2 — Info */}
				{step === 'info' && !isSuccess && (
					<div className="space-y-5">
						{/* Hash preview */}
						<div className="bg-[#26215C]/40 border border-[#AFA9EC]/10 rounded-lg p-4">
							<div className="text-[#CECBF6]/50 text-xs mb-2">SHA-256 hash — computed locally</div>
							<div className="font-mono text-xs text-[#AFA9EC] break-all leading-relaxed">
								{hash?.slice(0, 42)}...
							</div>
							<div className="text-[#CECBF6]/40 text-xs mt-2">{file?.name} · {((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB</div>
						</div>

						{/* Title */}
						<div>
							<label className="text-[#CECBF6]/70 text-xs block mb-2">Title of the work *</label>
							<input
								type="text"
								value={title}
								onChange={e => setTitle(e.target.value)}
								placeholder="My novel — Version 1"
								maxLength={100}
								className="w-full bg-[#26215C]/40 border border-[#AFA9EC]/20 rounded-lg px-4 py-3 text-white text-sm placeholder-[#CECBF6]/30 focus:outline-none focus:border-[#AFA9EC]/60"
							/>
							<div className="text-[#CECBF6]/30 text-xs mt-1 text-right">{title.length}/100</div>
						</div>

						{/* Previous version */}
						<div>
							<label className="text-[#CECBF6]/70 text-xs block mb-2">Previous version token ID (optional)</label>
							<input
								type="text"
								inputMode="numeric"
								value={previousTokenId}
								onChange={e => {
									const val = e.target.value
									if (val === '' || /^\d+$/.test(val)) {
										setPreviousTokenId(val)
										setHasError(false)
										reset()
									}
								}}
								placeholder="Token ID of the previous version, if applicable"
								className="w-full bg-[#26215C]/40 border border-[#AFA9EC]/20 rounded-lg px-4 py-3 text-white text-sm placeholder-[#CECBF6]/30 focus:outline-none focus:border-[#AFA9EC]/60"
							/>
						</div>

						{/* Info box */}
						<div className="flex gap-3 items-start bg-[#EEEDFE]/10 border border-[#AFA9EC]/20 rounded-lg p-4">
							<span className="text-[#AFA9EC] text-sm">ℹ</span>
							<p className="text-[#CECBF6]/70 text-xs leading-relaxed">
								An ERC-721 NFT will be minted and sent to your wallet. This operation requires a Metamask confirmation and gas fees. The NFT is soulbound: non-transferable by design.
							</p>
						</div>

						{error && (
							<div className="flex gap-3 items-start bg-red-500/10 border border-red-500/30 rounded-lg p-4">
								<span className="text-red-400 text-sm">⚠</span>
								<p className="text-red-400 text-xs leading-relaxed">{getErrorMessage(error)}</p>
							</div>
						)}

						<button
							onClick={handleSubmit}
							disabled={!title || isPending || isConfirming || hasError}
							className="w-full py-3 rounded-lg bg-[#BA7517] text-white font-medium text-sm hover:bg-[#EF9F27] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
						>
							{isPending ? 'Waiting for confirmation...' :
							isConfirming ? 'Recording on blockchain...' :
							'Register on the blockchain'}
						</button>
					</div>
				)}

				{/* Confirmation */}
				{step === 'confirm' && (
					<div className="mt-6 bg-[#E1F5EE]/10 border border-[#1D9E75]/30 rounded-xl p-6 text-center">
						<div className="text-3xl mb-3">✅</div>
						<h3 className="text-white font-medium mb-1">Manuscript registered!</h3>
						<p className="text-[#CECBF6]/60 text-xs mb-4">Your proof of anteriority has been recorded on the blockchain.</p>
						{chainId === 11155111 && (
							<a
								href={`https://sepolia.etherscan.io/tx/${txHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#AFA9EC] text-xs hover:text-white"
							>
								View on Etherscan ↗
							</a>
						)}
						<Link
							href="/dashboard"
							className="block mx-auto mt-4 text-[#CECBF6]/50 text-xs hover:text-white transition-colors text-center"
						>
							View my manuscripts →
						</Link>
						<button
							onClick={() => {
								setStep('file')
								setFile(null)
								setHash(null)
								setTitle('')
								setPreviousTokenId('')
								setMintedTokenId(null)
								reset()
							}}
							className="block mx-auto mt-3 text-[#CECBF6]/50 text-xs hover:text-white transition-colors cursor-pointer"
						>
							← Deposit another manuscript
						</button>
						{isSuccess && mintedTokenId !== null && (
							<button
								onClick={() => generateCertificate({
									author: address!,
									archived: false,
									hasParent: !!previousTokenId,
									timestamp: blockTimestamp!,
									tokenId: mintedTokenId ?? BigInt(0),
									hash: hash!,
									previousTokenId: previousTokenId ? BigInt(previousTokenId) : BigInt(0),
									title: title,
								}, txHash)}
								disabled={!blockTimestamp}
								className="block mx-auto mt-4 px-4 py-2 rounded-lg bg-[#BA7517] text-white text-sm hover:bg-[#EF9F27] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Download certificate
							</button>
						)}
					</div>
				)}

				{/* Footer cartouche */}
				<div className="mt-12 flex items-center justify-center gap-3 opacity-40">
					<span className="text-[#BA7517] text-xs tracking-widest">𓅱𓇋𓏏𓅭𓏏𓈖</span>
					<span className="text-[#CECBF6] text-xs italic">Djéhouty · guardian of writings</span>
				</div>
			</div>
		</div>
	)
}
