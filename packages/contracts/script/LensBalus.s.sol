// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/LensBalus.sol";

contract LensBalusScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        new LensBalus(0x60Ae865ee4C725cd04353b5AAb364553f56ceF82);

        vm.stopBroadcast();
    }
}
