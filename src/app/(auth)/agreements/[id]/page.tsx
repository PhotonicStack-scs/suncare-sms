import { AgreementDetail } from "~/components/features/agreements/AgreementDetail";

interface AgreementPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgreementPageProps) {
  const { id } = await params;
  return {
    title: `Avtale ${id} | Suncare`,
    description: "Avtaledetaljer",
  };
}

export default async function AgreementPage({ params }: AgreementPageProps) {
  const { id } = await params;
  
  return <AgreementDetail agreementId={id} />;
}
