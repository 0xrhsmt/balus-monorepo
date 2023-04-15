import { useWalletLogin, useWalletLogout } from "@lens-protocol/react-web";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

import { WhenLoggedInWithProfile } from "./WhenLoggedInWithProfile";
import { WhenLoggedOut } from "./WhenLoggedOut";

export function LoginButton({ handle }: { handle?: string }) {
  const {
    execute: login,
    error: loginError,
    isPending: isLoginPending,
  } = useWalletLogin();
  const { execute: logout, isPending: isLogoutPending } = useWalletLogout();

  const { isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const { connectAsync } = useConnect({
    connector: new InjectedConnector(),
  });

  const onLoginClick = async () => {
    if (isConnected) {
      await disconnectAsync();
    }

    const { connector } = await connectAsync();

    if (connector instanceof InjectedConnector) {
      const signer = await connector.getSigner();
      await login(signer, handle);
    }
  };

  const onLogoutClick = async () => {
    await logout();
    await disconnectAsync();
  };

  useEffect(() => {
    if (loginError) toast.error(loginError.message);
  }, [loginError]);

  return (
    <>
      <WhenLoggedInWithProfile>
        {() => (
          <button
            onClick={onLogoutClick}
            disabled={isLogoutPending}
            className="w-full inline-flex justify-center items-center text-lg py-3 px-5 font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 focus:ring-4  focus:ring-lime-900"
          >
            <strong>Log out</strong>
          </button>
        )}
      </WhenLoggedInWithProfile>

      <WhenLoggedOut>
        <button
          onClick={onLoginClick}
          disabled={isLoginPending}
          className="w-full inline-flex justify-center items-center text-lg py-3 px-5 font-medium text-center text-white rounded-lg bg-lime-600 hover:bg-lime-800 focus:ring-4  focus:ring-lime-900"
        >
          <strong>Log in</strong>
        </button>
      </WhenLoggedOut>
    </>
  );
}
