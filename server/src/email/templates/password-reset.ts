import { sendEmail } from "../send-email";

export default function passwordResetTemplate(email, linkURL) {
  return {
    email,
    subject: "Password Reset",
    text: `
Please navigate to the following link to reset your password:\n\n

${linkURL}
    `,
    html: `
Please navigate to the following link to reset your password:<br/><br/>

<a href=${linkURL}>
${linkURL}
</a>
`
  };
}

export async function sendPasswordResetEmail(
  email: string,
  passwordResetID: string
) {
  let linkURL = `${process.env.APP_BASE_URL}`;
  linkURL += `${process.env.PASSWORD_RESET_PATH ||
    "/accounts/password/change"}`;
  linkURL += `?id=${passwordResetID}`;

  sendEmail(passwordResetTemplate(email, linkURL));
}
