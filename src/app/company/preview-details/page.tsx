import { redirect } from "next/navigation";

export default function CompanyPreviewDetailsPage() {
  redirect("/company?tab=preview");
}
