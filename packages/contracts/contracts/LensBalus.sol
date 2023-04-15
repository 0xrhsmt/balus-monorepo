// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IERC721} from "openzeppelin-contracts/contracts/interfaces/IERC721.sol";
import {ILensHub} from "./interfaces/ILensHub.sol";
import {LensDataTypes} from "./LensDataTypes.sol";

contract LensBalus {
    address public immutable HUB;
    mapping(uint256 => Announcement) public announcements;

    struct Announcement {
        uint256 id;
        string infoCid;
        string contentCid;
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

    event AnnouncementCreated(
        uint256 indexed id,
        string infoCid,
        string contentCid,
        uint256[] partnerRequests
    );

    constructor(address hub) {
        if (hub == address(0))
            revert("LensPostScheduler: hub cannot be zero address");
        HUB = hub;
    }

    function createAnnouncement(
        string memory infoCid,
        string memory contentCid,
        uint256[] memory partnerRequests
    ) public returns (uint256) {
        uint256 id = uint256(
            keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1)))
        );

        Announcement storage announcement = announcements[id];
        if (announcement.id != 0)
            revert("LensBalus: announcement already exists");
        announcement.id = id;
        announcement.infoCid = infoCid;
        announcement.contentCid = contentCid;
        announcement.owner = msg.sender;
        for (uint256 i = 0; i < partnerRequests.length; i++) {
            announcement.partnerRequests.push(
                PartnerRequest({
                    profileId: partnerRequests[i],
                    isAccepted: false
                })
            );
        }

        emit AnnouncementCreated(id, infoCid, contentCid, partnerRequests);

        return id;
    }

    function becomePartner(
        uint256 announcementId,
        uint256 partnerRequestIndex
    ) public {
        Announcement storage announcement = announcements[announcementId];
        if (announcement.id == 0)
            revert("LensBalus: announcement does not exist");

        PartnerRequest storage request = announcement.partnerRequests[
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
        announcement.partners.push(partner);
    }

    function post(uint256 announcementId) public {
        Announcement storage announcement = announcements[announcementId];
        if (announcement.id == 0)
            revert("LensBalus: announcement does not exist");
        if (announcement.owner != msg.sender)
            revert("LensBalus: you are not the owner of this announcement");

        for (uint256 i = 0; i < announcement.partners.length; i++) {
            Partner storage partner = announcement.partners[i];
            if (partner.profileId == 0) continue;
            if (partner.pubId != 0) continue;
            if (ILensHub(HUB).getDispatcher(partner.profileId) == address(this))
                continue; // NOTE: dispatcher is not set

            uint256 pubId = ILensHub(HUB).post(
                LensDataTypes.PostData({
                    profileId: partner.profileId,
                    contentURI: announcement.contentCid,
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
        Announcement memory announcement = announcements[id];
        if (announcement.id == 0) revert("LensBalus: announcement does not exist");

        return announcement.partnerRequests;
    }

    function getPartners(
        uint256 id
    ) public view returns (Partner[] memory) {
        Announcement memory announcement = announcements[id];
        if (announcement.id == 0) revert("LensBalus: announcement does not exist");

        return announcement.partners;
    }
}
