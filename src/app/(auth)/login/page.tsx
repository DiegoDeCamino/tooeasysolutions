import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer, isStaffRole } from "@/lib/auth";
import { ForgetOfflineCopies } from "@/components/app/ForgetOfflineCopies";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in | Too Easy" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const { next, denied } = await searchParams;
  const viewer = await getViewer();
  if (viewer && !denied) redirect(isStaffRole(viewer.profile.role) ? "/app" : "/account");
  return (
    <>
      <ForgetOfflineCopies />
      <LoginForm next={next} denied={Boolean(denied)} />
    </>
  );
}
