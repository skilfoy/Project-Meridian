import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold tracking-widest text-cyan-400 mb-2">MERIDIAN</div>
        <div className="text-slate-500 text-sm tracking-wider uppercase">Geopolitical Threat Intelligence</div>
      </div>
      <SignIn />
    </div>
  );
}
