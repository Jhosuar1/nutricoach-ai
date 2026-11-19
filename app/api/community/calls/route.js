import { answerCall, endCall, iceServers, incomingCall, readCall, startCall } from "@/lib/community/calls";
import { communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const params = new URL(request.url).searchParams;
  if (params.has("config")) return json({ iceServers: iceServers(uid) });
  const id = params.get("id");
  if (!id) return json({ incoming: (await incomingCall(uid))[0] ?? null });
  if (!uuid(id)) return error("Llamada inválida.");
  const [call] = await readCall(uid, id);
  if (!call) return error("Llamada no disponible.", 404);
  return json({ call: call.closed ? { id: call.id, closed: true } : call });
});

function validDescription(value, type) {
  return value?.type === type && typeof value.sdp === "string" && value.sdp.startsWith("v=0") && value.sdp.length < 32000;
}

export const POST = communityRoute(async (request, uid) => {
  const input = (await request.json()) || {};
  if (input.action === "start" && uuid(input.other) && input.other.toLowerCase() !== uid && validDescription(input.description, "offer")) {
    const [call] = await startCall(uid, input.other, { type: "offer", sdp: input.description.sdp });
    return call ? json({ call }, { status: 201 }) : error("Tu amistad o la línea no están disponibles.", 409);
  }
  if (!uuid(input.id)) return error("Llamada inválida.");
  if (input.action === "answer" && validDescription(input.description, "answer")) {
    const [call] = await answerCall(uid, input.id, { type: "answer", sdp: input.description.sdp });
    return call ? json({ call }) : error("La llamada ya no está disponible.", 409);
  }
  if (input.action === "end") {
    await endCall(uid, input.id);
    return json({ ok: true });
  }
  return error("Acción de llamada inválida.");
});
