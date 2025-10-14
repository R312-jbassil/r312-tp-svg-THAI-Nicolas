export const POST = async ({ request, cookies }) => {
  try {
    const { theme } = await request.json();

    // Liste des thèmes valides
    const validThemes = ["light", "dark", "cyberpunk", "dracula"];

    if (!validThemes.includes(theme)) {
      return new Response(JSON.stringify({ error: "Thème invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sauvegarder le thème dans un cookie
    cookies.set("theme", theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 an
      sameSite: "lax",
    });

    return new Response(JSON.stringify({ success: true, theme }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du thème:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
