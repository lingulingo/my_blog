import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <AuthForm mode="login" />
    </div>
  );
}
