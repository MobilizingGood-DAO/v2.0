// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CareToken is ERC20, Ownable, ReentrancyGuard {
    // Events
    event CarePointsAwarded(address indexed user, uint256 amount, string reason);
    event CarePointsTransferred(address indexed from, address indexed to, uint256 amount, string postId);
    event ActivityCompleted(address indexed user, string activityType, uint256 points);
    
    // Mapping to track user activities
    mapping(address => mapping(string => uint256)) public userActivities;
    mapping(address => uint256) public lastActivityTimestamp;
    
    // Activity point rewards
    uint256 public constant MOOD_CHECK_POINTS = 10 * 10**18; // 10 CARE tokens
    uint256 public constant JOURNAL_ENTRY_POINTS = 15 * 10**18; // 15 CARE tokens
    uint256 public constant COMMUNITY_POST_POINTS = 25 * 10**18; // 25 CARE tokens
    uint256 public constant COMMENT_POINTS = 10 * 10**18; // 10 CARE tokens
    uint256 public constant STREAK_BONUS_POINTS = 50 * 10**18; // 50 CARE tokens
    
    // Daily limits to prevent abuse
    uint256 public constant DAILY_MOOD_LIMIT = 1;
    uint256 public constant DAILY_JOURNAL_LIMIT = 3;
    uint256 public constant DAILY_POST_LIMIT = 5;
    
    constructor() ERC20("CARE Token", "CARE") {
        // Mint initial supply to contract owner for distribution
        _mint(msg.sender, 1000000 * 10**18); // 1M CARE tokens
    }
    
    modifier onlyOncePerDay(string memory activityType) {
        require(
            block.timestamp >= lastActivityTimestamp[msg.sender] + 1 days ||
            userActivities[msg.sender][activityType] == 0,
            "Activity already completed today"
        );
        _;
    }
    
    function awardMoodCheckPoints(address user) external onlyOwner {
        require(
            userActivities[user]["mood_check"] < DAILY_MOOD_LIMIT ||
            block.timestamp >= lastActivityTimestamp[user] + 1 days,
            "Daily mood check limit reached"
        );
        
        _mint(user, MOOD_CHECK_POINTS);
        
        if (block.timestamp >= lastActivityTimestamp[user] + 1 days) {
            userActivities[user]["mood_check"] = 1;
        } else {
            userActivities[user]["mood_check"]++;
        }
        
        lastActivityTimestamp[user] = block.timestamp;
        
        emit CarePointsAwarded(user, MOOD_CHECK_POINTS, "mood_check");
        emit ActivityCompleted(user, "mood_check", MOOD_CHECK_POINTS);
    }
    
    function awardJournalPoints(address user) external onlyOwner {
        require(
            userActivities[user]["journal"] < DAILY_JOURNAL_LIMIT ||
            block.timestamp >= lastActivityTimestamp[user] + 1 days,
            "Daily journal limit reached"
        );
        
        _mint(user, JOURNAL_ENTRY_POINTS);
        
        if (block.timestamp >= lastActivityTimestamp[user] + 1 days) {
            userActivities[user]["journal"] = 1;
        } else {
            userActivities[user]["journal"]++;
        }
        
        lastActivityTimestamp[user] = block.timestamp;
        
        emit CarePointsAwarded(user, JOURNAL_ENTRY_POINTS, "journal_entry");
        emit ActivityCompleted(user, "journal", JOURNAL_ENTRY_POINTS);
    }
    
    function awardCommunityPoints(address user) external onlyOwner {
        require(
            userActivities[user]["community_post"] < DAILY_POST_LIMIT ||
            block.timestamp >= lastActivityTimestamp[user] + 1 days,
            "Daily post limit reached"
        );
        
        _mint(user, COMMUNITY_POST_POINTS);
        
        if (block.timestamp >= lastActivityTimestamp[user] + 1 days) {
            userActivities[user]["community_post"] = 1;
        } else {
            userActivities[user]["community_post"]++;
        }
        
        lastActivityTimestamp[user] = block.timestamp;
        
        emit CarePointsAwarded(user, COMMUNITY_POST_POINTS, "community_post");
        emit ActivityCompleted(user, "community_post", COMMUNITY_POST_POINTS);
    }
    
    function awardCommentPoints(address user) external onlyOwner {
        _mint(user, COMMENT_POINTS);
        
        emit CarePointsAwarded(user, COMMENT_POINTS, "comment");
        emit ActivityCompleted(user, "comment", COMMENT_POINTS);
    }
    
    function awardStreakBonus(address user, uint256 streakDays) external onlyOwner {
        uint256 bonusMultiplier = streakDays / 7; // Bonus every 7 days
        uint256 bonusAmount = STREAK_BONUS_POINTS * bonusMultiplier;
        
        if (bonusAmount > 0) {
            _mint(user, bonusAmount);
            emit CarePointsAwarded(user, bonusAmount, "streak_bonus");
        }
    }
    
    function sendCarePoints(address to, uint256 amount, string memory postId) external nonReentrant {
        require(to != msg.sender, "Cannot send CARE to yourself");
        require(balanceOf(msg.sender) >= amount, "Insufficient CARE balance");
        require(amount > 0, "Amount must be greater than 0");
        
        _transfer(msg.sender, to, amount);
        
        emit CarePointsTransferred(msg.sender, to, amount, postId);
    }
    
    function getUserActivityCount(address user, string memory activityType) external view returns (uint256) {
        return userActivities[user][activityType];
    }
    
    function getRemainingDailyActivities(address user, string memory activityType) external view returns (uint256) {
        if (block.timestamp >= lastActivityTimestamp[user] + 1 days) {
            if (keccak256(bytes(activityType)) == keccak256(bytes("mood_check"))) {
                return DAILY_MOOD_LIMIT;
            } else if (keccak256(bytes(activityType)) == keccak256(bytes("journal"))) {
                return DAILY_JOURNAL_LIMIT;
            } else if (keccak256(bytes(activityType)) == keccak256(bytes("community_post"))) {
                return DAILY_POST_LIMIT;
            }
        }
        
        uint256 used = userActivities[user][activityType];
        if (keccak256(bytes(activityType)) == keccak256(bytes("mood_check"))) {
            return used >= DAILY_MOOD_LIMIT ? 0 : DAILY_MOOD_LIMIT - used;
        } else if (keccak256(bytes(activityType)) == keccak256(bytes("journal"))) {
            return used >= DAILY_JOURNAL_LIMIT ? 0 : DAILY_JOURNAL_LIMIT - used;
        } else if (keccak256(bytes(activityType)) == keccak256(bytes("community_post"))) {
            return used >= DAILY_POST_LIMIT ? 0 : DAILY_POST_LIMIT - used;
        }
        
        return 0;
    }
}
