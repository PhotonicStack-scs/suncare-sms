import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard (auth check handled by middleware)
  redirect("/dashboard");
}
