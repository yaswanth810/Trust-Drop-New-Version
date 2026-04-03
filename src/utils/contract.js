import { ethers } from 'ethers';
import { parseUSDC } from './helpers';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

export function getUSDCContract(signer) {
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
}

export async function approveUSDC(signer, amount) {
  const usdc = getUSDCContract(signer);
  return await usdc.approve(CONTRACT_ADDRESS, amount);
}

export async function getUSDCBalance(signer, address) {
  try {
    const usdc = getUSDCContract(signer);
    return await usdc.balanceOf(address);
  } catch (err) {
    console.error('Error fetching USDC balance:', err);
    return BigInt(0);
  }
}

// ============ Campaign Functions ============

export async function getAllCampaigns(contract) {
  try {
    const count = await contract.getCampaignCount();
    const campaigns = [];
    for (let i = 0; i < Number(count); i++) {
      const campaign = await getCampaignById(contract, i);
      if (campaign) campaigns.push(campaign);
    }
    return campaigns;
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    return [];
  }
}

export async function getCampaignById(contract, campaignId) {
  try {
    const [basic, funds, emergency] = await Promise.all([
      contract.getCampaignBasic(campaignId),
      contract.getCampaignFunds(campaignId),
      contract.getCampaignEmergency(campaignId).catch(() => [false, 0]),
    ]);

    const milestoneCount = Number(funds[2]);
    const milestonesList = await getMilestones(contract, campaignId, milestoneCount);

    return {
      campaignId: Number(basic[0]),
      ngoAddress: basic[1],
      title: basic[2],
      description: basic[3],
      totalFunds: funds[0],
      raisedFunds: funds[1],
      milestoneCount,
      isActive: funds[3],
      isFrozen: funds[4],
      seedReleased: funds[5],
      isEmergency: emergency[0],
      emergencyVotes: Number(emergency[1]),
      milestones: milestonesList,
    };
  } catch (err) {
    console.error(`Error fetching campaign ${campaignId}:`, err);
    return null;
  }
}

export async function getMilestones(contract, campaignId, count) {
  const milestonesList = [];
  for (let i = 0; i < count; i++) {
    try {
      const [basic, status, ch] = await Promise.all([
        contract.getMilestoneBasic(campaignId, i),
        contract.getMilestoneStatus(campaignId, i),
        contract.getMilestoneChallenge(campaignId, i).catch(() => [0, false, 0, false]),
      ]);
      milestonesList.push({
        index: i,
        description: basic[0],
        fundAmount: basic[1],
        invoiceIPFS: basic[2],
        photoIPFS: basic[3],
        beneficiaryIPFS: basic[4],
        deadline: Number(basic[5]),
        beneficiaryCount: Number(status[0]),
        confirmedCount: Number(status[1]),
        approvalCount: Number(status[2]),
        isApproved: status[3],
        isRejected: status[4],
        fundsReleased: status[5],
        // Challenge window
        approvedAt: Number(ch[0]),
        challenged: ch[1],
        releaseAfter: Number(ch[2]),
        fundsClaimed: ch[3],
        // Backward compat
        ipfsHash: basic[2],
      });
    } catch (err) {
      console.error(`Error fetching milestone ${i}:`, err);
    }
  }
  return milestonesList;
}

// ============ Donation ============

export async function donateToCampaign(contract, signer, campaignId, amountStr, onApproved) {
  const rawAmount = parseUSDC(amountStr);
  if (rawAmount === BigInt(0)) throw new Error('Invalid amount');
  const approveTx = await approveUSDC(signer, rawAmount);
  await approveTx.wait();
  if (onApproved) onApproved();
  return await contract.donate(campaignId, rawAmount);
}

// ============ Campaign Creation ============

export async function createNewCampaign(contract, title, description, milestoneDescs, milestoneAmounts, milestoneDeadlines, beneficiaryCounts) {
  const amounts = milestoneAmounts.map((a) => parseUSDC(a));
  const deadlines = milestoneDeadlines.map((d) => Math.floor(new Date(d).getTime() / 1000));
  const benCounts = (beneficiaryCounts || []).map((c) => Number(c) || 0);
  // Pad if needed
  while (benCounts.length < amounts.length) benCounts.push(0);
  // Pass as CampaignParams struct
  const params = {
    title,
    description,
    milestoneDescriptions: milestoneDescs,
    milestoneAmounts: amounts,
    milestoneDeadlines: deadlines,
    beneficiaryCounts: benCounts,
  };
  return await contract.createCampaign(params);
}

// ============ Feature 1: 3-Doc Proof Submission ============

export async function submitProof(contract, campaignId, milestoneIndex, invoiceHash, photoHash, beneficiaryHash) {
  return await contract.submitMilestoneProof(campaignId, milestoneIndex, invoiceHash, photoHash, beneficiaryHash);
}

// ============ Milestone Approval ============

export async function approveMilestone(contract, campaignId, milestoneIndex) {
  return await contract.approveMilestone(campaignId, milestoneIndex);
}

