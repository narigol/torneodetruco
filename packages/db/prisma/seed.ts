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

  const jugadores = await Promise.all(
    nombres.map((name) => prisma.player.create({ data: { name } }))
  );
  console.log(`✓ ${jugadores.length} jugadores creados`);

  // Usuarios con localidad (La Plata, Berisso, San Telmo)
  const usuariosConLocalidad = [
    // La Plata
    { name: "Marcos Alderete",     email: "marcos.alderete@gmail.com",   locality: "La Plata",  province: "Buenos Aires" },
    { name: "Soledad Mansilla",    email: "sole.mansilla@gmail.com",     locality: "La Plata",  province: "Buenos Aires" },
    { name: "Rubén Palavecino",    email: "ruben.palavecino@gmail.com",  locality: "La Plata",  province: "Buenos Aires" },
    { name: "Cecilia Bordón",      email: "ceci.bordon@gmail.com",       locality: "La Plata",  province: "Buenos Aires" },
    { name: "Norberto Salas",      email: "norber.salas@gmail.com",      locality: "La Plata",  province: "Buenos Aires" },
    { name: "Analía Pereyra",      email: "analia.pereyra@gmail.com",    locality: "La Plata",  province: "Buenos Aires" },
    { name: "Claudio Echeverría",  email: "claudio.echev@gmail.com",     locality: "La Plata",  province: "Buenos Aires" },
    // Berisso
    { name: "Dante Cáceres",       email: "dante.caceres@gmail.com",     locality: "Berisso",   province: "Buenos Aires" },
    { name: "Patricia Ledesma",    email: "pati.ledesma@gmail.com",      locality: "Berisso",   province: "Buenos Aires" },
    { name: "Oscar Maidana",       email: "oscar.maidana@gmail.com",     locality: "Berisso",   province: "Buenos Aires" },
    { name: "Roxana Ferreyra",     email: "roxi.ferreyra@gmail.com",     locality: "Berisso",   province: "Buenos Aires" },
    { name: "Héctor Zavaleta",     email: "hector.zavaleta@gmail.com",   locality: "Berisso",   province: "Buenos Aires" },
    { name: "Miriam Ojeda",        email: "miriam.ojeda@gmail.com",      locality: "Berisso",   province: "Buenos Aires" },
    // San Telmo
    { name: "Federico Quiroga",    email: "fede.quiroga@gmail.com",      locality: "San Telmo", province: "Buenos Aires" },
    { name: "Valentina Rojas",     email: "vale.rojas@gmail.com",        locality: "San Telmo", province: "Buenos Aires" },
    { name: "Ramón Giménez",       email: "ramon.gimenez@gmail.com",     locality: "San Telmo", province: "Buenos Aires" },
    { name: "Lorena Bustamante",   email: "lore.bustamante@gmail.com",   locality: "San Telmo", province: "Buenos Aires" },
    { name: "Ismael Taborda",      email: "ismael.taborda@gmail.com",    locality: "San Telmo", province: "Buenos Aires" },
    { name: "Graciela Montes",     email: "graciela.montes@gmail.com",   locality: "San Telmo", province: "Buenos Aires" },
  ];

  const pwdDefault = await bcrypt.hash("jugador123", 10);
  await Promise.all(
    usuariosConLocalidad.map(({ name, email, locality, province }) =>
      prisma.user.upsert({
        where: { email },
        update: { locality, province },
        create: {
          name,
          email,
          password: pwdDefault,
          role: "PLAYER",
          locality,
          province,
          country: "Argentina",
          player: { create: { name, locality, provincia: province } },
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
