export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const {
      discordId,
      discordUsername,
      statusDuty,
      menitDutyHarian,
      menitDutyMingguan,
      menitDutyBulanan,
      totalMenitDuty,
    } = body;

    if (!discordId || !statusDuty) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Parameter discordId dan statusDuty wajib dikirimkan oleh Bot Discord.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Log duty Discord berhasil diterima oleh Portal Paramedic Kota Baru.',
        data: {
          discordId,
          discordUsername: discordUsername || '',
          statusDuty,
          menitDutyHarian: Number(menitDutyHarian) || 0,
          menitDutyMingguan: Number(menitDutyMingguan) || 0,
          menitDutyBulanan: Number(menitDutyBulanan) || 0,
          totalMenitDuty: Number(totalMenitDuty) || 0,
          syncedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Format payload JSON tidak valid.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}