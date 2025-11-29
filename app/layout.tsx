
import '../styles/globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'WordHex',
  description: 'Multiplayer Neon Word Game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
