import PasswordChangeForm from "@/components/PasswordChangeForm";

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <PasswordChangeForm standalone />
      </div>
    </main>
  );
}
