import Container from '@/components/Container';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className='mt-12 mb-8'>
      <Container className='flex justify-between gap-4'>
        <p className='text-sm'>
          InvoicePedia &copy; { new Date().getFullYear() }
        </p>
        <p className='text-sm'>
          Created by 
          <Link 
            href="https://sarupalimondal.netlify.app/"
            target='_blank' 
            className='px-1 text-blue-500 font-bold hover:text-green-600' 
            title="sarup's portfolio"
          >
            Sarup Ali Mondal
          </Link>
          with Next.js(React.js), Xata, and Clerk
        </p>
      </Container>
    </footer>
  )
}

export default Footer;