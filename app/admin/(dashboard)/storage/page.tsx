import { redirect } from "next/navigation";

export default function LegacyStoragePage() {
  redirect("/admin/settings?tab=google");
}
