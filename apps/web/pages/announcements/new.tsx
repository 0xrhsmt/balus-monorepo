import { useEffect, useState } from "react";
import {
  LoginButton,
  WhenLoggedInWithProfile,
  WhenLoggedOut,
} from "../../components/auth";
import {
  usePrepareLensBalusCreateAnnouncement,
  useLensBalusCreateAnnouncement,
} from "contracts";
import { BigNumber } from "ethers";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

export default function NewPage() {
  const {push} = useRouter()
  const [imageContentURL, setimageContentURL] = useState<string>();
  const [announcementArgs, setAnnouncementArgs] = useState<{
    infoCid: string;
    contentCid: string;
  }>();

  const {
    formState: { errors, isValid: isFormValid },
    register,
    handleSubmit,
    watch,
  } = useForm();
  const imageContent = watch("imageContent");

  const { config, error } = usePrepareLensBalusCreateAnnouncement({
    enabled:
      !!announcementArgs?.infoCid &&
      !!announcementArgs?.contentCid &&
      isFormValid,
    address: "0xb0B4e3E8Dd190478F2424AD241e3090877E736c7",
    args: [
      announcementArgs?.infoCid,
      announcementArgs?.contentCid,
      [BigNumber.from(30284)],
    ],
  });
  const { writeAsync: create } = useLensBalusCreateAnnouncement(config);

  const onSubmit = async (data) => {
    const body = new FormData();
    body.append("info", data.info);
    body.append("textContent", data.textContent);
    body.append("imageContent", data.imageContent[0]);
    const response = await fetch("/api/content/private", {
      method: "POST",
      body,
    });

    const { infoCid, contentCid } = await response.json();
    setAnnouncementArgs({ infoCid, contentCid });
  };

  const onCreate = async () => {
    const transaction = await create();
    const receipt = await transaction.wait()
    const id = receipt.logs[0].topics[1];

    push(`/announcements/${id}`)
  }

  useEffect(() => {
    if (imageContent && imageContent[0]) {
      setimageContentURL(URL.createObjectURL(imageContent[0]));
    }
  }, [imageContent]);


  return (
    <div>
      <WhenLoggedInWithProfile>
        {() => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <textarea
              placeholder="info"
              defaultValue={"info"}
              {...register("info", { required: true })}
            />
            {errors.info && <span>This field is required</span>}

            <input
              placeholder="textContent"
              defaultValue={"textContent"}
              {...register("textContent", { required: true })}
            />
            {errors.textContent && <span>This field is required</span>}

            <input
              {...register("imageContent", { required: true })}
              type="file"
            />
            <img src={imageContentURL} />

            {errors.imageContent && <span>This field is required</span>}

            <textarea
              placeholder="partnerRequests"
              defaultValue={"white"}
              {...register("partnerRequests", { required: true })}
            />

            {errors.partnerRequests && <span>This field is required</span>}

            <input type="submit" />
            <button type="button" disabled={!create} onClick={() => onCreate()}>Create</button>
          </form>
        )}
      </WhenLoggedInWithProfile>

      <WhenLoggedOut>
        <LoginButton />
      </WhenLoggedOut>
    </div>
  );
}
