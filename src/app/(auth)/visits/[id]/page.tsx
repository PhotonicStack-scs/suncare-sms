import { VisitDetail } from "~/components/features/visits";

interface VisitPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VisitPageProps) {
  const { id } = await params;
  return {
    title: `Besøk ${id} | Suncare`,
    description: "Besøksdetaljer",
  };
}

export default async function VisitPage({ params }: VisitPageProps) {
  const { id } = await params;
  
  return <VisitDetail visitId={id} />;
}
