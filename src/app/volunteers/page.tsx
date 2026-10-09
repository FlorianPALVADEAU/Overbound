import { VolunteerApply } from '@/components/volunteers/VolunteerApply'
import { VolunteerDay } from '@/components/volunteers/VolunteerDay'
import { VolunteerFAQSection } from '@/components/volunteers/VolunteerFAQSection'
import { VolunteerHero } from '@/components/volunteers/VolunteerHero'
import { VolunteerPerks } from '@/components/volunteers/VolunteerPerks'
import { StickyApplyBar } from '@/components/volunteers/StickyApplyBar'

export default function VolunteersPage() {
  return (
    <main className="bg-background text-foreground">
      <VolunteerHero />
      <VolunteerPerks />
      <VolunteerDay />
      <VolunteerApply />
      <VolunteerFAQSection />
      <StickyApplyBar />
    </main>
  )
}
