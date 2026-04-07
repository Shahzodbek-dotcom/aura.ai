import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      variant="signup"
      footerHref="/login"
    >
      <SignupForm />
    </AuthShell>
  );
}
