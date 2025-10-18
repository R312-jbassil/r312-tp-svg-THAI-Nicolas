import PocketBase from "pocketbase";

export const GET = async ({ cookies }) => {
  try {
    const pb = new PocketBase(
      import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090"
    );

    // Récupérer l'authentification depuis le cookie
    const authCookie = cookies.get("pb_auth")?.value;
    if (!authCookie) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    pb.authStore.loadFromCookie(authCookie);
    if (!pb.authStore.isValid) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = pb.authStore.record?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer tous les tags de l'utilisateur
    const tags = await pb.collection("tags").getFullList({
      filter: `user = "${userId}"`,
      sort: "name",
    });

    return new Response(
      JSON.stringify({
        success: true,
        tags: tags,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tags listing error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to list tags",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
