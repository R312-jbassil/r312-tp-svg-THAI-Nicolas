import PocketBase from "pocketbase";

export const POST = async ({ request, cookies }) => {
  try {
    const pb = new PocketBase(
      import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090"
    );

    // Récupérer l'authentification depuis le cookie
    const authCookie = cookies.get("pb_auth")?.value;
    if (!authCookie) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    pb.authStore.loadFromCookie(authCookie);
    if (!pb.authStore.isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = pb.authStore.record?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer les données
    const data = await request.json();
    const { svgId, tags } = data;

    if (!svgId) {
      return new Response(
        JSON.stringify({ error: "SVG ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le SVG appartient à l'utilisateur
    const svg = await pb.collection("svgs").getOne(svgId);
    if (svg.user !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: This SVG does not belong to you" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mettre à jour les tags
    const updatedSvg = await pb.collection("svgs").update(svgId, {
      tags: tags || "",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tags updated successfully",
        svg: updatedSvg 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tags update error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update tags",
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
