import pb from "../../utils/pb.js";
import { Collections } from "../../utils/pocketbase-types.js";

export async function POST({ request }) {
  const data = await request.json();
  console.log("Received data to update:", data);

  try {
    const { id, ...updateData } = data;

    if (!id) {
      throw new Error("ID is required for update");
    }

    const record = await pb.collection(Collections.Svg).update(id, updateData);
    console.log("SVG updated with ID:", record.id);

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating SVG:", error);
    console.error("Error details:", error.response || error);

    // Retourner plus d'informations sur l'erreur
    const errorMessage = error.response
      ? JSON.stringify(error.response.data)
      : error.message;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.response?.data || error.toString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}
