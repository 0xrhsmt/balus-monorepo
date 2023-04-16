import { useCallback, useEffect, useState } from "react";
import {
  LoginButton,
  WhenLoggedInWithProfile,
  WhenLoggedOut,
} from "../../components/auth";
import {
  usePrepareLensBalusCreateEvent,
  useLensBalusCreateEvent,
} from "contracts";
import { BigNumber } from "ethers";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useActiveWallet } from "@lens-protocol/react-web";
import LoadingIcon from "../../components/LoadingIcon";

export default function NewPage() {
  const { push, asPath, isReady } = useRouter();
  const [imageURL, setimageURL] = useState<string>();
  const [content, setContent] = useState<{
    descriptionCid: string;
    postContentCid: string;
  }>();
  const [eventCreated, setEventCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    formState: { errors, isValid: isFormValid },
    register,
    handleSubmit,
    watch,
  } = useForm();
  const image = watch("image");

  const { config, error } = usePrepareLensBalusCreateEvent({
    enabled:
      !!content?.descriptionCid && !!content?.postContentCid && isFormValid,
    args: [
      content?.descriptionCid,
      content?.postContentCid,
      [BigNumber.from(30284), BigNumber.from(30618)],
    ],
  });
  const { writeAsync: createEvent } = useLensBalusCreateEvent(config);

  const onSubmit = async (data) => {
    setLoading(true);
    const body = new FormData();
    body.append("description", data.description);
    body.append("message", data.message);
    body.append("image", data.image[0]);
    const response = await fetch("/api/content/private", {
      method: "POST",
      body,
    });

    const { descriptionCid, postContentCid } = await response.json();
    setContent({ descriptionCid, postContentCid });
  };

  const onCreateEvent = useCallback(async () => {
    if (eventCreated) return;

    setEventCreated(true);
    const transaction = await createEvent();
    const receipt = await transaction.wait(1);
    const id = receipt.logs[0].topics[1];

    setLoading(false);

    push(`/events/${id}`);
  }, [createEvent]);

  useEffect(() => {
    if (image && image[0]) {
      setimageURL(URL.createObjectURL(image[0]));
    }
  }, [image]);

  useEffect(() => {
    if (createEvent && !eventCreated) onCreateEvent();
  }, [createEvent]);

  const { data: wallet, loading: walletLooading } = useActiveWallet();

  if (walletLooading) {
    return (
      <section className="bg-gray-900 h-full min-h-screen flex flex-col items-center px-2 py-12">
        Loading...
      </section>
    );
  }

  if (!walletLooading && wallet === null && isReady) {
    push({
      pathname: "/",
      query: {
        callback: asPath,
      },
    });

    return null;
  }

  return (
    <section className="bg-gray-900 h-full min-h-screen flex flex-col items-center px-2 py-12">
      <div className="flex flex-col justify-center items-center w-[600px] max-w-full">
        <h3 className="mb-8 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-white">
          New Event
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className="mb-8">
            <label
              htmlFor="description"
              className="block mb-2 text-lg font-medium text-white"
            >
              Description
            </label>

            <textarea
              id="description"
              className="border text-sm rounded-lg   block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
              {...register("description", { required: true })}
            />

            {errors.description && (
              <span className="text-red-400">This field is required</span>
            )}
          </div>

          <div className="mb-8">
            <div className="block mb-2 text-lg font-medium text-white">
              Post Content
            </div>

            <div className="mb-2">
              <label
                htmlFor="message"
                className="block mb-2 text-sm font-medium text-white"
              >
                Message
              </label>

              <input
                id="message"
                className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                {...register("message", { required: true })}
              />

              {errors.message && (
                <span className="text-red-400">This field is required</span>
              )}
            </div>

            <div className="mb-2">
              <label
                className="block mb-2 text-sm font-medium text-white"
                htmlFor="image"
              >
                Image
              </label>

              <input
                id="image"
                className="block w-full text-sm border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400"
                {...register("image", { required: true })}
                type="file"
              />

              {errors.image && (
                <span className="text-red-400">This field is required</span>
              )}

              {imageURL && (
                <div className="flex py-4 w-full justify-center items-center">
                  <img src={imageURL} />
                </div>
              )}
            </div>
          </div>

          <div className="mb-12">
            <label
              htmlFor="partnerRequests"
              className="block mb-2 text-lg font-medium text-white"
            >
              Partners
            </label>

            <textarea
              className="border text-sm rounded-lg   block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
              {...register("partnerRequests", { required: true })}
            />

            {errors.partnerRequests && (
              <span className="text-red-400">This field is required</span>
            )}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full inline-flex justify-center items-center text-lg py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-4  focus:ring-lime-900"
          >
            {
              loading && (
                <LoadingIcon/>
              )
            }
            Create
          </button>
        </form>
      </div>
    </section>
  );
}
