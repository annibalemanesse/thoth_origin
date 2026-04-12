import { expect } from "chai";
import { network } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";

const { ethers } = await network.connect();

const hash1 = ethers.keccak256(ethers.toUtf8Bytes("mon_roman_v1"));
const hash2 = ethers.keccak256(ethers.toUtf8Bytes("mon_roman_v2"));
const overflowTitle = "The forgotten manuscript of the gods: an epic journey through the ages of writing and collective memory"

async function setUpSmartContract() {
	const [owner, author1, author2] = await ethers.getSigners();
	const manuscriptRegistry = await ethers.deployContract("ManuscriptRegistry", [5]);

	return { owner, author1, author2, manuscriptRegistry };
}

async function setUpWithManuscript() {
	let manuscriptRegistry: any;
	let owner : any, author1 : any, author2 : any;
	({ owner, author1, author2, manuscriptRegistry } = await setUpSmartContract());
	await manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum');

	return { owner, author1, author2, manuscriptRegistry };
}

async function setUpWithMultipleManuscripts() {
	let manuscriptRegistry: any;
	let owner: any, author1: any, author2: any;
	({ owner, author1, author2, manuscriptRegistry } = await setUpSmartContract());
	await manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum');
	await manuscriptRegistry.connect(author1).registerManuscript(hash2, 'Dolor sit amet');

	return { owner, author1, author2, manuscriptRegistry };
}

async function setUpWithArchivedManuscript() {
	let manuscriptRegistry: any;
	let owner : any, author1 : any, author2 : any;
	({ owner, author1, author2, manuscriptRegistry } = await setUpWithManuscript());
	await manuscriptRegistry.connect(author1).archiveManuscript(1);

	return { owner, author1, author2, manuscriptRegistry };
}

function deterministicRandom(seed: string, upper: number) {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) % 0x7fffffff;
	}
	return hash % upper;
}

async function registerManuscripts(registry: any, signer: any, count: number, prefix: string) {
	for (let i = 0; i < count; i++) {
		const hash = ethers.keccak256(ethers.toUtf8Bytes(`${prefix}-${i}`));
		await registry.connect(signer).registerManuscript(hash, `Title ${i}`);
	}
}

