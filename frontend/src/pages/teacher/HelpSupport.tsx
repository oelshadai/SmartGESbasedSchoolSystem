import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageSquare, Book, ExternalLink, Send, CheckCircle } from 'lucide-react';
import { supportService } from '@/services/supportService';

const faqs = [
  { q: 'How do I create a timed quiz?', a: 'When creating an assignment, select "Quiz" as the type and enable the "Timed Quiz" toggle. Set the time limit in minutes.' },
  { q: 'How do I enter exam scores?', a: 'Go to Grade Book, select the class and subject, then enter the exam scores in the "Exam" column.' },
  { q: 'Can I bulk import student scores?', a: 'This feature is coming soon. For now, you can enter scores individually through the Grade Book.' },
  { q: 'How do I generate a class report?', a: 'Navigate to Class Reports, select your class and subject, and the report will be automatically generated.' },
];

const HelpSupport = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both subject and message');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await supportService.createTicket({ subject, message });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground mt-1">Find answers and get help with the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Book className="h-6 w-6" />, title: 'Documentation', desc: 'Browse the user guide', color: 'text-secondary' },
          { icon: <MessageSquare className="h-6 w-6" />, title: 'Contact Support', desc: 'Get help from our team', color: 'text-info' },
          { icon: <ExternalLink className="h-6 w-6" />, title: 'Video Tutorials', desc: 'Watch how-to videos', color: 'text-accent' },
        ].map((item) => (
          <div key={item.title} className="stat-card cursor-pointer hover:border-secondary/50 transition-colors text-center py-6">
            <div className={`mx-auto mb-3 ${item.color}`}>{item.icon}</div>
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="relative group rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-3 border-b border-border last:border-0">
              <p className="text-sm font-medium text-foreground">{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative group rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-lg overflow-hidden space-y-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        <h3 className="font-semibold text-foreground">Submit a Support Ticket</h3>
        
        {success && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Your support ticket has been submitted successfully. Our team will respond via email.
          </div>
        )}
        
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input 
            placeholder="Subject" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <Textarea 
            placeholder="Describe your issue..." 
            className="min-h-[100px]" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HelpSupport;