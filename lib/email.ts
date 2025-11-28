import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewPostEmail(email: string, name: string, post: { title: string; excerpt: string; slug: string; coverImage?: string }) {
  try {
    console.log("Sending new post email to:", email);
    
    const result = await resend.emails.send({
      from: 'Pic2Nav <noreply@pic2nav.com>',
      to: [email],
      subject: `New Post: ${post.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New on Pic2Nav</h1>
                    </td>
                  </tr>
                  
                  ${post.coverImage ? `
                  <tr>
                    <td style="padding: 0;">
                      <img src="${post.coverImage}" alt="${post.title}" style="width: 100%; height: auto; display: block;" />
                    </td>
                  </tr>
                  ` : ''}
                  
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 15px; color: #333333; font-size: 16px;">Hi ${name},</p>
                      <h2 style="margin: 0 0 20px; color: #0066cc; font-size: 24px; font-weight: 600;">${post.title}</h2>
                      <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.6;">${post.excerpt}</p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://pic2nav.com/blog/${post.slug}" style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Read Full Post</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px; color: #999999; font-size: 12px; line-height: 1.5;">&copy; 2025 Pic2Nav. All rights reserved.</p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        <a href="https://pic2nav.com/unsubscribe" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> from promotional emails
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
    
    console.log("New post email sent successfully:", result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Failed to send new post email:", error);
    console.error("Error details:", {
      message: error?.message,
      statusCode: error?.statusCode,
      name: error?.name
    });
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    console.log("Sending welcome email to:", email);
    
    const result = await resend.emails.send({
      from: 'Pic2Nav <noreply@pic2nav.com>',
      to: [email],
      subject: 'Welcome to Pic2Nav!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to Pic2Nav</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">Thank you for joining Pic2Nav! We're excited to have you as part of our community.</p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 30px 0;">
                        <h2 style="margin: 0 0 15px; color: #0066cc; font-size: 18px; font-weight: 600;">What You Can Do</h2>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;"><strong>Upload Photos:</strong> Find exact locations from building images</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;"><strong>Read Stories:</strong> Explore our blog for navigation insights</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;"><strong>Engage:</strong> Comment and connect with the community</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;"><strong>Save:</strong> Bookmark your favorite locations and articles</p>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://pic2nav.com" style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Get Started</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">Need help? Reply to this email or visit our <a href="https://pic2nav.com/blog" style="color: #0066cc; text-decoration: none;">blog</a> for guides and tips.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">&copy; 2025 Pic2Nav. All rights reserved.</p>
                      <p style="margin: 10px 0 0; color: #999999; font-size: 12px; line-height: 1.5;">Experience the future of navigation technology.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
    
    console.log("Welcome email sent successfully:", result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Failed to send welcome email:", error);
    console.error("Error details:", {
      message: error?.message,
      statusCode: error?.statusCode,
      name: error?.name
    });
    return { success: false, error };
  }
}
