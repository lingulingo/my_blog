import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Suspense fallback={<div className="panel-surface rounded-[2rem] p-8 text-sm text-[var(--color-muted)]">正在加载重置页面...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
