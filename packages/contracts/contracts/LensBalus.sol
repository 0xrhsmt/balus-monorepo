// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IERC721} from "openzeppelin-contracts/contracts/interfaces/IERC721.sol";
import {ILensHub} from "./interfaces/ILensHub.sol";
import {LensDataTypes} from "./LensDataTypes.sol";

contract LensBalus {
    address public immutable HUB;
    mapping(uint256 => Event) public events;

    struct Event {
        uint256 id;
        string descriptionCid;
        string postContentCid;
        address owner;
        PartnerRequest[] partnerRequests;
        Partner[] partners;
    }

    struct PartnerRequest {
        uint256 profileId;
        bool isAccepted;
    }

    struct Partner {
        uint256 profileId;
        uint256 pubId;
    }

    event EventCreated(
        uint256 indexed id,
        string descriptionCid,
        string postContentCid,
        uint256[] partnerRequests
    );

    constructor(address hub) {
        if (hub == address(0))
            revert("LensPostScheduler: hub cannot be zero address");
        HUB = hub;
    }

    function createEvent(
        string memory descriptionCid,
        string memory postContentCid,
        uint256[] memory partnerRequests
    ) public returns (uint256) {
        uint256 id = uint256(
            keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1)))
        );

        Event storage anEvent = events[id];
        if (anEvent.id != 0)
            revert("LensBalus: event already exists");
        anEvent.id = id;
        anEvent.descriptionCid = descriptionCid;
        anEvent.postContentCid = postContentCid;
        anEvent.owner = msg.sender;
        for (uint256 i = 0; i < partnerRequests.length; i++) {
            anEvent.partnerRequests.push(
                PartnerRequest({
                    profileId: partnerRequests[i],
                    isAccepted: false
                })
            );
        }

        emit EventCreated(id, descriptionCid, postContentCid, partnerRequests);

        return id;
    }

    function becomePartner(
        uint256 eventId,
        uint256 partnerRequestIndex
    ) public {
        Event storage anEvent = events[eventId];
        if (anEvent.id == 0)
            revert("LensBalus: event does not exist");

        PartnerRequest storage request = anEvent.partnerRequests[
            partnerRequestIndex
        ];
        if (request.profileId == 0) revert("LensBalus: request does not exist");
        if (request.isAccepted == true)
            revert("LensBalus: request has already been accepted");
        if (IERC721(HUB).ownerOf(request.profileId) != msg.sender)
            revert("LensBalus: you have not received a partner request.");

        request.isAccepted = true;

        Partner memory partner = Partner({
            profileId: request.profileId,
            pubId: 0
        });
        anEvent.partners.push(partner);
    }

    function post(uint256 eventId) public {
        Event storage anEvent = events[eventId];
        if (anEvent.id == 0)
            revert("LensBalus: event does not exist");
        if (anEvent.owner != msg.sender)
            revert("LensBalus: you are not the owner of this event");

        for (uint256 i = 0; i < anEvent.partners.length; i++) {
            Partner storage partner = anEvent.partners[i];
            if (partner.profileId == 0) continue;
            if (partner.pubId != 0) continue;
            if (ILensHub(HUB).getDispatcher(partner.profileId) == address(this))
                continue; // NOTE: dispatcher is not set

            uint256 pubId = ILensHub(HUB).post(
                LensDataTypes.PostData({
                    profileId: partner.profileId,
                    contentURI: anEvent.postContentCid,
                    collectModule: 0x0BE6bD7092ee83D44a6eC1D949626FeE48caB30c, // TODO: collectModule
                    collectModuleInitData: abi.encode(false), // TODO: collectModuleInitData
                    referenceModule: address(0),
                    referenceModuleInitData: ""
                })
            );

            partner.pubId = pubId;
        }
    }

    function getPartnerRequests(
        uint256 id
    ) public view returns (PartnerRequest[] memory) {
        Event memory anEvent = events[id];
        if (anEvent.id == 0) revert("LensBalus: event does not exist");

        return anEvent.partnerRequests;
    }

    function getPartners(
        uint256 id
    ) public view returns (Partner[] memory) {
        Event memory anEvent = events[id];
        if (anEvent.id == 0) revert("LensBalus: event does not exist");

        return anEvent.partners;
    }
}
