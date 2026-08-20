import type { APIRoute } from 'astro';


const database: Array<{ plate: string; timestamp: string; id: number }> = [];

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { plate, timestamp } = data;

    if (!plate) {
      return new Response(
        JSON.stringify({ success: false, message: 'Placa no proporcionada' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newRecord = {
      id: database.length + 1,
      plate: plate.toUpperCase(),
      timestamp: timestamp || new Date().toISOString()
    };

    database.push(newRecord);

    console.log('[DB BACKEND] Guardado con éxito:', newRecord);

    return new Response(
      JSON.stringify({
        success: true,
        record: newRecord,
        totalRecords: database.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno guardando la placa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};