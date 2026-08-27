'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Comments, useProphecy } from '@prophecy-dev/connect-react'

export function TailgateComments({
  marketId,
  emptyState,
}: {
  marketId: string
  emptyState: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <Comments
        subjectType="event"
        subjectRef={marketId}
        emptyState={emptyState}
      />
    )
  }
  return <TailgateCommentsInner marketId={marketId} emptyState={emptyState} />
}

function TailgateCommentsInner({
  marketId,
  emptyState,
}: {
  marketId: string
  emptyState: ReactNode
}) {
  const { authenticated, login } = usePrivy()
  const { session, owner } = useProphecy()

  return (
    <Comments
      className="tailgate-comments"
      subjectType="event"
      subjectRef={marketId}
      viewer={owner ?? session?.wallet ?? null}
      emptyState={emptyState}
      signedOut={
        authenticated ? undefined : (
          <div className="tailgate-comments-gate">
            <p>Grab a chair first. Anything you already typed stays when you come back.</p>
            <button type="button" onClick={() => login()}>
              Sign in to post
            </button>
          </div>
        )
      }
      strings={{
        composerPlaceholder: 'Why this call?',
        post: 'Post',
        signInToPost: 'Sign in to post.',
        postSignedOut: 'Sign in to post — your draft is still here.',
      }}
    />
  )
}
