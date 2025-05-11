
import { db } from '@/db';
import { Customers, Invoices } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import { auth } from '@clerk/nextjs/server';

import { CirclePlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Container from '@/components/Container';
import Link from "next/link";
import { cn } from '@/lib/utils';


export default async function Home() {
  const { userId, orgId } = await auth();
  if( !userId ) return;

  let results;

  if( orgId ) {
    results = await db.select()
      .from(Invoices)
      .innerJoin(Customers, eq(Invoices.customerId, Customers.id))
      .where(eq(Invoices.organizationId, orgId))
    ;
  } else {
    results = await db.select()
      .from(Invoices)
      .innerJoin(Customers, eq(Invoices.customerId, Customers.id))
      .where(
        and(
          eq(Invoices.userId, userId),
          isNull(Invoices.organizationId)
        )
      )
    ;
  }

  const invoices = results?.map(({ invoices, customers }) => {
    return {
      ...invoices,
      customer: customers
    }
  })

  return (
    <main className="h-full">
      <Container>
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-semibold">
            Invoices
          </h1>

          <p>
            <Button variant="ghost" className="inline-flex gap-2 cursor-pointer" asChild>
              <Link href="/invoices/new">
                <CirclePlus className="h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </p>
        </div>

        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] p-4">
                Date
              </TableHead>
              <TableHead className="p-4">
                Customer
              </TableHead>
              <TableHead className="p-4">
                Email
              </TableHead>
              <TableHead className="p-4">
                Status
              </TableHead>
              <TableHead className="text-right p-4">
                Value
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((result) => {
              return (
                <TableRow key={result.id}>
                  <TableCell className="p-0 font-medium text-left">
                    <Link href={`/invoices/${result.id}`} className="block p-4 font-semibold">
                      { new Date(result.createTs).toLocaleDateString() }
                    </Link>
                  </TableCell>
                  <TableCell className="p-0 text-left">
                    <Link href={`/invoices/${result.id}`} className="block p-4 font-semibold">{result.customer.name}</Link>
                  </TableCell>
                  <TableCell className="p-0 text-left">
                    <Link href={`/invoices/${result.id}`} className="block p-4">{result.customer.email}</Link>
                  </TableCell>
                  <TableCell className="p-0 text-left">
                    <Link href={`/invoices/${result.id}`} className="block p-4 font-semibold">
                      <Badge className={cn( 
                        "rounded-full",
                        "px-2",
                        "py-1",
                        result.status === 'open' &&  "bg-blue-500", 
                        result.status === 'paid' &&  "bg-green-500", 
                        result.status === 'void' &&  "bg-zinc-500", 
                        result.status === 'uncollectible' &&  "bg-red-500", 
                      )}>
                        {result.status}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="p-0 text-right">
                    <Link href={`/invoices/${result.id}`} className="block p-4 font-semibold">
                      &#8377; { (result.value / 100).toFixed(2) }
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Container>

    </main>
  );
}