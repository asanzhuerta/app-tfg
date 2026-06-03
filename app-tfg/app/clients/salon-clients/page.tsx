import { requireClientSession } from "@/lib/auth/require-session";
import { listSalonClientsForClientUser } from "@/lib/typeorm/services/salon/salon-client";
import SalonClientsWorkspace from "@/app/components/salon/SalonClientsWorkspace";

export default async function ClientSalonClientsPage() {
	const session = await requireClientSession();
	const salonClients = await listSalonClientsForClientUser(session.user.id);

	return <SalonClientsWorkspace initialSalonClients={salonClients} />;
}
