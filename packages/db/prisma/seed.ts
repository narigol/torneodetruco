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
  console.log(`✓ Super Admin: ${superAdminEmail}`);

  // Organizador demo
  const adminEmail = "admin@tdt.com";
  const adminPwd = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ORGANIZER" },
    create: { email: adminEmail, name: "Organizador Demo", password: adminPwd, role: "ORGANIZER", plan: "PRO" },
  });
  console.log(`✓ Organizador: ${adminEmail} / admin1234`);

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
    // 50 jugadores adicionales
    "Lucas Romero", "Matías Herrera", "Nicolás Castro", "Sebastián Ortiz",
    "Emiliano Vargas", "Rodrigo Medina", "Facundo Suárez", "Leandro Ríos",
    "Maximiliano Guerrero", "Ezequiel Reyes", "Ignacio Blanco", "Tomás Acosta",
    "Agustín Mendoza", "Bruno Delgado", "Gonzalo Ramos", "Iván Navarro",
    "Ramiro Cabrera", "Adrián Molina", "Cristian Peña", "Damián Soria",
    "Esteban Vega", "Federico Peralta", "Gastón Ibáñez", "Héctor Aguirre",
    "Joaquín Ponce", "Kevin Montes", "Leonardo Vera", "Marcelo Ávila",
    "Nahuel Rojas", "Omar Carrillo", "Patricio Lara", "Quintín Barrios",
    "Ricardo Espinoza", "Santiago Fuentes", "Ulises Gómez", "Valentín Pacheco",
    "Walter Alvarado", "Xavier Bustos", "Yamil Cortez", "Zacarías Duarte",
    "Alejandro Ferreira", "Benjamín Galván", "César Hurtado", "Daniel Islas",
    "Eduardo Juárez", "Felipe Leal", "Guillermo Moya", "Hugo Noriega",
    "Israel Ojeda", "Jorge Palma", "Kristian Quiroga", "Luis Rosales",
    "Manuel Salazar", "Norberto Tapia", "Oscar Urbina", "Pedro Villareal",
    // 60 jugadores adicionales
    "Claudio Benitez", "Darío Cáceres", "Ernesto Domínguez", "Fabián Estrada",
    "Gabriel Figueroa", "Horacio Gutiérrez", "Ismael Heredia", "Julio Ibarra",
    "Lautaro Jiménez", "Marco Kramer", "Nicolás Ledesma", "Osvaldo Mansilla",
    "Pablo Núñez", "Raúl Oviedo", "Sergio Prieto", "Tomás Quiroz",
    "Ulises Rincón", "Víctor Sandoval", "Waldo Trujillo", "Axel Uribe",
    "Yamil Valenzuela", "Zenón Wiedemann", "Álvaro Acevedo", "Bautista Bravo",
    "Camilo Cano", "Dario Dávila", "Emilio Echeverría", "Fausto Ferreyra",
    "Gerardo Godoy", "Hernán Hidalgo", "Iván Irrazábal", "Joel Jaimes",
    "Karim Khalil", "Leonardo Lucero", "Mauricio Macedo", "Néstor Nieto",
    "Orlando Ojeda", "Patricio Paredes", "Quico Quintero", "Ramiro Restrepo",
    "Salvador Sosa", "Tito Tamayo", "Ursino Ugarte", "Valentín Velarde",
    "Wilson Waiss", "Xabier Xaubet", "Yonatan Yañez", "Zenón Zárate",
    "Andrés Almonacid", "Bernardo Bustamante", "Carmelo Contreras", "Denis Durán",
    "Eligio Elizondo", "Florencio Funes", "Gregorio Gamboa", "Heriberto Huanca",
    "Ignacio Iribarne", "Jonás Jurado", "Leandro Leguizamón", "Mateo Meléndez",
  ];

  function fakePhone(index: number): string {
    const base = 60000000 + index * 137;
    return `11 ${String(base).slice(0, 4)}-${String(base).slice(4, 8)}`;
  }

  function fakeEmail(name: string, index: number): string {
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
  console.log(`✓ ${jugadores.length} jugadores creados`);

  // Usuarios con localidad (La Plata, Berisso, San Telmo)
  const usuariosConLocalidad = [
    // La Plata
    { name: "Marcos Alderete",     email: "marcos.alderete@gmail.com",   locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-001" },
    { name: "Soledad Mansilla",    email: "sole.mansilla@gmail.com",     locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-002" },
    { name: "Rubén Palavecino",    email: "ruben.palavecino@gmail.com",  locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-003" },
    { name: "Cecilia Bordón",      email: "ceci.bordon@gmail.com",       locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-004" },
    { name: "Norberto Salas",      email: "norber.salas@gmail.com",      locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-005" },
    { name: "Analía Pereyra",      email: "analia.pereyra@gmail.com",    locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-006" },
    { name: "Claudio Echeverría",  email: "claudio.echev@gmail.com",     locality: "La Plata",  provincia: "Buenos Aires", phone: "221 4100-007" },
    // Berisso
    { name: "Dante Cáceres",       email: "dante.caceres@gmail.com",     locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-001" },
    { name: "Patricia Ledesma",    email: "pati.ledesma@gmail.com",      locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-002" },
    { name: "Oscar Maidana",       email: "oscar.maidana@gmail.com",     locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-003" },
    { name: "Roxana Ferreyra",     email: "roxi.ferreyra@gmail.com",     locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-004" },
    { name: "Héctor Zavaleta",     email: "hector.zavaleta@gmail.com",   locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-005" },
    { name: "Miriam Ojeda",        email: "miriam.ojeda@gmail.com",      locality: "Berisso",   provincia: "Buenos Aires", phone: "221 4200-006" },
    // San Telmo
    { name: "Federico Quiroga",    email: "fede.quiroga@gmail.com",      locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-001" },
    { name: "Valentina Rojas",     email: "vale.rojas@gmail.com",        locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-002" },
    { name: "Ramón Giménez",       email: "ramon.gimenez@gmail.com",     locality: "San Telmo", provincia: "Buenos Aires", phone: "11 5100-003" },
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
  console.log(`✓ ${usuariosConLocalidad.length} usuarios con localidad creados (La Plata, Berisso, San Telmo)`);

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
