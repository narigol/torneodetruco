import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminEmail = "admin@tdt.com";
  const adminPwd = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Admin", password: adminPwd, role: "ADMIN" },
  });
  console.log(`✓ Admin: ${adminEmail} / admin1234`);

  // Jugador demo
  const playerEmail = "jugador@tdt.com";
  const playerPwd = await bcrypt.hash("jugador123", 10);
  await prisma.user.upsert({
    where: { email: playerEmail },
    update: {},
    create: { email: playerEmail, name: "Jugador Demo", password: playerPwd, role: "PLAYER" },
  });
  console.log(`✓ Jugador: ${playerEmail} / jugador123`);

  // Jugadores
  const nombres = [
    "Juan Pérez", "Carlos García", "Miguel López", "Roberto Martínez",
    "Diego Sánchez", "Gustavo Rodríguez", "Pablo González", "Hernán Díaz",
    "Fernando Torres", "Martín Flores", "Ariel Moreno", "Javier Ruiz",
  ];

  const jugadores = await Promise.all(
    nombres.map((name) => prisma.player.create({ data: { name } }))
  );
  console.log(`✓ ${jugadores.length} jugadores creados`);

  // Torneo de ejemplo en inscripción
  const existingTorneo = await prisma.tournament.findFirst({
    where: { name: "Copa Truco 2026" },
  });

  if (!existingTorneo) {
    const torneo = await prisma.tournament.create({
      data: {
        name: "Copa Truco 2026",
        description: "Torneo anual organizado por el club",
        format: "GROUPS_AND_KNOCKOUT",
        status: "REGISTRATION",
        adminId: admin.id,
      },
    });

    const equipos = [
      { name: "Los Astutos", players: [jugadores[0], jugadores[1]] },
      { name: "El Envido Real", players: [jugadores[2], jugadores[3]] },
      { name: "La Flor Máxima", players: [jugadores[4], jugadores[5]] },
      { name: "Los Tramposos", players: [jugadores[6], jugadores[7]] },
      { name: "As de Espadas", players: [jugadores[8], jugadores[9]] },
      { name: "Rey Falso", players: [jugadores[10], jugadores[11]] },
    ];

    for (const equipo of equipos) {
      await prisma.team.create({
        data: {
          name: equipo.name,
          tournamentId: torneo.id,
          teamPlayers: { create: equipo.players.map((p) => ({ playerId: p.id })) },
        },
      });
    }

    console.log(`✓ Torneo "${torneo.name}" con ${equipos.length} equipos creado`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
