import React, { useState } from 'react';
import { HelpCircle, MessageCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const Help: React.FC = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            question: "How does the scraping work?",
            answer: "We use a combination of direct API integrations (like Reddit) and our custom Make.com workflow to fetch the latest content. The system runs periodically or when you manually trigger a scrape."
        },
        {
            question: "Is my data private?",
            answer: "Yes, all your saved items are stored securely in your private Supabase database table, linked only to your user ID."
        },
        {
            question: "Can I add more sources?",
            answer: "Currently, source configuration is managed by the system administrators. We plan to add a 'Custom Sources' feature in the next release."
        },
        {
            question: "How do I generate better hooks?",
            answer: "The AI hook generator uses the content of the item. To get better results, ensure the scraped content has enough context. You can regenrate hooks multiple times to get different variations."
        }
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                    <HelpCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">How can we help?</h1>
                <p className="text-slate-500">Find answers to common questions or get in touch with our team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <a href="#" className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Documentation</h3>
                    <p className="text-sm text-slate-500">Read the detailed guides on how to use all features.</p>
                </a>
                <a href="#" className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <MessageCircle size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Chat Support</h3>
                    <p className="text-sm text-slate-500">Talk to our support team for personalized help.</p>
                </a>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Frequently Asked Questions</h2>
                </div>
                <div>
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-slate-100 last:border-0">
                            <button
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-medium text-slate-700">{faq.question}</span>
                                {openFaq === index ? (
                                    <ChevronUp size={18} className="text-slate-400" />
                                ) : (
                                    <ChevronDown size={18} className="text-slate-400" />
                                )}
                            </button>
                            {openFaq === index && (
                                <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Help;
