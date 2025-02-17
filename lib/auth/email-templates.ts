interface EmailTemplateProps {
  url: string;
  host: string;
  email: string;
}

export const emailTemplates = {
  magicLink: ({ url, host, email }: EmailTemplateProps) => ({
    subject: `Sign in to Crypto Dashboard`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <style>
            .container { max-width: 580px; margin: 0 auto; padding: 20px; }
            .button { background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; }
            .text { color: #333; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Sign in to Crypto Dashboard</h2>
            <p class="text">Click the button below to sign in to your account.</p>
            <p class="text">This link will expire in 24 hours and can only be used once.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${url}" class="button">Sign in to Crypto Dashboard</a>
            </p>
            <p class="text">
              If you didn't request this email, you can safely ignore it.
            </p>
            <hr style="margin: 30px 0;" />
            <p style="color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              ${url}
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Sign in to Crypto Dashboard\n\nClick the link below to sign in to your account:\n${url}\n\nThis link will expire in 24 hours and can only be used once.\n\nIf you didn't request this email, you can safely ignore it.`,
  }),
}; 