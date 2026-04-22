import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary text-background hover:bg-primary/90 text-sm normal-case",
            card: "bg-card border-2 border-white/10 shadow-2xl",
            headerTitle: "text-white font-heading",
            headerSubtitle: "text-white/60",
            socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
            formFieldLabel: "text-white/70",
            formFieldInput: "bg-white/5 border-white/10 text-white focus:border-primary",
            footerActionText: "text-white/60",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
      />
    </div>
  );
}
