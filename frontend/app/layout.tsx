import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';

export const metadata = {
  title: 'AWS Route 53 Console',
  description: 'Mocked AWS Route 53 Cloud infrastructure management console clone.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
