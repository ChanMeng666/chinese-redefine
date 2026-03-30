import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "汉语新解 <noreply@yourdomain.com>",
        to: user.email,
        subject: "重置密码",
        html: `<p>点击以下链接重置密码：</p><a href="${url}">${url}</a>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "汉语新解 <noreply@yourdomain.com>",
        to: user.email,
        subject: "验证你的邮箱",
        html: `<p>点击以下链接验证邮箱：</p><a href="${url}">${url}</a>`,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      tier: { type: "string", defaultValue: "free" },
      isFlagged: { type: "boolean", defaultValue: false },
      signupIp: { type: "string", required: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
