// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";

error ActiveManuscript();
error ManuscriptAlreadyArchived();
error ManuscriptAlreadyExists();
error ManuscriptNotFound();
error OriginManuscriptAlreadyArchived();
error OriginManuscriptNotFound();
error TransferNotAllowed();
error TitleEmpty();
error TitleTooLong();
error Unauthorized();

/// @title ManuscriptRegistry
/// @notice Decentralized platform for manuscript proof of anteriority
/// @dev ERC-721 contract allowing authors to timestamp their manuscripts on the Ethereum blockchain
contract ManuscriptRegistry is ERC721, ERC721Enumerable, ERC721Pausable, Ownable {
	
	/// @notice Maximum number of manuscripts that can be retrieved at once. Built once in constructor
	uint8 public immutable MAX_MANUSCRIPTS_PER_QUERY;
	uint256 private _nextTokenId = 1;
	mapping(uint256 => Manuscript)	private _manuscripts;
	mapping(bytes32 => uint256)		private _hashToTokenId;

	/// @notice Represents a registered manuscript
	/// @dev Optimized with variable packing — slot 1: author + archived + hasParent + timestamp
	struct Manuscript {
		address	author;				// author's wallet address
		bool	archived;			// whether the manuscript has been archived by its author
		bool	hasParent;			// true if this manuscript is a new version of an existing one
		uint64	timestamp;			// block.timestamp at the time of registration
		bytes32	hash;				// SHA-256 hash of the file
		uint256	previousTokenId;	// 0 if initial deposit, otherwise tokenId of the previous version
		string	title;				// title of the work
	}

	// ::::::::::::: EVENTS ::::::::::::: //

	/// @notice Emitted when a new manuscript or version is registered
	/// @param tokenId Unique NFT identifier
	/// @param author Author's wallet address
	/// @param hash SHA-256 hash of the file
	/// @param title Title of the work
	/// @param timestamp Block timestamp
	/// @param previousTokenId TokenId of the previous manuscript (0 if initial deposit)
	/// @param hasParent True if this is a new version
	event ManuscriptRegistered(uint256 indexed tokenId, address indexed author, bytes32 hash, string title, uint64 timestamp, uint256 previousTokenId, bool hasParent);

	/// @notice Emitted when a manuscript is archived
	/// @param tokenId Unique NFT identifier
	/// @param author Author's wallet address
	/// @param timestamp Block timestamp
	event ManuscriptArchived(uint256 indexed tokenId, address indexed author, uint64 timestamp);

	/// @notice Emitted when a manuscript is unarchived
	/// @param tokenId Unique NFT identifier
	/// @param author Author's wallet address
	/// @param timestamp Block timestamp
	event ManuscriptUnarchived(uint256 indexed tokenId, address indexed author, uint64 timestamp);
	// endregion Events

	// ::::::::::::: MODIFIERS ::::::::::::: //

	/// @dev Checks that the tokenId exists and that the caller is its owner
	/// @param tokenId NFT identifier to verify
	modifier authorOnly(uint256 tokenId) {
		require(tokenIdExists(tokenId), ManuscriptNotFound());
		require(ownerOf(tokenId) == msg.sender, Unauthorized());
		_;
	}

	// ::::::::::::: INIT ::::::::::::: //

	constructor(uint8 max) ERC721("ThothOrigin", "THOT") Ownable(msg.sender) {
		MAX_MANUSCRIPTS_PER_QUERY = max;
	}

	// ::::::::::::: REQUIRED OVERRIDES ::::::::::::: //

	function _update(address to, uint256 tokenId, address auth)
		internal
		override(ERC721, ERC721Enumerable, ERC721Pausable)
		returns (address)
	{
		address from = _ownerOf(tokenId);
		if (from != address(0) && to != address(0)) {
			revert TransferNotAllowed();
		}

		return super._update(to, tokenId, auth);
	}

	function _increaseBalance(address account, uint128 value)
		internal
		override(ERC721, ERC721Enumerable)
	{
		super._increaseBalance(account, value);
	}

	function supportsInterface(bytes4 interfaceId)
		public
		view
		override(ERC721, ERC721Enumerable)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}

	// ::::::::::::: GETTERS ::::::::::::: //

	/// @notice Retrieves a manuscript by its tokenId
	/// @param tokenId Unique NFT identifier
	/// @return Manuscript The full manuscript struct
	/// @custom:error ManuscriptNotFound If the tokenId does not exist
	function getManuscriptByTokenId(uint256 tokenId) public view returns(Manuscript memory) {
		require(tokenIdExists(tokenId), ManuscriptNotFound());
		return _manuscripts[tokenId];
	}

	/// @notice Retrieves a manuscript by its SHA-256 hash
	/// @dev Accessible even if the contract is paused
	/// @param hash SHA-256 hash of the file
	/// @return Manuscript The full manuscript struct
	/// @custom:error ManuscriptNotFound If the hash is not registered
	function getManuscriptByHash(bytes32 hash) external view returns(Manuscript memory) {
		require(hashExists(hash), ManuscriptNotFound());
		return getManuscriptByTokenId(_hashToTokenId[hash]);
	}

	/// @notice Retrieves all manuscripts belonging to an author
	/// @dev Uses ERC721Enumerable to iterate over the address's tokens
	/// @param author Author's wallet address
	/// @return Manuscript[] Array of manuscripts owned by the author
	function getManuscriptsByAuthor(address author) external view returns(Manuscript[] memory) {
		uint256 balance = balanceOf(author);
		uint256 size = balance < MAX_MANUSCRIPTS_PER_QUERY ? balance : MAX_MANUSCRIPTS_PER_QUERY;
		Manuscript[] memory result = new Manuscript[](size);
		for (uint256 i = 0; i < size; i++) {
			result[i] = _manuscripts[tokenOfOwnerByIndex(author, i)];
		}

		return result;
	}

	// ::::::::::::: EXTERNAL FUNCTIONS ::::::::::::: //

	/// @notice Pauses the contract — blocks all write operations
	/// @dev Only accessible by the contract owner
	function pause() external onlyOwner {
		_pause();
	}

	/// @notice Unpauses the contract — restores normal operation
	/// @dev Only accessible by the contract owner
	function unpause() external onlyOwner {
		_unpause();
	}

	/// @notice Registers a new manuscript on the blockchain
	/// @param hash SHA-256 hash of the file generated client-side
	/// @param title Title of the work (non-empty, max 100 characters)
	/// @custom:error TitleEmpty If the title is empty
	/// @custom:error TitleTooLong If the title exceeds 100 characters
	/// @custom:error ManuscriptAlreadyExists If the hash is already registered
	function registerManuscript(bytes32 hash, string calldata title) external whenNotPaused {
		_registerManuscript(hash, title, 0, false);
	}

	/// @notice Registers a new version of an existing manuscript
	/// @param hash SHA-256 hash of the new file
	/// @param title Title of the new version
	/// @param previousTokenId TokenId of the manuscript this version is derived from
	/// @custom:error OriginManuscriptNotFound If the previousTokenId does not exist
	/// @custom:error OriginManuscriptAlreadyArchived If the previous manuscript is archived
	function registerNewVersion(bytes32 hash, string calldata title, uint256 previousTokenId) external whenNotPaused {
		require(tokenIdExists(previousTokenId), OriginManuscriptNotFound());
		require(ownerOf(previousTokenId) == msg.sender, Unauthorized());
		require(!_manuscripts[previousTokenId].archived, OriginManuscriptAlreadyArchived());

		_registerManuscript(hash, title, previousTokenId, true);
	}

	/// @notice Archives a manuscript — marks it as inactive without deleting it
	/// @dev An archived manuscript cannot be versioned
	/// @param tokenId NFT identifier to archive
	/// @custom:error ManuscriptNotFound If the tokenId does not exist
	/// @custom:error ManuscriptAlreadyArchived If the manuscript is already archived
	function archiveManuscript(uint256 tokenId) external authorOnly(tokenId) whenNotPaused {
		require(!_manuscripts[tokenId].archived, ManuscriptAlreadyArchived());
		_setArchived(tokenId, true);
		emit ManuscriptArchived(tokenId, msg.sender, uint64(block.timestamp));
	}

	/// @notice Unarchives a manuscript — restores it to active status
	/// @param tokenId NFT identifier to unarchive
	/// @custom:error ManuscriptNotFound If the tokenId does not exist
	/// @custom:error ActiveManuscript If the manuscript is already active
	function unarchiveManuscript(uint256 tokenId) external authorOnly(tokenId) whenNotPaused {
		require(_manuscripts[tokenId].archived, ActiveManuscript());
		_setArchived(tokenId, false);
		emit ManuscriptUnarchived(tokenId, msg.sender, uint64(block.timestamp));
	}

	// ::::::::::::: INTERNAL FUNCTIONS ::::::::::::: //

	/// @dev Checks whether a hash is already registered
	/// @param hash SHA-256 hash to verify
	/// @return bool True if the hash exists
	function hashExists(bytes32 hash) internal view returns(bool) {
		return _hashToTokenId[hash] != 0;
	}

	/// @dev Checks whether a tokenId exists
	/// @param tokenId NFT identifier to verify
	/// @return bool True if the token exists
	function tokenIdExists(uint256 tokenId) internal view returns(bool) {
		return _ownerOf(tokenId) != address(0);
	}

	/// @dev Common manuscript registration logic
	/// @param hash SHA-256 hash of the file
	/// @param title Title of the work
	/// @param previousTokenId TokenId of the previous manuscript (0 if initial deposit)
	/// @param hasParent True if this is a new version
	function _registerManuscript(bytes32 hash, string calldata title, uint256 previousTokenId, bool hasParent) internal {
		uint256 len = bytes(title).length;
		require(len > 0, TitleEmpty());
		require(len <= 100, TitleTooLong());
		require(!hashExists(hash), ManuscriptAlreadyExists());

		uint64 timestamp = uint64(block.timestamp);
		uint256 tokenId = _nextTokenId;

		_manuscripts[tokenId] = Manuscript({
			author: msg.sender,
			archived: false,
			hasParent: hasParent,
			timestamp: timestamp,
			hash: hash,
			previousTokenId: previousTokenId,
			title: title
		});
		_hashToTokenId[hash] = tokenId;
		_nextTokenId++;

		_safeMint(msg.sender, tokenId);
		emit ManuscriptRegistered(tokenId, msg.sender, hash, title, timestamp, previousTokenId, hasParent);
	}

	/// @dev Updates the archived status of a manuscript
	/// @param tokenId NFT identifier
	/// @param archived New archived status
	function _setArchived(uint256 tokenId, bool archived) internal {
		_manuscripts[tokenId].archived = archived;
	}
}
