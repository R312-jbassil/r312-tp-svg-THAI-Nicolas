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

    // Récupérer le fichier depuis le FormData
    const formData = await request.formData();
    const avatarFile = formData.get("avatar");

    if (!avatarFile || !(avatarFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No avatar file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Préparer les données pour PocketBase
    const updateData = new FormData();
    updateData.append("avatar", avatarFile);

    // Mettre à jour l'avatar dans PocketBase
    const updatedUser = await pb.collection("users").update(userId, updateData);

    // Mettre à jour le cookie avec les nouvelles données
    const newAuthCookie = pb.authStore.exportToCookie();
    cookies.set("pb_auth", newAuthCookie, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Avatar updated successfully",
        user: updatedUser 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Avatar upload error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to upload avatar",
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
