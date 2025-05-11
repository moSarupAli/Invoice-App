"use client"

import NextError from 'next/error';

export default function Error({ error }: { error: Error }) {
  return (
    // <p>Error: {error.message}</p>
    <NextError statusCode={500} title={error.message} />
  )
}