import { redirect } from "next/navigation";

// Landing — redirects to the unified login per the routing spec.
export default function HomePage() {
  redirect("/login");
}
