const SYSTEM_PROMPT = `Eres NEXUS, un asistente personal claro, respetuoso y útil. Responde en español salvo que el usuario pida otro idioma. Ayuda a organizar tareas, explicar conceptos y pensar soluciones. No afirmes haber realizado acciones fuera de esta aplicación. Si no sabes algo, dilo con claridad.`;

export default async (request) => {
  // Endpoint de comprobación: permite confirmar que Netlify desplegó la función.
  if (request.method === "GET") {
    return Response.json({ status: "ok", message: "La función de chat de NEXUS está publicada." });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Método no permitido." }, { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "La función está publicada, pero todavía falta configurar OPENAI_API_KEY en las variables de entorno de Netlify. No agregues la clave al código." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 5000) {
      return Response.json({ error: "El mensaje debe tener entre 1 y 5000 caracteres." }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const input = [
      ...history
        .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
        .map(item => ({ role: item.role, content: item.content.slice(0, 5000) })),
      { role: "user", content: message }
    ];

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-luna",
        instructions: SYSTEM_PROMPT,
        input,
        max_output_tokens: 700
      }),
      signal: AbortSignal.timeout(25000)
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("OpenAI API error:", data?.error?.message || apiResponse.status);
      return Response.json({ error: "El servicio de IA rechazó la solicitud. Una persona adulta responsable debe revisar la clave, el acceso al modelo y la configuración de la cuenta." }, { status: 502 });
    }

    const reply = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n")
      .trim();

    return Response.json({ reply: reply || "No pude generar una respuesta esta vez." });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return Response.json({ error: "El servicio de IA tardó demasiado en responder. Inténtalo nuevamente más tarde." }, { status: 504 });
    }
    console.error("NEXUS function error:", error);
    return Response.json({ error: "Ocurrió un error al procesar el mensaje." }, { status: 500 });
  }
};
