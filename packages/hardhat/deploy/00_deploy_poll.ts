import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployPollsContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("Polls", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("Contract deployed at: ", deployed.address);
};

export default deployPollsContract;
deployPollsContract.tags = ["PollsContract"];
