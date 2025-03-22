import { Team } from "../types";
import { v4 as uuidv4 } from 'uuid';

// Data tim untuk inisialisasi
const realTeams: Omit<Team, "id">[] = [
  // Grup A
  {
    name: "REMAJA PUTRA A",
    groupId: "A",
    logo: "/images/teams/logos/remajaputra.png",
    players: []
  },
  {
    name: "PALAPA A",
    groupId: "A",
    logo: "/images/teams/logos/palapa.png",
    players: []
  },
  {
    name: "TOCXNET A",
    groupId: "A",
    logo: "/images/teams/logos/tocxnet.png",
    players: []
  },
  {
    name: "PERU B",
    groupId: "A",
    logo: "/images/teams/logos/peru.png",
    players: []
  },
  {
    name: "LEMKA B",
    groupId: "A",
    logo: "/images/teams/logos/lemka.png",
    players: []
  },
  {
    name: "PORBA JAYA A",
    groupId: "A",
    logo: "/images/teams/logos/porba.png",
    players: []
  },
  
  // Grup B
  {
    name: "DL GUNS A",
    groupId: "B",
    logo: "/images/teams/logos/dlguns.png",
    players: []
  },
  {
    name: "TOCXNET B",
    groupId: "B",
    logo: "/images/teams/logos/tocxnet.png",
    players: []
  },
  {
    name: "PORBA JAYA B",
    groupId: "B",
    logo: "/images/teams/logos/porba.png",
    players: []
  },
  {
    name: "PUTRA MANDIRI B",
    groupId: "B",
    logo: "/images/teams/logos/putramandiri.png",
    players: []
  },
  {
    name: "REMAJA PUTRA B",
    groupId: "B",
    logo: "/images/teams/logos/remajaputra.png",
    players: []
  },
  {
    name: "ARUMBA B",
    groupId: "B",
    logo: "/images/teams/logos/arumba.png",
    players: []
  },
  
  // Grup C
  {
    name: "GANESA A",
    groupId: "C",
    logo: "/images/teams/logos/ganesa.png",
    players: []
  },
  {
    name: "REMAJA PUTRA C",
    groupId: "C",
    logo: "/images/teams/logos/remajaputra.png",
    players: []
  },
  {
    name: "PERU C",
    groupId: "C",
    logo: "/images/teams/logos/peru.png",
    players: []
  },
  {
    name: "PERKID",
    groupId: "C",
    logo: "/images/teams/logos/perkid.png",
    players: []
  },
  {
    name: "PUTRA MANDIRI A",
    groupId: "C",
    logo: "/images/teams/logos/putramandiri.png",
    players: []
  },
  {
    name: "DL GUNS B",
    groupId: "C",
    logo: "/images/teams/logos/dlguns.png",
    players: []
  },
  
  // Grup D
  {
    name: "LEMKA A",
    groupId: "D",
    logo: "/images/teams/logos/lemka.png",
    players: []
  },
  {
    name: "BALPAS",
    groupId: "D",
    logo: "/images/teams/logos/ballpas.png",
    players: []
  },
  {
    name: "ARUMBA A",
    groupId: "D",
    logo: "/images/teams/logos/arumba.png",
    players: []
  },
  {
    name: "GANESA B",
    groupId: "D",
    logo: "/images/teams/logos/ganesa.png",
    players: []
  },
  {
    name: "PERU A",
    groupId: "D",
    logo: "/images/teams/logos/peru.png",
    players: []
  },
  {
    name: "PELANA",
    groupId: "D",
    logo: "/images/teams/logos/pelana.png",
    players: []
  }
];

/**
 * Fungsi untuk menginisialisasi data tim
 * @param saveTeamFunction Fungsi untuk menyimpan tim ke Firestore
 * @returns Array tim yang berhasil disimpan
 */
export const initializeTeams = async (saveTeamFunction: Function): Promise<Team[]> => {
  try {
    // Buat tim dengan ID unik
    const teamsWithIds = realTeams.map(team => {
      const teamId = uuidv4();
      return {
        ...team,
        id: teamId,
        players: [] // Tim baru dimulai tanpa pemain
      };
    });
    
    // Simpan tim ke Firestore
    for (const team of teamsWithIds) {
      await saveTeamFunction(team);
    }
    
    return teamsWithIds;
  } catch (error) {
    console.error("Error menginisialisasi data tim:", error);
    throw new Error("Gagal menginisialisasi data tim");
  }
}; 