import { AuthForm } from "@/components/forms/auth-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <AuthForm mode="register" />
    </div>
  );
}
