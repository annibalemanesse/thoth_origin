'use client'

import { useConnection, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/constants'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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

type ManuscriptWithChildren = Manuscript & { children: ManuscriptWithChildren[] }

const buildTree = (manuscripts: readonly Manuscript[]): ManuscriptWithChildren[] => {
	const roots = manuscripts.filter(m => !m.hasParent)
	const buildNode = (m: Manuscript): ManuscriptWithChildren => ({
		...m,
		children: manuscripts
			.filter(child => child.hasParent && child.previousTokenId === m.tokenId)
			.map(buildNode)
	})
	return roots.map(buildNode)
}

const isChainActive = (node: ManuscriptWithChildren): boolean => {
	if (!node.archived) return true
	return node.children.some(isChainActive)
}

export default function DashboardPage() {
	const { address, isConnected } = useConnection()
	const [pendingTokenId, setPendingTokenId] = useState<bigint | null>(null)

	const { data: manuscripts, refetch } = useReadContract({
		address: CONTRACT_ADDRESS,
		abi: CONTRACT_ABI,
		functionName: 'getManuscriptsByAuthor',
		args: [address!],
		query: { enabled: !!address }
	})

	const { mutate, data: txHash, isPending, reset } = useWriteContract()
	const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

	useEffect(() => {
		if (isSuccess) {
			refetch()
			setPendingTokenId(null)
			reset()
		}
	}, [isSuccess])

	const handleArchive = (tokenId: bigint) => {
		setPendingTokenId(tokenId)
		mutate({
			address: CONTRACT_ADDRESS,
			abi: CONTRACT_ABI,
			functionName: 'archiveManuscript',
			args: [tokenId],
			gas: BigInt(500000),
		})
	}

	const handleUnarchive = (tokenId: bigint) => {
		setPendingTokenId(tokenId)
		mutate({
			address: CONTRACT_ADDRESS,
			abi: CONTRACT_ABI,
			functionName: 'unarchiveManuscript',
			args: [tokenId],
			gas: BigInt(500000),
		})
	}

	const formatDate = (timestamp: bigint) =>
		new Date(Number(timestamp) * 1000).toLocaleDateString('en-GB', {
			day: '2-digit', month: 'short', year: 'numeric'
		})

	const tree = manuscripts ? buildTree(manuscripts as Manuscript[]) : []
	const activeChains = tree.filter(isChainActive)
	const archivedChains = tree.filter(n => !isChainActive(n))

	const ManuscriptCard = ({ node, depth = 0 }: { node: ManuscriptWithChildren, depth?: number }) => {
		const isLoading = isPending && pendingTokenId === node.tokenId

		return (
			<>
				<div className={`flex items-center justify-between gap-3 ${depth > 0 ? 'pl-10 bg-[#26215C]/20' : 'p-0'}`}
					style={{ 
						padding: depth > 0 ? '12px 16px 12px 40px' : '14px 16px',
						opacity: node.archived && depth > 0 ? 0.5 : 1
					}}>
					{depth > 0 && (
						<div style={{ position: 'relative', flexShrink: 0, width: 14, height: 18 }}>
							<div style={{
								width: 10, height: 10,
								borderLeft: '1.5px solid #AFA9EC',
								borderBottom: '1.5px solid #AFA9EC',
								borderRadius: '0 0 0 4px',
								position: 'absolute', top: 0, left: 0
							}} />
						</div>
					)}
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<div style={{
							width: 6,
							alignSelf: 'stretch',
							background: node.archived ? '#B4B2A9' : '#1D9E75',
							borderRadius: 3,
							flexShrink: 0
						}} />
						<div className="min-w-0">
							<div className="flex items-center gap-1.5 flex-wrap mb-1">
								<span className="text-white font-medium text-sm">{node.title}</span>
								{node.hasParent && (
									<span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FAEEDA', color: '#633806' }}>Version</span>
								)}
								<span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EEEDFE', color: '#3C3489' }}>#{node.tokenId.toString()}</span>
							</div>
							<div className="font-mono text-xs truncate" style={{ color: '#AFA9EC' }}>
								{node.hash.slice(0, 42)}...
							</div>
							<div className="text-xs mt-0.5" style={{ color: '#CECBF6', opacity: 0.5 }}>
								{formatDate(node.timestamp)}
								{node.hasParent && <span className="ml-2">· previous #{node.previousTokenId.toString()}</span>}

							</div>
						</div>
					</div>
					<button
						onClick={() => node.archived ? handleUnarchive(node.tokenId) : handleArchive(node.tokenId)}
						disabled={isLoading}
						className="text-xs px-3 py-1.5 rounded-lg border border-[#AFA9EC]/20 text-[#CECBF6] hover:border-[#AFA9EC]/60 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
					>
						{isLoading ? '...' : node.archived ? 'Unarchive' : 'Archive'}
					</button>
				</div>
				{node.children.map((child, i) => (
					<div key={i} className="border-t border-[#AFA9EC]/10">
						<ManuscriptCard node={child} depth={depth + 1} />
					</div>
				))}
			</>
		)
	}

	const Section = ({ title, chains }: { title: string, chains: ManuscriptWithChildren[] }) => (
		<div className="mb-6">
			<p className="text-xs font-medium text-[#CECBF6]/50 uppercase tracking-widest mb-2">
				{title} · {chains.length}
			</p>
			<div className="flex flex-col gap-2">
				{chains.map((chain, i) => (
					<div
						key={i}
						className="bg-[#26215C]/40 border border-[#AFA9EC]/20 rounded-xl overflow-hidden"
						style={{ opacity: !isChainActive(chain) ? 0.6 : 1 }}
					>
						<ManuscriptCard node={chain} />
					</div>
				))}
			</div>
		</div>
	)

	if (!isConnected) {
		return (
			<div className="min-h-screen bg-[#1a1730] flex items-center justify-center">
				<div className="text-center">
					<div className="text-4xl mb-4">𓅭</div>
					<h2 className="text-white font-medium text-lg mb-2">Connect your wallet</h2>
					<p className="text-[#CECBF6]/60 text-sm">You need to connect your wallet to view your manuscripts.</p>
					<div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
						<appkit-button />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#1a1730] py-12 px-6">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-2xl font-medium text-white mb-1">My manuscripts</h1>
						<p className="text-[#CECBF6]/60 text-sm">{tree.length} manuscript{tree.length > 1 ? 's' : ''} registered</p>
					</div>
					<Link
						href="/deposit"
						className="px-4 py-2 rounded-lg bg-[#BA7517] text-white text-sm font-medium hover:bg-[#EF9F27] transition-colors"
					>
						+ New deposit
					</Link>
				</div>

				{tree.length === 0 ? (
					<div className="text-center py-20">
						<div className="text-4xl mb-4">📄</div>
						<p className="text-[#CECBF6]/60 text-sm">No manuscript registered yet.</p>
						<Link href="/deposit" className="text-[#AFA9EC] text-sm hover:text-white mt-2 block">
							Deposit your first manuscript →
						</Link>
					</div>
				) : (
					<>
						{activeChains.length > 0 && <Section title="Active" chains={activeChains} />}
						{archivedChains.length > 0 && <Section title="Archived" chains={archivedChains} />}
					</>
				)}

				<div className="mt-12 flex items-center justify-center gap-3 opacity-40">
					<span className="text-[#BA7517] text-xs tracking-widest">𓅱𓇋𓏏𓅭𓏏𓈖</span>
					<span className="text-[#CECBF6] text-xs italic">Djéhouty · guardian of writings</span>
				</div>
			</div>
		</div>
	)
}