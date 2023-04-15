import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  useLensBalusGetPartnerRequests,
  useLensBalusGetPartners,
  usePrepareILensHubSetDispatcher,
  useILensHubSetDispatcher,
  useILensHubGetDispatcher,
  usePrepareLensBalusBecomePartner,
  useLensBalusBecomePartner,
  useLensBalusEvents

} from "contracts";
import { BigNumber } from "ethers";
import { useActiveProfile, useProfile } from '@lens-protocol/react-web';

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL

const Request = ({ profileId }: { profileId: BigNumber }) => {
  const { data: profile } =  useProfile({ profileId: profileId.toHexString() as any });

  return (
    profile && (
      <div>
    { profile.handle }
  </div>
    )
  )

}

export default function DetailsPage() {
  const { query } = useRouter();
  const { id } = query;

  const [accessToken, setAccessToken] = useState();
  const [info, setInfo] = useState();
  const [content, setContent] = useState();

  const { data: profile } = useActiveProfile();

  const { data: announcement } = useLensBalusEvents({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });

  const { data: partnerRequests } = useLensBalusGetPartnerRequests({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });
  const index = partnerRequests?.findIndex((request) => request.profileId.eq(BigNumber.from(profile?.id ?? 0)))
  const partnerRequestIndex = index >= 0 ? index : undefined;

  const { data: partners } = useLensBalusGetPartners({
    enabled: !!id,
    args: [BigNumber.from(id ?? 0)],
  });

  const {data: dispatcher } = useILensHubGetDispatcher({
    enabled: !!profile?.id,
    args: [profile?.id ? BigNumber.from(profile.id) : BigNumber.from(0)],
  })
  const dispatcherSetted = dispatcher && dispatcher.toLowerCase() === '0xb0B4e3E8Dd190478F2424AD241e3090877E736c7'.toLowerCase()

  const { config: setDispatcherConfig } = usePrepareILensHubSetDispatcher({
    enabled: !!profile?.id,
    args: [profile?.id ? BigNumber.from(profile.id) : BigNumber.from(0), "0xb0B4e3E8Dd190478F2424AD241e3090877E736c7"],
  })
  const { writeAsync: setDispatcher } = useILensHubSetDispatcher(setDispatcherConfig);

  const { config: becomePartnerConfig } = usePrepareLensBalusBecomePartner({
    enabled: !!id && !!partnerRequestIndex,
    args: [id ? BigNumber.from(id) : BigNumber.from(0), BigNumber.from(partnerRequestIndex ?? 0)],
  })
  const { writeAsync: becomePartner } = useLensBalusBecomePartner(becomePartnerConfig);

  
  const onSubmit = async () => {
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
  };

  const onSetDispatcher = () => {
    if (setDispatcher) setDispatcher()
  }

  const onBecomePartner = () => {
    
  }

  const onPost  = () => {
    // TODO:
  }

  useEffect(() => {
    if (!accessToken || !announcement) return;

    fetch(
      `${GATEWAY}/ipfs/${announcement.descriptionCid}?accessToken=${accessToken}`
    ).then(async (res) => {
      const json = await res.json();
      console.log(json)
      setInfo(json);
    });
    fetch(
      `${GATEWAY}/ipfs/${announcement.postContentCid}?accessToken=${accessToken}`
    ).then(async (res) => {
      const json = await res.json();
      setContent(json);
    });
  }, [accessToken]);

  return (
    <div>
      {info && <ReactMarkdown>{(info as any).info}</ReactMarkdown>}
      {content && (
        <>
          {(content as any).content}
          <img
            alt=""
            src={`${(content as any).media[0].item}?accessToken=${accessToken}`}
            width={100}
            height={100}
          />
        </>
      )}
      <button onClick={onSubmit}>button</button>
      <button onClick={onPublic}>public</button>

      {(partnerRequests ?? []).map((request, i) => {
        return <Request key={i} profileId={request.profileId} />
      })}


      <button disabled={dispatcherSetted} onClick={onSetDispatcher} >change dispatcher</button>
      <button onClick={onBecomePartner}>becomePartner</button>
      <button onClick={onPost}>post</button>
    </div>
  );
}
