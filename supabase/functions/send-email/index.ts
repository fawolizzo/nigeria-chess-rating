
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Email function called with method:", req.method);
    
    const requestBody = await req.text();
    console.log("Raw request body:", requestBody);
    
    let data;
    try {
      data = JSON.parse(requestBody);
      console.log("Parsed request data:", data);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { 
      to, 
      subject, 
      html, 
      from = "Nigerian Chess Rating System <onboarding@resend.dev>",
      replyTo,
      text
    } = data as EmailRequest;

    if (!to || !subject || !html) {
      console.error("Missing required fields:", { to, subject, html: html ? "present" : "missing" });
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, or html" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Sending email to ${to} with subject: ${subject}`);
    
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log("API key present:", !!apiKey);
    
    try {
      const emailConfig: any = {
        from,
        to,
        subject,
        html,
      };
      
      // Add optional parameters if provided
      if (replyTo) {
        emailConfig.reply_to = replyTo;
      }
      
      if (text) {
        emailConfig.text = text;
      }
      
      const { data: resendData, error } = await resend.emails.send(emailConfig);

      if (error) {
        console.error("Error from Resend API:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log("Email sent successfully:", resendData);
      return new Response(
        JSON.stringify({ data: resendData }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (sendError) {
      console.error("Exception during email sending:", sendError);
      return new Response(
        JSON.stringify({ error: sendError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Server error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
