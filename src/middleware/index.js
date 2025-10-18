import PocketBase from "pocketbase";

const pb = new PocketBase(
  import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090"
);

export const onRequest = async (context, next) => {
  // IMPORTANT : Nettoyer l'authStore au début de chaque requête pour éviter les conflits
  pb.authStore.clear();

  // Vérifie la présence du cookie d'authentification
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie); // Charge les infos d'auth depuis le cookie
    if (pb.authStore.isValid) {
      // Si le token est valide, ajoute les données utilisateur dans Astro.locals
      context.locals.user = pb.authStore.record;
    }
  }

  // Pour les routes API, on exige l'authentification sauf pour /api/login, /api/signup et /api/setTheme
  if (context.url.pathname.startsWith("/api/")) {
    const publicApiRoutes = [
      "/api/login",
      "/api/signup",
      "/api/setTheme",
      "/api/generateSVG",
    ];
    if (
      !context.locals.user &&
      !publicApiRoutes.includes(context.url.pathname)
    ) {
      // Si l'utilisateur n'est pas connecté, on retourne une erreur 401 (non autorisé)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    return next(); // Continue le traitement normal
  }

  // ... middleware pour l'i18n
  // Si la requête est un POST (soumission du formulaire de langue) :
  if (context.request.method === "POST") {
    // Lire les données du formulaire
    const form = await context.request.formData().catch(() => null);
    const lang = form?.get("language"); // Récupérer la langue choisie

    // Vérifier que la langue est bien 'en' ou 'fr'
    if (lang === "en" || lang === "fr") {
      // Enregistrer la préférence dans un cookie nommé 'locale'
      // - path: '/' → cookie disponible sur tout le site
      // - maxAge: 1 an
      context.cookies.set("locale", String(lang), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });

      // Rediriger avec un code 303 (See Other) vers la même page en GET
      // Cela évite que le formulaire soit renvoyé si l'utilisateur recharge la page
      return Response.redirect(
        new URL(context.url.pathname + context.url.search, context.url),
        303
      );
    }
  }

  // Déterminer la langue pour cette requête
  const cookieLocale = context.cookies.get("locale")?.value; // Lire la langue depuis le cookie

  // Choisir la langue finale :
  // - Si cookie valide → utiliser la valeur du cookie
  // - Sinon → essayer d'utiliser la langue préférée du navigateur
  // - Si rien n'est défini → utiliser 'en' par défaut
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  // Continuer le traitement normal (afficher la page demandée)
  return next();
};
