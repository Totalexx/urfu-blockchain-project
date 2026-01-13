import { expect } from "chai";
import { ethers } from "hardhat";
import type { Polls } from "../typechain-types/Polls";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Polls contract", function () {
  let polls: Polls;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    deployer = signers[0] as unknown as SignerWithAddress;
    user = signers[1] as unknown as SignerWithAddress;

    const PollsFactory = await ethers.getContractFactory("Polls");
    polls = (await PollsFactory.deploy()) as Polls;
  });

  it("should create a poll and return correct ID", async function () {
    const options = ["Option 1", "Option 2"];
    const tx = await polls.createPoll("Test Question?", options);
    await tx.wait();

    const total = await polls.totalPolls();
    expect(total).to.equal(1);
  });

  it("should allow voting and increment the correct option", async function () {
    const options = ["Option 1", "Option 2"];
    await polls.createPoll("Vote Test?", options);

    await polls.vote(0, 1);

    const [, , votes] = await polls.getPoll(0);
    expect(votes[1]).to.equal(1);
  });

  it("should emit Voted event when voting", async function () {
    const options = ["Option 1", "Option 2"];
    await polls.createPoll("Event Test?", options);

    await expect(polls.vote(0, 0)).to.emit(polls, "Voted").withArgs(0, 0, deployer.address);
  });

  it("should prevent double voting", async function () {
    const options = ["Option 1", "Option 2"];
    await polls.createPoll("No Double Vote?", options);

    await polls.vote(0, 0); // первый голос
    await expect(polls.vote(0, 1)).to.be.revertedWith("You already voted");
  });

  it("should allow different users to vote", async function () {
    const options = ["Option A", "Option B"];
    await polls.createPoll("Multi-user Test?", options);

    await polls.vote(0, 0); // deployer
    const userSigner = await ethers.provider.getSigner(user.address);
    await polls.connect(userSigner).vote(0, 1); // user

    const [, , votes] = await polls.getPoll(0);
    expect(votes[0]).to.equal(1n); // Adjusted for bigint
    expect(votes[1]).to.equal(1n); // Adjusted for bigint
  });

  it("should fail to create a poll with less than 2 options", async function () {
    await expect(polls.createPoll("Invalid Poll?", ["Only One Option"])).to.be.revertedWith(
      "At least 2 options required",
    );
  });

  it("should fail to vote on a non-existent poll", async function () {
    await expect(polls.vote(999, 0)).to.be.revertedWith("Poll does not exist");
  });

  it("should fail to vote on a non-existent option", async function () {
    const options = ["Option 1", "Option 2"];
    await polls.createPoll("Invalid Option Test?", options);

    await expect(polls.vote(0, 5)).to.be.revertedWith("Invalid option");
  });

  it("should return correct poll data", async function () {
    const options = ["Option 1", "Option 2"];
    await polls.createPoll("Poll Data Test?", options);

    const [question, pollOptions, votes] = await polls.getPoll(0);
    expect(question).to.equal("Poll Data Test?");
    expect(pollOptions).to.deep.equal(options);
    expect(votes.map((v: bigint) => Number(v))).to.deep.equal([0, 0]); // Adjusted for bigint
  });

  it("should handle polls with a large number of options", async function () {
    const options = Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`);
    await polls.createPoll("Large Poll Test?", options);

    const [question, pollOptions] = await polls.getPoll(0);
    expect(question).to.equal("Large Poll Test?");
    expect(pollOptions.length).to.equal(100);
  });

  it("should fail to create a poll with an empty question", async function () {
    await expect(polls.createPoll("", ["Option 1", "Option 2"])).to.be.revertedWith("Question cannot be empty");
  });

  it("should fail to create a poll with empty options", async function () {
    await expect(polls.createPoll("Empty Options Test?", [])).to.be.revertedWith("At least 2 options required");
  });
});
