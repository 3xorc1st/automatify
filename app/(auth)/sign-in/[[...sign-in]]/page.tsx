import { SignIn } from '@clerk/nextjs';

const SignInPage = () => (
  <SignIn routing="path" path="/sign-in" />
);

export default SignInPage;
