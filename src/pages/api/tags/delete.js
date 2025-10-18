import PocketBase from "pocketbase";

export const POST = async ({ request, cookies }) => {
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

    // Récupérer les données
    const data = await request.json();
    const { tagId } = data;

    if (!tagId) {
      return new Response(JSON.stringify({ error: "Tag ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier que le tag appartient à l'utilisateur
    const tag = await pb.collection("tags").getOne(tagId);
    if (tag.user !== userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: This tag does not belong to you",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le tag
    await pb.collection("tags").delete(tagId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tag deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tag deletion error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete tag",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