// ============ Feature 2: Beneficiary Confirmation ============

export async function confirmBeneficiaryReceipt(contract, campaignId, milestoneIndex, slot) {
  return await contract.confirmReceipt(campaignId, milestoneIndex, slot);
}

export async function generateBeneficiaryHash(contract, campaignId, milestoneIndex, slot) {
  return await contract.generateBeneficiaryHash(campaignId, milestoneIndex, slot);
}

export async function isBeneficiaryConfirmed(contract, campaignId, milestoneIndex, slot) {
  try {
    const hash = await contract.generateBeneficiaryHash(campaignId, milestoneIndex, slot);
    return await contract.beneficiaryConfirmed(hash);
  } catch { return false; }
}

// ============ Feature 4: Challenge Window ============

export async function claimReleasedFunds(contract, campaignId, milestoneIndex) {
  return await contract.claimReleasedFunds(campaignId, milestoneIndex);
}

export async function challengeMilestone(contract, campaignId, milestoneIndex) {
  return await contract.challengeMilestone(campaignId, milestoneIndex, {
    value: ethers.parseEther('0.001'),
  });
}

// ============ Validator ============

export async function registerAsValidator(contract) {
  return await contract.registerValidator({ value: ethers.parseEther('0.01') });
}

export async function checkIsValidator(contract, address) {
  try { return await contract.isValidator(address); } catch { return false; }
}

// ============ Refunds ============

export async function triggerRefund(contract, campaignId) {
  return await contract.triggerRefund(campaignId);
}

// ============ Stats & Queries ============

export async function getDonationAmount(contract, campaignId, donorAddress) {
  try { return await contract.getDonation(campaignId, donorAddress); } catch { return BigInt(0); }
}

export async function getPlatformStats(contract) {
  try {
    const [totalDonated, campaignCount, milestonesCompleted] = await Promise.all([
      contract.totalDonated(),
      contract.getCampaignCount(),
      contract.totalMilestonesCompleted(),
    ]);
    return {
      totalDonated: Number(totalDonated) / 1_000_000,
      campaignCount: Number(campaignCount),
      milestonesCompleted: Number(milestonesCompleted),
    };
  } catch (err) {
    console.error('Error fetching stats:', err);
    return { totalDonated: 0, campaignCount: 0, milestonesCompleted: 0 };
  }
}

export async function getCampaignDonors(contract, campaignId) {
  try { return await contract.getDonors(campaignId); } catch { return []; }
}

export async function getDonorBadgeInfo(nftContract, donorAddress) {
  try {
    const info = await nftContract.getDonorInfo(donorAddress);
    return { totalDonated: info[0], campaignsSupported: Number(info[1]), highestTier: Number(info[2]), badgeCount: Number(info[3]) };
  } catch { return null; }
}

export function hasExpiredMilestones(campaign) {
  if (!campaign?.milestones) return false;
  const now = Math.floor(Date.now() / 1000);
  return campaign.milestones.some(
    (m) => m.deadline > 0 && now > m.deadline && !m.invoiceIPFS && !m.isApproved && !m.fundsReleased
  );
}

export function countPendingProofs(campaigns) {
  let count = 0;
  campaigns.forEach((c) => {
    if (!c?.milestones) return;
    c.milestones.forEach((m) => {
      if (m.invoiceIPFS && !m.isApproved && !m.fundsReleased) count++;
    });
  });
  return count;
}

// ============ Emergency Mode ============

export async function voteEmergency(contract, campaignId) {
  return await contract.voteEmergency(campaignId);
}

// ============ Whistleblower ============

export async function reportFraud(contract, campaignId, milestoneIndex, evidenceIPFS, reason) {
  return await contract.reportFraud(campaignId, milestoneIndex, evidenceIPFS, reason, {
    value: ethers.parseEther('0.001'),
  });
}

export async function getFraudReportCount(contract) {
  try { return Number(await contract.getFraudReportCount()); } catch { return 0; }
}

export async function getFraudReport(contract, reportId) {
  try {
    const [basic, result] = await Promise.all([
      contract.getFraudReportBasic(reportId),
      contract.getFraudReportResult(reportId),
    ]);
    return {
      reporter: basic[0], campaignId: Number(basic[1]), milestoneIndex: Number(basic[2]),
      evidenceIPFS: basic[3], reason: basic[4],
      resolved: result[0], upheld: result[1], stakedAmount: result[2],
    };
  } catch { return null; }
}

export async function getReporterReports(contract, address) {
  try {
    const ids = await contract.getReporterReports(address);
    return ids.map((id) => Number(id));
  } catch { return []; }
}

export async function getMyFraudReports(contract, address) {
  const ids = await getReporterReports(contract, address);
  const reports = [];
  for (const id of ids) {
    const report = await getFraudReport(contract, id);
    if (report) reports.push({ ...report, reportId: id });
  }
  return reports;
}
