'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

createAppKit({
	adapters: [wagmiAdapter],
	projectId,
	networks,
	defaultNetwork: networks[0],
	metadata: {
		name: 'ThothOrigin',
		description: 'Decentralized manuscript proof of anteriority',
		url: '',
		icons: ['']
	},
	features: {
		analytics: false
	}
})

export function AppKitProvider({ children, cookies }: { children: ReactNode, cookies: string | null }) {
	const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

	return (
		<WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</WagmiProvider>
	)
}