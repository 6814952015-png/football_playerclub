export const demoPlayers = [
  { _id: "68a100000000000000000001", name: "Kylian Mbappé", shortName: "MBAPPÉ", nationality: "France", club: "Real Madrid", position: "FWD", overallRating: 94, imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=85", stats: { pace: 97, shooting: 93, passing: 86, dribbling: 94 } },
  { _id: "68a100000000000000000002", name: "Erling Haaland", shortName: "HAALAND", nationality: "Norway", club: "Manchester City", position: "FWD", overallRating: 92, imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=300&q=85", stats: { pace: 89, shooting: 96, passing: 71, dribbling: 82 } },
  { _id: "68a100000000000000000003", name: "Vinícius Júnior", shortName: "VINÍCIUS", nationality: "Brazil", club: "Real Madrid", position: "FWD", overallRating: 91, imageUrl: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=300&q=85", stats: { pace: 95, shooting: 88, passing: 83, dribbling: 94 } },
  { _id: "68a100000000000000000004", name: "Jude Bellingham", shortName: "BELLINGHAM", nationality: "England", club: "Real Madrid", position: "MID", overallRating: 90, imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=300&q=85", stats: { pace: 82, shooting: 87, passing: 88, dribbling: 89 } },
  { _id: "68a100000000000000000005", name: "Rodri", shortName: "RODRI", nationality: "Spain", club: "Manchester City", position: "MID", overallRating: 91, imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=300&q=85", stats: { pace: 68, shooting: 80, passing: 91, dribbling: 84 } },
  { _id: "68a100000000000000000006", name: "William Saliba", shortName: "SALIBA", nationality: "France", club: "Arsenal", position: "DEF", overallRating: 88, imageUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=300&q=85", stats: { pace: 82, shooting: 52, passing: 75, dribbling: 76 } },
  { _id: "68a100000000000000000007", name: "Thibaut Courtois", shortName: "COURTOIS", nationality: "Belgium", club: "Real Madrid", position: "GK", overallRating: 89, imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=300&q=85", stats: { pace: 43, shooting: 20, passing: 33, dribbling: 13 } },
];

// Real player portraits for the featured Collection; name matching also covers API records.
export const realPlayerImages = {
  mbappe: "https://m.media-amazon.com/images/I/91fYBJk4pEL._AC_SL1500_.jpg",
  haaland: "https://i.ebayimg.com/images/g/AEkAAOSw9KFm0mtu/s-l1200.webp",
  vinicius: "https://i.ebayimg.com/images/g/bssAAeSwu3NpbS0S/s-l1600.jpg",
  bellingham: "https://www.worldtradingcards.com/cdn/shop/files/WTC_PNN_ADN_FWC_26_MM1.webp?v=1776695905",
  rodri: "https://i.ebayimg.com/images/g/UisAAeSwhF9pTDgf/s-l1200.webp",
  saliba: "https://i.ebayimg.com/images/g/BY0AAeSwb6tpq76q/s-l1200.webp",
  courtois: "https://cdn.starwebserver.se/shops/coolcard/files/tc23-269.jpg",
};

export function getPlayerPortrait(player) {
  const identity = `${player.shortName || ""} ${player.name || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const key = identity.includes("mbapp") ? "mbappe"
    : identity.includes("haaland") ? "haaland"
      : identity.includes("vinicius") ? "vinicius"
        : identity.includes("bellingham") ? "bellingham"
          : identity.includes("rodri") ? "rodri"
            : identity.includes("saliba") ? "saliba"
              : identity.includes("courtois") ? "courtois" : null;
  return key ? realPlayerImages[key] : player.imageUrl;
}
