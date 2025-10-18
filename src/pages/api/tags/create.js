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
    const { name, color } = data;

    if (!name || name.trim() === "") {
      return new Response(JSON.stringify({ error: "Tag name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier si le tag existe déjà pour cet utilisateur
    const existingTags = await pb.collection("tags").getFullList({
      filter: `user = "${userId}" && name = "${name.trim()}"`,
    });

    if (existingTags.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Tag already exists",
          tag: existingTags[0],
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Créer le tag
    const newTag = await pb.collection("tags").create({
      name: name.trim(),
      user: userId,
      color: color || "#3B82F6", // Bleu par défaut
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tag created successfully",
        tag: newTag,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tag creation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create tag",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
