import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alerts/:path*",
    "/profile/:path*",
    "/reminders/:path*",
    "/famille/:path*",
    "/pharmacies/:path*",
    "/ordonnance/:path*",
    "/alternatives/:path*",
    "/parrainage/:path*",
    "/leaderboard/:path*",
    "/rewards/:path*",
  ],
};
