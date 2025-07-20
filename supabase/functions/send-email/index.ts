import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'npm:resend@1.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Email function called with method:', req.method);

    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    let data;
    try {
      data = JSON.parse(requestBody);
      console.log('Parsed request data:', data);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      to,
      subject,
      html,
      from = 'Nigerian Chess Rating System <onboarding@resend.dev>',
    } = data as EmailRequest;

    if (!to || !subject || !html) {
      console.error('Missing required fields:', {
        to,
        subject,
        html: html ? 'present' : 'missing',
      });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: to, subject, or html',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Sending email to ${to} with subject: ${subject}`);

    const apiKey = Deno.env.get('RESEND_API_KEY');
    console.log('API key present:', !!apiKey);

    // Implement retry logic for email sending
    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < MAX_RETRIES) {
      attempt++;
      console.log(`Email sending attempt ${attempt} of ${MAX_RETRIES}`);

      try {
        const { data: resendData, error } = await resend.emails.send({
          from,
          to,
          subject,
          html,
        });

        if (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          lastError = error;
          // Wait before retry (exponential backoff)
          if (attempt < MAX_RETRIES) {
            const backoffMs = Math.pow(2, attempt) * 500;
            console.log(`Waiting ${backoffMs}ms before next attempt`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        } else {
          // Success - log and return
          console.log(
            'Email sent successfully on attempt',
            attempt,
            ':',
            resendData
          );
          return new Response(JSON.stringify({ data: resendData, attempt }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (sendError) {
        console.error(
          `Exception during email sending (attempt ${attempt}):`,
          sendError
        );
        lastError = sendError;
        // Wait before retry (exponential backoff)
        if (attempt < MAX_RETRIES) {
          const backoffMs = Math.pow(2, attempt) * 500;
          console.log(`Waiting ${backoffMs}ms before next attempt`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // If we reach here, all attempts failed
    console.error(`All ${MAX_RETRIES} email sending attempts failed`);
    return new Response(
      JSON.stringify({
        error:
          lastError?.message || 'Failed to send email after multiple attempts',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Server error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
