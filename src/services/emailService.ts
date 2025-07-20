import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Email service for sending emails using Supabase edge functions
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    console.log(`Attempting to send email to ${to} with subject: ${subject}`);
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });

    if (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Email Sending Failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    toast({
      title: 'Email Sending Failed',
      description: 'An unexpected error occurred while sending the email',
      variant: 'destructive',
    });
    return false;
  }
};
