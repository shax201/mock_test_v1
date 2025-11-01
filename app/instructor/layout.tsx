'use client'

import PortalLayout from '@/components/shared/PortalLayout'

const navigation = [
  {
    name: 'Dashboard',
    href: '/instructor',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Pending Grading',
    href: '/instructor/pending',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Completed',
    href: '/instructor/completed',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalLayout
      navigation={navigation}
      brandName="IELTS Instructor"
      brandSubtitle="Grading Portal"
      brandColor="green"
      logoutRedirect="/login?type=instructor"
    >
      {children}
    </PortalLayout>
  )
}
