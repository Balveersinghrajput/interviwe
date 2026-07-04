import './globals.css';

export const metadata = {
  title: 'InterviewHub — Master Every Interview',
  description: 'Comprehensive interview preparation platform with AI-powered file analysis across all programming languages',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
