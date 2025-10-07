export const POST = async ({ cookies }) => {
  // Supprimer le cookie d'authentification
  cookies.delete("pb_auth", { path: "/" });

  // Rediriger vers la page de login
  return new Response(null, {
    status: 303,
    headers: { Location: "/login" },
  });
};
