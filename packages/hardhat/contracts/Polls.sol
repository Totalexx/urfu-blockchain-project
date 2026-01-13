// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Polls {
    struct PollData {
        string question;
        string[] options;
        uint256[] votes;
        bool exists;
    }

    PollData[] public polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event Voted(uint256 pollId, uint256 optionIndex, address voter);

    function createPoll(string memory question, string[] memory options) external returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= 2, "At least 2 options required");

        uint256[] memory votes = new uint256[](options.length);
        polls.push(PollData({
            question: question,
            options: options,
            votes: votes,
            exists: true
        }));

        return polls.length - 1;
    }

    function vote(uint256 pollId, uint256 optionIndex) external {
        require(pollId < polls.length, "Poll does not exist");
        PollData storage poll = polls[pollId];
        require(!hasVoted[pollId][msg.sender], "You already voted");
        require(optionIndex < poll.options.length, "Invalid option");

        poll.votes[optionIndex] += 1;
        hasVoted[pollId][msg.sender] = true;

        emit Voted(pollId, optionIndex, msg.sender);
    }

    function getPoll(uint256 pollId) external view returns (string memory, string[] memory, uint256[] memory) {
        require(pollId < polls.length, "Poll does not exist");
        PollData storage poll = polls[pollId];

        return (poll.question, poll.options, poll.votes);
    }

    function totalPolls() external view returns (uint256) {
        return polls.length;
    }
}