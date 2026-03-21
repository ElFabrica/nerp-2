import { auth } from "@/lib/auth";
import { base } from "./base";

export const requireAuthMiddleware = base.middleware(
  async ({ context, next, errors }) => {
    const sessionData = await auth.api.getSession({
      headers: context.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      throw errors.UNAUTHORIZED;
    }

    // Adds session and user to the context
    return next({
      context: {
        session: sessionData.session,
        user: sessionData.user,
      },
    });
  }
);
