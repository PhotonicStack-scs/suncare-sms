import { InstallationDetail } from "~/components/features/installations";

interface InstallationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InstallationPageProps) {
  const { id } = await params;
  return {
    title: `Anlegg ${id} | Suncare`,
    description: "Anleggsdetaljer",
  };
}

export default async function InstallationPage({ params }: InstallationPageProps) {
  const { id } = await params;
  
  return <InstallationDetail installationId={id} />;
}
