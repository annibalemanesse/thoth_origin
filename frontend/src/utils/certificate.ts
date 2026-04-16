import jsPDF from 'jspdf'

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

export const generateCertificate = (manuscript: Manuscript, txHash?: string) => {
	const doc = new jsPDF()
	const pageWidth = doc.internal.pageSize.getWidth()

	const gold: [number, number, number] = [186, 117, 23]
	const darkGold: [number, number, number] = [133, 79, 11]
	const navy: [number, number, number] = [26, 23, 48]
	const gray: [number, number, number] = [120, 116, 140]
	const lightGray: [number, number, number] = [240, 238, 248]
	const white: [number, number, number] = [255, 255, 255]

	// Fond blanc
	doc.setFillColor(...white)
	doc.rect(0, 0, pageWidth, 297, 'F')

	// Bordures dorées top/bottom
	doc.setFillColor(...gold)
	doc.rect(0, 0, pageWidth, 3, 'F')
	doc.rect(0, 294, pageWidth, 3, 'F')

	// Bordures latérales
	doc.rect(0, 0, 1, 297, 'F')
	doc.rect(pageWidth - 1, 0, 1, 297, 'F')

	// Header background léger
	doc.setFillColor(...lightGray)
	doc.rect(0, 3, pageWidth, 45, 'F')

	// Title
	doc.setTextColor(...gold)
	doc.setFontSize(22)
	doc.setFont('helvetica', 'bold')
	doc.text('ThothOrigin', pageWidth / 2, 22, { align: 'center' })

	// Subtitle
	doc.setTextColor(...gray)
	doc.setFontSize(9)
	doc.setFont('helvetica', 'normal')
	doc.text('Certificate of Proof of Anteriority', pageWidth / 2, 30, { align: 'center' })

	// This certificate is generated
	doc.setTextColor(...gray)
	doc.setFontSize(7.5)
	doc.text('This certificate is generated from immutable blockchain data and constitutes proof of anteriority.', pageWidth / 2, 38, { align: 'center' })

	// Djehouty
	doc.setTextColor(...gold)
	doc.setFontSize(8)
	doc.text('Djehouty · ThothOrigin', pageWidth / 2, 44, { align: 'center' })

	// Gold separator line
	doc.setDrawColor(...gold)
	doc.setLineWidth(0.8)
	doc.line(15, 52, pageWidth - 15, 52)

	// Certificate title
	doc.setTextColor(...navy)
	doc.setFontSize(15)
	doc.setFont('helvetica', 'bold')
	doc.text('PROOF OF ANTERIORITY', pageWidth / 2, 65, { align: 'center' })

	// Manuscript title
	doc.setTextColor(...darkGold)
	doc.setFontSize(13)
	doc.setFont('helvetica', 'bolditalic')
	doc.text(`"${manuscript.title}"`, pageWidth / 2, 76, { align: 'center' })

	// Separator
	doc.setDrawColor(...lightGray)
	doc.setLineWidth(0.5)
	doc.line(15, 82, pageWidth - 15, 82)

	// Fields
	const fields = [
		{ label: 'Author', value: manuscript.author },
		{ label: 'Token ID', value: `#${manuscript.tokenId.toString()}` },
		{ label: 'Registration date', value: new Date(Number(manuscript.timestamp) * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
		{ label: 'Status', value: manuscript.archived ? 'Archived' : 'Active' },
		{ label: 'Type', value: manuscript.hasParent ? `New version of #${manuscript.previousTokenId.toString()}` : 'Initial deposit' },
	]

	let y = 96
	fields.forEach(({ label, value }) => {
		doc.setTextColor(...gray)
		doc.setFontSize(8)
		doc.setFont('helvetica', 'normal')
		doc.text(label.toUpperCase(), 20, y)

		doc.setTextColor(...navy)
		doc.setFontSize(10)
		doc.setFont('helvetica', 'bold')
		doc.text(value, 20, y + 6)

		y += 18
	})

	// Hash section
	y += 4
	doc.setFillColor(...lightGray)
	doc.roundedRect(15, y - 6, pageWidth - 30, 24, 2, 2, 'F')
	doc.setDrawColor(...gold)
	doc.setLineWidth(0.3)
	doc.roundedRect(15, y - 6, pageWidth - 30, 24, 2, 2, 'S')

	doc.setTextColor(...gray)
	doc.setFontSize(8)
	doc.setFont('helvetica', 'normal')
	doc.text('SHA-256 HASH', 20, y + 2)

	doc.setTextColor(...navy)
	doc.setFontSize(7.5)
	doc.setFont('courier', 'normal')
	doc.text(manuscript.hash, 20, y + 10, { maxWidth: pageWidth - 40 })

	// Transaction
	if (txHash) {
		y += 32
		doc.setFillColor(...lightGray)
		doc.roundedRect(15, y - 6, pageWidth - 30, 22, 2, 2, 'F')
		doc.setDrawColor(...gold)
		doc.setLineWidth(0.3)
		doc.roundedRect(15, y - 6, pageWidth - 30, 22, 2, 2, 'S')

		doc.setTextColor(...gray)
		doc.setFontSize(8)
		doc.setFont('helvetica', 'normal')
		doc.text('TRANSACTION', 20, y + 2)

		doc.setTextColor(...navy)
		doc.setFontSize(7.5)
		doc.setFont('courier', 'normal')
		doc.text(`https://sepolia.etherscan.io/tx/${txHash}`, 20, y + 8, { maxWidth: pageWidth - 40 })
		y += 8
	}

	// Soulbound mention
	y += 24
	doc.setFillColor(...lightGray)
	doc.roundedRect(15, y - 6, pageWidth - 30, 16, 2, 2, 'F')
	doc.setDrawColor(...gold)
	doc.setLineWidth(0.3)
	doc.roundedRect(15, y - 6, pageWidth - 30, 16, 2, 2, 'S')
	doc.setTextColor(...gold)
	doc.setFontSize(8)
	doc.setFont('helvetica', 'bold')
	doc.text('Soulbound NFT — non-transferable by design · Ethereum Sepolia · ERC-721', pageWidth / 2, y + 4, { align: 'center' })

	// Gold separator
	doc.setDrawColor(...gold)
	doc.setLineWidth(0.5)
	doc.line(15, y + 18, pageWidth - 15, y + 18)

	// Footer
	doc.setTextColor(...gold)
	doc.setFontSize(10)
	doc.setFont('helvetica', 'bold')
	doc.text('ThothOrigin · Blockchain proof of anteriority · Ethereum Sepolia', pageWidth / 2, 285, { align: 'center' })

	doc.save(`thothorigin-certificate-${manuscript.tokenId}.pdf`)
}
