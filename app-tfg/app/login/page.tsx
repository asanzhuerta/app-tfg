// Esta página es la encargada de mostrar el formulario de login, se encarga de manejar el envío del formulario y de mostrar los errores en caso de que los haya
"use client"; // necesario para poder usar el hook useState y la función signIn de next-auth, ya que esta página se renderiza en el cliente y no en el servidor

import { signIn } from "next-auth/react";
import { useState } from "react";
import HeaderTitle from "../components/basics/HeaderTitle";
import { useRouter } from "next/navigation";
import PageTransition from "../components/animations/PageTransition";
import Link from "next/link";
import SafeForm from "../components/forms/SafeForm";
import SubmitButton from "../components/forms/SubmitButton";

// esta función se encarga de manejar el envío del formulario, se encarga de recoger los datos del formulario, enviarlos a la API de autenticación y manejar la respuesta de la API
export default function LoginPage() {
	const [leaving, setLeaving] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const formData = new FormData(e.currentTarget);
			const identifier = String(formData.get("identifier") ?? "").trim();
			const password = String(formData.get("password") ?? "");

			// Validación básica de campos
			const result = await signIn("credentials", {
				identifier,
				password,
				redirect: false,
			});

			// Si hay un error en la autenticación, se muestra un mensaje de error al usuario
			if (result?.error) {
				setError("Correo, teléfono, usuario o contraseña incorrectos");
				setLoading(false);
				return;
			}

			// Si la autenticación es correcta, se redirige al usuario a la página correspondiente según su rol
			const userResult = await fetch("/api/auth/session");
			const userData = await userResult.json();

			setLeaving(true);

			if (userData?.user?.role === "admin") {
				router.push("/admin");
			} else if (userData?.user?.role === "commercial") {
				router.push("/commercials");
			} else {
				router.push("/clients");
			}
		} catch {
			setError("Error al iniciar sesión");
			setLoading(false);
		}
	}

	return (
		<main className="app-bg min-h-[100svh] w-full px-4 py-4 text-slate-800">
			<HeaderTitle
				title="KinEstilistas "
				subtitle="Alta Peluquería &amp; Estética"
			/>

			<PageTransition
				isLeaving={leaving}
				className="mx-auto max-w-2xl rounded-2xl p-6 text-center"
			>
				<div className="mx-auto mt-6 w-full max-w-sm">
					<SafeForm
						onSubmit={handleSubmit}
						className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md"
					>
						<h2 className="mb-2 text-center text-xl font-semibold">
							Iniciar sesión
						</h2>

						<input
							name="identifier"
							type="text"
							placeholder="Correo, teléfono o usuario"
							autoComplete="username"
							required
							className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
						/>

						<input
							name="password"
							type="password"
							placeholder="Contraseña"
							autoComplete="current-password"
							required
							className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
						/>

						<SubmitButton
							isSubmitting={loading}
							submittingText="Entrando..."
							className="mt-2 rounded-lg bg-slate-950 font-medium text-white hover:bg-slate-900"
						>
							Entrar
						</SubmitButton>

						{error && (
							<p className="text-center text-sm text-red-600">{error}</p>
						)}
					</SafeForm>
				</div>

				<div className="mx-auto mt-6 w-full max-w-sm text-center">
					<p className="text-sm text-slate-600">
						¿Nuevo cliente?{" "}
						<Link
							href="/register"
							className="font-semibold text-black hover:underline"
						>
							Solicita aquí tu acceso.
						</Link>
					</p>
				</div>
			</PageTransition>
		</main>
	);
}
