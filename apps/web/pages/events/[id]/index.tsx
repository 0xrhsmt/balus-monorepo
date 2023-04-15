import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  useLensBalusGetPartnerRequests,
  useLensBalusGetPartners,
  usePrepareILensHubSetDispatcher,
  useILensHubSetDispatcher,
  useILensHubGetDispatcher,
  usePrepareLensBalusBecomePartner,
  useLensBalusBecomePartner,
  useLensBalusEvents,
  lensBalusAddress,
  usePrepareLensBalusPost,
  useLensBalusPost,
} from "contracts";
import { BigNumber } from "ethers";
import {
  useActiveProfile,
  useActiveWallet,
  useProfile,
} from "@lens-protocol/react-web";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL;

const Request = ({
  profileId,
  isApproved,
  pubId,
}: {
  profileId: BigNumber;
  isApproved: boolean;
  pubId?: BigNumber;
}) => {
  const { data: profile } = useProfile({
    profileId: profileId.toHexString() as any,
  });

  return (
    profile && (
      <tr className="border-b bg-gray-800 border-gray-700">
        <th
          scope="row"
          className="px-6 py-4 font-medium whitespace-nowrap text-white"
        >
          {profile.handle}
        </th>
        <td className="px-6 py-4">
          {isApproved ? (
            <CheckCircleIcon className="h-6 w-6 text-lime-500" />
          ) : (
            "--"
          )}
        </td>
        <td className="px-6 py-4">
          {pubId && pubId.gt(BigNumber.from(0)) ? (
            <a
              className="cursor-pointer"
              href={`https://testnet.lenster.xyz/posts/${profileId.toHexString()}-${pubId.toHexString()}`}
              target="blank"
            >
              <ArrowTopRightOnSquareIcon className="h-6 w-6" />
            </a>
          ) : (
            "--"
          )}
        </td>
      </tr>
    )
  );
};

