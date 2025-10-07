import PocketBase from "pocketbase";
import { Collections } from "../../utils/pocketbase-types";

export const POST = async ({ request, cookies }) => {
  // Créer une nouvelle instance PocketBase pour chaque requête
  const pb = new PocketBase(
    import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090"
  );

  // Récupère les données envoyées dans la requête
  const { username, email, password, passwordConfirm } = await request.json();

  try {
    // Créer un nouvel utilisateur dans PocketBase
    const userData = {
      username: username,
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      emailVisibility: true, // Optionnel : rend l'email visible
    };

    // Créer l'utilisateur
    const user = await pb.collection(Collections.Users).create(userData);

    console.log("✅ Utilisateur créé:", user.id);

    // Authentifier automatiquement l'utilisateur après l'inscription
    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    // Enregistrer le token d'authentification dans un cookie sécurisé
    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expire dans 1 an
    });

    // Retourne les informations de l'utilisateur
    return new Response(JSON.stringify({ user: authData.record }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // En cas d'erreur, retourner un message d'erreur détaillé
    console.error("❌ Erreur lors de l'inscription:", err);

    let errorMessage = "Erreur lors de la création du compte";

    // Gérer les erreurs spécifiques de PocketBase
    if (err.response?.data) {
      const errors = err.response.data;
      if (errors.email) {
        errorMessage = "Cet email est déjà utilisé";
      } else if (errors.username) {
        errorMessage = "Ce nom d'utilisateur est déjà pris";
      } else if (errors.password) {
        errorMessage = "Le mot de passe ne respecte pas les critères requis";
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: err.response?.data || err.message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
