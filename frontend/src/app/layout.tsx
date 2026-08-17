import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalentFlow | Autonomous HR Recruitment System',
  description: 'Autonomous AI HR system powered by LangChain and Google Gemini API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
