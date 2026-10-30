import { Container, Section, SectionHeader } from '@/components/ds'
import { FaqAccordionItem } from '@/components/faq/FaqAccordionItem'
import { Button } from '@/components/ui/button'
import type { EnterpriseFaq as EnterpriseFaqItem } from '@/lib/b2b/enterpriseContent'

/** Same layout as the homepage FAQ: title and action on one row, questions in two columns. */
export function EnterpriseFaq({ items }: { items: EnterpriseFaqItem[] }) {
  return (
    <Section className="border-t border-border">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader flush title="Les questions des RH et des CSE" />
          <Button asChild variant="outline" size="cta" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto">
            <a href="#devis">Demander un devis</a>
          </Button>
        </div>
        <div className="grid w-full grid-cols-1 items-start gap-6 md:grid-cols-2">
          {items.map(({ question, answer }) => (
            <FaqAccordionItem key={question} title={question}>
              <p>{answer}</p>
            </FaqAccordionItem>
          ))}
        </div>
      </Container>
    </Section>
  )
}
