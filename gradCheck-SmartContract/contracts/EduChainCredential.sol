// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EduChainCredential
 * @dev Soulbound (non-transferable) ERC-721 used to issue academic credentials.
 *
 * Maps to the EduChain project workflow:
 *  - Registrar staff run the "Generate PDF" batch job, which hashes each
 *    student's degree scroll and pins it to IPFS (registrations.pdf_hash / ipfs_cid).
 *  - Staff then run "Mint Token", which calls mint() below for every row in
 *    the pdf_generated state, using the hash and student data already stored
 *    in step one.
 *  - The public "Verification page" and "Resolve verification link" endpoint
 *    both hash an uploaded/reference PDF and call verifyByHash() to check it
 *    against what's on-chain.
 *
 * Only addresses holding MINTER_ROLE (the registrar's backend signer, or later
 * a multisig, per the "Signing key setup" task) can mint. Tokens cannot be
 * transferred once issued — only minting and burning move a token.
 *
 * NOTE ON DATA EXPOSURE: this version stores studentName, degreeName,
 * graduationDate and documentCID directly in on-chain metadata, per project
 * decision. Anyone can read these for any tokenId via getCredential() or the
 * public credentialMetadata mapping — not just someone who already has the
 * PDF. Student Date of Birth and Student ID Number are deliberately excluded;
 * they stay in the registrations table / PDF only.
 */
contract EduChainCredential is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    struct CredentialMetadata {
        uint256 tokenId;
        string studentName;
        string degreeName;
        uint256 graduationDate; // unix timestamp (seconds) — convert registrations.conferral_date (DATE) to epoch when calling mint()
        string documentCID; // IPFS CID of the degree PDF (registrations.ipfs_cid)
        bytes32 documentHash; // keccak256 hash of the degree PDF (registrations.pdf_hash)
        address recipient;
        uint256 timestamp; // mint timestamp
    }

    // tokenId => credential metadata
    mapping(uint256 => CredentialMetadata) public credentialMetadata;

    // documentHash => tokenId (0 = not minted). O(1) lookup for PDF-only verification.
    mapping(bytes32 => uint256) private hashToTokenId;

    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 indexed documentHash,
        string tokenURI,
        string studentName,
        string degreeName,
        uint256 graduationDate,
        string documentCID,
        uint256 timestamp
    );

    event CredentialRevoked(
        uint256 indexed tokenId,
        bytes32 indexed documentHash
    );

    /**
     * @param admin Address granted DEFAULT_ADMIN_ROLE and an initial MINTER_ROLE
     *              (e.g. the registrar's backend signer). The admin can later
     *              grantRole(MINTER_ROLE, ...) to a multisig without redeploying.
     */
    constructor(address admin) ERC721("EduChain Academic Credential", "EDUC") {
        require(admin != address(0), "Admin cannot be zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _nextTokenId = 1;
    }

    /**
     * @dev Mint one Soulbound credential. Called by the Node minting trigger API
     *      for each row moving from `pdf_generated` to `minted`.
     * @param to The student's wallet address (registrations.wallet_address).
     * @param tokenURI IPFS URI for the wallet-display metadata JSON (ipfs://<CID>),
     *        distinct from documentCID — see project notes on tokenURI vs. document CID.
     * @param documentHash keccak256 hash of the degree PDF (registrations.pdf_hash).
     * @param studentName Student's full name, as it appears on the degree scroll.
     * @param degreeName Name of the conferred degree (e.g. "Bachelor of Computer Science").
     * @param graduationDate Conferral date as a unix timestamp (seconds).
     * @param documentCID IPFS CID of the degree PDF itself (registrations.ipfs_cid).
     */
    function mint(
        address to,
        string memory tokenURI,
        bytes32 documentHash,
        string memory studentName,
        string memory degreeName,
        uint256 graduationDate,
        string memory documentCID
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        require(documentHash != bytes32(0), "Document hash cannot be empty");
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(bytes(degreeName).length > 0, "Degree name cannot be empty");
        require(bytes(documentCID).length > 0, "Document CID cannot be empty");
        require(
            hashToTokenId[documentHash] == 0,
            "Credential already minted for this document"
        );

        uint256 newTokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        credentialMetadata[newTokenId] = CredentialMetadata({
            tokenId: newTokenId,
            studentName: studentName,
            degreeName: degreeName,
            graduationDate: graduationDate,
            documentCID: documentCID,
            documentHash: documentHash,
            recipient: to,
            timestamp: block.timestamp
        });

        hashToTokenId[documentHash] = newTokenId;

        emit CredentialMinted(
            newTokenId,
            to,
            documentHash,
            tokenURI,
            studentName,
            degreeName,
            graduationDate,
            documentCID,
            block.timestamp
        );

        return newTokenId;
    }

    /**
     * @dev PDF-only verification lookup: an employer's uploaded PDF is hashed
     *      off-chain, then checked here — no token ID required. Behaves the
     *      same as ImageNFT_V2's verifyImageByHash: an O(1) mapping lookup
     *      that doesn't touch the rest of the struct.
     * @param documentHash The hash computed from the uploaded/reference PDF.
     */
    function verifyByHash(
        bytes32 documentHash
    ) public view returns (bool exists, uint256 tokenId) {
        uint256 id = hashToTokenId[documentHash];
        return (id != 0, id);
    }

    /**
     * @dev Verify a specific token still matches a given document hash.
     */
    function verifyToken(
        uint256 tokenId,
        bytes32 documentHash
    ) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return credentialMetadata[tokenId].documentHash == documentHash;
    }

    function getCredential(
        uint256 tokenId
    ) public view returns (CredentialMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return credentialMetadata[tokenId];
    }

    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Optional correction path: lets an admin burn a wrongly-minted
     *      credential (e.g. minted against the wrong student or a corrupted
     *      PDF hash) so it can be reissued. Remove if not needed — nothing
     *      else in the contract depends on it.
     */
    function revoke(uint256 tokenId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        bytes32 documentHash = credentialMetadata[tokenId].documentHash;

        delete hashToTokenId[documentHash];
        delete credentialMetadata[tokenId];
        _burn(tokenId);

        emit CredentialRevoked(tokenId, documentHash);
    }

    // ---- Soulbound enforcement ----
    // Overriding _update is the OZ v5 way to intercept every mint/transfer/burn.
    // Allowed: from == address(0) (mint) or to == address(0) (burn).
    // Blocked: any address-to-address transfer.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert(
                "EduChainCredential: credential is soulbound and cannot be transferred"
            );
        }
        return super._update(to, tokenId, auth);
    }

    // Approvals are meaningless for a token that can never be transferred —
    // disabled for clarity, not strictly required since _update already blocks transfers.
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert(
            "EduChainCredential: credential is soulbound and cannot be approved for transfer"
        );
    }

    function setApprovalForAll(
        address,
        bool
    ) public pure override(ERC721, IERC721) {
        revert(
            "EduChainCredential: credential is soulbound and cannot be approved for transfer"
        );
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
