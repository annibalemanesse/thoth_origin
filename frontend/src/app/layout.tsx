import type { Metadata } from "next";
import { headers } from 'next/headers';
import { AppKitProvider } from '@/context/index';
import { Navbar } from '@/components/Navbar';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: 'ThothOrigin',
	description: 'Decentralized manuscript proof of anteriority',
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
		const headersData = await headers()
		const cookies = headersData.get('cookie')
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<AppKitProvider cookies={cookies}>
					<Navbar />
					<main>
						{children}
					</main>
				</AppKitProvider>
			</body>
		</html>
	);
}
