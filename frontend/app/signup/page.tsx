import { redirect } from "next/navigation";

export default function SignupRedirectPage() {
  // ChainVerify uses flexible identity (wallet connect or modal on the home/dashboard).
  // Redirecting /signup to the base app to seamlessly initiate the flow.
  redirect("/");
}
