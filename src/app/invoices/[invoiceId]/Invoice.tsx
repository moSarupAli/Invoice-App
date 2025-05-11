"use client"

import { useOptimistic } from 'react';
import { cn } from '@/lib/utils';
import Container from '@/components/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, CreditCard, Ellipsis, Trash2 } from 'lucide-react';

import { AVAILABLE_STATUSES } from '@/data/invoices';
import { updateStatusAction, deleteInvoiceActions } from '@/app/actions';
import Link from 'next/link';

import { Customers, Invoices } from '@/db/schema';

interface InvoiceProps {
  invoice: typeof Invoices.$inferSelect & {
    customer: typeof Customers.$inferSelect
  }
}

export default function Invoice({ invoice }: InvoiceProps) {
  const [currentStatus, setCurrentStatus] = useOptimistic(invoice.status, (status, newStatus) => {
    return String(newStatus);
  });

  async function handleOnUpdateStatus(formData: FormData) {
    const originalStatus = currentStatus;
    setCurrentStatus(formData.get('status'));
    try {
      // await new Promise((resolve) => {
      //   setTimeout(() => {
      //     resolve(undefined);
      //   }, 2000)
      // });
      // throw new Error(`I'm making this fail!`);
      await updateStatusAction(formData);
    } catch(e) {
      setCurrentStatus(originalStatus);
    }
  }

  return (
    <main className="h-full w-full">
      <Container>
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-semibold flex items-center gap-4">
            Invoice { invoice.id }
            <Badge className={cn( 
              "rounded-full",
              "px-2",
              "py-1",
              currentStatus === 'open' &&  "bg-blue-500", 
              currentStatus === 'paid' &&  "bg-green-600", 
              currentStatus === 'void' &&  "bg-zinc-700", 
              currentStatus === 'uncollectible' &&  "bg-red-600", 
            )}>
              { currentStatus }
            </Badge>
          </h1>

          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className='flex items-center gap-2' variant="outline">
                  Change Status
                  <ChevronDown className='w-4 h-auto' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {AVAILABLE_STATUSES.map((status) => {
                  return (
                    <DropdownMenuItem key={status.id}>
                      <form action={handleOnUpdateStatus}>
                        <input type="hidden" name='id' value={invoice.id} />
                        <input type="hidden" name='status' value={status.id} />
                        <button type='submit'>
                          { status.label }
                        </button>
                      </form>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className='flex items-center gap-2' 
                    variant="outline"
                  >
                    <span className='sr-only'>More Options</span>
                    <Ellipsis className='w-4 h-auto' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <DialogTrigger asChild>
                      <button className='flex gap-2'>
                        <Trash2 className='w-4 h-auto' />
                        Delete Invoice
                      </button>
                    </DialogTrigger>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                      <Link href={`/invoices/${invoice.id}/payment`} className='flex gap-2'>
                        <CreditCard className='w-4 h-auto' />
                        Make Payment
                      </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DialogContent className='text-center'>
                <DialogHeader className='gap-2 text-center'>
                  <DialogTitle className='text-2xl text-center'>
                    Really want to delete this invoice?
                  </DialogTitle>
                  <DialogDescription className='text-center'>
                    This action cannot be undone. This will permanently delete your invoice
                    and remove your data from our servers.
                  </DialogDescription>
                  <DialogFooter className='mt-4'>
                    <form action={deleteInvoiceActions} 
                      className='mx-auto'
                    >
                      <input type="hidden" name='id' value={invoice.id} />
                      <Button variant="destructive" className='flex gap-2'>
                        <Trash2 className='w-4 h-auto' />
                        Delete Invoice
                      </Button>
                    </form>
                  </DialogFooter>
                </DialogHeader>
              </DialogContent>

            </Dialog>
          </div>

        </div>

        <p className="text-3xl mb-3">&#8377; {(invoice.value / 100).toFixed(2)}</p>

          <p className="text-lg mb-8">{invoice.description}</p>

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
            <li className="flex gap-4">
              <strong className="block w-28 flex-shrink-0 font-medium text-sm">
                Billing Email
              </strong>
              <span>{ invoice.customer.email }</span>
            </li>
          </ul>
        </Container>
    </main>
  );
}