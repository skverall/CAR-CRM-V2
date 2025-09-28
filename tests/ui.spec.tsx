import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Card from '@/app/components/ui/Card'
import TableShell from '@/app/components/ui/TableShell'

describe('UI kit basics', () => {
  it('renders Card with title and children', () => {
    render(<Card title="Hello"><div>content</div></Card>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('renders TableShell and passes children', () => {
    render(
      <TableShell>
        <thead><tr><th>H</th></tr></thead>
        <tbody><tr><td>C</td></tr></tbody>
      </TableShell>
    )
    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})

