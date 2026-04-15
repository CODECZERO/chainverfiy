import { redirect } from "next/navigation";

export default function LoginRedirectPage() {
  // ChainVerify uses flexible identity (wallet connect or modal on the home/dashboard).
  // Redirecting /login to the base app to seamlessly initiate the flow.
  redirect("/");
}
