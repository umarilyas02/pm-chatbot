import { Fira_Code, Fira_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'CreateX — AI Project Management',
  description: 'AI-powered project management and team collaboration workspace.',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${firaCode.variable} ${firaSans.variable} dark h-full antialiased`}
    >
      <body className="h-full">
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  )
}
