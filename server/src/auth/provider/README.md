# Adding Passport Strategies

This project template uses passport's [local strategy](http://www.passportjs.org/packages/passport-local/) for standard email/password authorization flows. Passport.js offers many simple to use strategies for providers such as [Google](http://www.passportjs.org/packages/passport-google-oauth20), [Facebook](http://www.passportjs.org/packages/passport-facebook/), and [Auth0](http://www.passportjs.org/packages/passport-auth0/) to create a unified profile object. These profile objects are persisted in the database so other entities may create relationships such as ownership or group membership.

- `server/src/entity/accounts/api-user.ts` models users authenticated by arbitrary authentication providers.
- `server/src/entity/accounts/local-user.ts` models locally registered users.

The steps for adding a passport strategy usually involve the following:
  - [Generate a client ID and client secret](https://developers.google.com/identity/sign-in/web/sign-in) for the provider you are interested in.
  - Use the relevant passport strategy with the generated client ID and secret.
  - Use the passport route middleware on GET handlers for `/auth/provider/my-provider` and `/auth/provider/my-provider/callback` 
  - Add the fully qualified URL to the `/auth/provider/my-provider/callback` route on the provider's developer console.
  - Add a link to the frontend to `/auth/provider/my-provider` which initiates the authentication flow for the relevant provider.

# Example: Adding the passport-google-oauth20 Strategy
First create a file `server/src/auth/provider/google-oauth20.ts` with the following contents:

```
import { Connection } from "typeorm";
import { Router } from "express";
import { ApiUser } from "../../entity";

import express = require("express");
import passport = require("passport");
import GoogleStrategy = require("passport-google-oauth20");

export function useGoogleProvider(db: Connection, parentRouter: Router) {
  if (!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) {
    console.warn(
      "WARNING: The environment variables GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET have to be set in order for the server to handle the Google authentication provider."
    );
    return;
  }

  const router = express.Router();

  parentRouter.use("/google", router);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_BASE_URL}/auth/provider/google/callback`
      },
      async function(accessToken, refreshToken, profile, cb) {
        try {
          let apiUser = await db.manager.findOne(ApiUser, {
            provider: "google",
            id: profile.id
          });

          if (!apiUser) {
            apiUser = new ApiUser();
            apiUser.provider = "google";
            apiUser.id = profile.id;
          }

          apiUser.loggedEmail = null;
          apiUser.loggedName = profile.displayName;

          await db.manager.save(apiUser);

          return cb(null, {
            provider: profile.provider,
            id: profile.id,
            loggedName: profile.displayName
          });
        } catch (error) {
          console.error(error);
          cb(error);
        }
      }
    )
  );

  router.get("/", passport.authenticate("google", { scope: ["profile"] }));

  router.get(
    "/callback",
    passport.authenticate("google", { failureRedirect: "/accounts/login" }),
    function(req, res) {
      res.redirect("/");
    }
  );
}
```

Open `server/src/auth/provider/index.ts` and call the `useGoogleProvider` function from above.

```
  //...
  useLocalProvider(db, router);

  useGoogleProvider(db, router);

  // TODO: Add more providers here.
```

Make sure the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variable are set before running the server.

Now the frontend may link to `/auth/provider/google` to attempt signing in the user with Google.
