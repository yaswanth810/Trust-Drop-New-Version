// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketRateOracle
 * @notice Stores reference market rates for common aid items.
 *         Used by TrustDrop to flag suspicious invoices.
 */
contract MarketRateOracle is Ownable {

    struct ItemRate {
        uint256 minRate;   // min cost per unit in USDC (6 decimals)
        uint256 maxRate;   // max cost per unit in USDC (6 decimals)
        bool exists;
    }

    // category string => rate range
    mapping(string => ItemRate) public itemRates;
    string[] public categories;

    // 0 = NORMAL, 1 = WARNING (+15%), 2 = FLAGGED (+50%)
    enum PriceCheck { NORMAL, WARNING, FLAGGED }

    event RateSet(string indexed category, uint256 minRate, uint256 maxRate);

    constructor() Ownable(msg.sender) {}

    /// @notice Set or update the market rate for an item category
    function setItemRate(
        string memory category,
        uint256 minRate,
        uint256 maxRate
    ) external onlyOwner {
        require(maxRate >= minRate, "Max must be >= min");
        if (!itemRates[category].exists) {
            categories.push(category);
        }
        itemRates[category] = ItemRate(minRate, maxRate, true);
        emit RateSet(category, minRate, maxRate);
    }

    /// @notice Check if a claimed price is within market range
    /// @param category Item category string
    /// @param totalClaimed Total USDC claimed (6 decimals)
    /// @param quantity Number of items
    /// @return PriceCheck result: NORMAL, WARNING, or FLAGGED
    function checkPrice(
        string memory category,
        uint256 totalClaimed,
        uint256 quantity
    ) external view returns (PriceCheck) {
        if (!itemRates[category].exists) return PriceCheck.NORMAL;
        if (quantity == 0) return PriceCheck.FLAGGED;

        uint256 perUnit = totalClaimed / quantity;
        uint256 maxNormal = itemRates[category].maxRate;

        if (perUnit <= maxNormal) return PriceCheck.NORMAL;
        if (perUnit <= maxNormal * 115 / 100) return PriceCheck.WARNING;
        return PriceCheck.FLAGGED;
    }

    /// @notice Get rate for a category
    function getRate(string memory category) external view returns (uint256 minRate, uint256 maxRate, bool exists) {
        ItemRate storage r = itemRates[category];
        return (r.minRate, r.maxRate, r.exists);
    }

    /// @notice Get all categories count
    function getCategoryCount() external view returns (uint256) {
        return categories.length;
    }
}
