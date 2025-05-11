import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Container from '@/components/Container';
import { cn } from '@/lib/utils';
import { Check, CreditCard } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createPayment, updateStatusAction } from '@/app/actions';
import { db } from '@/db';
import { Customers, Invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { after } from 'next/server';

import Stripe from 'stripe';
const stripe = new Stripe(String(process.env.STRIPE_API_SECRET));

interface InvoicePageProps {
  params: { invoiceId: string };
  searchParams: { 
    status: string; 
    session_id: string;
  };
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  
    const invoiceId = Number.parseInt((await params).invoiceId);
    
    const sessionId = (await searchParams).session_id;
    console.log("sessionId:", sessionId);

    const isSuccess = sessionId && ((await searchParams).status === "success");
    const isCanceled = (await searchParams).status === "canceled";
    let isError = ( isSuccess && !sessionId );

    console.log('isSuccess', isSuccess);
    console.log('isCanceled', isCanceled);

    if( isNaN(invoiceId) ) {
      throw new Error("Invalid Invoice ID");
    }

    if( isSuccess ) {
      const { payment_status } = await stripe.checkout.sessions.retrieve(sessionId);

      if( payment_status !== 'paid' ) {
        isError = true;
      } else {
        const formData = new FormData();
        formData.append('id', String(invoiceId));
        formData.append('status', 'paid');
  
        after(async () => {
          await updateStatusAction(formData);
        })
      }

    }
  
    const [ result ] = await db.select({
      id: Invoices.id,
      status: Invoices.status,
      createTs: Invoices.createTs,
      description: Invoices.description,
      value: Invoices.value,
      name: Customers.name,
    })
      .from(Invoices)
      .innerJoin(Customers, eq(Invoices.customerId, Customers.id))
      .where(
        eq(Invoices.id, invoiceId)
      )
      .limit(1)
    ;
  
    if( !result ) {
      notFound();
    }
  
    const invoice = {
      ...result,
      customer: {
        name: result.name
      }
    }

  return (
    <main className="h-full w-full">
      {isError && (
        <p className='text-sm bg-red-100 text-red-800 text-center px-3 py-2 rounded-lg mb-6'>
          Something went wrong, please try again!
        </p>
      )}
      {isCanceled && (
        <p className='text-sm bg-yellow-100 text-yellow-800 text-center px-3 py-2 rounded-lg mb-6'>
          Payment was canceled, please try again!
        </p>
      )}
      <Container>
        <div className='grid grid-cols-2'>
          <div>
            <div className="flex justify-between mb-6">
              <h1 className="text-3xl font-semibold flex items-center gap-4">
                Invoice { invoice.id }
                <Badge className={cn( 
                  "rounded-full",
                  "px-2",
                  "py-1",
                  invoice.status === 'open' &&  "bg-blue-500", 
                  invoice.status === 'paid' &&  "bg-green-600", 
                  invoice.status === 'void' &&  "bg-zinc-700", 
                  invoice.status === 'uncollectible' &&  "bg-red-600", 
                )}>
                  { invoice.status }
                </Badge>
              </h1>
            </div>

            <p className="text-3xl mb-3">₹{(invoice.value / 100).toFixed(2)}</p>
            <p className="text-lg mb-8">{invoice.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Mange Invoice</h2>
            {invoice.status === 'open' && 
              (<form action={createPayment}>
                <input type="hidden" name='id' value={invoice.id} />
                <Button className='flex gap-2 font-bold bg-green-700'>
                  <CreditCard className='w-5 h-auto' />
                  Pay Invoice
                </Button>
              </form>)
            }
            {invoice.status === 'paid' && 
              (<p className='font-bold text-xl flex gap-2 items-center'>
                <Check className='w-8 h-auto bg-green-500 rounded-full text-white p-1' />
                Invoice Paid
              </p>)
            }
          </div>
        </div>

        <h2 className="font-bold text-lg mb-4">Billing Details</h2>

        <ul className="grid gap-2">
          <li className="flex gap-4">
            <strong className="block w-28 flex-shrink-0 font-medium text-sm">
              Invoice ID
            </strong>
            <span>{invoice.id}</span>
          </li>
          <li className="flex gap-4">
            <strong className="block w-28 flex-shrink-0 font-medium text-sm">
              Invoice Date
            </strong>
            <span>{ new Date(invoice.createTs).toLocaleDateString() }</span>
          </li>
          <li className="flex gap-4">
            <strong className="block w-28 flex-shrink-0 font-medium text-sm">
              Billing Name
            </strong>
            <span>{ invoice.customer.name }</span>
          </li>
        </ul>
      </Container>
    </main>
  );
}