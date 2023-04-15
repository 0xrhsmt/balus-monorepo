import {
  LoginButton,
  WhenLoggedInWithProfile,
  WhenLoggedOut,
} from "../components/auth";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback } from "react";

export default function IndexPage() {
  const { push, query } = useRouter();
  const callbackUrl = query.callback as string

  const onLogin = useCallback(() => {    
    push(callbackUrl ?? '/events/new');
  }, [query, push]);

  return (
    <section className="bg-gray-900 h-full min-h-screen flex items-center">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 flex items-center flex-col">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none 900 md:text-5xl lg:text-6xl text-white">
          Balus
        </h1>
        <Image alt="logo" src="/icon.png" width={200} height={200} />
        <p className="mb-8 text-lg font-normal lg:text-xl sm:px-16 lg:px-48 text-gray-400">
          Maximize Buzz with Minimal Effort
        </p>

        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
          <WhenLoggedInWithProfile>
            {() => (
              <Link
                href="/events/new"
                className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 focus:ring-4  focus:ring-lime-900"
              >
                Create New Event
              </Link>
            )}
          </WhenLoggedInWithProfile>

          <WhenLoggedOut>
            <LoginButton onLogin={onLogin} />
          </WhenLoggedOut>
        </div>
      </div>
    </section>
  );
}
