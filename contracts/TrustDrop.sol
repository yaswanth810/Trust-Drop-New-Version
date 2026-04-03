// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ============ Cross-Contract Interfaces ============
interface ITrustScore {
    function trackMilestoneCompletion(address ngoAddress, bool onTime) external;
    function trackMilestoneRejection(address ngoAddress) external;
    function trackCampaignCompleted(address ngoAddress) external;
}

interface ITrustDropNFT {
    function trackDonation(address donor, uint256 amount, uint256 campaignId) external;
}

contract TrustDrop is ReentrancyGuard, Ownable {

    // ============ Constants ============
    uint8   public constant APPROVAL_THRESHOLD            = 3;
    uint256 public constant VALIDATOR_STAKE               = 0.01 ether;
    uint256 public constant CHALLENGE_STAKE               = 0.001 ether;
    uint256 public constant CHALLENGE_WINDOW              = 48 hours;
    uint256 public constant SEED_PERCENT                  = 20;
    uint256 public constant BENEFICIARY_CONFIRM_THRESHOLD = 70;
    address public constant USDC = 0x8B0180f2101c8260d49339abfEe87927412494B4;

    // ============ Structs ============

    /// @dev Input struct for createCampaign - keeps call-site stack to 1 slot.
    struct CampaignParams {
        string    title;
        string    description;
        string[]  milestoneDescriptions;
        uint256[] milestoneAmounts;
        uint256[] milestoneDeadlines;
        uint256[] beneficiaryCounts;
    }

    struct Milestone {
        string  description;
        uint256 fundAmount;
        string  invoiceIPFS;
        string  photoIPFS;
        string  beneficiaryIPFS;
        uint256 beneficiaryCount;
        uint256 confirmedCount;
        uint8   approvalCount;
        bool    isApproved;
        bool    isRejected;
        uint256 deadline;
        bool    fundsReleased;
        uint256 approvedAt;
        bool    challenged;
        uint256 releaseAfter;
        bool    fundsClaimed;
    }

    struct CampaignInfo {
        uint256 campaignId;
        address payable ngoAddress;
        string  title;
        string  description;
        uint256 totalFunds;
        uint256 raisedFunds;
        uint256 milestoneCount;
        bool    isActive;
        bool    isFrozen;
        bool    seedReleased;
        bool    isEmergency;
        uint256 emergencyVotes;
    }

    struct FraudReport {
        address reporter;
        uint256 campaignId;
        uint256 milestoneIndex;
        string  evidenceIPFS;
        string  reason;
        bool    resolved;
        bool    upheld;
        uint256 stakedAmount;
    }

    // ============ State Variables ============
    uint256 public campaignCount;

    mapping(uint256 => CampaignInfo)                                 public campaigns;
    mapping(uint256 => mapping(uint256 => Milestone))                public milestones;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    mapping(uint256 => address[])                                    public campaignDonors;
    mapping(uint256 => mapping(address => uint256))                  public donations;
    mapping(bytes32 => bool)                                         public beneficiaryConfirmed;
    mapping(address => bool)                                         public validators;
    mapping(address => uint256)                                      public validatorStakes;
    uint256 public validatorCount;
    uint256 public totalDonated;
    uint256 public totalMilestonesCompleted;
    mapping(uint256 => mapping(address => bool)) public emergencyVoted;

    FraudReport[] public fraudReports;
    mapping(address => uint256[]) public reporterReports;

    ITrustScore   public trustScoreContract;
    ITrustDropNFT public nftContract;

    // ============ Events ============
    event CampaignCreated(uint256 indexed campaignId, address indexed ngo, uint256 totalFunds);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event ProofSubmitted(uint256 indexed campaignId, uint256 milestoneIndex, string invoiceHash, string photoHash, string beneficiaryHash);
    event MilestoneApproved(uint256 indexed campaignId, uint256 milestoneIndex);
    event FundsScheduled(uint256 indexed campaignId, uint256 milestoneIndex, uint256 amount, uint256 releaseAfter);
    event FundsClaimed(uint256 indexed campaignId, uint256 milestoneIndex, uint256 amount);
    event DonorsRefunded(uint256 indexed campaignId, uint256 totalRefunded);
    event ValidatorRegistered(address indexed validator);
    event CampaignFrozen(uint256 indexed campaignId);
    event BadgeEarned(address indexed donor, uint256 campaignId);
    event RefundTriggered(uint256 indexed campaignId, address triggeredBy);
    event SeedReleased(uint256 indexed campaignId, uint256 amount);
    event BeneficiaryConfirmed(bytes32 indexed beneficiaryHash, address indexed confirmedBy);
    event MilestoneChallenged(uint256 indexed campaignId, uint256 milestoneIndex, address challenger);
    event EmergencyActivated(uint256 indexed campaignId);
    event FraudReported(uint256 indexed campaignId, uint256 milestoneIndex, address reporter, uint256 reportId);
    event FraudReportResolved(uint256 indexed reportId, bool upheld);

    // ============ Constructor ============
    constructor(address _trustScoreAddr, address _nftAddr) Ownable(msg.sender) {
        if (_trustScoreAddr != address(0)) trustScoreContract = ITrustScore(_trustScoreAddr);
        if (_nftAddr        != address(0)) nftContract        = ITrustDropNFT(_nftAddr);
    }

    // ============ Internal Guard Helpers ============
    // KEY FIX: These are internal functions, NOT modifiers.
    // Modifier code is inlined into the caller's stack frame and eats into its
    // 16-slot limit. Internal functions get their own separate stack frame,
    // so they cost zero slots in the caller.

    function _requireCampaignExists(uint256 id) internal view {
        require(id < campaignCount, "Campaign does not exist");
    }

    function _requireCampaignActive(uint256 id) internal view {
        require(campaigns[id].isActive,  "Campaign is not active");
        require(!campaigns[id].isFrozen, "Campaign is frozen");
    }

    function _requireNGO(uint256 id) internal view {
        require(campaigns[id].ngoAddress == msg.sender, "Only NGO can call this");
    }

    function _requireValidator() internal view {
        require(validators[msg.sender], "Only registered validators");
    }

    // ============ External Functions ============

    function createCampaign(CampaignParams calldata p) external returns (uint256) {
        require(p.milestoneDescriptions.length == p.milestoneAmounts.length,   "Mismatched arrays");
        require(p.milestoneDescriptions.length  > 0,                           "Need at least one milestone");
        require(p.milestoneDescriptions.length == p.milestoneDeadlines.length, "Mismatched deadline array");
        require(p.milestoneDescriptions.length == p.beneficiaryCounts.length,  "Mismatched beneficiary array");

        uint256 cId = campaignCount++;

        CampaignInfo storage c = campaigns[cId];
        c.campaignId     = cId;
        c.ngoAddress     = payable(msg.sender);
        c.title          = p.title;
        c.description    = p.description;
        c.milestoneCount = p.milestoneDescriptions.length;
        c.isActive       = true;
        c.totalFunds     = _initMilestones(cId, p);

        emit CampaignCreated(cId, msg.sender, c.totalFunds);
        return cId;
    }

    function donate(uint256 _campaignId, uint256 _amount) external nonReentrant {
        _requireCampaignExists(_campaignId);
        _requireCampaignActive(_campaignId);
        require(_amount > 0, "Amount must be > 0");

        IERC20(USDC).transferFrom(msg.sender, address(this), _amount);

        if (donations[_campaignId][msg.sender] == 0) {
            campaignDonors[_campaignId].push(msg.sender);
        }
        donations[_campaignId][msg.sender]  += _amount;
        campaigns[_campaignId].raisedFunds  += _amount;
        totalDonated                         += _amount;

        emit DonationReceived(_campaignId, msg.sender, _amount);

        if (address(nftContract) != address(0)) {
            try nftContract.trackDonation(msg.sender, _amount, _campaignId) {
                emit BadgeEarned(msg.sender, _campaignId);
            } catch {}
        }

        _checkAndReleaseSeed(_campaignId);
    }

    function submitMilestoneProof(
        uint256 _campaignId,
        uint256 _milestoneIndex,
        string calldata _invoiceHash,
        string calldata _photoHash,
        string calldata _beneficiaryHash
    ) external {
        _requireCampaignExists(_campaignId);
        _requireNGO(_campaignId);
        _requireCampaignActive(_campaignId);
        require(_milestoneIndex < campaigns[_campaignId].milestoneCount, "Invalid milestone");

        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        require(!m.isApproved,                      "Already approved");
        require(!m.isRejected,                      "Milestone rejected");
        require(bytes(_invoiceHash).length     > 0, "Invoice hash required");
        require(bytes(_photoHash).length       > 0, "Photo hash required");
        require(bytes(_beneficiaryHash).length > 0, "Beneficiary hash required");

        m.invoiceIPFS     = _invoiceHash;
        m.photoIPFS       = _photoHash;
        m.beneficiaryIPFS = _beneficiaryHash;

        emit ProofSubmitted(_campaignId, _milestoneIndex, _invoiceHash, _photoHash, _beneficiaryHash);
    }

    // KEY FIX: approveMilestone split into public entry + internal body.
    // The entry point does guard checks; the body handles logic.
    // Each function stays comfortably under 16 stack slots.
    function approveMilestone(uint256 _campaignId, uint256 _milestoneIndex) external {
        _requireCampaignExists(_campaignId);
        _requireValidator();
        _requireCampaignActive(_campaignId);
        require(_milestoneIndex < campaigns[_campaignId].milestoneCount, "Invalid milestone");
        _doApproveMilestone(_campaignId, _milestoneIndex);
    }

    function generateBeneficiaryHash(
        uint256 _campaignId,
        uint256 _milestoneIndex,
        uint256 _slot
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_campaignId, _milestoneIndex, _slot));
    }

    function confirmReceipt(
        uint256 _campaignId,
        uint256 _milestoneIndex,
        uint256 _slot
    ) external {
        _requireCampaignExists(_campaignId);
        bytes32 bHash = generateBeneficiaryHash(_campaignId, _milestoneIndex, _slot);
        require(!beneficiaryConfirmed[bHash], "Already confirmed");
        beneficiaryConfirmed[bHash] = true;
        milestones[_campaignId][_milestoneIndex].confirmedCount++;
        emit BeneficiaryConfirmed(bHash, msg.sender);
    }

    function claimReleasedFunds(uint256 _campaignId, uint256 _milestoneIndex)
        external nonReentrant
    {
        _requireCampaignExists(_campaignId);
        _doClaimReleasedFunds(_campaignId, _milestoneIndex);
    }

    function challengeMilestone(uint256 _campaignId, uint256 _milestoneIndex)
        external payable
    {
        _requireCampaignExists(_campaignId);
        require(msg.value >= CHALLENGE_STAKE, "Must stake 0.001 MATIC");

        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        require(m.isApproved,                     "Not approved");
        require(!m.fundsClaimed,                  "Already claimed");
        require(!m.challenged,                    "Already challenged");
        require(block.timestamp < m.releaseAfter, "Challenge window closed");

        m.challenged = true;
        emit MilestoneChallenged(_campaignId, _milestoneIndex, msg.sender);
    }

    function triggerRefund(uint256 _campaignId) external nonReentrant {
        _requireCampaignExists(_campaignId);

        CampaignInfo storage c = campaigns[_campaignId];
        require(c.isActive,  "Campaign already closed");
        require(!c.isFrozen, "Campaign already frozen");
        require(_hasExpiredMilestone(_campaignId, c.milestoneCount), "No expired milestones found");

        c.isFrozen = true;
        c.isActive = false;
        emit CampaignFrozen(_campaignId);
        emit RefundTriggered(_campaignId, msg.sender);

        if (address(trustScoreContract) != address(0)) {
            try trustScoreContract.trackMilestoneRejection(c.ngoAddress) {} catch {}
        }
        _refundAllDonors(_campaignId);
    }

    function refundDonors(uint256 _campaignId) external nonReentrant {
        _requireCampaignExists(_campaignId);

        CampaignInfo storage c = campaigns[_campaignId];
        require(c.isFrozen, "Campaign must be frozen");
        require(c.isActive, "Campaign already closed");

        c.isActive = false;
        _refundAllDonors(_campaignId);
    }

    function registerValidator() external payable nonReentrant {
        require(!validators[msg.sender],      "Already a validator");
        require(msg.value >= VALIDATOR_STAKE, "Must stake at least 0.01 MATIC");
        validators[msg.sender]      = true;
        validatorStakes[msg.sender] = msg.value;
        validatorCount++;
        emit ValidatorRegistered(msg.sender);
    }

    function freezeCampaign(uint256 _campaignId) external onlyOwner {
        _requireCampaignExists(_campaignId);
        campaigns[_campaignId].isFrozen = true;
        emit CampaignFrozen(_campaignId);
    }

    function voteEmergency(uint256 _campaignId) external {
        _requireCampaignExists(_campaignId);
        _requireValidator();
        require(!emergencyVoted[_campaignId][msg.sender], "Already voted for emergency");
        require(campaigns[_campaignId].isActive,          "Campaign not active");

        emergencyVoted[_campaignId][msg.sender] = true;
        campaigns[_campaignId].emergencyVotes++;

        if (campaigns[_campaignId].emergencyVotes >= 2) {
            campaigns[_campaignId].isEmergency = true;
            emit EmergencyActivated(_campaignId);
        }
    }

    function reportFraud(
        uint256 _campaignId,
        uint256 _milestoneIndex,
        string calldata _evidenceIPFS,
        string calldata _reason
    ) external payable {
        _requireCampaignExists(_campaignId);
        require(msg.value >= CHALLENGE_STAKE, "Stake 0.001 MATIC required");
        require(_milestoneIndex < campaigns[_campaignId].milestoneCount, "Invalid milestone");

        uint256 reportId = fraudReports.length;
        fraudReports.push(FraudReport({
            reporter:       msg.sender,
            campaignId:     _campaignId,
            milestoneIndex: _milestoneIndex,
            evidenceIPFS:   _evidenceIPFS,
            reason:         _reason,
            resolved:       false,
            upheld:         false,
            stakedAmount:   msg.value
        }));
        reporterReports[msg.sender].push(reportId);
        emit FraudReported(_campaignId, _milestoneIndex, msg.sender, reportId);
    }

    function resolveFraudReport(uint256 _reportId, bool _isUpheld) external onlyOwner {
        require(_reportId < fraudReports.length, "Invalid report");
        FraudReport storage r = fraudReports[_reportId];
        require(!r.resolved, "Already resolved");

        r.resolved = true;
        r.upheld   = _isUpheld;

        if (_isUpheld) _handleUpheldReport(r);

        emit FraudReportResolved(_reportId, _isUpheld);
    }

    // ============ Internal Functions ============

    function _initMilestones(uint256 cId, CampaignParams calldata p)
        internal returns (uint256 total)
    {
        for (uint256 i = 0; i < p.milestoneAmounts.length; i++) {
            _initSingleMilestone(cId, i, p);
            total += p.milestoneAmounts[i];
        }
    }

    function _initSingleMilestone(uint256 cId, uint256 i, CampaignParams calldata p) internal {
        require(p.milestoneAmounts[i] > 0, "Milestone amount must be > 0");
        Milestone storage m    = milestones[cId][i];
        m.description          = p.milestoneDescriptions[i];
        m.fundAmount           = p.milestoneAmounts[i];
        m.deadline             = p.milestoneDeadlines[i];
        m.beneficiaryCount     = p.beneficiaryCounts[i];
    }

    function _doApproveMilestone(uint256 _campaignId, uint256 _milestoneIndex) internal {
        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        require(bytes(m.invoiceIPFS).length > 0,                         "No proof submitted");
        require(!m.isApproved,                                           "Already approved");
        require(!hasVoted[_campaignId][_milestoneIndex][msg.sender],     "Already voted");

        if (m.beneficiaryCount > 0) {
            uint256 required = (m.beneficiaryCount * BENEFICIARY_CONFIRM_THRESHOLD) / 100;
            require(m.confirmedCount >= required, "Need 70% beneficiary confirmations");
        }

        hasVoted[_campaignId][_milestoneIndex][msg.sender] = true;
        m.approvalCount++;

        uint8 threshold = campaigns[_campaignId].isEmergency ? 1 : APPROVAL_THRESHOLD;
        if (m.approvalCount >= threshold) {
            m.isApproved = true;
            totalMilestonesCompleted++;
            emit MilestoneApproved(_campaignId, _milestoneIndex);
            _scheduleFundRelease(_campaignId, _milestoneIndex);
        }
    }

    function _doClaimReleasedFunds(uint256 _campaignId, uint256 _milestoneIndex) internal {
        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        require(m.isApproved,                      "Not approved");
        require(!m.fundsClaimed,                   "Already claimed");
        require(!m.challenged,                     "Milestone is challenged");
        require(m.releaseAfter > 0,                "Not scheduled for release");
        require(block.timestamp >= m.releaseAfter, "Challenge window still open");

        m.fundsClaimed  = true;
        m.fundsReleased = true;

        uint256 amount          = m.fundAmount;
        address payable ngo     = campaigns[_campaignId].ngoAddress;
        uint256 dl              = m.deadline;

        if (IERC20(USDC).balanceOf(address(this)) >= amount) {
            require(IERC20(USDC).transfer(ngo, amount), "USDC transfer failed");
            emit FundsClaimed(_campaignId, _milestoneIndex, amount);
            _postClaim(_campaignId, ngo, dl);
        }
    }

    function _postClaim(uint256 _campaignId, address payable ngo, uint256 deadline) internal {
        if (address(trustScoreContract) != address(0)) {
            bool onTime = (deadline == 0 || block.timestamp <= deadline);
            try trustScoreContract.trackMilestoneCompletion(ngo, onTime) {} catch {}
        }
        _checkAllMilestonesComplete(_campaignId);
    }

    function _hasExpiredMilestone(uint256 _campaignId, uint256 count)
        internal view returns (bool)
    {
        for (uint256 i = 0; i < count; i++) {
            Milestone storage m = milestones[_campaignId][i];
            if (
                m.deadline > 0 &&
                block.timestamp > m.deadline &&
                bytes(m.invoiceIPFS).length == 0 &&
                !m.isApproved
            ) return true;
        }
        return false;
    }

    function _refundAllDonors(uint256 _campaignId) internal {
        address[] memory donors = campaignDonors[_campaignId];
        uint256 totalRefunded;
        for (uint256 i = 0; i < donors.length; i++) {
            uint256 amt = donations[_campaignId][donors[i]];
            if (amt > 0) {
                donations[_campaignId][donors[i]] = 0;
                if (IERC20(USDC).transfer(donors[i], amt)) totalRefunded += amt;
            }
        }
        emit DonorsRefunded(_campaignId, totalRefunded);
    }

    function _handleUpheldReport(FraudReport storage r) internal {
        uint256 cId = r.campaignId;
        campaigns[cId].isActive = false;
        campaigns[cId].isFrozen = true;
        emit CampaignFrozen(cId);

        uint256 reward = campaigns[cId].raisedFunds / 10;
        if (reward > 0 && IERC20(USDC).balanceOf(address(this)) >= reward) {
            IERC20(USDC).transfer(r.reporter, reward);
        }
        payable(r.reporter).transfer(r.stakedAmount);
    }

    function _checkAndReleaseSeed(uint256 _campaignId) internal {
        CampaignInfo storage c = campaigns[_campaignId];
        if (c.seedReleased || c.raisedFunds < c.totalFunds) return;

        c.seedReleased = true;
        uint256 pct  = c.isEmergency ? 50 : SEED_PERCENT;
        uint256 seed = milestones[_campaignId][0].fundAmount * pct / 100;

        if (seed > 0 && IERC20(USDC).balanceOf(address(this)) >= seed) {
            IERC20(USDC).transfer(c.ngoAddress, seed);
            emit SeedReleased(_campaignId, seed);
        }
    }

    function _scheduleFundRelease(uint256 _campaignId, uint256 _milestoneIndex) internal {
        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        m.approvedAt   = block.timestamp;
        m.releaseAfter = block.timestamp + CHALLENGE_WINDOW;
        emit FundsScheduled(_campaignId, _milestoneIndex, m.fundAmount, m.releaseAfter);
    }

    function _checkAllMilestonesComplete(uint256 _campaignId) internal {
        CampaignInfo storage c = campaigns[_campaignId];
        for (uint256 i = 0; i < c.milestoneCount; i++) {
            if (!milestones[_campaignId][i].fundsClaimed) return;
        }
        if (address(trustScoreContract) != address(0)) {
            try trustScoreContract.trackCampaignCompleted(c.ngoAddress) {} catch {}
        }
    }

    // ============ View Functions ============
    // KEY FIX: Removed named return parameters from all view functions.
    // Named returns create local variable slots just like declarations do,
    // eating into the 16-slot limit even in view functions.

    function getCampaignBasic(uint256 _campaignId)
        external view
        returns (uint256, address, string memory, string memory)
    {
        _requireCampaignExists(_campaignId);
        CampaignInfo storage c = campaigns[_campaignId];
        return (c.campaignId, c.ngoAddress, c.title, c.description);
    }

    function getCampaignFunds(uint256 _campaignId)
        external view
        returns (uint256, uint256, uint256, bool, bool, bool)
    {
        _requireCampaignExists(_campaignId);
        CampaignInfo storage c = campaigns[_campaignId];
        return (c.totalFunds, c.raisedFunds, c.milestoneCount, c.isActive, c.isFrozen, c.seedReleased);
    }

    function getCampaignEmergency(uint256 _campaignId)
        external view
        returns (bool, uint256)
    {
        _requireCampaignExists(_campaignId);
        CampaignInfo storage c = campaigns[_campaignId];
        return (c.isEmergency, c.emergencyVotes);
    }

    function getMilestoneBasic(uint256 _campaignId, uint256 _milestoneIndex)
        external view
        returns (string memory, uint256, string memory, string memory, string memory, uint256)
    {
        _requireCampaignExists(_campaignId);
        require(_milestoneIndex < campaigns[_campaignId].milestoneCount, "Invalid milestone");
        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        return (m.description, m.fundAmount, m.invoiceIPFS, m.photoIPFS, m.beneficiaryIPFS, m.deadline);
    }

    function getMilestoneStatus(uint256 _campaignId, uint256 _milestoneIndex)
        external view
        returns (uint256, uint256, uint8, bool, bool, bool)
    {
        _requireCampaignExists(_campaignId);
        require(_milestoneIndex < campaigns[_campaignId].milestoneCount, "Invalid milestone");
        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        return (m.beneficiaryCount, m.confirmedCount, m.approvalCount, m.isApproved, m.isRejected, m.fundsReleased);
    }

    function getMilestoneChallenge(uint256 _campaignId, uint256 _milestoneIndex)
        external view
        returns (uint256, bool, uint256, bool)
    {
        _requireCampaignExists(_campaignId);
        Milestone storage m = milestones[_campaignId][_milestoneIndex];
        return (m.approvedAt, m.challenged, m.releaseAfter, m.fundsClaimed);
    }

    function getCampaignCount()     external view returns (uint256) { return campaignCount; }
    function isValidator(address a) external view returns (bool)    { return validators[a]; }
    function getContractBalance()   external view returns (uint256) { return IERC20(USDC).balanceOf(address(this)); }
    function getFraudReportCount()  external view returns (uint256) { return fraudReports.length; }

    function getDonation(uint256 _campaignId, address _donor)
        external view returns (uint256)
    { return donations[_campaignId][_donor]; }

    function getDonors(uint256 _campaignId)
        external view returns (address[] memory)
    {
        _requireCampaignExists(_campaignId);
        return campaignDonors[_campaignId];
    }

    function getFraudReportBasic(uint256 _reportId)
        external view
        returns (address, uint256, uint256, string memory, string memory)
    {
        require(_reportId < fraudReports.length, "Invalid report");
        FraudReport storage r = fraudReports[_reportId];
        return (r.reporter, r.campaignId, r.milestoneIndex, r.evidenceIPFS, r.reason);
    }

    function getFraudReportResult(uint256 _reportId)
        external view
        returns (bool, bool, uint256)
    {
        require(_reportId < fraudReports.length, "Invalid report");
        FraudReport storage r = fraudReports[_reportId];
        return (r.resolved, r.upheld, r.stakedAmount);
    }

    function getReporterReports(address _reporter)
        external view returns (uint256[] memory)
    { return reporterReports[_reporter]; }
}
