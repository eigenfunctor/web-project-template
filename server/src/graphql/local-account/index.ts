import { Connection } from "typeorm";
import { gql, UserInputError, ForbiddenError } from "apollo-server";
import {
  ApiUser,
  LocalUser,
  EmailVerification,
  PasswordReset
} from "../../entity";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../email";

import argon2 = require("argon2");
import moment = require("moment");

export const typeDefs = gql`
  extend type Query {
    isVerified: Boolean!
  }

  extend type Mutation {
    signup(form: SignupForm!, validate: Boolean): SignupResults!

    verifyAccount(verificationID: String): VerifyAccountResult!

    resendVerification(email: String!): Boolean

    sendPasswordReset(email: String!): Boolean

    changePassword(
      form: PasswordResetForm!
      validate: Boolean
    ): PasswordResetResults!
  }

  input SignupForm {
    email: String!
    fullName: String!
    password: String!
    confirmPassword: String!
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
    inputErrors: VerifyAccountInputErrors!
  }

  type VerifyAccountInputErrors {
    verificationID: [String!]!
  }

  input PasswordResetForm {
    resetID: String
    password: String!
    confirmPassword: String!
  }

  type PasswordResetResults {
    success: Boolean!
    inputErrors: PasswordResetInputErrors!
  }

  type PasswordResetInputErrors {
    resetID: [String!]!
    password: [String!]!
  }
`;

export const resolvers = {
  Query: {
    async isVerified(
      _,
      __,
      { db, profile }: { db: Connection; profile?: any }
    ) {
      return await isVerifiedHelper(db, profile);
    }
  },
  Mutation: {
    // Validate or submit a signup form.
    async signup(_, { form, validate }, { db }: { db: Connection }) {
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
      user.fullName = form.fullName;
      user.passwordHash = await argon2.hash(form.password);

      const verification = new EmailVerification();
      verification.user = user;
      verification.email = user.email;
      verification.verified = false;

      await db.manager.save(user);
      await db.manager.save(verification);

      const apiUser = new ApiUser();
      apiUser.provider = "local";
      apiUser.id = user.id;

      apiUser.loggedName = user.fullName;
      apiUser.loggedEmail = user.email;

      await db.manager.save(apiUser);

      sendVerificationEmail(verification.email, verification.id);

      return formStatus;
    },

    // Set the verified flag in the verification entry if it exists or fail silently.
    async verifyAccount(_, { verificationID }, { db }: { db: Connection }) {
      const verification = await db.manager.findOne(EmailVerification, {
        id: verificationID
      });

      if (!verification) {
        return {
          success: false,
          inputErrors: {
            verificationID: ["This verification link is invalid."]
          }
        };
      }

      verification.verified = true;
      await db.manager.save(verification);

      return { success: true, inputErrors: { verificationID: [] } };
    },

    // Send a verification link to the email of a locally registered user or fail silently if no user is found.
    async resendVerification(_, { email }, { db }: { db: Connection }) {
      const user = await db.manager.findOne(LocalUser, { email });

      // If there is no locally registered user with the given email, fail silently.
      if (!user) {
        return;
      }

      let verification = await db.manager.findOne(EmailVerification, { user });

      if (verification) {
        // If there is no pending verification for the registered user, create a new one.
        if (verification.verified) {
          return;
        }

        await db.manager.remove(verification);
      }

      verification = new EmailVerification();
      verification.user = user;
      verification.email = user.email;
      verification.verified = false;

      await db.manager.save(verification);

      await sendVerificationEmail(verification.email, verification.id);
    },

    // Send a password reset link to the email of a locally registered user or fail silently if no user is found.
    async sendPasswordReset(_, { email }, { db }: { db: Connection }) {
      const user = await db.manager.findOne(LocalUser, { email });

      // If there is no locally registered user with the given email, fail silently.
      if (!user) {
        return;
      }

      // If there is a pending reset, remove it and create a new one.
      let reset = await db.manager.findOne(PasswordReset, { user });

      if (reset) {
        await db.manager.remove(reset);
      }

      reset = new PasswordReset();
      reset.user = user;
      reset.createdAt = moment.utc().format();

      await db.manager.save(reset);

      await sendPasswordResetEmail(reset.user.email, reset.id);
    },

    async changePassword(_, { form, validate }, { db }: { db: Connection }) {
      const formStatus = {
        success: true,
        inputErrors: {
          resetID: [],
          password: []
        }
      };

      if (!form.resetID) {
        formStatus.success = false;
        formStatus.inputErrors.resetID.push("Invalid password reset link.");

        return formStatus;
      }

      const reset = await db.manager.findOne(PasswordReset, {
        where: { id: form.resetID },
        relations: ["user"]
      });

      // Fail if there is no password reset entry with the given reset ID
      if (!reset) {
        formStatus.inputErrors.resetID.push(
          "This password reset link is invalid."
        );
        formStatus.success = false;
      }

      // Allow up to 24 hours to reset passwords.
      if (reset) {
        const duration = moment.duration(
          moment().diff(moment.utc(reset.createdAt))
        );

        if (duration.asHours() > 24) {
          formStatus.inputErrors.resetID.push(
            "This password reset link is expired."
          );
          formStatus.success = false;
        }
      }

      if (form.password !== form.confirmPassword) {
        formStatus.inputErrors.password.push(
          "Password and password confirmation do not match."
        );
        formStatus.success = false;
      }

      // If the request is to submit the form and if there are errors, return the validation errors.
      if (!formStatus.success) {
        return formStatus;
      }

      // If the request is only to validate the form, return the validation results.
      if (validate) {
        return formStatus;
      }

      reset.user.passwordHash = await argon2.hash(form.password);

      await db.manager.remove(reset);
      await db.manager.save(reset.user);

      return formStatus;
    }
  }
};

export async function isVerifiedHelper(
  db: Connection,
  profile: any
): Promise<boolean> {
  if (!(profile && profile.id)) {
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
