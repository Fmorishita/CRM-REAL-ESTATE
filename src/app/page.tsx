import { redirect } from "next/navigation";

/** The marketing site arrives later; the app is the product for now. */
export default function Home() {
  redirect("/dashboard");
}
