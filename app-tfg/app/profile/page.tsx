import { redirect } from "next/navigation";
import PageTransition from "@/app/components/animations/PageTransition";
import HeaderTitle from "@/app/components/basics/HeaderTitle";
import RoleSidebar from "@/app/components/navigation/RoleSidebar";
import type { RoleSidebarRole } from "@/app/components/navigation/role-sidebar-items";
import UserProfileCard from "@/app/components/users/UserProfileCard";
import { requireUserSession } from "@/lib/auth/require-session";
import { getUserById } from "@/lib/typeorm/services/users/user";

export default async function ProfilePage() {
	const session = await requireUserSession();
	const user = await getUserById(session.user.id);

	if (!user) {
		redirect("/");
	}

	const role = user.role.code as RoleSidebarRole;

	return (
		<main className="app-bg min-h-[100svh] w-full text-slate-800">
			<div className="bg-overlay fixed inset-0 -z-10" />
			<div className="lg:flex lg:min-h-[100svh]">
				<RoleSidebar
					role={role}
					userName={user.name ?? session.user.name}
					userEmail={user.email ?? session.user.email}
					userImageUrl={user.profile_image_url ?? session.user.image}
				/>

				<div className="min-w-0 flex-1 px-4 pt-20 pb-8 md:pb-10 lg:pt-4">
					<div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col">
						<HeaderTitle
							title="KinEstilistas"
							subtitle="Alta Peluqueria &amp; Estetica"
						/>

						<PageTransition>
							<section className="mx-auto mt-4 w-full max-w-4xl">
								<div className="glass-card overflow-hidden rounded-[28px] border border-white/30 p-4 shadow-xl sm:p-6">
									<div className="mb-5">
										<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
											Mi perfil
										</h1>
										<p className="mt-1 text-sm text-slate-600 sm:text-base">
											Consulta y edita tu informacion personal.
										</p>
									</div>

									<UserProfileCard
										mode="edit"
										submitUrl="/api/profile"
										allowPasswordChange
										user={{
											id: user.id,
											name: user.name,
											email: user.email,
											company: user.company,
											phone: user.phone,
											profile_image_url: user.profile_image_url,
											created_at: user.created_at,
											last_login_at: user.last_login_at,
											role: {
												code: user.role.code as
													| "admin"
													| "client"
													| "commercial",
											},
											status: {
												code: user.status.code as
													| "active"
													| "inactive"
													| "blocked",
											},
										}}
										clientProfile={
											user.linkedClient
												? {
														id: user.linkedClient.id,
														name: user.linkedClient.name,
														contact_name: user.linkedClient.contact_name,
														tax_id: user.linkedClient.tax_id,
														address: user.linkedClient.address,
														city: user.linkedClient.city,
														postal_code: user.linkedClient.postal_code,
														province: user.linkedClient.province,
														lat: user.linkedClient.lat,
														lng: user.linkedClient.lng,
														visit_window_start_time:
															user.linkedClient.visit_window_start_time,
														visit_window_end_time:
															user.linkedClient.visit_window_end_time,
														notes: user.linkedClient.notes,
													}
												: null
										}
									/>
								</div>
							</section>
						</PageTransition>
					</div>
				</div>
			</div>
		</main>
	);
}
