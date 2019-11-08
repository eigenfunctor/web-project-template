import { sendEmail } from "../send-email";

export function verificationTemplate(email, linkURL) {
  return {
    email,
    subject: "Account Verification",
    text: `
Please navigate to the following link to verify your account:\n\n

${linkURL}
    `,
    html: `
Please navigate to the following link to verify your account:<br/><br/>

<a href=${linkURL}>
${linkURL}
</a>
`
  };
}

export async function sendVerificationEmail(
  email: string,
  verificationID: string
) {
  let linkURL = `${process.env.APP_BASE_URL}`;
  linkURL += `${process.env.VERIFCATION_PATH || "/verification"}`;
  linkURL += `?id=${verificationID}`;

  sendEmail(verificationTemplate(email, linkURL));
}
