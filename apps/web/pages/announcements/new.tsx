import {
  LoginButton,
  WhenLoggedInWithProfile,
  WhenLoggedOut,
} from "../../components/auth";

export default function Web() {
  return (
    <div>
      <WhenLoggedInWithProfile>
        {() => <strong>Log In now</strong>}
      </WhenLoggedInWithProfile>

      <WhenLoggedOut>
        <LoginButton />
      </WhenLoggedOut>
    </div>
  );
}