export default function DetailsPage() {
  const { query } = useRouter();
  const { id } = query;

  const [accessToken, setAccessToken] = useState();
  const [description, setDescription] = useState();
  const [postContent, setPostContent] = useState();

  console.log(accessToken)

  const { data: profile } = useActiveProfile();
  const { data: wallet } = useActiveWallet();

  const { data: event } = useLensBalusEvents({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });

  const isEventOwner = wallet?.address === event?.owner;

  const { data: partnerRequests } = useLensBalusGetPartnerRequests({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });
  const _partnerRequestIndex = (partnerRequests ?? []).findIndex(
    (request) => profile?.id && request.profileId.eq(BigNumber.from(profile.id))
  );
  const partnerRequestIndex =
    _partnerRequestIndex >= 0 ? _partnerRequestIndex : undefined;
  const isPartner = partnerRequestIndex !== undefined;

  const { data: partners } = useLensBalusGetPartners({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });

  const { data: dispatcher } = useILensHubGetDispatcher({
    enabled: !!profile?.id && isPartner,
    args: [profile?.id ? BigNumber.from(profile.id) : BigNumber.from(0)],
  });
  const dispatcherSetted =
    dispatcher &&
    dispatcher.toLowerCase() === lensBalusAddress[80001].toLowerCase();

  const isPartnerAccept = (partners ?? []).some((partner) => {
    return profile && partner.profileId.eq(profile?.id);
  });

  const { config: setDispatcherConfig } = usePrepareILensHubSetDispatcher({
    enabled: !!profile?.id,
    args: [
      profile?.id ? BigNumber.from(profile.id) : BigNumber.from(0),
      lensBalusAddress[80001],
    ],
  });
  const { writeAsync: setDispatcher } =
    useILensHubSetDispatcher(setDispatcherConfig);

  const { config: becomePartnerConfig } = usePrepareLensBalusBecomePartner({
    enabled: !!id && partnerRequestIndex !== undefined,
    args: [BigNumber.from(id ?? 0), BigNumber.from(partnerRequestIndex ?? 0)],
  });

  const { writeAsync: becomePartner } =
    useLensBalusBecomePartner(becomePartnerConfig);

  const { config: postConfig } = usePrepareLensBalusPost({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });

  const { writeAsync: post } = useLensBalusPost(postConfig);

  const getAccessToken = async () => {
    const data = { id };
    const response = await fetch("/api/content/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const res = await response.json();
    setAccessToken(res.accessToken);
  };

  const onPublic = async () => {
    const data = { id };
    const response = await fetch("/api/content/public", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    post();
  };

  const onSetDispatcher = () => {
    if (setDispatcher) setDispatcher();
  };

  const onBecomePartner = () => {
    if (becomePartner) becomePartner();
  };

  const onPost = () => {
    onPublic()
  };

  useEffect(() => {
    if (!!id) getAccessToken();
  }, [id]);

  useEffect(() => {
    if (!accessToken || !event) return;

    fetch(
      `${GATEWAY}/ipfs/${event.descriptionCid}?accessToken=${accessToken}`
    ).then(async (res) => {
      const json = await res.json();
      setDescription(json);
    }).catch((err) => {
      return fetch(
        `${GATEWAY}/ipfs/${event.descriptionCid}}`
      ).then(async (res) => {
        const json = await res.json();
        setPostContent(json);
      })
    })

    fetch(
      `${GATEWAY}/ipfs/${event.postContentCid}?accessToken=${accessToken}`
    ).then(async (res) => {
      const json = await res.json();
      setPostContent(json);
    }).catch((err) => {
      return fetch(
        `${GATEWAY}/ipfs/${event.postContentCid}}`
      ).then(async (res) => {
        const json = await res.json();
        setPostContent(json);
      })
    })
  }, [accessToken]);

  if (!wallet || !event || (partnerRequests || []).length === 0) {
    return (
      <section className="bg-gray-900 h-full min-h-screen flex flex-col items-center px-2 py-12 text-white">
        Loading...
      </section>
    );
  }

  if (wallet && event && partnerRequests && !isEventOwner && !isPartner) {
    return (
      <section className="bg-gray-900 h-full min-h-screen flex flex-col items-center px-2 py-12">
        Not authorized
      </section>
    );
  }

  return (
    <section className="bg-gray-900 h-full min-h-screen flex flex-col items-center px-2 py-12">
      <div className="flex flex-col justify-center items-start w-[800px] max-w-full">
        {/* event */}
        <div className="mb-8 w-full">
          <h3 className="mb-8 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-white">
            Event
          </h3>
          <p className="mb-8 text-gray-400">Id: {id}</p>
        </div>

        <div className="mb-8 w-full">
          <h3 className="mb-8 text-2xl font-extrabold leading-none tracking-tight text-white">
            Description
          </h3>

          <div className="text-white">
            {
              description && (
                <ReactMarkdown>{(description as any).description ?? ""}</ReactMarkdown>
              )
            }

          </div>
        </div>

        <div className="mb-8 w-full">
          <h3 className="mb-8 text-2xl font-extrabold leading-none tracking-tight text-white">
            Post Content
          </h3>

          <div className="text-white">
            {postContent && (postContent as any).content}
          </div>

          {postContent && (
            <img
              src={`${
                (postContent as any).media[0].item
              }?accessToken=${accessToken}`}
            />
          )}
        </div>

        <div className="mb-8 w-full">
          <h3 className="mb-8 text-2xl font-extrabold leading-none tracking-tight text-white">
            Partner Requests
          </h3>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    To Profile
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Accepted
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Post URL
                  </th>
                </tr>
              </thead>
              <tbody>
                {(partnerRequests ?? []).map((partnerRequest, i) => {
                  const partner = (partners ?? []).find((partner) => {
                    return partner.profileId.eq(partnerRequest.profileId);
                  });
                  const isApproved = !!partner;
                  const pubId = partner?.pubId;
                  return (
                    <Request
                      key={i}
                      profileId={partnerRequest.profileId}
                      isApproved={isApproved}
                      pubId={pubId}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8 w-full">
          <h3 className="mb-8 text-2xl font-extrabold leading-none tracking-tight text-white">
            Actions
          </h3>

          {isEventOwner && (
            <div className="mb-8 w-full">
              <button
                type="button"
                onClick={onPost}
                className="w-full inline-flex justify-center items-center text-lg py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-4  focus:ring-lime-900"
              >
                Post
              </button>
            </div>
          )}

          {isPartner && (
            <div className="mb-8 w-full">
              {!dispatcherSetted && (
                <button
                  type="button"
                  onClick={onSetDispatcher}
                  className="w-full inline-flex justify-center items-center text-lg py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 focus:ring-4  focus:ring-lime-900"
                >
                  Change Dispatcher
                </button>
              )}
              {dispatcherSetted && (
                <button
                  type="button"
                  disabled={isPartnerAccept}
                  onClick={onBecomePartner}
                  className="w-full inline-flex justify-center items-center text-lg py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-4  focus:ring-lime-900"
                >
                  {isPartnerAccept ? "Done" : "Accept to become partner"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
