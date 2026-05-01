import { prisma } from "@tdt/db";
import { renderBasicEmail, sendEmail } from "@/lib/email";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
}

async function sendBulkEmails(recipients: Array<{ email: string; name: string }>, subject: string, introBuilder: (name: string) => string, ctaUrl: string, ctaLabel: string) {
  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient.email,
        subject,
        html: renderBasicEmail(subject, introBuilder(recipient.name), ctaLabel, ctaUrl),
        text: `${subject}. ${ctaUrl}`,
      }).catch((error) => {
        console.error("[email-notification]", error);
      })
    )
  );
}

export async function sendTournamentStartedEmails(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      teams: {
        select: {
          teamPlayers: {
            select: {
              player: {
                select: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                      acceptsEmailNotifications: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) return;

  const recipients = tournament.teams
    .flatMap((team) => team.teamPlayers)
    .map((teamPlayer) => teamPlayer.player.user)
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
    .filter((user) => user.acceptsEmailNotifications);

  const unique = dedupeRecipients(recipients);
  await sendBulkEmails(
    unique,
    `El torneo ${tournament.name} ya comenzo`,
    (name) => `Hola ${name}, el torneo ${tournament.name} ya entro en juego. Entra a TdT para seguir la llave y los resultados.`,
    `${getAppUrl()}/torneos/${tournament.id}`,
    "Ver torneo"
  );
}

export async function sendMatchScheduledEmails(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      scheduledAt: true,
      location: true,
      tournament: { select: { id: true, name: true } },
      homeTeam: {
        select: {
          name: true,
          teamPlayers: {
            select: {
              player: {
                select: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                      acceptsEmailNotifications: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      awayTeam: {
        select: {
          name: true,
          teamPlayers: {
            select: {
              player: {
                select: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                      acceptsEmailNotifications: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!match || !match.scheduledAt) return;

  const recipients = [
    ...match.homeTeam.teamPlayers.map((teamPlayer) => teamPlayer.player.user),
    ...(match.awayTeam?.teamPlayers.map((teamPlayer) => teamPlayer.player.user) ?? []),
  ]
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
    .filter((user) => user.acceptsEmailNotifications);

  const unique = dedupeRecipients(recipients);
  const when = new Date(match.scheduledAt).toLocaleString("es-AR");
  await sendBulkEmails(
    unique,
    `Partido programado en ${match.tournament.name}`,
    (name) => `Hola ${name}, tu partido ${match.homeTeam.name} vs ${match.awayTeam?.name ?? "rival a definir"} fue programado para ${when}${match.location ? ` en ${match.location}` : ""}.`,
    `${getAppUrl()}/torneos/${match.tournament.id}`,
    "Ver partido"
  );
}

export async function sendMatchResultEmails(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      tournament: { select: { id: true, name: true } },
      homeTeam: {
        select: {
          name: true,
          teamPlayers: {
            select: {
              player: {
                select: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                      acceptsEmailNotifications: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      awayTeam: {
        select: {
          name: true,
          teamPlayers: {
            select: {
              player: {
                select: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                      acceptsEmailNotifications: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!match) return;

  const recipients = [
    ...match.homeTeam.teamPlayers.map((teamPlayer) => teamPlayer.player.user),
    ...(match.awayTeam?.teamPlayers.map((teamPlayer) => teamPlayer.player.user) ?? []),
  ]
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
    .filter((user) => user.acceptsEmailNotifications);

  const unique = dedupeRecipients(recipients);
  await sendBulkEmails(
    unique,
    `Resultado cargado en ${match.tournament.name}`,
    (name) => `Hola ${name}, ya se cargo el resultado de ${match.homeTeam.name} vs ${match.awayTeam?.name ?? "rival"}: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}.`,
    `${getAppUrl()}/torneos/${match.tournament.id}`,
    "Ver resultado"
  );
}

function dedupeRecipients(recipients: Array<{ email: string; name: string }>) {
  const map = new Map<string, { email: string; name: string }>();
  for (const recipient of recipients) {
    map.set(recipient.email.toLowerCase(), recipient);
  }
  return [...map.values()];
}
