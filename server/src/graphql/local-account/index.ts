import { gql, UserInputError, ForbiddenError } from "apollo-server";
import { LocalUser, EmailVerification, PasswordReset } from "../../entity";

import argon2 = require("argon2");

export const typeDefs = gql`
  extend type Query {
    isVerified: Boolean!
  }

  extend type Mutation {
    signup(form: SignupForm!, validate: Boolean): SignupResults!

    passwordReset(email: String!, baseURL: String!): Boolean

    verifyAccount(id: String!): VerifyAccountResult!

    resendVerification(email: String!, baseURL: String!): Boolean
  }

  type SignupResults {
    success: Boolean!
    inputErrors: SignupInputErrors!
  }

  type SignupInputErrors {
    email: [String!]!
    password: [String!]!
  }

  type VerifyAccountResult {
    success: Boolean!
    inputErrors: [String!]!
  }

  input SignupForm {
    email: String!
    password: String!
    confirmPassword: String!
  }
`;

export const resolvers = {
  Query: {
    async isVerified(_, __, { db, profile }) {
      if (!profile.id) {
        throw new ForbiddenError("Unauthorized.");
      }

      if (profile.provider && profile.provider !== "local") {
        return true;
      }

      const { verified } = await db.manager.findOne(EmailVerification, {
        user: { id: profile.id }
      });

      return !!verified;
    }
  },
  Mutation: {
    // Validate or submit a signup form.
    async signup(_, { form, validate }, { db }) {
      // Keep track of form errors in this record.
      const formStatus = {
        success: true,
        inputErrors: {
          email: [],
          password: []
        }
      };

      // Fail if the email does not have the most basic form.
      if (!form.email || !/^.+\@.+$/g.test(form.email)) {
        formStatus.inputErrors.email.push("Please use a valid email address.");
        formStatus.success = false;
      }

      // Fail if there is already a user with the given email.
      const existingUser = await db.manager.findOne(LocalUser, {
        email: form.email
      });
      if (existingUser) {
        formStatus.inputErrors.email.push(
          "A user with this email already exists."
        );
        formStatus.success = false;
      }

      // Fail if the given password is too short.
      const MIN_PASSWORD_LENGTH = 8;
      if (!form.password || form.password.length < MIN_PASSWORD_LENGTH) {
        formStatus.inputErrors.password.push(
          `Please use a password of at least ${MIN_PASSWORD_LENGTH} charactars.`
        );
        formStatus.success = false;
      }

      // Fail if given password does not match with the password confirmation.
      if (!form.password === form.confirmPassword) {
        formStatus.inputErrors.password.push(
          "Password confirmation is different from password."
        );
        formStatus.success = false;
      }

      // If the request is to submit the form and if there are errors, return the errors.
      if (!formStatus.success) {
        return formStatus;
      }

      // If the request is only to validate the form, return the validation results.
      if (validate) {
        return formStatus;
      }

      // Save the user to the database and send a verification email.

      const user = new LocalUser();

      user.email = form.email;
      user.passwordHash = await argon2.hash(form.password);

      const verification = new EmailVerification();
      verification.user = user;
      verification.email = user.email;
      verification.verified = false;

      await db.manager.save(user);
      await db.manager.save(verification);

      // TODO: send verification email

      return formStatus;
    },

    // Send a password reset link to the email of a locally registered user or fail silently if no user is found.
    async passwordReset(_, { email, baseURL }, { db }) {
      const user = await db.manager.findOne(LocalUser, { email });

      // If there is no locally registered user with the given email, fail silently.
      if (!user) {
        return;
      }

      const reset = new PasswordReset();
      reset.user = user;

      db.manager.save(reset);

      // TODO: send password reset email if req.body.email maps to a localuser.
    },

    // Set the verified flag in the verification entry if it exists or fail silently.
    async verifyAccount(_, { id }, { db }) {
      const verification = await db.manager.findOne(EmailVerification, { id });

      if (!verification) {
        return {
          success: false,
          inputErrors: [
            "There is No pending verification with the given verification ID."
          ]
        };
      }

      verification.verified = true;
      db.manager.save(verification);

      return { success: true, inputErrors: [] };
    },

    // Send a verification link to the email of a locally registered user or fail silently if no user is found.
    async resendVerification(_, { email, baseURL }, { db }) {
      const user = await db.manager.findOne(LocalUser, { email });

      // If there is no locally registered user with the given email, fail silently.
      if (!user) {
        return;
      }

      let verification = await db.manager.findOne(EmailVerification, { user });

      // If there is no pending verification for the registered user, create a new one.
      if (!verification) {
        verification = new EmailVerification();
        verification.user = user;
      }

      if (verification.verified) {
        return;
      }

      verification.email = user.email;

      db.manager.save(verification);

      // TODO: send a verification email.
    }
  }
};
