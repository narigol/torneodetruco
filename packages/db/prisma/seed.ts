import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Super admin (Ezequiel Berterretche)
  const superAdminEmail = "ezebedlp@gmail.com";
  const superAdminPwd = await bcrypt.hash("admin1234", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { role: "ADMIN", plan: "PRO" },
    create: { email: superAdminEmail, name: "Ezequiel Berterretche", password: superAdminPwd, role: "ADMIN", plan: "PRO" },
  });
  console.log(`âœ“ Super Admin: ${superAdminEmail}`);

  // Organizador demo
  const adminEmail = "admin@tdt.com";
  const adminPwd = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ORGANIZER" },
    create: { email: adminEmail, name: "Organizador Demo", password: adminPwd, role: "ORGANIZER", plan: "PRO" },
  });
  console.log(`âœ“ Organizador: ${adminEmail} / admin1234`);

  // Jugador demo
  const playerEmail = "jugador@tdt.com";
  const playerPwd = await bcrypt.hash("jugador123", 10);
  await prisma.user.upsert({
    where: { email: playerEmail },
    update: {},
    create: { email: playerEmail, name: "Jugador Demo", password: playerPwd, role: "PLAYER" },
  });
  console.log(`âœ“ Jugador: ${playerEmail} / jugador123`);

  // Jugadores
  const nombres = [
    "Juan PÃ©rez", "Carlos GarcÃ­a", "Miguel LÃ³pez", "Roberto MartÃ­nez",
    "Diego SÃ¡nchez", "Gustavo RodrÃ­guez", "Pablo GonzÃ¡lez", "HernÃ¡n DÃ­az",
    "Fernando Torres", "MartÃ­n Flores", "Ariel Moreno", "Javier Ruiz",
    // 50 jugadores adicionales
    "Lucas Romero", "MatÃ­as Herrera", "NicolÃ¡s Castro", "SebastiÃ¡n Ortiz",
    "Emiliano Vargas", "Rodrigo Medina", "Facundo SuÃ¡rez", "Leandro RÃ­os",
    "Maximiliano Guerrero", "Ezequiel Reyes", "Ignacio Blanco", "TomÃ¡s Acosta",
    "AgustÃ­n Mendoza", "Bruno Delgado", "Gonzalo Ramos", "IvÃ¡n Navarro",
    "Ramiro Cabrera", "AdriÃ¡n Molina", "Cristian PeÃ±a", "DamiÃ¡n Soria",
    "Esteban Vega", "Federico Peralta", "GastÃ³n IbÃ¡Ã±ez", "HÃ©ctor Aguirre",
    "JoaquÃ­n Ponce", "Kevin Montes", "Leonardo Vera", "Marcelo Ãvila",
    "Nahuel Rojas", "Omar Carrillo", "Patricio Lara", "QuintÃ­n Barrios",
    "Ricardo Espinoza", "Santiago Fuentes", "Ulises GÃ³mez", "ValentÃ­n Pacheco",
    "Walter Alvarado", "Xavier Bustos", "Yamil Cortez", "ZacarÃ­as Duarte",
    "Alejandro Ferreira", "BenjamÃ­n GalvÃ¡n", "CÃ©sar Hurtado", "Daniel Islas",
    "Eduardo JuÃ¡rez", "Felipe Leal", "Guillermo Moya", "Hugo Noriega",
    "Israel Ojeda", "Jorge Palma", "Kristian Quiroga", "Luis Rosales",
    "Manuel Salazar", "Norberto Tapia", "Oscar Urbina", "Pedro Villareal",
    // 60 jugadores adicionales
    "Claudio Benitez", "DarÃ­o CÃ¡ceres", "Ernesto DomÃ­nguez", "FabiÃ¡n Estrada",
    "Gabriel Figueroa", "Horacio GutiÃ©rrez", "Ismael Heredia", "Julio Ibarra",
    "Lautaro JimÃ©nez", "Marco Kramer", "NicolÃ¡s Ledesma", "Osvaldo Mansilla",
    "Pablo NÃºÃ±ez", "RaÃºl Oviedo", "Sergio Prieto", "TomÃ¡s Quiroz",
    "Ulises RincÃ³n", "VÃ­ctor Sandoval", "Waldo Trujillo", "Axel Uribe",
    "Yamil Valenzuela", "ZenÃ³n Wiedemann", "Ãlvaro Acevedo", "Bautista Bravo",
    "Camilo Cano", "Dario DÃ¡vila", "Emilio EcheverrÃ­a", "Fausto Ferreyra",
    "Gerardo Godoy", "HernÃ¡n Hidalgo", "IvÃ¡n IrrazÃ¡bal", "Joel Jaimes",
    "Karim Khalil", "Leonardo Lucero", "Mauricio Macedo", "NÃ©stor Nieto",
    "Orlando Ojeda", "Patricio Paredes", "Quico Quintero", "Ramiro Restrepo",
    "Salvador Sosa", "Tito Tamayo", "Ursino Ugarte", "ValentÃ­n Velarde",
    "Wilson Waiss", "Xabier Xaubet", "Yonatan YaÃ±ez", "ZenÃ³n ZÃ¡rate",
    "AndrÃ©s Almonacid", "Bernardo Bustamante", "Carmelo Contreras", "Denis DurÃ¡n",
    "Eligio Elizondo", "Florencio Funes", "Gregorio Gamboa", "Heriberto Huanca",
    "Ignacio Iribarne", "JonÃ¡s Jurado", "Leandro LeguizamÃ³n", "Mateo MelÃ©ndez",
  ];

  function fakePhone(index: number): string {
    const base = 60000000 + index * 137;
    return `11 ${String(base).slice(0, 4)}-${String(base).slice(4, 8)}`;
  }

  function fakeEmail(name: string, index: number): string {
    const slug = name.normalize("NFD").replace(/[Ì€-Í¯]/g, "")
      .toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
    return `${slug}${index}@mail.com`;
  }

  const jugadores = await Promise.all(
    nombres.map((name, i) =>
      prisma.player.create({
        data: { name, phone: fakePhone(i), email: fakeEmail(name, i) },
      })
    )
  );
  console.log(`âœ“ ${jugadores.length} jugadores creados`);

  // Usuarios con localidad (La Plata, Berisso, San Telmo)
  const usuariosConLocalidad = [
    // La Plata
    { name: "Marcos Alderete",     email: "marcos.alderete@gmail.com",   locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-001" },
    { name: "Soledad Mansilla",    email: "sole.mansilla@gmail.com",     locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-002" },
    { name: "RubÃ©n Palavecino",    email: "ruben.palavecino@gmail.com",  locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-003" },
    { name: "Cecilia BordÃ³n",      email: "ceci.bordon@gmail.com",       locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-004" },
    { name: "Norberto Salas",      email: "norber.salas@gmail.com",      locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-005" },
    { name: "AnalÃ­a Pereyra",      email: "analia.pereyra@gmail.com",    locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-006" },
    { name: "Claudio EcheverrÃ­a",  email: "claudio.echev@gmail.com",     locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-007" },
    // Berisso
    { name: "Dante CÃ¡ceres",       email: "dante.caceres@gmail.com",     locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-001" },
    { name: "Patricia Ledesma",    email: "pati.ledesma@gmail.com",      locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-002" },
    { name: "Oscar Maidana",       email: "oscar.maidana@gmail.com",     locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-003" },
    { name: "Roxana Ferreyra",     email: "roxi.ferreyra@gmail.com",     locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-004" },
    { name: "HÃ©ctor Zavaleta",     email: "hector.zavaleta@gmail.com",   locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-005" },
    { name: "Miriam Ojeda",        email: "miriam.ojeda@gmail.com",      locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-006" },
    // San Telmo
    { name: "Federico Quiroga",    email: "fede.quiroga@gmail.com",      locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-001" },
    { name: "Valentina Rojas",     email: "vale.rojas@gmail.com",        locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-002" },
    { name: "RamÃ³n GimÃ©nez",       email: "ramon.gimenez@gmail.com",     locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-003" },
    { name: "Lorena Bustamante",   email: "lore.bustamante@gmail.com",   locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-004" },
    { name: "Ismael Taborda",      email: "ismael.taborda@gmail.com",    locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-005" },
    { name: "Graciela Montes",     email: "graciela.montes@gmail.com",   locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-006" },
  ];

  const pwdDefault = await bcrypt.hash("jugador123", 10);
  await Promise.all(
    usuariosConLocalidad.map(({ name, email, locality, provincia, phone }) =>
      prisma.user.upsert({
        where: { email },
        update: { locality, provincia, phone },
        create: {
          name,
          email,
          password: pwdDefault,
          role: "PLAYER",
          locality,
          provincia,
          phone,
          country: "Argentina",
          player: { create: { name, locality, provincia: provincia, phone, email } },
        },
      })
    )
  );
  console.log(`âœ“ ${usuariosConLocalidad.length} usuarios con localidad creados (La Plata, Berisso, San Telmo)`);

  // Torneo de ejemplo en inscripciÃ³n
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
      { name: "La Flor MÃ¡xima", players: [jugadores[4], jugadores[5]] },
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

    console.log(`âœ“ Torneo "${torneo.name}" con ${equipos.length} equipos creado`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
