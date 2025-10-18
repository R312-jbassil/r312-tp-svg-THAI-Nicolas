import PocketBase from "pocketbase";

export async function GET({ request, cookies }) {
  try {
    const pb = new PocketBase(
      import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090"
    );

    // Vérifier l'authentification
    const authCookie = cookies.get("pb_auth")?.value;
    if (!authCookie) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Charger l'authentification depuis le cookie
    pb.authStore.loadFromCookie(authCookie);
    if (!pb.authStore.isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = pb.authStore.record?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer l'ID du SVG depuis l'URL
    const url = new URL(request.url);
    const svgId = url.searchParams.get("svgId");

    if (!svgId) {
      return new Response(
        JSON.stringify({ success: false, error: "SVG ID required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le SVG avec ses tags
    const svg = await pb.collection("svgs").getOne(svgId, {
      expand: "tags",
    });

    // Vérifier que le SVG appartient à l'utilisateur
    if (svg.user !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extraire les IDs des tags
    const tagIds = svg.expand?.tags ? svg.expand.tags.map((tag) => tag.id) : [];

    return new Response(
      JSON.stringify({
        success: true,
        tagIds: tagIds,
        tags: svg.expand?.tags || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching SVG tags:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error fetching tags",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
