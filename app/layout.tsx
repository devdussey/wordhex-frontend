
import '../styles/globals.css';

export const metadata = {
  title: 'WordHex',
  description: 'Multiplayer Neon Word Game'
};

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
