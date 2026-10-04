import Image from "next/image";
import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getServerT();
  return (
    <I18nProvider locale={locale} dict={dict}>
      <div className="app flex min-h-dvh flex-col pt-safe">
        <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-xl" />
            <span className="font-extrabold tracking-tight">Too Easy</span>
          </Link>
          <LocaleSwitch />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">{children}</main>
      </div>
    </I18nProvider>
  );
}