describe('Manuscript registry contract', function () {
	
	let manuscriptRegistry: any;
	let owner : any, author1 : any, author2 : any;

	// registerManuscript
	describe('registerManuscript', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpSmartContract());
		});

		it('Should not be able to register if contract is paused', async function () {
			await manuscriptRegistry.pause();
			await expect(manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum')).to.be.revertedWithCustomError(manuscriptRegistry, 'EnforcedPause');
		});
	
		it('Should not be able to register if exact same manuscript has been saved', async function () {
			await manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum');
			await expect(manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum')).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptAlreadyExists');
		});
	
		it('Should not be able to register if title is empty', async function () {
			await expect(manuscriptRegistry.connect(author1).registerManuscript(hash1, '')).to.be.revertedWithCustomError(manuscriptRegistry, 'TitleEmpty');
		});

		it('Should not be able to register if title exceeds 100 characters', async function () {
			await expect(manuscriptRegistry.connect(author1).registerManuscript(hash1, overflowTitle)).to.be.revertedWithCustomError(manuscriptRegistry, 'TitleTooLong');
		});
	
		it('Should emit a ManuscriptRegisterd event', async function () {
			await expect(manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum'))
					.to.emit(manuscriptRegistry, "ManuscriptRegistered")
					.withArgs(1, author1.address, hash1, 'Lorem Ipsum', anyValue, 0, false);
		});
	
		it("Should create an NFT sent to author's wallet", async function () {
			await manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum');
			await expect(await manuscriptRegistry.ownerOf(1)).to.equal(author1.address);
		});

		it("Should have the manuscript stored", async function () {
			await manuscriptRegistry.connect(author1).registerManuscript(hash1, 'Lorem Ipsum');

			let manuscript = await manuscriptRegistry.getManuscriptByTokenId(1);
			expect(manuscript.archived).to.equal(false);
			expect(manuscript.hash).to.equal(hash1);
			expect(manuscript.previousTokenId).to.equal(0);
			expect(manuscript.title).to.equal('Lorem Ipsum');
		});
	});

	// registerNewVersion
	describe('registerNewVersion', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithManuscript());
		});

		it('Should not be able to register new version if contract is paused', async function () {
			await manuscriptRegistry.pause();
			await expect(manuscriptRegistry.connect(author1).registerNewVersion(hash2, 'Lorem Ipsum v.2', 1)).to.be.revertedWithCustomError(manuscriptRegistry, 'EnforcedPause');
		});

		it('Should not be able to register new version if exact same manuscript has been saved', async function () {
			await expect(manuscriptRegistry.connect(author1).registerNewVersion(hash1, 'Lorem Ipsum v.2', 1)).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptAlreadyExists');
		});

		it("Should not be able to register new version if previousTokenId doesn't exist", async function () {
			await expect(manuscriptRegistry.connect(author1).registerNewVersion(hash2, 'Lorem Ipsum v.2', 2)).to.be.revertedWithCustomError(manuscriptRegistry, 'OriginManuscriptNotFound');
		});

		it("Should not be able to register new version if previousTokenId isn't owned by same author", async function () {
			await expect(manuscriptRegistry.connect(author2).registerNewVersion(hash2, 'Lorem Ipsum v.2', 1)).to.be.revertedWithCustomError(manuscriptRegistry,"Unauthorized");
		});

		it("Should not be able to register new version if previousTokenId matches an archived manuscript", async function () {
			await manuscriptRegistry.connect(author1).archiveManuscript(1);
			await expect(manuscriptRegistry.connect(author1).registerNewVersion(hash2, 'Lorem Ipsum v.2', 1)).to.be.revertedWithCustomError(manuscriptRegistry, 'OriginManuscriptAlreadyArchived');
		});

		it('Should emit a ManuscriptRegistered event', async function () {
			await expect(manuscriptRegistry.connect(author1).registerNewVersion(hash2, 'Lorem Ipsum v.2', 1))
				.to.emit(manuscriptRegistry, "ManuscriptRegistered")
				.withArgs(2, author1.address, hash2, 'Lorem Ipsum v.2', anyValue, 1, true);
		});

		it("Should create an NFT sent to author's wallet", async function () {
			await manuscriptRegistry.connect(author1).registerNewVersion(hash2, 'Lorem Ipsum v.2', 1);
			await expect(await manuscriptRegistry.ownerOf(2)).to.equal(author1.address);
		});

		it("Should have the manuscript stored", async function () {
			await manuscriptRegistry.connect(author1).registerNewVersion(hash2, 'Lorem Ipsum v.2', 1);

			let manuscript = await manuscriptRegistry.getManuscriptByTokenId(2);
			expect(manuscript.archived).to.equal(false);
			expect(manuscript.hash).to.equal(hash2);
			expect(manuscript.previousTokenId).to.equal(1);
			expect(manuscript.title).to.equal('Lorem Ipsum v.2');
		});
	});

	// archiveManuscript
	describe('archiveManuscript', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithManuscript());
		});

		it('Should not be able to archive manuscript if contract is paused', async function () {
			await manuscriptRegistry.pause();
			await expect(manuscriptRegistry.connect(author1).archiveManuscript(1)).to.be.revertedWithCustomError(manuscriptRegistry, 'EnforcedPause');
		});

		it("Should not be able to archive manuscript if tokenId doesn't exist", async function () {
			await expect(manuscriptRegistry.connect(author1).archiveManuscript(2)).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptNotFound');
		});

		it("Should not be able to archive manuscript if tokenId isn't owned by same author", async function () {
			await expect(manuscriptRegistry.connect(author2).archiveManuscript(1)).to.be.revertedWithCustomError(manuscriptRegistry,"Unauthorized");
		});

		it("Should not be able to archive manuscript if tokenId matches an archived manuscript", async function () {
			await manuscriptRegistry.connect(author1).archiveManuscript(1);
			await expect(manuscriptRegistry.connect(author1).archiveManuscript(1)).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptAlreadyArchived');
		});

		it('Should set archived to true after archive', async function () {
			await manuscriptRegistry.connect(author1).archiveManuscript(1);
			let manuscript = await manuscriptRegistry.getManuscriptByTokenId(1);
			expect(manuscript.archived).to.equal(true);
		});

		it('Should emit a ManuscriptArchived event', async function () {
			await expect(manuscriptRegistry.connect(author1).archiveManuscript(1))
				.to.emit(manuscriptRegistry, "ManuscriptArchived").withArgs(1, author1.address, anyValue);
		});
	});

	// unarchiveManuscript
	describe('unarchiveManuscript', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithArchivedManuscript());
		});

		it('Should not be able to unarchive manuscript if contract is paused', async function () {
			await manuscriptRegistry.pause();
			await expect(manuscriptRegistry.connect(author1).unarchiveManuscript(1)).to.be.revertedWithCustomError(manuscriptRegistry, 'EnforcedPause');
		});

		it("Should not be able to unarchive manuscript if tokenId doesn't exist", async function () {
			await expect(manuscriptRegistry.connect(author1).unarchiveManuscript(2)).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptNotFound');
		});

		it("Should not be able to unarchive manuscript if tokenId isn't owned by same author", async function () {
			await expect(manuscriptRegistry.connect(author2).unarchiveManuscript(1)).to.be.revertedWithCustomError(manuscriptRegistry,"Unauthorized");
		});

		it("Should not be able to unarchive manuscript if tokenId matches an active manuscript", async function () {
			await manuscriptRegistry.connect(author1).unarchiveManuscript(1);
			await expect(manuscriptRegistry.connect(author1).unarchiveManuscript(1)).to.be.revertedWithCustomError(manuscriptRegistry, 'ActiveManuscript');
		});

		it('Should set archived to false after unarchive', async function () {
			await manuscriptRegistry.connect(author1).unarchiveManuscript(1);
			let manuscript = await manuscriptRegistry.getManuscriptByTokenId(1);
			expect(manuscript.archived).to.equal(false);
		});

		it('Should emit a ManuscriptUnarchived event', async function () {
			await expect(manuscriptRegistry.connect(author1).unarchiveManuscript(1))
				.to.emit(manuscriptRegistry, "ManuscriptUnarchived").withArgs(1, author1.address, anyValue);
		});
	});

	// getManuscriptByHash
	describe('getManuscriptByHash', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithManuscript());
		});

		it('Should revert if hash not found', async function () {
			await expect(manuscriptRegistry.connect(author1).getManuscriptByHash(hash2)).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptNotFound');
		});

		it('Should return manuscript if hash exists', async function () {
			let manuscript = await manuscriptRegistry.getManuscriptByHash(hash1);

			expect(manuscript.archived).to.equal(false);
			expect(manuscript.hash).to.equal(hash1);
			expect(manuscript.previousTokenId).to.equal(0);
			expect(manuscript.title).to.equal('Lorem Ipsum');
		});

		it('Should return manuscript if hash exists and contract paused', async function () {
			await manuscriptRegistry.pause();

			await expect(manuscriptRegistry.connect(author1).getManuscriptByHash(hash1)).not.to.revert;
		});

		it('Should return manuscript if hash exists and verifyer is not the author', async function () {
			await expect(manuscriptRegistry.connect(author2).getManuscriptByHash(hash1)).not.to.revert;
		});

		it('Should return manuscript if hash exists and manuscript is archived', async function () {
			await manuscriptRegistry.connect(author1).archiveManuscript(1);

			let manuscript = await manuscriptRegistry.getManuscriptByHash(hash1);

			expect(manuscript.archived).to.equal(true);
		});
	});

	// getManuscriptByTokenId
	describe('getManuscriptByTokenId', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithManuscript());
		});

		it('Should revert if tokenId not found', async function () {
			await expect(manuscriptRegistry.connect(author1).getManuscriptByTokenId(2)).to.be.revertedWithCustomError(manuscriptRegistry, 'ManuscriptNotFound');
		});

		it('Should return manuscript if tokenId exists', async function () {
			let manuscript = await manuscriptRegistry.getManuscriptByTokenId(1);

			expect(manuscript.archived).to.equal(false);
			expect(manuscript.hash).to.equal(hash1);
			expect(manuscript.previousTokenId).to.equal(0);
			expect(manuscript.title).to.equal('Lorem Ipsum');
		});

		it('Should return manuscript if tokenId exists and contract paused', async function () {
			await manuscriptRegistry.pause();

			await expect(manuscriptRegistry.connect(author1).getManuscriptByTokenId(1)).not.to.revert;
		});

		it('Should return manuscript if tokenId exists and verifyer is not the author', async function () {
			await expect(manuscriptRegistry.connect(author2).getManuscriptByTokenId(1)).not.to.revert;
		});

		it('Should return manuscript if tokenId exists and manuscript is archived', async function () {
			await manuscriptRegistry.connect(author1).archiveManuscript(1);

			let manuscript = await manuscriptRegistry.getManuscriptByTokenId(1);

			expect(manuscript.archived).to.equal(true);
		});
	});

	// getManuscriptsByAuthor
	describe('getManuscriptsByAuthor', function () {
		beforeEach(async () => {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithMultipleManuscripts());
		});

		it('Should return mauscripts if contract paused', async function () {
			await manuscriptRegistry.pause();

			const manuscripts = await manuscriptRegistry.connect(author1).getManuscriptsByAuthor(author1.address);
			expect(manuscripts.length).to.equal(2);
		});

		it("Should return other author's manuscripts", async function () {
			const manuscripts = await manuscriptRegistry.connect(author2).getManuscriptsByAuthor(author1.address);
			expect(manuscripts.length).to.equal(2);
		});

		it('Should return empty array if author has 0 manuscript registered', async function () {
			const manuscripts = await manuscriptRegistry.connect(author2).getManuscriptsByAuthor(author2.address);
			expect(manuscripts.length).to.equal(0);
		});

		it('Should handle variable number of manuscripts within limit', async function () {
			const max = Number(await manuscriptRegistry.MAX_MANUSCRIPTS_PER_QUERY());
			const setupCount = 2; // setUpWithMultipleManuscripts already registered 2 for author1
			const toAdd = deterministicRandom('manuscripts-count', max - setupCount);

			await registerManuscripts(manuscriptRegistry, author1, toAdd, 'manuscript');

			const result = await manuscriptRegistry.getManuscriptsByAuthor(author1.address);
			expect(result.length).to.equal(setupCount + toAdd);
		});

		it('Should return MAX_MANUSCRIPTS_PER_QUERY when author exceeds limit', async function () {
			const max = Number(await manuscriptRegistry.MAX_MANUSCRIPTS_PER_QUERY());
			const toAdd = max + deterministicRandom('extra-manuscripts', 5) + 1;

			await registerManuscripts(manuscriptRegistry, author1, toAdd, 'manuscript-fuzz');

			const result = await manuscriptRegistry.getManuscriptsByAuthor(author1.address);
			expect(result.length).to.equal(max);
		});
	});

	// update
	describe.only('_update', function () {
		it('Should not be able to transfer a manuscript NFT', async function () {
			({ owner, author1, author2, manuscriptRegistry } = await setUpWithManuscript());

			await expect(manuscriptRegistry.connect(author1).transferFrom(author1.address, author2.address, 1)).to.be.revertedWithCustomError(manuscriptRegistry, "TransferNotAllowed");
		});
	});
});